# Etat d'avancement — Refonte securite

> Derniere mise a jour : 2026-04-29 18:00
> Sprint en cours : Sprint 7 (consistency checks + monitoring)
> Statut global : 6/8 sprints termines (Sprint 1a-1d + Sprint 2-6, Sprint 1e en pause)
> **TOUS LES CRITIQUES DE L'AUDIT SONT RESOLUS (8/8 = 100%)**
> Findings resolus : 24 sur 29 + 4 NOUVEAU = 28 total
>
> - 8 CRITIQUES sur 8 (100%)
> - 5 HAUTS sur 9 (56%)
> - 9 MOYENS sur 12 (75%)
> - 1 BAS sur 3 (33%)
> - 4 NOUVEAU resolus (NOUVEAU-1, NOUVEAU-2, NOUVEAU-4, NOUVEAU-5)

## Vue d'ensemble

| Sprint | Description                                                              | Statut   | Date debut | Date fin   | Notes                                                |
| ------ | ------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------------------------------------------- |
| 1a     | Squelette helpers + tests                                                | Termine  | 2026-04-27 | 2026-04-27 | 22 fichiers, 57 tests skip, commit 65c9714f          |
| 1b     | Helpers de base (requireSession, apiError, withErrorHandler, toObjectId) | Termine  | 2026-04-27 | 2026-04-28 | 27 tests pass, 30 skip                               |
| 1c     | Helpers RBAC (requireOrgMembership, requireActiveSubscription)           | Termine  | 2026-04-28 | 2026-04-28 | 44 tests pass, 13 skip                               |
| 1d     | Helpers complements (requireInternalSecret, assertModified)              | Termine  | 2026-04-28 | 2026-04-28 | 57 tests pass, 0 skip                                |
| 1e     | Middleware deny-by-default (logging-only puis enforcement)               | En pause | 2026-04-28 | —          | Bloque: Edge Runtime + mongodb incompatible          |
| 2      | Urgences financieres (input: false, revocation sessions, fallback email) | Termine  | 2026-04-28 | 2026-04-28 | 3 livraisons, HAUT-22/26/34 resolus                  |
| 3.1    | Routes PDF data (invoices, credit-notes, quotes, purchase-orders)        | Termine  | 2026-04-28 | 2026-04-28 | CRITIQUE 1-4 resolus, 8 routes securisees            |
| 3.2    | Suppression /api/organization/members + invitations + subscription/check | Termine  | 2026-04-28 | 2026-04-28 | CRITIQUE-5, HAUT-6, MOYEN-7 resolus                  |
| 4      | Routes proxy et multi-tenant (banking-sync, trustedOrigins)              | Termine  | 2026-04-28 | 2026-04-28 | 8 CRITIQUES 100%, 10 routes banking, MOYEN-30/BAS-32 |
| 5.1    | Fix string → ObjectId (MOYEN-25)                                         | Termine  | 2026-04-29 | 2026-04-29 | 10 queries corrigees, 3 bugs silencieux decouverts   |
| 5.2    | Zod create-org-subscription (MOYEN-18, MOYEN-20)                         | Termine  | 2026-04-29 | 2026-04-29 | 1er schema Zod, convention .strict() etablie         |
| 5.3    | Zod onboarding/step (MOYEN-29)                                           | Termine  | 2026-04-29 | 2026-04-29 | Schema whitelist cles + requireSession + toObjectId  |
| 6      | RBAC unifie frontend/backend                                             | Termine  | 2026-04-29 | 2026-04-29 | MOYEN-16/17, NOUVEAU-4, -136 lignes cleanup          |
| 7.0    | Fix NOUVEAU-5 (account deactivation bypass)                              | Termine  | 2026-04-29 | 2026-04-29 | NOUVEAU-5 resolu, ADR-007, commit 85d4c5a0           |
| 7      | Consistency checks + monitoring                                          | A faire  | —          | —          | —                                                    |
| 8      | Cleanup + dette residuelle                                               | A faire  | —          | —          | —                                                    |

## Sprint en cours : 7 — Consistency checks + monitoring

### Objectif

Implementer des checks periodiques qui detectent les etats incoherents (org sans subscription, double subscription, sessions orphelines).

### Livrables prevus

- [ ] src/lib/consistency-checks.js implemente
- [ ] Endpoint /api/admin/consistency-check protege
- [ ] Strategie alerting (Sentry/Slack/GitHub Actions)
- [ ] Cron setup

### Findings resolus par ce sprint

MOYEN-19, MOYEN-23, MOYEN-24, BAS-27.

---

## Sprint 1e — Bloque (Edge Runtime + MongoDB)

### Tentatives

- Phase 1 implementee (commit 73252cc9) : middleware deny-by-default avec mode dry-run
- 3 commits de diagnostic successifs (994fd399, 83615d69) : ajout de console.warn inconditionnels
- Le middleware ne s'execute pas du tout en Edge Runtime sur Vercel preview deployments
- Aucun log [MW ENTRY] ni [MW DEBUG] visible dans les logs Vercel

