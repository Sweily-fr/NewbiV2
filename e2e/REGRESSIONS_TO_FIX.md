# Régressions à corriger (hors scope "réparation sélecteurs")

## R1 — GetInvoices : erreur de chargement page liste factures

- **Découvert** : commit 60fb2ded, test `e2e/invoices/create-invoice.spec.js:261` (Actions liste — clic ligne, menu, paramètres, relances)
- **Catégorie** : BACKEND_BUG
- **Symptôme frontend** : page `/dashboard/outils/factures` rend `<h3>Erreur de chargement</h3>` + paragraphe "Impossible de charger les factures" + bouton "Réessayer"
- **Erreur backend (response GraphQL réelle, capturée via trace Playwright `test-results/.../trace.zip` → `resources/3852a40...json`)** :

```json
{
  "errors": [
    {
      "message": "Cannot return null for non-nullable field Invoice.number.",
      "extensions": { "code": "INTERNAL_SERVER_ERROR" },
      "path": ["invoices", "invoices", 0, "number"]
    }
  ],
  "data": null
}
```

- **Resolver** : `newbi-api/src/resolvers/invoice.js:290` (`invoices: requireRead("invoices")(...)`) — le resolver lui-même tourne sans erreur ; c'est la sérialisation GraphQL qui échoue au moment de retourner le payload, parce que la 1ère facture (DRAFT seedée) a `number: null`.
- **Variables envoyées par le frontend** :

```json
{
  "workspaceId": "bbbbbbbbbbbbbbbbbbbb0001",
  "page": 1,
  "limit": 50,
  "sortField": "issueDate",
  "sortOrder": "desc",
  "filters": {}
}
```

