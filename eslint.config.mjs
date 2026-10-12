import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Fichiers JavaScript du projet. Sans un bloc `files` qui les nomme, ESLint 9
// (configuration « flat ») ignore silencieusement les .jsx : plus de 1 000
// composants n'étaient jamais lintés.
const JS_FILES = ["**/*.{js,jsx,mjs,cjs}"];

// Globales de Vitest (`globals: true` dans vitest.config.js)
const VITEST_GLOBALS = Object.fromEntries(
  [
    "describe",
    "it",
    "test",
    "suite",
    "expect",
    "vi",
    "beforeAll",
    "afterAll",
    "beforeEach",
    "afterEach",
  ].map((name) => [name, "readonly"]),
);

const eslintConfig = [
  {
    // Code généré ou vendu tel quel (worker PDF.js minifié, builds)
    ignores: [
      ".next/**",
      "out/**",
      "coverage/**",
      "public/**",
      "next-env.d.ts",
    ],
  },
  {
    files: JS_FILES,
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Globales navigateur + Node (composants client, routes API, scripts)
  ...compat.env({ browser: true, node: true, es2024: true }),
  {
    rules: {
      // Signalés en warning plutôt qu'en erreur : du legacy en est truffé,
      // et ces règles ne détectent pas de bug à l'exécution
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react/no-unescaped-entities": "warn",
      // Révélées par le lint des .jsx, sans bug à l'exécution : un <a> interne
      // recharge la page au lieu d'une navigation client, et les `module`
      // signalés sont des variables locales de fonction
      "@next/next/no-html-link-for-pages": "warn",
      "@next/next/no-assign-module-variable": "warn",
      // Vrais bugs : un hook appelé conditionnellement casse l'ordre des
      // hooks au rendu suivant
      "react-hooks/rules-of-hooks": "error",
    },
  },
  {
    // Le JavaScript n'a pas de vérification de types : une variable non
    // déclarée n'est vue qu'à l'exécution (ReferenceError). TypeScript
    // couvre déjà ce cas pour les .ts/.tsx.
    files: JS_FILES,
    rules: {
      "no-undef": "error",
    },
  },
  {
    files: ["__tests__/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: VITEST_GLOBALS,
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
    // CommonJS légitime : scripts Node et fichiers de configuration
    files: [
      "scripts/**/*.{js,cjs}",
      "**/*.cjs",
      "next.config.js",
      "tailwind.config.js",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
