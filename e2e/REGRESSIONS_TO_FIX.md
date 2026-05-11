# Régressions à corriger (hors scope "réparation sélecteurs")

## R1 — GetInvoices : erreur de chargement page liste factures ✅ RÉSOLU 2026-05-04

**Fix appliqué (Mission B)** : `Invoice.number: String!` → `Invoice.number: String` dans `newbi-api/src/schemas/invoice.graphql:7`. Le seed e2e (`e2e/seed/test-data.ts`) repasse à `number: null` pour le DRAFT, ce qui reflète l'état prod réel et valide le fix. Test de régression ajouté dans `newbi-api/__tests__/resolvers/invoice.resolver.test.js` ("does not crash when a DRAFT invoice has a null number"). Quote/PO/CreditNote conservés `String!` car leurs modèles Mongoose ont `required: true`.

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
- **Workaround e2e appliqué (2026-05-03)** : le seed crée maintenant `invoiceDraft.number = "DRAFT-0001"` et `quoteDraft.number = "DRAFT-0001"` (au lieu de `null`) pour aligner sur ce que le resolver génère réellement pour les DRAFTs créés via UI/mutation (cf `invoice.js:1118-1122`). Permet aux tests UI de charger `/factures` et `/devis`. Le fix produit (schema nullable) reste à faire côté backend pour les utilisateurs prod qui ont des DRAFTs antérieurs au déploiement de cette norme. Voir `e2e/seed/test-data.ts:223,404` pour le commentaire en place.

---

## R2 — Kanban : poignée @dnd-kit introuvable (selector drift) ✅ RÉSOLU 2026-05-04

**Fix appliqué (Mission B)** : ajout de `data-testid="kanban-column-handle"` (+ `data-column-id`) sur le header draggable dans `app/dashboard/outils/kanban/[id]/components/KanbanColumn.jsx`. Le test `e2e/kanban/kanban-crud.spec.js` cible désormais ce sélecteur stable et n'utilise plus de skip silencieux ; il attend que le handle soit visible avec timeout 15s avant de simuler le drag clavier.

- **Découvert** : skip conditionnel `e2e/kanban/kanban-crud.spec.js:176` (`No @dnd-kit sortable handle found — UI selector drift`). Confirmé par `e2e/TODO.md` ligne 154 : "kanban-crud (sera remplacé par nouveau P0 subscription temps réel)".
- **Catégorie** : SELECTOR (régression UI cachée par un skip défensif)
- **Symptôme test** : le test "reorders columns with keyboard navigation" tente de localiser `[aria-roledescription*="sortable"], [data-dnd-kit-sortable]` sur `/dashboard/outils/kanban/<board>`. `count()` retourne 0 → skip silencieux, le test ne valide jamais le drag-and-drop clavier.
- **Impact** : couverture nulle sur le D&D kanban (feature critique, GraphQL subscriptions). Une régression D&D ne serait détectée qu'en revue manuelle.
- **Cause probable** : refonte du composant KanbanBoard sans préserver les attrs `aria-roledescription="sortable"` ou `data-dnd-kit-sortable` — soit la lib dnd-kit a changé d'API, soit le code applicatif a abandonné les data-attributes au profit d'autres handles.
- **Hypothèse de fix** : ouvrir `app/dashboard/outils/kanban/[id]/` et identifier comment le composant rend les colonnes/cartes draggables aujourd'hui. Probablement un `data-testid="kanban-column-handle"` à ajouter, OU mettre à jour le sélecteur du test si dnd-kit utilise un nouvel attr. Le TODO.md évoque un remplacement par "nouveau P0 subscription temps réel" — coordonner avant de fixer en surface.
- **Owner suggéré** : e2e (refonte du spec) + frontend (data-testid sur les handles).

---

## R3 — Bons de commande : bouton "Nouveau bon de commande" introuvable ✅ RÉSOLU 2026-05-04