### Cause racine

Crash silencieux a l'import du module. La chaine d'imports est :
middleware.js → subscription.js → auth.js → mongodb.js → MongoClient (driver natif)
Le driver MongoDB natif utilise des APIs Node.js (TCP sockets, net, dns) incompatibles avec le Edge Runtime de Vercel. Le module ne charge jamais, le middleware ne s'execute pas.

### Decision

Revert du middleware Sprint 1e. Restauration du middleware d'origine (fail-open cookie-only). Les vulnerabilites HAUT-12 et MOYEN-13 ne sont pas resolues a ce stade.

### Options pour Sprint 1f (a creer apres Sprints 2-7)

1. Forcer le middleware en Node.js Runtime (export const config = { runtime: 'nodejs' }) — feature Next.js, a valider sur Vercel
2. Reecrire le middleware en Edge-compatible (verification cookie presence uniquement, sans appel DB)
3. Refactorer auth.js pour ne plus importer mongodb directement au top level

### Impact sur la strategie

Les Sprints 2-8 peuvent continuer independamment. Les helpers requireSession, requireOrgMembership, requireActiveSubscription protegent les routes individuellement (defense en profondeur au niveau route). La protection au niveau middleware sera ajoutee en Sprint 1f.

### Notes pour Sprint 4

Config preview mono-branche a refactorer :

- NEXT_PUBLIC_BETTER_AUTH_URL hardcode vers develop
- trustedOrigins Better Auth hardcode vers develop
- Bridge redirect URL hardcodee vers develop
- CORS backend GraphQL n'autorise que develop
- Webhooks Stripe configures vers develop uniquement
- Pattern global : toutes les URLs de config doivent etre pilotees par env var

---

## Sprints termines

### Sprint 1a — Squelette helpers + tests (2026-04-27)

- 22 fichiers crees (4 docs + 9 helpers + 1 barrel + 8 tests)
- 57 tests skip, 0 erreur
- Commit: 65c9714f

### Sprint 6 — RBAC unifie frontend/backend (2026-04-29)

- Sprint 6.1 : 4 routes organizations/[orgId]/\* migrees vers requireSession + requireOrgMembership + withErrorHandler
  - complete-onboarding : ajout role check ["owner", "admin"] (MOYEN-16)
  - members GET : ajout membership check (NOUVEAU-4 — cross-tenant fermé)
  - seats-info + subscription : uniformisation pattern (cleanup $or workarounds)
  - -136 lignes net (369 → 233)
- Sprint 6.2 : filtre status: { $in: ["active", "trialing"] } sur checkRecentStripePayment (MOYEN-17)
- Commits : b7d03dcd, 78ab4789
- Findings resolus : MOYEN-16, MOYEN-17, NOUVEAU-4

### Sprint 5.2-5.3 — Schemas Zod (2026-04-29)

- Sprint 5.2 : schema Zod pour create-org-subscription (MOYEN-18 invitedMembers role != owner, MOYEN-20 type whitelist)
- Sprint 5.3 : schema Zod pour onboarding/step (MOYEN-29 whitelist cles data, step enum)
- Convention etablie : schemas dans src/lib/schemas/, .strict(), apiError(400) pour erreurs
- 2 routes migrees vers withErrorHandler + requireSession + Zod
- Commits : 3bc74471, 26836712

### Sprint 5.1 — Fix string → ObjectId (2026-04-29)

- 3 sous-livraisons : 5.1.1 (session queries), 5.1.2 (org-creation + dashboard + complete-onboarding), 5.1.3 (seats-info)
- 10 queries MongoDB corrigees (string → toObjectId())
- 4 $or workarounds defensifs supprimes (code plus propre et plus rapide)
- 3 bugs silencieux decouverts et corriges (voir section ci-dessous)
- 2 faux positifs de l'investigation initiale identifies (signatures/auto-save, cloudflare/cleanup-temp = GraphQL, pas MongoDB)
- ADR-006 documente
- Commits : f36e85d8, 94510874, b959c22e, 0bdb2e0d
- Finding resolu : MOYEN-25

### Sprint 4 — Routes proxy et multi-tenant (2026-04-28)

- 7 micro-livraisons : 4.1 (accounts), 4.2 (transactions+full), 4.3 (banking/accounts), 4.4 (bridge), 4.5 (gocardless), 4.6 (disconnect+status), 4.7 (trustedOrigins)
- 10 routes banking securisees : 3 banking-sync + 1 banking + 6 banking-connect
- Pattern : requireSession + requireOrgMembership(workspaceId) + requireActiveSubscription
- trustedOrigins refactore : 5 origines permanentes + ADDITIONAL_TRUSTED_ORIGINS env var
- NOUVEAU-2 resolu : 6 routes banking-connect decouvertes et securisees pendant Sprint 4
- NOUVEAU-3 decouvert : config GoCardless invalide en staging (bug backend, pas securite)
- Findings resolus : CRITIQUE-8/9/10, HAUT-11, MOYEN-30, BAS-32, NOUVEAU-2
- **TOUS LES CRITIQUES DE L'AUDIT SONT RESOLUS (8/8 = 100%)**