(`sortField`, `sortOrder` et `filters` ne sont pas déclarés dans la `query GetInvoices(...)` — Apollo les drop avant l'envoi. Pas la cause.)

- **État DB observé** : seed e2e standard, 3 invoices dans le workspace test (DRAFT sans number, PENDING `001`, COMPLETED `002`) + 1 FOREIGN_INVOICE (`F-209912/9999`). Reproduit avec un seed propre et un seul test isolé (`-g "Actions liste"`) — donc PAS DATA_CORRUPT.
- **Origine du conflit** :
  - Schema GraphQL `newbi-api/src/schemas/invoice.graphql:7` : `number: String!` (non-null)
  - Modèle Mongoose `newbi-api/src/models/Invoice.js:42-46` : `number` est `required: function() { return this.status !== "DRAFT" }` — autorisé null pour les brouillons
  - Le seed crée une facture `status: "DRAFT"` avec `number: null` (`e2e/seed/test-data.ts:223`, commentaire `// drafts have no number`) → conforme au modèle, viole le schema
- **RBAC** : aucun rôle dans la cause. Logs backend (`newbi-api/logs/combined.log:33827-33829`) montrent `op=invoices` autorisé pour `test-e2e@newbi.fr (owner)` sur l'org `bbbbbbbbbbbbbbbbbbbb0001` sans erreur côté middleware.
- **Impact estimé** :
  - **Toute organisation ayant au moins un DRAFT en DB** voit la liste factures planter avec ce message. C'est presque tous les comptes en prod (un brouillon non finalisé suffit).
  - Tests e2e impactés : `create-invoice.spec.js:261` (déjà rouge) ; `invoice-table.jsx` est aussi consommé par `useDashboardData.js:54` → potentiellement le dashboard home aussi.
  - À vérifier : autres types ayant des champs non-null mal alignés (Quote, CreditNote, PurchaseOrder ont des structures voisines).
- **Hypothèse de fix** : passer `Invoice.number` à nullable dans le schema GraphQL (`number: String` au lieu de `number: String!`) — c'est l'option qui s'aligne sur le modèle. Côté frontend, vérifier que `INVOICE_LIST_FRAGMENT` et tous les composants traitant `invoice.number` gèrent déjà la valeur null (probable, car les DRAFTs sont rendus dans la liste avec un placeholder type "—" en prod).
- **Owner suggéré** : backend (resolver / schema). Pas d'action e2e ou seed nécessaire.

---

## R2 — Kanban : poignée @dnd-kit introuvable (selector drift)

- **Découvert** : skip conditionnel `e2e/kanban/kanban-crud.spec.js:176` (`No @dnd-kit sortable handle found — UI selector drift`). Confirmé par `e2e/TODO.md` ligne 154 : "kanban-crud (sera remplacé par nouveau P0 subscription temps réel)".
- **Catégorie** : SELECTOR (régression UI cachée par un skip défensif)
- **Symptôme test** : le test "reorders columns with keyboard navigation" tente de localiser `[aria-roledescription*="sortable"], [data-dnd-kit-sortable]` sur `/dashboard/outils/kanban/<board>`. `count()` retourne 0 → skip silencieux, le test ne valide jamais le drag-and-drop clavier.
- **Impact** : couverture nulle sur le D&D kanban (feature critique, GraphQL subscriptions). Une régression D&D ne serait détectée qu'en revue manuelle.
- **Cause probable** : refonte du composant KanbanBoard sans préserver les attrs `aria-roledescription="sortable"` ou `data-dnd-kit-sortable` — soit la lib dnd-kit a changé d'API, soit le code applicatif a abandonné les data-attributes au profit d'autres handles.
- **Hypothèse de fix** : ouvrir `app/dashboard/outils/kanban/[id]/` et identifier comment le composant rend les colonnes/cartes draggables aujourd'hui. Probablement un `data-testid="kanban-column-handle"` à ajouter, OU mettre à jour le sélecteur du test si dnd-kit utilise un nouvel attr. Le TODO.md évoque un remplacement par "nouveau P0 subscription temps réel" — coordonner avant de fixer en surface.
- **Owner suggéré** : e2e (refonte du spec) + frontend (data-testid sur les handles).

---

## R3 — Bons de commande : bouton "Nouveau bon de commande" introuvable

- **Découvert** : skip conditionnel `e2e/purchase-orders/purchase-order-crud.spec.js:119` (`Bouton de création de BC non disponible`). Cohérent avec `e2e/TODO.md` ligne 248-277 : "GetNextPurchaseOrderNumber ne répond pas".
- **Catégorie** : BACKEND_BUG (cascade frontend) — le bouton ne se monte pas car la query GetNextPurchaseOrderNumber reste pending indéfiniment, bloquant le formulaire en step 1 (number == "" → bouton "Suivant" disabled). Le bouton "Nouveau bon de commande" sur la page liste pourrait avoir un symptôme distinct à vérifier.
- **Symptôme test** : `page.locator('button:has-text("Nouveau bon de commande")').isVisible({ timeout: 5000 })` retourne `false` → skip silencieux. Le test ne valide jamais l'ouverture du formulaire.
- **Impact** : couverture nulle sur le CRUD BC. Combinée à R3 backend (next number qui ne répond pas), tout le domaine BC est non-testé en e2e.
- **Hypothèse de fix** : double piste — (a) côté backend, identifier pourquoi `GetNextPurchaseOrderNumber` ne répond pas (resolver présent ? subscription bloque ?). (b) côté frontend, vérifier si le bouton "Nouveau bon de commande" est wrappé dans une condition `isReady` qui dépend de la query. Voir `useNextPurchaseOrderNumber` mentionné dans TODO.md.
- **Owner suggéré** : backend (resolver) + frontend (suppression du gating sur la query).

---

## R4 — Tests morts (skips systématiques liés au seed actuel)

Tests qui ne s'exécutent JAMAIS dans la configuration actuelle (le seed crée toujours un user PME trialing avec onboarding complété). Ils dorment depuis la création du fichier sans signal.

- `e2e/treasury/treasury-forecast.spec.js:60-90` "Si plan limité — message d'upgrade visible" : skippé via `if (!hasUpgrade)` — la bannière d'upgrade n'apparaît jamais pour un user PME. Pour le tester il faudrait soit un user/projet "free user" dédié, soit dégrader temporairement la subscription dans une fixture spécifique.
- `e2e/onboarding/onboarding-steps.spec.js:26-77` "Étape entreprise — champs SIRET/nom" + "Boutons de navigation entre étapes" (2 tests) : skippés via `if (!page.url().includes("/onboarding"))` — le seed marque `hasSeenOnboarding: true` et `onboardingCompleted: true`, l'utilisateur est immédiatement redirigé vers `/dashboard`. L'onboarding complet est déjà couvert par `e2e/onboarding/onboarding.spec.js` qui utilise une autre fixture.

**Décision** : marqués `test.fixme()` (commit ed0029e1). Les tests restent visibles dans le rapport Playwright comme TODO (annotation `fixme`, distincte d'un skip ordinaire) mais ne s'exécutent pas. Pour activer : créer un user de test "free" ou "fresh" (cf. `e2e/seed/test-data.ts`) ou un projet Playwright dédié, puis retirer le `.fixme` ET le check conditionnel interne `if (...) test.skip(...)` qui devient obsolète.

---

## R5 — Route `/dashboard/account` supprimée (test e2e à jour)

- **Découvert** : `e2e/a11y/dashboard-a11y.spec.js:17` testait `/dashboard/account` qui retournait HTTP 404 (page Next.js `not-found.jsx`). Le test a11y détectait alors un color-contrast sur la 404, masquant le vrai problème (route inexistante).
- **Catégorie** : TEST_OBSOLETE (route supprimée, fonctionnalité déplacée)
- **Symptôme** : `app/dashboard/account/page.jsx` n'existe plus. La requête `/dashboard/account` tombe sur `app/not-found.jsx` → 404.
- **Origine** : commit `8d21709a` (2026-02-25, "feature(ui): style sidebar, dialog invite members et navigation") a supprimé `app/dashboard/account/page.jsx` et `app/dashboard/account/formAccount.jsx`. Les composants modaux (`Setup2FAModal`, `ChangePasswordModal`, etc.) sont conservés sous `app/dashboard/account/components/` mais sont désormais consommés depuis `src/components/settings-modal.jsx` (modal accessible via la sidebar/profil), pas depuis une page dédiée.
- **Action prise** :
  - Retiré `/dashboard/account` du tableau `PAGES_TO_AUDIT` dans `e2e/a11y/dashboard-a11y.spec.js` (commit à venir).
  - Corrigé indépendamment le contraste de la 404 elle-même (`not-found.jsx` : `text-gray-400 → text-gray-600`).
- **Impact** : aucun pour les utilisateurs (le settings modal couvre la fonctionnalité). Pour la couverture e2e a11y : on perd l'audit a11y du compte/sécurité — à réintroduire en testant le modal au lieu d'une route, si jugé prioritaire.
- **Owner suggéré** : aucun fix backend/front nécessaire. Si on veut couvrir le modal en a11y : nouvelle spec qui ouvre le modal puis lance axe.

---

## R6 — A11y bouton primary CTA (contraste 4.4 vs 4.5 requis)

- **Découvert** : audit a11y du 2026-05-01, `e2e/A11Y_FIX_PLAN.md` G2
- **Catégorie** : DESIGN_DECISION (impact visuel marque)
- **Symptôme** : violation `color-contrast` (serious) sur `/auth/login` et `/auth/signup`. Ratio mesuré 4.4, requis WCAG AA 4.5. Le bouton primary utilise `#5A50FF` (couleur de marque) avec overlay `/90` au hover qui fait basculer le ratio sous le seuil.
- **Composant** : `src/components/ui/button.jsx:15` (variante primary)
- **Impact réel** : 0 (différence visuelle imperceptible). Bloquant pour conformité RGAA stricte ou audit accessibilité externe.
- **Options de fix** :
  - A) Assombrir le token primary `#5A50FF` → `#5044F0`. Touche tous les écrans utilisant la couleur de marque.
  - B) Retirer l'overlay `/90` au hover. Perte du feedback visuel hover.
  - C) Passer `font-medium` → `font-semibold` sur les boutons primary. Boutons plus gras partout.