**Fix appliqué (Mission B)** : ajout de `data-testid="new-purchase-order-button"` sur le `<PermissionButton>` dans `app/dashboard/outils/bons-commande/page.jsx`. Le test e2e cible le testid au lieu du texte ("Vérification..." est rendu pendant le check de permissions). Timeouts élargis à 20s pour `toBeVisible`/`toBeEnabled` pour absorber le délai du `getFullOrganization` Better Auth en CI. La query `nextPurchaseOrderNumber` côté résolveur est déjà couverte par `__tests__/resolvers/purchase-order.resolver.test.js:202-243` et reste verte.

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
- **Tentative de workaround e2e (2026-05-01, commit b9049bc3) — ÉCHEC documenté** :
  - `waitFor [data-sidebar="menu"]` : matchait l'`<ul>` du logo en SSR avant hydration, pas d'amélioration.
  - `waitFor getByRole("button", "Accueil")` : timeout 30s quand la sidebar reste collapsed, +1 fail.
  - `waitForLoadState("networkidle", 15s)` : stabilise L6 mais casse L54 (Apollo cache-first ne re-fetch pas après reload si déjà chaud).
  - Décision : revert au state initial (`domcontentloaded` seul). Le fix doit venir côté src/ (perf hooks dashboard) ou test par test (waitFor explicite sur sélecteur stable, déjà appliqué à L37 dans commit a6b0c921). Tentatives ultérieures sur la fixture devraient explorer une autre piste (ex: bypass authenticatedPage pour les tests dashboard et utiliser une fixture dédiée `dashboardReady` qui attend une condition spécifique au domaine du test).

---

## R8 — `restoreOrganization` casse le contexte org pour tous les specs après onboarding

- **Découvert** : run final phase B (commit 9ec04e02), cluster de 7 tests invoices qui utilisent `selectFirstClient()` rendent "Aucun client trouvé" malgré 9 clients seedés. Cause confirmée par replay direct GraphQL.
- **Catégorie** : SEED_BUG (impacte tous les specs alphabétiquement après `e2e/onboarding/onboarding.spec.js`)
- **Symptôme test** : combobox client s'ouvre, textbox de recherche actif, panel rend `<paragraph>Aucun client trouvé</paragraph>`. Sur `purchase-order-backend-p0:40` (raw GraphQL), erreur `FORBIDDEN: "Aucune organisation active trouvée"`.
- **Réponse GraphQL réelle** (capturée via curl avec cookie session de la fixture) :

```json
{
  "errors": [
    {
      "message": "Aucune organisation active trouvée. Veuillez rejoindre ou créer une organisation.",
      "extensions": { "code": "FORBIDDEN", "details": null },
      "path": ["clients"]
    }
  ]
}
```

- **État DB** : la collection `member` contient bien un document avec `_id: bbbbbbbbbbbbbbbbbbbb0002`, mais avec `userId` typé `string` au lieu d'`ObjectId`. Le RBAC middleware (`getActiveOrganization` côté Better Auth) lookup par ObjectId → ne trouve pas → fallback throw FORBIDDEN.
- **Composant frontend** : `app/dashboard/outils/factures/components/invoices-form-sections/client-selector.jsx:165` consomme `useClients()` → `GET_CLIENTS` → resolver retourne errors GraphQL → Apollo (avec `errorPolicy: "all"`) résout `clients = []` → message "Aucun client trouvé".
- **Variables envoyées** : `{ workspaceId: "bbbbbbbbbbbbbbbbbbbb0001", page: 1, limit: 50, search: "" }` — variables OK, ce n'est pas un bug de filtre.
- **Cause précise** : incohérence de typing entre le seed initial et le seed de restoration :
  - `e2e/global-setup.ts:146` (initial) : `userId: realUserId` → **ObjectId** ✅
  - `e2e/onboarding/seed-helpers.js:113` (restore après onboarding spec) : `userId: realUserId.toString()` → **string** ❌

  Better Auth's Mongo adapter coerce `userId` (déclaré comme `references: { field: "id" }` dans le schema) en ObjectId avant query. Un member avec `userId: string` est invisible aux lookups Better Auth. Le warning est explicitement documenté dans `global-setup.ts:135-141` mais la fonction `restoreOrganization` ajoutée ultérieurement ne respecte pas la convention.

- **Impact** :
  - **8 tests e2e bloqués** (cluster 7 invoices `selectFirstClient` + 1 `purchase-order-backend-p0:40`).
  - **Prod : aucun impact**. Le seed n'existe que dans les tests. Better Auth en prod écrit toujours en ObjectId via son adapter.
  - **Tests passants** : tous les specs alphabétiquement avant `onboarding/` (clients, dashboard, kanban, etc.) tournent sur le seed initial intact. Seuls ceux qui tournent APRÈS onboarding (afterAll restoreOrganization) sont impactés — d'où le pattern "fail uniquement sur les invoices" (alphabétiquement après onboarding).

