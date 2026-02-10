# Architecture - NewbiV2

Frontend principal de la plateforme Newbi SaaS.

## Stack Technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 15 | Framework (App Router) |
| React | 19 | UI Library |
| Apollo Client | 3.14 | Client GraphQL |
| Tailwind CSS | 4 | Styling |
| shadcn/ui | - | Composants UI |
| Better Auth | 1.3 | Authentification |

**Port** : 3000

---

## Structure des Dossiers

```
NewbiV2/
├── app/                          # Next.js App Router
│   ├── (main)/                   # Pages publiques
│   ├── auth/                     # Authentification
│   ├── dashboard/                # Dashboard (protégé)
│   ├── onboarding/               # Onboarding
│   ├── pdf-generator/            # Génération PDF
│   ├── transfer/                 # Transferts publics
│   ├── produits/                 # Pages produits
│   └── api/                      # API Routes (40+)
├── src/
│   ├── components/               # Composants React
│   │   └── ui/                   # Primitives shadcn/ui (60+)
│   ├── contexts/                 # React Contexts
│   ├── hooks/                    # Custom Hooks (60+)
│   ├── graphql/                  # Queries & Mutations
│   ├── lib/                      # Utilitaires (auth, apollo)
│   ├── services/                 # Services métier
│   ├── utils/                    # Helpers
│   └── middleware/               # Middleware subscription
├── lib/                          # Config (banking, categories)
├── public/                       # Assets statiques
├── docs/                         # Documentation interne (47 fichiers)
└── middleware.js                 # Edge middleware
```

---

## Routing (App Router)

### Routes Publiques

| Route | Description |
|-------|-------------|
| `/(main)` | Homepage |
| `/auth/login` | Connexion |
| `/auth/signup` | Inscription |
| `/auth/verify-email` | Vérification email |
| `/auth/verify-2fa` | Vérification 2FA |
| `/auth/forget-password` | Mot de passe oublié |
| `/produits/*` | Pages produits |
| `/transfer/[id]` | Page transfert public |
| `/faq`, `/cgv`, `/mentions-legales` | Pages légales |

### Routes Protégées (Dashboard)

| Route | Description |
|-------|-------------|
| `/dashboard` | Tableau de bord principal |
| `/dashboard/outils/factures` | Gestion factures |
| `/dashboard/outils/devis` | Gestion devis |
| `/dashboard/outils/avoirs` | Gestion avoirs |
| `/dashboard/outils/depenses` | Gestion dépenses |
| `/dashboard/outils/transferts` | Transferts de fichiers |
| `/dashboard/outils/signatures` | Signatures email |
| `/dashboard/outils/transactions` | Transactions bancaires |
| `/dashboard/clients` | Gestion clients |
| `/dashboard/catalogues` | Catalogue produits |
| `/dashboard/collaborateurs` | Équipe |
| `/dashboard/parametres` | Paramètres |
| `/dashboard/analytics` | Analytiques |
| `/dashboard/calendar` | Calendrier |
| `/dashboard/automatisation` | Automatisations CRM |

### API Routes (`/api/`)

| Catégorie | Routes |
|-----------|--------|
| **Auth** | `auth/[...all]`, `check-session-limit`, `revoke-session` |
| **Documents** | `invoices/*`, `quotes/*`, `credit-notes/*` |
| **Banking** | `banking-sync/*`, `banking-connect/*`, `banking/*` |
| **Subscription** | `subscription`, `billing`, `change-subscription-plan` |
| **Organisation** | `organization/*`, `organizations/*` |
| **Fichiers** | `upload-image`, `cloudflare/*`, `images/*` |
| **Utilitaires** | `search-companies`, `tutorial/*`, `generate-facturx` |

---

## Client GraphQL (Apollo)

**Configuration** : `src/lib/apolloClient.js`

### Features

- **Upload** : `apollo-upload-client` pour fichiers
- **WebSocket** : Subscriptions temps réel
- **Auth** : JWT dans Authorization header
- **Cache** : InMemoryCache avec merge policies custom

### Links Chain

```
authLink → errorLink → splitLink(wsLink | uploadLink)
```

### Organisation des Opérations

**Queries** (`src/graphql/queries/`) :
- `banking.js`, `expense.js`, `reconciliation.js`
- `clientLists.js`, `products.js`, `event.js`
- `emailReminder.js`, `notificationPreferences.js`

**Queries Domain** (`src/graphql/`) :
- `invoiceQueries.js`, `quoteQueries.js`, `clientQueries.js`
- `creditNoteQueries.js`, `kanbanQueries.js`, `productQueries.js`

**Mutations** (`src/graphql/mutations/`) :
- Structure parallèle aux queries

---

## Authentification (Better Auth)

**Configuration** : `src/lib/auth-client.js`

### Plugins Activés

| Plugin | Fonction |
|--------|----------|
| `adminClient()` | RBAC |
| `phoneNumberClient()` | Auth téléphone |
| `twoFactorClient()` | 2FA |
| `multiSessionClient()` | Multi-appareils |
| `organizationClient()` | Multi-organisation |
| `stripeClient()` | Intégration Stripe |

