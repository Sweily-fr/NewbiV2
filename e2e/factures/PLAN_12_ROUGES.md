# Plan d'action — 12 rouges restants suite factures

## 1. Résumé exécutif

Les 12 fails se réduisent à **5 causes racines distinctes** :

1. **R13 front** (4 tests) — useEffect manquant qui synchronise `dueDate`
   avec `issueDate` sur l'éditeur. Bug app confirmé, fix src front.
2. **Combobox client UI flaky** (3 tests) — sélecteur Radix
   `[data-radix-popper-content-wrapper]` ne se monte pas à temps dans
   3 tests UI distincts. **Un seul fix de sélecteur résout 3 tests.**
3. **2 bugs app backend** (2 tests) — `updateInvoice` accepte le
   changement de `number` sur PENDING (viole §4.7) ; `shippingAddress`
   non requis quand `billShipping=true` à cause d'un validator
   Mongoose subdoc défectueux.
4. **2 tests buggés** (2 tests) — `numbering-format` T3 +
   `numbering-settings-isolation` T3 testent un default `F-YYYYMM` qui
   n'existe pas dans le resolver (le code hérite du préfixe de la
   dernière facture du workspace, cf `invoice.js:1056-1072`).
   **Un seul ajustement d'assertion par fichier.**
5. **1 ECONNRESET réseau** (1 test) — `situations-conversion` T4.
   Ponctuel, non reproductible, pas d'action immédiate.

Recommandation top-line en section 4.

---

## 2. Détail par fail

### Bloc R13 — Front useEffect manquant (4 fails)

#### Fail #1 — `due-date-recalc.spec.js:171` Test 2.1

- **Erreur** : `expect(actualDue).toBe(expectedDue)` — dueDate ne se
  recalcule pas quand issueDate change via event DOM.
- **Catégorie** : A — BUG APP CONFIRMÉ.
- **Documenté** : R13 dans `REGRESSIONS_TO_FIX.md`. Tests laissés
  rouges volontairement comme filet de sécurité.
- **Fix** : src front — ajouter useEffect dans `InvoiceInfoSection.jsx`
  qui watche `issueDate` + délai et resync `dueDate`.

#### Fail #2 — `due-date-recalc.spec.js:197` Test 2.2

- Idem #1, délai 60j.

#### Fail #3 — `due-date-recalc.spec.js:219` Test 2.3

- Idem #1, délai 15j.

#### Fail #4 — `due-date-recalc.spec.js:260` Test 2.5

- Idem #1, délai 0 ("à réception").

### Bloc Combobox client UI flaky (3 fails)

#### Fail #5 — `wizard-navigation.spec.js:56` Test 3.2

- **Erreur** : `expect(locator).toBeVisible()` fail sur
  `[data-radix-popper-content-wrapper] button:has-text("Entreprise Alpha SAS")`
  après 10s.
- **Catégorie** : C — FLAKE INFRA / B — BUG TEST sélecteur fragile.
- **Cause probable** : le popper Radix monte le dropdown dans un
  portal, après une animation et un fetch des clients. Le sélecteur
  cible le wrapper du popper avant qu'il soit hydraté.
- **Historique** : flaky depuis phase 3 (DB chargée), persiste après
  R16 fix. Probablement un timing UI indépendant de la charge DB.

#### Fail #6 — `wizard-navigation.spec.js:88` Test 3.3

- Idem #5, même sélecteur. Le test sélectionne le client, puis le
  désélectionne — premier `await selectSeededClient` casse au même
  endroit.

#### Fail #7 — `validation-erreurs.spec.js:115` Test 4

- Même sélecteur que #5/#6 dans le helper `selectSeededClient`.
  Mêmes symptômes.

### Bloc Bugs app backend (2 fails)

#### Fail #8 — `edit-delete.spec.js:74` Test 2

