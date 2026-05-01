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

**Décision attendue** : supprimer ces 3 tests OU créer un user/projet "fresh" (onboarding non complété + pas de subscription) qui sache les exécuter. Suppression suggérée si la couverture est jugée redondante avec `onboarding.spec.js` et que le flow upgrade n'est pas une priorité immédiate.