### Rôles Définis

- `admin` - Accès complet
- `member` - Membre standard
- `viewer` - Lecture seule
- `accountant` - Accès comptabilité

### Hooks Auth

| Hook | Fichier |
|------|---------|
| `useUser()` | `src/lib/auth/hooks.js` |
| `useAuth()` | `src/hooks/useAuth.js` |
| `useBetterAuthJWT()` | `src/hooks/useBetterAuthJWT.js` |

---

## State Management

### React Contexts (`src/contexts/`)

| Context | Usage |
|---------|-------|
| `AuthContext.jsx` | État authentification |
| `SignatureContext.jsx` | Workflow signatures |
| `dashboard-layout-context.jsx` | Layout dashboard |
| `accounting-view-context.jsx` | Vue comptabilité |
| `settings-form-context.jsx` | Formulaires settings |
| `tutorial-context.jsx` | Progression tutoriel |

### Custom Hooks (`src/hooks/`) - 60+ hooks

| Catégorie | Hooks |
|-----------|-------|
| **Data** | `useDashboardData`, `useInvoices`, `useQuotes`, `useClients`, `useBanking` |
| **Forms** | `useClientCustomFields`, `useClientLists`, `useClientsOptimized` |
| **Banking** | `useBankingConnection`, `useAutoReconcile` |
| **UI** | `useMobile`, `useDashboardLayout`, `useColumnCollapse` |
| **Business** | `useCompanyInfoGuard`, `useActivityNotifications` |

---

## Composants

### shadcn/ui (`src/components/ui/`) - 60+ composants

| Type | Composants |
|------|------------|
| **Forms** | `input`, `select`, `checkbox`, `radio`, `toggle`, `switch`, `form` |
| **Layout** | `card`, `accordion`, `tabs`, `collapsible`, `separator` |
| **Dialogs** | `dialog`, `alert-dialog`, `popover`, `dropdown-menu`, `sheet` |
| **Data** | `table`, `badge`, `progress`, `chart`, `bar-charts` |
| **Special** | `date-picker`, `calendar`, `color-picker`, `currency-input` |

### Composants Feature

```
src/components/
├── auth/              # LoginForm, SignupForm, 2FA
├── banking/           # BankingConnectButton, BankBalanceCard
├── invoice/           # Création facture
├── invoices/          # Gestion factures
├── pdf/               # Rendu PDF
├── signature/         # E-signatures
├── kanban/            # Board Kanban
├── settings/          # Pages paramètres
├── stripe/            # UI Stripe
├── tutorial/          # Onboarding
├── rbac/              # Contrôle accès
├── guards/            # Route guards
├── reconciliation/    # Rapprochement bancaire
├── ocr/               # OCR documents
└── profile/           # Profil utilisateur
```

---

## Styling

### Tailwind CSS v4

**Configuration** : `tailwind.config.js`

- **Dark Mode** : Class-based (`darkMode: "class"`)
- **Fonts** : Geist Sans/Mono, PolySans
- **Animations** : Aurora animation custom

### Patterns

- Primitives Radix UI + Tailwind = shadcn/ui
- `clsx` + `tailwind-merge` pour merge classes
- CSS Variables pour couleurs (`--color-*`)

---

## Services & Utilitaires

### Services (`src/services/`)

| Service | Fonction |
|---------|----------|
| `cloudflareIconUploadService.js` | Upload icons R2 |
| `customSocialIconService.js` | Icônes réseaux sociaux |
| `seatSyncService.js` | Sync sièges équipe |

### Utilitaires (`src/utils/`)

| Utilitaire | Fonction |
|------------|----------|
| `invoiceUtils.js` | Helpers factures |
| `quoteUtils.js` | Helpers devis |
| `creditNoteUtils.js` | Helpers avoirs |
| `dateFormatter.js` | Formatage dates |
| `generatePDF.js` | Génération PDF |
| `facturx-generator.js` | Fichiers Factur-X |
| `invoice-export.js` | Export Excel/CSV |
| `chartDataProcessors.js` | Data charts |
| `api-gouv.js` | API gouvernementales FR |

---

## Middleware

### Edge Middleware (`middleware.js`)

Route vers `subscriptionMiddleware()` pour :
- Vérification session Better Auth
- Redirection si non authentifié
- Validation abonnement actif

### Routes Protégées

- `/dashboard/*` - Requiert auth + subscription
- `/api/invoices/*`, `/api/quotes/*` - Requiert auth

### Routes Exclues

- `/auth/*`, `/api/auth/*`
- `/pricing`, `/onboarding`
- Pages publiques

---

## Génération PDF

### Librairies

| Librairie | Usage |
|-----------|-------|
| `@react-pdf/renderer` | Rendu React → PDF |
| `jspdf` | Création PDF |
| `pdf-lib` | Manipulation PDF |
| `html2canvas` | HTML → Canvas |
| `puppeteer` | Headless browser |

