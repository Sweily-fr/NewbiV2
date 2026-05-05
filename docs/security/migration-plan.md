# Plan de migration securite — Newbi

> Version 2.0 — 2026-04-27
> 8 sprints, 28-37 jours de developpement, 6-8 semaines en cadence normale.

---

## Strategie de rollback

### Principes generaux

Tout sprint qui modifie le middleware, les routes publiques, ou la config auth doit etre reversible en moins de 5 minutes via git revert + redeploy.

### Mode logging-only pour le middleware (Sprint 1e)

Phase A — Logging-only (24-48h) : le middleware log les routes qui auraient ete bloquees sans bloquer reellement. Analyse des logs, correction de PUBLIC_API_ROUTES.

Phase B — Enforcement : activation du blocage reel. Si une route fonctionnelle casse, git revert du commit middleware + redeploy (< 5 min).

### Points de non-retour par sprint

| Sprint | Reversible                             | Points de non-retour                                                                  |
| ------ | -------------------------------------- | ------------------------------------------------------------------------------------- |
| 1a-1d  | Oui                                    | Aucun                                                                                 |
| 1e     | Oui                                    | Aucun                                                                                 |
| 2      | Partiellement                          | Revocation de sessions (irreversible par nature)                                      |
| 3      | Oui (sauf suppression route)           | Suppression /api/organization/members — verifier qu'aucun client externe ne l'appelle |
| 4      | Oui                                    | Aucun critique                                                                        |
| 5      | Oui                                    | Aucun                                                                                 |
| 6      | Oui                                    | Aucun                                                                                 |
| 7      | Oui                                    | Aucun                                                                                 |
| 8      | Oui (sauf suppression route dead code) | Suppression subscription/check                                                        |

### Procedure de rollback standard

1. Identifier le commit qui a casse
2. git revert <commit> --no-edit && git push
3. Attendre le redeploy automatique (2-3 min)
4. Verifier que le probleme est resolu
5. Ouvrir une issue pour comprendre la cause avant de re-tenter

---

## Sprint 1 — Fondations (7-9 jours)

Pre-requis : aucun

### 1a — Squelette helpers + tests (1 jour)

- Creer src/lib/security/\*.js (squelettes + JSDoc)
- Creer **tests**/security/ (tests vides)
- Findings resolus : aucun

### 1b — Helpers de base (1-2 jours)

- requireSession, apiError, withErrorHandler, toObjectId implementes
- Tests unitaires
- Findings resolus : HAUT-21 (pattern disponible)

### 1c — Helpers RBAC (1-2 jours)

- requireOrgMembership, requireActiveSubscription implementes
- role-permissions.js (copie synchronisee du backend)
- Tests unitaires
- Findings resolus : pattern disponible pour CRITIQUE-8 a 10

### 1d — Helpers complementaires (0.5 jour)

- requireInternalSecret, assertModified implementes
- Variable INTERNAL_API_SECRET dans les .env
- Tests unitaires
- Findings resolus : pattern disponible pour CRITIQUE-1 a 4

### 1e — Middleware deny-by-default (2-3 jours)

- Middleware reecrit avec logique inversee
- PUBLIC_API_ROUTES avec commentaires justificatifs
- Deploy logging-only 24-48h puis enforcement
- Findings resolus : HAUT-12, MOYEN-13

---

## Sprint 2 — Urgences financieres (3-4 jours)

Pre-requis : Sprint 1b + 1d
Parallelisable avec : Sprint 1e

- input: false sur 10 additionalFields (stripeCustomerId en priorite)
- Revocation de sessions a la desactivation admin
- Suppression du fallback email dans verify-checkout-session
- Findings resolus : HAUT-26, HAUT-34, HAUT-22

---

## Sprint 3 — Routes donnees sensibles (4-5 jours)

Pre-requis : Sprint 1b + 1d

- 4 routes PDF data migrees (dual-access: internal secret OU session+membership)
- Puppeteer: ajout header X-Internal-Secret
- Remplacement MongoClient.connect() par singleton mongoDb
- Suppression /api/organization/members (ancienne route sans auth)
- Reduction donnees /api/invitations/[id] GET
- Suppression /api/subscription/check (dead code)
- Findings resolus : CRITIQUE-1 a 5, HAUT-6, MOYEN-7

---

## Sprint 4 — Routes proxy et multi-tenant (3-4 jours)

Pre-requis : Sprint 1c

- 3 routes banking-sync migrees (requireSession + requireOrgMembership + requireActiveSubscription)
- Route /api/banking/accounts migree
- Pattern x-workspace-id: accepter header ET verifier membership
- trustedOrigins par environnement
- Findings resolus : CRITIQUE-8 a 10, HAUT-11, MOYEN-30, BAS-32

