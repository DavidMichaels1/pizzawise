import { defineConfig } from 'vitest/config';

// Needs a real Postgres (docker compose up -d) and the same .env as `npm run dev`.
export default defineConfig({
  test: {
    include: ['**/*.integration.test.ts'],
  },
});
