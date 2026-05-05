# Audit module Factures — état des tests

> **Périmètre** : factures **clients** (de vente) telles que documentées dans
> `app/dashboard/outils/factures/docs/INVOICES_PAGE.md`.
> Les factures d'achat (`factures-achat`) et les imports OCR fournisseur
> sont **hors périmètre** de cet audit (couverts par leurs propres specs).
> **Branche** : `feat/e2e-factures-fonctionnels` (depuis `feat/e2e-p0-coverage`).
> **Date** : 2026-05-02.

---

## 1. Tests existants (par fichier)

### `e2e/invoices/create-invoice-p0.spec.js` (2 tests)

- **Test 1** — `Crée une facture standard et vérifie le format prefix/number + status PENDING`
  - Classement : **REGLE_METIER**
  - Vérifie : E2E création standard via UI complète (client → step 2 → 1 article 1000 € HT → "Créer la facture"). Capture la mutation `CreateInvoice` et asserte : `status === "PENDING"`, `prefix` matche `^F-\d{6}$`, `number` matche `^\d{4}$`, `totalTTC` ≈ 1200 (TVA 20%). Vérifie aussi la redirection vers `/factures`.
  - Couvre §17 (validation submit), §18 (calcul HT/TVA/TTC), §20 (PENDING), §4 (numérotation prefix/number).

- **Test 2** — `Deux factures consécutives ont des numéros qui se suivent (sans saut)`
  - Classement : **REGLE_METIER**
  - Vérifie : invariant compliance comptable FR — deux factures créées consécutivement ont `number(N+1) = number(N) + 1` et même préfixe.
  - Couvre §4 (séquentialité stricte), §44 (auto-réparation compteur — indirectement).

### `e2e/invoices/create-deposit-invoice-p0.spec.js` (1 test)

- **Test 1** — `Crée une facture d'acompte avec isDeposit=true et statut PENDING`
  - Classement : **REGLE_METIER**
  - Vérifie : sélection du type "Facture d'acompte" depuis `#invoice-type`, création via UI, mutation `CreateInvoice` retourne `isDeposit === true`, `status === "PENDING"`, `totalTTC` ≈ 600 (500 × 1.20). Format prefix/number standard.
  - Couvre §21.1 (acompte `isDeposit`), §17, §18.

### `e2e/invoices/create-invoice.spec.js` (7 tests)

- **Test 1** — `Flow: Page liste — header, stats, boutons, dropdown, tableau`
  - Classement : **SMOKE_PURE**
  - Vérifie : présence des textes "CA facturé", "CA payé", des boutons "Nouvelle facture" / "Importer", et d'un dropdown "Facture vierge".
  - Manque : aucune assertion sur la **valeur** des KPIs, pas de vérification du bouton ⚙️ (Settings) ni 🔔 (Relances), pas de vérification "Factures en retard" KPI.

- **Test 2** — `Flow: Création facture standard complète (2 étapes)`
  - Classement : **FONCTIONNEL_PARTIEL**
  - Vérifie : navigation step 1 → step 2, présence du select "Type de facture" avec les 3 options, sélection client, numéro pré-rempli "F-", checkbox auto-liquidation visible, ajout article + saisie prix, présence du label "20% TVA", bouton "Créer la facture" visible, navigation back step 1 → step 2.
  - Manque : ne **clique jamais** sur "Créer la facture" → ne valide ni la persistance, ni les valeurs réelles HT/TVA/TTC, ni la redirection.
  - Recouvrement : largement redondant avec `create-invoice-p0.spec.js` test 1, qui lui va jusqu'au bout.

- **Test 3** — `Flow: Création facture d'acompte`
  - Classement : **SMOKE_PURE**
  - Vérifie : sélection du type "Facture d'acompte", passage step 2, ajout article, présence du bouton "Créer la facture".
  - Manque : ne crée pas réellement la facture (ne clique pas sur "Créer la facture"). Redondant avec `create-deposit-invoice-p0.spec.js`.

