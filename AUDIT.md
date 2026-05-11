# AUDIT — NewbiV2 (Frontend Next.js / Vercel)

> Audit en lecture seule réalisé le **2026-05-04**. Aucun fichier modifié, aucune dépendance installée.
> Repo : `https://github.com/Sweily-fr/NewbiV2.git` · Branche courante : `develop` · Production : `main` (auto-déploiement Vercel).

---

## 1.1 Inventaire technique

### Stack

| Élément           | Valeur                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| Framework         | **Next.js 15.5.7** (App Router, React 19.2, Turbopack)                                                 |
| Langage           | **JavaScript majoritaire** (1 189 fichiers .js/.jsx vs 45 .ts/.tsx ; `allowJs: true`, `strict: false`) |
| Node (CI)         | 20 (`actions/setup-node@v4`)                                                                           |
| Node (local)      | **23.11.0** ⚠ écart avec la CI                                                                         |
| Package manager   | npm 10.9.2 (`legacy-peer-deps=true` dans `.npmrc`)                                                     |
| Auth              | Better Auth 1.3.7 + plugin Stripe                                                                      |
| GraphQL client    | Apollo Client 3.14 + `apollo3-cache-persist`                                                           |
| Style             | Tailwind CSS 4 + Radix UI (~25 packages)                                                               |
| PDF / e-invoicing | `jspdf`, `pdf-lib`, `puppeteer` ; FacturX maison                                                       |
| Hébergement       | Vercel (région `cdg1`) — `vercel.json` minimal                                                         |

### Outils déjà en place

- ESLint (config Next + TypeScript), Prettier, Husky, lint-staged
- Pre-commit : **gitleaks** (scan secrets) + lint-staged
- TypeScript : présent mais marginal — `next.config.js` ignore `typescript` ET `eslint` au build (`ignoreBuildErrors: true`, `ignoreDuringBuilds: true`)
- Headers HTTP de sécurité configurés dans `next.config.js` (HSTS, X-Frame-Options, Permissions-Policy…)

### Frameworks de tests installés

| Outil                                                          | Présence | Rôle                                                                      |
| -------------------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| **Vitest 4.1**                                                 | ✅       | Tests unitaires + intégration (happy-dom)                                 |
| **@vitest/browser** + Playwright                               | ✅       | Tests composants en vrai Chromium (Cypress-like)                          |
| **Playwright 1.59**                                            | ✅       | E2E (52 specs, multi-projets : Chrome / Firefox / WebKit / Mobile / a11y) |
| **MSW 2.13**                                                   | ✅       | Mock GraphQL/HTTP côté frontend                                           |
| **Testing Library** (`react`, `dom`, `jest-dom`, `user-event`) | ✅       | Assertions React                                                          |
| **@faker-js/faker 10**                                         | ✅       | Factories                                                                 |
| **Stryker mutator 9**                                          | ✅       | Mutation testing (~9 fichiers utils ciblés)                               |

### Scripts npm clés

```
dev / dev:e2e / build / build:e2e / start / start:e2e
test / test:run / test:coverage / test:ui
test:browser / test:browser:ui
e2e / e2e:headed / e2e:ui / e2e:debug / e2e:smoke / e2e:a11y / e2e:codegen
lint / prepare (husky)
```

Pas de script `typecheck` standalone.
Pas de script `format` standalone (passe par lint-staged).

### Variables d'environnement utilisées (noms uniquement)

**Front public** : `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`, `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`, `NEXT_PUBLIC_STRIPE_NEW_ORG_COUPON_ID`, `NEXT_PUBLIC_ICONS_SOCIAL_BUCKET_NAME`, `NEXT_PUBLIC_ICONS_SOCIAL_URL`.
**Back / serveur Next** : `MONGODB_URI`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_FREE_PRICE_ID`, `STRIPE_FREELANCE_MONTHLY_PRICE_ID`, `STRIPE_FREELANCE_YEARLY_PRICE_ID`, `STRIPE_PME_*`, `STRIPE_ENTREPRISE_*`, `STRIPE_SEAT_PRICE_ID`, `STRIPE_NEW_ORG_COUPON_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_API_VISION`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `META_PIXEL_ID`, `META_CAPI_TOKEN`.
**E2E** (`.env.test.example`) : `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `MONGODB_URI`, `MONGODB_DB_NAME`, `NEXT_PUBLIC_*`, `BETTER_AUTH_SECRET`, `GRAPHQL_URL`.