### Sprint 3.2-3.4 — Suppression routes non securisees (2026-04-28)

- Sprint 3.2 : suppression /api/organization/members + migration accept-invitation (CRITIQUE-5)
- Sprint 3.3 : reduction donnees /api/invitations/[id] GET — 7 champs reduits a 5 (HAUT-6)
- Sprint 3.4 : suppression dead code /api/subscription/check + retrait EXCLUDED_ROUTES (MOYEN-7)
- Migration accept-invitation : email source URL params au lieu de API response
- Commits : 71db7529, 300de50e, 95a6e328, caabd2e4

### Sprint 3.1 — Routes PDF data securisees (2026-04-28)

- 8 routes securisees : 4 data (dual-access) + 4 generate-pdf (requireSession + requireOrgMembership)
- Pattern : hasInternalSecret (Puppeteer) OU cookie + membership (user)
- Ordre auth strict : requireSession AVANT findOne (previent enumeration IDs)
- 4 fuites de connexion MongoClient.connect() corrigees (remplacees par singleton mongoDb)
- 8 leaks error.message supprimes (via withErrorHandler)
- Commits : 298f21f3, a50d7868, cd31819e, 9c0aaeaa, 4a5ef1b6
- Findings resolus : CRITIQUE-1, CRITIQUE-2, CRITIQUE-3, CRITIQUE-4
- ADR-005 documente

### Sprint 2 — Urgences financieres (2026-04-28)

- 3 livraisons : input: false (10 champs) + session revocation + verify-checkout strict
- 5 appels updateUser client migres vers serveur (invitations route + complete-onboarding)
- Commits : 933e13eb, 43d44c94, 83c6fc46
- Findings resolus : HAUT-22, HAUT-26, HAUT-34

### Sprint 1d — Helpers complements (2026-04-28)

- 2 helpers implementes : requireInternalSecret (+ hasInternalSecret), assertModified
- 57 tests pass, 0 skip — tous les helpers sont implementes
- Constant-time comparison via crypto.timingSafeEqual
- INTERNAL_API_SECRET : 500 si non defini (requireInternalSecret), false+warn (hasInternalSecret)

### Sprint 1c — Helpers RBAC (2026-04-28)

- 2 helpers implementes : requireOrgMembership, requireActiveSubscription
- role-permissions.js copie et verifiee identique au backend
- 44 tests pass, annotation @vitest-environment node (ADR-003)

### Sprint 1b — Helpers de base (2026-04-28)

- 4 helpers implementes : apiError, toObjectId, withErrorHandler, requireSession
- 27 tests pass, 0 erreur
- Finding HAUT-21 : pattern apiError disponible pour remplacer les error.message dans les routes

---

## Bugs silencieux decouverts pendant l'audit

### Sprint 5.1 — 3 bugs silencieux corriges au passage de MOYEN-25

Bug 1 : org-creation.js:221 (Sprint 5.1.2)

- Symptome : session.updateMany avec userId en string
- Consequence : modifiedCount toujours 0, le hook session.create.before compensait au login suivant
- Fix : userId en toObjectId() → updateMany fonctionne reellement

Bug 2 : dashboard/layout.jsx:122 (Sprint 5.1.2)

- Symptome : session.updateMany avec userId en string (Server Component)
- Consequence : identique au Bug 1, modifiedCount toujours 0
- Fix : userId → userObjectId (deja defini plus haut dans le meme scope)

Bug 3 : seats-info/route.js (Sprint 5.1.3)

- Symptome : memberCheck AND query avec organizationId en string vs ObjectId en DB
- Consequence : memberCheck retournait toujours null → 403 systematique pour TOUS les users
- Impact UI : sections facturation/abonnement affichaient des donnees par defaut (frontend gerait 403 silencieusement avec if response.ok)
- Fix : organizationId en toObjectId() → la route fonctionne enfin

---

## Findings x Sprints

