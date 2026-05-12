# Audit exploratoire — phase 4

> Lecture directe du resolver `newbi-api/src/resolvers/invoice.js`
> (2956 lignes) + modèle `Invoice.js` (567 lignes) + résolution
> intermutation. Le but : trouver des invariants métier importants
> non couverts par les 82 tests actuels.

## Section 1 — Invariants observés dans le code

### Resolver `createInvoice` (invoice.js:843-1500)

| Ligne     | Garde-fou                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| 853-867   | `workspaceId` requis + `companyName` org requis (`COMPANY_INFO_REQUIRED`) — sinon error                                 |
| 875-884   | `prefix` regex `/^[A-Za-z0-9-]*$/` — pas d'espaces ni caractères spéciaux                                               |
| 887-897   | `purchaseOrderNumber` regex `/^[A-Za-z0-9-]*$/` — pas d'espaces ni caractères spéciaux                                  |
| 899-1054  | Si `invoiceType=situation` + `purchaseOrderNumber` → cumul TTC ≤ contractTotal du devis (sinon `validationError`)       |
| 1131-1142 | Si `input.number` fourni : check duplicate `(prefix, number, status≠DRAFT, workspaceId)` → DUPLICATE_ERROR              |
| 1161-1163 | Pour status ≠ DRAFT : `validateInvoiceIssueDate` (issueDate ≥ latestInvoiceIssueDate)                                   |
| 1180-1200 | Si client SANS `id` (= nouveau client) : check unicité email contre Quote + Invoice (sinon error "email déjà utilisée") |
| 1203-1213 | Si `client.hasDifferentShippingAddress=true` mais pas `client.shippingAddress` → error                                  |

### Resolver `updateInvoice` (invoice.js:1500-1500+)

| Ligne         | Garde-fou                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1531-1538     | COMPLETED non modifiable (sauf admin/owner) → `createResourceLockedError`                                           |
| 1540-1543     | CANCELED **JAMAIS** modifiable (lock total)                                                                         |
| 1547-1565     | Changer `number` sur PENDING : check duplicate avec autres PENDING/COMPLETED                                        |
| **1568-1583** | **Changer `issueYear` sur facture finalisée → INTERDIT (`createValidationError`)** — invariant compliance comptable |
| 1591-1600     | `prefix` regex (cf createInvoice)                                                                                   |
| 1603-1614     | `purchaseOrderNumber` regex                                                                                         |
| 1900-1970     | DRAFT → finalized : préfixe préservé (cf R15)                                                                       |

### Resolver `changeInvoiceStatus` (invoice.js:2183+)

| Ligne     | Garde-fou                                                                           |
| --------- | ----------------------------------------------------------------------------------- |
| 2218-2225 | Transitions interdites :                                                            |
|           | - COMPLETED → ANY                                                                   |
|           | - CANCELED → ANY                                                                    |
|           | - PENDING → DRAFT (régression)                                                      |
|           | - ANY → DRAFT (sauf no-op DRAFT → DRAFT)                                            |
| 2228-2236 | DRAFT → PENDING : validateInvoiceIssueDate                                          |
| 2240-2275 | DRAFT → PENDING : snapshot `companyInfo` + `client` figés à la finalisation         |
| 2278-2334 | DRAFT → PENDING : transaction Mongo (R15 — replica set requis, infaisable test env) |

### Resolver `markInvoiceAsPaid` (invoice.js:2452+)

| Ligne     | Garde-fou                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------- |
| 2487-2495 | DRAFT → COMPLETED **interdit** (`createStatusTransitionError`) — pas de "marquer payée" depuis brouillon |
| 2497-2503 | CANCELED → COMPLETED **interdit**                                                                        |
| 2505-2515 | COMPLETED + même `paymentDate` → no-op                                                                   |
| 2520      | Sinon : status="COMPLETED" + paymentDate set                                                             |

### Resolver `createLinkedInvoice` (invoice.js:2645+)