- **Test 4** — `Flow: Création facture de situation — référence auto-générée`
  - Classement : **FONCTIONNEL_PARTIEL**
  - Vérifie : sélection du type "Facture de situation", présence du texte "référence unique", passage step 2.
  - Manque : `situationNumber`, `situationReference`, `purchaseOrderNumber`, validation du cumul (§31.3), pas de soumission.

- **Test 5** — `Flow: Auto-liquidation met la TVA à 0%`
  - Classement : **REGLE_METIER**
  - Vérifie : cochage `#isReverseCharge`, ajout d'un article, présence du label "0% TVA".
  - Manque : valide juste la **présence** du libellé, pas le `totalTVA = 0` calculé ni la persistance. Pas de mention légale vérifiée.
  - Couvre partiellement §21.3, §18.4.

- **Test 6** — `Flow: Actions liste — clic ligne, menu, paramètres, relances`
  - Classement : **SMOKE_PURE**
  - Vérifie : que cliquer sur une ligne produit du contenu (`bodyText.length > 100`), que les modals "Settings" et "MailCheck" s'ouvrent (best-effort, `if isVisible`).
  - Manque : aucun contenu spécifique de la sidebar n'est vérifié, aucune action de la modal n'est testée.

- **Test 7** — `Flow: Preview PDF visible en desktop`
  - Classement : **SMOKE_PURE**
  - Vérifie : sur desktop (≥1024 px), le panel `[class*="border-l"]` est visible.
  - Manque : ne vérifie pas que le PDF preview reflète les données saisies. Ne teste pas le mode mobile (§14).

### `e2e/invoices/edit-delete-invoice.spec.js` (3 tests)

- **Test 1** — `Flow: Ouvrir une facture et voir le détail`
  - Classement : **SMOKE_PURE**
  - Vérifie : clic sur la première ligne et `bodyText.length > 100`. **Skip silencieux** si pas de ligne.
  - Manque : ne vérifie pas le contenu de la sidebar/page de détail (cf §13).

- **Test 2** — `Flow: Actions brouillon — Modifier et Supprimer disponibles`
  - Classement : **FONCTIONNEL_PARTIEL**
  - Vérifie : sur une ligne avec badge "Brouillon", le menu d'actions contient "modifier" et "supprimer".
  - Manque : ne **clique pas** sur ces actions. Ne vérifie pas que la suppression fonctionne ni que la modification s'ouvre. **Skip silencieux** si pas de DRAFT.

- **Test 3** — `Flow: Actions facture en attente — Marquer payée disponible`
  - Classement : **FONCTIONNEL_PARTIEL**
  - Vérifie : sur une ligne "En attente", présence de "payée"/"payé" dans le menu.
  - Manque : ne marque pas la facture payée, ne vérifie pas la transition de statut (cf §5.3).

### `e2e/credit-notes/credit-notes.spec.js` (3 tests)

- **Test 1** — `Avoirs accessibles depuis les factures`
  - Classement : **SMOKE_PURE**
  - Vérifie : la page `/factures` charge (`bodyText.length > 50`).
  - Manque : ne touche en réalité **pas du tout** aux avoirs.

- **Test 2** — `Une facture a une option 'Créer un avoir' (si payée)`
  - Classement : **SMOKE_PURE**
  - Vérifie : après clic sur la première ligne, présence des mots "avoir" / "credit" / "note" OU `bodyText.length > 100` (best-effort).
  - Manque : ne crée **jamais** un avoir, ne vérifie pas la condition "facture payée requise" (§22.1), ne vérifie pas le préfixe AV-, ne vérifie pas les montants ≤ 0 (§22.2).

- **Test 3** — `Endpoint API génération PDF d'avoir répond`
  - Classement : **SMOKE_PURE**
  - Vérifie : le endpoint `/api/credit-notes/generate-pdf` répond avec un statut dans `[200, 400, 401, 404, 405]`.
  - Manque : ne vérifie pas un PDF réel.

