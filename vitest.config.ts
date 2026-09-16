import { defineConfig } from 'vite';

export default defineConfig({
  // @ts-ignore
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
} as any);
