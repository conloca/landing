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

function listAgentWorktrees(root: string): { path: string; branch: string | null }[] {
  const porcelain = git(['worktree', 'list', '--porcelain'], root)
  const entries: { path: string; branch: string | null }[] = []
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
  return entries.filter((e) => e.path.includes('/.claude/worktrees/agent-'))
}

function checkCleanStatus(path: string): GateResult {
  const out = git(['--no-optional-locks', 'status', '--porcelain', '--untracked-files=all'], path)
  return out === ''
    ? { name: 'clean-status', verdict: 'PASS', detail: 'no modified/untracked files' }
    : { name: 'clean-status', verdict: 'FAIL', detail: `dirty:\n${out}` }
}

function checkCleanDryRun(path: string): GateResult {
  const out = gitOrNull(['clean', '-ndX'], path) ?? ''
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

function checkLivenessBestEffort(path: string): GateResult {
  try {
    const out = execFileSync(
      'bash',
      ['-c', `lsof -d cwd -Fn 2>/dev/null | grep -A1 '^p' | grep -F '${path}' || true`],
      {
        encoding: 'utf8',
      },
    ).trim()
    return out === ''
      ? {
          name: 'liveness (best-effort)',
          verdict: 'UNCONFIRMED',
          detail:
            'no process currently has this path as cwd — NOT proof of death, an idle agent between tool calls looks identical; requires separate human/orchestrator attestation',
        }
      : {
          name: 'liveness (best-effort)',
          verdict: 'FAIL',
          detail: `a live process has this path as cwd:\n${out}`,
        }
  } catch {
    return { name: 'liveness (best-effort)', verdict: 'UNCONFIRMED', detail: 'process scan failed' }
  }
}

function auditOne(
  path: string,
  mainPath: string,
): { path: string; branch: string | null; gates: GateResult[]; overall: string } {
  const branch = gitOrNull(['-C', path, 'symbolic-ref', '--short', 'HEAD'])
  const gates = [
    checkLivenessBestEffort(path),
    checkCleanStatus(path),
    checkCleanDryRun(path),
    checkEnvDiff(path, mainPath),
    checkSequencerState(path),
    checkAncestryOrMergedPr(path, branch, mainPath),
  ]
  const overall = gates.some((g) => g.verdict === 'FAIL')
    ? 'FAIL — do not remove'
    : gates.some((g) => g.verdict === 'UNCONFIRMED')
      ? 'UNCONFIRMED — needs human judgement before removal'
      : 'PASS (excluding liveness attestation) — safe to remove pending liveness confirmation'
  return { path, branch, gates, overall }
}

function printReport(r: ReturnType<typeof auditOne>) {
  console.log(`\n=== ${r.path} ===`)
  console.log(`branch: ${r.branch ?? '(detached)'}`)
  for (const g of r.gates) console.log(`  [${g.verdict}] ${g.name}: ${g.detail.split('\n')[0]}`)
  console.log(`  OVERALL: ${r.overall}`)
}

function main() {
  const root = repoRoot()
  const args = process.argv.slice(2)
  const targets =
    args.length > 0
      ? args.map((p) => (p.startsWith('/') ? p : join(root, p)))
      : listAgentWorktrees(root).map((e) => e.path)
  if (targets.length === 0) {
    console.log('No .claude/worktrees/agent-* worktrees found.')
    return
  }
  for (const path of targets) {
    if (basename(path).startsWith('.') || path === root) continue
    printReport(auditOne(path, root))
  }
}

main()