### `e2e/quotes/convert-to-invoice.spec.js` (1 test)

- **Test 1** — `converts a COMPLETED quote into a new invoice`
  - Classement : **FONCTIONNEL_COMPLET**
  - Vérifie : récupère un JWT via `/api/auth/token`, hit la mutation `convertQuoteToInvoice` avec `id=ffffffffffffffffffff0003` (seed). Asserte : `status` ∈ {DRAFT, PENDING}, `finalTotalTTC > 0`, `client.name` truthy. Cross-check UI : la liste se charge.
  - Recouvrement : doublon avec `quote-p0.spec.js` Test 2 (même mutation, même variante test).
  - Couvre §30 (createLinkedInvoice / convertQuoteToInvoice).

### `e2e/quotes/quote-p0.spec.js` — Test 2 uniquement pertinent

- **Test 2** — `Convertit un devis COMPLETED en facture (raw GraphQL)`
  - Classement : **FONCTIONNEL_COMPLET**
  - Vérifie : mutation `convertQuoteToInvoice(id, distribution=[100], isDeposit=false)`, asserte `prefix` matche `^F-\d{6}$`, `number` matche `^(DRAFT-\d+|\d{4})$`, `status` ∈ {DRAFT, PENDING}, `finalTotalTTC > 0`, `client.name` préservé.
  - Couvre §30 (mutation backend), partiellement §30.3 (mais pas la limite 3 = §46.19).

### `e2e/security/multi-tenant-isolation.spec.js` (2 tests)

- **Test 1** — `Test B (backend) — GetInvoice with foreign id + our workspace must not leak`
  - Classement : **REGLE_METIER**
  - Vérifie : un workspace ne peut pas lire une facture d'un autre workspace via la query GraphQL.
  - Couvre §36.2 (RBAC backend) — sécurité multi-tenant.

- **Test 2** — `Test A (UI) — visiting /factures/<foreignId> does not render foreign invoice`
  - Classement : **REGLE_METIER**
  - Vérifie : la page route `/factures/<id>` ne fuite pas les données d'un autre tenant.
  - Couvre §36.1 (RBAC frontend / company-info-guard).

### Tests touchant `/factures` indirectement

- `e2e/smoke/all-pages-smoke.spec.js` — vérifie que `/factures` et `/factures/new` chargent sans 5xx ni erreur React. **SMOKE_PURE.** Pas spécifique métier.
- `e2e/visual/dashboard-visual.spec.js` — snapshots pixel-à-pixel de `/factures` et `/factures/new`. **Hors scope fonctionnel** — détecte régressions visuelles uniquement.
- `e2e/a11y/dashboard-a11y.spec.js` — audit axe-core sur `/factures` (no SERIOUS/CRITICAL violations). **Hors scope fonctionnel.**
- `e2e/navigation/sidebar-navigation.spec.js` — un test "should navigate to Invoices page" qui clique sur le lien et vérifie que l'URL contient "factures". **SMOKE_PURE.**
- `e2e/dashboard/dashboard-home.spec.js` — mentionne le menu "Ventes" (parent de Factures). Hors scope.

### Tests hors scope (factures d'achat / fournisseurs)

- `e2e/factures-achat/factures-achat-list.spec.js` (5 tests) — page `/factures-achat`, pas de couverture de la doc factures clients.
- `e2e/suppliers/import-supplier-invoice.spec.js` (4 tests) — OCR fournisseur, hors scope INVOICES_PAGE.md.
- `e2e/purchase-orders/purchase-order-backend-p0.spec.js` — bons de commande, hors scope.

---

## 2. Récapitulatif classement

