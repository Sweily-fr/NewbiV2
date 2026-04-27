# Etat d'avancement — Refonte securite

> Derniere mise a jour : 2026-04-28 00:15
> Sprint en cours : Sprint 1e
> Statut global : 0/8 sprints termines (Sprint 1a-1d sous-sprints termines, tous helpers implementes)

## Vue d'ensemble

| Sprint | Description                                                              | Statut  | Date debut | Date fin   | Notes                                       |
| ------ | ------------------------------------------------------------------------ | ------- | ---------- | ---------- | ------------------------------------------- |
| 1a     | Squelette helpers + tests                                                | Termine | 2026-04-27 | 2026-04-27 | 22 fichiers, 57 tests skip, commit 65c9714f |
| 1b     | Helpers de base (requireSession, apiError, withErrorHandler, toObjectId) | Termine | 2026-04-27 | 2026-04-28 | 27 tests pass, 30 skip                      |
| 1c     | Helpers RBAC (requireOrgMembership, requireActiveSubscription)           | Termine | 2026-04-28 | 2026-04-28 | 44 tests pass, 13 skip                      |
| 1d     | Helpers complements (requireInternalSecret, assertModified)              | Termine | 2026-04-28 | 2026-04-28 | 57 tests pass, 0 skip                       |
| 1e     | Middleware deny-by-default (logging-only puis enforcement)               | A faire | —          | —          | —                                           |
| 2      | Urgences financieres (input: false, revocation sessions, fallback email) | A faire | —          | —          | —                                           |
| 3      | Routes donnees sensibles (PDF data, members, invitations)                | A faire | —          | —          | —                                           |
| 4      | Routes proxy et multi-tenant (banking-sync, trustedOrigins)              | A faire | —          | —          | —                                           |
| 5      | Validation inputs + coherence ObjectId                                   | A faire | —          | —          | —                                           |
| 6      | RBAC unifie frontend/backend                                             | A faire | —          | —          | —                                           |
| 7      | Consistency checks + monitoring                                          | A faire | —          | —          | —                                           |
| 8      | Cleanup + dette residuelle                                               | A faire | —          | —          | —                                           |

## Sprint en cours : 1e — Middleware deny-by-default

### Objectif

Reecrire le middleware avec logique inversee : toutes les routes /api/\* protegees par defaut, seules les routes dans PUBLIC_API_ROUTES sont exclues. Deploy en mode logging-only d'abord, puis enforcement.

### Livrables prevus

- [x] src/middleware/subscription.js reecrit (logique inversee)
- [x] PUBLIC_API_ROUTES avec commentaire justificatif par entree (14 routes)
- [x] Mode logging-only (variable MIDDLEWARE_ENFORCE=false)
- [ ] Deploy staging + analyse logs 24-48h
- [ ] Activation enforcement (MIDDLEWARE_ENFORCE=true)

### Tests a passer

- [ ] Tous les tests security existants passent (57)
- [ ] Smoke test manuel en staging (30 min)

### Findings resolus par ce sprint

HAUT-12 (routes API echappent au middleware), MOYEN-13 (fail-open sur routes API).

### Statut

Phase 1/3 livree (logging-only). En attente de deploy staging + analyse logs.

---

## Sprints termines

### Sprint 1a — Squelette helpers + tests (2026-04-27)

- 22 fichiers crees (4 docs + 9 helpers + 1 barrel + 8 tests)
- 57 tests skip, 0 erreur
- Commit: 65c9714f

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
