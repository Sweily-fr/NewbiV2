# Solutions de cache basees sur Better Auth

## Analyse de la documentation Better Auth

La documentation Better Auth revele 2 solutions majeures pour optimiser le cache :

### 1. Cookie Cache (SOLUTION PRINCIPALE)
### 2. React Query (deja utilise en interne)

---

## Solution 1: Activer le Cookie Cache

### Probleme actuel
Chaque appel a `useSession()` ou `useActiveOrganization()` interroge la base de donnees.

### Solution Better Auth
Activer le Cookie Cache pour stocker la session dans un cookie signe.

### Implementation

**Fichier:** `/src/lib/auth.js`

```javascript
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";
import { mongoDb } from "./mongodb";
// ... autres imports

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb),
  appName: "Newbi",
  
  // NOUVEAU: Activer le Cookie Cache
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes de cache
    },
  },
  
  plugins: [
    jwt(),
    adminPlugin,
    phoneNumberPlugin,
    twoFactorPlugin,
    stripePlugin,
    organizationPlugin,
    multiSessionPlugin,
  ],
  
  // ... reste de la config
});
```

### Avantages
- Pas de requete DB a chaque useSession()
- Session mise en cache pendant 5 minutes
- Cookie signe (securise)
- Similaire au systeme JWT access token + refresh token

### Impact sur le changement d'organisation
Avec le Cookie Cache active, le changement d'organisation sera plus rapide car :
1. La session est deja en cache
2. Seul le changement d'organisation active necessite une requete
3. Le cache se met a jour automatiquement apres maxAge

---

## Solution 2: Optimiser le changement d'organisation

### Probleme actuel
```javascript
// team-switcher.jsx
await apolloClient.clearStore(); // Vide TOUT le cache
router.refresh(); // Force un rechargement visible
```

### Solution optimisee

**Fichier:** `/src/components/team-switcher.jsx`

```javascript
const handleSetActiveOrganization = async (organizationId) => {
  if (isChangingOrg) return;
  if (activeOrganization?.id === organizationId) return;

  try {
    setIsChangingOrg(true);
    console.log("🔄 Changement d'organisation:", { 
      from: activeOrganization?.id, 
      to: organizationId 
    });

    // 1. Changer d'organisation cote serveur
    await fetch("/api/auth/organization/set-active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
      credentials: "include",
    });

    // 2. Vider selectivement le cache Apollo (pas clearStore)
    const oldWorkspaceId = activeOrganization?.id;
    
    // Evict uniquement les queries de l'ancienne organisation
    apolloClient.cache.evict({ 
      id: 'ROOT_QUERY',
      fieldName: 'getInvoices',
      args: { workspaceId: oldWorkspaceId }
    });
    apolloClient.cache.evict({ 
      id: 'ROOT_QUERY',
      fieldName: 'getQuotes',
      args: { workspaceId: oldWorkspaceId }
    });
    apolloClient.cache.evict({ 
      id: 'ROOT_QUERY',
      fieldName: 'getClients',
      args: { workspaceId: oldWorkspaceId }
    });
    // ... autres queries
    
    apolloClient.cache.gc(); // Garbage collection

    // 3. Rafraichir les abonnements
    if (refreshDashboardSubscription) {
      await refreshDashboardSubscription();
    }
    if (refreshGlobalSubscription) {
      await refreshGlobalSubscription();
    }

    // 4. Attendre que le Cookie Cache se mette a jour
    await new Promise(resolve => setTimeout(resolve, 100));

    // 5. Notification
    toast.success("Organisation changee");
    
    // 6. Rafraichir SANS rechargement complet
    // Avec Cookie Cache active, les hooks se mettent a jour automatiquement
    router.refresh();
    
  } catch (error) {
    console.error("Erreur changement d'organisation:", error);
    toast.error("Erreur lors du changement d'organisation");
  } finally {
    setIsChangingOrg(false);
  }
};
```

---

## Solution 3: Nettoyer le LocalStorage