| Classement          | Nombre | Fichiers                                                                                                                  |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| REGLE_METIER        | 5      | create-invoice-p0 (×2), create-deposit-invoice-p0, multi-tenant-isolation (×2) + 1 dans create-invoice (auto-liquidation) |
| FONCTIONNEL_COMPLET | 2      | convert-to-invoice, quote-p0 (test 2)                                                                                     |
| FONCTIONNEL_PARTIEL | 4      | create-invoice (test 2, test 4), edit-delete-invoice (test 2, test 3)                                                     |
| SMOKE_PURE          | 9      | create-invoice (test 1, 3, 6, 7), edit-delete-invoice (test 1), credit-notes (×3), navigation × routes liste              |
| OBSOLETE            | 0      | — (voir section 5)                                                                                                        |

**Total tests factures clients comptés : ~20.**

---

## 3. Couverture par section de la doc INVOICES_PAGE.md

| Section                                                             | Statut        | Tests couvrants                                      | Lacunes                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------- | ------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **§6** Page liste (KPIs, header, boutons)                           | **PARTIEL**   | `create-invoice.spec.js:65`                          | Présence des libellés "CA facturé"/"CA payé" seulement. **Valeurs des KPIs jamais vérifiées** (§6.2). KPIs sur données filtrées (§46.3) non testé. ⚠️ Bouton 🔔 (relances) et ⚙️ (settings) testés best-effort, pas d'action réelle. KPI "Factures en retard" non testé. Toast post-création (§6.4) non testé. Pré-filtrage URL `?status=overdue` / `?id=` (§6.5) non testé. |
| **§7** Tableau (colonnes, tri)                                      | **PARTIEL**   | smoke + visuel                                       | Aucun test ne valide les colonnes (Client, Référence, HT, TVA, TTC, dates, statut, tracking). Tri jamais testé. Distinction normales vs importées (§7.1) non testée.                                                                                                                                                                                                         |
| **§7.3** Recalcul TTC avec escompte                                 | **NON TESTÉ** | —                                                    | **Piège majeur (§46.2)**. Aucun test ne crée une facture avec escompte > 0 et ne vérifie que la colonne TTC montre `HT(1−e/100) × (1+TVA)` au lieu de `finalTotalTTC` brut.                                                                                                                                                                                                  |
| **§8** Filtres avancés                                              | **NON TESTÉ** | —                                                    | Aucun test ne touche le dropdown filtres (status, client, date range, type). Badge compteur, "Effacer tous les filtres" non testés.                                                                                                                                                                                                                                          |
| **§9** Recherche globale (11 formats date)                          | **NON TESTÉ** | —                                                    | **Piège §46.1**. Aucun test ne tape une date dans la barre de recherche. Recherche par nom/numéro/montant non testée. Insensibilité aux accents (§46.17) non testée.                                                                                                                                                                                                         |
| **§10** Onglets de filtre rapide                                    | **NON TESTÉ** | —                                                    | Aucun test ne clique sur "Brouillons", "À encaisser", "En retard", "Terminées". Compteurs par tab (§10.1) non vérifiés.                                                                                                                                                                                                                                                      |
| **§10.2 / §46.4** Onglet "En retard" ≠ statut OVERDUE               | **NON TESTÉ** | —                                                    | Piège majeur : facture peut apparaître "en retard" dans l'onglet alors qu'elle est encore PENDING en base (lag cron 24h). Aucun test n'isole ce comportement.                                                                                                                                                                                                                |
| **§11** Sélection multiple + bulk delete                            | **NON TESTÉ** | —                                                    | Checkbox header / row, bouton "Supprimer (n)", AlertDialog non testés.                                                                                                                                                                                                                                                                                                       |
| **§11.3 / §46.18** Bulk delete sur COMPLETED refusé silencieusement | **NON TESTÉ** | —                                                    | Piège : sélection mixte DRAFT + COMPLETED → suppression partielle silencieuse. Aucun test.                                                                                                                                                                                                                                                                                   |
| **§12** Actions par ligne (10 actions)                              | **PARTIEL**   | `edit-delete-invoice.spec.js:53` (test 2 et 3)       | Présence de "Modifier"/"Supprimer" dans menu DRAFT et "Marquer payée" dans menu PENDING vérifiée. **Mais aucune action réellement déclenchée**. Liste exhaustive des 10 actions (§12.4) : convertir en avoir, dupliquer, télécharger PDF, envoyer, etc. — aucune testée fonctionnellement. Différenciation normale vs importée (§12.3) non testée.                           |
| **§13** Sidebar / preview                                           | **PARTIEL**   | smoke best-effort                                    | Sidebar s'ouvre sur clic ligne mais contenu non vérifié. Auto-ouverture par URL `?id=` (§13.4) non testée.                                                                                                                                                                                                                                                                   |
| **§14** Mode mobile (fullscreen + infinite scroll)                  | **NON TESTÉ** | —                                                    | Aucun test au viewport mobile. `InvoiceMobileFullscreen` (§14.3), reset au changement de tab (§14.2) non testés.                                                                                                                                                                                                                                                             |
| **§15** ModernInvoiceEditor (split-screen, modes create/edit)       | **PARTIEL**   | `create-invoice-p0`, `create-invoice` (test 2)       | Mode `create` testé. **Mode `edit` (modification d'une facture existante) non testé** — `[id]/editer/page.jsx` jamais visité. Auto-sync depuis devis/BC (§15.4) couvert uniquement par `convertQuoteToInvoice` mutation (pas via UI).                                                                                                                                        |
| **§16** Sections du formulaire (8 sections)                         | **PARTIEL**   | create-invoice-p0                                    | InvoiceInfoSection, ItemsSection, client-selector touchés. **Non testés** : ProgressSection (situation), DiscountsAndTotalsSection (remise/escompte), ShippingSection (livraison), NotesAndFooterSection, CustomFieldsSection.                                                                                                                                               |
| **§17** Validation au submit                                        | **PARTIEL**   | create-invoice-p0 (happy path)                       | Validation succès testée. **Cas erreurs non testés** : client manquant, companyInfo manquant, remise > total, livraison sans adresse, items vides, articles avec qty/prix invalides. Pas de test sur l'**affichage des erreurs** (§17.6).                                                                                                                                    |
| **§18** Calcul des totaux (HT/TVA/TTC)                              | **PARTIEL**   | create-invoice-p0                                    | Cas simple 1000 € HT × 20% = 1200 € TTC vérifié. **Non testés** : multi-articles, TVA mixte (5.5/10/20), remise par item vs remise globale (§18.2), arrondis fractionnaires.                                                                                                                                                                                                 |
| **§18.3 / §46.2** Escompte (calcul UI uniquement)                   | **NON TESTÉ** | —                                                    | **Piège majeur**. Aucun test ne crée une facture avec `escompte > 0` et ne vérifie HT après escompte / TVA recalculée / TTC final. Risque régression : user paie le mauvais montant.                                                                                                                                                                                         |
| **§18.4** Auto-liquidation TVA                                      | **PARTIEL**   | `create-invoice.spec.js:241`                         | Présence du label "0% TVA" vérifiée. **Pas de soumission**, pas de vérification `totalVAT === 0` en base, pas de mention légale PDF.                                                                                                                                                                                                                                         |
| **§20** DRAFT vs PENDING                                            | **PARTIEL**   | create-invoice-p0 (PENDING)                          | PENDING via "Créer la facture" testé. **DRAFT via "Sauver brouillon" non testé**. Pas de test sur l'absence d'auto-save (§20.2) ni sur le numéro temporaire `DRAFT-NNNN`. Snapshot companyInfo figé / non figé (§20.3) non testé.                                                                                                                                            |
| **§21.1** Acompte (`isDeposit`)                                     | **TESTÉ**     | `create-deposit-invoice-p0.spec.js`                  | OK — invariant `isDeposit=true` + total = depositAmount. Manque : lien obligatoire avec devis source (§21.1), unicité acompte par devis.                                                                                                                                                                                                                                     |
| **§21.2** Facture de situation                                      | **PARTIEL**   | `create-invoice.spec.js:216`                         | Sélection du type + texte "référence unique" vérifiés. **`situationNumber`, `situationReference`, `purchaseOrderNumber`, `contractTotal` non testés.** Pas de soumission.                                                                                                                                                                                                    |
| **§21.3** Auto-liquidation                                          | **PARTIEL**   | `create-invoice.spec.js:241`                         | Idem §18.4 — label visible mais pas de validation backend.                                                                                                                                                                                                                                                                                                                   |
| **§22** Avoirs                                                      | **NON TESTÉ** | `credit-notes.spec.js`                               | Le spec dédié ne crée jamais d'avoir. Pas de test sur : pré-remplissage items en négatif, lien `originalInvoice` requis, préfixe AV-, type d'avoir, validation montants ≤ 0 (§22.2), refundMethod.                                                                                                                                                                           |
| **§30** createLinkedInvoice (devis → facture)                       | **TESTÉ**     | `quote-p0.spec.js:112`, `convert-to-invoice.spec.js` | OK pour le happy path.                                                                                                                                                                                                                                                                                                                                                       |
| **§30.3 / §46.19** Limite 3 factures liées par devis                | **NON TESTÉ** | —                                                    | Hardcodé `invoice.js:2695-2698`. Aucun test ne crée une 4e facture pour vérifier l'erreur.                                                                                                                                                                                                                                                                                   |
| **§31** Factures de situation (validation cumul)                    | **NON TESTÉ** | —                                                    | `invoice.js:898-1054` : somme TTC ≤ contractTotal. Aucun test ne crée 2 situations cumulant > contractTotal pour vérifier le rejet. Query `situationReferences` / `situationInvoicesByQuoteRef` non testée.                                                                                                                                                                  |
| **§43** Conflits DRAFT/PENDING                                      | **NON TESTÉ** | —                                                    | Voir §46.13.                                                                                                                                                                                                                                                                                                                                                                 |
| **§45** Validation date d'émission antérieure                       | **NON TESTÉ** | —                                                    | `validateInvoiceIssueDate` (compliance FR : pas d'antidaté). Aucun test ne soumet une facture avec `issueDate < latestInvoiceIssueDate`.                                                                                                                                                                                                                                     |
| **§45.4 / §46.20** Skip pour DRAFT                                  | **NON TESTÉ** | —                                                    | Piège : un DRAFT antidaté peut passer la validation à la création mais échouer plus tard à la finalisation. UX confuse.                                                                                                                                                                                                                                                      |

