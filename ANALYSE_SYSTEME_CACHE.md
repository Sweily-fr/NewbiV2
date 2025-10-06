# Analyse complete du systeme de cache

## Vue d'ensemble

Votre application utilise 3 systemes de cache differents :

1. Apollo Client Cache (GraphQL) - Cache principal pour les donnees
2. Better Auth Cache (React Query) - Cache pour l'authentification
3. LocalStorage Cache (Custom) - Cache manuel pour certaines donnees

## 1. Apollo Client Cache

### Configuration
Fichier: /src/lib/apolloClient.js

### Caracteristiques
- Stockage: LocalStorage
- Cle: newbi-apollo-cache
- Taille max: 5MB
- Duree de vie: 7 jours
- Strategie: cache-first

### Vidage du cache
Methode: apolloClient.clearStore()

Utilise dans:
1. Deconnexion (nav-user.jsx ligne 79)
2. Changement d'organisation (team-switcher.jsx ligne 89)
3. Rafraichissement manuel (gestion-depenses/page.jsx ligne 70)

### Problemes identifies

#### Probleme 1: Cache non vide par workspaceId
Le cache garde les donnees de toutes les organisations.
clearStore() vide TOUT au lieu de juste l'organisation actuelle.

Impact: Performance degradee, donnees obsoletes possibles

#### Probleme 2: Pas de TTL configure
Le cache persiste 7 jours sans verification de fraicheur.

Impact: Donnees potentiellement obsoletes

## 2. Better Auth Cache (React Query)

### Configuration
Fichier: /src/lib/auth-client.js

Better Auth utilise React Query en interne pour:
- useActiveOrganization()
- useListOrganizations()
- useSession()

### Problemes identifies

#### Probleme 1: Pas d'invalidation manuelle
On ne peut pas invalider les queries manuellement.

Solution actuelle: router.refresh()
Impact: Rechargement de page visible

#### Probleme 2: Hooks ne se mettent pas a jour
Lors du changement d'organisation, les hooks gardent l'ancienne valeur.

## 3. LocalStorage Cache (Custom)

### Implementation
Fichier: /src/hooks/useDashboardData.js

### Caracteristiques
- Duree: 2 minutes
- Cle: dashboard-data-{workspaceId}
- Donnees: Statistiques dashboard

### Problemes identifies

#### Probleme 1: Cache non nettoye
Les caches des anciennes organisations restent en LocalStorage.

#### Probleme 2: Pas de synchronisation
Pas de synchronisation entre le cache custom et Apollo.

## Recommandations

### 1. Optimiser le vidage du cache Apollo
Au lieu de clearStore(), utiliser evict() pour vider selectivement:

```javascript
// Vider uniquement les queries de l'organisation actuelle
cache.evict({ 
  id: 'ROOT_QUERY',
  fieldName: 'getInvoices',
  args: { workspaceId: oldWorkspaceId }
});
cache.gc(); // Garbage collection
```

### 2. Forcer le refetch des hooks Better Auth
```javascript
// Utiliser $fetch pour forcer un refetch
await authClient.$fetch("/api/auth/get-session", {
  method: "GET",
  cache: "no-store",
});
```

### 3. Nettoyer le LocalStorage
```javascript
// Supprimer les anciens caches au changement d'organisation
const oldCacheKey = `dashboard-data-${oldWorkspaceId}`;
localStorage.removeItem(oldCacheKey);
```

### 4. Implementer un systeme de cache unifie
Creer un service de cache centralise qui gere tous les types de cache.

## Conclusion

Le systeme de cache actuel fonctionne mais presente des inefficacites:
- Trop de vidages complets (clearStore)
- Pas de nettoyage selectif
- Hooks Better Auth non synchronises
- LocalStorage non nettoye

Solutions implementees:
- router.refresh() pour forcer la mise a jour
- clearStore() au changement d'organisation

Ameliorations possibles:
- Cache selectif par workspaceId
- Invalidation intelligente
- Nettoyage automatique du LocalStorage
