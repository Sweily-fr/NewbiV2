# Principes de securite — Newbi

> Version 1.0 — 2026-04-27
> Ces principes sont des regles non negociables. Aucune PR ne doit etre mergee si elle viole l'un d'entre eux.

---

## Principe 1 — Deny by default sur les routes API

Toute route sous `/api/*` est protegee par authentification par defaut. Les routes publiques sont une exception documentee, pas un oubli.

**Implementation** : le middleware verifie la session pour toutes les routes `/api/*`. Les routes publiques (webhooks, search-companies, auth) sont listees dans une whitelist `PUBLIC_API_ROUTES` explicite. Ajouter une route publique necessite un commentaire justificatif et une review securite.

**Findings evites** : CRITIQUE-1 a 5, HAUT-11, MOYEN-7.

---

## Principe 2 — Authentification et autorisation sont deux verifications distinctes

Etre authentifie (qui es-tu ?) ne signifie pas etre autorise (as-tu le droit ?). Toute route qui accede a des donnees scopees par organisation verifie l'appartenance du user a cette organisation.

**Implementation** : un helper `requireOrgMembership(userId, orgId, requiredRole?)` est appele dans chaque route qui manipule des donnees d'org. Le `orgId` n'est jamais lu depuis le body/header client sans cross-check avec la session.

**Findings evites** : CRITIQUE-8 a 10, MOYEN-16.

---

## Principe 3 — Aucune donnee financiere, bancaire ou PII n'est accessible sans authentification ET autorisation

Les routes qui exposent des montants, des IBAN/BIC, des emails, des noms, des adresses, ou des donnees entreprise (SIRET, RCS) verifient la session ET l'appartenance a l'org proprietaire du document.

**Implementation** : les routes de type `/data/[id]` verifient que le document appartient a une org dont le user est membre. Les routes publiques pour Puppeteer (PDF) utilisent un secret partage, pas l'absence d'auth.

**Findings evites** : CRITIQUE-1 a 5, CRITIQUE-8 a 10.

---

## Principe 4 — Les services internes s'authentifient avec un mecanisme dedie

Puppeteer, webhooks, crons, et tout service server-to-server utilisent un secret partage (header `X-Internal-Secret`) ou une signature (Stripe webhook signature). L'absence d'auth n'est jamais un design acceptable pour un service interne.

**Implementation** : les routes appelees par Puppeteer verifient `X-Internal-Secret` OU une session utilisateur. Les webhooks verifient la signature de l'emetteur.

**Findings evites** : CRITIQUE-1 a 4.

---

## Principe 5 — Les additionalFields Better Auth sont en lecture seule par defaut

Tout champ declare dans `user.additionalFields` porte `input: false` sauf s'il est explicitement concu pour etre modifie par l'utilisateur (nom, avatar, preferences UI). L'absence d'`input: false` sur un champ serveur est une faille.

Meme les champs modifiables par l'utilisateur (name, phoneNumber, avatar) doivent etre valides contre un schema (longueur max, regex, whitelist d'URLs autorisees pour avatar). `input: true` ne signifie pas accepter n'importe quoi.

**Implementation** : lors de l'ajout d'un additionalField, le developpeur doit justifier dans un commentaire pourquoi `input: false` n'est PAS pose.

**Findings evites** : HAUT-26, HAUT-34.

---

## Principe 6 — RBAC unifie sur tous les chemins d'acces aux donnees

La meme matrice role x action s'applique que l'acces passe par GraphQL, REST Next.js, ou proxy backend. Aucun chemin d'acces ne peut offrir des permissions plus larges qu'un autre.

**Implementation** : la matrice `ROLE_PERMISSIONS` de `rbac.js` est la source de verite unique. Les routes Next.js importent et appliquent la meme matrice via un helper partage.

**Findings evites** : MOYEN-16, CRITIQUE-8.

---

## Principe 7 — Les inputs client sont valides par schema, pas par confiance

Toute donnee venant du body, des query params, ou des headers client est validee contre un schema structure (Zod). Pas de `JSON.stringify(clientData)` vers la DB sans validation prealable.

**Implementation** : chaque route API definit un schema Zod pour son input. Les champs inattendus sont rejetes (strict mode). Les tailles sont limitees.

**Findings evites** : MOYEN-18, MOYEN-20, MOYEN-29.

---

## Principe 8 — Les erreurs serveur ne leakent pas d'information