- **Erreur** : test crée PENDING #0020, appelle updateInvoice avec
  number="9999" → reçoit `updated.number = "9999"` (au lieu de
  l'invariant attendu "0020" ou erreur).
- **Catégorie** : A — BUG APP CONFIRMÉ. §4.7 dit prefix/number
  verrouillés après PENDING ; le resolver `updateInvoice`
  (invoice.js:1547-1565) check seulement la duplicate uniqueness, pas
  l'invariant général "no change on PENDING".
- **Pourquoi rouge maintenant** : avant R16 fix, "9999" se trouvait
  probablement déjà dans le workspace (résidu de runs antérieurs), donc
  le check uniqueness rejettait. Avec sweep, "9999" est libre, donc le
  resolver accepte → bug révélé. **R16 fix a EXPOSÉ ce bug.**
- **Fix** : src backend — `updateInvoice` doit retirer `input.number`
  et `input.prefix` si `invoiceData.status !== "DRAFT"`.

#### Fail #9 — `validation-erreurs.spec.js:151` Test 5

- **Erreur** : créer une facture avec `shipping.billShipping=true`
  mais `shippingAddress` absent → `json.errors` est `undefined` (la
  facture est créée sans rejet).
- **Catégorie** : A — BUG APP CONFIRMÉ.
- **Cause** : le validator Mongoose
  `shippingAddress.required: function() { return this.billShipping; }`
  (cf `models/schemas/shipping.js:18`) ne fonctionne pas comme prévu
  en subdocument context. `this` n'expose pas correctement les sibling
  fields du subdoc lors de la validation — résultat : la condition
  retourne falsy → shippingAddress reste optionnel.
- **Fix** : src backend — soit (a) corriger le validator pour utiliser
  `this.parent?.shipping?.billShipping` (Mongoose subdoc syntax), soit
  (b) déplacer la validation dans le resolver explicitement.

### Bloc Tests buggés (2 fails)

#### Fail #10 — `numbering-format.spec.js:96` Test 3

- **Erreur** : `expect(inv.prefix).toMatch(/^F-\d{6}$/)`, reçu
  "INVOICE-1-".
- **Catégorie** : B — BUG TEST.
- **Cause** : le test crée une facture sans `prefix`, s'attend à ce
  que le default Mongoose `F-YYYYMM` s'applique. **Mais le resolver
  intercepte avant** (invoice.js:1056-1072) : si `input.prefix`
  est absent, il prend le `prefix` de la dernière facture du
  workspace. Le default Mongoose ne s'applique QUE si aucune facture
  n'existe dans le workspace — cas quasi-impossible vu le seed.
- **Fix test** : (a) ajuster l'assertion pour matcher "le prefix de
  la facture précédente OU F-YYYYMM" ; (b) OU forcer un workspace
  vide via cleanup avant le test.

#### Fail #11 — `numbering-settings-isolation.spec.js:143` Test 3

- **Erreur** : même pattern que #10. Reçu "L4T2A5486-" (un préfixe
  unique posé par un test précédent du même fichier).
- **Catégorie** : B — BUG TEST.
- **Cause** : identique à #10. L'assertion devrait être ajustée — le
  resolver hérite du prefix précédent, pas du default Mongoose.
- **Fix test** : idem #10.

### Bloc Transient (1 fail)

#### Fail #12 — `situations-conversion.spec.js:179` Test 4

- **Erreur** : `apiRequestContext.post: read ECONNRESET` sur POST
  GraphQL.
- **Catégorie** : C — FLAKE INFRA réseau.
- **Cause** : connexion réseau réinitialisée mid-request. Le backend
  peut avoir crashé brièvement (memory pressure du test env) ou un
  socket s'est fermé proprement. Non reproductible — passe sur retry.
- **Fix** : aucun direct. Le `test.describe.configure({ retries: 1 })`
  est déjà en place. Si récurrent, investiguer la stabilité du backend
  en test env.

---

## 3. Plan d'action priorisé

### 🟢 QUICK WIN (< 30 min/item)

| #   | Test                                          | Action                                                                                                                                                                                      | Effort | Tests verts gagnés | Risque                                                         |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------ | -------------------------------------------------------------- |
| QW1 | `numbering-format.spec.js:96` T3              | Remplacer l'assertion `toMatch(/^F-\d{6}$/)` par `toMatch(/^[A-Za-z0-9-]+$/) ` ou capturer le prefix d'une précédente facture du workspace en `beforeAll` et asserter `toBe(latestPrefix)`. | 15 min | +1                 | Faible — l'invariant testé n'est plus pertinent vu le resolver |
| QW2 | `numbering-settings-isolation.spec.js:143` T3 | Identique à QW1 — ajuster l'assertion.                                                                                                                                                      | 15 min | +1                 | Idem QW1                                                       |

**Total quick win** : 2 tests passants en ≤30 min.

