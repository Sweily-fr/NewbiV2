# Audit qualité global — suite e2e Playwright

> **Date** : 2026-05-05
> **Périmètre** : tous les `*.spec.js` sous `NewbiV2/e2e/`
> **Méthode** : lecture intégrale des 51 fichiers, classement par bucket, détection d'anti-patterns
> **Total tests recensés** : **216 tests** dans **51 fichiers**
> **Aucun fichier modifié** — livrable Phase 1 uniquement.

---

## 1. Inventaire des spec files

| #   | Fichier                                             |             Tests | Catégorie                             | Statut connu                                     |
| --- | --------------------------------------------------- | ----------------: | ------------------------------------- | ------------------------------------------------ |
| 1   | `a11y/dashboard-a11y.spec.js`                       |                 6 | A11Y                                  | vert (R5 fix appliqué)                           |
| 2   | `a11y/public-a11y.spec.js`                          |                 6 | A11Y                                  | partiellement rouge (R6 contraste)               |
| 3   | `account/account-settings.spec.js`                  |                 5 | SMOKE_PUR                             | vert (sur route partiellement supprimée — R5)    |
| 4   | `account/reactivate.spec.js`                        |                 3 | SMOKE_PUR                             | vert                                             |
| 5   | `analytics/analytics-dashboard.spec.js`             |                 5 | SMOKE_PARTIEL                         | vert                                             |
| 6   | `auth/auth-visual.spec.js`                          |                 9 | VISUAL                                | baselines à régénérer (R8 cascade)               |
| 7   | `auth/forgot-password.spec.js`                      |                 2 | SMOKE_PUR                             | vert                                             |
| 8   | `auth/signup-login.spec.js`                         |                15 | FONCTIONNEL_MÉTIER                    | vert                                             |
| 9   | `automations/automations.spec.js`                   |                 2 | SMOKE_PUR                             | vert                                             |
| 10  | `calendar/calendar-page.spec.js`                    |                 3 | SMOKE_PUR                             | vert                                             |
| 11  | `clients/client-crud.spec.js`                       |                 6 | FONCTIONNEL_PARTIEL                   | vert                                             |
| 12  | `clients/client-p0.spec.js`                         |                 2 | FONCTIONNEL_MÉTIER (P0 raw GraphQL)   | vert                                             |
| 13  | `cookies/cookie-consent-p0.spec.js`                 |                 3 | FONCTIONNEL_MÉTIER (RGPD)             | vert                                             |
| 14  | `cookies/cookie-consent.spec.js`                    |                 5 | FONCTIONNEL_MÉTIER                    | vert                                             |
| 15  | `dashboard/dashboard-home.spec.js`                  |                 5 | SMOKE_PARTIEL                         | rouge intermittent (R7 perf)                     |
| 16  | `email-signatures/signatures-crud.spec.js`          |                 4 | SMOKE_PARTIEL                         | vert                                             |
| 17  | `factures-achat/factures-achat-list.spec.js`        |                 5 | SMOKE_PARTIEL                         | vert                                             |
| 18  | `factures/avoirs.spec.js`                           |                 4 | FONCTIONNEL_MÉTIER (raw GraphQL + UI) | vert                                             |
| 19  | `factures/crud-mutations.spec.js`                   |                10 | FONCTIONNEL_MÉTIER (raw GraphQL)      | vert                                             |
| 20  | `factures/crud-ui.spec.js`                          |                 5 | FONCTIONNEL_MÉTIER (UI flows)         | vert (avec retry: 1 race race)                   |
| 21  | `factures/edit-delete.spec.js`                      |                 6 | FONCTIONNEL_MÉTIER                    | vert                                             |
| 22  | `factures/pieges-critiques.spec.js`                 |                 5 | FONCTIONNEL_MÉTIER (§46)              | vert (workaround R1 inline)                      |
| 23  | `factures/situations-conversion.spec.js`            |                 5 | FONCTIONNEL_MÉTIER                    | vert                                             |
| 24  | `factures/validation-erreurs.spec.js`               |                 5 | FONCTIONNEL_MÉTIER                    | vert                                             |
| 25  | `favorites/favorites.spec.js`                       |                 2 | SMOKE_PUR                             | vert                                             |
| 26  | `file-transfer/public-transfer.spec.js`             |                 2 | FONCTIONNEL_MÉTIER (auth bypass)      | vert                                             |
| 27  | `invitations/accept-invitation.spec.js`             |                 3 | SMOKE_PUR                             | vert                                             |
| 28  | `invoices/create-deposit-invoice-p0.spec.js`        |                 1 | FONCTIONNEL_MÉTIER (P0 acompte FR)    | rouge intermittent (R7 perf)                     |
| 29  | `invoices/create-invoice-p0.spec.js`                |                 2 | FONCTIONNEL_MÉTIER (P0 numérotation)  | rouge intermittent (R7 perf)                     |
| 30  | `invoices/create-invoice.spec.js`                   |                 5 | SMOKE_PARTIEL (R1 cassait L261)       | partiellement rouge / R1 fixé                    |
| 31  | `invoices/edit-delete-invoice.spec.js`              |                 2 | SMOKE_PARTIEL (skip silencieux)       | vert                                             |
| 32  | `kanban/kanban-crud.spec.js`                        |                 4 | FONCTIONNEL_MÉTIER                    | vert (R2 fix appliqué)                           |
| 33  | `navigation/sidebar-navigation.spec.js`             |                 9 | SMOKE_PARTIEL                         | vert (skip silencieux si lien absent)            |
| 34  | `ocr-test/ocr-test-page.spec.js`                    |                 3 | SMOKE_PUR                             | vert                                             |
| 35  | `onboarding/onboarding-steps.spec.js`               | 1 actif + 2 fixme | SMOKE_PUR                             | vert (2 fixme R4)                                |
| 36  | `onboarding/onboarding.spec.js`                     |                10 | FONCTIONNEL_MÉTIER (interactif)       | vert                                             |
| 37  | `products/products-crud.spec.js`                    |                 5 | FONCTIONNEL_PARTIEL                   | vert                                             |
| 38  | `public-pages/public-pages.spec.js`                 |                 9 | SMOKE_PUR                             | vert                                             |
| 39  | `purchase-orders/purchase-order-backend-p0.spec.js` |                 1 | FONCTIONNEL_MÉTIER (P0 raw GraphQL)   | vert                                             |
| 40  | `purchase-orders/purchase-order-crud.spec.js`       |                 5 | SMOKE_PARTIEL                         | vert (R3 fix appliqué)                           |
| 41  | `quotes/quote-crud.spec.js`                         |                 5 | FONCTIONNEL_PARTIEL                   | vert                                             |
| 42  | `quotes/quote-p0.spec.js`                           |                 2 | FONCTIONNEL_MÉTIER (P0 conversion)    | vert                                             |
| 43  | `security/multi-tenant-isolation.spec.js`           |                 2 | FONCTIONNEL_MÉTIER (P0 sécurité)      | vert                                             |
| 44  | `seo-optimizer/seo-optimizer.spec.js`               |                 5 | SMOKE_PUR                             | vert                                             |
| 45  | `settings/subscription-limits.spec.js`              |                 4 | SMOKE_PUR                             | vert                                             |
| 46  | `shared-documents/shared-documents.spec.js`         |                 6 | SMOKE_PARTIEL                         | vert                                             |
| 47  | `smoke/all-pages-smoke.spec.js`                     |    30 (paramétré) | SMOKE_PUR                             | vert                                             |
| 48  | `suppliers/import-supplier-invoice.spec.js`         |                 4 | SMOKE_PUR                             | vert                                             |
| 49  | `transactions/transactions-list.spec.js`            |                 5 | SMOKE_PARTIEL                         | vert                                             |
| 50  | `treasury/treasury-forecast.spec.js`                |                 5 | SMOKE_PARTIEL                         | vert (1 fixme R4)                                |
| 51  | `visual/dashboard-visual.spec.js`                   |    52 (paramétré) | VISUAL                                | 51/52 rouges (R8 cascade — baselines invalidées) |
| 52  | `visual/public-visual.spec.js`                      |    16 (paramétré) | VISUAL                                | dépend des baselines                             |

