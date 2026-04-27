# Etat d'avancement — Refonte securite

> Derniere mise a jour : 2026-04-27 23:00
> Sprint en cours : Sprint 1a
> Statut global : 0/8 sprints termines

## Vue d'ensemble

| Sprint | Description                                                              | Statut   | Date debut | Date fin | Notes |
| ------ | ------------------------------------------------------------------------ | -------- | ---------- | -------- | ----- |
| 1a     | Squelette helpers + tests                                                | En cours | 2026-04-27 | —        | —     |
| 1b     | Helpers de base (requireSession, apiError, withErrorHandler, toObjectId) | A faire  | —          | —        | —     |
| 1c     | Helpers RBAC (requireOrgMembership, requireActiveSubscription)           | A faire  | —          | —        | —     |
| 1d     | Helpers complements (requireInternalSecret, assertModified)              | A faire  | —          | —        | —     |
| 1e     | Middleware deny-by-default (logging-only puis enforcement)               | A faire  | —          | —        | —     |
| 2      | Urgences financieres (input: false, revocation sessions, fallback email) | A faire  | —          | —        | —     |
| 3      | Routes donnees sensibles (PDF data, members, invitations)                | A faire  | —          | —        | —     |
| 4      | Routes proxy et multi-tenant (banking-sync, trustedOrigins)              | A faire  | —          | —        | —     |
| 5      | Validation inputs + coherence ObjectId                                   | A faire  | —          | —        | —     |
| 6      | RBAC unifie frontend/backend                                             | A faire  | —          | —        | —     |
| 7      | Consistency checks + monitoring                                          | A faire  | —          | —        | —     |
| 8      | Cleanup + dette residuelle                                               | A faire  | —          | —        | —     |

## Sprint en cours : 1a — Squelette helpers + tests

### Objectif

Creer la structure de fichiers pour les 8 helpers de securite avec JSDoc complet, et la structure de tests associee. Aucune logique implementee a cette etape.

### Livrables prevus

- [x] src/lib/security/require-session.js (squelette + JSDoc)
- [x] src/lib/security/require-org-membership.js (squelette + JSDoc)
- [x] src/lib/security/require-internal-secret.js (squelette + JSDoc)
- [x] src/lib/security/require-active-subscription.js (squelette + JSDoc)
- [x] src/lib/security/api-error.js (squelette + JSDoc)
- [x] src/lib/security/with-error-handler.js (squelette + JSDoc)
- [x] src/lib/security/to-object-id.js (squelette + JSDoc)
- [x] src/lib/security/assert-modified.js (squelette + JSDoc)
- [x] src/lib/security/index.js (barrel export)
- [x] **tests**/security/ (structure de tests)

### Tests a passer

- [ ] npm test passe avec les tests skip

### Decisions prises pendant ce sprint

- toObjectId place dans Sprint 1b (pas 1d) car Sprint 2 en depend (ADR-002)
- Chaque test file contient les cas limites identifies pendant l'audit (ex: uppercase hex pour toObjectId, matchedCount>0 mais modifiedCount===0 pour assertModified)

### Findings resolus par ce sprint

Aucun (squelette uniquement).

### Statut

En cours — demarre le 2026-04-27. Squelettes et tests crees. En attente de validation + test npm.

---

## Findings x Sprints

| Finding                                | Severite | Sprint      | Statut  |
| -------------------------------------- | -------- | ----------- | ------- |
| CRITIQUE-1 (invoices/data)             | Critique | Sprint 3    | A faire |
| CRITIQUE-2 (credit-notes/data)         | Critique | Sprint 3    | A faire |
| CRITIQUE-3 (quotes/data)               | Critique | Sprint 3    | A faire |
| CRITIQUE-4 (purchase-orders/data)      | Critique | Sprint 3    | A faire |
| CRITIQUE-5 (org/members sans auth)     | Critique | Sprint 3    | A faire |
| CRITIQUE-8 (banking-sync accounts)     | Critique | Sprint 4    | A faire |
| CRITIQUE-9 (banking-sync transactions) | Critique | Sprint 4    | A faire |
| CRITIQUE-10 (banking-sync full)        | Critique | Sprint 4    | A faire |
| HAUT-6 (invitation data leak)          | Haut     | Sprint 3    | A faire |
| HAUT-11 (banking/accounts)             | Haut     | Sprint 4    | A faire |
| HAUT-12 (middleware allow-by-default)  | Haut     | Sprint 1e   | A faire |
| HAUT-21 (error.message leak)           | Haut     | Sprint 1b+3 | A faire |
| HAUT-22 (verify-checkout fallback)     | Haut     | Sprint 2    | A faire |
| HAUT-26 (onboardingStep updateUser)    | Haut     | Sprint 2    | A faire |
| HAUT-34 (10 additionalFields)          | Haut     | Sprint 2    | A faire |
| MOYEN-7 (subscription/check)           | Moyen    | Sprint 8    | A faire |
| MOYEN-13 (fail-open API)               | Moyen    | Sprint 1e   | A faire |
| MOYEN-16 (routes org sans role)        | Moyen    | Sprint 6    | A faire |
| MOYEN-17 (bypass 5min)                 | Moyen    | Sprint 6    | A faire |
| MOYEN-18 (invitedMembers)              | Moyen    | Sprint 5    | A faire |
| MOYEN-19 (double subscription)         | Moyen    | Sprint 7    | A faire |
| MOYEN-20 (type non whitelist)          | Moyen    | Sprint 5    | A faire |
| MOYEN-23 (org sans subscription)       | Moyen    | Sprint 7    | A faire |
| MOYEN-24 (race org creation)           | Moyen    | Sprint 7    | A faire |
| MOYEN-25 (session updateMany)          | Moyen    | Sprint 5    | A faire |
| MOYEN-29 (onboardingData)              | Moyen    | Sprint 5    | A faire |
| MOYEN-30 (ngrok prod)                  | Moyen    | Sprint 4    | A faire |
| MOYEN-31 (newbi:// scheme)             | Moyen    | Sprint 8    | A faire |
| MOYEN-33 (email non verifie)           | Moyen    | Sprint 8    | A faire |
| BAS-27 (step corrompu)                 | Bas      | Sprint 7    | A faire |
| BAS-28 (dead code invitation)          | Bas      | Sprint 8    | A faire |
| BAS-32 (Vercel preview)                | Bas      | Sprint 4    | A faire |

## Journal de bord

### 2026-04-27 — Demarrage du Sprint 1a

- Creation de la structure docs/security/ (principles.md, architecture.md, migration-plan.md, PROGRESS.md)
- Creation des squelettes de helpers dans src/lib/security/
- Creation de la structure de tests dans **tests**/security/

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