### Routes PDF

- `/pdf-generator/invoice/[id]` - PDF facture
- `/pdf-generator/quote/[id]` - PDF devis
- `/pdf-generator/credit-note/[id]` - PDF avoir

---

## Intégrations

| Service | Usage | Config |
|---------|-------|--------|
| **GraphQL API** | Backend Newbi | `NEXT_PUBLIC_API_URL` |
| **Better Auth** | Authentification | `NEXT_PUBLIC_BETTER_AUTH_URL` |
| **Stripe** | Paiements | `stripe` package |
| **Bridge API** | Banking (via API) | Via backend |
| **Resend** | Emails | `resend` package |
| **API Gouv** | Recherche entreprises | `api-gouv.js` |

---

## Dépendances Clés

### UI & Styling
- `tailwindcss@^4`, `class-variance-authority`, `clsx`, `tailwind-merge`
- `@radix-ui/*` (14 packages), `lucide-react`, `@tabler/icons-react`

### Data & State
- `@apollo/client@^3.14`, `apollo-upload-client`, `graphql-ws`
- `react-hook-form@^7.59`, `zod@^3.25`

### Animations
- `framer-motion@^12`, `canvas-confetti`, `lottie-web`

### Fichiers
- `xlsx`, `jszip`, `xml-js`
- `@aws-sdk/client-s3`, `graphql-upload-minimal`

---

## Scripts

```bash
npm run dev      # Dev avec Turbopack
npm run build    # Build production
npm run start    # Serveur production
npm run lint     # ESLint
```

---

## Système d'Emails d'Abonnement

### Provider

- **Resend API** via `src/lib/resend.js`
- Sender: `Newbi <noreply@newbi.sweily.fr>`

### Templates (`src/lib/email-templates/`)

| Catégorie | Template | Déclencheur |
|-----------|----------|-------------|
| **Subscription** | `subscription/created.js` | `sendSubscriptionCreatedEmail()` (non utilisé automatiquement) |
| | `subscription/cancelled.js` | Webhook `customer.subscription.deleted` |
| | `subscription/changed.js` | API `/change-subscription-plan` |
| | `subscription/renewal-reminder.js` | Webhook `invoice.upcoming` (désactivé) |
| | `subscription/trial-started.js` | Webhook `invoice.paid` (si billing_reason=subscription_create + status=trialing) |
| | `subscription/trial-ending.js` | Webhook `customer.subscription.trial_will_end` |
| **Payment** | `payment/succeeded.js` | Webhook `invoice.paid` (paiement réel) |
| | `payment/failed.js` | Webhook `invoice.payment_failed` |

### Fonctions d'envoi (`src/lib/auth-utils.js`)

| Fonction | Usage |
|----------|-------|
| `sendSubscriptionCreatedEmail()` | Nouvel abonnement (non appelée automatiquement) |
| `sendSubscriptionCancelledEmail()` | Annulation d'abonnement |
| `sendSubscriptionChangedEmail()` | Changement de plan |
| `sendPaymentSucceededEmail()` | Paiement réussi (avec facture PDF en pièce jointe) |
| `sendPaymentFailedEmail()` | Échec de paiement |
| `sendTrialStartedEmail()` | Début de période d'essai |
| `sendTrialEndingEmail()` | Fin d'essai imminente (3 jours avant) |
| `sendRenewalReminderEmail()` | Rappel de renouvellement (désactivé) |

### Webhooks Stripe (`src/lib/auth-plugins.js`)

| Événement | Action |
|-----------|--------|
| `invoice.paid` | Si trial → `sendTrialStartedEmail()`, sinon → `sendPaymentSucceededEmail()` |
| `invoice.payment_failed` | `sendPaymentFailedEmail()` |
| `customer.subscription.deleted` | `sendSubscriptionCancelledEmail()` |
| `customer.subscription.trial_will_end` | `sendTrialEndingEmail()` |
| `invoice.upcoming` | Désactivé (était `sendRenewalReminderEmail()`) |

### Déduplication

Utilise `global._processedStripeEvents` (Set) avec expiration 1h pour éviter les emails en double lors de webhooks multiples.

---

## Flux de Données

### Authentification

```
User → Login Page → Better Auth API → Session + JWT
                                           ↓
                                    LocalStorage (token)
                                           ↓
                                    Apollo authLink (header)
                                           ↓
                                    GraphQL API authentifié
```

### Chargement Dashboard

```
Dashboard Page → useDashboardData hook
                        ↓
                Apollo useQuery (GET_DASHBOARD_STATS)
                        ↓
                GraphQL API → MongoDB
                        ↓
                InMemoryCache
                        ↓
                Rendu composants (charts, cards)
```

### Subscriptions Temps Réel

```
WebSocket connecté → Subscription GraphQL
                           ↓
                    Redis PubSub (backend)
                           ↓
                    Événement publié
                           ↓
                    Client notifié → UI mise à jour
```