| Ligne     | Garde-fou                                                                         |
| --------- | --------------------------------------------------------------------------------- |
| 2658-2663 | `amount` doit être un nombre **> 0** (sinon `validationError`)                    |
| 2667-2671 | Devis doit exister + appartenir au workspace                                      |
| 2683-2690 | Devis doit être **COMPLETED** (sinon `validationError`)                           |
| 2693-2698 | Max **3** factures liées par devis (R14 — déjà testé en situations-conversion T2) |
| 2718-2722 | Un seul acompte par devis (déjà testé en situations-conversion T3)                |
| 2727-2738 | `amount` ≤ `quote.finalTotalTTC - alreadyInvoiced` (reste à facturer)             |
| 2740-2750 | Si dernière facture (3e) ou reste exact → amount doit valoir EXACTEMENT le reste  |

### Resolver `deleteInvoice` (invoice.js:2108+)

| Ligne     | Garde-fou                                                                             |
| --------- | ------------------------------------------------------------------------------------- |
| 2127-2131 | COMPLETED non supprimable (`createResourceLockedError`) — déjà testé `edit-delete` T4 |

### Modèle Mongoose `Invoice.js`

| Ligne     | Validator                                                            |
| --------- | -------------------------------------------------------------------- |
| 35-39     | prefix max 10 chars (testé numbering-format T6)                      |
| 50-58     | number regex `/^[A-Za-z0-9-]{1,50}$/` (testé numbering-free-mode T5) |
| **64-72** | **dueDate ≥ issueDate** (validator) — pas testé directement          |
| 99-104    | items array doit avoir au moins 1 élément (testé crud-mutations T10) |
| 80-82     | invoiceType enum: standard / deposit / situation                     |
| 117       | status enum (INVOICE_STATUS values)                                  |
| 537-549   | Index unique `(prefix, number, workspaceId, issueYear)` (R14)        |

---

## Section 2 — Couverture actuelle par invariant

| Invariant                                           | Statut                       | Test couvrant                                   |
| --------------------------------------------------- | ---------------------------- | ----------------------------------------------- |
| Prefix regex (caractères non autorisés)             | ❌ NON                       | numbering-format ne couvre que length           |
| Prefix max 10 chars                                 | ✅ DONE                      | numbering-format T6                             |
| purchaseOrderNumber regex                           | ❌ NON                       | —                                               |
| Cumul situation ≤ contractTotal                     | ✅ DONE                      | situations-conversion T4                        |
| Items vides rejetés                                 | ✅ DONE                      | crud-mutations T10                              |
| Email duplicate (nouveau client sans id)            | ❌ NON                       | —                                               |
| Shipping address requise (hasDifferentShippingAddr) | ❌ NON                       | (validation-erreurs T5 = billShipping diff)     |
| Year change forbidden on finalized                  | ❌ NON (CRITIQUE compliance) | —                                               |
| Number duplicate sur update PENDING                 | ❌ NON                       | —                                               |
| markAsPaid sur DRAFT rejeté                         | ❌ NON                       | —                                               |
| markAsPaid sur CANCELED rejeté                      | ❌ NON                       | —                                               |
| markAsPaid sur PENDING → COMPLETED                  | ✅ DONE                      | edit-delete T5                                  |
| changeInvoiceStatus PENDING → DRAFT forbidden       | ❌ NON                       | —                                               |
| changeInvoiceStatus COMPLETED → ANY forbidden       | ❌ NON                       | —                                               |
| changeInvoiceStatus CANCELED → ANY forbidden        | ❌ NON                       | —                                               |
| Suppression COMPLETED refusée                       | ✅ DONE                      | edit-delete T4                                  |
| Update COMPLETED refusé sauf admin                  | ❌ NON                       | —                                               |
| Update CANCELED refusé total                        | ✅ partiel                   | edit-delete T6 (via update bloqué après cancel) |
| createLinkedInvoice amount ≤ 0                      | ❌ NON                       | —                                               |
| createLinkedInvoice quote non-COMPLETED             | ❌ NON                       | —                                               |
| createLinkedInvoice amount > remaining              | ❌ NON                       | —                                               |
| createLinkedInvoice limite 3                        | ✅ DONE                      | situations-conversion T2 (§46.19)               |
| createLinkedInvoice un seul acompte                 | ✅ DONE                      | situations-conversion T3 (§21.1)                |
| dueDate < issueDate rejeté                          | ❌ NON                       | —                                               |
| Snapshot companyInfo/client à la finalisation       | ❌ partiel                   | (R15 bloque le test direct)                     |

