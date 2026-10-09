import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Signalés en warning plutôt qu'en erreur : du legacy en est truffé,
      // et ces règles ne détectent pas de bug à l'exécution
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  {
    // posthog-js (~73 kB gz) n'est chargé qu'à l'idle par
    // instrumentation-client.js : un import statique le remet dans le JS
    // initial de toutes les pages. Passer par src/lib/analytics.
    ignores: ["instrumentation-client.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "posthog-js",
              message:
                "Utiliser capture / identify / resetAnalytics de @/src/lib/analytics (posthog est chargé à l'idle).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
