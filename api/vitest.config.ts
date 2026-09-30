import { defineConfig } from 'vitest/config';

// Keeps `npm test` instant and dependency-free (pure domain logic, no I/O)
// by excluding the integration suite, which needs a real Postgres — see
// `npm run test:integration` and the README's testing section.
export default defineConfig({
  test: {
    exclude: ['node_modules/**', '**/*.integration.test.ts'],
  },
});