---

## Section 3 — Recommandations : top invariants à tester en priorité

### 🔴 CRITIQUE — compliance comptable / pertes financières

**1. Year change forbidden on finalized invoice** (invoice.js:1568-1583)

- Description : `updateInvoice` rejette le changement d'année sur PENDING/COMPLETED. C'est la garde-corps qui empêche un user de réécrire silencieusement une facture émise dans une autre année (= violation compliance FR).
- Impact si régression : facture "F-202612-0042" 2026 réécrite en "F-202712" sans nouvelle séquence → fraude possible, contrôle fiscal en péril.
- Test : raw GraphQL — créer PENDING avec issueDate=2026-X, tenter `updateInvoice` avec issueDate=2027-X → erreur attendue.
- Effort : Faible (1 test, ~30 lignes).

**2. markAsPaid sur DRAFT rejeté** (invoice.js:2487-2495)

- Description : un brouillon ne peut PAS être marqué comme payé. Doit d'abord être finalisé.
- Impact : invariant comptable — payer une facture qui n'existe pas encore comme document légal.
- Test : raw — créer DRAFT, appeler `markInvoiceAsPaid` → erreur `STATUS_TRANSITION_ERROR`.
- Effort : Faible (~20 lignes).

**3. markAsPaid sur CANCELED rejeté** (invoice.js:2497-2503)

- Description : une facture annulée ne peut pas être marquée payée.
- Impact : invariant comptable — facture canceled + payée = état inconsistant.
- Test : raw — créer PENDING → CANCELED via changeInvoiceStatus, puis markAsPaid → erreur.
- Effort : Faible (~25 lignes).

**4. changeInvoiceStatus PENDING → DRAFT forbidden** (invoice.js:2218-2225)

- Description : régression DRAFT depuis PENDING interdite. Compliance — une facture émise ne peut pas redevenir un brouillon.
- Impact : si la régression est possible, l'utilisateur peut "défaire" une facture émise, perdant le numéro réservé (audit trail compromis).
- Test : raw — créer PENDING, tenter changeInvoiceStatus → "DRAFT" → erreur `STATUS_TRANSITION_ERROR`.
- Effort : Faible (~25 lignes).

### 🟠 ÉLEVÉ — UX trompeuse / data integrity

**5. Prefix avec caractères invalides rejeté** (invoice.js:875-884)

- Description : prefix doit matcher `/^[A-Za-z0-9-]*$/`. Espaces, slashs, accents → erreur.
- Impact : data integrity — un prefix avec un slash casse la concat affichée `${prefix}${number}`.
- Test : raw — `prefix="F 2026 "` (espaces) ou `"F/2026/"` (slash) → erreur validationError.
- Effort : Faible (~20 lignes).

**6. dueDate < issueDate rejeté** (Invoice.js:64-72)

