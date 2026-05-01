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
