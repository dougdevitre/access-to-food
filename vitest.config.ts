import { defineConfig } from 'vitest/config';

// Tests run in Node by default (the existing suites render with
// react-dom/server). A test that needs a real DOM — clicking, typing, waiting
// for state — opts in per file with `// @vitest-environment jsdom`.
export default defineConfig({
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    // Leave the game backend to its own vitest run (sortshift-backend/).
    exclude: ['**/node_modules/**', 'sortshift-backend/**'],
  },
});