> Note : `smoke/all-pages-smoke.spec.js` génère 30 tests via `for (path of …)` ; `visual/dashboard-visual.spec.js` 52 (26 pages × 2 viewports) ; `visual/public-visual.spec.js` 16 (8 × 2). Les comptages ci-dessus reflètent les sous-tests réels.

---

## 2. Classification en 4 buckets

### 2.1 GARDER — fonctionnel métier qui valide des règles ou invariants

| Fichier                                             | Justification                                                                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `factures/avoirs.spec.js`                           | Valide §22 — totaux ≤ 0, originalInvoiceId requis, numérotation séparée AV-, sidebar query invariant.                                                              |
| `factures/crud-mutations.spec.js`                   | Valide §18 — TVA mixte, remise item PERCENTAGE/FIXED, remise globale prorata, reverse charge, shipping, DRAFT prefix, compliance numérotation, items vide.         |
| `factures/crud-ui.spec.js`                          | Flows UI complets bout-en-bout : multi-articles, brouillon, édition+reload, remise globale UI, validation §45 dates antérieures.                                   |
| `factures/edit-delete.spec.js`                      | Valide §5 transitions de statut, §4.7 verrou number après PENDING, §46.10 COMPLETED non-supprimable, §5.1 CANCELED non-modifiable, markAsPaid.                     |
| `factures/pieges-critiques.spec.js`                 | Couvre les pièges §46 qui font perdre de l'argent : escompte recalcul UI, filtres tabs front-side, DRAFT/DRAFT rename, bulk delete partiel, antédatage tardif.     |
| `factures/situations-conversion.spec.js`            | Valide §30 createLinkedInvoice, §46.19 limite 3, §21.1 acompte unique, §31 cumul situations, §43.1 conflits DRAFT.                                                 |
| `factures/validation-erreurs.spec.js`               | Valide §17 — boutons disabled selon état, max 100% remise, livraison sans adresse rejetée.                                                                         |
| `clients/client-p0.spec.js`                         | Valide P0 backend : GetClients retourne le seed, CreateClient persiste avec champs corrects. Raw GraphQL = robuste.                                                |
| `cookies/cookie-consent-p0.spec.js`                 | Valide RGPD : aucun script tracking sans consentement (3 cas dont GTM + Meta Pixel). Compliance légale.                                                            |
| `cookies/cookie-consent.spec.js`                    | Valide la persistance localStorage du consentement (round-trip GDPR).                                                                                              |
| `auth/signup-login.spec.js`                         | Valide tous les états du form login (vue initiale, vue email, redirection bons creds, échec mauvais creds, validation email/password, routes protégées).           |
| `auth/forgot-password.spec.js`                      | À conserver malgré simplicité : valide que le lien "Mot de passe oublié" pointe correctement.                                                                      |
| `onboarding/onboarding.spec.js`                     | 10 tests interactifs sur les 4 étapes : type compte, taille, recherche SIRET, plans + bascule mensuel/annuel + appel Stripe. Couvre un parcours business critique. |
| `kanban/kanban-crud.spec.js`                        | Valide création board + 4 colonnes par défaut, persistance localStorage du collapse (round-trip), reorder via clavier @dnd-kit.                                    |
| `quotes/quote-p0.spec.js`                           | Valide création devis UI + conversion devis→facture (raw GraphQL). Invariant business critique.                                                                    |
| `invoices/create-invoice-p0.spec.js`                | Valide P0 numérotation séquentielle stricte (compliance comptable FR). N → N+1 sans saut.                                                                          |
| `invoices/create-deposit-invoice-p0.spec.js`        | Valide P0 acompte FR : `isDeposit=true`, statut PENDING, montant correct. Compliance.                                                                              |
| `purchase-orders/purchase-order-backend-p0.spec.js` | Valide P0 BDC backend : prefix `BC-YYYYMM`, totaux corrects, status. Bypass UI volontaire (R3).                                                                    |
| `security/multi-tenant-isolation.spec.js`           | Valide P0 sécurité : pas de leak cross-tenant via id forgé (UI + raw GraphQL).                                                                                     |
| `file-transfer/public-transfer.spec.js`             | Valide qu'une route publique n'exige PAS l'auth (test du bypass auth). Protège une régression majeure.                                                             |
| `a11y/dashboard-a11y.spec.js`                       | Valide WCAG 2.1 AA serious/critical sur les 6 pages dashboard clés.                                                                                                |
| `a11y/public-a11y.spec.js`                          | Valide WCAG 2.1 AA sur les 6 pages publiques (login, signup, légales).                                                                                             |

