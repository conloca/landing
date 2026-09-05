#!/usr/bin/env -S bun run
/**
 * Report-only safety check for one or more `.claude/worktrees/agent-*`
 * directories, implementing the gates from this repo's CLAUDE.md section
 * "Reaping stale agent worktrees" (tracked as issue #93). Prints a verdict
 * per gate and an overall PASS/FAIL/UNCONFIRMED per worktree. Never deletes
 * anything — that decision, and running the actual removal commands, stays
 * a separate step taken by whoever is holding this report.
 *
 * Liveness (is an agent currently working in this worktree?) is NOT decided
 * here: the CLAUDE.md procedure is explicit that this can only be attested
 * by a human, or by an orchestrator's own fresh sweep of every session on
 * the machine — a script has no reliable way to see "idle between tool
 * calls". This tool does a best-effort process scan as one extra signal
 * (a live process pinned to the path is strong evidence of life) but never
 * reports a worktree as confirmed-dead on that basis alone.
 *
 * Usage:
 *   bun run scripts/worktree-audit.ts [worktree-path ...]
 *   (no args: audits every worktree under .claude/worktrees/agent-*)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

type GateResult = { name: string; verdict: 'PASS' | 'FAIL' | 'UNCONFIRMED'; detail: string }

function git(args: string[], cwd?: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

function gitOrNull(args: string[], cwd?: string): string | null {
  try {
    return git(args, cwd)
  } catch {
    return null
  }
}

function repoRoot(): string {
  return git(['rev-parse', '--show-toplevel'])
}

type WorktreeEntry = { path: string; branch: string | null }

/** `git worktree list --porcelain` always lists the main checkout first. */
function listWorktrees(root: string): WorktreeEntry[] {
  const porcelain = git(['worktree', 'list', '--porcelain'], root)
  const entries: WorktreeEntry[] = []
  let path = ''
  let branch: string | null = null
  for (const line of porcelain.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (path) entries.push({ path, branch })
      path = line.slice('worktree '.length)
      branch = null
    } else if (line.startsWith('branch ')) {
      branch = line.slice('branch '.length).replace('refs/heads/', '')
    }
  }
  if (path) entries.push({ path, branch })
  return entries
}

/**
 * Fetches origin/main with an explicit destination refspec, per the
 * documented procedure — a bare `fetch origin main` doesn't guarantee
 * refs/remotes/origin/main updates, which would let ancestry/merged-PR
 * checks pass against a stale ref. Runs from the main checkout, not the
 * caller's cwd, so it always refreshes the ref the rest of the repo reads.
 */
function fetchOriginMain(mainPath: string): boolean {
  try {
    execFileSync('git', ['fetch', 'origin', 'main:refs/remotes/origin/main'], {
      cwd: mainPath,
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}

function checkCleanStatus(path: string): GateResult {
  const out = git(['--no-optional-locks', 'status', '--porcelain', '--untracked-files=all'], path)
  return out === ''
    ? { name: 'clean-status', verdict: 'PASS', detail: 'no modified/untracked files' }
    : { name: 'clean-status', verdict: 'FAIL', detail: `dirty:\n${out}` }
}

function checkCleanDryRun(path: string): GateResult {
  let out: string
  try {
    out = git(['clean', '-ndX'], path)
  } catch {
    return {
      name: 'clean-ndX',
      verdict: 'UNCONFIRMED',
      detail:
        'git clean errored — worktree unreadable, cannot confirm no unexplained ignored content',
    }
  }
  if (out === '') return { name: 'clean-ndX', verdict: 'PASS', detail: 'no ignored content' }
  const ALLOW = /node_modules\/|dist\/|dist-ssr\/|\.env$/
  const lines = out.split('\n').filter(Boolean)
  const unexpected = lines.filter((l) => !ALLOW.test(l))
  return unexpected.length === 0
    ? { name: 'clean-ndX', verdict: 'PASS', detail: `only expected ignored content:\n${out}` }
    : {
        name: 'clean-ndX',
        verdict: 'UNCONFIRMED',
        detail: `unexplained ignored content, review before deleting:\n${out}`,
      }
}

function checkEnvDiff(worktreePath: string, mainPath: string): GateResult {
  const wtEnv = join(worktreePath, '.env')
  const mainEnv = join(mainPath, '.env')
  if (!existsSync(wtEnv)) return { name: 'env-diff', verdict: 'PASS', detail: 'absent' }
  if (!existsSync(mainEnv))
    return {
      name: 'env-diff',
      verdict: 'UNCONFIRMED',
      detail: '.env exists in worktree but not main — cannot compare',
    }
  const same = readFileSync(wtEnv).equals(readFileSync(mainEnv))
  return same
    ? { name: 'env-diff', verdict: 'PASS', detail: 'identical to main' }
    : {
        name: 'env-diff',
        verdict: 'FAIL',
        detail: 'DIFFERS from main .env — do not delete, escalate',
      }
}

function checkSequencerState(path: string): GateResult {
  const gitDir = gitOrNull(['rev-parse', '--git-dir'], path)
  if (!gitDir)
    return { name: 'sequencer', verdict: 'UNCONFIRMED', detail: 'could not resolve git-dir' }
  const markers = ['rebase-merge', 'rebase-apply', 'MERGE_HEAD', 'CHERRY_PICK_HEAD', 'BISECT_LOG']
  const found = markers.filter((m) => existsSync(join(gitDir, m)))
  return found.length === 0
    ? { name: 'sequencer', verdict: 'PASS', detail: 'no paused rebase/bisect/merge/cherry-pick' }
    : {
        name: 'sequencer',
        verdict: 'FAIL',
        detail: `in progress: ${found.join(', ')} — never remove`,
      }
}

/** merge-base --is-ancestor communicates via exit code, not stdout — needs its own runner. */
function isAncestorOfMain(path: string): 'yes' | 'no' | 'error' {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', 'HEAD', 'refs/remotes/origin/main'], {
      cwd: path,
      stdio: 'ignore',
    })
    return 'yes'
  } catch (e: unknown) {
    const status = (e as { status?: number }).status
    if (status === 1) return 'no'
    return 'error'
  }
}

