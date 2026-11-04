import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'

// https://vite.dev/config/
// The Cloudflare plugin runs worker/index.ts in the Workers runtime during
// `vite dev`, so /api/* works locally, and bundles it for `wrangler deploy`.
export default defineConfig({
  plugins: [react(), cloudflare()],
})