| Finding                                | Severite | Sprint      | Statut   |
| -------------------------------------- | -------- | ----------- | -------- |
| CRITIQUE-1 (invoices/data)             | Critique | Sprint 3.1  | Resolu   |
| CRITIQUE-2 (credit-notes/data)         | Critique | Sprint 3.1  | Resolu   |
| CRITIQUE-3 (quotes/data)               | Critique | Sprint 3.1  | Resolu   |
| CRITIQUE-4 (purchase-orders/data)      | Critique | Sprint 3.1  | Resolu   |
| CRITIQUE-5 (org/members sans auth)     | Critique | Sprint 3.2  | Resolu   |
| CRITIQUE-8 (banking-sync accounts)     | Critique | Sprint 4.1  | Resolu   |
| CRITIQUE-9 (banking-sync transactions) | Critique | Sprint 4.2  | Resolu   |
| CRITIQUE-10 (banking-sync full)        | Critique | Sprint 4.2  | Resolu   |
| HAUT-6 (invitation data leak)          | Haut     | Sprint 3.3  | Resolu   |
| HAUT-11 (banking/accounts)             | Haut     | Sprint 4.3  | Resolu   |
| HAUT-12 (middleware allow-by-default)  | Haut     | Sprint 1f   | En pause |
| HAUT-21 (error.message leak)           | Haut     | Sprint 1b+3 | A faire  |
| HAUT-22 (verify-checkout fallback)     | Haut     | Sprint 2    | Resolu   |
| HAUT-26 (onboardingStep updateUser)    | Haut     | Sprint 2    | Resolu   |
| HAUT-34 (10 additionalFields)          | Haut     | Sprint 2    | Resolu   |
| MOYEN-7 (subscription/check)           | Moyen    | Sprint 3.4  | Resolu   |
| MOYEN-13 (fail-open API)               | Moyen    | Sprint 1f   | En pause |
| MOYEN-16 (routes org sans role)        | Moyen    | Sprint 6.1  | Resolu   |
| MOYEN-17 (bypass 5min)                 | Moyen    | Sprint 6.2  | Resolu   |
| MOYEN-18 (invitedMembers)              | Moyen    | Sprint 5.2  | Resolu   |
| MOYEN-19 (double subscription)         | Moyen    | Sprint 7    | A faire  |
| MOYEN-20 (type non whitelist)          | Moyen    | Sprint 5.2  | Resolu   |
| MOYEN-23 (org sans subscription)       | Moyen    | Sprint 7    | A faire  |
| MOYEN-24 (race org creation)           | Moyen    | Sprint 7    | A faire  |
| MOYEN-25 (session updateMany)          | Moyen    | Sprint 5.1  | Resolu   |
| MOYEN-29 (onboardingData)              | Moyen    | Sprint 5.3  | Resolu   |
| MOYEN-30 (ngrok prod)                  | Moyen    | Sprint 4.7  | Resolu   |
| MOYEN-31 (newbi:// scheme)             | Moyen    | Sprint 8    | A faire  |
| MOYEN-33 (email non verifie)           | Moyen    | Sprint 8    | A faire  |
| BAS-27 (step corrompu)                 | Bas      | Sprint 7    | A faire  |
| BAS-28 (dead code invitation)          | Bas      | Sprint 8    | A faire  |
| BAS-32 (Vercel preview)                | Bas      | Sprint 4.7  | Resolu   |
| NOUVEAU-5 (deactivation bypass)        | Critique | Sprint 7.0  | Resolu   |

## Journal de bord

### 2026-04-29 — Sprint 7.0 complet (NOUVEAU-5 — account deactivation bypass)

Bug critique decouvert en production : l'utilisateur luffy93 (isActive: false) pouvait se connecter malgre le hook beforeSignInHook.
Cause racine : le bundler Vercel (SWC/Terser) minifie les noms de classes. Le try/catch dans le hook attrapait l'APIError lancee, et le code en aval qui testait `error.constructor.name === "APIError"` recevait `"a"` apres minification → l'erreur etait avalee silencieusement.
Fix : restructuration du hook dans src/lib/auth-hooks.js — le throw APIError est maintenant HORS du try/catch (le try/catch ne couvre que le lookup DB). L'APIError ne peut plus etre attrapee accidentellement.
Validation fonctionnelle : luffy93 bloque avec erreur 400, sofiane.mtimet6 peut toujours se connecter.
ADR-007 documente. Commit 85d4c5a0.

### 2026-04-29 — Sprint 6 complet (MOYEN-16/17 + NOUVEAU-4)

Sprint 6 termine. 2 sous-sprints.
3 findings resolus : MOYEN-16, MOYEN-17, NOUVEAU-4 (decouvert pendant investigation).
Decouverte NOUVEAU-4 : trou cross-tenant CRITIQUE sur members GET (getSession sans memberCheck). Rate par audit initial car la route avait getSession() donnant l'illusion de securite.
Bonus cleanup : -136 lignes sur 4 routes organizations/[orgId]/\*.
Application systematique du pattern requireSession + requireOrgMembership(role?) sur les routes RBAC.

### 2026-04-29 — Sprint 5 complet (4 MOYENS resolus)

Sprint 5 termine. 3 sous-sprints, 4 MOYENS resolus :

- Sprint 5.1 : MOYEN-25 (10 queries string→ObjectId, 3 bugs silencieux decouverts, ADR-006)
- Sprint 5.2 : MOYEN-18 + MOYEN-20 (1er schema Zod, convention .strict() etablie)
- Sprint 5.3 : MOYEN-29 (schema Zod onboarding/step, whitelist cles data)
  1ere utilisation de Zod dans les routes API : convention centralisee dans src/lib/schemas/.
  Note Sprint 8 : exposer les details Zod dans les reponses 400 pour la DX frontend.

### 2026-04-29 — Sprint 5.1 termine (MOYEN-25 resolu)

Sprint 5.1 termine via 3 sous-livraisons. 10 queries MongoDB corrigees + suppression 4 $or workarounds.
Decouverte de 3 bugs silencieux : 2 updateMany ne faisant rien (org-creation, dashboard layout), 1 memberCheck retournant systematiquement 403 (seats-info, impactant l'UI facturation des users payants).
2 faux positifs de l'investigation corrigees (signatures/auto-save et cloudflare/cleanup-temp sont GraphQL, pas MongoDB).
ADR-006 documente : criteres pour conserver new ObjectId() vs migrer vers toObjectId().

### 2026-04-28 — Sprint 4 complet — TOUS LES CRITIQUES RESOLUS

Sprint 4 termine en une session. 7 micro-livraisons. 10 routes banking securisees.
6 findings audit resolus + 1 finding nouveau (NOUVEAU-2 = 6 routes banking-connect).
trustedOrigins refactore pour scoping par environnement.
**Milestone : 8/8 CRITIQUES resolus (100%).**
Decouverte NOUVEAU-3 : config GoCardless invalide en staging (bug backend pre-existant).
Total session : 30+ commits sur security-refactor, 194 tests pass.

### 2026-04-28 — Sprint 3 complet

Sprint 3 termine en une session. 8 findings resolus :

- Sprint 3.1 : pattern dual-access sur 4 routes PDF data + securisation 4 routes generate-pdf (CRITIQUE-1 a 4)
- Sprint 3.2 : suppression /api/organization/members + migration accept-invitation (CRITIQUE-5)
- Sprint 3.3 : reduction donnees /api/invitations/[id] GET — email et organizationId supprimes (HAUT-6)
- Sprint 3.4 : suppression dead code /api/subscription/check (MOYEN-7)

Tous les CRITIQUES frontend resolus. Reste CRITIQUE-8, 9, 10 (banking proxy) pour Sprint 4.
13+ commits Sprint 3 sur security-refactor. 194 tests pass.

Regression UX acceptee : liste membres accept-invitation non affichee pre-login.

### 2026-04-28 — Session marathon : Sprint 1 a 3.1 en une journee

Bilan de la journee :

- Sprint 1a-1d termines : 8 helpers de securite, 57 tests, fondations posees
- Sprint 1e mis en pause : middleware deny-by-default bloque par Edge Runtime + mongodb incompatible
- Sprint 2 complet : input: false sur 10 champs, revocation sessions, verify-checkout strict
- Sprint 3.1 complet : 4 routes PDF data securisees avec pattern dual-access
- Total : 4 CRITIQUES + 3 HAUTS resolus en une journee
- 15+ commits sur security-refactor, 194 tests pass en continu
- Decouvertes : MOYEN-25 confirme empiriquement (ADR-004), INTERNAL_API_SECRET deja existante (reutilisee)
- Finding corrige en cours de sprint : ordre auth (requireSession AVANT findOne) identifie et corrige apres review
- Finding additionnel : generate-pdf non securise identifie et corrige dans le meme sprint

### 2026-04-28 — Sprint 3.1 complet (4 routes PDF data securisees)

- 4 routes data securisees avec pattern dual-access (x-internal-secret OU cookie+membership)
- 4 routes generate-pdf securisees avec requireSession + requireOrgMembership avant launchBrowser
- Ordre auth corrige : requireSession AVANT findOne (previent enumeration IDs)
- MongoClient.connect() remplace par singleton mongoDb (4 fuites de connexion corrigees)
- error.message supprime des reponses 500 (8 routes, via withErrorHandler)
- Findings resolus : CRITIQUE-1, CRITIQUE-2, CRITIQUE-3, CRITIQUE-4
- Commits : 298f21f3, a50d7868, cd31819e, 9c0aaeaa, + ce commit

### 2026-04-28 — Sprint 2 termine (urgences financieres)

- Livraison 1/3 : input: false sur 10 additionalFields + migration 5 appels updateUser client vers serveur
- Livraison 2/3 : revocation de toutes les sessions a la desactivation admin (deleteMany)
- Livraison 3/3 : suppression fallback email dans verify-checkout-session (check strict metadata.userId)
- Smoke test Livraison 1 : login + signup OK sur preview
- Test fonctionnel Livraison 2 : isActive=false confirme, sessions count=0 confirme
- Confirmation empirique MOYEN-25 : userId stocke comme ObjectId en DB, toObjectId() fonctionne correctement
- Findings resolus : HAUT-22, HAUT-26, HAUT-34
- Fix bonus : 2 erreurs ESLint preexistantes corrigees (updateResult unused, catch parameter unused)

### 2026-04-28 — Sprint 1e reverte et mis en pause

- Middleware deny-by-default ne s'execute pas en Edge Runtime (crash import mongodb)
- 3 tentatives de diagnostic (MW DEBUG, MW ENTRY) : aucun log visible
- Cause : chaine d'import middleware.js → subscription.js → auth.js → mongodb (incompatible Edge)
- Decision : revert middleware a l'etat pre-Sprint 1e, reporter a Sprint 1f
- Sprints 2-8 peuvent continuer (helpers protegent les routes individuellement)
- HAUT-12 et MOYEN-13 reportes a Sprint 1f

### 2026-04-28 — Sprint 1e smoke test complete

- Flow critique teste OK (auth + inscription + Stripe + dashboard)
- Banking, documents, upload skipped : infra preview mono-branche (CORS, redirects, webhooks)
- Le middleware dry-run ne bloque aucun flow legitime
- Aucun log [MIDDLEWARE DRY-RUN] inattendu sur les routes testees
- PUBLIC_API_ROUTES initiale suffisante pour le flow critique
- Decision : passer directement phases 2+3 (la whitelist ne necessite pas de correction)

### 2026-04-28 — Sprint 1e workaround: trustedOrigins preview URL

- URL preview security-refactor ajoutee temporairement a trustedOrigins dans auth.js
- Cause : Better Auth retourne "Invalid origin" 403 sur le preview deployment
- URL : https://newbi-v2-git-security-refactor-sofianemtimet6-2653s-projects.vercel.app
- A retirer au Sprint 4 lors du refactor MOYEN-30 (trustedOrigins par env var)

### 2026-04-28 — Sprint 1e phase 1/3 livree (logging-only middleware)

- Middleware reecrit en deny-by-default
- 14 routes dans PUBLIC_API_ROUTES avec commentaires justificatifs
- Mode dry-run via MIDDLEWARE_ENFORCE=false (loggue sans bloquer)
- middleware.js simplifie (catch fatal fail-closed)
- INTERNAL_API_SECRET genere (a ajouter dans Vercel dashboard avant Sprint 3)
- Prochaine etape : deploy staging, smoke test 30 min, analyse logs 24-48h

### 2026-04-28 — Sprint 1d termine

- 2 helpers implementes : requireInternalSecret (avec hasInternalSecret), assertModified
- Comparaison constant-time via crypto.timingSafeEqual pour le secret interne
- assertModified : tolerant pour matchedCount>0/modifiedCount===0 (Decision B)
- 57 tests pass, 0 skip — tous les helpers de securite sont implementes et testes
- Pas de .env.example dans le projet — INTERNAL_API_SECRET documente dans le code et PROGRESS.md

### 2026-04-28 — Sprint 1c termine

- 2 helpers implementes : requireOrgMembership, requireActiveSubscription
- role-permissions.js cree (copie synchronisee du backend)
- 44 tests pass, 13 skip (Sprint 1d)
- Annotation @vitest-environment node ajoutee a tous les fichiers de test security (ADR-003)
- fakeRequest supprime de require-session.test.js grace au switch vers environment node

### 2026-04-28 — Sprint 1b termine

- 4 helpers implementes : apiError, toObjectId, withErrorHandler, requireSession
- 27 tests actifs pass, 30 skip restants
- Contournement happy-dom : fakeRequest helper car Request constructor filtre le header cookie
- Branche security-refactor creee, Sprint 1a commite (65c9714f)

### 2026-04-27 — Demarrage du Sprint 1a

- Creation de la structure docs/security/ (principles.md, architecture.md, migration-plan.md, PROGRESS.md)
- Creation des squelettes de helpers dans src/lib/security/
- Creation de la structure de tests dans **tests**/security/

---

## Dette UX a traiter post-audit

### Sprint 3.2 — Page accept-invitation : regression UX

La liste des membres n'est plus affichee pour les utilisateurs non authentifies sur la page d'acceptation d'invitation. Le nom de l'organisation et le role propose sont toujours affiches.

Solution future si feedback utilisateur : creer GET /api/invitations/[invitationId]/preview avec auth via token d'invitation (pas de session requise), retournant uniquement nom + avatar des membres. Priorite faible.

### Sprint 5.2/5.3 — Erreurs Zod 400 sans details

Les reponses 400 de validation Zod retournent uniquement {"error":"Données invalides"} sans les details de l'erreur (champs manquants, types incorrects, etc.). Pour la DX frontend, exposer validation.error.flatten() dans les reponses permettrait d'afficher des messages d'erreur precis aux utilisateurs. A traiter en Sprint 8 (cleanup) ou plus tard.

---

## Bugs adjacents decouverts pendant l'audit

### NOUVEAU-4 — /api/organizations/[orgId]/members GET sans membership check (CRITIQUE)

- **Decouvert** : Sprint 6 investigation prealable
- **Type** : Securite — cross-tenant data leak
- **Severite** : CRITIQUE (comparable a CRITIQUE-8/9/10)
- **Description** : La route GET /api/organizations/[orgId]/members faisait juste un getSession() sans verifier que l'user etait membre de l'org. Un user authentifie pouvait lire les membres (emails, noms, roles) de N'IMPORTE QUELLE organisation en passant un orgId arbitraire.
- **Pourquoi rate par l'audit initial** : la route avait getSession() qui donnait l'illusion de securite. L'audit Zone 7 avait note "4 routes sous /api/organizations/ ont getSession" mais n'avait pas verifie que chaque route avait aussi un memberCheck.
- **Action** : resolu en Sprint 6.1 par l'ajout de requireOrgMembership(user.id, orgId)
- **Statut** : Resolu

### NOUVEAU-5 — Bypass desactivation compte (bundler minification) (CRITIQUE)

- **Decouvert** : Sprint 7.0 — test fonctionnel en production (luffy93 pouvait se connecter malgre isActive: false)
- **Type** : Securite — bypass d'authentification
- **Severite** : CRITIQUE (un utilisateur desactive peut acceder a l'application)
- **Description** : Le hook beforeSignInHook dans src/lib/auth-hooks.js lancait un `throw new APIError("BAD_REQUEST", ...)` a l'interieur d'un try/catch. Le bundler Vercel (SWC/Terser) minifie les noms de classes : `APIError` devient `a` en production. Le code en aval dans Better Auth qui identifie les erreurs via `error.constructor.name === "APIError"` ne reconnaissait plus l'erreur → elle etait traitee comme une erreur generique et avalee silencieusement, laissant le login se poursuivre.
- **Diagnostic** : Ajout de console.log dans le hook pour tracer le comportement. Logs confirmes : `error.constructor.name = "a"` en production, `"APIError"` en local (dev non minifie).
- **Fix** : Restructuration du hook — le try/catch ne couvre plus que le lookup DB (getMongoDb + findOne). Le `throw new APIError(...)` est place APRES le try/catch, dans le scope principal du middleware. L'erreur ne peut plus etre attrapee par le catch du hook.
- **Pattern general** : Ne JAMAIS identifier des erreurs par constructor.name dans du code qui sera bundle/minifie. Utiliser des proprietes custom, instanceof dans le meme module, ou des codes d'erreur string.
- **Validation** : luffy93 bloque avec erreur 400 "compte desactive", sofiane.mtimet6 login OK.
- **Commit** : 85d4c5a0
- **Statut** : Resolu

### NOUVEAU-3 — Configuration GoCardless invalide en staging

- **Decouvert** : Sprint 4.5 tests fonctionnels
- **Type** : Bug fonctionnel (pas securite)
- **Description** : Le backend newbi-api retourne 500 sur /banking-connect/gocardless/institutions avec le message "Configuration invalide pour le provider: gocardless". La variable d'environnement GoCardless est manquante ou mal configuree cote backend en staging.
- **Impact** : La feature "connecter une banque via GoCardless" ne fonctionne pas en staging. Probablement OK en production si la config y est presente.
- **Action** : A traiter cote backend newbi-api. Verifier la config GoCardless en staging et production.
- **Priorite** : Moyenne (impacte une feature payante mais workaround possible avec Bridge)

---

## Notes pour les futures sessions

Si tu reprends ce projet dans une nouvelle conversation Claude :

1. Lis d'abord ce fichier PROGRESS.md pour savoir ou on en est
2. Lis principles.md pour les regles non negociables
3. Lis architecture.md pour les abstractions cibles
4. Lis migration-plan.md pour le plan detaille du sprint en cours
5. Reprends le travail a partir du sprint marque "En cours"

## Decisions architecturales (ADR)

### ADR-001 : Pattern x-workspace-id pour les proxies multi-org

- **Date** : 2026-04-27
- **Decision** : Accepter le header x-workspace-id du frontend ET verifier l'appartenance via requireOrgMembership. Ne pas forcer session.activeOrganizationId uniquement.
- **Raison** : Le multi-org switching envoie le header avant que la session soit mise a jour via setActive. Verifier l'appartenance est suffisant pour la securite.
- **Impact** : Sprint 4 (routes proxy banking).

### ADR-002 : toObjectId place dans Sprint 1b (pas 1d)

- **Date** : 2026-04-27
- **Decision** : Deplacer toObjectId des helpers complementaires (1d) vers les helpers de base (1b).
- **Raison** : requireSession et Sprint 2 (revocation sessions) en dependent. Le placer en 1b debloque tout le reste.
- **Impact** : Sprint 1b, Sprint 2.

### ADR-003 : @vitest-environment node pour les tests security

- **Date** : 2026-04-28
- **Decision** : Utiliser l'annotation `// @vitest-environment node` dans chaque fichier de test sous **tests**/security/ au lieu du environment happy-dom global.
- **Raison** : Les helpers de securite tournent cote serveur (Node.js). happy-dom filtre le header cookie du constructeur Request, ce qui cassait les tests requireSession. Avec environment node, on teste dans le meme environnement que la production.
- **Impact** : Tous les fichiers de test security. Le fakeRequest helper introduit en Sprint 1b a ete supprime.

### ADR-004 : Confirmation empirique MOYEN-25 (userId ObjectId en DB)

- **Date** : 2026-04-28
- **Decision** : userId est stocke comme ObjectId dans la collection session (confirme par test fonctionnel Sprint 2.2).
- **Raison** : Le test de revocation de sessions a montre que `deleteMany({ userId: toObjectId(id) })` fonctionne correctement (sessions count passe de >0 a 0). Cela confirme que le driver MongoDB 7.1.1 ne fait pas de loose match string/ObjectId et que toObjectId() est necessaire pour toutes les queries sur les collections Better Auth.
- **Impact** : Sprint 5 (correction des queries existantes avec string vs ObjectId). Le bug est reel — les queries avec string userId ne matchent pas.

### ADR-005 : Pattern dual-access pour routes data PDF

- **Date** : 2026-04-28
- **Contexte** : Les 4 routes /api/{type}/data/[id] (invoices, credit-notes, quotes, purchase-orders) doivent etre accessibles a la fois par les utilisateurs authentifies (via cookie de session) et par Puppeteer (qui genere les PDF cote serveur).
- **Decision** : Pattern dual-access avec deux portes d'entree. hasInternalSecret(request) : si le header x-internal-secret matche INTERNAL_API_SECRET, Puppeteer est identifie et accede directement. Sinon : requireSession + requireOrgMembership pour verifier que l'user a acces a l'org proprietaire du document.
- **Securite Puppeteer** : garantie en amont. La route /api/{type}/generate-pdf verifie session + membership AVANT de lancer Puppeteer. Donc Puppeteer ne recoit que des requetes pour des documents auxquels l'user a deja acces.
- **Ordre auth strict** : requireSession AVANT toute lecture DB, puis fetch document, puis requireOrgMembership. Cet ordre empeche un attaquant non authentifie de distinguer 'ID existe' (403) vs 'ID n'existe pas' (404).
- **Pattern** : generate-pdf (requireSession + requireOrgMembership) -> Puppeteer (x-internal-secret) -> data route (hasInternalSecret skip auth).
- **Impact** : 4 routes data + 4 routes generate-pdf = 8 routes securisees.

### ADR-007 : Ne jamais utiliser error.constructor.name pour identifier les erreurs apres bundling

- **Date** : 2026-04-29
- **Contexte** : NOUVEAU-5. Le hook beforeSignInHook lancait `throw new APIError(...)` dans un try/catch. En production, le bundler Vercel minifie `APIError` en `a`. Le code Better Auth qui teste `error.constructor.name === "APIError"` ne reconnaissait plus l'erreur → bypass de la desactivation de compte.
- **Decision** : Ne jamais se fier a `error.constructor.name` pour identifier des erreurs dans du code qui sera bundle/minifie. Alternatives valides :
  - (a) Placer le throw hors du try/catch (solution appliquee ici)
  - (b) Utiliser une propriete custom stable (ex: `error.code`, `error.type`)
  - (c) Utiliser `instanceof` dans le meme module (pas cross-module apres bundling)
  - (d) Utiliser des codes d'erreur string (ex: `error.status === "BAD_REQUEST"`)
- **Pattern dangereux** : `try { throw new CustomError() } catch(e) { if (e.constructor.name === "CustomError") ... }` — le nom sera minifie en production.
- **Pattern sur** : Separer le throw du catch. Le try/catch ne couvre que les operations qui peuvent echouer (DB, I/O). Le throw d'erreur metier est dans le scope principal, non attrapable par le catch local.
- **Impact** : Tout code qui lance des erreurs typees dans un contexte bundle (Next.js, Vite, webpack, etc.).

### ADR-006 : Quand utiliser toObjectId() vs new ObjectId()

- **Date** : 2026-04-29
- **Contexte** : Sprint 5.1.2 a souleve la question des cas ou conserver new ObjectId() est legitime dans org-creation.js (8 occurrences).
- **Decision** :
  - toObjectId() : pour TOUT input qui pourrait venir d'un client (body, query, header, route param). Validation stricte hex 24 chars + erreur 400 claire.
  - new ObjectId() : acceptable UNIQUEMENT pour (a) IDs lus directement depuis MongoDB, (b) IDs de webhooks tiers avec signature crypto verifiee (Stripe constructEvent), (c) IDs de session Better Auth apres getSession.
- **Verification** : avant de garder new ObjectId(), tracer TOUS les appelants de la fonction. S'il existe au moins un appelant qui passe un input client non verifie, migrer vers toObjectId().
- **Precedent** : 8 occurrences new ObjectId() conservees dans org-creation.js apres audit complet des 3 appelants (webhook Stripe + 2 verify-checkout, tous verifies).
- **Impact** : Principe 10 (IDs types de maniere coherente).