function checkAncestryOrMergedPr(
  path: string,
  branch: string | null,
  mainPath: string,
): GateResult {
  const result = isAncestorOfMain(path)
  if (result === 'yes')
    return {
      name: 'ancestry-or-merged',
      verdict: 'PASS',
      detail: 'HEAD is an ancestor of origin/main',
    }
  if (result === 'error')
    return {
      name: 'ancestry-or-merged',
      verdict: 'UNCONFIRMED',
      detail: 'merge-base check errored (worktree/ref unreadable)',
    }
  if (!branch)
    return {
      name: 'ancestry-or-merged',
      verdict: 'UNCONFIRMED',
      detail: 'not an ancestor and HEAD is detached — no branch to check for a merged PR',
    }
  return checkMergedPr(branch, path, mainPath)
}

type PrInfo = {
  state: string
  headRefOid: string
  baseRefName: string
  mergeCommit: { oid: string } | null
}

function fetchPrInfo(branch: string, mainPath: string): PrInfo | null {
  try {
    const raw = execFileSync(
      'gh',
      ['pr', 'view', '--json', 'state,headRefOid,baseRefName,mergeCommit', '--', branch],
      { encoding: 'utf8', cwd: mainPath },
    )
    return JSON.parse(raw) as PrInfo
  } catch {
    return null
  }
}

function isCommitReachableFromMain(oid: string, mainPath: string): boolean {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', oid, 'refs/remotes/origin/main'], {
      cwd: mainPath,
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}

function checkMergedPr(branch: string, path: string, mainPath: string): GateResult {
  const name = 'ancestry-or-merged'
  const pr = fetchPrInfo(branch, mainPath)
  if (!pr)
    return {
      name,
      verdict: 'FAIL',
      detail: `not an ancestor of main and no PR found for ${branch}`,
    }
  if (pr.state !== 'MERGED')
    return { name, verdict: 'FAIL', detail: `not an ancestor of main and PR state is ${pr.state}` }
  if (pr.baseRefName !== 'main')
    return { name, verdict: 'FAIL', detail: `PR merged but base was ${pr.baseRefName}, not main` }
  if (pr.headRefOid !== git(['rev-parse', 'HEAD'], path))
    return {
      name,
      verdict: 'FAIL',
      detail: 'worktree HEAD has commits added after the PR merged — not fully landed',
    }
  if (!pr.mergeCommit)
    return {
      name,
      verdict: 'UNCONFIRMED',
      detail: 'PR reports MERGED but no mergeCommit oid returned',
    }
  return isCommitReachableFromMain(pr.mergeCommit.oid, mainPath)
    ? { name, verdict: 'PASS', detail: `PR for ${branch} merged into main and reachable` }
    : {
        name,
        verdict: 'FAIL',
        detail: `merge commit for ${branch} not currently reachable from origin/main (main may have moved)`,
      }
}