⚠ **Pas de `.env.example` à la racine** — uniquement `.env.test.example`. Un dev qui clone n'a aucun pointeur sur la liste des variables prod.

### CI/CD existant

- `.github/workflows/ci.yml` — lint → unit-tests (Vitest + coverage) → e2e (Playwright + Mongo 7 service). Trigger : `push`/`PR` sur `develop` uniquement.
- `.github/workflows/publish-blog-articles.yml` — cron hebdo (lundi 7h UTC) qui publie des articles via OpenAI + Unsplash.
- **Aucun workflow de déploiement** — Vercel se déploie tout seul via son intégration GitHub (preview sur PR, prod sur `main`).
- Pas de `dependabot.yml`, pas de `renovate.json`, pas de branch protection visible.

---

## 1.2 État de la couverture de tests

Coverage relevé via `npm run test:coverage` (V8) — frontend uniquement, source `coverage/lcov.info` régénéré à l'instant :

| Métrique       | Couverture                  | Seuil configuré | Cible (vous)                 |
| -------------- | --------------------------- | --------------- | ---------------------------- |
| **Statements** | **58.85 %** (2 777 / 4 718) | 30 %            | 80 % global                  |
| **Branches**   | **47.94 %** (1 939 / 4 044) | 20 %            | 70 %+                        |
| **Functions**  | **57.68 %** (398 / 690)     | 25 %            | 80 %                         |
| **Lines**      | **59.57 %** (2 650 / 4 448) | 30 %            | 80 % global / 100 % critique |

> Les seuils `vitest.config.js` actuels sont délibérément bas (≈ 25-30 %) — ils ne _cassent_ pas la CI, ils empêchent juste une régression brutale.

**Tests unitaires/intégration** : 1 147 passed, 3 skipped sur **63 fichiers**.
**E2E** : 52 specs Playwright (auth, factures, devis, BC, clients, produits, kanban, file-transfer, treasury, signatures-mail, automations, calendar, account, cookies, public, smoke, security multi-tenant, a11y, visual regression).
**Browser-mode** : 1 fichier (`button.test.jsx`) — quasi inutilisé.

### Couverture hétérogène — extraits notables (du dernier `lcov`)

Bons élèves (≥ 90 %) :

- `src/middleware/subscription.js` : 97 %
- `src/lib/upload/*` : 92-100 %
- `src/lib/graphql/imageUpload.js` : 100 %
- `src/utils/invoiceUtils.js`, `quoteUtils.js`, `creditNoteUtils.js`, `kanbanHelpers.js` : 95-100 %
- `src/utils/{product-import-v2, product-export, analytics-export}` : > 90 %

Trous critiques (< 30 %) :

- `src/utils/invoice-export.js` : **9.6 %** (PDF export factures)
- `src/utils/quote-export.js` : **8.8 %** (PDF export devis)
- `src/utils/api-gouv.js` : **29.8 %** (résolution SIRET)
- `src/utils/seo-data.js` : **37.5 %**
- `src/utils/client-import.js` : **35.4 %**
- Email templates `subscription/*`, `seats/*` : **50 %** moyen

### Modules/dossiers sans aucun test

- `src/components/**` (sauf `CompanyInfoGuard.jsx`) — quasi 0 % sur les composants UI métier (formulaires factures, kanban modal, transactions table, signatures-mail blocks…).
- `src/hooks/**` — seuls 2 hooks couverts (`use-feature-access`, `use-subscription-limits`) sur 75.
- `src/contexts/**`, `src/providers/**` — non testés.
- `app/api/**` (69 routes API Next) — **aucune route testée unitairement** ; testées indirectement en E2E mais sans assertion sur le contrat.
- Pages `app/dashboard/**` — couvertes seulement par smoke E2E.
- Génération PDF (`generatePDF.js`, `facturx-generator.js`) : couverture acceptable mais **9 `console.log` actifs en prod**.

---

## 1.3 Audit qualité du code

### `npm audit` — **14 vulnérabilités** (1 critical, 7 high, 6 moderate)

