import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['__tests__/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    setupFiles: ['__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: ['node_modules', '.next', '__tests__', 'e2e', 'public'],
      thresholds: {
        statements: 20,
        branches: 15,
        functions: 20,
        lines: 20,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
});
