# Etat d'avancement — Refonte securite

> Derniere mise a jour : 2026-04-28 00:00
> Sprint en cours : Sprint 1c
> Statut global : 0/8 sprints termines (Sprint 1a + 1b sous-sprints termines)

## Vue d'ensemble

| Sprint | Description                                                              | Statut  | Date debut | Date fin   | Notes                                       |
| ------ | ------------------------------------------------------------------------ | ------- | ---------- | ---------- | ------------------------------------------- |
| 1a     | Squelette helpers + tests                                                | Termine | 2026-04-27 | 2026-04-27 | 22 fichiers, 57 tests skip, commit 65c9714f |
| 1b     | Helpers de base (requireSession, apiError, withErrorHandler, toObjectId) | Termine | 2026-04-27 | 2026-04-28 | 27 tests pass, 30 skip                      |
| 1c     | Helpers RBAC (requireOrgMembership, requireActiveSubscription)           | A faire | —          | —          | —                                           |
| 1d     | Helpers complements (requireInternalSecret, assertModified)              | A faire | —          | —          | —                                           |
| 1e     | Middleware deny-by-default (logging-only puis enforcement)               | A faire | —          | —          | —                                           |
| 2      | Urgences financieres (input: false, revocation sessions, fallback email) | A faire | —          | —          | —                                           |
| 3      | Routes donnees sensibles (PDF data, members, invitations)                | A faire | —          | —          | —                                           |
| 4      | Routes proxy et multi-tenant (banking-sync, trustedOrigins)              | A faire | —          | —          | —                                           |
| 5      | Validation inputs + coherence ObjectId                                   | A faire | —          | —          | —                                           |
| 6      | RBAC unifie frontend/backend                                             | A faire | —          | —          | —                                           |
| 7      | Consistency checks + monitoring                                          | A faire | —          | —          | —                                           |
| 8      | Cleanup + dette residuelle                                               | A faire | —          | —          | —                                           |

## Sprint en cours : 1c — Helpers RBAC

### Objectif

Implementer requireOrgMembership et requireActiveSubscription. Ces helpers protegent les routes multi-tenant.

### Livrables prevus

- [ ] src/lib/security/require-org-membership.js (implementation)
- [ ] src/lib/security/require-active-subscription.js (implementation)
- [ ] src/lib/security/role-permissions.js (copie synchronisee du backend)
- [ ] **tests**/security/require-org-membership.test.js (10 tests actifs)
- [ ] **tests**/security/require-active-subscription.test.js (7 tests actifs)

### Tests a passer

- [ ] 44 tests pass (27 existants + 17 nouveaux), 13 skip (Sprint 1d)

### Findings resolus par ce sprint

Pattern disponible pour CRITIQUE-8 a 10, MOYEN-16.

### Statut

A faire — en attente de validation Sprint 1b.

---

## Sprints termines

### Sprint 1a — Squelette helpers + tests (2026-04-27)

- 22 fichiers crees (4 docs + 9 helpers + 1 barrel + 8 tests)
- 57 tests skip, 0 erreur
- Commit: 65c9714f

### Sprint 1b — Helpers de base (2026-04-28)

- 4 helpers implementes : apiError, toObjectId, withErrorHandler, requireSession
- 27 tests pass, 30 skip, 0 erreur
- Decision technique : fakeRequest helper dans les tests pour contourner la limitation happy-dom (cookie header filtre par le constructeur Request)
- Finding HAUT-21 : pattern apiError disponible pour remplacer les error.message dans les routes

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
