# Guide : Éviter les erreurs Apollo "Non authentifié"

## 🎯 Problème

Vous voyez souvent cette erreur dans la console :
```
ApolloError: Vous devez être connecté pour effectuer cette action
```

Cette erreur se produit quand des requêtes GraphQL sont exécutées **avant** que la session utilisateur ne soit complètement chargée.

## ✅ Solutions

### 1. Utiliser `useSafeQuery` (Recommandé)

Ce hook attend automatiquement que la session soit chargée avant d'exécuter la query.

```javascript
import { useSafeQuery } from '@/src/hooks/useSafeQuery';
import { GET_MY_DATA } from '@/src/graphql/queries';

function MyComponent() {
  const { data, loading, error } = useSafeQuery(GET_MY_DATA, {
    variables: { id: '123' }
  });
  
  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;
  
  return <div>{data.myData}</div>;
}
```

### 2. Utiliser `useAuthenticatedQuery`

Ce hook gère explicitement l'état de la session et retourne une erreur claire si non authentifié.

```javascript
import { useAuthenticatedQuery } from '@/src/hooks/useSafeQuery';
import { GET_MY_DATA } from '@/src/graphql/queries';

function MyComponent() {
  const { data, loading, error } = useAuthenticatedQuery(GET_MY_DATA);
  
  if (loading) return <div>Chargement...</div>;
  
  if (error) {
    if (error.message === 'Non authentifié') {
      return <div>Veuillez vous connecter</div>;
    }
    return <div>Erreur: {error.message}</div>;
  }
  
  return <div>{data.myData}</div>;
}
```

### 3. Utiliser `skip` avec la session

Si vous utilisez directement `useQuery`, ajoutez une condition `skip` :

```javascript
import { useQuery } from '@apollo/client';
import { useSession } from '@/src/lib/auth-client';
import { GET_MY_DATA } from '@/src/graphql/queries';

function MyComponent() {
  const { data: session, isPending } = useSession();
  
  const { data, loading, error } = useQuery(GET_MY_DATA, {
    skip: isPending || !session?.user, // ⚠️ Important !
    variables: { id: '123' }
  });
  
  if (isPending || loading) return <div>Chargement...</div>;
  if (!session?.user) return <div>Non connecté</div>;
  if (error) return <div>Erreur: {error.message}</div>;
  
  return <div>{data.myData}</div>;
}
```

## 🔧 Configuration Apollo

Le client Apollo est configuré pour gérer intelligemment les erreurs d'authentification :

### Contexte `isInitialLoad`

Les queries peuvent indiquer qu'elles sont au chargement initial :

```javascript
const { data } = useQuery(MY_QUERY, {
  context: {
    isInitialLoad: true // Pas de toast d'erreur si échec
  }
});
```

### Gestion des erreurs

L'errorLink Apollo :
- ✅ Affiche un toast pour les erreurs critiques (sauf au chargement initial)
- ✅ Redirige vers `/auth/login` si nécessaire
- ✅ Log les erreurs en console pour le debug

## 📋 Checklist

Avant de créer un composant avec des queries GraphQL :

- [ ] Utiliser `useSafeQuery` ou `useAuthenticatedQuery`
- [ ] OU ajouter `skip: isPending || !session?.user`
- [ ] Gérer l'état de chargement (`loading`)
- [ ] Gérer l'état d'erreur (`error`)
- [ ] Gérer l'état non authentifié

## 🚫 À éviter

```javascript
// ❌ MAUVAIS : Query exécutée immédiatement
function MyComponent() {
  const { data } = useQuery(GET_MY_DATA);
  return <div>{data?.myData}</div>;
}

// ✅ BON : Query avec protection
function MyComponent() {
  const { data, loading } = useSafeQuery(GET_MY_DATA);
  if (loading) return <div>Chargement...</div>;
  return <div>{data?.myData}</div>;
}
```

## 🔍 Debug

Si vous voyez toujours des erreurs :

1. Vérifier la console pour les logs Apollo :
   - `⚠️ [Apollo] Session non disponible`
   - `⚠️ [Apollo] Erreur récupération JWT`

2. Vérifier que la session est chargée :
   ```javascript
   const { data: session, isPending } = useSession();
   console.log('Session:', session, 'Pending:', isPending);
   ```

3. Vérifier le contexte de la query :
   ```javascript
   const { data } = useQuery(MY_QUERY, {
     context: { isInitialLoad: true },
     onError: (error) => console.error('Query error:', error)
   });
   ```

## 📚 Ressources

- [Apollo Client Error Handling](https://www.apollographql.com/docs/react/data/error-handling/)
- [Better Auth Session Management](https://www.better-auth.com/docs/concepts/session)
- Code source : `/src/lib/apolloClient.js`
- Hooks : `/src/hooks/useSafeQuery.js`