### Probleme actuel
Les caches des anciennes organisations restent en LocalStorage.

### Solution

**Fichier:** `/src/components/team-switcher.jsx`

```javascript
const handleSetActiveOrganization = async (organizationId) => {
  // ... code existant
  
  try {
    setIsChangingOrg(true);
    const oldWorkspaceId = activeOrganization?.id;
    
    // 1. Changer d'organisation
    await fetch("/api/auth/organization/set-active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
      credentials: "include",
    });

    // 2. Nettoyer le LocalStorage de l'ancienne organisation
    if (oldWorkspaceId) {
      const oldCacheKey = `dashboard-data-${oldWorkspaceId}`;
      localStorage.removeItem(oldCacheKey);
      console.log(`🗑️ Cache LocalStorage supprime: ${oldCacheKey}`);
    }

    // 3. Vider selectivement Apollo cache
    // ... (voir Solution 2)
    
  } catch (error) {
    // ...
  }
};
```

---

## Solution 4: Configuration React Query (si necessaire)

Si Better Auth expose les options React Query, on peut configurer le staleTime :

**Fichier:** `/src/lib/auth-client.js`

```javascript
import { createAuthClient } from "better-auth/react";
// ... autres imports

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  
  // Si Better Auth supporte ces options
  queryOptions: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  },
  
  plugins: [
    adminClient(),
    phoneNumberClient(),
    twoFactorClient(),
    multiSessionClient(),
    organizationClient({
      // ... config
    }),
    stripeClient({
      subscription: true,
    }),
  ],
});
```

---

## Plan d'implementation recommande

### Etape 1: Activer Cookie Cache (PRIORITE 1)
1. Modifier `/src/lib/auth.js`
2. Ajouter la config `session.cookieCache`
3. Tester le changement d'organisation

### Etape 2: Optimiser le vidage du cache Apollo (PRIORITE 2)
1. Remplacer `clearStore()` par `evict()` selectif
2. Ajouter `gc()` pour le garbage collection
3. Tester les performances

### Etape 3: Nettoyer le LocalStorage (PRIORITE 3)
1. Ajouter le nettoyage dans `handleSetActiveOrganization`
2. Supprimer les anciens caches
3. Verifier qu'il n'y a pas de fuites memoire

### Etape 4: Tester en production
1. Deployer les changements
2. Monitorer les performances
3. Verifier qu'il n'y a plus de rechargement visible

---

## Resultats attendus

### Avant
- Rechargement de page visible au changement d'organisation
- Tous les caches vides (clearStore)
- LocalStorage pollue
- Requetes DB a chaque useSession()

### Apres
- Changement d'organisation fluide (pas de rechargement)
- Cache selectif (evict par workspaceId)
- LocalStorage nettoye
- Session en cache (Cookie Cache)
- Performances ameliorees

---

## Tests a effectuer

### Test 1: Cookie Cache
1. Activer Cookie Cache
2. Ouvrir DevTools > Application > Cookies
3. Verifier la presence du cookie de session cache
4. Changer d'organisation
5. Verifier que le cookie se met a jour

### Test 2: Cache selectif
1. Charger des factures dans Organisation A
2. Changer vers Organisation B
3. Verifier dans Apollo DevTools que seules les queries de A sont evictees
4. Retourner a Organisation A
5. Verifier que les donnees sont refetch

### Test 3: LocalStorage
1. Charger le dashboard dans Organisation A
2. Verifier LocalStorage (dashboard-data-{orgA})
3. Changer vers Organisation B
4. Verifier que le cache de A est supprime
5. Verifier que le cache de B est cree

---

## Conclusion

La documentation Better Auth propose le Cookie Cache comme solution principale.
Combine avec un vidage selectif du cache Apollo et un nettoyage du LocalStorage,
le changement d'organisation devrait etre fluide et sans rechargement visible.

Prochaine etape: Implementer la Solution 1 (Cookie Cache) en priorite.