- **Hypothèse de fix** : remplacer `userId: realUserId.toString()` par `userId: realUserId` ligne 113 de `e2e/onboarding/seed-helpers.js`. 1 ligne de code, fix 8 tests d'un coup.

- **Owner suggéré** : e2e (seed). Pas de fix backend ni frontend nécessaire.
- **État** : **PARTIELLEMENT RÉSOLU** (commit d02d6df1) — 5 tests récupérés sur 8 attendus :
  - ✅ `invoices/create-invoice.spec.js` × 4 (L95, L189, L216, L241)
  - ✅ `purchase-orders/purchase-order-backend-p0.spec.js:40`
  - ❌ `invoices/create-invoice-p0.spec.js:120, 138` + `create-deposit-invoice-p0:19` reclassés en **R7_PERF cascade** : `page.goto Timeout 45s` sur `/factures/new` (la page editor met >45s à monter sous charge — pas lié à R8). Voir R7.
- **Cascade observée — visual baselines invalidées** : le fix R8 a réveillé les visual tests (`e2e/visual/dashboard-visual.spec.js`, 52 tests pixel-à-pixel) qui étaient skippés au run précédent (108/30/133) parce que les pages dashboard échouaient en amont avec FORBIDDEN. Maintenant ces tests s'exécutent et 51/52 fail car les baselines `.png` ne matchent plus les fix UI a11y déjà commitées (`text-gray-700` footer, button trigger org-switcher, suppression wrappers `data-tutorial`, `text-gray-600` 404). À régénérer avec `npx playwright test --update-snapshots --project=chromium e2e/visual/` après validation design — hors scope phase B.

---

## R9 — Bulk delete sur sélection mixte : suppression partielle silencieuse

