import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    include: [
      "__tests__/utils/invoice-utils.test.js",
      "__tests__/utils/quote-utils.test.js",
      "__tests__/utils/credit-note-utils.test.js",
      "__tests__/utils/api-gouv.test.js",
      "__tests__/utils/error-messages.test.js",
      "__tests__/utils/seo-data.test.js",
      "__tests__/lib/auth-utils.test.js",
      "__tests__/lib/permissions.test.js",
      "__tests__/lib/plan-limits.test.js",
    ],
    exclude: ["node_modules", ".next", "e2e", "__tests__/browser/**"],
    setupFiles: ["__tests__/setup.js"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
