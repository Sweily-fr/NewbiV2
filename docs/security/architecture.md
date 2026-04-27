# Architecture cible securite — Newbi

> Version 1.0 — 2026-04-27
> Ce document definit les helpers, patterns et outils a mettre en place pour implementer les principes de securite.

---

## 1. Helpers de securite

Tous les helpers vivent dans `src/lib/security/` et sont re-exportes via `src/lib/security/index.js`.

### 1.1 requireSession(request)

**Principe** : 1 (deny by default), 11 (middleware premiere ligne)

```
Signature: async (request: Request) => { user: User, session: Session, cookieHeader: string }
Throws: NextResponse 401 si pas de session valide
```

- Appelle `auth.api.getSession({ headers: request.headers })`
- Retourne `{ user, session, cookieHeader }` — cookieHeader pour les proxies backend
- Throw 401 via apiError si pas de session

### 1.2 requireOrgMembership(userId, orgId, requiredRole?)

**Principe** : 2 (auth != authz), 6 (RBAC unifie), 10 (IDs types)

```
Signature: async (userId: string|ObjectId, orgId: string|ObjectId, requiredRole?: string|string[]) => { role: string, organizationId: ObjectId }
Throws: NextResponse 403 si pas membre ou role insuffisant
```

- Convertit userId et orgId via toObjectId()
- findOne({ userId: ObjectId, organizationId: ObjectId })
- Verifie le role si requiredRole fourni
- Throw 403 si non membre ou role insuffisant

### 1.3 requireActiveSubscription(userId, orgId)

**Principe** : 11 (protection donnees, pas seulement UI)

```
Signature: async (userId: string, orgId: string) => { active: boolean, plan: string, status: string, expiresAt?: Date }
Throws: NextResponse 402 si pas d'abonnement actif
```

- Cherche subscription en DB pour referenceId === orgId
- Accepte status "active" OU "trialing" OU ("canceled" + periodEnd > now)
- Throw 402 Payment Required si pas d'abonnement valide

### 1.4 requireInternalSecret(request) / hasInternalSecret(request)

**Principe** : 4 (services internes authentifies)

```
requireInternalSecret: (request: Request) => void  — throws 401
hasInternalSecret: (request: Request) => boolean    — no throw
```

- Lit header x-internal-secret
- Compare avec process.env.INTERNAL_API_SECRET en constant-time
- requireInternalSecret throw 401 si invalide
- hasInternalSecret retourne boolean (pour les routes dual-access)

### 1.5 apiError(status, publicMessage, internalDetails?)