- **Découvert** : prompt 3 phase Tests Factures (commit pieges-critiques.spec.js Test 4)
- **Catégorie** : UX (suppression partielle non signalée à l'utilisateur)
- **Symptôme** : sur `/dashboard/outils/factures`, sélectionner via checkbox une facture DRAFT + une facture COMPLETED, cliquer "Supprimer (2)", confirmer dans l'AlertDialog → seul le DRAFT est supprimé. Le COMPLETED reste en base (verrou backend) sans aucun toast d'erreur côté UI.
- **Code source** :
  - `app/dashboard/outils/factures/components/invoice-table.jsx:494-530` rend l'AlertDialog avec un texte d'avertissement "Seules les factures en brouillon et les factures importées peuvent être supprimées" mais n'empêche pas la sélection.
  - `app/dashboard/outils/factures/hooks/use-invoice-table.js handleDeleteSelected` itère sur `selectedRows` et appelle `deleteInvoice` / `deleteImportedInvoice` en parallèle. Les rejets backend sont catchés silencieusement (Promise.all avec catch).
  - Backend : `newbi-api/src/resolvers/invoice.js deleteInvoice` rejette les COMPLETED (verrou §46.10 / `createResourceLockedError`).
- **Reproduction (test e2e)** : `e2e/factures/pieges-critiques.spec.js:319` (Test 4) crée 1 DRAFT + 1 COMPLETED, déclenche le bulk delete via UI, vérifie via `getInvoiceById` que le DRAFT est supprimé et le COMPLETED est conservé. Le test passe **au vert** car il documente le comportement actuel — mais ce comportement est mauvais UX.
- **Hypothèse de fix** :
  1. Pré-filtrer la sélection : désactiver la checkbox pour les COMPLETED/CANCELED (visuel "verrouillé") — `use-invoice-table.js` colonne `select`, ajouter `disabled={!row.original.deletable}`.
  2. OU afficher un toast d'erreur partielle après le delete : "1 facture supprimée, 1 facture verrouillée non supprimée".
  3. L'option 1 est plus défensive ; option 2 corrige juste le feedback. Idéalement combiner les deux.
- **Owner suggéré** : front (pré-filtrage UI). Pas de fix backend nécessaire — le verrou est correct.

---

## R10 — Impossible de matérialiser une PENDING avec dueDate dans le passé via mutation publique

- **Découvert** : prompt 3 phase Tests Factures (limitation rencontrée pour pieges-critiques.spec.js Test 2 §46.4)
- **Catégorie** : LIMITATION_TEST (pas un bug applicatif — un blocage de testabilité)
- **Contexte** : §46.4 documente un piège — l'onglet "En retard" filtre `status === "PENDING" && dueDate < now` côté front. Pour le tester proprement, il faut une PENDING avec `dueDate < today`. Impossible via la mutation publique :
  - **Mongoose** : validateur sur `dueDate` qui exige `dueDate >= issueDate`.
  - **Resolver** : `validateInvoiceIssueDate` (`newbi-api/src/resolvers/invoice.js:1161-1163`) exige `issueDate >= latestInvoiceIssueDate` pour tout statut ≠ DRAFT. Comme tous les tests précédents pushent latestInvoiceIssueDate à today, impossible de remonter.
  - **Transition DRAFT → PENDING** : `changeInvoiceStatus` (resolver:2229-2236) appelle aussi `validateInvoiceIssueDate`, donc même un DRAFT antidaté ne peut pas être finalisé avec dueDate passée.
  - **Seed** : contient `invoicePaid` (COMPLETED, dueDate=now-1j) qui aurait pu servir de canary "COMPLETED ne doit PAS apparaître en En retard". Mais avec >50 invoices créés par les tests CRUD, il sort du premier page (pagination=50, sort issueDate desc) et n'est plus accessible via tableau.
- **Conséquence** : `pieges-critiques.spec.js` Test 2 a été simplifié pour tester l'invariant STRUCTUREL (la PENDING fraîche avec dueDate future apparaît bien dans "Toutes" et "À encaisser" mais PAS dans "En retard"). La preuve "PENDING+dueDate passé apparaîtrait DANS En retard alors que COMPLETED+dueDate passé n'apparaîtrait PAS" reste théorique.
- **Hypothèse de fix (test infra)** :
  1. Ajouter une 2e facture seedée `invoicePaidVisible` créée avec une date plus récente, OU
  2. Ajouter une mutation backend "admin only" `setInvoiceFields` permettant de bypasser la validation pour les besoins de test, OU
  3. Faire un global-teardown qui purge les tests-créés invoices entre runs (rétablit la situation où invoicePaid est en page 1).
- **Owner suggéré** : e2e infra (option 3 la plus simple) ou backend (option 2 si on veut un canary fiable).

---

## R11 — Tests "default = today" instables : invoices futures non nettoyées par le teardown

- **Découvert** : prompt phase 1 Densification factures clients — `e2e/factures/issue-date-default.spec.js` Tests 1.1 et 1.2.
- **Catégorie** : LIMITATION_TEST (cascade du teardown ciblé)
- **Contexte** : R10 documente déjà l'impossibilité de matérialiser une PENDING avec dueDate dans le passé. R11 documente un effet de bord du même teardown ciblé : les invoices créées dynamiquement par les tests (Tests 1.3/1.4 ici, mais aussi tous les CRUD UI/mutation tests) restent en DB entre runs car `global-teardown.ts:35-38` ne supprime que les invoices avec `_id` seedé. Conséquence : `latestInvoiceIssueDate` est durablement > today après le 1er run qui crée une PENDING postdatée.
- **Symptôme** : Tests 1.1 et 1.2 (qui asseyent l'invariant "default = today quand latest ≤ today") skippent silencieusement à partir du 2e run. Ils ne sont vraiment exécutés qu'après un teardown manuel `db.invoices.deleteMany({ workspaceId: ... })` ou un fresh dev environment.
- **Mitigation appliquée (2026-05-07)** : les tests utilisent `test.skip(true, ...)` quand `latestInvoiceIssueDate > today`, plutôt que de faussement échouer. Le run reste vert mais la couverture est partielle.
- **Hypothèse de fix** :
  1. Étendre `global-teardown.ts` pour supprimer toutes les invoices de `IDS.organizationId` (pas juste celles seedées). Risque : casser les autres specs qui s'appuient sur la persistence inter-tests dans le même run (peu probable).
  2. Faire un `beforeAll` dans `issue-date-default.spec.js` qui delete les invoices futures du workspace.
  3. Combiner avec R10 — un setInvoiceFields admin-only permettrait de matérialiser ET nettoyer.
- **Owner suggéré** : e2e infra (option 1 ou 2). Pas de fix produit nécessaire.

---

## R12 — Impossible de créer une PENDING avec issueDate < today via mutation publique

- **Découvert** : prompt phase 1 Densification factures clients — `e2e/factures/issue-date-default.spec.js` Test 1.2.
- **Catégorie** : LIMITATION_TEST (équivalent à R10 mais sur issueDate au lieu de dueDate)
- **Contexte** : Le scénario du prompt pour Test 1.2 ("Crée une PENDING avec issueDate = aujourd'hui − 5 jours via mutation") n'est pas réalisable. Le resolver `validateInvoiceIssueDate` (cf invoice.js:1161-1163, et cf §45) exige `issueDate ≥ latestInvoiceIssueDate` pour tout statut ≠ DRAFT — par construction, on ne peut jamais antidater une PENDING au-delà de la PENDING la plus récente déjà en base.
- **Symptôme** : Test 1.2 ne peut pas matérialiser activement le scénario. Il a été restructuré pour fixer l'invariant FAIBLE "tant que latest ≤ today, default reste today (pas de drift en arrière)" — couvre la même règle §17 mais via un sous-cas pilotable.
- **Hypothèse de fix** : aucune côté produit (le rejet est correct par compliance FR). Côté test infra : option 2 de R10 (mutation admin-only de bypass) lèverait aussi cette limitation. Sinon, accepter que Test 1.2 soit un canary réduit.
- **Owner suggéré** : e2e infra (si bypass jugé pertinent). Pas de fix produit.

---

## R13 — Date d'échéance ne se recalcule pas quand l'utilisateur change la date d'émission

- **Découvert** : prompt phase 1 Densification factures clients — `e2e/factures/due-date-recalc.spec.js` Tests 2.1, 2.2, 2.3, 2.5.
- **Catégorie** : FRONTEND_BUG (gap fonctionnel — comportement spécifié par le produit, pas implémenté)
- **Symptôme** : sur `/dashboard/outils/factures/new`, quand l'utilisateur change la date d'émission via le Calendar (issueDate), la date d'échéance (dueDate) ne se recalcule pas automatiquement = `nouvelle issueDate + délai sélectionné`. Elle reste à sa valeur précédente (souvent `ancienne issueDate + 30j`).
- **Comportement attendu (rule produit)** : `dueDate = issueDate + N` où N est le délai courant (Select PAYMENT_TERMS_SUGGESTIONS). Doit re-fire à chaque changement d'`issueDate` ET à chaque changement de `N`. Couvre §17 (validation submit) et §45 (cohérence date).
- **État du code** :
  - Changer le Select délai → `onValueChange` recalcule explicitement dueDate (cf `InvoiceInfoSection.jsx:753-763`). Implémenté ✓ (Test 2.6 PASS).
  - Changer issueDate via Calendar → `onSelect` met à jour issueDate seulement (cf `InvoiceInfoSection.jsx:661-667`). Aucun useEffect ne watche `issueDate` pour resynchroniser dueDate. Non implémenté ✗ (Tests 2.1-2.5 FAIL).
- **Cas particulier confirmé** :
  - Test 2.5 (délai "Paiement à réception", N=0) : après sélection, dueDate = issueDate (correct, Select onValueChange). Mais après changement d'issueDate, dueDate reste figé sur l'ancienne valeur (ne suit pas).
- **Impact estimé** :
  - **UX** : l'utilisateur peut soumettre une facture avec dueDate < issueDate (`validateDueDate` bloque ce cas via RHF), OU avec un délai incohérent (35 jours au lieu de 30) sans s'en rendre compte. Conséquence : litiges paiement / pénalités de retard mal calculées.
  - **Validation existante** : la fonction `validateDueDate` (`InvoiceInfoSection.jsx:552-560`) interdit dueDate < issueDate, donc le pire cas (négatif) est bloqué. Mais un délai _supérieur_ au délai configuré passe sans avertissement.
- **Hypothèse de fix** : ajouter un `useEffect` dans `InvoiceInfoSection.jsx` qui watch `data.issueDate` ET stocke le délai courant en local state, puis re-set dueDate. Pseudo :

  ```js
  const [paymentDelay, setPaymentDelay] = React.useState(30);
  // ...
  React.useEffect(() => {
    if (!data.issueDate) return;
    const newDue = new Date(data.issueDate);
    newDue.setDate(newDue.getDate() + paymentDelay);
    setValue("dueDate", formatLocalDate(newDue), { shouldDirty: true });
  }, [data.issueDate, paymentDelay]);
  ```

  Et faire en sorte que le `Select onValueChange` mette à jour `paymentDelay` (au lieu de calculer dueDate inline). Le seul effet `[issueDate, paymentDelay]` recalcule alors dueDate dans les deux cas.

- **Owner suggéré** : front (composant `InvoiceInfoSection.jsx`). Pas de changement backend ni de schéma.

---

## R14 — Numérotation : pré-check resolver ignore `issueYear` (incohérent avec l'index unique)

- **Découvert** : prompt phase 2 Densification factures clients — `e2e/factures/numbering-sequential.spec.js` Test 6 (premier draft).
- **Catégorie** : BACKEND_BUG (non-bloquant, mais incohérence interne)
- **Symptôme** : l'index unique Mongoose sur `Invoice` (`prefix_number_workspaceId_year_unique`, cf `Invoice.js:537-549`) inclut explicitement `issueYear`. Cela autorise techniquement deux factures avec même `(prefix, number)` sur des années différentes — c'est exactement la sémantique de §4 R3 ("au 1er janvier le compteur repart à 0001").
- **Mais** le resolver `createInvoice` (cf `invoice.js:1131-1142`) pré-vérifie via une query qui **n'inclut pas** `issueYear` :

  ```js
  const existingInvoice = await Invoice.findOne({
    prefix,
    number: input.number,
    status: { $ne: "DRAFT" },
    workspaceId: workspaceId,
  });
  if (existingInvoice) {
    throw new AppError(`Le numéro de facture ${prefix}${input.number} existe déjà`, ...);
  }
  ```

  Donc une 2e facture avec même `(prefix, number)` mais `issueYear` différent est rejetée par le resolver, alors que l'index l'autoriserait.

- **Impact estimé** :
  - Faible en pratique : la convention métier R3 prévoit que le préfixe change à chaque année (F-2026- → F-2027-), donc le couple `(prefix, number)` est déjà unique par construction.
  - L'incohérence apparaît si un utilisateur garde le même préfixe d'une année à l'autre (ex. préfixe sans année), dans ce cas les numéros ne peuvent jamais se réinitialiser malgré l'index permissif.
  - Le pré-check est cohérent avec la compliance FR (séquentialité stricte sur tout l'historique d'un préfixe), donc la "bonne" interprétation est probablement : retirer `issueYear` de l'index plutôt que l'ajouter au resolver.
- **Hypothèse de fix** : aligner index et resolver. Soit (a) ajouter `issueYear` à la query du resolver pour matcher l'index, soit (b) retirer `issueYear` de l'index pour matcher le resolver. (b) est plus prudent compliance-wise.
- **Cible test** : `numbering-sequential.spec.js` Test 6 documente le comportement actuel (resolver-based) en testant via deux préfixes annuels distincts au lieu d'essayer la collision sur même préfixe + années différentes.
- **Owner suggéré** : backend (model + resolver à aligner).

---

## R15 — `changeInvoiceStatus` exige un MongoDB replica set, infaisable sur le test env standalone

- **Découvert** : prompt phase 3 (Pièges §46) — `e2e/factures/pieges-critiques.spec.js` Test 7 (§46.9 préfixe DRAFT → PENDING).
- **Catégorie** : LIMITATION_TEST + FRONTEND_BUG méta (deux paths divergents sur la même transition)
- **Symptôme** : la mutation `changeInvoiceStatus(id, "PENDING")` lève côté backend :

  ```
  "Erreur lors de la vérification des permissions: Transaction numbers
   are only allowed on a replica set member or mongos"
  ```

  Cause racine : le resolver utilise `mongoose.startSession()` +
  `session.withTransaction(...)` (cf `invoice.js:2280-2334`) pour
  encapsuler le rename atomique du brouillon. MongoDB transactions
  exigent un replica set ; le test e2e tourne sur un standalone
  (`mongodb://localhost:27017/invoice-app-test`).

- **Conséquence** :
  - Le path dynamique de `changeInvoiceStatus` ne peut pas être testé
    sur le test env actuel.
  - `pieges-critiques.spec.js` Test 7 (§46.9) a été restructuré pour
    fixer uniquement l'invariant STATIQUE "préfixe DRAFT préservé à la
    lecture". L'invariant dynamique "préfixe recalculé à la finalisation"
    reste non testé.
- **Écart code méta** : `updateInvoice` (cf `invoice.js:1900-1970`) gère
  AUSSI la transition DRAFT → PENDING mais sans transaction et avec
  une logique préfixe DIFFÉRENTE (préserve `invoiceData.prefix` au
  lieu de l'écraser avec `lastInvoice.prefix`). Donc le préfixe final
  d'une facture finalisée dépend de la mutation utilisée — incohérence
  applicative à clarifier.
- **Hypothèses de fix** :
  1. Configurer le test env Mongo en mode replica set (init via
     `rs.initiate()` ou `mongod --replSet rs0` dans le compose). Solution
     officielle pour tester les transactions.
  2. Wrapper le resolver avec un fallback non-transactionnel quand
     `session.withTransaction` n'est pas disponible (perte de l'atomicité
     mais permet le test).
  3. Aligner `updateInvoice` et `changeInvoiceStatus` sur la même logique
     préfixe — supprime l'écart méta-§46.9 et facilite le testing.
- **Owner suggéré** : e2e infra (option 1) ou backend (options 2/3).

---

## R16 — Charge DB cumulative : 530+ invoices résiduelles font flaker la suite full

- **Découvert** : phase 4 — full suite factures (`npx playwright test e2e/factures/`). Run en isolation des nouveaux tests `invariants-business.spec.js` : 9/9 verts. Run de la suite complète : 76 passed / 12 failed dont 8 nouveaux échecs (situations-conversion, pieges-critiques) qui passaient en phase 3.
- **Catégorie** : LIMITATION_TEST (cumul direct de R10/R11 — invoices créées par les tests + jamais nettoyées par le teardown).
- **Symptômes des échecs** :
  - Erreurs récurrentes `TypeError: Cannot read properties of undefined (reading 'createInvoice'/'createQuote')` dans les tests qui appellent `r.data.X` sans guard. Ça arrive quand la mutation GraphQL renvoie `{ errors: [...] }` ou timeout.
  - `mongosh ... db.invoices.countDocuments(...)` reporte **530 invoices** dans le workspace de test (vs 354 mesurés en phase 2). Croissance ~50/run.
  - Les queries qui scannent toute la collection (`latestInvoiceIssueDate`, `getInvoices` page 1, `nextInvoiceNumber` en autoNumbering) deviennent lentes → timeout 30s helpers, donc les mutations qui en dépendent (`validateInvoiceIssueDate` dans `createInvoice` non-DRAFT) sont vues comme "failed" au niveau test.
- **Tests touchés en phase 4** :
  - 5 situations-conversion (Tests 1-5) : tous échouent au create du devis ou de la facture liée
  - 3 pieges-critiques (Tests 7, 9, 10) : échec sur create DRAFT/PENDING ou sur la lecture
  - 4 due-date-recalc (R13, déjà documenté pré-existant)
- **Hypothèse de fix (test infra)** :
  1. Étendre `global-teardown.ts` pour `db.invoices.deleteMany({ workspaceId: TEST_ORG, _id: { $nin: [seeded ids] } })`. Ne supprime que les invoices dynamiquement créées dans le workspace test, pas les seedées. **Solution prudente, recommandée**.
  2. Ajouter un `beforeAll` dans chaque fichier qui crée des invoices, appelant la même purge ciblée (effort dispersé).
  3. Faire un teardown global qui délimite par `_id` créé après `Date.now() - SESSION_START`.
- **Impact compliance/audit** : aucun (test env dédié `invoice-app-test`, jamais en prod).
- **Workaround temporaire** : exécuter `mongosh ... deleteMany(...)` manuellement entre les runs (cf phase 1 où on était à 354).
- **Owner suggéré** : e2e infra (option 1).