---

## 4. Couverture pièges §46

| Piège                                                                         | Statut        | Tests                                                                | Risque si régression                                                                                                                              |
| ----------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **§46.1** Multi-format dates (timestamp string/number/ISO)                    | NON TESTÉ     | —                                                                    | KPI "Factures en retard" et tri par date cassent silencieusement si un format n'est plus parsé.                                                   |
| **§46.2** `finalTotalTTC` n'inclut pas l'escompte                             | **NON TESTÉ** | —                                                                    | **CRITIQUE** : l'utilisateur paie / facture le mauvais montant. Recalcul UI dans `use-invoice-table.js:510-540`.                                  |
| **§46.4** Onglet "En retard" ≠ statut OVERDUE en base                         | NON TESTÉ     | —                                                                    | Lag cron 24h : utilisateur voit "en retard" alors que base dit PENDING. Si quelqu'un "fixe" en filtrant sur OVERDUE en base, le tab devient vide. |
| **§46.8** `cachedPdf` invalidation après update                               | INTÉGRATION   | —                                                                    | Automations envoient PDF stale. Nécessite mock R2 + Puppeteer. **À reporter (PDF Puppeteer hors scope tests fonctionnels).**                      |
| **§46.10** Suppression réelle vs annulation                                   | PARTIEL       | `edit-delete-invoice.spec.js` (présence "Supprimer" dans menu DRAFT) | Suppression d'une PENDING/COMPLETED non testée — devrait être bloquée backend.                                                                    |
| **§46.12** Compteur par préfixe pas par année                                 | NON TESTÉ     | —                                                                    | Doublons inter-année possibles (`F-CLIENT-0042` × 2). Aucun test ne crée le même préfixe sur 2 années.                                            |
| **§46.13** `checkInvoiceNumberExists` ignore les DRAFT (renommage silencieux) | **NON TESTÉ** | —                                                                    | **CRITIQUE** : utilisateur perd "son" numéro réservé. DRAFT silencieusement renommé `DRAFT-{n}-{timestamp}`. Aucune notif UI.                     |
| **§46.18** Bulk delete sans pré-filtrage                                      | **NON TESTÉ** | —                                                                    | Sélection mixte → suppression partielle silencieuse. UX trompeuse.                                                                                |
| **§46.19** Limite 3 factures liées par devis                                  | NON TESTÉ     | —                                                                    | Aucun test sur la 4e tentative. Hardcodé.                                                                                                         |
| **§46.20** Validation date émission ne couvre pas DRAFT                       | **NON TESTÉ** | —                                                                    | Antidaté possible en DRAFT, échoue tard à la finalisation.                                                                                        |