| Sévérité     | Package                               | Origine              | Fix dispo                                                      |
| ------------ | ------------------------------------- | -------------------- | -------------------------------------------------------------- |
| **CRITICAL** | `jspdf ≤ 3.0.4`                       | direct (PDF)         | ✅ upgrade                                                     |
| **HIGH**     | `basic-ftp ≤ 5.2.2` (CRLF inj. + DoS) | transitive           | ✅                                                             |
| **HIGH**     | `defu ≤ 6.1.4` (proto pollution)      | transitive           | ✅                                                             |
| **HIGH**     | `xlsx *` (proto pollution + ReDoS)    | direct               | ❌ **pas de fix** — migrer vers `exceljs` ou `read-excel-file` |
| **MODERATE** | `dompurify < 3.4` (4 CVE XSS)         | direct               | ✅                                                             |
| **MODERATE** | `fast-xml-parser < 5.7`               | transitive (AWS SDK) | ✅                                                             |
| **MODERATE** | `follow-redirects ≤ 1.15.11`          | transitive           | ✅                                                             |

Lien direct projet :

- `jspdf` (génération PDF factures/devis) → **patch immédiat requis**.
- `dompurify` (rendu HTML markdown / signatures) → **patch immédiat**.
- `xlsx` (import/export Excel produits/clients) → **migration sous 60 j**.

### Code smells quantifiés

- **935 `console.log`** sur `src/`, `app/`, `lib/` (chiffre brut, certains seront filtrés en prod par `next.config.js compiler.removeConsole`, mais `console.log("📄 Début génération PDF")` reste polluant en debug).
- **17 marqueurs TODO/FIXME/XXX/HACK** — volume raisonnable.
- **23 `: any`** TypeScript — anecdotique vu que TS est très peu utilisé.
- **`tsconfig.json strict: false`** + `next.config.js ignoreBuildErrors: true` → la CI ne fait **aucun typecheck bloquant**.

### Fichiers > 500 lignes (top 12 — symptomatiques)

| Lignes | Fichier                                                                    |
| -----: | -------------------------------------------------------------------------- |
|  4 921 | `app/dashboard/outils/documents-partages/page.jsx`                         |
|  4 287 | `app/public/kanban/[token]/page.jsx`                                       |
|  2 980 | `app/dashboard/outils/factures/hooks/use-invoice-editor.js`                |
|  2 798 | `app/dashboard/outils/devis/hooks/use-quote-editor.js`                     |
|  2 706 | `app/dashboard/outils/bons-commande/hooks/use-purchase-order-editor.js`    |
|  2 624 | `app/dashboard/outils/kanban/[id]/components/KanbanListView.jsx`           |
|  2 572 | `src/components/pdf/UniversalPreviewPDF.jsx`                               |
|  2 471 | `app/dashboard/outils/signatures-mail/components/blocks/BlockSettings.jsx` |
|  2 380 | `src/components/icons.jsx`                                                 |
|  2 336 | `app/dashboard/clients/components/clients-modal.jsx`                       |
|  2 306 | `app/dashboard/outils/kanban/[id]/components/TaskModal.jsx`                |
|  2 022 | `app/dashboard/outils/signatures-mail/new/page.jsx`                        |

→ Ces 3 hooks `use-{invoice,quote,purchase-order}-editor.js` sont les **points d'entrée des bugs récurrents factures/devis/BC** (cf. `e2e/REGRESSIONS_TO_FIX.md` qui liste R1, R2, R3 actifs). Découpage urgent à prévoir, mais hors scope test/CI.

### `.env.example`

- ❌ **Absent à la racine du frontend**. Seul `.env.test.example` existe.
- ✅ Le backend (`newbi-api/.env.example`) est complet et frais.

---

## 1.4 Cartographie des flux critiques

