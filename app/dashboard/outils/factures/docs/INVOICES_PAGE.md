# Module Factures Client — Documentation exhaustive

> **Périmètre** : tout le module `app/dashboard/outils/factures/` (factures de vente uniquement).
> **Dernière mise à jour** : 2026-05-02
> **Audience** : développeurs travaillant sur le module ou auditant la conformité.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Cartographie des routes](#2-cartographie-des-routes)
3. [Modèle de données — `Invoice.js`](#3-modèle-de-données--invoicejs)
4. [Numérotation des factures (système complet)](#4-numérotation-des-factures-système-complet)
5. [Statuts et transitions](#5-statuts-et-transitions)
6. [Page liste — `/dashboard/outils/factures`](#6-page-liste--dashboardoutilsfactures)
7. [Le tableau (`invoice-table.jsx`)](#7-le-tableau-invoice-tablejsx)
8. [Filtres avancés (`invoice-filters.jsx`)](#8-filtres-avancés-invoice-filtersjsx)
9. [Recherche globale et filtre dates](#9-recherche-globale-et-filtre-dates)
10. [Onglets de filtre rapide](#10-onglets-de-filtre-rapide)
11. [Sélection multiple et bulk delete](#11-sélection-multiple-et-bulk-delete)
12. [Actions par ligne (`invoice-row-actions.jsx`)](#12-actions-par-ligne-invoice-row-actionsjsx)
13. [Sidebar / preview (`invoice-sidebar.jsx`)](#13-sidebar--preview-invoice-sidebarjsx)
14. [Mode mobile (fullscreen + infinite scroll)](#14-mode-mobile-fullscreen--infinite-scroll)
15. [Création / édition (`ModernInvoiceEditor`)](#15-création--édition-moderninvoiceeditor)
16. [Sections du formulaire](#16-sections-du-formulaire)
17. [Validation au submit](#17-validation-au-submit)
18. [Calcul des totaux (HT / TVA / TTC / remise / escompte)](#18-calcul-des-totaux-ht--tva--ttc--remise--escompte)
19. [Préfixes et numéros côté éditeur](#19-préfixes-et-numéros-côté-éditeur)
20. [DRAFT vs PENDING (sauvegarde brouillon vs finalisation)](#20-draft-vs-pending-sauvegarde-brouillon-vs-finalisation)
21. [Cas spéciaux : acompte, situation, auto-liquidation](#21-cas-spéciaux--acompte-situation-auto-liquidation)
22. [Avoirs (notes de crédit)](#22-avoirs-notes-de-crédit)
23. [Génération PDF (Puppeteer + Factur-X)](#23-génération-pdf-puppeteer--factur-x)
24. [Cache PDF (`cachedPdf`) sur Cloudflare R2](#24-cache-pdf-cachedpdf-sur-cloudflare-r2)
25. [Envoi par email (`sendInvoice`, `SendDocumentModal`)](#25-envoi-par-email-sendinvoice-senddocumentmodal)
26. [Tracking d'ouverture / clic](#26-tracking-douverture--clic)
27. [Relances automatiques](#27-relances-automatiques)
28. [Export comptable (CSV / Excel / FEC / Sage / Cegid)](#28-export-comptable-csv--excel--fec--sage--cegid)
29. [Factures importées (PDF déposé)](#29-factures-importées-pdf-déposé)
30. [Lien devis ↔ factures (createLinkedInvoice)](#30-lien-devis--factures-createlinkedinvoice)
31. [Factures de situation (avancement de travaux)](#31-factures-de-situation-avancement-de-travaux)
32. [Templates de facture](#32-templates-de-facture)
33. [Sync Pennylane](#33-sync-pennylane)
34. [Stripe Invoices (abonnement Newbi)](#34-stripe-invoices-abonnement-newbi)
35. [E-invoicing 2026 / Factur-X / SuperPDP](#35-e-invoicing-2026--factur-x--superpdp)
36. [Permissions RBAC et plans d'abonnement](#36-permissions-rbac-et-plans-dabonnement)
37. [Hooks personnalisés (référence)](#37-hooks-personnalisés-référence)
38. [API GraphQL (queries / mutations / subscriptions)](#38-api-graphql-queries--mutations--subscriptions)
39. [Routes API Next (PDF + data)](#39-routes-api-next-pdf--data)
40. [Subscriptions temps réel](#40-subscriptions-temps-réel)
41. [Paramètres (`InvoiceSettingsModal`)](#41-paramètres-invoicesettingsmodal)
42. [Configuration SMTP custom](#42-configuration-smtp-custom)
43. [Gestion des conflits DRAFT / PENDING](#43-gestion-des-conflits-draft--pending)
44. [Auto-réparation du compteur (self-heal)](#44-auto-réparation-du-compteur-self-heal)
45. [Validation date d'émission antérieure](#45-validation-date-démission-antérieure)
46. [Pièges connus et points d'attention](#46-pièges-connus-et-points-dattention)
47. [Fichiers clés](#47-fichiers-clés)

---

## 1. Vue d'ensemble

La "page Factures" n'est pas une seule page mais **un module complet** :

- **6 routes Next.js UI** (liste, création, détail, édition, avoir nouveau, avoir détail)
- **2 routes API Next** (data raw + génération PDF Puppeteer serverless)
- **~30 composants React** dans `app/dashboard/outils/factures/components/`
- **5 hooks dédiés** dans `app/dashboard/outils/factures/hooks/`
- **API GraphQL backend** complète (`newbi-api/`) avec ~10 queries, ~10 mutations, subscriptions
- **3 modèles Mongoose** (`Invoice`, `CreditNote`, `ImportedInvoice`) + 1 compteur (`DocumentCounter`) + 1 modèle template (`InvoiceTemplate`) + 2 modèles relances (`InvoiceReminderSettings`, `InvoiceReminderLog`)
- **2 cron jobs** (`overdueAutomationCron.js` quotidien, `invoiceReminderCron.js` horaire)
- **1 worker BullMQ** pour exécution des relances (`reminderQueue.js`)
- **Intégrations externes** : Pennylane (compta), Resend (email), Stripe (abonnement SaaS Newbi), Cloudflare R2 (PDF), SuperPDP (e-invoicing 2026)

Toutes les routes UI sont protégées par trois gardes successifs côté frontend :

1. `ProRouteGuard` — abonnement actif requis
2. `CompanyInfoGuard` — infos entreprise renseignées (sinon redirect setup)
3. `RBACRouteGuard` — permission `invoices:create/read/update/delete` selon la route

Côté backend, chaque resolver utilise `requireRead("invoices")`, `requireWrite("invoices")` ou `requireDelete("invoices")` — middleware RBAC qui valide rôle + permissions explicites.

---

## 2. Cartographie des routes

### 2.1 Routes UI (App Router)

| URL                                                    | Fichier                              | Garde                                      | Rôle                                           |
| ------------------------------------------------------ | ------------------------------------ | ------------------------------------------ | ---------------------------------------------- |
| `/dashboard/outils/factures`                           | `page.jsx`                           | Pro + CompanyInfo                          | Liste + KPIs + table + filtres                 |
| `/dashboard/outils/factures/new`                       | `new/page.jsx`                       | Pro + CompanyInfo + RBAC `invoices:create` | Création (`ModernInvoiceEditor` mode `create`) |
| `/dashboard/outils/factures/[id]`                      | `[id]/page.jsx`                      | Pro + CompanyInfo                          | Détail / preview                               |
| `/dashboard/outils/factures/[id]/editer`               | `[id]/editer/page.jsx`               | Pro + CompanyInfo + RBAC `invoices:update` | Édition (`ModernInvoiceEditor` mode `edit`)    |
| `/dashboard/outils/factures/[id]/avoir/nouveau`        | `[id]/avoir/nouveau/page.jsx`        | Pro + RBAC `creditNotes:create`            | Création avoir lié                             |
| `/dashboard/outils/factures/[id]/avoir/[creditNoteId]` | `[id]/avoir/[creditNoteId]/page.jsx` | Pro                                        | Détail avoir                                   |

### 2.2 Routes API Next

| URL                               | Fichier                                  | Auth                                                             | Rôle                                                                                                                                                         |
| --------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/invoices/data/[id]`     | `app/api/invoices/data/[id]/route.js`    | **Aucune** (server-to-server uniquement, IP whitelist conseillé) | Connexion MongoDB directe (`MongoClient`), récupère facture + client lié, retourne JSON formaté pour Puppeteer                                               |
| `POST /api/invoices/generate-pdf` | `app/api/invoices/generate-pdf/route.js` | Aucune (à protéger)                                              | Lance Chromium serverless via `@sparticuz/chromium`, navigue vers `/pdf-generator/invoice/[id]`, attend `window.pdfGenerationResult`, retourne le buffer PDF |
| `POST /api/stripe/invoices`       | `app/api/stripe/invoices/route.js`       | Auth Better Auth                                                 | Liste les factures Stripe **de l'abonnement Newbi de l'utilisateur** (pas les factures business)                                                             |

### 2.3 API GraphQL backend

Endpoint unique : `POST /graphql` (port 4000 en local).

Voir §38 pour la liste exhaustive.

---

## 3. Modèle de données — `Invoice.js`

Fichier : `newbi-api/src/models/Invoice.js` (568 lignes)

### 3.1 Champs principaux

| Champ                                                    | Type           | Required             | Default                             | Notes                                                                                                                           |
| -------------------------------------------------------- | -------------- | -------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `prefix`                                                 | String (≤10)   | non                  | `F-{YYYY}{MM}`                      | Format libre, regex `[A-Za-z0-9-]*`                                                                                             |
| `number`                                                 | String (≤50)   | si non-DRAFT         | —                                   | Padded 4 chiffres `0001`, regex `[A-Za-z0-9-]+`                                                                                 |
| `issueDate`                                              | Date           | oui                  | `Date.now`                          |                                                                                                                                 |
| `dueDate`                                                | Date           | non                  | —                                   | Doit être ≥ `issueDate`                                                                                                         |
| `issueYear`                                              | Number         | (auto)               | calculé pre-save                    | Pour l'index unique par année                                                                                                   |
| `isDeposit`                                              | Bool           | non                  | `false`                             | Acompte                                                                                                                         |
| `invoiceType`                                            | enum           | non                  | `"standard"`                        | `"standard" / "deposit" / "situation"`                                                                                          |
| `situationNumber`                                        | Number ≥1      | non                  | `1`                                 | N° de situation pour avancement                                                                                                 |
| `depositAmount`                                          | Number ≥0      | non                  | `0`                                 | Acompte montant                                                                                                                 |
| `items`                                                  | Array          | oui (≥1)             | —                                   | Lignes de facture (cf §3.2)                                                                                                     |
| `client`                                                 | Object         | oui                  | —                                   | Snapshot client à la création (cf §3.3)                                                                                         |
| `companyInfo`                                            | Object         | non                  | résolu dynamique pour DRAFT         | Snapshot entreprise                                                                                                             |
| `status`                                                 | enum           | non                  | `"DRAFT"`                           | Voir §5                                                                                                                         |
| `paymentMethod`                                          | enum           | non                  | `"BANK_TRANSFER"`                   | `BANK_TRANSFER / CHECK / CASH / CARD / OTHER`                                                                                   |
| `paymentDate`                                            | Date           | non                  | —                                   | Set par `markInvoiceAsPaid`                                                                                                     |
| `headerNotes`                                            | String (≤1000) | non                  | —                                   | Notes haut de PDF                                                                                                               |
| `footerNotes`                                            | String (≤2000) | non                  | —                                   | Notes bas de PDF, validées par `isValidFooterNotes`                                                                             |
| `termsAndConditions`                                     | String         | non                  | —                                   | CGV                                                                                                                             |
| `termsAndConditionsLinkTitle`                            | String (≤100)  | non                  | —                                   |                                                                                                                                 |
| `termsAndConditionsLink`                                 | URL            | non                  | —                                   | Validé par `URL_REGEX`                                                                                                          |
| `purchaseOrderNumber`                                    | String (≤50)   | non                  | —                                   | Référence devis/PO, regex `[A-Za-z0-9-/]+`                                                                                      |
| `situationReference`                                     | String (≤100)  | non                  | —                                   | Pour grouper les situations                                                                                                     |
| `contractTotal`                                          | Number ≥0      | non                  | `0`                                 | Pour validation cumul situations                                                                                                |
| `discount`                                               | Number ≥0      | non                  | `0`                                 | Remise globale                                                                                                                  |
| `discountType`                                           | enum           | non                  | `"FIXED"`                           | `FIXED / PERCENTAGE`                                                                                                            |
| `customFields`                                           | Array          | non                  | `[]`                                | Clé/valeur arbitraires                                                                                                          |
| `showBankDetails`                                        | Bool           | non                  | `false`                             | Affiche IBAN dans PDF                                                                                                           |
| `bankDetails`                                            | Object         | si `showBankDetails` | —                                   | IBAN + BIC chiffrés AES-256-GCM                                                                                                 |
| `totalHT/totalVAT/totalTTC`                              | Number ≥0      | non                  | calculé                             | Avant remise globale                                                                                                            |
| `finalTotalHT/finalTotalVAT/finalTotalTTC`               | Number ≥0      | non                  | calculé                             | Après remise globale                                                                                                            |
| `cachedPdf.{key,url,generatedAt}`                        | Object         | non                  | —                                   | Cache R2 pour automatisations                                                                                                   |
| `emailTracking`                                          | Object         | non                  | —                                   | `{emailSentAt, emailOpenedAt, emailOpenCount, emailClickedAt, emailClickCount, trackingToken, resendMessageId}`                 |
| `workspaceId`                                            | ObjectId       | oui                  | —                                   | Multi-tenant Better Auth (ref `Organization`)                                                                                   |
| `createdBy`                                              | ObjectId       | oui                  | —                                   | Audit trail (ref `User`)                                                                                                        |
| `stripeInvoiceId`                                        | String         | non                  | —                                   | Pour factures Stripe (rare)                                                                                                     |
| `sourceQuote`                                            | ObjectId       | non                  | —                                   | Devis source si conversion                                                                                                      |
| `appearance.{textColor, headerTextColor, headerBgColor}` | Object         | non                  | défauts                             | Personnalisation PDF                                                                                                            |
| `shipping`                                               | Object         | non                  | défaut `{billShipping: false, ...}` | Frais de livraison facturables                                                                                                  |
| `isReverseCharge`                                        | Bool           | non                  | `false`                             | Auto-liquidation TVA (intracommunautaire)                                                                                       |
| `clientPositionRight`                                    | Bool           | non                  | `false`                             | Position client dans PDF                                                                                                        |
| `retenueGarantie`                                        | Number 0-100   | non                  | `0`                                 | % de retenue (BTP)                                                                                                              |
| `escompte`                                               | Number 0-100   | non                  | `0`                                 | % escompte pour règlement anticipé                                                                                              |
| `operationType`                                          | enum           | non                  | `null`                              | `LB / PS / LBPS` (réforme 2026)                                                                                                 |
| `linkedTransactionId`                                    | ObjectId       | non                  | —                                   | Rapprochement bancaire                                                                                                          |
| `pennylaneId`                                            | String         | non                  | —                                   | ID Pennylane                                                                                                                    |
| `pennylaneSyncStatus`                                    | enum           | non                  | `"NOT_SYNCED"`                      | `NOT_SYNCED / SYNCED / ERROR`                                                                                                   |
| `superPdpInvoiceId`                                      | String         | non                  | —                                   | ID e-invoicing                                                                                                                  |
| `eInvoiceStatus`                                         | enum           | non                  | `"NOT_SENT"`                        | 9 valeurs (cf §35)                                                                                                              |
| `eInvoiceSentAt`                                         | Date           | non                  | —                                   |                                                                                                                                 |
| `archivedPdfUrl`                                         | String         | non                  | —                                   | URL PDF/A-3 Factur-X archivé                                                                                                    |
| `eInvoiceError`                                          | String         | non                  | —                                   |                                                                                                                                 |
| `facturXData.{xmlGenerated, profile, generatedAt}`       | Object         | non                  | profil `EN16931`                    |                                                                                                                                 |
| `eInvoiceFlowType`                                       | enum           | non                  | `"NONE"`                            | `E_INVOICING / E_REPORTING_TRANSACTION / E_REPORTING_PAYMENT / NONE`                                                            |
| `eInvoiceFlowReason`                                     | String         | non                  | —                                   | Explication FR du routage                                                                                                       |
| `eInvoiceRoutingDetails`                                 | Object         | non                  | —                                   | `{isB2B, sellerInFrance, clientInFrance, sellerVatRegistered, clientVatRegistered, obligationActive, companySize, evaluatedAt}` |

### 3.2 `items` (sous-schéma)

Chaque article contient au minimum :

- `description`, `quantity`, `unitPrice`, `vatRate` (%)
- `unit` (`forfait` / `heure` / etc.)
- `discount`, `discountType` (`PERCENTAGE` / `FIXED`)
- `details` (texte long)
- `vatExemptionText` (mention spécifique si TVA = 0)
- `progressPercentage` (uniquement pour les factures de situation, 0-100)

### 3.3 `client` (snapshot)

⚠️ Le `client` est **embarqué** dans la facture, pas une référence — c'est volontaire pour figer les infos client au moment de la facturation (le client peut changer d'adresse après émission, la facture doit garder l'historique).

Champs : `id` (ref `Client`), `name`, `email`, `address.{street, city, postalCode, country}`, `siret`, `vatNumber`, `hasDifferentShippingAddress`, `shippingAddress`...

### 3.4 Indexes

```js
{ workspaceId: 1, createdAt: -1 }
{ workspaceId: 1, status: 1 }
{ workspaceId: 1, "client.name": 1 }
{ workspaceId: 1, dueDate: 1 }
{ workspaceId: 1, eInvoiceFlowType: 1 }
{ createdBy: 1 }
{ issueDate: -1 }
{ workspaceId: 1, issueDate: -1 }
{ workspaceId: 1, invoiceType: 1, purchaseOrderNumber: 1 }  // Situations
{ issueYear: 1 }
// Index unique critique :
{ prefix: 1, number: 1, workspaceId: 1, issueYear: 1 } unique partial { number: { $exists: true } }
```

### 3.5 Méthodes statiques

- `Invoice.numberExistsForYear(number, workspaceId, year)` — utilitaire pour migrations / contrôles externes

### 3.6 Hooks Mongoose

- `pre("save")` — set `issueYear` depuis `issueDate.getFullYear()` ou now

---

## 4. Numérotation des factures (système complet)

### 4.1 Structure : `prefix` + `number`

Une "référence facture" affichée à l'utilisateur (ex : `F-202605-0042`) est en réalité **deux champs distincts en base** :

- **`prefix`** : préfixe libre, max 10 caractères, format par défaut `F-{YYYY}{MM}` (ex : `F-202605`)
- **`number`** : compteur séquentiel, padded sur 4 chiffres, regex `[A-Za-z0-9-]{1,50}`

C'est la **combinaison `(prefix, number, workspaceId, issueYear)`** qui est unique en base, pas le `number` seul.

### 4.2 Génération atomique : `DocumentCounter`

Le numéro n'est **pas** calculé par un `count() + 1` (race condition fatale en concurrence). Il passe par un compteur dédié — modèle `DocumentCounter` (`newbi-api/src/models/DocumentCounter.js`) :

```js
{
  documentType: "invoice" | "quote" | "creditNote" | "purchaseOrder",
  prefix: String,
  workspaceId: String,
  lastNumber: Number  // dernier numéro émis
}
// Index unique : (documentType, prefix, workspaceId)
```

La méthode statique `getNextNumber()` :

1. Calcule `existingMax` = `max(number)` des documents `PENDING/COMPLETED/CANCELED` du préfixe
2. Si le `lastNumber` du compteur diverge → resync sur `existingMax`
3. `findOneAndUpdate({ $inc: { lastNumber: 1 } }, { upsert: true })` — atomique
4. Si upsert (compteur créé from scratch) avec `existingMax > 0`, ajuste à `existingMax + 1`
5. Retourne le nouveau `lastNumber`

Cette atomicité garantit qu'aucune émission simultanée ne peut produire de doublon, même sous forte concurrence.

⚠️ **Subtilité critique** : la clé du compteur est `(documentType, prefix, workspaceId)` — **pas d'année dedans** (`DocumentCounter.js:18-21`). Donc la séquence repart **uniquement quand tu changes de préfixe**. Si tu gardes `F-202605` toute l'année, tu fais 0001→9999 sans reset annuel automatique.

### 4.3 Auto-réparation contre la dérive (self-heal)

À chaque génération, `getExistingMaxNumber()` (`DocumentCounter.js:80-112`) :

- Cherche tous les documents `PENDING / COMPLETED / CANCELED` du préfixe (DRAFT exclus)
- Extrait les `number` purement numériques (`/^\d+$/`)
- Retourne `Math.max(...numericNumbers)`

Si le compteur diverge du max réel (suppression d'une facture finalisée, restore manuel en BDD, migration), il se resynchronise sur ce max avant d'incrémenter (`DocumentCounter.js:46-52`). C'est la sécurité contre les "trous fantômes" et les ré-importations.

### 4.4 Le cas spécial des `DRAFT`

Les brouillons sont un **monde parallèle** :

- Leur `number` n'est pas requis (`Invoice.js:42-58`)
- Quand il existe, il est préfixé `DRAFT-` (ex : `DRAFT-0042`) pour ne **jamais polluer la séquence officielle**
- `checkInvoiceNumberExists` (`invoice.js:830-839`) exclut explicitement les DRAFT (`status: { $ne: "DRAFT" }`)
- `getExistingMaxNumber` exclut les DRAFT du calcul du max (`DocumentCounter.js:82`)

**Gestion des conflits DRAFT** (`invoice.js:1075-1100`, `documentNumbers.js:381-388`) :
Si deux drafts veulent le même numéro, le code renomme l'ancien en `DRAFT-{n}-{timestamp}`. Collision résolue silencieusement, l'utilisateur ne voit rien.

### 4.5 Validation d'un brouillon → numéro définitif

`handleDraftValidation` (`documentNumbers.js:66+`) :

1. Extrait le numéro propre (retire le préfixe `DRAFT-` ou `TEMP-`)
2. Si numéro temporaire `TEMP-`, génère le prochain séquentiel
3. Vérifie qu'aucune facture finalisée du workspace ne porte déjà ce numéro
4. Renomme les drafts conflictuels (suffixe timestamp 6 chiffres)
5. Retourne le numéro final

C'est le moment où le numéro **devient figé**.

### 4.6 Flux complet de `generateInvoiceNumber`

`documentNumbers.js:321-443` :

```
generateInvoiceNumber(customPrefix, options) {
  prefix = customPrefix || `F-${YYYY}${MM}`

  if (options.isDraft) {
    if (options.manualNumber) {
      // Vérifier conflit avec finalisées → return `DRAFT-{manual}` si conflit
      // Vérifier conflit avec autres drafts → renommer l'ancien
      return `DRAFT-${manualNumber}`
    }
    // Sinon : générer séquentiel via DocumentCounter, préfixer DRAFT-
    return `DRAFT-${nextSequentialNumber}`
  }

  if (options.isValidatingDraft && options.currentDraftNumber) {
    return handleDraftValidation(...)
  }

  if (options.manualNumber) {
    return options.manualNumber  // Bypass séquentiel si manuel
  }

  // Cas standard : compteur atomique
  return generateInvoiceSequentialNumber(prefix, options)
}
```

### 4.7 Verrouillages une fois figé

Une fois sortie de DRAFT :

- **L'année d'émission ne peut plus changer** (`invoice.js:1565-1568`) — sinon ça casserait l'index unique par `issueYear`
- **Le numéro peut techniquement être édité**, mais seulement si aucune autre facture `PENDING/COMPLETED` ne l'utilise déjà (`invoice.js:1547-1563`) — autant dire "jamais en pratique"
- **Une facture `COMPLETED` est lockée** sauf admin/owner (`invoice.js:1531-1537`)
- **Une facture `CANCELED` est définitivement gelée** (`invoice.js:1539-1544`)

### 4.8 Pourquoi c'est **vital** légalement

- **Code général des impôts français, art. 242 nonies A** : la numérotation des factures doit être **chronologique, continue, sans rupture de séquence**. Un numéro manquant = présomption de facture détruite = redressement fiscal.
- **C'est pourquoi `CANCELED` existe au lieu de `DELETE`** : tu ne peux pas supprimer une facture émise, tu peux seulement l'annuler. Son numéro reste comptabilisé dans la séquence (`getExistingMaxNumber` inclut bien `CANCELED`).
- **L'avoir doit référencer la facture originale par son numéro** (`CreditNote.js:58-62`, `originalInvoiceNumber: required: true`) — preuve de chaîne comptable.
- **Réforme e-invoicing 2026 / Factur-X** : le numéro fait partie du XML signé envoyé à SuperPDP / la PDP. Un numéro modifié après émission = incohérence avec l'archive légale.
- **Sync Pennylane** : `pennylaneId` est mappé sur le numéro. Renuméroter casse le rapprochement.

### 4.9 Subtilités piégeuses

1. **Compteur par préfixe uniquement, index unique par préfixe + année**. Si tu mets le même préfixe sur deux années (`F-CLIENT` en 2025 et 2026), le counter continue (51, 52...) mais l'index autorise les doublons inter-année — donc tu peux avoir deux `F-CLIENT-0042` dont un en 2025 et un en 2026. Fonctionnel mais surprenant.

2. **`checkInvoiceNumberExists` ignore les DRAFT** : un utilisateur peut "réserver" un numéro en brouillon, puis voir un autre user créer une PENDING avec ce numéro, et le draft sera renommé en `DRAFT-{n}-{timestamp}` sans alerte UI.

3. **`numberExistsForYear`** (`Invoice.js:552-564`) checke par année — utile pour migrations, pas câblé partout.

4. **`F-AAAAMM` par défaut figé au mois de création** : si tu crées une facture en mai pour un client, son préfixe est `F-202605` même si tu changes la `issueDate` en juin (le préfixe ne se recalcule pas — c'est un default uniquement à la création).

5. **Les factures importées (`ImportedInvoice.js`) et Stripe (`stripeInvoiceId`) ont leur propre numérotation** indépendante du compteur — ne participent pas au contrôle d'unicité Newbi.

6. **Pas de session MongoDB transactionnelle obligatoire** : `getNextNumber` accepte `options.session` mais n'est pas systématiquement appelé dans une transaction côté `createInvoice`. La race "create + crash avant save" peut donc laisser un trou (counter à N+1 mais pas de doc N+1) → la self-heal du counter (`DocumentCounter.js:46`) corrigera au prochain appel.

7. **L'utilisateur a un `settings.invoiceNumberPrefix` dans son profil** : si défini, il est utilisé en priorité (`invoice.js:1116-1117`).

---

## 5. Statuts et transitions

### 5.1 Les 5 statuts

Source : `newbi-api/src/models/constants/enums.js:6-12`

- **`DRAFT`** est le seul statut où le `number` n'est pas requis (`Invoice.js:42-58`) et où l'année d'émission peut encore changer (`invoice.js:1565-1568`) ; il est exclu du contrôle d'unicité de numéro (`invoice.js:832`) et permet une suppression/modification libre.

- **`PENDING`** est le statut "envoyée, en attente de règlement" : à partir de là le `number` devient obligatoire et figé, la facture rentre dans le contrôle d'unicité `(prefix, number, workspaceId, issueYear)` (`invoice.js:1551`, `Invoice.js:537-549`), et c'est l'état de départ pour les relances et le passage automatique en `OVERDUE`.

- **`OVERDUE`** est le statut "en retard de paiement" déclenché par le cron quotidien `overdueAutomationCron.js:10` à 8h00 Europe/Paris quand `dueDate < now` ; il reste comptablement traité comme une créance ouverte (regroupé avec `PENDING` dans les analytics — `financialAnalytics.js:678,738,1235`) et déclenche les automatisations `INVOICE_OVERDUE` (`ClientAutomation.js:42`, `DocumentAutomation.js:39`).

- **`COMPLETED`** est le statut "payée / clôturée" posé automatiquement par `markInvoiceAsPaid` (`invoice.graphql:186`) avec set du `paymentDate` ; la facture devient verrouillée en modification sauf rôle `admin`/`owner` (`invoice.js:1531-1537`) et participe toujours au contrôle d'unicité de numéro (`invoice.js:1551`).

- **`CANCELED`** est le statut terminal d'annulation : la facture n'est **jamais** modifiable, même par admin/owner (`invoice.js:1539-1544`), mais reste comptée dans les stats (`invoice.js:156`, `invoice.js:612`) pour conserver la traçabilité — l'annulation business propre passe plutôt par l'émission d'un **avoir** (`CreditNote.js:51-56`) que par ce statut.

### 5.2 Transitions

```
DRAFT ──(finalisation)──► PENDING ──(markAsPaid)──► COMPLETED
                              │
                              ├──(cron 8h)──► OVERDUE ──(markAsPaid)──► COMPLETED
                              │
                              └──(changeStatus)──► CANCELED
```

### 5.3 Mutations qui changent le statut

- `markInvoiceAsPaid(id, paymentDate)` — DRAFT/CANCELED rejetés (`invoice.js:2488-2504`)
- `changeInvoiceStatus(id, status)` — transitions manuelles
- Cron `overdueAutomationCron.js` — passage auto PENDING→OVERDUE
- `createInvoice` avec `status` explicite (par défaut DRAFT)

### 5.4 Mappings UI

`src/graphql/invoiceQueries.js:1397-1454` :

```js
INVOICE_STATUS = { DRAFT, PENDING, COMPLETED, CANCELED };
INVOICE_STATUS_LABELS = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  COMPLETED: "Terminée",
  CANCELED: "Annulée",
};
INVOICE_STATUS_COLORS = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELED: "bg-red-100 text-red-700 border-red-200",
};
```

⚠️ **OVERDUE n'a pas de label/color UI** car l'onglet "En retard" est calculé front-side à partir de `PENDING` + `dueDate < now`. Le statut OVERDUE existe en base mais n'est pas affiché tel quel dans le tableau.

---

## 6. Page liste — `/dashboard/outils/factures`

Fichier : `app/dashboard/outils/factures/page.jsx` (524 lignes)

### 6.1 Structure visuelle (desktop)

```
┌──────────────────────────────────────────────────────────────────┐
│ Header : "Factures clients"  [🔔][⚙️][↓Importer][↑Exporter][+ Nouvelle] │
├──────────────────────────────────────────────────────────────────┤
│ KPIs : [CA facturé HT | CA payé HT]   [Factures en retard]      │
├──────────────────────────────────────────────────────────────────┤
│ Sticky : [🔍 Recherche]  [Filtres ▾]                             │
│ Tabs : [Toutes][Brouillons][À encaisser][En retard][Terminées]   │
├──────────────────────────────────────────────────────────────────┤
│ Table TanStack (colonnes triables, pagination)                   │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 KPIs calculés côté client

Calculés dans `page.jsx:127-185` à partir des données **filtrées** (pas du dataset complet) :

- **CA facturé HT** : somme `finalTotalHT` des factures non-DRAFT (toutes incluses sauf brouillons)
- **CA payé HT** : somme `finalTotalHT` des factures `COMPLETED`
- **Factures en retard** : count + somme `finalTotalHT` des `PENDING` dont `dueDate < aujourd'hui`

⚠️ Subtilités :

- `dueDate` peut arriver en plusieurs formats (timestamp string, timestamp number, ISO) — le code teste `/^\d+$/` avant de parser (`page.jsx:165-169`)
- Pour les factures importées (`_type === "imported"`), seules les `VALIDATED` ou `COMPLETED` comptent dans `totalBilled` (pas de DRAFT possible côté importé)
- Les KPIs réagissent aux filtres : changer un filtre = recalcul des montants affichés

### 6.3 Boutons header (desktop)

| Bouton                | Action                                                 | Composant                                     |
| --------------------- | ------------------------------------------------------ | --------------------------------------------- |
| 🔔 (Bell / MailCheck) | Ouvre `AutoReminderModal`                              | Config relances                               |
| ⚙️ (Settings)         | Ouvre `InvoiceSettingsModal`                           | Préfixe par défaut, mentions, conditions      |
| ↓ Importer            | Set `triggerImport: true` → ouvre `ImportInvoiceModal` | Import PDF direct                             |
| ↑ Exporter            | `InvoiceExportButton` (cf §28)                         | CSV/Excel/FEC/Sage/Cegid                      |
| + Nouvelle facture    | `router.push("/dashboard/outils/factures/new")`        | `PermissionButton` requiresActiveSubscription |

### 6.4 Création réussie : flow toast → email

Quand une facture vient d'être créée, l'éditeur stocke `newInvoiceData` dans `sessionStorage` puis redirige vers la liste. Le `useEffect` (`page.jsx:48-105`) :

1. Lit `sessionStorage.getItem("newInvoiceData")`
2. Parse le JSON `{id, number, clientName, clientEmail, totalAmount, ...}`
3. Affiche un toast "Facture créée avec succès" via `toastManager`
4. Si `clientEmail` présent, ajoute un bouton "Envoyer au client" qui ouvre `SendDocumentModal`
5. Nettoie la session storage

Même mécanisme pour `newCreditNoteData` (avoirs).

⚠️ **Flow fragile** : si l'utilisateur recharge entre la création et le retour à la liste, le toast disparaît. Acceptable car nice-to-have.

### 6.5 Pré-filtrage URL

Le tableau réagit à `?status=overdue` (entre autres) via `URLSearchParams` pour atterrir directement sur l'onglet correspondant — utilisé depuis le dashboard principal pour drill-down (`invoice-table.jsx:286-297`). Valeurs autorisées : `all`, `draft`, `pending`, `overdue`, `completed`.

Aussi `?id={invoiceId}` ouvre directement la sidebar de cette facture (`page.jsx:107-114`), puis nettoie l'URL via `router.replace` sans scroll.

### 6.6 Mode mobile

Layout différent (`page.jsx:367-414`) :

- Pas de KPIs visibles
- Header compact : titre + boutons icon-only (Bell, Settings, +)
- Tabs scrollables horizontalement
- Infinite scroll au lieu de pagination

---

## 7. Le tableau (`invoice-table.jsx`)

Fichier : `app/dashboard/outils/factures/components/invoice-table.jsx` (1326 lignes)
Hook associé : `app/dashboard/outils/factures/hooks/use-invoice-table.js` (1045 lignes)

### 7.1 Source des données

Deux datasets fusionnés (`invoice-table.jsx:172-196`) :

- **Factures normales** : `useInvoices()` GraphQL → `_type: "normal"`
- **Factures importées** : `useImportedInvoices(workspaceId)` GraphQL → `_type: "imported"` (PDF déposés sans rédaction interne)

Triés par `issueDate` desc et combinés dans `combinedInvoices` (useMemo).

Les factures importées sont mappées pour compatibilité :

```js
{
  ...inv,
  _type: "imported",
  client: { name: inv.client?.name || inv.vendor?.name || "Client inconnu" },
  issueDate: inv.invoiceDate,
  total: inv.totalTTC
}
```

### 7.2 Colonnes (TanStack Table)

Définies dans `use-invoice-table.js:239+` :

| Colonne          | Accessor              | Tri | Filtre                  | Subtilité                                                                                                                                  |
| ---------------- | --------------------- | --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `_type` (cachée) | `_type`               | non | `invoiceType`           | Distingue normal/importée                                                                                                                  |
| ☐ Sélection      | `select`              | non | non                     | Bulk delete                                                                                                                                |
| Client           | `client.name`         | oui | `client` (multi-select) | Affiche aussi `prefix+number` en sous-titre, ou "Brouillon" si pas de numéro. Badge violet "↑" pour les importées avec tooltip             |
| Référence        | `purchaseOrderNumber` | oui | non                     | Référence devis ou bon de commande client (max 160px truncate)                                                                             |
| Montant HT       | `finalTotalHT`        | oui | non                     | `Intl.NumberFormat fr-FR` EUR. Fallback `totalHT` si pas de `finalTotalHT`                                                                 |
| TVA              | `finalTotalVAT`       | oui | non                     | Pareil                                                                                                                                     |
| Montant TTC      | `finalTotalTTC`       | oui | non                     | **Recalcule l'escompte côté UI** (`use-invoice-table.js:510-540`) — c'est `finalTotalTTC` après remise mais avant escompte qui est en base |
| Date émission    | `issueDate`           | oui | `dateRange`             | Parser robuste pour 3 formats (timestamp string/number/Date), format `JJ/MM/AAAA` français                                                 |
| Échéance         | `dueDate`             | oui | non                     | Pareil                                                                                                                                     |
| Statut           | `status`              | oui | `status` (multi-select) | Badge avec `INVOICE_STATUS_COLORS`                                                                                                         |
| Email tracking   | (custom)              | non | non                     | `EmailTrackingStatus` — affiche ouvert/cliqué via subscription temps réel                                                                  |
| Actions          | (custom)              | non | non                     | `InvoiceRowActions` (cf §12)                                                                                                               |

### 7.3 Recalcul TTC avec escompte

Code spécial dans `use-invoice-table.js:510-540` :

```js
const escompteValue = parseFloat(invoice.escompte) || 0;
let amount = invoice.finalTotalTTC;

if (escompteValue > 0) {
  const totalHT = invoice.finalTotalHT ?? invoice.totalHT ?? 0;
  const totalVAT = invoice.finalTotalVAT ?? invoice.totalVAT ?? 0;

  const escompteAmount = (totalHT * escompteValue) / 100;
  const htAfterEscompte = totalHT - escompteAmount;
  const tvaAfterEscompte = invoice.isReverseCharge
    ? 0
    : (htAfterEscompte / totalHT) * totalVAT;
  amount = htAfterEscompte + tvaAfterEscompte;
}
```

⚠️ Si tu ajoutes un autre affichage (PDF, export, mail), **n'oublie pas l'escompte** ou utilise une fonction utilitaire commune. C'est un piège récurrent.

### 7.4 Tracking email temps réel

`useEmailTrackingSubscription` (`invoice-table.jsx:140-147`) écoute la subscription GraphQL → quand un client ouvre/clique sur l'email, le hook déclenche `refetch()` et la colonne EmailTracking met à jour son badge sans refresh manuel.

Les états trackés sur `invoice.emailTracking` :

- `emailSentAt` — envoi enregistré
- `emailOpenedAt` + `emailOpenCount` — pixel tracking
- `emailClickedAt` + `emailClickCount` — liens trackés
- `trackingToken` — UUID unique pour identifier la facture
- `resendMessageId` — ID Resend pour debug

### 7.5 Tri & pagination

- **Tri** : géré par TanStack `getSortedRowModel`. Click sur header → toggle asc/desc.
- **Pagination desktop** : `getPaginationRowModel`, taille configurable (10/25/50/100). Position courante affichée bas de table.
- **Mobile** : pas de pagination → infinite scroll (cf §14).

---

## 8. Filtres avancés (`invoice-filters.jsx`)

Fichier : `app/dashboard/outils/factures/components/invoice-filters.jsx` (526 lignes)

Composant déroulant qui pilote 4 filtres distincts cumulatifs :

### 8.1 `statusFilter` (multi-select)

Checkboxes sur les 4 statuts UI (`DRAFT`, `PENDING`, `COMPLETED`, `CANCELED`) avec couleurs `INVOICE_STATUS_COLORS`. Combinable.

### 8.2 `clientFilter` (multi-select)

Liste auto-générée des clients uniques extraits du dataset (`invoice-filters.jsx:64-74`). Tri alphabétique. Plusieurs clients peuvent être cochés.

### 8.3 `dateFilter` (range picker)

Sur `issueDate`. Raccourcis disponibles (`invoice-filters.jsx:91+`) :

- `today` — aujourd'hui
- `yesterday` — hier
- `last7days` — 7 derniers jours
- `last30days` — 30 derniers jours
- `thisMonth` — mois en cours
- `lastMonth` — mois précédent
- `thisYear` — année en cours
- `lastYear` — année précédente

Filtre custom `dateFilterFn` (`use-invoice-table.js:171-212`) qui applique :

- `from <= date <= to` si les deux sont définis
- `date >= from` ou `date <= to` si un seul est défini

### 8.4 `typeFilter` (single)

`"normal"` / `"imported"` / `""` (toutes). Filtre sur `_type`.

### 8.5 Badge compteur

Un badge sur le bouton "Filtres" affiche le total cumulé : `selectedStatuses.length + selectedClients.length + (dateFilter ? 1 : 0) + (typeFilter ? 1 : 0)`.

Bouton "Effacer tous les filtres" reset tout d'un coup.

---

## 9. Recherche globale et filtre dates

### 9.1 `globalFilter` (recherche multi-colonnes)

Implémenté dans `memoizedMultiColumnFilter` (`use-invoice-table.js:49-149`). Cherche dans :

- Nom du client (`invoice.client?.name || invoice.vendor?.name`)
- Numéro de facture (`invoice.number || invoice.originalInvoiceNumber`)
- **Dates en 11 formats différents** (cf 9.2)
- Statut (libellé français traduit via `INVOICE_STATUS_LABELS` ou `IMPORTED_INVOICE_STATUS_LABELS`)
- Montant : `finalTotalTTC.toString()`, avec ou sans virgule, avec ou sans séparateur

### 9.2 Les 11 formats de date supportés

```js
formatDate(dateValue) → [
  "12/05/2026",        // JJ/MM/AAAA
  "2026-05-12",        // AAAA-MM-JJ ISO
  "12-05-2026",        // JJ-MM-AAAA
  "12/05",             // JJ/MM partiel
  "12-05",             // JJ-MM partiel
  "12",                // jour seul
  "05/2026",           // MM/AAAA
  "05-2026",           // MM-AAAA
  toLocaleDateString("fr-FR", { day, month, year }),
  toLocaleDateString("fr-FR", { day, month }),
  toLocaleDateString("fr-FR", { month, year })
]
```

Chaque format est tenté pour l'`issueDate` et la `dueDate`. Un user qui tape "12/05" trouve toutes les factures du 12 mai, peu importe l'année.

### 9.3 Recherche permissive

L'algorithme final est `searchableContent.some(c => c.includes(searchTerm.toLowerCase().trim()))` — donc **substring match**, casse insensible, sans accents normalisés (attention aux accents). Si tu tapes "facture" et qu'un client s'appelle "Société Facture-Pro SAS", il matchera.

---

## 10. Onglets de filtre rapide

`Tabs` de `invoice-table.jsx:268-284`. Chaque tab pré-remplit `statusFilter` et trigger un fade transition mobile :

| Tab         | `statusFilter`                           | Logique additionnelle                                          |
| ----------- | ---------------------------------------- | -------------------------------------------------------------- |
| Toutes      | `[]`                                     | Aucun filtre statut                                            |
| Brouillons  | `["DRAFT"]`                              |                                                                |
| À encaisser | `["PENDING"]`                            |                                                                |
| En retard   | `[]` + filtrage custom `displayInvoices` | `status === "PENDING"` ET `dueDate < now` (calculé à la volée) |
| Terminées   | `["COMPLETED"]`                          |                                                                |

### 10.1 Calcul des compteurs par tab

`invoiceCounts` (`invoice-table.jsx:300-328`) parcourt `combinedInvoices` une fois et compte :

- `all` = total
- `draft` = `status === "DRAFT"`
- `pending` = `status === "PENDING"`
- `overdue` = `status === "PENDING"` ET `dueDate < now`
- `completed` = `status === "COMPLETED"`

Affichés en badge sur chaque onglet.

### 10.2 Pourquoi "En retard" est calculé front-side

Le statut OVERDUE existe en base (set par `overdueAutomationCron.js`), mais l'onglet UI utilise sa propre logique pour rester cohérent même si le cron n'est pas passé (lag jusqu'à 24h). Conséquence : une facture peut apparaître "en retard" dans l'onglet alors qu'elle est encore PENDING en base.

---

## 11. Sélection multiple et bulk delete

### 11.1 Mécanique

- Checkbox header : sélectionne toutes les rows de la page courante (`table.toggleAllPageRowsSelected`)
- Checkbox row : sélection individuelle (`row.toggleSelected`)
- État géré par TanStack via `useReactTable`, accessible via `selectedRows = table.getFilteredSelectedRowModel().rows`

### 11.2 Bouton bulk delete

Visible uniquement quand `selectedRows.length > 0` (`invoice-table.jsx:493+`) :

- Bouton rouge "Supprimer (n)" dans la toolbar
- Click → `AlertDialog` de confirmation avec message explicite ("Êtes-vous sûr de vouloir supprimer N facture(s) ?")

### 11.3 Logique de delete

`handleDeleteSelected` (`use-invoice-table.js`) :

- Itère sur `selectedRows`
- Selon `_type`, appelle `deleteInvoice` ou `deleteImportedInvoice`
- Promise.all pour parallélisme
- Toast de feedback global ("N facture(s) supprimée(s)")
- Refetch
- Reset selection

⚠️ **Côté backend, `deleteInvoice` est interdit pour les factures finalisées** (lock `COMPLETED`). En pratique le bulk delete ne fonctionne que sur des DRAFT — les autres lèvent une erreur silencieusement. **Améliorer l'UX** : pré-filtrer côté front pour ne sélectionner que les supprimables.

### 11.4 Bulk export

Quand des rows sont sélectionnées, le bouton Export passe en mode "exporter la sélection" (cf §28.2).

---

## 12. Actions par ligne (`invoice-row-actions.jsx`)

Fichier : `app/dashboard/outils/factures/components/invoice-row-actions.jsx`

### 12.1 Détection des permissions

À l'init (`useEffect`) :

- `useSubscriptionAccess()` → `isReadOnly`, `isOwner`
- `usePermissions().canCreate("creditNotes")` → conditionne "Convertir en avoir"

### 12.2 Adaptive : mobile vs desktop

- **Desktop** : actions principales en `ButtonGroup` + dropdown "..." pour les secondaires
- **Mobile (<768px)** : tap sur la row → `InvoiceMobileFullscreen` plein écran

### 12.3 Différenciation normale vs importée

Les factures importées (`_type === "imported"`) n'ont pas accès à la plupart des actions (pas de PDF généré, pas de relance, pas d'avoir, pas de send) — elles ouvrent juste leur `ImportedInvoiceSidebar` dédiée pour visualiser le PDF original.

### 12.4 Liste exhaustive des actions

| Action                   | Effet                                                       | Mutation/route                        | Conditions d'affichage                                             |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| 👁️ Voir                  | Ouvre sidebar (desktop) ou fullscreen (mobile)              | —                                     | Toujours                                                           |
| ✏️ Modifier              | Redirect `/[id]/editer`                                     | —                                     | `status !== COMPLETED` (sauf admin/owner) ET `status !== CANCELED` |
| ✓ Marquer payée          | Set `status = COMPLETED`, `paymentDate = today`             | `markInvoiceAsPaid(id, paymentDate)`  | `status === PENDING` ou `OVERDUE`                                  |
| ✗ Annuler                | Set `status = CANCELED`                                     | `changeInvoiceStatus(id, "CANCELED")` | `status !== DRAFT`                                                 |
| 🧾 Convertir en avoir    | Redirect `/[id]/avoir/nouveau`                              | —                                     | Permission `creditNotes:create` ET facture finalisée               |
| 📥 Télécharger PDF       | Hit `/api/invoices/generate-pdf` ou utilise `cachedPdf.url` | `POST /api/invoices/generate-pdf`     | Toujours sauf DRAFT                                                |
| ✉️ Envoyer par email     | Ouvre `SendDocumentModal`                                   | `sendInvoice(id, email)`              | `clientEmail` présent                                              |
| 📋 Sauver comme template | Ouvre `SaveInvoiceTemplateDialog`                           | `SAVE_INVOICE_AS_TEMPLATE`            | Toujours                                                           |
| 🔔 Configurer relances   | Ouvre `AutoReminderModal`                                   | —                                     | `status PENDING / OVERDUE`                                         |
| 🗑️ Supprimer             | Confirmation puis delete                                    | `deleteInvoice(id)`                   | `status === DRAFT` recommandé (COMPLETED bloqué côté API)          |

### 12.5 Effets de bord côté backend

`markInvoiceAsPaid` (`invoice.js:2452-2620`) déclenche en cascade :

1. Set `status = COMPLETED`, `paymentDate = new Date(input)`
2. Notification "Paiement reçu" (fire-and-forget)
3. Si `client.id`, exécute automations CRM :
   - `FIRST_INVOICE_PAID` si c'est la première
   - `INVOICE_PAID` toujours
4. Document automations (`INVOICE_PAID`) — fire-and-forget
5. Sync Pennylane si configuré (`syncInvoiceIfNeeded`) — fire-and-forget
6. (Réservé) e-reporting paiement — commenté en attente d'API SuperPDP

⚠️ Toutes les automations sont fire-and-forget : si elles échouent, la mutation principale réussit quand même. Acceptable car ce sont des effets secondaires.

---

## 13. Sidebar / preview (`invoice-sidebar.jsx`)

Fichier : `app/dashboard/outils/factures/components/invoice-sidebar.jsx` (1406 lignes)

### 13.1 Trigger

Cliquer sur une row du tableau n'ouvre **pas** la page détail — elle ouvre une **sidebar à droite** (~50% largeur écran) qui affiche un résumé complet sans quitter la liste.

### 13.2 Contenu

- **Header** : nom client + numéro facture + badge statut + bouton fermer
- **Preview PDF inline** (composant `InvoicePreview` rendu en HTML/CSS, pas un PDF réel)
- **Métadonnées** : client, dates, montants HT/TVA/TTC, méthode paiement, e-invoicing status si applicable
- **Actions rapides** : tous les boutons de `InvoiceRowActions` répliqués
- **Section avoirs liés** : liste des `CreditNote` via `CreditNote.findByInvoice(invoiceId)` avec lien vers chacun
- **Tracking email** : section dédiée avec timeline (envoyé / ouvert / cliqué)
- **Notes internes** : si présentes
- **Activity log** : historique des changements de statut

### 13.3 Pourquoi gérer l'état au niveau du tableau

`onOpenSidebar: setInvoiceToOpen` est passé en prop depuis `InvoiceTable` (`invoice-table.jsx:243`). Si l'état était dans chaque `InvoiceRowActions`, ça causait des re-renders cascadés sur 100+ rows à chaque ouverture/fermeture. Commentaire explicite : `invoice-row-actions.jsx:45,92`.

### 13.4 Auto-ouverture par URL `?id=`

Si `?id=<invoiceId>` arrive dans l'URL, le `useEffect` (`page.jsx:107-114`) extrait l'ID, le passe au tableau, qui ouvre automatiquement la sidebar de la facture correspondante puis nettoie l'URL via `router.replace` (sans scroll). Utilisé pour les liens depuis notifications, emails internes, drill-down.

---

## 14. Mode mobile (fullscreen + infinite scroll)

### 14.1 Infinite scroll

`invoice-table.jsx:330-395` :

- `visibleMobileCount` initial à 20
- IntersectionObserver sur sentinel `mobileSentinelRef` (`rootMargin: 200px`)
- À chaque intersection : `setVisibleMobileCount(prev => Math.min(prev + 20, allMobileRows.length))`
- Skeleton de chargement pendant 300ms (UX ressentie)

### 14.2 Reset au changement de tab

```js
useEffect(() => {
  if (prevMobileTabRef.current !== activeTab) {
    setIsMobileTransitioning(true); // fade animation 150ms
    mobileScrollRef.current.scrollTop = 0;
    setVisibleMobileCount(20);
  }
}, [activeTab]);
```

### 14.3 `InvoiceMobileFullscreen`

Composant plein-écran qui remplace la sidebar sur mobile. Affiche le même contenu mais en stack vertical, avec navigation par gestures.

---

## 15. Création / édition (`ModernInvoiceEditor`)

Fichier : `app/dashboard/outils/factures/components/modern-invoice-editor.jsx` (744 lignes)
Hook : `app/dashboard/outils/factures/hooks/use-invoice-editor.js` (2400+ lignes)

### 15.1 Structure visuelle (split-screen)

```
┌──────────────┬──────────────────────────┐
│ Formulaire   │ Preview live (HTML/CSS)  │
│ ─────────    │ ┌──────────────────────┐ │
│ • Infos      │ │ [Logo entreprise]    │ │
│ • Client     │ │ FACTURE F-202605-... │ │
│ • Articles   │ │ Client : ...         │ │
│ • Remises    │ │ Articles : ...       │ │
│ • Notes      │ │ Total : XXX €        │ │
│ • Livraison  │ └──────────────────────┘ │
│ ─────────    │                          │
│ [Sauver brouillon] [Finaliser →]        │
└──────────────┴──────────────────────────┘
```

Layout : `lg:grid-cols-[2fr_3fr]` (2/5 + 3/5).

Sur mobile : plein écran, preview accessible via bouton dédié dans le header.

### 15.2 Modes

- `mode="create"` (`/new`)
- `mode="edit"` (`/[id]/editer`)
- `mode="creditNote"` (variant pour avoirs, utilise `ModernCreditNoteEditor`)

### 15.3 Pré-remplissage des défauts

`getInitialFormData(mode, initialData, session, organization)` (`use-invoice-editor.js:95`) :

- En `create` : champs vides + défauts org (préfixe, mentions, conditions, apparence)
- En `edit` : `initialData = invoice` chargé via GraphQL
- L'organisation hydrate `companyInfo` automatiquement quand elle est chargée (`use-invoice-editor.js:214-246`)

### 15.4 Auto-sync depuis devis / bon de commande

Si la facture a un `purchaseOrderNumber` reconnu, l'éditeur copie automatiquement (`use-invoice-editor.js:1338-1400`) :

- `retenueGarantie`, `escompte` (depuis le devis source)
- Items pré-remplis si conversion devis → facture

---

## 16. Sections du formulaire

Composants dans `app/dashboard/outils/factures/components/invoices-form-sections/` :

### 16.1 `InvoiceInfoSection.jsx`

- Préfixe (manuel ou automatique depuis `nextInvoiceNumber`)
- Numéro (auto-généré, désactivé en édition pour PENDING+)
- Date d'émission (date picker, validée contre `latestInvoiceIssueDate`)
- Date d'échéance (calculée +30j par défaut, modifiable)
- Type (`standard` / `deposit` / `situation`)
- Référence (purchaseOrderNumber, libre)

### 16.2 `client-selector.jsx`

- Combo box pour sélectionner un client existant
- Bouton "Nouveau client" qui ouvre une modale de création inline
- Indicateur "infos incomplètes" si le client manque de champs requis (lien direct vers édition fiche client)

### 16.3 `ItemsSection.jsx`

- Liste d'items avec drag & drop pour réordonner
- Pour chaque item : nom, description (textarea), quantité, PU HT, TVA% (select), unité, remise/article (montant + type)
- Bouton "Ajouter un article"
- Calcul live du total ligne affiché à droite
- Si `vatRate === 0` ET non `isReverseCharge`, propose un champ `vatExemptionText` obligatoire (mention légale d'exonération)

### 16.4 `ProgressSection.jsx`

Visible uniquement si `invoiceType === "situation"`. Champs :

- `situationNumber` (auto-incrémenté basé sur les situations précédentes)
- `situationReference` (texte libre pour grouper)
- `progressPercentage` par item (% d'avancement, 0-100)
- `contractTotal` (auto-calculé depuis le devis source si présent)

### 16.5 `DiscountsAndTotalsSection.jsx`

- Remise globale (montant ou %)
- Retenue de garantie (% pour BTP, max 100)
- Escompte (% pour règlement anticipé, max 100)
- **Affichage live des totaux calculés** :
  - Total HT brut
  - Remise appliquée
  - Total HT net (`finalTotalHT`)
  - TVA (recalculée proportionnellement)
  - Total TTC
  - Si escompte : montant escompte + Total TTC après escompte

### 16.6 `ShippingSection.jsx`

- Toggle "Facturer la livraison"
- Si activé : adresse livraison, montant HT, taux TVA (par défaut 20%)
- Validation : CP français regex `^\d{5}$`, adresse min 5 chars

### 16.7 `NotesAndFooterSection.jsx`

- Header notes (1000 chars max)
- Footer notes (2000 chars max)
- Conditions générales (textarea)
- Lien CGV : URL + titre du lien

### 16.8 `CustomFieldsSection.jsx`

- Liste de paires clé/valeur arbitraires
- Affichées dans le PDF en bas
- Pas de validation de format

---

## 17. Validation au submit

`handleSubmit` dans `use-invoice-editor.js:1869-2050+` valide en blocs :

### 17.1 Client

```js
if (!client?.id) errors.client = "Veuillez sélectionner un client"
else {
  - name requis
  - email requis
  - address.{street, city, postalCode, country} requis
  → errors.client.canEdit = true (lien direct vers édition client)
}
```

### 17.2 CompanyInfo

```js
if (!companyInfo?.name || !companyInfo?.email)
  errors.companyInfo = "Les informations de l'entreprise sont incomplètes";
```

### 17.3 Remise globale

```js
if (discountType === "PERCENTAGE") {
  if (discount > 100) errors.discount = "La remise ne peut pas dépasser 100%";
  if (discount < 0) errors.discount = "La remise ne peut pas être négative";
}
```

### 17.4 Livraison (si `billShipping: true`)

```js
- shipping.fullName : regex /^[a-zA-ZÀ-ÿ\s'-]{2,100}$/
- shipping.street : min 5 chars
- shipping.postalCode : regex /^\d{5}$/ (CP français strict)
- shipping.city : regex /^[a-zA-ZÀ-ÿ\s'-]{2,100}$/
- shipping.country : requis
- shipping.shippingAmountHT : nombre ≥ 0
```

### 17.5 Items

- Au moins 1 item
- Chaque item : `description`, `quantity > 0`, `unitPrice >= 0`, `vatRate` valide

### 17.6 Affichage des erreurs

Composant `validation-callout.jsx` en haut du formulaire :

- Liste des erreurs avec icône warning
- Si `error.canEdit === true`, lien cliquable qui ouvre la fiche concernée
- Sticky au top du form pour rester visible pendant le scroll

---

## 18. Calcul des totaux (HT / TVA / TTC / remise / escompte)

Source de vérité : `newbi-api/src/resolvers/invoice.js:52-140` — fonction `calculateInvoiceTotals` exportée et utilisée par `createInvoice`, `updateInvoice`, `createLinkedInvoice`.

### 18.1 Algorithme (étape par étape)

```js
calculateInvoiceTotals(items, discount, discountType, shipping, isReverseCharge) {

  // 1. Pour chaque item :
  for each item {
    let itemHT = quantity * unitPrice

    // 1a. Avancement (situations)
    progressPercentage = item.progressPercentage ?? 100
    itemHT *= progressPercentage / 100

    // 1b. Remise par item
    if (item.discount) {
      if (PERCENTAGE) itemHT *= (1 - min(item.discount, 100) / 100)
      else itemHT = max(0, itemHT - item.discount)
    }

    // 1c. TVA item
    itemVAT = isReverseCharge ? 0 : itemHT * (item.vatRate / 100)

    totalHT += itemHT
    totalVAT += itemVAT
  }

  // 2. Frais de livraison
  if (shipping.billShipping) {
    shippingHT = shipping.shippingAmountHT
    shippingVAT = isReverseCharge ? 0 : shippingHT * (shipping.shippingVatRate / 100)
    totalHT += shippingHT
    totalVAT += shippingVAT
  }

  totalTTC = totalHT + totalVAT

  // 3. Remise globale
  let discountAmount = 0
  if (discount) {
    if (PERCENTAGE) discountAmount = totalHT * min(discount, 100) / 100
    else discountAmount = discount
  }

  finalTotalHT = totalHT - discountAmount

  // 4. TVA recalculée proportionnellement après remise
  // Si finalTotalHT <= 0 (remise >= 100%), la TVA = 0
  let finalTotalVAT = 0
  if (!isReverseCharge && finalTotalHT > 0 && totalHT > 0) {
    finalTotalVAT = totalVAT * (finalTotalHT / totalHT)
  }

  finalTotalTTC = finalTotalHT + finalTotalVAT

  return { totalHT, totalVAT, totalTTC, finalTotalHT, finalTotalVAT, finalTotalTTC, discountAmount }
}
```

### 18.2 Remise par item vs remise globale

- **Remise par item** : appliquée d'abord, AVANT calcul TVA
- **Remise globale** : appliquée APRÈS calcul TVA, et la TVA est recalculée proportionnellement

Exemple : 100€ HT × 20% TVA = 120€ TTC, puis remise globale 10% :

- finalTotalHT = 100 × 0.9 = 90€
- finalTotalVAT = 20 × (90/100) = 18€
- finalTotalTTC = 90 + 18 = 108€

### 18.3 Escompte (calcul UI uniquement)

⚠️ **L'escompte n'est PAS dans `finalTotalTTC` en base.** Il est uniquement appliqué côté UI dans :

- La colonne TTC du tableau (`use-invoice-table.js:510-540`)
- L'affichage dans la preview / PDF

Formule :

```js
escompteAmount = totalHT * (escompte / 100);
htAfterEscompte = totalHT - escompteAmount;
tvaAfterEscompte = isReverseCharge ? 0 : (htAfterEscompte / totalHT) * totalVAT;
ttcAfterEscompte = htAfterEscompte + tvaAfterEscompte;
```

L'escompte ne déclenche **pas** de modification du `finalTotalTTC` en base — c'est une remise conditionnelle au paiement anticipé (CGV), pas un montant déduit du total facturable.

### 18.4 Auto-liquidation TVA

Si `isReverseCharge: true` :

- TVA = 0 partout (items, shipping, total)
- Mention obligatoire `"Auto-liquidation - TVA due par le preneur (art. 283-2 du CGI)"` ajoutée au PDF
- Concerne les ventes intracommunautaires B2B et certains cas BTP

### 18.5 Recalcul côté serveur

Le backend recalcule **toujours** côté serveur à `createInvoice` / `updateInvoice` (`invoice.js:1166-1172`) — sécurité contre la manipulation client. Les valeurs envoyées par l'UI sont écrasées.

---

## 19. Préfixes et numéros côté éditeur

Hook : `app/dashboard/outils/factures/hooks/use-invoice-number.js`

### 19.1 Au mount (mode `create`)

1. Lit `formData.prefix` (depuis défauts org ou settings utilisateur)
2. Appelle la query `nextInvoiceNumber(workspaceId, prefix, isDraft: true)` GraphQL
3. Reçoit un numéro **provisoire** (ex : `DRAFT-0042`)
4. Pré-remplit le formulaire

### 19.2 Au changement de préfixe

L'utilisateur peut éditer le préfixe librement. Chaque changement déclenche un debounce + nouvelle query `nextInvoiceNumber` pour le nouveau préfixe.

### 19.3 Au submit (finalisation)

- Si `status: "PENDING"` (Finaliser) → backend appelle `generateInvoiceNumber(prefix, { isDraft: false, isValidatingDraft: true, currentDraftNumber })` → numéro définitif assigné
- Si `status: "DRAFT"` → numéro provisoire conservé

### 19.4 Édition d'une facture existante

- En DRAFT : numéro modifiable (avec gestion de conflits)
- En PENDING/COMPLETED : numéro non éditable côté UI (champ disabled), bloqué côté backend (`invoice.js:1547-1563`)

---

## 20. DRAFT vs PENDING (sauvegarde brouillon vs finalisation)

### 20.1 Boutons distincts

- **"Sauver brouillon"** :
  - `createInvoice / updateInvoice` avec `status: "DRAFT"`
  - Pas de validation stricte
  - Numéro temporaire `DRAFT-NNNN`
  - Modification libre
  - `companyInfo` résolu dynamiquement (pas figé)

- **"Finaliser"** :
  - Valide tout (cf §17)
  - Génère le numéro définitif via `nextInvoiceNumber({ isDraft: false })`
  - Passe en `PENDING`
  - **Action irréversible** (lock côté backend)
  - `companyInfo` figé en snapshot

### 20.2 Pas d'auto-save

Le code d'auto-save est **commenté volontairement** (`use-invoice-editor.js:1474-1489`). C'est `react-hook-form` + son `isDirty` qui pilote l'avertissement "modifications non sauvegardées" sur navigation (beforeunload).

Si tu veux le réactiver, attention au :

- Debounce (sinon spam de mutations)
- Conflits de version optimistes Apollo (cache)
- Race conditions avec la finalisation manuelle

### 20.3 Lecture côté backend de l'intention DRAFT

```js
const isDraft = !input.status || input.status === "DRAFT";
```

Ce flag conditionne :

- Le snapshot `companyInfo` (pas figé pour DRAFT)
- La validation `validateInvoiceIssueDate` (skipped pour DRAFT)
- La génération du numéro (préfixe `DRAFT-` ou non)
- L'unicité (DRAFT exclu)

---

## 21. Cas spéciaux : acompte, situation, auto-liquidation

### 21.1 Facture d'acompte (`isDeposit: true`)

- Champ `depositAmount` : montant fixe
- Total figé à cette valeur (pas calculé depuis items)
- `invoiceType: "deposit"`
- Mention spéciale dans le PDF
- Lien obligatoire avec un devis (`sourceQuote` ou `purchaseOrderNumber`)
- Un devis ne peut avoir **qu'un seul acompte** (`invoice.js:2716-2721`)

### 21.2 Facture de situation (avancement de travaux)

- `invoiceType: "situation"`
- `situationNumber` (auto-incrémenté)
- `situationReference` (groupage)
- `purchaseOrderNumber` requis pour valider le cumul
- `contractTotal` (auto-calculé depuis devis source ou première situation)
- Validation backend (`invoice.js:898-1054`) : la somme TTC des situations ne peut pas dépasser `contractTotal`
- Items avec `progressPercentage` (% d'avancement par poste)
- PDF spécifique avec tableau de progression

### 21.3 Auto-liquidation TVA (`isReverseCharge: true`)

- TVA forcée à 0
- Mention légale ajoutée
- Cas d'usage : ventes intra-UE B2B, sous-traitance BTP
- **Bloque l'éligibilité au régime micro-entreprise** côté FacturX

---

## 22. Avoirs (notes de crédit)

Modèle : `newbi-api/src/models/CreditNote.js` (400 lignes)
Routes : `/[id]/avoir/nouveau` et `/[id]/avoir/[creditNoteId]`
Composants : `modern-credit-note-editor.jsx`, `enhanced-credit-note-form.jsx`, `credit-note-mobile-fullscreen.jsx`
Hooks : `use-credit-note-editor.js`, `use-credit-note-number.js`

### 22.1 Création

Depuis une facture finalisée, action "Convertir en avoir" → redirect vers `/[id]/avoir/nouveau`. La page utilise `ModernCreditNoteEditor` qui :

- Pré-remplit les items en **négatif** (montants ≤ 0 forcés)
- Force le lien `originalInvoice: ObjectId` (champ requis backend, `CreditNote.js:51-56`)
- Génère un numéro avec préfixe `AV-{YYYY}{MM}` distinct de la séquence facture
- Type d'avoir à choisir : `CORRECTION` / `COMMERCIAL_GESTURE` / `REFUND` / `STOCK_SHORTAGE`

### 22.2 Validation backend

Tous les montants doivent être ≤ 0 :

```js
totalHT, totalTTC, totalVAT, finalTotalHT, finalTotalVAT, finalTotalTTC : max: 0
```

C'est **inversé** par rapport à `Invoice.js`. Si tu fais un avoir manuellement, attention au signe.

### 22.3 Mode de remboursement (`refundMethod`)

- `NEXT_INVOICE` (défaut) — déduit du prochain règlement
- `BANK_TRANSFER` — virement de remboursement
- `CHECK` / `VOUCHER` / `CASH` — autres méthodes

### 22.4 Statut

Un seul statut : `CREATED` (`CREDIT_NOTE_STATUS = { CREATED }`). Pas de cycle de vie, l'avoir est immutable une fois créé.

### 22.5 Numérotation séparée

- Préfixe par défaut `AV-{YYYY}{MM}`
- Compteur `DocumentCounter` avec `documentType: "creditNote"` (séparé des factures)
- Index unique `(number, workspaceId, issueYear)` (sans préfixe — différence avec `Invoice`)
- Pas de DRAFT pour les avoirs (`CreditNote.js:38-49` : `number` toujours requis)

### 22.6 Affichage dans la sidebar facture

La sidebar de la facture originale liste tous ses avoirs liés via `CreditNote.findByInvoice(invoiceId)`. Click sur un avoir → ouvre la page `/[id]/avoir/[creditNoteId]` en plein écran.

### 22.7 Effets comptables

- L'avoir s'ajoute au FEC en **négatif** (Debit/Credit inversés)
- Pennylane : sync séparée comme document distinct
- E-invoicing : un avoir peut être envoyé à SuperPDP comme un avoir Factur-X (profil EN16931 supporte les avoirs)

---

## 23. Génération PDF (Puppeteer + Factur-X)

### 23.1 Pipeline complet

1. **UI** : click "Télécharger PDF" sur une facture
2. **Frontend** : `POST /api/invoices/generate-pdf` avec `{ invoiceId }`
3. **Route serverless** (`api/invoices/generate-pdf/route.js:9-100`) :
   - `launchBrowser()` lance Chromium via `@sparticuz/chromium` + `puppeteer-core` (compatible Vercel serverless)
   - Calcule `baseUrl` : `NEXT_PUBLIC_APP_URL` || `https://${VERCEL_URL}` || `http://localhost:3000`
   - `page.goto(${baseUrl}/pdf-generator/invoice/${invoiceId}, { waitUntil: "networkidle0", timeout: 60s })`
   - La page interne `/pdf-generator/invoice/[id]` :
     - Fetch les données via `GET /api/invoices/data/[id]` (route MongoDB directe)
     - Rend le composant `InvoicePreview` avec les données réelles
     - Utilise `jsPDF` + `html2canvas` ou `@react-pdf/renderer` selon le template
     - Stocke le résultat dans `window.pdfGenerationResult = { success, buffer, error }`
   - Puppeteer `waitForFunction(() => window.pdfGenerationResult !== undefined, { timeout: 60s })`
   - Récupère le buffer via `page.evaluate`
4. **Réponse** : `Content-Type: application/pdf`, header `Content-Disposition: attachment; filename="invoice-{id}.pdf"`

### 23.2 Pourquoi Puppeteer ?

- Permet de **réutiliser le rendu HTML/CSS exact** du composant `InvoicePreview` (WYSIWYG : ce que voit l'utilisateur dans la sidebar = ce qui est dans le PDF)
- Compatible serverless via `@sparticuz/chromium` (binaire optimisé pour Lambda/Vercel)
- Évite la maintenance d'un moteur PDF dédié backend

### 23.3 Inconvénients

- Lent (3-10s par PDF) : démarrage Chromium + navigation + rendu + capture
- Coûteux en RAM (~512MB par instance Chromium)
- Timeout 60s par étape : si la page met du temps à fetch, échec
- Pas de cache automatique côté Puppeteer — chaque appel relance Chromium

### 23.4 Template HTML/CSS

Le composant `InvoicePreview.jsx` (744 lignes) gère :

- Header avec logo entreprise (chargé depuis R2)
- Titre dynamique selon `invoiceType` (FACTURE / ACOMPTE / SITUATION / AVOIR)
- Bloc émetteur (companyInfo)
- Bloc destinataire (client) — position centre ou droite selon `clientPositionRight`
- Tableau d'items avec `progressPercentage` si situation
- Totaux avec ventilation TVA par taux
- Section retenue garantie / escompte si applicable
- Mentions auto-liquidation si `isReverseCharge`
- Footer avec IBAN (si `showBankDetails`), CGV, lien CGV
- Custom fields
- Mentions légales obligatoires (numéro SIRET, RCS, capital social...)
- Couleurs personnalisables (`appearance.{textColor, headerTextColor, headerBgColor}`)

### 23.5 Format de sortie

- PDF/A-3 si `eInvoiceFlowType === "E_INVOICING"` (Factur-X requiert PDF/A-3)
- PDF standard sinon

---

## 24. Cache PDF (`cachedPdf`) sur Cloudflare R2

### 24.1 Champ Mongoose

```js
cachedPdf: {
  key: String,       // Clé R2 (ex: "invoices/wsId/invoiceId.pdf")
  url: String,       // URL signée pré-générée
  generatedAt: Date  // Pour invalidation TTL
}
```

### 24.2 Usage

Si `invoice.cachedPdf.url` existe et est récent, les automatisations (envoi email programmé, rappels, sync compta) utilisent **directement cette URL R2** sans regénérer via Puppeteer. Énorme gain de perf.

### 24.3 Invalidation

⚠️ **Point d'attention identifié** : il faut vérifier que `updateInvoice` invalide bien `cachedPdf` après modification. Sinon les automatisations envoient un PDF stale.

Le code à auditer :

- `invoice.js:1501+` (mutation `updateInvoice`)
- Cherche-t-on `unset cachedPdf` ou similaire ?

À tester : modifier une facture après envoi initial, déclencher relance, vérifier que le PDF reflète les changements.

### 24.4 Stockage R2

- Bucket : `invoices` (nom configurable via env)
- Région : `auto`
- Format clé : `${workspaceId}/${invoiceId}-${timestamp}.pdf`
- Lifecycle : à confirmer (pas de purge auto trouvée dans le code)

---

## 25. Envoi par email (`sendInvoice`, `SendDocumentModal`)

### 25.1 Composants

- `send-document-modal.jsx` — wrapper modale
- `send-document-email-form.jsx` — formulaire (sujet, corps, CC, BCC)
- `send-document-email-preview.jsx` — preview rendu HTML

### 25.2 Flow utilisateur

1. Modal s'ouvre avec destinataire pré-rempli (`client.email`)
2. Formulaire : sujet, message HTML (avec variables `{client_name}`, `{invoice_number}`, `{total_amount}`, `{due_date}`, etc.), CC/BCC, signature email
3. Preview côté droit montre le rendu final avec PDF en pièce jointe symbolisée
4. Submit → mutation `sendInvoice(id, workspaceId, email)`
5. Backend appelle Resend API + génère/joint le PDF
6. Tracking : pixel + liens trackés injectés (`trackingToken`)

### 25.3 ⚠️ État actuel du backend

`sendInvoice` resolver (`invoice.js:2623-2643`) est **un no-op TODO** :

```js
sendInvoice: requireWrite("invoices")(async (...) => {
  // TODO: Implémenter l'envoi réel de la facture par email
  return true
})
```

L'envoi réel se fait probablement via les **automatisations documents** (`documentAutomationService`) déclenchées sur `INVOICE_CREATED` ou via la queue de relances. Cette mutation `sendInvoice` semble réservée à un usage manuel pas encore implémenté.

### 25.4 Variables disponibles dans le template

À vérifier côté backend, mais typiquement :

- `{client_name}`, `{client_email}`, `{client_company}`
- `{invoice_number}`, `{prefix}{number}`
- `{total_amount}`, `{total_ht}`, `{total_vat}`
- `{issue_date}`, `{due_date}`
- `{company_name}`, `{company_email}`, `{company_phone}`
- `{tracking_url}` — lien tracké vers la facture
- `{pdf_url}` — lien direct du PDF (R2 signé)

### 25.5 Configuration SMTP custom

`smtp-settings-modal.jsx` permet à l'utilisateur d'utiliser **son propre SMTP** au lieu de Resend Newbi par défaut — utile pour les freelances avec domaine personnalisé. Disponible plan **Entreprise uniquement** (`PLAN_LIMITS.entreprise.customSmtp: true`, autres plans `false`).

Les credentials sont chiffrés en base.

---

## 26. Tracking d'ouverture / clic

### 26.1 Mécanisme

Lors de l'envoi :

- Génération d'un `trackingToken` UUID stocké sur `invoice.emailTracking.trackingToken`
- Injection d'un pixel `<img src="https://api/track/open?token=XXX" />` dans le HTML email
- Réécriture des liens via `https://api/track/click?token=XXX&url=ENCODED_ORIGINAL_URL`

### 26.2 Endpoints backend (à confirmer)

- `GET /track/open?token=XXX` → set `emailOpenedAt` si null, `emailOpenCount += 1`, retourne pixel transparent 1×1
- `GET /track/click?token=XXX&url=YYY` → set `emailClickedAt` si null, `emailClickCount += 1`, redirect 302 vers `url`

### 26.3 Subscription GraphQL

`subscription documentEmailUpdate(workspaceId)` push les events en temps réel quand `emailTracking` est mis à jour. Le tableau `useEmailTrackingSubscription` réagit en faisant `refetch()`.

### 26.4 Affichage UI

Composant `EmailTrackingStatus` (`src/components/email-tracking-status`) :

- 📨 Envoyé (jamais ouvert)
- 👁️ Ouvert (count badge)
- 🖱️ Cliqué (count badge)
- Couleurs progressives selon le niveau d'engagement

### 26.5 Sidebar timeline

Section dédiée dans `invoice-sidebar.jsx` :

```
✓ Email envoyé : 12/05/2026 14:32
✓ Ouvert pour la première fois : 12/05/2026 14:45 (3 ouvertures au total)
✓ Lien cliqué : 12/05/2026 14:46 (1 clic)
```

---

## 27. Relances automatiques

### 27.1 Architecture

- **Modèle** : `InvoiceReminderSettings` (config par workspace), `InvoiceReminderLog` (audit)
- **Cron** : `invoiceReminderCron.js` — toutes les heures à HH:00
- **Worker BullMQ** : `reminderQueue.js` (queue `invoice-reminders`)
- **Service** : `invoiceReminderService.js`

### 27.2 Configuration (`InvoiceReminderSettings`)

```js
{
  workspaceId: ObjectId,        // unique
  enabled: Boolean,             // toggle global
  firstReminderDays: Number,    // J+N après échéance, défaut 7
  secondReminderDays: Number,   // J+N après échéance, défaut 14
  reminderHour: Number,         // 0-23, défaut 9 (9h00)
  useCustomSender: Boolean,
  customSenderEmail: String,
  fromEmail: String,
  fromName: String,
  replyTo: String,
  excludedClientIds: [ObjectId],
  emailSubject: String,         // Template avec variables
  emailBody: String             // Template multiligne
}
```

### 27.3 Templates par défaut

```
Subject: "Rappel de paiement - Facture {invoiceNumber}"
Body:
"Bonjour {clientName},

Nous vous rappelons que la facture {invoiceNumber} d'un montant de {totalAmount}
est arrivée à échéance le {dueDate}.

Nous vous remercions de bien vouloir procéder au règlement dans les plus brefs délais.

Cordialement,
{companyName}"
```

### 27.4 Cron logic

`invoiceReminderCron.js:16-51` :

1. Toutes les heures : récupère les `InvoiceReminderSettings` avec `enabled: true` ET `reminderHour === currentHour`
2. Pour chaque workspace, appelle `scheduleWorkspaceReminders(workspaceId, settings)` qui :
   - Cherche les factures `PENDING` avec `dueDate < now`
   - Calcule le niveau de relance dû (1ère ou 2ème selon `firstReminderDays` / `secondReminderDays`)
   - Skip si `client._id ∈ excludedClientIds`
   - Skip si `InvoiceReminderLog` existe déjà pour `(invoiceId, reminderType)`
   - Push un job dans la queue BullMQ `invoice-reminders`
3. Le worker traite les jobs : envoi email via Resend (ou SMTP custom), création `InvoiceReminderLog`

### 27.5 Configuration par facture

Depuis `InvoiceRowActions`, une icône cloche dédiée par row permet d'override la config globale pour cette facture précise (ex: "ne pas relancer ce client cette fois", ou "relance personnalisée"). À implémenter via les automations documents.

### 27.6 Audit log (`InvoiceReminderLog`)

```js
{
  invoiceId, workspaceId, clientId,
  reminderType: "FIRST" | "SECOND",
  sentAt, emailSubject, emailBody,
  resendMessageId,
  status: "SENT" | "FAILED",
  error: String?
}
```

Indexes : `(invoiceId, reminderType)` pour éviter les doublons, `(workspaceId, sentAt)` pour les requêtes timeline.

---

## 28. Export comptable (CSV / Excel / FEC / Sage / Cegid)

Composant : `invoice-export-button.jsx`
Utilitaires : `src/utils/invoice-export.js` (1265 lignes)

### 28.1 Formats disponibles et plans

| Format           | Plan requis     | Fonction          | Format physique                                                  |
| ---------------- | --------------- | ----------------- | ---------------------------------------------------------------- |
| **CSV**          | Tous            | `exportToCSV()`   | `.csv`, séparateur `;`, BOM UTF-8                                |
| **Excel**        | Tous            | `exportToExcel()` | `.xls` (HTML mso namespace, pas vrai xlsx)                       |
| **FEC**          | PME, Entreprise | `exportToFEC()`   | `.txt`, séparateur `\|`, BOM UTF-8, **format légal obligatoire** |
| **Sage Compta**  | Entreprise      | `exportToSage()`  | `.txt`, séparateur `;`, étendu avec compte auxiliaire            |
| **Cegid Expert** | Entreprise      | `exportToCegid()` | `.txt`, format Cegid                                             |

Source des limites : `src/lib/plan-limits.js:30,71,112` :

```js
freelance.exports = ["csv", "excel"];
pme.exports = ["csv", "excel", "fec"];
entreprise.exports = ["csv", "excel", "fec", "sage", "cegid"];
```

Les formats verrouillés affichent un cadenas + tooltip "Disponible avec le plan X".

### 28.2 Logique de sélection des factures à exporter

Deux modes (`invoice-export-button.jsx:112-116`) :

1. **Avec sélection** (checkboxes du tableau) : exporte uniquement les rows cochées, **pas de filtre date** (les dates sont implicites dans la sélection)
2. **Sans sélection** : exporte le dataset filtré complet, avec un `DateRangePicker` optionnel pour restreindre la période

```js
const invoicesToExport = hasSelection
  ? selectedRows.map((row) => row.original || row).filter(Boolean)
  : invoices || [];
```

### 28.3 Flow utilisateur

1. Click "Exporter" → dropdown des formats
2. Choix format → ouverture `Dialog`
3. Si sans sélection : choix période optionnelle
4. Si avec sélection : preview de 5 factures + "et N autres"
5. Bandeau d'info "Les factures importées sont incluses avec la mention 'Importée'"
6. Click "Exporter" → appel `exportTo*()` → `toast.success("N facture(s) exportée(s) en X")`
7. Téléchargement déclenché côté navigateur (Blob + `URL.createObjectURL`)

### 28.4 Format CSV (détail)

`exportToCSV` (`invoice-export.js:304-356`) :

- Headers : extraits de `formatInvoiceForExport(invoice)` (toutes les colonnes business utiles)
- Échappement : valeurs avec `;` ou `"` entourées de guillemets, doubles guillemets pour escape
- Encoding : UTF-8 avec BOM (`﻿`) pour Excel français
- MIME : `text/csv;charset=utf-8`
- Filename : `factures_YYYY-MM-DD_au_YYYY-MM-DD.csv` ou `factures_YYYY-MM-DD.csv`

### 28.5 Format Excel (détail)

`exportToExcel` (`invoice-export.js:363-440`) :

- En réalité un fichier `.xls` HTML avec namespace MSO (`urn:schemas-microsoft-com:office:office`)
- Tableau HTML stylé (header vert, alternance gris)
- Compatible Excel et LibreOffice
- MIME : `application/vnd.ms-excel`

### 28.6 Format FEC (détail) — le plus important

`exportToFEC` (`invoice-export.js:472-736`) — Fichier des Écritures Comptables, format légal obligatoire pour l'administration fiscale française (arrêté du 29 juillet 2013).

**Structure** :

- 18 colonnes obligatoires
- Séparateur `|` (pipe)
- **Pas de ligne d'en-tête** (norme stricte)
- BOM UTF-8

**Colonnes** :

```
JournalCode | JournalLib | EcritureNum | EcritureDate | CompteNum | CompteLib |
CompAuxNum | CompAuxLib | PieceRef | PieceDate | EcritureLib | Debit | Credit |
EcritureLet | DateLet | ValidDate | Montantdevise | Idevise
```

**Logique métier** :

- Pour chaque facture : génère `EcritureNum = "VTE" + ${counter:08d}` séquentiel
- **Ligne 1 (débit client)** : compte `411000` (Clients), montant TTC, `CompAuxNum = SIRET ou numéro facture`, `CompAuxLib = nom client`
- **Lignes ventes par taux de TVA** : groupe les items par `vatRate`, applique remise globale proportionnellement, génère :
  - Ligne crédit ventes : compte `706000` (Prestations de services), montant HT
  - Ligne crédit TVA collectée : compte selon le taux (cf §28.7)

### 28.7 Comptes TVA français (`getVATAccount`)

```js
function getVATAccount(vatRate) {
  if (vatRate === 20) return "445710"; // Taux normal
  if (vatRate === 10) return "445711"; // Taux intermédiaire
  if (vatRate === 5.5) return "445712"; // Taux réduit
  if (vatRate === 2.1) return "445713"; // Taux super réduit
  if (vatRate === 0) return "445714"; // Exonéré
  return "445710"; // Défaut
}
```

### 28.8 Sanitization FEC

`sanitizeFECField` (`invoice-export.js:745-761`) :

- Remplace `\r\n\t` par espace
- Remplace `|` par `-` (sinon casse le format)
- Supprime caractères de contrôle `\x00-\x1F\x7F`
- Limite à 255 chars (config par défaut)
- Trim

### 28.9 Format Sage (détail)

`exportToSage` (`invoice-export.js:819+`) :

- Séparateur `;`
- Format étendu : `Journal;Date;Compte;CompteAux;Libellé;Débit;Crédit;Lettrage;Pièce`
- Date format `ddMMyyyy`
- Sanitize : pas de `;` dans les valeurs, max 100 chars

### 28.10 Format Cegid (détail)

Similaire à Sage mais avec colonnes Cegid spécifiques. À auditer dans le code.

### 28.11 Particularités communes

- **Les factures importées sont incluses** dans tous les exports avec mention "Importée" via `normalizeInvoiceForAccounting()` qui mappe `totalHT/totalVAT/totalTTC` depuis les champs OCR
- **L'export ne filtre pas par statut** : DRAFT inclus si présent dans le dataset → ⚠️ à corriger pour FEC (DRAFT ne doit pas apparaître en compta légale)
- **Les avoirs ne sont pas mélangés** dans l'export factures (collection séparée `CreditNote`)
- **Pas de montant en devise étrangère** géré (`Montantdevise` et `Idevise` toujours vides) — limitation actuelle

---

## 29. Factures importées (PDF déposé)

Modèle : `newbi-api/src/models/ImportedInvoice.js`
Composants : `import-invoice-modal.jsx`, `imported-invoice-sidebar.jsx`

### 29.1 Pourquoi un modèle séparé ?

Les factures importées sont des PDF déposés directement (drag & drop) **sans rédaction interne**. Cas d'usage :

- Rattrapage d'historique : facture émise hors-Newbi mais à intégrer pour la compta
- Facture papier scannée
- Facture reçue d'un fournisseur qu'on veut réémettre tel quel

Pas de numérotation séquentielle Newbi — le numéro original est conservé (`originalInvoiceNumber`).

### 29.2 Schéma simplifié

```js
{
  workspaceId, originalInvoiceNumber,
  invoiceDate, dueDate,
  vendor: { name, normalizedName, address, city, postalCode, country, siret, vatNumber, email, phone },
  client: { name, address, city, postalCode, siret, clientNumber },
  items: [{ description, quantity, unitPrice, totalPrice, vatRate, productCode }],
  totalHT, totalVAT, totalTTC, currency,
  status: "PENDING_VALIDATION" | "VALIDATED" | "COMPLETED" | "REJECTED",
  pdfUrl, pdfKey,  // R2
  ocrData,         // brut OCR
  ocrConfidence,
  createdBy
}
```

### 29.3 OCR

Pas de pipeline OCR sur cette page — les factures sont importées comme PDF brut. L'OCR existe mais sur d'autres modules (factures-achat, expense). Les champs `vendor`, `client`, `items` peuvent être pré-remplis manuellement ou via `invoiceExtractionService.js` (Tesseract/Document AI/Mindee).

### 29.4 Affichage dans la liste

- Mélangées avec les factures normales dans `combinedInvoices`
- Badge violet "↑" avec tooltip "Facture importée"
- Clé d'affichage : `originalInvoiceNumber || number || "IMP"`
- Ouvre `ImportedInvoiceSidebar` (différent de `InvoiceSidebar`) qui affiche le PDF dans un iframe

### 29.5 Statuts importées

Différents des factures normales :

- `PENDING_VALIDATION` — uploadée, en attente de revue
- `VALIDATED` — validée par l'utilisateur, considérée comme émise
- `COMPLETED` — payée
- `REJECTED` — rejetée (mauvaise qualité, doublon...)

`IMPORTED_INVOICE_STATUS_LABELS` mappe les libellés FR.

### 29.6 Actions disponibles

Très limitées vs normales :

- ✅ Voir (preview PDF)
- ✅ Marquer payée (transition vers `COMPLETED`)
- ✅ Supprimer
- ❌ Modifier (le PDF est figé)
- ❌ Envoyer par email
- ❌ Convertir en avoir
- ❌ Relancer

---

## 30. Lien devis ↔ factures (`createLinkedInvoice`)

Mutation : `createLinkedInvoice(quoteId, workspaceId, amount, isDeposit): LinkedInvoiceResult`

### 30.1 Cas d'usage

Convertir un devis accepté en une (ou plusieurs) facture(s). Permet :

- Émission d'un acompte (`isDeposit: true`)
- Émission de factures partielles successives (max 3)
- Émission d'une facture finale du solde

### 30.2 Logique (`invoice.js:2645-2890`)

```js
1. Valide que quoteId existe et appartient au workspace
2. Valide que le devis est en status COMPLETED (accepté)
3. Vérifie que le nombre de factures liées < 3 (max imposé)
4. Calcule totalInvoiced = somme des finalTotalTTC des factures déjà liées
5. Vérifie qu'il n'y a pas déjà un acompte si isDeposit: true
6. Calcule remainingAmount = quote.finalTotalTTC - totalInvoiced
7. Vérifie que amount ≤ remainingAmount
8. Si c'est la 3ème facture (linkedInvoicesCount === 2), amount doit être EXACTEMENT remainingAmount
9. Génère prefix et numéro (préfixe FACTURE pas devis)
10. Calcule unitPriceHT = amount / 1.20 (TVA fixée à 20%)
11. Crée la facture en DRAFT avec :
    - 1 seul item "Acompte sur devis X" ou "Facture sur devis X" ou "Facture partielle sur devis X"
    - quantity: 1, unitPrice: unitPriceHT, vatRate: 20%
    - sourceQuote: quote._id
    - purchaseOrderNumber: ${quote.prefix}-${quote.number}
    - dueDate: now + 30 jours
    - Apparence et notes héritées de l'organisation (PAS du devis)
12. Calcule totaux et sauvegarde
```

### 30.3 Limites

- TVA fixée à 20% (pas configurable)
- Max 3 factures par devis
- 1 seul acompte par devis
- Dernière facture = solde exact obligatoire

---

## 31. Factures de situation (avancement de travaux)

### 31.1 Cas d'usage BTP

Facturer un chantier au fur et à mesure de son avancement. Ex : devis 100k€, situation 1 = 30% (30k€), situation 2 = 50% cumulé (20k€ supplémentaires), etc.

### 31.2 Champs spécifiques

- `invoiceType: "situation"`
- `situationNumber: Number ≥1` — incrément manuel ou auto
- `situationReference: String` — texte libre pour grouper (ex : "Chantier rue de Paris")
- `purchaseOrderNumber: String` — référence devis source
- `contractTotal: Number ≥0` — total du contrat (pour validation cumul)
- Items avec `progressPercentage: 0-100` — % d'avancement par poste

### 31.3 Validation cumul (`invoice.js:898-1054`)

```
1. Pour cette purchaseOrderNumber, calcule contractTotal :
   - Cherche le devis dans Quote (via prefix-number)
   - Sinon, cherche la 1ère facture de situation et utilise son items.reduce()
2. Calcule alreadyInvoicedTotal = somme finalTotalTTC des factures de situation
   précédentes (avec excludeInvoiceId si update)
3. Calcule newInvoiceTotal = somme(items × progressPercentage)
4. Vérifie : alreadyInvoicedTotal + newInvoiceTotal ≤ contractTotal
5. Si dépasse : erreur ValidationError avec détails (montants exacts)
```

### 31.4 Query GraphQL `situationReferences`

Retourne la liste des `purchaseOrderNumber` utilisés dans des factures de situation, avec :

- `count` — nombre de situations
- `lastInvoiceDate`
- `totalTTC` — cumul facturé
- `contractTotal` — total contrat

Utilisée dans `ProgressSection.jsx` pour suggérer des références existantes.

### 31.5 Query GraphQL `situationInvoicesByQuoteRef`

Retourne toutes les factures de situation pour une `purchaseOrderNumber` donnée. Utilisée pour afficher un timeline d'avancement.

---

## 32. Templates de facture

Modèle : `newbi-api/src/models/invoiceTemplate.js`
Composant : `SaveInvoiceTemplateDialog.jsx`
Mutation : `SAVE_INVOICE_AS_TEMPLATE`

### 32.1 Schéma `InvoiceTemplate`

```js
{
  name: String (requis),
  description: String,
  items: [itemSchema],
  headerNotes, footerNotes,
  termsAndConditions, termsAndConditionsLink, termsAndConditionsLinkTitle,
  customFields, discount, discountType,
  invoiceType, appearance, clientPositionRight,
  isReverseCharge, showBankDetails, bankDetails (chiffré),
  shipping, prefix, retenueGarantie, escompte, operationType,
  sourceInvoiceId: ObjectId (ref Invoice, optionnel),
  workspaceId, userId,
  timestamps
}
```

### 32.2 Limites par plan

```js
freelance.documentTemplates = 10;
pme.documentTemplates = -1(illimité);
entreprise.documentTemplates = -1(illimité);
```

### 32.3 Flow

1. Dans la liste, action "Sauver comme template" sur une facture
2. `SaveInvoiceTemplateDialog` demande nom + description
3. Mutation `SAVE_INVOICE_AS_TEMPLATE` copie tous les champs réutilisables (sans client, sans dates)
4. Le template apparaît dans `InvoiceSettingsModal` ou un menu dédié
5. À la création d'une nouvelle facture : "Partir d'un template" pré-remplit les champs

### 32.4 Particularités

- Pas de client (templatisé pour réutilisation cross-clients)
- Pas de dates (toujours générées au moment de l'usage)
- IBAN chiffré comme dans `Invoice.bankDetails`
- Pas de cycle de vie (CRUD simple)

---

## 33. Sync Pennylane

Service : `newbi-api/src/services/pennylaneSyncHelper.js`

### 33.1 Champs Mongoose

```js
pennylaneId: String(sparse, indexed);
pennylaneSyncStatus: "NOT_SYNCED" | "SYNCED" | "ERROR";
```

### 33.2 Trigger

`syncInvoiceIfNeeded(invoice, organizationId)` est appelé fire-and-forget après :

- `markInvoiceAsPaid` (`invoice.js:2614-2617`)
- Probablement aussi à `createInvoice` si configuré

### 33.3 Logique

```js
syncInvoiceIfNeeded {
  if (status === "SYNCED") return  // déjà sync
  account = PennylaneAccount.findOne({ organizationId })
  if (!account) return  // pas connecté
  result = pennylaneService.syncCustomerInvoice(account.apiToken, invoice)
  Invoice.updateOne({ _id: invoice._id }, {
    $set: {
      pennylaneSyncStatus: "SYNCED",
      pennylaneId: result.pennylaneId
    }
  })
}
// En cas d'erreur : pennylaneSyncStatus = "ERROR"
```

### 33.4 API Pennylane v2

- POST `/customer_invoices` avec mapping FEC-compatible
- Le `pennylaneId` retourné est l'identifiant chez Pennylane
- L'utilisateur peut consulter sa facture côté Pennylane depuis le mapping

### 33.5 Skill `pennylane`

Le projet a une skill dédiée pour interagir avec l'API Pennylane v2. Variable d'env `PENNYLANE_API_KEY` requise.

### 33.6 Pas de désync automatique

Si on modifie une facture après sync, **le statut reste `SYNCED`** mais Pennylane n'est pas mis à jour. À auditer : faut-il un re-sync sur `updateInvoice` ?

---

## 34. Stripe Invoices (abonnement Newbi)

Route : `POST /api/stripe/invoices`
Hook : `useStripeInvoices` (`src/hooks/useStripeInvoices.js`)

### 34.1 Distinction importante

⚠️ **Ces "Stripe Invoices" sont les factures de l'abonnement SaaS Newbi de l'utilisateur**, pas les factures que l'utilisateur émet à ses propres clients.

Cas d'usage : afficher dans le compte utilisateur l'historique de paiement de l'abonnement Newbi.

### 34.2 Code

```js
// app/api/stripe/invoices/route.js
const invoices = await stripe.invoices.list({
  customer: stripeCustomerId,
  limit: 100,
});
```

### 34.3 Pas mélangées avec les factures business

Cette route n'a aucun lien avec le module `app/dashboard/outils/factures/`. Elle est utilisée dans la page de gestion d'abonnement (probablement `app/dashboard/account/billing` ou similaire).

Le champ `Invoice.stripeInvoiceId` existe mais est **différent** : il sert à lier une facture business Newbi à une facture Stripe si l'utilisateur a configuré du Stripe Connect pour facturer ses propres clients via Stripe (rare).

---

## 35. E-invoicing 2026 / Factur-X / SuperPDP

### 35.1 Réforme de la facturation électronique

À partir de 2026 (date repoussée plusieurs fois, vérifier l'actualité), toutes les factures B2B en France doivent passer par une PDP (Plateforme de Dématérialisation Partenaire). Newbi utilise **SuperPDP** comme PDP.

### 35.2 Champs Mongoose

```js
superPdpInvoiceId: String      // ID chez SuperPDP
eInvoiceStatus: enum (9 valeurs):
  - NOT_SENT, PENDING_VALIDATION, VALIDATED, SENT_TO_RECIPIENT,
    RECEIVED, ACCEPTED, REJECTED, PAID, ERROR
eInvoiceSentAt: Date
archivedPdfUrl: String         // PDF/A-3 archivé
eInvoiceError: String
facturXData: { xmlGenerated: Bool, profile: String (def "EN16931"), generatedAt: Date }
eInvoiceFlowType: enum:
  - E_INVOICING (B2B FR-FR avec obligation)
  - E_REPORTING_TRANSACTION (B2C ou hors UE)
  - E_REPORTING_PAYMENT (paiement à reporter)
  - NONE
eInvoiceFlowReason: String     // Explication FR du routage
eInvoiceRoutingDetails: {
  isB2B, sellerInFrance, clientInFrance,
  sellerVatRegistered, clientVatRegistered,
  obligationActive, companySize, evaluatedAt
}
operationType: enum (LB / PS / LBPS)  // Livraison Bien / Prestation Service / mixte
```

### 35.3 Routage automatique

Algorithme (à confirmer côté code, probablement dans un service `eInvoiceRoutingService`) :

- Si vendeur + client en France ET B2B ET obligation active → `E_INVOICING` (envoi via PDP)
- Si vendeur FR + client UE → `E_REPORTING_TRANSACTION` (déclaration sans PDP)
- Si paiement → `E_REPORTING_PAYMENT` (déclaration paiement)
- Sinon → `NONE`

### 35.4 Génération XML Factur-X

Profil par défaut `EN16931` (norme européenne). Le XML est intégré dans le PDF/A-3 via `pdf-lib` ou équivalent. Contient :

- Identité vendeur (SIRET, TVA intracom)
- Identité acheteur
- Lignes (avec nomenclatures)
- TVA ventilée par taux
- Montants HT/TVA/TTC
- Numéro de facture, date, échéance
- Mention `BT-...` selon EN16931

### 35.5 Envoi à SuperPDP

- API HTTP `POST /v1/invoices` (ou équivalent)
- Auth par token API
- Statut suivi en webhook + polling
- Badge UI `e-invoice-status-badge.jsx` pour afficher l'état

### 35.6 Disponibilité par plan

Tous les plans incluent `eInvoicing: true` et `eInvoicingArchival: true` (`plan-limits.js:53,94,...`). Pas de paywall sur la conformité légale.

---

## 36. Permissions RBAC et plans d'abonnement

### 36.1 RBAC frontend

Hook : `usePermissions()` (`src/hooks/usePermissions.js`)

```js
const { canCreate, canRead, canUpdate, canDelete, canExport } =
  usePermissions();
canCreate("invoices"); // Boolean async
canRead("invoices");
canUpdate("invoices");
canDelete("invoices");
canExport("invoices");
```

Les permissions sont chargées une fois et mémorisées par session. Composant `<PermissionButton>` simplifie l'UI :

```jsx
<PermissionButton
  resource="invoices"
  action="create"
  requiresActiveSubscription
  tooltipNoAccess="Vous n'avez pas la permission de créer des factures"
>
  Nouvelle facture
</PermissionButton>
```

### 36.2 RBAC backend

Middlewares dans `newbi-api/src/middlewares/rbac.js` :

- `requireRead("invoices")` — utilisé dans tous les resolvers Query
- `requireWrite("invoices")` — utilisé dans createInvoice, updateInvoice, markAsPaid, sendInvoice, changeInvoiceStatus
- `requireDelete("invoices")` — utilisé dans deleteInvoice, deleteLinkedInvoice

Règles spéciales internes :

- `viewer` ne peut modifier que ses propres factures (`invoice.js:2475-2483`)
- `member` peut modifier toutes les factures du workspace
- `admin/owner` peuvent modifier même les `COMPLETED` (`invoice.js:1531-1537`)

### 36.3 Rôles disponibles

- `owner` — créateur du workspace (1 par org)
- `admin` — full access sauf billing
- `member` — opérationnel
- `accountant` — lecture + exports (gratuit jusqu'au quota du plan)
- `viewer` — lecture seule + ses propres docs

### 36.4 Limites de plan

`src/lib/plan-limits.js` (cf §28.1 pour les exports). Autres limites pertinentes pour les factures :

| Plan       | `documentTemplates` | `customSmtp` | `eInvoicing` |
| ---------- | ------------------- | ------------ | ------------ |
| Freelance  | 10                  | non          | oui          |
| PME        | illimité            | non          | oui          |
| Entreprise | illimité            | oui          | oui          |

---

## 37. Hooks personnalisés (référence)

### 37.1 Hooks GraphQL (`src/graphql/`)

| Hook                               | Fichier                     | Rôle                                 |
| ---------------------------------- | --------------------------- | ------------------------------------ |
| `useInvoices()`                    | `invoiceQueries.js`         | Liste paginée, refetch, cache Apollo |
| `useInvoice(id)`                   | idem                        | Détail unitaire                      |
| `useDeleteInvoice`                 | idem                        | Mutation + refetch optimiste         |
| `useMarkInvoiceAsPaid`             | idem                        | Mutation `markInvoiceAsPaid`         |
| `useChangeInvoiceStatus`           | idem                        | Mutation `changeInvoiceStatus`       |
| `useNextInvoiceNumber`             | idem                        | Query `nextInvoiceNumber`            |
| `useInvoiceStats`                  | idem                        | Stats agrégées                       |
| `useInvoiceBalances`               | idem                        | Soldes                               |
| `useImportedInvoices(workspaceId)` | `importedInvoiceQueries.js` | Liste importées                      |
| `useDeleteImportedInvoice`         | idem                        | Mutation                             |
| `useEmailTrackingSubscription`     | `documentEmailQueries.js`   | Subscription temps réel              |
| `useInvoiceReminderSettings`       | `invoiceReminderQueries.js` | Config relances                      |
| `useUpdateInvoiceReminderSettings` | idem                        | Mutation                             |

### 37.2 Hooks locaux (`app/dashboard/outils/factures/hooks/`)

| Hook                  | Fichier                     | Rôle                                               |
| --------------------- | --------------------------- | -------------------------------------------------- |
| `useInvoiceTable`     | `use-invoice-table.js`      | Setup TanStack Table + filters + columns           |
| `useInvoiceEditor`    | `use-invoice-editor.js`     | Setup form + validation + submit + auto-sync devis |
| `useInvoiceNumber`    | `use-invoice-number.js`     | Gestion numérotation auto                          |
| `useCreditNoteEditor` | `use-credit-note-editor.js` | Form avoirs                                        |
| `useCreditNoteNumber` | `use-credit-note-number.js` | Numérotation avoirs                                |

### 37.3 Hooks transverses (`src/hooks/`)

| Hook                    | Rôle                                                   |
| ----------------------- | ------------------------------------------------------ |
| `usePermissions`        | RBAC `canCreate/canRead/canUpdate/canDelete/canExport` |
| `useSubscriptionAccess` | `isReadOnly`, `isOwner`                                |
| `useRequiredWorkspace`  | Workspace courant ou throw                             |
| `useSubscription`       | Plan d'abonnement actif                                |

---

## 38. API GraphQL (queries / mutations / subscriptions)

Schema : `newbi-api/src/schemas/invoice.graphql`
Resolvers : `newbi-api/src/resolvers/invoice.js`

### 38.1 Queries

```graphql
type Query {
  invoice(id: ID!, workspaceId: ID!): Invoice
  invoices(
    workspaceId: ID!
    page: Int
    limit: Int
    status: InvoiceStatus
    search: String
    startDate: String
    endDate: String
    clientId: ID
  ): InvoicePagination!
  invoiceStats(workspaceId: ID!): InvoiceStats!
  invoiceBalances(workspaceId: ID!): InvoiceBalances!
  nextInvoiceNumber(
    workspaceId: ID!
    prefix: String
    isDraft: Boolean
    autoNumbering: Boolean
  ): String!
  latestInvoiceIssueDate(workspaceId: ID!): String
  situationInvoicesByQuoteRef(
    workspaceId: ID!
    purchaseOrderNumber: String!
  ): [Invoice!]!
  situationReferences(workspaceId: ID!, search: String): [SituationReference!]!
  checkInvoiceNumberExists(
    workspaceId: ID!
    number: String!
    prefix: String!
    excludeId: ID
  ): Boolean!
}
```

### 38.2 Mutations

```graphql
type Mutation {
  createInvoice(workspaceId: ID!, input: CreateInvoiceInput!): Invoice!
  updateInvoice(id: ID!, workspaceId: ID!, input: UpdateInvoiceInput!): Invoice!
  deleteInvoice(id: ID!, workspaceId: ID!): Boolean!
  sendInvoice(id: ID!, workspaceId: ID!, email: String!): Boolean!
  markInvoiceAsPaid(id: ID!, workspaceId: ID!, paymentDate: String!): Invoice!
  changeInvoiceStatus(
    id: ID!
    workspaceId: ID!
    status: InvoiceStatus!
  ): Invoice!
  createLinkedInvoice(
    quoteId: ID!
    workspaceId: ID!
    amount: Float!
    isDeposit: Boolean!
  ): LinkedInvoiceResult!
  deleteLinkedInvoice(id: ID!, workspaceId: ID!): Boolean!
}
```

### 38.3 Subscriptions

```graphql
type Subscription {
  documentEmailUpdate(workspaceId: ID!): EmailTrackingUpdate!
  invoiceUpdated(workspaceId: ID!): Invoice # potentiellement
}
```

### 38.4 Field resolvers spéciaux

```js
Invoice: {
  companyInfo: (invoice) => {
    // Pour DRAFT : résolu dynamiquement depuis Organization (companyInfo peut changer)
    // Pour PENDING+ : retourne le snapshot figé de invoice.companyInfo
  };
}
```

Ce field resolver est important : il garantit que les brouillons reflètent toujours l'état actuel de l'organisation, mais que les factures finalisées gardent l'identité du moment d'émission.

---

## 39. Routes API Next (PDF + data)

### 39.1 `GET /api/invoices/data/[id]`

Fichier : `app/api/invoices/data/[id]/route.js`

⚠️ **Pas d'auth dans le code lu.** À auditer : cette route donne accès direct à toutes les factures par ID. À sécuriser via :

- IP whitelist (Puppeteer interne uniquement)
- Token signé court (JWT temporaire)
- Auth Better Auth (mais Puppeteer doit alors avoir un cookie de session)

Code :

```js
GET (params) {
  invoiceId = params.id
  client = await MongoClient.connect(MONGODB_URI)
  invoice = await db.collection('invoices').findOne({ _id: ObjectId(invoiceId) })
  if (!invoice) return 404
  // Récupère client lié
  // Formate et retourne JSON
}
```

### 39.2 `POST /api/invoices/generate-pdf`

Fichier : `app/api/invoices/generate-pdf/route.js`

```js
POST {
  invoiceId = body.invoiceId
  browser = launchBrowser()  // Chromium serverless
  page = browser.newPage()
  await page.goto(`${baseUrl}/pdf-generator/invoice/${invoiceId}`, { waitUntil: 'networkidle0', timeout: 60s })
  await page.waitForFunction(() => window.pdfGenerationResult !== undefined, { timeout: 60s })
  pdfData = await page.evaluate(() => window.pdfGenerationResult)
  await browser.close()
  return new NextResponse(Buffer.from(pdfData.buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoiceId}.pdf"`
    }
  })
}
```

Utilise `@/src/lib/puppeteer.js` pour `launchBrowser()` qui adapte selon l'env (Vercel = `@sparticuz/chromium`, dev = puppeteer normal).

---

## 40. Subscriptions temps réel

### 40.1 `documentEmailUpdate`

Hook : `useEmailTrackingSubscription({ workspaceId, onUpdate })`
Schema : probablement dans `documentEmail.graphql`

Push toutes les MAJ de `emailTracking` (sent, opened, clicked) en temps réel via WebSocket (`graphql-ws`).

Backend :

- Pixel/click endpoints mettent à jour `Invoice.emailTracking`
- Trigger `pubsub.publish('DOCUMENT_EMAIL_UPDATE', { ... })`
- Subscription resolver filtre par `workspaceId`

Frontend :

- `useEmailTrackingSubscription` reçoit les events
- Si `documentType === "invoice"`, déclenche `refetch()` sur la query `useInvoices`
- Le tableau se met à jour automatiquement

### 40.2 Subscription Pubsub

Backend utilise Redis PubSub si disponible, sinon fallback in-memory (cf `CLAUDE.md`). Critique pour la scalabilité multi-instance.

---

## 41. Paramètres (`InvoiceSettingsModal`)

Fichier : `app/dashboard/outils/factures/components/invoice-settings-modal.jsx`

### 41.1 Sections

- **Numérotation** : préfixe par défaut, format auto (`F-{YYYY}{MM}` ou autre)
- **Mentions légales** : header notes, footer notes par défaut, conditions générales
- **Apparence** : couleurs (textColor, headerTextColor, headerBgColor), position client (centre/droite)
- **Coordonnées bancaires** : IBAN, BIC, banque (chiffrés AES-256-GCM)
- **Templates** : liste des templates sauvegardés, suppression
- **E-invoicing** : config SuperPDP (token API, profil par défaut)

### 41.2 Persistance

Stockés dans `Organization` (Better Auth) via les champs :

- `invoiceHeaderNotes`, `invoiceFooterNotes`, `invoiceTermsAndConditions`
- `invoiceTextColor`, `invoiceHeaderTextColor`, `invoiceHeaderBgColor`
- `invoiceClientPositionRight`
- `documentHeaderNotes`, etc. (fallback générique)
- `bankDetails` (sous-document chiffré)

### 41.3 Application

À chaque création de nouvelle facture, les défauts org sont copiés dans `formData` (`use-invoice-editor.js:214-246`). L'utilisateur peut ensuite override par facture.

---

## 42. Configuration SMTP custom

Fichier : `app/dashboard/outils/factures/components/smtp-settings-modal.jsx`

### 42.1 Cas d'usage

Plan **Entreprise** uniquement (`PLAN_LIMITS.entreprise.customSmtp: true`). Permet d'envoyer les emails (factures + relances) depuis son propre serveur SMTP au lieu de Resend Newbi.

Avantages :

- Domaine d'envoi personnalisé (mailto: facture@maboite.com)
- Délivrabilité maîtrisée
- Pas de quota Resend

### 42.2 Champs

```js
{
  host: String,     // smtp.example.com
  port: Number,     // 587, 465, 25
  secure: Boolean,  // TLS
  username, password (chiffré AES-256-GCM),
  fromName, fromEmail,
  replyTo
}
```

### 42.3 Test de connexion

Bouton "Tester" dans la modal envoie un email de test à l'admin pour vérifier la config avant de valider.

---

## 43. Gestion des conflits DRAFT / PENDING

### 43.1 Scénarios de conflit

1. **Deux drafts avec même `(prefix, number, workspaceId)`** : autorisé en base (DRAFT exclu de l'unicité), mais le code renomme l'ancien drafts en `DRAFT-{n}-{timestamp}` pour éviter ambiguïté UI
2. **Draft `DRAFT-0042` quand on finalise un autre `0042`** : le draft est renommé `DRAFT-0042-{timestamp}` (`invoice.js:1086-1097`)
3. **Tentative de créer une PENDING avec un numéro déjà utilisé** : `AppError DUPLICATE_ERROR` (`invoice.js:1138-1142`)
4. **Tentative de modifier le numéro d'une facture PENDING vers un numéro pris** : `AppError DUPLICATE_ERROR` (`invoice.js:1547-1562`)

### 43.2 Code de gestion

`handleDraftConflicts(newNumber)` (`invoice.js:1075-1100`) :

```js
async (newNumber) => {
  conflictingDrafts = await Invoice.find({
    prefix,
    number: newNumber,
    status: "DRAFT",
    workspaceId,
  });
  for (draft of conflictingDrafts) {
    timestamp = Date.now() + Math.floor(Math.random() * 1000); // évite collisions intra-ms
    finalDraftNumber = `DRAFT-${baseNumber}-${timestamp}`;
    await Invoice.findByIdAndUpdate(draft._id, { number: finalDraftNumber });
  }
  return newNumber;
};
```

### 43.3 ⚠️ Pas de notification UI

Le user dont le draft est renommé n'est **pas notifié**. S'il revient plus tard sur son brouillon, il verra un numéro "bizarre" (`DRAFT-0042-1714521600123`) sans explication. À améliorer.

---

## 44. Auto-réparation du compteur (self-heal)

### 44.1 Pourquoi nécessaire

Le compteur `DocumentCounter.lastNumber` peut diverger des documents réels :

- **Suppression d'une facture finalisée** (très rare, cas admin) : counter à 50, mais max réel passe de 50 à 49
- **Restauration depuis backup** : counter peut être absent ou désynchronisé
- **Migration depuis Newbi v1** : pas de counter dans l'ancienne version
- **Création de doc en bypass** (script dev) sans passer par le resolver

### 44.2 Mécanisme

À chaque `getNextNumber()` :

```js
existingMax = getExistingMaxNumber(documentType, prefix, workspaceId)
currentCounter = await this.findOne({...})
if (currentCounter && currentCounter.lastNumber !== existingMax) {
  await this.findOneAndUpdate(..., { $set: { lastNumber: existingMax } })
}
counter = await this.findOneAndUpdate(..., { $inc: { lastNumber: 1 } }, { upsert: true })
return counter.lastNumber
```

### 44.3 Cas upsert

Si le compteur est créé from scratch (`upsert: true`) et qu'il y a des documents existants pour ce préfixe :

```js
if (counter.lastNumber === 1 && existingMax > 0) {
  adjusted = await findOneAndUpdate({..., lastNumber: 1}, { $set: { lastNumber: existingMax + 1 } })
  return adjusted.lastNumber
}
```

Ça résout le bootstrap : après un déploiement avec compteur vide, le premier `nextInvoiceNumber` n'écrase pas la séquence existante.

### 44.4 Limites

- **Pas de lock distribué** : si deux instances tournent simultanément, la self-heal pourrait théoriquement créer une race. En pratique, `findOneAndUpdate` Mongo est atomique sur un document, donc OK.
- **Ne corrige pas les trous** : si tu as `0001, 0002, 0005`, le compteur sera à 5 et le prochain sera 6, jamais 3 ou 4. Le trou reste.

---

## 45. Validation date d'émission antérieure

### 45.1 Règle

`validateInvoiceIssueDate(issueDate, workspaceId, excludeInvoiceId)` (`invoice.js:149-186`) :

> La date d'émission d'une nouvelle facture (ou modifiée) ne peut pas être **antérieure** à la date d'émission de la dernière facture finalisée du workspace.

### 45.2 Pourquoi

Conformité fiscale : les factures doivent être émises dans **l'ordre chronologique**. Émettre une facture le 15 mai puis une autre le 10 mai créerait une rupture de chronologie.

### 45.3 Code

```js
const latestInvoice = await Invoice.findOne({
  workspaceId,
  status: { $in: ["PENDING", "COMPLETED", "CANCELED"] }, // DRAFT exclu
  ...(excludeInvoiceId && { _id: { $ne: excludeInvoiceId } }),
})
  .sort({ issueDate: -1 })
  .select("issueDate number prefix")
  .lean();

if (latestInvoice && newIssueDate < latestIssueDate) {
  throw createValidationError(
    "La date d'émission ne peut pas être antérieure à celle de la dernière facture existante",
    {
      issueDate: `Une facture (${latestInvoice.prefix}${latestInvoice.number}) existe déjà avec la date du ${latestIssueDate.toLocaleDateString("fr-FR")}. La nouvelle facture doit avoir une date égale ou postérieure.`,
    },
  );
}
```

### 45.4 Skip pour DRAFT

`createInvoice` (`invoice.js:1160-1163`) :

```js
if (input.status !== "DRAFT") {
  await validateInvoiceIssueDate(input.issueDate, workspaceId);
}
```

Les brouillons peuvent avoir n'importe quelle date — ils ne sont validés qu'à la finalisation.

### 45.5 Query `latestInvoiceIssueDate`

Exposée côté GraphQL pour pré-remplir intelligemment la date côté UI : si la dernière facture est du 12/05/2026, l'éditeur peut suggérer cette date (ou +1) au lieu de today si today < 12/05.

---

## 46. Pièges connus et points d'attention

### 46.1 Multi-format dates

`issueDate` et `dueDate` peuvent être un timestamp string (`"1714521600000"`), un timestamp number, un ISO string ou une `Date`. Tous les parsers du module testent `/^\d+$/` avant de décider — si tu ajoutes une nouvelle utilisation, copie ce pattern.

Voir code de référence : `use-invoice-table.js:55-76`, `page.jsx:165-169`, `invoice-export.js:32-72`.

### 46.2 `finalTotalTTC` n'inclut pas l'escompte

La valeur en base est après remise mais avant escompte. La colonne TTC du tableau le recalcule (`use-invoice-table.js:510-540`). Si tu ajoutes un export ou un autre affichage, **n'oublie pas l'escompte** ou utilise une fonction utilitaire commune.

### 46.3 Les KPIs sont sur les données filtrées

Changer un filtre change les CA affichés. C'est volontaire (vue contextuelle), mais peut surprendre.

### 46.4 Onglet "En retard" ≠ statut OVERDUE en base

L'onglet est calculé front-side. Le statut OVERDUE existe (set par cron quotidien) mais n'est pas la source de vérité de l'UI. Conséquence : une facture peut être affichée "en retard" dans l'onglet alors qu'elle est encore PENDING en base si le cron n'est pas passé (jusqu'à 24h de lag).

### 46.5 Sidebar gérée au niveau du tableau

Ne mets pas d'état sidebar dans `InvoiceRowActions` — ça causait des re-renders cascadés. Commentaire `invoice-row-actions.jsx:45`.

### 46.6 Toast post-création via sessionStorage

Flow fragile. Si l'utilisateur recharge entre la création et le retour à la liste, le toast disparaît. Acceptable car nice-to-have.

### 46.7 Pas d'auto-save des brouillons

Code commenté à `use-invoice-editor.js:1474-1489`. Si tu veux le réactiver, attention au debounce et aux conflits de version optimistes Apollo.

### 46.8 `cachedPdf` invalidation

À confirmer que toutes les `updateInvoice` invalident bien la copie R2. Si non, les automatisations envoient un PDF stale. **Point à auditer.**

### 46.9 Préfixe figé au mois de création

Si tu changes la `issueDate` après coup, le `prefix` ne se recalcule pas (`Invoice.js:28-33` est un default uniquement). C'est volontaire (numérotation = mois d'émission initial), mais surprenant.

### 46.10 Suppression réelle vs annulation

`deleteInvoice` est interdit côté API pour les factures finalisées (lock `COMPLETED`). En pratique, l'utilisateur **ne doit jamais supprimer** une facture émise — il doit l'**annuler** (`CANCELED`) ou émettre un avoir. Le bouton "Supprimer" dans les row actions est principalement utilisé pour les DRAFT.

### 46.11 `sendInvoice` est un no-op

La mutation est un TODO côté backend (`invoice.js:2623-2643`). L'envoi réel passe par les automations documents ou la queue de relances. Ne pas se baser sur cette mutation pour des nouvelles features.

### 46.12 Compteur par préfixe, pas par année

Si tu utilises le même préfixe `F-CLIENT` en 2025 et 2026, le compteur continue (51, 52...) mais l'index unique autorise les doublons inter-année — donc `F-CLIENT-0042` peut exister deux fois (un en 2025, un en 2026). À documenter pour les utilisateurs.

### 46.13 `checkInvoiceNumberExists` ignore les DRAFT

Un user peut "réserver" un numéro en brouillon, qui sera silencieusement renommé `DRAFT-{n}-{timestamp}` si un autre user crée une PENDING avec le même numéro. Pas de notification UI.

### 46.14 Race condition transactions Mongo

`createInvoice` ne wrap pas systématiquement le calcul du numéro + l'insert dans une transaction Mongo. La self-heal du compteur corrige les divergences, mais une race théorique sur l'insert peut laisser un trou temporaire.

### 46.15 Pas de désync Pennylane

Modifier une facture après sync laisse `pennylaneSyncStatus: "SYNCED"` mais ne pousse pas l'update. À auditer.

### 46.16 Routes API Next sans auth

`/api/invoices/data/[id]` et `/api/invoices/generate-pdf` n'ont pas d'auth visible. À sécuriser (IP whitelist + token signé).

### 46.17 Recherche globale insensible aux accents

`searchableContent.includes(searchTerm)` n'est pas accent-insensible. "société" ne match pas "societe". À normaliser via `.normalize('NFD').replace(/[̀-ͯ]/g, '')` si UX demande.

### 46.18 Bulk delete sans pré-filtrage

Le bouton "Supprimer (n)" peut sélectionner des factures `COMPLETED` qui seront refusées côté backend silencieusement. À améliorer en désactivant la checkbox sur les non-supprimables.

### 46.19 Limite 3 factures liées par devis

Hardcodée dans `createLinkedInvoice` (`invoice.js:2695-2698`). Si business demande plus, il faut modifier le code (pas de config).

### 46.20 Validation date émission ne couvre pas DRAFT

Un user peut créer un DRAFT antidaté, puis le finaliser avec cette date — la validation passera si la date est postérieure à la dernière finalisée, sinon échouera au moment de la finalisation. UX confuse : l'erreur arrive tard.

---

## 47. Fichiers clés

```
app/dashboard/outils/factures/
├── page.jsx                              # Liste + KPIs + header
├── new/page.jsx                          # Création (wrapper editor)
├── [id]/page.jsx                         # Détail
├── [id]/editer/page.jsx                  # Édition
├── [id]/avoir/nouveau/page.jsx           # Création avoir
├── [id]/avoir/[creditNoteId]/page.jsx    # Détail avoir
├── components/
│   ├── invoice-table.jsx                 # Tableau principal (1326 lignes)
│   ├── invoice-row-actions.jsx           # Menu actions par row
│   ├── invoice-filters.jsx               # Dropdown filtres avancés (526 lignes)
│   ├── invoice-sidebar.jsx               # Preview latérale (1406 lignes)
│   ├── invoice-mobile-fullscreen.jsx     # Plein écran mobile
│   ├── modern-invoice-editor.jsx         # Éditeur split-screen (744 lignes)
│   ├── enhanced-invoice-form.jsx         # Form principal
│   ├── invoice-form.jsx                  # Form simple (legacy ?)
│   ├── invoices-form-sections/
│   │   ├── InvoiceInfoSection.jsx
│   │   ├── client-selector.jsx
│   │   ├── ItemsSection.jsx
│   │   ├── ProgressSection.jsx
│   │   ├── DiscountsAndTotalsSection.jsx
│   │   ├── ShippingSection.jsx
│   │   ├── NotesAndFooterSection.jsx
│   │   └── CustomFieldsSection.jsx
│   ├── InvoicePreview.jsx                # Preview PDF live (744 lignes)
│   ├── invoice-export-button.jsx         # Bouton + dialog export
│   ├── send-document-modal.jsx           # Envoi email
│   ├── send-document-email-form.jsx
│   ├── send-document-email-preview.jsx
│   ├── auto-reminder-modal.jsx           # Config relances
│   ├── auto-reminder-form.jsx
│   ├── auto-reminder-preview.jsx
│   ├── auto-reminder-clients.jsx
│   ├── invoice-settings-modal.jsx        # Config workspace
│   ├── invoice-settings-view.jsx
│   ├── smtp-settings-modal.jsx           # Config SMTP custom
│   ├── email-settings-modal.jsx
│   ├── company-import.jsx
│   ├── modern-credit-note-editor.jsx     # Éditeur avoirs
│   ├── enhanced-credit-note-form.jsx
│   ├── credit-note-mobile-fullscreen.jsx
│   ├── import-invoice-modal.jsx          # Import PDF
│   ├── imported-invoice-sidebar.jsx
│   ├── SaveInvoiceTemplateDialog.jsx
│   ├── e-invoice-status-badge.jsx
│   ├── validation-callout.jsx
│   └── __tests__/                         # Tests Vitest
├── hooks/
│   ├── use-invoice-table.js              # 1045 lignes
│   ├── use-invoice-editor.js             # 2400+ lignes
│   ├── use-invoice-number.js
│   ├── use-credit-note-editor.js
│   └── use-credit-note-number.js
└── docs/
    ├── invoice-filters.md                # Doc filtres existante
    └── INVOICES_PAGE.md                  # Ce fichier

app/api/invoices/
├── data/[id]/route.js                    # Fetch data server-to-server (MongoClient direct)
└── generate-pdf/route.js                 # Puppeteer PDF gen

app/api/stripe/invoices/
└── route.js                              # Factures Stripe abonnement (pas business)

src/utils/
└── invoice-export.js                     # CSV / Excel / FEC / Sage / Cegid (1265 lignes)

src/graphql/
├── invoiceQueries.js                     # Queries + mutations + statuses
├── importedInvoiceQueries.js
├── invoiceReminderQueries.js
└── documentEmailQueries.js               # Subscription tracking

src/components/
├── e-invoice-status-badge.jsx            # Badge e-invoicing dans table
├── email-tracking-status.jsx             # Composant tracking
├── pro-route-guard.jsx                   # Garde Pro
├── company-info-guard.jsx                # Garde infos entreprise
└── rbac/                                 # Composants RBAC

src/lib/
├── plan-limits.js                        # Limites par plan (exports, templates, etc.)
└── puppeteer.js                          # launchBrowser() helper

newbi-api/
├── src/models/
│   ├── Invoice.js                        # Schéma principal (568 lignes)
│   ├── CreditNote.js                     # Schéma avoirs (400 lignes)
│   ├── ImportedInvoice.js                # Schéma factures importées
│   ├── DocumentCounter.js                # Compteur atomique (117 lignes)
│   ├── invoiceTemplate.js                # Templates
│   ├── InvoiceReminderSettings.js        # Config relances
│   ├── InvoiceReminderLog.js             # Audit relances
│   └── constants/enums.js                # Tous les enums
├── src/resolvers/
│   ├── invoice.js                        # CRUD + business logic (2956 lignes)
│   ├── creditNote.js
│   ├── importedInvoice.js
│   ├── invoiceTemplate.js
│   └── invoiceReminderSettings.js
├── src/schemas/
│   └── invoice.graphql                   # API schema
├── src/utils/
│   ├── documentNumbers.js                # Génération numéros (1219 lignes)
│   └── validators.js
├── src/cron/
│   ├── overdueAutomationCron.js          # Passage auto en OVERDUE (8h Paris)
│   └── invoiceReminderCron.js            # Relances (toutes les heures)
├── src/queues/
│   └── reminderQueue.js                  # BullMQ workers
├── src/services/
│   ├── invoiceReminderService.js
│   ├── invoiceExtractionService.js       # OCR (utilisé pour importées)
│   ├── pennylaneService.js
│   ├── pennylaneSyncHelper.js
│   ├── documentAutomationService.js
│   ├── notificationService.js
│   └── automationService.js              # CRM automations
└── src/middlewares/
    ├── better-auth.js
    └── rbac.js                           # requireRead/Write/Delete
```

---

## Annexe A — Variables d'environnement pertinentes

| Variable                                          | Service       | Description                  |
| ------------------------------------------------- | ------------- | ---------------------------- |
| `MONGODB_URI`                                     | Mongo         | Connection string            |
| `REDIS_URL`                                       | Redis         | PubSub + BullMQ              |
| `RESEND_API_KEY`                                  | Resend        | Email transactionnel         |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY` | Cloudflare R2 | Stockage PDF                 |
| `R2_BUCKET_INVOICES`                              | R2            | Bucket factures              |
| `STRIPE_SECRET_KEY`                               | Stripe        | Abonnement SaaS              |
| `STRIPE_WEBHOOK_SECRET`                           | Stripe        | Validation webhooks          |
| `PENNYLANE_API_KEY`                               | Pennylane     | Sync compta                  |
| `SUPER_PDP_TOKEN`, `SUPER_PDP_BASE_URL`           | SuperPDP      | E-invoicing                  |
| `BETTER_AUTH_SECRET`                              | Better Auth   | JWT signing                  |
| `NEXT_PUBLIC_APP_URL`                             | Next.js       | URL canonique pour Puppeteer |
| `VERCEL_URL`                                      | Vercel        | Fallback URL                 |

---

## Annexe B — Glossaire

| Terme                                          | Définition                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| **DRAFT**                                      | Brouillon, modifiable librement, numéro temporaire                |
| **PENDING**                                    | Émise, en attente de paiement, numéro figé                        |
| **OVERDUE**                                    | En retard de paiement (PENDING + dueDate < now), set par cron     |
| **COMPLETED**                                  | Payée, lockée                                                     |
| **CANCELED**                                   | Annulée, jamais modifiable                                        |
| **Avoir**                                      | Note de crédit, montants négatifs, lien obligatoire à une facture |
| **Acompte**                                    | Facture partielle, isDeposit:true, lié à un devis                 |
| **Situation**                                  | Facture d'avancement BTP, % par poste, validation cumul           |
| **Auto-liquidation**                           | TVA = 0, mention obligatoire (intra-UE B2B, sous-traitance BTP)   |
| **Retenue de garantie**                        | % retenu par le client jusqu'à fin du chantier (BTP)              |
| **Escompte**                                   | Réduction si paiement anticipé (CGV)                              |
| **FEC**                                        | Fichier des Écritures Comptables, format légal export             |
| **Factur-X**                                   | Format e-invoicing FR (PDF/A-3 + XML EN16931)                     |
| **PDP**                                        | Plateforme de Dématérialisation Partenaire (réforme 2026)         |
| **SuperPDP**                                   | PDP utilisée par Newbi                                            |
| **R2**                                         | Cloudflare R2 (S3-compatible) pour stockage PDF                   |
| **DocumentCounter**                            | Modèle Mongo qui sert de compteur atomique pour la numérotation   |
| **`prefix+number`**                            | Référence facture humaine (ex: F-202605-0042)                     |
| **`(prefix, number, workspaceId, issueYear)`** | Clé unique en base                                                |
| **`pennylaneId`**                              | ID de la facture chez Pennylane après sync                        |
| **`superPdpInvoiceId`**                        | ID chez SuperPDP après envoi e-invoicing                          |
| **`trackingToken`**                            | UUID pour pixel/clic email tracking                               |