**Total : 0 piège testé sur 10. 4 pièges critiques (§46.2, §46.13, §46.18, §46.20) à prioriser.**

---

## 5. Tests OBSOLETES à supprimer

> Aucune suppression dans ce prompt. Liste des candidats avec justification :

- **`e2e/invoices/create-invoice.spec.js` Test 2** — `Création facture standard complète (2 étapes)`
  - Justification : entièrement remplacé par `create-invoice-p0.spec.js` Test 1 qui va plus loin (clique "Créer la facture" + asserte payload). Le test actuel s'arrête au bouton et fait une navigation back/forward sans valeur.
  - Recommandation : à supprimer en prompt 2.

- **`e2e/invoices/create-invoice.spec.js` Test 3** — `Création facture d'acompte`
  - Justification : remplacé par `create-deposit-invoice-p0.spec.js` qui valide réellement `isDeposit=true`.
  - Recommandation : à supprimer en prompt 2.

- **`e2e/credit-notes/credit-notes.spec.js` Tests 1 et 2**
  - Justification : ne touchent pas réellement aux avoirs (§22). Test 1 ne vérifie que le chargement de `/factures` (déjà couvert par smoke). Test 2 fait du `bodyText.includes("avoir")` sans créer un avoir.
  - Recommandation : à remplacer par un vrai test création d'avoir en prompt 4.