|   # | Flux                                                          | Criticité                    | Type recommandé                      | Couvert ?                                                                                   |
| --: | ------------------------------------------------------------- | ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
|   1 | **Signup / Login** (email+pwd)                                | Critique                     | E2E + intégration                    | ✅ `e2e/auth/signup-login.spec.js`                                                          |
|   2 | **OAuth Google / GitHub**                                     | Haute                        | E2E mocké                            | ❌ aucun test                                                                               |
|   3 | **Reset password + email verify**                             | Critique                     | E2E                                  | ✅ `e2e/auth/forgot-password.spec.js` (reset uniquement, pas verify)                        |
|   4 | **2FA setup / verify**                                        | Haute                        | E2E + unit                           | ❌                                                                                          |
|   5 | **Logout + multi-session revoke**                             | Haute                        | E2E                                  | ❌                                                                                          |
|   6 | **Onboarding workspace + company info**                       | Critique                     | E2E                                  | ✅ `e2e/onboarding/*` (2 specs)                                                             |
|   7 | **Stripe checkout** (souscription nouvelle org)               | **Critique**                 | E2E avec Stripe test mode            | ❌ aucun test bout-en-bout                                                                  |
|   8 | **Stripe webhook** (`subscription.created/updated/cancelled`) | **Critique**                 | Intégration mockée + tests signature | ❌ aucun test sur `app/api/webhooks/stripe/`                                                |
|   9 | **Plan change / downgrade / cancel**                          | Critique                     | E2E + intégration                    | ❌                                                                                          |
|  10 | **Stripe Connect (payouts vendeur)**                          | Haute                        | Intégration                          | ❌                                                                                          |
|  11 | **Multi-tenant isolation** (header `x-workspace-id`)          | **Critique**                 | Unit + E2E security                  | ✅ `e2e/security/multi-tenant-isolation.spec.js`                                            |
|  12 | **Invoice CRUD + numérotation atomique**                      | **Critique**                 | Unit + E2E                           | ✅ `e2e/factures/*` (8 specs), mais R1 (Invoice.number nullable) actif                      |
|  13 | **Invoice → PDF jsPDF**                                       | Critique                     | Unit + visuel                        | ⚠ partiel (`__tests__/utils/generatePDF.test.js`)                                           |
|  14 | **FacturX e-invoicing XML**                                   | **Critique** (légal)         | Unit + validation XSD                | ⚠ `__tests__/utils/facturx-generator.test.js` (84 % lignes mais pas de test conformité XSD) |
|  15 | **Quote CRUD**                                                | Critique                     | E2E                                  | ✅ `e2e/quotes/*`                                                                           |
|  16 | **Purchase Order CRUD**                                       | Haute                        | E2E                                  | ⚠ R3 actif : `GetNextPurchaseOrderNumber` non répondu                                       |
|  17 | **Quote → Invoice conversion**                                | Haute                        | E2E                                  | ❌                                                                                          |
|  18 | **Credit notes (avoirs)**                                     | Haute                        | E2E                                  | ✅ `e2e/factures/avoirs.spec.js`                                                            |
|  19 | **Client / Produit / Fournisseur CRUD**                       | Haute                        | E2E                                  | ✅                                                                                          |
|  20 | **Banking — connexion Bridge / GoCardless**                   | **Critique** (RGPD/sécurité) | E2E + intégration                    | ❌                                                                                          |
|  21 | **Banking — sync transactions + reconciliation**              | Critique                     | Intégration                          | ❌                                                                                          |
|  22 | **Kanban realtime drag & drop**                               | Haute                        | E2E                                  | ⚠ R2 actif : sélecteurs @dnd-kit absents, drag skippé                                       |
|  23 | **Kanban subscriptions GraphQL**                              | Haute                        | Intégration                          | ❌                                                                                          |
|  24 | **File transfer chunked upload R2**                           | Critique                     | Intégration + E2E                    | ⚠ E2E public uniquement                                                                     |
|  25 | **File transfer download public + password**                  | Critique                     | E2E                                  | ✅ `e2e/file-transfer/public-transfer.spec.js`                                              |
|  26 | **Email signatures éditeur**                                  | Moyenne                      | E2E                                  | ✅ `e2e/email-signatures/signatures-crud.spec.js`                                           |
|  27 | **OCR upload + extraction (factures fournisseurs)**           | Haute                        | Intégration                          | ⚠ `e2e/ocr-test/ocr-test-page.spec.js` smoke                                                |
|  28 | **Treasury forecast**                                         | Moyenne                      | E2E                                  | ✅ `e2e/treasury/treasury-forecast.spec.js`                                                 |
|  29 | **CRM email automation**                                      | Haute                        | Intégration backend                  | ❌ côté front                                                                               |
|  30 | **Cookie consent + GTM/Meta gating**                          | Critique (RGPD)              | E2E                                  | ✅ `e2e/cookies/*`                                                                          |
|  31 | **Sitemap / SEO public pages**                                | Moyenne                      | E2E + visuel                         | ✅ `e2e/public-pages/*`, `e2e/visual/*`                                                     |
|  32 | **Accessibility (axe-core)**                                  | Haute                        | E2E                                  | ✅ `e2e/a11y/*`                                                                             |

