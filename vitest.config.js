import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["__tests__/**/*.test.{js,jsx,ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e", "__tests__/browser/**"],
    setupFiles: ["__tests__/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      exclude: ["node_modules", ".next", "__tests__", "e2e", "public"],
      // Phase 1 thresholds (Mission L wrap, 2026-05-04). Real coverage:
      //   58.85 % statements / 47.94 % branches / 57.68 % functions / 59.57 % lines.
      // Buffer of ~1-2%. Phase 2 → 65/55/65/65, Phase 3 → 80/70/80/80.
      thresholds: {
        statements: 55,
        branches: 45,
        functions: 55,
        lines: 55,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