- **`e2e/quotes/convert-to-invoice.spec.js`** — doublon avec `quote-p0.spec.js` Test 2.
  - Justification : même mutation, mêmes assertions. `quote-p0.spec.js` est plus complet (assertions sur prefix/number).
  - Recommandation : à supprimer en prompt 4 (ou consolider).

- **`e2e/invoices/edit-delete-invoice.spec.js` Test 1** (`Ouvrir une facture et voir le détail`)
  - Justification : SMOKE déjà couvert par `all-pages-smoke.spec.js`. N'apporte rien de spécifique au métier.
  - Recommandation : à supprimer ou réécrire en FONCTIONNEL_COMPLET (vérifier le contenu de la sidebar §13).

---

## 6. Recommandations pour les prompts suivants

### Prompt 2 — CRUD complet (création + édition + suppression)

Couvrir :

- §15 mode `edit` : ouvrir une facture DRAFT, modifier un item, sauvegarder, vérifier la persistance.
- §16 sections non couvertes : DiscountsAndTotalsSection (remise globale, escompte), ShippingSection, NotesAndFooterSection.
- §17 cas d'erreur : client manquant, items vides, remise > total → assertions sur les messages d'erreur.
- §18 calculs avancés : multi-articles, TVA mixte, remise par item + remise globale (§18.2).
- §20 bouton "Sauver brouillon" → status DRAFT, numéro `DRAFT-NNNN`, modification libre.
- §45 validation date antérieure : tenter `issueDate < latestInvoiceIssueDate` → erreur.

