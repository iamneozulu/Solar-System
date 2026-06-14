import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/loading.e2e.test.js'],
  },
});
