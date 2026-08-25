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
 */
export default defineConfig(({ isSsrBuild }) => ({
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