- Description : Mongoose validator empêche dueDate antérieure à issueDate.
- Impact : data integrity + UX (paiement avant émission n'a pas de sens).
- Test : raw — créer invoice avec issueDate=today, dueDate=today-5j → erreur.
- Effort : Faible (~20 lignes).

**7. createLinkedInvoice amount ≤ 0 rejeté** (invoice.js:2658-2663)

- Description : amount doit être > 0.
- Impact : créer une facture liée à -100€ ou 0€ casse les KPIs et la facturation.
- Test : raw — devis COMPLETED, amount=0 → erreur "Montant invalide".
- Effort : Faible (~25 lignes).

**8. createLinkedInvoice quote non-COMPLETED** (invoice.js:2683-2690)

- Description : seuls les devis COMPLETED (= acceptés) peuvent être convertis.
- Impact : interdit de générer une facture depuis un brouillon ou un devis envoyé non accepté.
- Test : raw — créer devis DRAFT ou PENDING, tenter createLinkedInvoice → erreur.
- Effort : Faible (~30 lignes — créer devis + tenter).

**9. createLinkedInvoice amount > reste à facturer** (invoice.js:2727-2738)

- Description : montant ne peut pas dépasser `quote.finalTotalTTC - alreadyInvoiced`.
- Impact : empêche de sur-facturer un devis (commun avec acomptes/situations).
- Test : raw — devis COMPLETED 1000€, créer linked 600€, tenter linked 500€ → erreur (reste=400€).
- Effort : Faible (~40 lignes).

### 🟡 MOYEN — utile mais ROI plus bas

**10. purchaseOrderNumber avec caractères invalides** — symétrique au #5, mais second-order.
**11. Email duplicate sur création nouveau client** — invariant valable, mais cas user rare (la plupart utilisent le picker existant).
**12. Update COMPLETED bloqué sauf admin/owner** — testable mais nécessite un changement de role en cours de test, complexe à mettre en place.

### ⚪ SKIP — bloqué par infra

- **Snapshot companyInfo/client à finalisation** — bloqué par R15 (transactions). Skipper avec doc.

---

## Recommandation finale

**Tester en priorité (9 tests, effort faible total)** : #1 à #9.

**Ne pas tester** : #10/#11 (ROI bas), #12 (complexité role-switch),
snapshot finalisation (R15).

Total estimé : **9 nouveaux tests**, ~250 lignes de code, ~3-5 min
de run additionnels.

---

**Étape 1 terminée. Voici les 9 invariants prioritaires :**

1. Year change forbidden on finalized invoice (CRITIQUE)
2. markAsPaid sur DRAFT rejeté (CRITIQUE)
3. markAsPaid sur CANCELED rejeté (CRITIQUE)
4. changeInvoiceStatus PENDING → DRAFT forbidden (CRITIQUE)
5. Prefix avec caractères invalides rejeté (ÉLEVÉ)
6. dueDate < issueDate rejeté (ÉLEVÉ)
7. createLinkedInvoice amount ≤ 0 rejeté (ÉLEVÉ)
8. createLinkedInvoice quote non-COMPLETED rejeté (ÉLEVÉ)
9. createLinkedInvoice amount > reste à facturer (ÉLEVÉ)

**Lis AUDIT_EXPLORATOIRE.md pour les détails. Je passe à l'étape 2
(écriture des tests) automatiquement, en priorisant ceux à risque
CRITIQUE / ÉLEVÉ. #10/#11/#12 sont skippés et documentés en backlog.**

---

## Section 4 — Résultats étape 2 (écriture des tests)

Fichier créé : `e2e/factures/invariants-business.spec.js` (9 tests).

| #   | Invariant                                      | Test   | Résultat                                         |
| --- | ---------------------------------------------- | ------ | ------------------------------------------------ |
| 1   | Year change forbidden on finalized invoice     | Test 1 | ✅ VERT                                          |
| 2   | markAsPaid sur DRAFT rejeté                    | Test 2 | ✅ VERT                                          |
| 3   | markAsPaid sur CANCELED rejeté                 | Test 3 | ✅ VERT                                          |
| 4   | changeInvoiceStatus PENDING → DRAFT interdit   | Test 4 | ✅ VERT                                          |
| 5   | Prefix avec caractères non autorisés rejeté    | Test 5 | ✅ VERT                                          |
| 6   | dueDate < issueDate rejeté                     | Test 6 | ✅ VERT (regex ajusté pour `extensions.details`) |
| 7   | createLinkedInvoice amount ≤ 0 rejeté          | Test 7 | ✅ VERT                                          |
| 8   | createLinkedInvoice quote non-COMPLETED rejeté | Test 8 | ✅ VERT                                          |
| 9   | createLinkedInvoice amount > reste à facturer  | Test 9 | ✅ VERT                                          |

**9/9 tests verts** au run isolé `invariants-business.spec.js` seul.

**Aucun bug applicatif découvert** — tous les garde-fous backend
identifiés sont effectifs.

**Backlog non testé** :

- #10 `purchaseOrderNumber` regex (symétrique #5, ROI bas)
- #11 Email duplicate sur création nouveau client (cas user rare)
- #12 Update COMPLETED bloqué sauf admin/owner (complexité role-switch)
- Snapshot companyInfo/client à la finalisation (R15 — replica set requis)