Les reponses d'erreur retournent un message generique au client. Les details techniques (stack traces, messages MongoDB, messages Stripe) sont logues cote serveur uniquement.

**Implementation** : un helper `apiError(status, publicMessage, internalDetails)` logge les details en console et retourne le message public. Aucun `error.message` n'est retourne directement dans la reponse JSON.

**Findings evites** : HAUT-21, les `details: error.message` dans plusieurs routes.

---

## Principe 9 — Les operations MongoDB verifient leur resultat

Tout `updateOne`, `updateMany`, `deleteOne` verifie `modifiedCount`/`deletedCount`. Un resultat inattendu (0 quand on attend > 0) est logue comme warning. Un resultat critique (subscription non creee) declenche une alerte.

**Implementation** : un wrapper `assertModified(result, context)` logge un warning si `modifiedCount === 0`.

**Findings evites** : MOYEN-25, MOYEN-23.

---

## Principe 10 — Les IDs sont types de maniere coherente dans les queries MongoDB

Toute query MongoDB qui compare un champ stocke par Better Auth (via le mongo-adapter qui convertit les references en ObjectId) utilise `new ObjectId(id)`, jamais une string brute.

**Implementation** : un helper `toObjectId(id)` encapsule la conversion avec try/catch et est utilise dans toutes les queries directes sur les collections Better Auth (user, session, member, organization).

**Findings evites** : MOYEN-25, bug seats-info.

---

## Principe 11 — Le middleware est la premiere ligne de defense, pas la seule

Le middleware est fail-closed pour les routes API (pas de fallback cookie-only). Les Server Components et les routes individuelles constituent des couches de defense supplementaires, pas des substituts.

En cas d'erreur DB dans le middleware sur des routes API : fail-open tres court (max 30 secondes apres la derniere requete reussie) puis fail-closed (503 Service Unavailable). Cette fenetre est trop courte pour etre exploitee par un attaquant mais protege les utilisateurs legitimes lors de blips infrastructure.

**Implementation** : en cas d'erreur DB prolongee, les routes API retournent 503. Le fail-open cookie-only est acceptable uniquement pour les pages HTML `/dashboard` (ou `layout.jsx` revalide).

**Findings evites** : MOYEN-13.

---

## Principe 12 — Les designs best-effort exigent un monitoring des etats incoherents

Tout pattern de type "fire-and-forget" ou "retry later" doit etre accompagne d'un check periodique qui detecte les etats incoherents resultant d'un echec partiel.

Les checks de coherence sont executes a frequence definie selon la criticite :

- Toutes les heures : etats financiers critiques (org sans subscription, double subscription Stripe, user paye sans acces)
- Toutes les 24h : etats non bloquants (sessions orphelines, dead pending_org_data hors TTL)

L'action en cas de detection : alerte sur canal interne (Slack/email equipe ops) avec liste des cas detectes. Pas de correction automatique — l'humain investigue.

**Findings evites** : MOYEN-23, MOYEN-19.

---

## Principe 13 — Les trustedOrigins sont gerees par environnement

La liste `trustedOrigins` dans la config auth ne contient que des URLs de production. Les URLs de dev/staging (localhost, ngrok, preview branches) sont ajoutees via des variables d'environnement, pas hardcodees.

**Implementation** : `trustedOrigins` en production contient uniquement `https://newbi.fr`, `https://www.newbi.fr`, et le scheme mobile. Le reste est injecte via `process.env.ADDITIONAL_TRUSTED_ORIGINS?.split(",")`.

**Findings evites** : MOYEN-30, BAS-32.

---

## Principe 14 — Une route, un chemin

Deux routes differentes ne doivent pas exposer la meme donnee avec des niveaux de protection differents. Quand une nouvelle route remplace une ancienne, l'ancienne est supprimee, pas laissee en place.

**Implementation** : avant de creer une route, grep l'existing pour la meme collection/donnee. Les routes deprecieees sont supprimees dans la meme PR.

**Findings evites** : CRITIQUE-5, MOYEN-16.

---

## Principe 15 — Minimum de donnees retournees

Chaque route retourne exactement les champs necessaires a son cas d'usage. Les routes pre-authentification (invitation pre-login, signup, healthcheck) retournent un sous-ensemble strict. Les routes authentifiees peuvent retourner plus de details. Les routes pour services internes (Puppeteer, webhooks) retournent le detail complet mais sont protegees par secret partage.

**Findings evites** : HAUT-6, HAUT-21, tous les leak indirects par sur-exposition.