### 🟡 EFFORT MOYEN (1-3h/item)

| #   | Tests                                                  | Action                                                                                                                                                                                                                        | Effort | Tests verts gagnés | Risque                                                                                                             |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| EM1 | `wizard-navigation` T3.2/3.3 + `validation-erreurs` T4 | Refacto du helper `selectSeededClient` partagé : remplacer le sélecteur popper fragile par un wait explicite sur la query Apollo `GetClients` puis `getByRole("option", { name })` ou un sélecteur `data-testid` plus stable. | 1-2h   | +3                 | Moyen — risque de casser d'autres tests qui dépendent du même helper. À tester en isolation puis en suite complète |

**Total effort moyen** : 3 tests passants en ~2h.

### 🔴 EFFORT FORT (> 3h ou fix src)

| #   | Tests                                | Action                                                                                                                                                                                                                                                           | Effort                           | Tests verts gagnés | Risque                                                                                                                        |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| EF1 | 4 R13 due-date Tests 2.1/2.2/2.3/2.5 | Fix src front : ajouter useEffect `[issueDate, paymentDelay]` dans `InvoiceInfoSection.jsx` qui resync dueDate. Cf REGRESSIONS_TO_FIX.md R13 pour la solution proposée.                                                                                          | 3-5h (front + manual QA)         | +4                 | Élevé — touche l'éditeur de facture, peut affecter les flows de création/édition existants. Test manuel obligatoire           |
| EF2 | `edit-delete.spec.js:74` T2          | Fix src backend : dans `updateInvoice`, ignorer `input.number` et `input.prefix` quand `invoiceData.status !== "DRAFT"` (ou throw `STATUS_LOCKED_ERROR`). Compliance §4.7.                                                                                       | 2-3h (backend + tests existants) | +1                 | Moyen — pourrait casser un usage admin légitime ; vérifier qu'aucun user-flow normal ne dépend de modifier number sur PENDING |
| EF3 | `validation-erreurs.spec.js:151` T5  | Fix src backend : corriger le validator Mongoose subdoc dans `models/schemas/shipping.js`. Options : (a) `this.ownerDocument()?.shipping?.billShipping` ; (b) déplacer le check dans le resolver `createInvoice` ligne ~1166 (juste avant `new Invoice({...})`). | 1-2h                             | +1                 | Faible — la validation devrait déjà être en place ; on rétablit le comportement attendu                                       |

**Total effort fort** : 6 tests passants si tous fixés. Mais ce sont
des fixes src qui dépassent le scope tests, à arbitrer produit/compliance.

### ⚫ À SKIPPER POUR L'INSTANT

| #   | Test                                    | Raison                                                                                                                                       |
| --- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| SK1 | `situations-conversion` T4 — ECONNRESET | Flake réseau ponctuel non reproductible. `retries: 1` déjà configuré ; si récurrent, investiguer la stabilité backend test env, pas le test. |

---

## 4. Recommandation finale

**À la place de Dylan, je ferais EM1 — refacto du helper
`selectSeededClient` partagé.**

Pourquoi :

- **ROI maximal** : 3 tests verts pour 1-2h d'effort, et le helper
  est partagé entre 3 specs distincts → un seul fix.
- **Pas de risque src** : tout reste dans `e2e/`, pas de fix
  applicatif. Pas de QA manuel, pas de produit, pas d'arbitrage.
- **Levier d'effet** : ce helper sert aussi dans d'autres specs
  (`crud-ui`, `validation-erreurs`) — la stabilisation rend la suite
  globalement moins flaky. C'est l'investissement infra le plus
  rentable.
- **Pas de dette ajoutée** : on remplace un sélecteur Radix interne
  (`data-radix-popper-content-wrapper`) — qui est un anti-pattern — par
  une approche orientée rôle/testid plus stable.

QW1+QW2 (les 2 ajustements d'assertion numbering) sont des _trivial
bonus_ qu'on fait dans la foulée en 30 min.

EF1/EF2/EF3 sont des **fixes app**, donc à arbitrer avec produit :
R13 et le bug shipping sont des vraies régressions à fixer ; le bug
PENDING-number-update est une compliance FR à prioriser indépendamment
des tests.

---

**Plan terminé. Lis e2e/factures/PLAN_12_ROUGES.md, dis-moi quels
items du plan tu valides pour exécution.**