- **Décision** : reportée. Pas de fix urgent — sera traité quand un audit RGAA, un client public ou une refonte design le rendra prioritaire.
- **Owner suggéré** : design (validation marque) + front (application).

---

## R7 — Perf : pages dashboard lentes à monter le RSC sous charge

- **Découvert** : tests `dashboard-home.spec.js:6` (sidebar visible), `dashboard-home.spec.js:37` (liens menu présents), `kanban-crud.spec.js:130` (reorder keyboard) — tous avec `page.goto Timeout` ou DOM minimal au moment de l'assertion.
- **Catégorie** : APP_PERF (intermittent, dépend de la charge dev server)
- **Symptôme** :
  - Sur `dashboard-home.spec.js:6` : la fixture `authenticatedPage` fait `goto("/dashboard", waitUntil: "domcontentloaded")`. Le DOM rendu après la fixture contient parfois uniquement `<button NewBi Logo disabled>` + `<button Toggle Sidebar>` — ni h1/h2 ni items de nav. Sous isolation d'un seul test : passe. Sous charge parallèle (worker=2) : fail intermittent.
  - Sur `kanban-crud.spec.js:130` : `page.goto("/dashboard/outils/kanban/new")` timeout systématiquement après 30s. La page kanban/new est connue lente (TODO.md ligne 137 mentionne d'autres pages avec le même symptôme).
- **Cause probable** :
  - `domcontentloaded` n'attend pas que les composants client React/Apollo soient mountés. La sidebar (`Sidebar` Shadcn) demande plusieurs hooks (`useSession`, `useSubscription`, `usePermissions`, `useWorkspace`) qui chaînent des queries GraphQL — sous charge le mount peut prendre >10s.
  - Pour kanban/new : composant heavy avec `@dnd-kit` + nombreux providers, mount plus lent que la médiane.
- **Impact e2e** :
  - 2 tests dashboard-home toujours fragiles (L6, L37) malgré les fix labels/wait posés dans le commit a6b0c921.
  - kanban-crud:130 reste rouge — couverture D&D clavier nulle (cumulé avec R2 dnd-kit handle, le D&D kanban est totalement non testé).
- **Hypothèses de fix** :
  - **e2e** : changer la fixture `authenticatedPage` pour utiliser `waitUntil: "networkidle"` (au prix de tests plus lents). Ou attendre un sélecteur stable monté tardivement (ex: nav `<aside data-sidebar>` rendu après hydration complète).
  - **App** : déplacer une partie des hooks dashboard dans des Server Components (Next App Router) pour mounter plus tôt. Ou fournir une page initiale shell statique avant l'hydration.
  - **Workaround court terme** : ajouter `await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {})` après le goto fixture (ne bloque pas si jamais réseau jamais idle).
- **Owner suggéré** : front (perf rendering) + e2e (robustesse fixture). Pas un fix backend.