---

## Sprint 5 — Validation inputs + coherence ObjectId (3-4 jours)

Pre-requis : Sprint 1b
Parallelisable avec : Sprint 3 ou 4

- Schemas Zod centralises (onboarding, organization, common)
- Migration routes vers schemas Zod
- Verification empirique bug string vs ObjectId (contre base prod read-only)
- Correction des queries si bug confirme
- Findings resolus : MOYEN-18, MOYEN-20, MOYEN-25, MOYEN-29

---

## Sprint 6 — RBAC unifie frontend/backend (4-5 jours)

Pre-requis : Sprint 1c + Sprint 4

- Matrice RBAC partagee avec test de coherence
- Migration 4 routes /api/organizations/[id]/\* vers requireOrgMembership(role?)
- requireActiveSubscription sur routes business
- Filtre status sur checkRecentStripePayment
- Findings resolus : MOYEN-16, MOYEN-17

---

## Sprint 7 — Consistency checks + monitoring (2-3 jours)

Pre-requis : Sprint 1c
Parallelisable avec : Sprint 6

- consistency-checks.js implemente (4 checks)
- Endpoint /api/admin/consistency-check
- Strategie alerting (Sentry/Slack/GitHub Actions selon infra)
- Cron setup via GitHub Actions
- Findings resolus : MOYEN-19, MOYEN-23, MOYEN-24, BAS-27

---

## Sprint 8 — Cleanup + dette residuelle (2-3 jours)

Pre-requis : tous les sprints precedents

- Suppression dead code (subscription/check, invitation dead code signup)
- Bandeau email non verifie + blocage actions sensibles
- Restriction scheme mobile newbi://
- Audit final : rapport 100% couverture
- Findings resolus : MOYEN-7, MOYEN-31, MOYEN-33, BAS-28

---

## Findings x Sprints

| Finding                       | Severite | Sprint      | Statut initial |
| ----------------------------- | -------- | ----------- | -------------- |
| CRITIQUE-1 a 4 (routes data)  | Critique | Sprint 3    | A faire        |
| CRITIQUE-5 (org/members)      | Critique | Sprint 3    | A faire        |
| CRITIQUE-8,9,10 (banking)     | Critique | Sprint 4    | A faire        |
| HAUT-6 (invitation leak)      | Haut     | Sprint 3    | A faire        |
| HAUT-11 (banking/accounts)    | Haut     | Sprint 4    | A faire        |
| HAUT-12 (middleware)          | Haut     | Sprint 1e   | A faire        |
| HAUT-21 (error.message)       | Haut     | Sprint 1b+3 | A faire        |
| HAUT-22 (verify-checkout)     | Haut     | Sprint 2    | A faire        |
| HAUT-26 (onboardingStep)      | Haut     | Sprint 2    | A faire        |
| HAUT-34 (additionalFields)    | Haut     | Sprint 2    | A faire        |
| MOYEN-7 (subscription/check)  | Moyen    | Sprint 8    | A faire        |
| MOYEN-13 (fail-open)          | Moyen    | Sprint 1e   | A faire        |
| MOYEN-16 (routes org role)    | Moyen    | Sprint 6    | A faire        |
| MOYEN-17 (bypass 5min)        | Moyen    | Sprint 6    | A faire        |
| MOYEN-18 (invitedMembers)     | Moyen    | Sprint 5    | A faire        |
| MOYEN-19 (double sub)         | Moyen    | Sprint 7    | A faire        |
| MOYEN-20 (type whitelist)     | Moyen    | Sprint 5    | A faire        |
| MOYEN-23 (org sans sub)       | Moyen    | Sprint 7    | A faire        |
| MOYEN-24 (race org)           | Moyen    | Sprint 7    | A faire        |
| MOYEN-25 (session updateMany) | Moyen    | Sprint 5    | A faire        |
| MOYEN-29 (onboardingData)     | Moyen    | Sprint 5    | A faire        |
| MOYEN-30 (ngrok)              | Moyen    | Sprint 4    | A faire        |
| MOYEN-31 (newbi://)           | Moyen    | Sprint 8    | A faire        |
| MOYEN-33 (email)              | Moyen    | Sprint 8    | A faire        |
| BAS-27 (step corrompu)        | Bas      | Sprint 7    | A faire        |
| BAS-28 (dead code)            | Bas      | Sprint 8    | A faire        |
| BAS-32 (Vercel preview)       | Bas      | Sprint 4    | A faire        |