/**
 * `lsof -d cwd -Fn` lists, per process, a `p<pid>`/`n<name>`/`f<fd>` group —
 * no shell involved, so a path containing shell metacharacters can't inject
 * anything. Matched by exact line equality or a `/`-bounded prefix (`n` +
 * path, or `n` + path + `/`), so `agent-1` can't false-positive on a live
 * `agent-12`, but a process chdir'd into a subdirectory (a build, a test
 * runner) still counts as live — an exact-only match would report that
 * worktree as safe to remove while it's genuinely in use.
 */
function checkLivenessBestEffort(path: string): GateResult {
  let out: string
  try {
    out = execFileSync('lsof', ['-d', 'cwd', '-Fn'], { encoding: 'utf8' })
  } catch {
    return { name: 'liveness (best-effort)', verdict: 'UNCONFIRMED', detail: 'process scan failed' }
  }
  const isLive = out.split('\n').some((line) => line === `n${path}` || line.startsWith(`n${path}/`))
  return isLive
    ? {
        name: 'liveness (best-effort)',
        verdict: 'FAIL',
        detail: 'a live process has this path as cwd',
      }
    : {
        name: 'liveness (best-effort)',
        verdict: 'UNCONFIRMED',
        detail:
          'no process currently has this path as cwd — NOT proof of death, an idle agent between tool calls looks identical; requires separate human/orchestrator attestation',
      }
}

type AuditResult = { path: string; branch: string | null; gates: GateResult[]; overall: string }

function auditOne(path: string, mainPath: string): AuditResult {
  const branch = gitOrNull(['-C', path, 'symbolic-ref', '--short', 'HEAD'])
  const liveness = checkLivenessBestEffort(path)
  const mechanicalGates = [
    checkCleanStatus(path),
    checkCleanDryRun(path),
    checkEnvDiff(path, mainPath),
    checkSequencerState(path),
    checkAncestryOrMergedPr(path, branch, mainPath),
  ]
  const gates = [liveness, ...mechanicalGates]
  // Liveness can only ever return FAIL or UNCONFIRMED — it never proves a
  // worktree is dead (see checkLivenessBestEffort). Its UNCONFIRMED must
  // therefore stay out of the tally below, or the PASS branch is dead code
  // and every otherwise-clean worktree reports UNCONFIRMED forever. Its
  // FAIL still counts: a live process is real evidence, not just absence.
  const overall = gates.some((g) => g.verdict === 'FAIL')
    ? 'FAIL — do not remove'
    : mechanicalGates.some((g) => g.verdict === 'UNCONFIRMED')
      ? 'UNCONFIRMED — needs human judgement before removal'
      : 'PASS (excluding liveness attestation) — safe to remove pending liveness confirmation'
  return { path, branch, gates, overall }
}

function printReport(r: AuditResult) {
  console.log(`\n=== ${r.path} ===`)
  console.log(`branch: ${r.branch ?? '(detached)'}`)
  for (const g of r.gates) console.log(`  [${g.verdict}] ${g.name}: ${g.detail.split('\n')[0]}`)
  console.log(`  OVERALL: ${r.overall}`)
}

/** A worktree whose directory is gone or unreadable must not kill the sweep for every worktree after it. */
function auditOneSafely(path: string, mainPath: string): AuditResult {
  try {
    return auditOne(path, mainPath)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return {
      path,
      branch: null,
      gates: [{ name: 'audit', verdict: 'UNCONFIRMED', detail: `worktree unreadable: ${message}` }],
      overall: 'UNCONFIRMED — needs human judgement before removal',
    }
  }
}

function resolveTargets(root: string, mainPath: string, args: string[]): string[] {
  if (args.length > 0) return args.map((p) => (p.startsWith('/') ? p : join(root, p)))
  return listWorktrees(mainPath)
    .filter((e) => e.path.includes('/.claude/worktrees/agent-'))
    .map((e) => e.path)
}

function main() {
  const root = repoRoot()
  const mainPath = listWorktrees(root)[0]?.path ?? root
  if (!fetchOriginMain(mainPath)) {
    console.error(
      'git fetch origin main:refs/remotes/origin/main failed — every ancestry/merged-PR ' +
        'verdict below would read a possibly stale ref. Fix network/auth and retry; not ' +
        'auditing against a stale origin/main.',
    )
    process.exit(1)
  }
  const targets = resolveTargets(root, mainPath, process.argv.slice(2))
  if (targets.length === 0) {
    console.log('No .claude/worktrees/agent-* worktrees found.')
    return
  }
  for (const path of targets) {
    // Never evaluate the worktree this audit is itself running from — it is
    // guaranteed to look reapable (clean, HEAD at origin/main) the instant
    // it's freshly dispatched and about to start real work.
    if (basename(path).startsWith('.') || path === root) continue
    printReport(auditOneSafely(path, mainPath))
  }
}

main()