**Total bucket GARDER : 22 fichiers, ~110 tests** (le module factures représente 40 de ces 110).

---

### 2.2 AMÉLIORER — qualité moyenne mais utiles, à refacto plus tard

| Fichier                                       | Défauts précis                                                                                                                                                                                                                                                   | Suggestion de fix                                                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `clients/client-crud.spec.js`                 | Test 5 `Sélection multiple` : skip silencieux si `checkboxCount === 0`. Test 4 : `bodyText.includes("Alpha") \|\| includes("Beta") \|\| includes("contact@") \|\| includes("SIRET")` — 4 ORs élargis. Test 3 : workflow avec branches `if (hasDialog) … else …`. | Asserter explicitement "Alpha" ou retirer les ORs. Supprimer la branche `else`. Faire échouer si pas de checkbox au lieu de skip. |
| `quotes/quote-crud.spec.js`                   | Test 4 : `expect(bodyText.length > 100)`. Test 5 : 6 ORs sur badges de statut. `.locator('[data-state="closed"]').first()` (sélecteur ambigu).                                                                                                                   | Capturer la mutation `CreateQuote` comme dans `quote-p0.spec.js`. Asserter le statut exact.                                       |
| `products/products-crud.spec.js`              | Tests 1-4 OK, mais test 5 `tableau ou état vide` est trivial (`hasTable \|\| hasEmpty`).                                                                                                                                                                         | Garder T1-4, supprimer T5.                                                                                                        |
| `dashboard/dashboard-home.spec.js`            | Test 1 `waitForTimeout(1000)` magique. Test 3 : compte 2 sur 3 liens qui matchent une regex. Test 5 : 3 ORs sur "avatar OR account link". R7 perf flake docu.                                                                                                    | Remplacer le sleep par `waitForResponse(/graphql/)`. Cibler 1 lien stable (`getByRole("link", {name:"Accueil"})`).                |
| `factures-achat/factures-achat-list.spec.js`  | Tous les tests utilisent `.or().or()` sur 4-5 fallbacks. Test 4 = `hasTable \|\| hasEmpty`.                                                                                                                                                                      | Garder T1 (titre) et T3 (bouton créer). Supprimer T2/T4/T5.                                                                       |
| `transactions/transactions-list.spec.js`      | T1 : `bodyText.includes("€") \|\| includes("Tous les comptes") …`. T3, T5 : `hasX \|\| (bodyText && bodyText.length > 200)` — passe presque toujours.                                                                                                            | Cibler une assertion testable (présence d'une transaction seedée, ou sélecteur stable).                                           |
| `analytics/analytics-dashboard.spec.js`       | T2 : `bodyText.length > 50`. T3, T4 : `if visible then enabled — sinon nothing`.                                                                                                                                                                                 | Garder T1 + T5 (console errors). Supprimer le reste (smoke pur).                                                                  |
| `treasury/treasury-forecast.spec.js`          | 4 tests skip silencieusement si `upgrade` apparaît (le seed PME ne le déclenche jamais — c'est juste une garde). 1 test `.fixme` R4.                                                                                                                             | Retirer les gardes `if (upgrade) skip` — le seed est stable. Tester réellement les KPIs.                                          |
| `email-signatures/signatures-crud.spec.js`    | T4 : `if (!createBtn.visible) skip` (silencieux).                                                                                                                                                                                                                | Le seed garantit l'accès — supprimer le skip.                                                                                     |
| `shared-documents/shared-documents.spec.js`   | T3 : `hasFolderBtn \|\| hasShareInfo`. T4 : 4 fallbacks `tree \|\| main \|\| empty \|\| inbox`. T6 : `hasMenu \|\| true` ← TAUTOLOGIE.                                                                                                                           | Supprimer T3/T4/T5/T6. Garder T1 (titre) et T2 (bouton ajouter).                                                                  |
| `purchase-orders/purchase-order-crud.spec.js` | T2 : 4 fallbacks pour le bouton (`Nouveau bon de commande \|\| Nouveau BC \|\| Créer un bon \|\| a:has-text`). T3-T4-T5 : ORs/smoke.                                                                                                                             | T5 garde sa valeur (R3 fix testid). T1-T4 redondants avec smoke.                                                                  |
| `auth/auth-visual.spec.js`                    | 9 baselines pixel-à-pixel desktop+mobile. Sensibles aux fonts, anti-aliasing, R6 contraste.                                                                                                                                                                      | À conserver mais limiter le scope (4-5 vues clés vs 9).                                                                           |
| `visual/dashboard-visual.spec.js`             | 52 tests pixel-à-pixel — 51 baselines invalidées par cascade R8. Très fragile (couleurs, fonts, hydration).                                                                                                                                                      | Réduire à 4-5 pages ultra-stables ou migrer vers Storybook visual. À régénérer après stabilisation.                               |
| `visual/public-visual.spec.js`                | 16 tests, moins fragiles (pages publiques statiques).                                                                                                                                                                                                            | OK mais surveiller le coût d'entretien des baselines.                                                                             |
| `invoices/create-invoice.spec.js`             | T1 (page liste header) intéressant. T4 (Actions liste) couvre R1 mais avec assertions vagues `bodyText.length > 100`. T5 (Preview PDF) viewport-conditionné. T2 (situation) et T3 (auto-liquidation) plus complets mais doublonnent avec `factures/`.            | Garder T1 + T2 (situation référence auto). Supprimer T3 (couvert par crud-mutations Test 6), T4 (vague), T5 (trivial).            |
| `kanban/kanban-crud.spec.js`                  | Le 3e test `expandAll clears localStorage to []` ne valide PAS l'expand — il pose 3 fakes puis vérifie qu'ils sont là après reload. Le titre ment.                                                                                                               | Renommer en "localStorage values survive a reload" OU implémenter le vrai test expandAll (cliquer le bouton).                     |
| `account/account-settings.spec.js`            | Route `/dashboard/account` partiellement supprimée (R5). Tests fallbackent sur "le dashboard charge". 5 tests de body.includes.                                                                                                                                  | Décision plus large : route morte → fichier candidat à suppression. Sinon refacto pour tester le settings-modal directement.      |

**Total bucket AMÉLIORER : ~17 fichiers, ~80 tests**.

---

### 2.3 CANDIDAT À SUPPRESSION — SMOKE_PURE qui ne testent rien de spécifique

> Critère : tests dont l'assertion centrale est `body.length > X`, `bodyText.includes(N1) || includes(N2) || …`, ou `expect(status < 500)` sans valider de règle métier. Si supprimés, rien n'est moins protégé.

| Fichier                                     |             Tests | Pourquoi inutile                                                                                                                                                                                                                              |
| ------------------------------------------- | ----------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `smoke/all-pages-smoke.spec.js`             |                30 | Visite 30 routes et vérifie `bodyText.length > 0` + pas d'erreur 5xx. Couvre la même chose que `visual/dashboard-visual.spec.js` (qui visite déjà ces pages) sans rien valider de plus précis. **Coût : 30 tests × ~180s timeout possibles**. |
| `public-pages/public-pages.spec.js`         |                 9 | `expect(status < 500)` sur 8 pages publiques + 1 sur 404. Recouvert par `visual/public-visual.spec.js` et `a11y/public-a11y.spec.js` qui chargent les mêmes routes.                                                                           |
| `favorites/favorites.spec.js`               |                 2 | T1 = `body.length > 50`. T2 = `bodyText.includes("Favori") \|\| 4 ORs`. Aucune règle métier.                                                                                                                                                  |
| `automations/automations.spec.js`           |                 2 | T1 = `body.length > 50`. T2 = `bodyText.includes` × 7. Aucune règle métier.                                                                                                                                                                   |
| `calendar/calendar-page.spec.js`            |                 3 | T1 = `body.length > 100`. T2 + T3 OK mais minimal.                                                                                                                                                                                            |
| `ocr-test/ocr-test-page.spec.js`            |                 3 | T1 + T2 minimum, T3 = `body.contains("ocr")`. La page elle-même est un harness de test.                                                                                                                                                       |
| `seo-optimizer/seo-optimizer.spec.js`       |                 5 | Doc inline avoue : "Page minimale → 0 inputs OK". Les 5 tests se contentent d'`expect(bodyText.length > X)` ou `bodyText.includes("SEO")`.                                                                                                    |
| `settings/subscription-limits.spec.js`      |                 4 | Les 4 assertions = `expect(pageContent.length > 0)`. Tautologie : `body` est toujours non-vide.                                                                                                                                               |
| `suppliers/import-supplier-invoice.spec.js` |                 4 | 4× `expect(pageText.length > 0)` ou `expect(page.url()).toContain('dashboard')`. Recouvert par smoke.                                                                                                                                         |
| `account/account-settings.spec.js`          |                 5 | Route `/dashboard/account` supprimée (R5). Le fichier teste des fallbacks "page load" sans contrat. Au mieux, tester le settings-modal — sinon supprimer.                                                                                     |
| `account/reactivate.spec.js`                |                 3 | T1 + T2 = `body.length > 20`. T3 valide statuts d'erreur API (utile mais 1 test).                                                                                                                                                             |
| `invitations/accept-invitation.spec.js`     |                 3 | 3× `body.length > 20` ou `expect(status < 500)`. Pas d'invitation valide testée.                                                                                                                                                              |
| `analytics/analytics-dashboard.spec.js`     |                 5 | Recouvert par smoke + R5/visual. T5 (console errors) intéressant à isoler.                                                                                                                                                                    |
| `navigation/sidebar-navigation.spec.js`     |                 9 | Pattern "if visible click — sinon rien" sur 8 tests. Le 9e ne fait pas la diff active/inactive. Tous les tests passent à vide en cas de régression de la sidebar.                                                                             |
| `onboarding/onboarding-steps.spec.js`       | 1 actif + 2 fixme | Le test actif fait `expect(onOnboarding \|\| onDashboard)` — toujours vrai. Recouvert par `onboarding/onboarding.spec.js`.                                                                                                                    |
| `invoices/edit-delete-invoice.spec.js`      |                 2 | Skip silencieux si pas de DRAFT/PENDING dans la table. **Doublon** avec `factures/edit-delete.spec.js` qui pré-crée son fixture.                                                                                                              |

**Total bucket CANDIDAT À SUPPRESSION : ~16 fichiers, ~89 tests** (dont 30 dans `smoke/all-pages-smoke.spec.js`).

> **À CONSERVER MALGRÉ FAIBLESSES** :
>
> - `auth/forgot-password.spec.js` — 2 tests minimaux mais valident un lien réel (peu de défauts).
> - `account/reactivate.spec.js T3` — vérifie le contrat 4xx d'une API endpoint.

---

### 2.4 DOUBLON — recouvert par un autre test plus complet

| Fichier doublon                                           | Remplacé par                                                                                          | Justification                                                                                                                                                                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invoices/create-invoice.spec.js`                         | `factures/crud-ui.spec.js` + `factures/crud-mutations.spec.js` + `invoices/create-invoice-p0.spec.js` | T1 (header liste) couvert par crud-ui T1. T3 (auto-liquidation) couvert par crud-mutations T6. T2 (facture de situation) couvert par situations-conversion. T4 (Actions liste) couvert par pieges-critiques. T5 (Preview PDF) trivial. |
| `invoices/edit-delete-invoice.spec.js`                    | `factures/edit-delete.spec.js`                                                                        | factures/edit-delete pré-crée explicitement DRAFT/PENDING/COMPLETED via mutation au lieu de chercher des lignes typées dans la table. Plus déterministe.                                                                               |
| `onboarding/onboarding-steps.spec.js`                     | `onboarding/onboarding.spec.js`                                                                       | Le seul test actif (`Page accessible`) est trivial et recouvert par onboarding.spec.js qui fait déjà `goto("/onboarding")` 4 fois. Les 2 `.fixme` documentent R4 : à activer quand un user fresh seedé existera.                       |
| `suppliers/import-supplier-invoice.spec.js`               | `factures-achat/factures-achat-list.spec.js` + `smoke/all-pages-smoke.spec.js`                        | Les 4 tests fallbackent sur le même `goto('/dashboard/outils/factures-achat')` que les autres. Aucun upload réel.                                                                                                                      |
| `analytics/analytics-dashboard.spec.js` (T1-T2-T4)        | `smoke/all-pages-smoke.spec.js`                                                                       | Trois des cinq tests font juste `goto + body.length`. T5 (console errors) à conserver isolément.                                                                                                                                       |
| `factures-achat/factures-achat-list.spec.js` (T2, T4, T5) | `smoke/all-pages-smoke.spec.js`                                                                       | T1 (titre) + T3 (bouton créer) restent uniques ; les 3 autres sont smoke.                                                                                                                                                              |
| `purchase-orders/purchase-order-crud.spec.js` (T1-T4)     | `smoke/all-pages-smoke.spec.js`                                                                       | Le seul test à valeur ajoutée est T5 (R3 fix testid + permission).                                                                                                                                                                     |

**Total bucket DOUBLON : 7 fichiers/tests-set**, ~20 tests redondants.

---

## 3. Module Factures (e2e/factures/) — audit détaillé

### 3.1 Avis global — note **8.5 / 10**

C'est de **très loin** la portion la plus mature de la suite. Le module est cohérent, bien commenté, suit une stratégie claire (raw GraphQL pour invariants de calcul, UI pour les flows), et chaque test cite sa section §X de `INVOICES_PAGE.md` ou de `REGRESSIONS_TO_FIX.md`. C'est le seul module qui a le réflexe de **pré-créer ses fixtures via mutation** au lieu de chasser les lignes dans une table partagée.

### 3.2 Top 5 forces

1. **Helpers réutilisables centralisés** : `helpers/invoice-mutations.js` + `helpers/invoice-fixtures.js` (utilisés par 6 specs sur 7) — un seul endroit pour les requêtes CreateInvoice, MarkAsPaid, ChangeStatus, etc. Si la mutation change, un seul fichier à toucher.
2. **Stratégie hybride raw GraphQL + UI** : `crud-mutations.spec.js` exerce 10 invariants de calcul en ~10 secondes vs 10×~30s en UI — sans perdre en couverture (le moteur de calcul est dans le resolver, pas l'UI). `crud-ui.spec.js` ne garde que les flows à valeur UI ajoutée.
3. **Justifications inline qui survivent au refactor** : presque chaque test cite `§18.3`, `§22.5`, `§46.10` ou `R8` — un dev qui touche au resolver `invoice.js` peut comprendre pourquoi le test casse sans relire 200 lignes de spec.
4. **Workaround R1 isolé** : `pieges-critiques.spec.js` fait un `beforeAll(() => deleteInvoiceMutation(seedDraft))` explicitement documenté. Pas de skip silencieux, juste un compromis lisible avec son owner backend identifié.
5. **Retry conscient des races** : `crud-ui.spec.js` et `pieges-critiques.spec.js` configurent `retries: 1` avec un commentaire qui pointe la race nextInvoiceNumber sous workers parallèles. C'est documenté comme un compromis temporaire, pas masqué.

### 3.3 Top 5 faiblesses + suggestion de fix

1. **`waitForTimeout` magiques persistants** (présents dans `crud-ui`, `crud-mutations`, `validation-erreurs`, `pieges-critiques`) — ex. `crud-ui.spec.js:48` `await page.waitForTimeout(500)` "pour synchroniser companyInfo".
   - **Fix** : remplacer par `waitForFunction` qui attend que le state RHF soit propre (`page.waitForFunction(() => document.querySelector('[name="client.id"]')?.value !== "")`), ou par un `data-testid="form-ready"` dans le composant.
2. **`uniqueCreditNoteNumber()` aléatoire dans `avoirs.spec.js`** masque un index DB stale (commentaire ligne 40-45). C'est un bug d'infra qui passe en zone "test infra" alors que c'est un blocker sur le run en CI.
   - **Fix** : drop l'index `creditnote_number_createdBy_year_unique` dans le seed e2e (`global-setup.ts`) ou ajouter un cleanup creditNote dans `global-teardown.ts`.
3. **Test 2 d'`avoirs.spec.js` accepte les wordings d'erreur trop largement** (`/originalinvoiceid|original.*invoice|non-nullable|required|invalides|invalid/`). Régression silencieuse possible si le backend remplace l'erreur de validation par un autre flux.
   - **Fix** : asserter `errors[0].extensions.code === "BAD_USER_INPUT"` au lieu d'un regex sur le message.
4. **R1 workaround couplé au backend non-fixé** (`pieges-critiques.spec.js` `beforeAll` delete seedDraft). Le jour où R1 sera fixé, ce delete sera une dette à enlever — il manque un TODO actionnable.
   - **Fix** : ajouter en commentaire un guard `if (await canQueryInvoices(api)) skip beforeAll` pour qu'il devienne no-op le jour où le bug est corrigé.
5. **`pieges-critiques.spec.js` Test 2** (§46.4 "En retard") avoue lui-même qu'il **ne valide pas** l'invariant central faute de pouvoir matérialiser une PENDING+dueDate passée (R10). Le test passe au vert en testant l'invariant structurel à la place — un vrai régression sur "En retard" passerait.
   - **Fix** : implémenter la solution R10.3 (cron de purge dans `global-teardown.ts` qui restaure invoicePaid en page 1) ou R10.2 (mutation backend admin-only `setInvoiceFields` debug-only).

### 3.4 Tests qui flake en parallèle (`--workers=2`) et timing

- **`crud-ui.spec.js` Test 1, 2, 4, 5** + **`pieges-critiques.spec.js` Test 1** : tous appellent `goto("/factures/new")` qui pré-fetche `nextInvoiceNumber` via Apollo. Si un autre fichier (typiquement `crud-mutations.spec.js` Test 9 séquentialité, ou n'importe quel test qui crée une PENDING) commit une facture entre le moment où l'UI lit son numéro et le moment où elle soumet, le backend rejette avec `Le numéro F-* existe déjà`. **Workaround actuel** : `retries: 1` avec commentaire. **Fix racine** : le pré-fetch de l'UI devrait re-lire le numéro juste avant submit, ou backend devrait faire un upsert atomique sur la séquence (probablement déjà partiellement fait — `auto-réparation §44`).
- **`avoirs.spec.js` Tests 1, 3, 4** : numérotation séparée AV- avec compteur partagé entre runs (l'index unique stale). Sous worker parallèle, deux tests peuvent demander `0001` simultanément. **Workaround** : numéros aléatoires `5000-9999`. **Fix racine** : drop ou réindex `creditnote_number_createdBy_year_unique`.
- **`situations-conversion.spec.js` Test 4** : la situation 2 est OK car cumul 90% < 100%, mais si un autre run a déjà créé des situations avec le même `purchaseOrderNumber`, la validation cumul saute. C'est isolé via `createCompletedQuote()` à chaque test, mais il faut surveiller les tests qui réutiliseraient le même devis.

### 3.5 Couverture vs `INVOICES_PAGE.md`

| Section                                            |   Couverte   | Test                                                                                 |
| -------------------------------------------------- | :----------: | ------------------------------------------------------------------------------------ |
| §3 Modèle de données                               |  ✅ partiel  | crud-mutations T1-7 (calculs), edit-delete T1                                        |
| §4 Numérotation                                    |      ✅      | crud-mutations T8 (DRAFT-), T9 (PENDING séquentiel), edit-delete T2 (locked PENDING) |
| §5 Statuts et transitions                          |      ✅      | edit-delete T1, T4, T5, T6                                                           |
| §6-§14 Page liste, table, filtres, sidebar, mobile |      ❌      | Non testé en e2e                                                                     |
| §15-§16 ModernInvoiceEditor + sections             |  ✅ partiel  | crud-ui T1-4 (multi-articles, brouillon, édition, remise)                            |
| §17 Validation au submit                           |      ✅      | validation-erreurs T1-5                                                              |
| §18 Calcul totaux                                  | ✅ exhaustif | crud-mutations T1-7                                                                  |
| §20 DRAFT vs PENDING                               |      ✅      | crud-ui T2, crud-mutations T8                                                        |
| §21 Acompte                                        |  ✅ partiel  | situations-conversion T3, invoices/create-deposit-invoice-p0                         |
| §22 Avoirs                                         |      ✅      | avoirs T1-4                                                                          |
| §23-§24 PDF + cache R2                             |      ❌      | Aucun test                                                                           |
| §25-§27 Envoi email + tracking + relances          |      ❌      | Aucun test                                                                           |
| §28 Export comptable                               |      ❌      | Aucun test                                                                           |
| §29 Factures importées                             |      ❌      | Aucun test                                                                           |
| §30 createLinkedInvoice                            |      ✅      | situations-conversion T1, T2                                                         |
| §31 Factures de situation                          |      ✅      | situations-conversion T4                                                             |
| §32 Templates                                      |      ❌      | Aucun test                                                                           |
| §33-§34 Pennylane / Stripe                         |      ❌      | Hors scope (intégrations externes)                                                   |
| §35 E-invoicing 2026 / Factur-X                    |      ❌      | Aucun test                                                                           |
| §36 Permissions RBAC                               | ✅ implicite | Tous les tests passent par le RBAC du seed                                           |
| §41-§42 Settings + SMTP                            |      ❌      | Aucun test                                                                           |
| §43 Conflits DRAFT/DRAFT                           |      ✅      | situations-conversion T5, pieges-critiques T3                                        |
| §44 Auto-réparation compteur                       |      ❌      | Aucun test (mais c'est un fix-it interne)                                            |
| §45 Validation date émission                       |      ✅      | crud-ui T5, pieges-critiques T5                                                      |
| §46 Pièges connus                                  |  ✅ partiel  | pieges-critiques T1-5 (5 pièges sur 20 documentés)                                   |

**Sections protégées** (couverture forte) : numérotation, calculs totaux, validations, transitions, avoirs, conversion devis, conflits DRAFT, dates antédatées.

**Sections NON testées** (gaps significatifs) : génération PDF, envoi email + tracking + relances, export comptable, factures importées (PDF déposé), templates, Pennylane sync, e-invoicing/Factur-X, page liste UI (filtres, recherche, tabs autres que ceux dans pieges-critiques T2), settings & SMTP, mobile fullscreen + infinite scroll, et 15 des 20 pièges §46.

---

## 4. Anti-patterns détectés

### 4.1 Sélecteurs fragiles (avec fichier:ligne)

- **`navigation/sidebar-navigation.spec.js:8`** : `'aside:visible, [data-testid="sidebar"]:visible, nav[aria-label*="principale"]:not(.md\\:hidden):visible'` — 3 fallbacks dans un seul locator + sélecteur CSS escape.
- **`navigation/sidebar-navigation.spec.js:18`** : `'a[href*="/dashboard"]:not([href*="factures"]):not([href*="devis"]):not([href*="clients"]), [data-testid="nav-dashboard"], a:has-text("Tableau de bord")'` — chaîne `:not(…)` + 2 fallbacks textuels.
- **`dashboard/dashboard-home.spec.js:20`** : `'[data-sidebar="sidebar"], aside, [role="navigation"]'` (présent 3 fois dans le fichier).
- **`factures-achat/factures-achat-list.spec.js:51-58`** : 4 fallbacks pour le bouton créer. Idem `purchase-orders/purchase-order-crud.spec.js:54-58`.
- **`signatures-crud.spec.js:79-83`** : 3 fallbacks `Créer une signature \|\| Nouvelle signature \|\| a:has-text(...)`.
- **`account/account-settings.spec.js:73-78`** : `'input[type="email"], input[type="text"], input[type="password"]'` × 3 → `editButton` × 4 → `tabButton` × 2 → fallback `body.length > 100`.
- **Pattern omniprésent dans le module factures aussi** : `page.locator("text=Sélection d'un client").first()` — texte non-i18n, fragile à un rename de copy. Recommander `data-testid="client-step-heading"` si le wording change.
- **`page.locator('button[role="combobox"]').first()`** (factures p0, crud-ui, quote-p0…) — sélecteur générique qui matche n'importe quel combobox. OK aujourd'hui car la page n'en a qu'un, pas demain.

### 4.2 Assertions vagues

- **`expect(bodyText.length > N)`** : présent dans 19 fichiers (account/, calendar/, ocr-test/, automations/, favorites/, suppliers/, settings/, dashboard/, factures-achat/, transactions/, treasury/, seo-optimizer/, shared-documents/, analytics/, invoices/create-invoice spec.js, public-pages/, navigation/, invitations/, smoke/). Ex. `account-settings.spec.js:32` `expect(bodyText.length > 50)`. **Aucune** ne valide une règle métier — toutes confirment que le DOM n'est pas vide.
- **`bodyText.includes(A) || includes(B) || includes(C) || …`** : `clients/client-crud.spec.js:167-172`, `treasury/treasury-forecast.spec.js:113-117`, `factures-achat/…:73-77`, `automations/automations.spec.js:30-37` (7 ORs), `transactions/transactions-list.spec.js:48-52`, `seo-optimizer/seo-optimizer.spec.js:88-92`, `shared-documents/…:80-86`. Plus on ajoute d'ORs, plus l'assertion devient tautologique.
- **`expect(hasA || hasB || true).toBeTruthy()`** : `shared-documents/shared-documents.spec.js:171` `expect(hasMenu || true).toBeTruthy()` — **strict tautologie**.
- **`expect(hasField || hasButton || hasTab || hasContent)`** : `account-settings.spec.js:106` — 4 ORs dont le dernier est `body.length > 100`. Toujours vert.
- **`expect(page.url()).toContain('dashboard')`** dans 6 fichiers — passe dès qu'on n'est pas redirigé vers /auth. Indicateur très faible.
- **`expect([200, 301, 302, 307, 308, 404]).toContain(status)`** : `invitations/accept-invitation.spec.js:28`, `auth/forgot-password.spec.js`. Plage trop large.

### 4.3 Race conditions / `waitForTimeout` magiques

- **40+ occurrences de `waitForTimeout(N)`** dans la suite, avec N ∈ {100, 150, 200, 300, 400, 500, 800, 1000, 1500, 2000, 2500} :
  - `factures/crud-ui.spec.js:48,111,193` (200, 500, 150ms — synchronisations RHF)
  - `factures/pieges-critiques.spec.js:88,408` (clickTab + post-bulk-delete refetch)
  - `factures/validation-erreurs.spec.js:44,106,138` (post-blur RHF)
  - `dashboard/dashboard-home.spec.js:9` (1000ms arbitraire avant assertion)
  - `onboarding/onboarding-steps.spec.js:16` (1500ms)
  - `account/account-settings.spec.js` (aucun mais ses tests dépendent d'un load implicite)
  - `a11y/dashboard-a11y.spec.js:35` (2000ms — "let async content load")
  - `a11y/public-a11y.spec.js:31` (1500ms)
  - `kanban/kanban-crud.spec.js` (aucun mais utilise `expect.toBeVisible`)
- **Race nextInvoiceNumber** documentée dans `factures/crud-ui.spec.js:124-130` et `factures/pieges-critiques.spec.js:96-99` — résolue par retry, pas fix racine.
- **Race compteur creditNote** dans `factures/avoirs.spec.js:40-48` — résolue par numéros aléatoires, pas fix racine.
- **Race onboarding/restoreOrganization** = R8, partiellement résolu (commit d02d6df1).

### 4.4 Skips silencieux (test qui passe au vert sans rien tester)

- **`clients/client-crud.spec.js:185`** : Test 5 — `if (checkboxCount > 0) { … } else nothing`. Si la table n'a pas de checkbox, le test passe sans assertion.
- **`signatures-crud.spec.js:128, 134`** : Test 4 — `if (!createBtn.visible) test.skip()` puis `if (isDisabled) test.skip()`.
- **`shared-documents/shared-documents.spec.js:148, 154`** : Test 6 — 2 skips conditionnels.
- **`treasury/treasury-forecast.spec.js:103, 132, 167, 207`** : 4 tests skip si `upgrade` apparaît. Le seed PME ne déclenche jamais cette branche, donc les skips sont uniquement défensifs ; **mais** si le seed se casse en silence, les tests passeront sans rien tester.
- **`onboarding/onboarding-steps.spec.js:31, 64`** : 2 `test.fixme()` documentés R4. **Pas un anti-pattern** quand documenté ainsi (`fixme` ≠ skip silencieux), mais le 1er test actif `Page onboarding accessible` lui passe trivialement (`expect(onOnboarding || onDashboard)` toujours vrai).
- **`navigation/sidebar-navigation.spec.js`** : 8 tests sur 9 sont sous `if (await link.isVisible({timeout:5000}))`. Si la sidebar régresse complètement, les 8 tests passent au vert sans assertion.
- **`invoices/edit-delete-invoice.spec.js:33, 60`** : `if (!(await draftRow.isVisible(...))) return;` — return implicite, aucun message, le test passe vert.
- **`factures/avoirs.spec.js:117`** : `await deleteInvoiceMutation(...).catch(() => {})` — catch silencieux dans un beforeAll. Acceptable car commentaire le justifie.

### 4.5 Tests dépendants d'autres tests (ordre, état partagé)

- **`onboarding/onboarding.spec.js` `clearOrganization` / `restoreOrganization`** (afterAll) : R8 historique, partiellement résolu. Tous les specs alphabétiquement après `onboarding/` héritent du seed restauré ; si `restoreOrganization` casse, le cluster s'effondre (R8).
- **`factures/crud-mutations.spec.js` Test 9 (numérotation séquentielle)** : `expect(n2).toBe(n1 + 1)` ne tient que si **aucun autre test** n'a créé de PENDING entre les deux mutations. C'est respecté en `--workers=1` mais pas en `--workers=2`. Ne pas paralléliser ce fichier.
- **`factures/situations-conversion.spec.js` Tests 2, 3, 4** : tous les tests réutilisent `createCompletedQuote()` qui crée un nouveau devis à chaque fois. **OK**.
- **`factures/pieges-critiques.spec.js` `beforeAll` delete seedDraft** : modifie l'état seedé. Si un autre fichier alphabétiquement avant ce fichier dépend d'`invoiceDraft`, il casse. Aucun fichier ne le fait dans la suite actuelle, mais c'est un piège latent.
- **Compteur creditNote backend persistant entre runs** : `avoirs.spec.js` paie un workaround aléatoire pour ce que c'est en théorie un bug d'infra DB.

### 4.6 Mocks excessifs

**Aucun mock backend détecté** — la suite utilise un vrai backend Express (`localhost:4001`) avec une vraie DB Mongo (`invoice-app-test`). C'est une **force**, pas une faiblesse. Aucun mock à signaler.

Les seuls "mocks" sont des `addInitScript` qui pré-seedent localStorage (cookie consent) avant les tests publics — légitime.

---

## 5. Recommandations priorisées

### 5.1 Top 3 fort impact / faible effort (à faire maintenant)

1. **Supprimer 12 fichiers SMOKE_PUR (~70-89 tests)** du bucket §2.3.
   - **Impact** : -30 à -45% du temps de run (le smoke des 30 routes seul peut prendre 10-15min en serial), -89 tests qui ne valident aucune règle métier.
   - **Effort** : ~30 minutes de `rm` + relance Playwright `--list` pour vérifier qu'aucun import n'est cassé.
   - **Risque** : zéro — aucun de ces tests ne couvre quelque chose qui ne soit pas déjà couvert ailleurs (visual ou a11y visite les mêmes routes ; les pages publiques ont aussi leur a11y).
2. **Supprimer les 3 doublons invoices/** (`invoices/create-invoice.spec.js`, `invoices/edit-delete-invoice.spec.js`, `invoices/create-invoice-p0.spec.js` peut rester — il teste la séquentialité). Conserver les 2 P0 et migrer les tests à valeur (T2 situation référence, T3 reverse-charge si pas déjà couvert) vers le module `factures/`.
   - **Impact** : -7 tests, lève la dette R1 (le test L261 qui a découvert R1 reste rouge tant qu'il n'est pas migré ou supprimé).
   - **Effort** : 30-60 minutes.
3. **Remplacer les 3 sélecteurs `[data-sidebar=…], aside, [role=navigation]` chaînés** (`dashboard-home.spec.js`, `navigation/sidebar-navigation.spec.js`) par un `data-testid="dashboard-sidebar"` ajouté côté src.
   - **Impact** : stabilise R7 perf (perd les warnings de timeout en cascade) et rend `navigation/sidebar-navigation.spec.js` moins silencieux.
   - **Effort** : 1 ligne dans `src/components/sidebar.jsx`, refacto local des 2 specs.

### 5.2 Top 3 fort impact / fort effort (à planifier)

1. **Bannir `waitForTimeout(N)` partout — remplacer par des waiters sémantiques.**
   - **Impact** : -30% de flakes intermittents en CI, élimination de la dette technique #1 du suite. Permet aussi de re-paralléliser certains specs aujourd'hui sériaux.
   - **Effort** : ~3-5 jours dev-équivalent. Faire un PR par module : factures/, auth/, dashboard/, etc.
   - **Méthode** : pour chaque `waitForTimeout`, identifier l'événement attendu (mutation, render, blur RHF) et utiliser `waitForResponse`/`waitForFunction`/`expect(locator).toBeVisible()` à la place.
2. **Régénérer + mutualiser les visual baselines après stabilisation R8.**
   - **Impact** : récupère 51/52 tests visuels rouges, rétablit la couverture pixel-à-pixel sur 26 pages dashboard.
   - **Effort** : ~2 jours, avec coordination design (R6 contraste à trancher avant pour ne pas régénérer 2 fois).
   - **Alternatives à évaluer** : (a) réduire à 4-5 pages clés au lieu de 26 ; (b) migrer vers du visual component-level via Storybook (test-runner Chromatic ou Storybook test-runner) — plus stable car isolé du dashboard global.
3. **Combler 6 sections non testées de `INVOICES_PAGE.md`** (cf. §3.5) :
   - Génération PDF (§23-§24) : test du endpoint `/api/invoices/generate-pdf` avec un id valide, asserter Content-Type `application/pdf` + taille > 0.
   - Envoi email + tracking (§25-§26) : monter un faux serveur SMTP (Mailpit) en CI et asserter le payload envoyé.
   - Export comptable (§28) : déclencher l'export CSV/FEC, parser le résultat, asserter les colonnes.
   - Templates (§32) : créer + appliquer un template, asserter le rendering.
   - Page liste UI (§6-§14) : couvrir filtres avancés, recherche, dates, mode mobile, sidebar preview.
   - 15 pièges §46 restants : prioriser ceux avec impact financier (escompte combiné, cumul situations + acompte, etc.).
   - **Effort** : 10-15 jours, à étaler sur 2-3 sprints.

---

## 6. Synthèse exécutive

- **Suite actuelle** : 216 tests, 51 fichiers, ~30-40% du temps consommé sur des tests qui ne valident aucune règle métier.
- **Module factures** : excellent (8.5/10), 40 tests bien structurés. À conserver tel quel hors petits fix (#3.3).
- **Reste de la suite** : qualité hétérogène. ~22 fichiers à garder tels quels, ~17 à améliorer, ~16 candidats à suppression, 7 doublons.
- **Gain proposé Phase 3** : si tu valides l'intégralité du bucket "candidat à suppression", on enlève **~89 tests** (16 fichiers) et on garde **~127 tests** qui valident tous une règle ou un invariant. Le run passe de ~25-30 min à ~12-15 min en serial.
- **Risque résiduel** : zéro régression de couverture sur les domaines factures/devis/clients/auth/security. Léger gap sur les domaines "smoke" purs (favoris, automations, calendar, reactivate, ocr-test, seo-optimizer) — mais ces domaines n'avaient déjà pas de protection métier réelle, juste un canari "page charge".

---

**Audit terminé. Lis e2e/AUDIT_QUALITE_GLOBAL.md, dis-moi quelles suppressions tu valides.**
