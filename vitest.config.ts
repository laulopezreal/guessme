import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Tests run in plain Node/jsdom without the Cloudflare plugin. Worker tests
// opt into the node environment with a `@vitest-environment node` comment.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
})