**Principe** : 8 (pas de leak d'erreur)

```
Signature: (status: number, publicMessage: string, internalDetails?: any) => NextResponse
```

- Log serveur : console.error avec tag, details internes
- Retourne NextResponse.json({ error: publicMessage }, { status })
- Ne retourne JAMAIS error.message, error.stack, ou details au client

### 1.6 withErrorHandler(handler)

**Principe** : 1 (deny by default), 8 (erreurs)

```
Signature: (handler: (request, context?) => Promise<NextResponse>) => (request, context?) => Promise<NextResponse>
```

- Wrappe une route Next.js
- Catch les NextResponse throws (de requireSession etc.) et les retourne
- Catch les Error inattendues et retourne apiError(500, "Erreur serveur", error)

### 1.7 toObjectId(id)

**Principe** : 10 (IDs types)

```
Signature: (id: string|ObjectId) => ObjectId
Throws: NextResponse 400 si id invalide
```

- Si deja ObjectId : pass-through
- Si string : regex /^[0-9a-f]{24}$/ puis new ObjectId(id)
- Throw 400 "ID invalide" si format incorrect

### 1.8 assertModified(result, context)

**Principe** : 9 (verification resultats MongoDB)

```
Signature: (result: UpdateResult, context: string) => void
```

- Si modifiedCount === 0 : console.warn avec tag [DB] et context
- Ne throw pas (informatif, pas bloquant)

---

## 2. Middleware deny-by-default

Logique inversee : toutes les routes /api/\* sont protegees sauf celles explicitement dans PUBLIC_API_ROUTES.

```
PUBLIC_API_ROUTES = [
  "/api/auth",              // Better Auth endpoints
  "/api/webhooks/stripe",   // Webhook Stripe (verifie par signature)
  "/api/search-companies",  // Recherche entreprise publique
  "/api/auth/check-user",   // Check email existence (signup)
  "/api/users/check-email", // Check email (doublon signup)
  "/api/meta-capi",         // Meta Conversion API (tracking)
  "/api/leads/notify",      // Leads (protege par x-api-secret)
  "/api/transfer/download", // File transfer (protege par accessKey)
];
```

Chaque entree porte un commentaire justificatif. Ajouter une route publique necessite une review securite.

---

## 3. Schemas Zod centralises

Fichiers dans `src/lib/schemas/` :

- `onboarding.js` — onboardingStepSchema (step enum, data strict avec cles whitelist)
- `organization.js` — createOrgSubscriptionSchema (invitedMembers avec role sans "owner", max 25, type enum)
- `common.js` — schemas reutilisables (email, siret regex, siren regex, objectId string regex)

Usage : chaque route API parse son body avec `schema.safeParse(body)` et retourne 400 si invalide.

---

## 4. Pattern dual-access (Puppeteer + utilisateur)

Pour les routes appelees par Puppeteer ET potentiellement par des utilisateurs :

```
if (hasInternalSecret(request)) {
  // Service interne — acces direct
} else {
  // Utilisateur — requireSession + requireOrgMembership
}
```

Cote Puppeteer : `page.setExtraHTTPHeaders({ "x-internal-secret": process.env.INTERNAL_API_SECRET })`.

---

## 5. Pattern x-workspace-id pour les proxies multi-org

Le frontend envoie `x-workspace-id` pour le multi-org switching. Le backend Next.js :

1. Lit orgId depuis le header OU session.activeOrganizationId
2. Verifie l'appartenance via requireOrgMembership(user.id, orgId)
3. Propage le header verifie vers le backend Express

Meme si le header diverge de la session (switch en cours), c'est OK tant que le user est membre de l'org demandee.

---

## 6. Consistency checks periodiques

Fichier `src/lib/consistency-checks.js` :

- Check horaire : users onboardingStep "completed" sans subscription
- Check horaire : orgs avec 2+ subscriptions actives
- Check journalier : pending_org_data hors TTL
- Check journalier : sessions avec activeOrganizationId orphelin

Endpoint `/api/admin/consistency-check` protege par admin role. Alerting via Sentry, Slack webhook, ou GitHub Actions selon l'infra en place.

---

## 7. Mapping Principes -> Helpers

| Principe                   | Helper(s)                                                |
| -------------------------- | -------------------------------------------------------- |
| 1. Deny by default         | Middleware deny-by-default + requireSession()            |
| 2. Auth != authz           | requireOrgMembership()                                   |
| 3. Donnees sensibles       | requireSession() + requireOrgMembership()                |
| 4. Services internes       | requireInternalSecret() / hasInternalSecret()            |
| 5. additionalFields        | input: false (config)                                    |
| 6. RBAC unifie             | requireOrgMembership(role?) + ROLE_PERMISSIONS partage   |
| 7. Validation schema       | Schemas Zod centralises                                  |
| 8. Pas de leak erreur      | apiError() + withErrorHandler()                          |
| 9. Resultats MongoDB       | assertModified()                                         |
| 10. IDs types              | toObjectId()                                             |
| 11. Middleware fail-closed | Middleware deny-by-default + requireActiveSubscription() |
| 12. Monitoring best-effort | runConsistencyChecks()                                   |
| 13. trustedOrigins par env | Config                                                   |
| 14. Une route un chemin    | Audit + suppression                                      |
| 15. Minimum de donnees     | Schemas Zod de reponse                                   |