**Verdict** : excellente base sur les flux métier classiques, **trous massifs sur tout ce qui touche Stripe et Banking** (les deux flux les plus dangereux à casser financièrement).

---

## 1.5 Risques détectés

### Bloquants / haute sévérité

1. **`jspdf` critical CVE non patché** — usage direct pour générer factures/devis. Path traversal + JS injection possibles côté client.
2. **`xlsx` SheetJS sans fix amont** — utilisé dans imports clients/produits ; user input → ReDoS potentiel.
3. **Pas de typecheck en CI** — `tsconfig strict: false` + `ignoreBuildErrors: true` ; un changement Apollo/Better Auth peut casser la prod sans signal.
4. **Pas de `.env.example` racine** — onboarding dev fragile, risque de variables manquantes en preview Vercel.
5. **Stripe webhook (`app/api/webhooks/stripe/`) non testé du tout** — un mauvais signe de signature ou un event manqué = abonnement orphelin / perte de revenu.
6. **Banking routes API non testées** (`app/api/banking-connect/bridge`, `gocardless`) — endpoints qui manipulent des credentials bancaires.
7. **R1, R2, R3 actifs en prod** (cf. `e2e/REGRESSIONS_TO_FIX.md`) — pas un risque test/CI mais à corriger avant tout effort de stabilisation.
8. **Vercel auto-deploy sur push `main` sans gate CI** — la CI tourne uniquement sur `develop`. Un hotfix poussé directement sur `main` est livré sans aucun test.
9. **CI Node 20 vs local Node 23.11** — incohérence qui peut masquer des bugs (ex : modules natifs, Node API).
10. **Pas de monitoring runtime** — Sentry/Datadog absents (aucune dépendance détectée).

### Moyens

11. **935 `console.log`** dans le code ; le `removeConsole` Next ne supprime que `log` mais préserve `error`/`warn` — OK, mais beaucoup de logs `console.log("✅ ...")` qui n'ont rien à faire en prod même filtrés (impactent perf bundling).
12. **`legacy-peer-deps=true`** — masque des conflits réels de dépendances React 19 / Radix.
13. **Fichiers > 4 000 lignes** (`documents-partages/page.jsx`, `public/kanban/[token]/page.jsx`) — surface de bug énorme, presque non testable unitairement.
14. **Hooks `use-{invoice,quote,purchase-order}-editor` ~3 000 lignes chacun** — concentrent la logique métier la plus sensible et n'ont aucun test unitaire dédié.
15. **`AUTH_REQUIRED_PREFIXES` ne couvre que `/dashboard`** — toute autre route protégée doit être ajoutée manuellement.
16. **Absence totale de Dependabot / Renovate** — les 14 vulns ci-dessus n'auraient pas dû atteindre ce niveau.
17. **`forbidOnly: isCI`** est bon ; mais `webServer.timeout: 180000` (3 min) sur le build Next + démarrage backend → flake possible en CI lente.
18. **Aucune configuration de branch protection** — pas garantie que les PR `develop` requièrent CI vert.

### Faibles / informatifs

19. **`playwright.config.js` pointe sur `/Applications/Opera.app`** par défaut en local — fragile pour onboarding mais sans incidence prod.
20. **`stryker.conf.json`** ne mute que 9 fichiers utils — le mutation testing reste anecdotique tant qu'on n'a pas étendu la liste.
21. **Tests browser-mode**: 1 seul fichier (`button.test.jsx`) — investissement non rentabilisé, à étendre ou retirer.

---

_Fin de l'audit NewbiV2. Voir `PLAN.md` à la racine pour la feuille de route._
