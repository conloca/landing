import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Two builds share this config:
 *   `vite build`                            -> dist/     (client bundle + index.html template)
 *   `vite build --ssr src/entry-server.tsx` -> dist-ssr/ (consumed by scripts/prerender.ts)
 *
 * The SSR entry is passed on the command line rather than via `build.ssr`
 * because rolldown-vite resolves the html input before reading that option and
 * rejects the build with "rollupOptions.input should not be an html file".
 *
 * outDir switches on `isSsrBuild` so the SSR pass cannot clobber the client
 * manifest that the prerender step reads back.
 *
 * `@vitejs/plugin-react` is the oxc-powered plugin here: under rolldown-vite it
 * uses oxc (not Babel) for the React transform and Fast Refresh. The separate
 * `@vitejs/plugin-react-oxc` package is deprecated and folded into this one.
 *
 * `base` reads `BASE_PATH` rather than branching on `GITHUB_ACTIONS`: the latter
 * is set for every workflow run on this repo, not just the Pages deploy, so it
 * would also apply the deploy subpath to CI jobs that build/preview for testing
 * (breaking their asset URLs) and would silently drift if the repo is ever
 * renamed or a custom domain is attached. The deploy workflow is the only place
 * that actually knows the target subpath — it sets `BASE_PATH` from
 * `actions/configure-pages`' own `base_path` output. No env var means `/`,
 * matching local dev/preview.
 *
 * The trailing slash is enforced HERE, not by the caller: `configure-pages`
 * documents `base_path` as `/repo-name` — no trailing slash. Vite's own
 * internal asset URLs (JS/CSS bundle refs) tolerate that fine, but every
 * place in this codebase that manually builds a URL by concatenating
 * `import.meta.env.BASE_URL` with a filename (see LottieBanner.tsx) does
 * not — `/landing` + `dotlottie-player.wasm` silently becomes
 * `/landingdotlottie-player.wasm`, a 404 that Vite's own build never
 * surfaces as an error. Normalizing once here means every downstream
 * `BASE_URL` consumer can assume a trailing slash unconditionally.
 */
const base = `${process.env.BASE_PATH || '/'}`.replace(/\/?$/, '/')

export default defineConfig(({ isSsrBuild }) => ({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: isSsrBuild ? 'dist-ssr' : 'dist',
    emptyOutDir: true,
  },
}))
