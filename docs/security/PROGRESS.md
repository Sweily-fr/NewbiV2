# Etat d'avancement — Refonte securite

> Derniere mise a jour : 2026-04-28 12:30
> Sprint en cours : Sprint 2
> Statut global : 0/8 sprints termines (Sprint 1a-1d termines, Sprint 1e en pause)

## Vue d'ensemble

| Sprint | Description                                                              | Statut   | Date debut | Date fin   | Notes                                       |
| ------ | ------------------------------------------------------------------------ | -------- | ---------- | ---------- | ------------------------------------------- |
| 1a     | Squelette helpers + tests                                                | Termine  | 2026-04-27 | 2026-04-27 | 22 fichiers, 57 tests skip, commit 65c9714f |
| 1b     | Helpers de base (requireSession, apiError, withErrorHandler, toObjectId) | Termine  | 2026-04-27 | 2026-04-28 | 27 tests pass, 30 skip                      |
| 1c     | Helpers RBAC (requireOrgMembership, requireActiveSubscription)           | Termine  | 2026-04-28 | 2026-04-28 | 44 tests pass, 13 skip                      |
| 1d     | Helpers complements (requireInternalSecret, assertModified)              | Termine  | 2026-04-28 | 2026-04-28 | 57 tests pass, 0 skip                       |
| 1e     | Middleware deny-by-default (logging-only puis enforcement)               | En pause | 2026-04-28 | —          | Bloque: Edge Runtime + mongodb incompatible |
| 2      | Urgences financieres (input: false, revocation sessions, fallback email) | A faire  | —          | —          | —                                           |
| 3      | Routes donnees sensibles (PDF data, members, invitations)                | A faire  | —          | —          | —                                           |
| 4      | Routes proxy et multi-tenant (banking-sync, trustedOrigins)              | A faire  | —          | —          | —                                           |
| 5      | Validation inputs + coherence ObjectId                                   | A faire  | —          | —          | —                                           |
| 6      | RBAC unifie frontend/backend                                             | A faire  | —          | —          | —                                           |
| 7      | Consistency checks + monitoring                                          | A faire  | —          | —          | —                                           |
| 8      | Cleanup + dette residuelle                                               | A faire  | —          | —          | —                                           |

## Sprint en cours : 2 — Urgences financieres

### Objectif

Appliquer input: false sur les 10 additionalFields vulnerables, revoquer les sessions a la desactivation admin, supprimer le fallback email dans verify-checkout-session.

### Livrables prevus

- [ ] input: false sur 10 champs dans auth.js (stripeCustomerId en priorite)
- [ ] Revocation de sessions a la desactivation admin
- [ ] Suppression du fallback email dans verify-checkout-session
- [ ] Tests manuels

### Findings resolus par ce sprint

HAUT-26, HAUT-34 (10 champs), HAUT-22.

### Statut

A faire.

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

| Finding                                | Severite | Sprint      | Statut   |
| -------------------------------------- | -------- | ----------- | -------- |
| CRITIQUE-1 (invoices/data)             | Critique | Sprint 3    | A faire  |
| CRITIQUE-2 (credit-notes/data)         | Critique | Sprint 3    | A faire  |
| CRITIQUE-3 (quotes/data)               | Critique | Sprint 3    | A faire  |
| CRITIQUE-4 (purchase-orders/data)      | Critique | Sprint 3    | A faire  |
| CRITIQUE-5 (org/members sans auth)     | Critique | Sprint 3    | A faire  |
| CRITIQUE-8 (banking-sync accounts)     | Critique | Sprint 4    | A faire  |
| CRITIQUE-9 (banking-sync transactions) | Critique | Sprint 4    | A faire  |
| CRITIQUE-10 (banking-sync full)        | Critique | Sprint 4    | A faire  |
| HAUT-6 (invitation data leak)          | Haut     | Sprint 3    | A faire  |
| HAUT-11 (banking/accounts)             | Haut     | Sprint 4    | A faire  |
| HAUT-12 (middleware allow-by-default)  | Haut     | Sprint 1f   | En pause |
| HAUT-21 (error.message leak)           | Haut     | Sprint 1b+3 | A faire  |
| HAUT-22 (verify-checkout fallback)     | Haut     | Sprint 2    | A faire  |
| HAUT-26 (onboardingStep updateUser)    | Haut     | Sprint 2    | A faire  |
| HAUT-34 (10 additionalFields)          | Haut     | Sprint 2    | A faire  |
| MOYEN-7 (subscription/check)           | Moyen    | Sprint 8    | A faire  |
| MOYEN-13 (fail-open API)               | Moyen    | Sprint 1f   | En pause |
| MOYEN-16 (routes org sans role)        | Moyen    | Sprint 6    | A faire  |
| MOYEN-17 (bypass 5min)                 | Moyen    | Sprint 6    | A faire  |
| MOYEN-18 (invitedMembers)              | Moyen    | Sprint 5    | A faire  |
| MOYEN-19 (double subscription)         | Moyen    | Sprint 7    | A faire  |
| MOYEN-20 (type non whitelist)          | Moyen    | Sprint 5    | A faire  |
| MOYEN-23 (org sans subscription)       | Moyen    | Sprint 7    | A faire  |
| MOYEN-24 (race org creation)           | Moyen    | Sprint 7    | A faire  |
| MOYEN-25 (session updateMany)          | Moyen    | Sprint 5    | A faire  |
| MOYEN-29 (onboardingData)              | Moyen    | Sprint 5    | A faire  |
| MOYEN-30 (ngrok prod)                  | Moyen    | Sprint 4    | A faire  |
| MOYEN-31 (newbi:// scheme)             | Moyen    | Sprint 8    | A faire  |
| MOYEN-33 (email non verifie)           | Moyen    | Sprint 8    | A faire  |
| BAS-27 (step corrompu)                 | Bas      | Sprint 7    | A faire  |
| BAS-28 (dead code invitation)          | Bas      | Sprint 8    | A faire  |
| BAS-32 (Vercel preview)                | Bas      | Sprint 4    | A faire  |

## Journal de bord

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
