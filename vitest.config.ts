import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Tests run in plain Node/jsdom without the Cloudflare plugin. Worker tests
// opt into the node environment with a `@vitest-environment node` comment.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // .claude/worktrees holds Claude Code's git worktrees, each a full checkout.
    // Git skips them through .git/info/exclude, which vitest doesn't read, so
    // without this a run in the main checkout also runs every worktree's tests.
    exclude: [...configDefaults.exclude, '.claude/worktrees/**'],
  },
})