À supprimer ici : `create-invoice.spec.js` tests 2, 3 (doublons p0).

### Prompt 3 — Pièges §46

Couvrir :

- **§46.2 escompte** : créer facture HT 1000 € avec escompte 5%, vérifier que la **colonne TTC** affiche 1140 (1000 × 0.95 × 1.20) et non 1200.
- **§46.4 onglet En retard** : créer une PENDING avec `dueDate < now`, vérifier qu'elle apparaît dans l'onglet "En retard" même si `status` reste PENDING (cron pas passé).
- **§46.13 DRAFT renommé** : créer un DRAFT avec numéro `0042`, créer une PENDING avec `0042` → vérifier que le DRAFT est renommé `DRAFT-{n}-{timestamp}`.
- **§46.18 bulk delete** : sélectionner DRAFT + COMPLETED, cliquer Supprimer, vérifier que seul le DRAFT a disparu (et idéalement un toast d'erreur partielle).
- **§46.20 date DRAFT antidaté** : créer DRAFT antidaté, finaliser, vérifier l'erreur tardive.

### Prompt 4 — Workflows métier (acompte / situation / avoir / conversion)

Couvrir :

- §21.2 / §31 situation : créer 2 factures de situation cumulant > `contractTotal` → vérifier le rejet backend.
- §22 avoirs : workflow complet — facture COMPLETED → "Convertir en avoir" → vérifier préfixe AV-, montants négatifs, lien `originalInvoice`, refundMethod.
- §30 / §46.19 limite 3 factures liées : créer 4 factures liées au même devis → la 4e doit être rejetée.
- §43 conflits DRAFT/PENDING : 2 utilisateurs créent simultanément avec le même numéro (race ou séquentiel).

À consolider ici : remplacer `convert-to-invoice.spec.js` ↔ `quote-p0.spec.js` Test 2.

---

## 7. Hors scope — intégrations à mocker plus tard

Ces sections nécessitent des dépendances externes ou un setup lourd qui dépasse le périmètre des tests fonctionnels :

- **PDF Puppeteer** (§23, §24) — `@sparticuz/chromium`, génération R2, cache `cachedPdf`. Tests de rendu pixel/PDF/A-3 hors scope.
- **Email Resend** (§25, §27) — `sendInvoice` est de toute façon un no-op (§46.11). Relances cron + tracking pixel (§26) nécessitent mock SMTP.
- **Pennylane** (§33) — sync compta v2, désync (§46.15). Hors scope, skill `pennylane` existant.
- **SuperPDP / Factur-X** (§35) — e-invoicing 2026, XML, routage. Hors scope.
- **Exports comptables** (§28) — CSV / Excel / FEC / Sage / Cegid. Tests unitaires de format probablement plus pertinents que e2e.
- **Subscriptions GraphQL temps réel** (§40) — `documentEmailUpdate`. Hors scope sans mock pubsub.
- **§46.16 Routes API Next sans auth** (`/api/invoices/data/[id]`, `/api/invoices/generate-pdf`) — sécurité à auditer côté infra, pas e2e.

---

## 8. Hors périmètre INVOICES_PAGE.md (mais touchant le mot "facture")

Les specs suivants ne concernent pas les factures clients et ne sont pas réévalués ici :

- `e2e/factures-achat/factures-achat-list.spec.js` — factures d'achat (modèle séparé `PurchaseInvoice` / `Expense`).
- `e2e/suppliers/import-supplier-invoice.spec.js` — OCR fournisseur.
- `e2e/purchase-orders/purchase-order-backend-p0.spec.js` — bons de commande.

Ces tests restent intacts.
