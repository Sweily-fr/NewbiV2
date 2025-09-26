# Guide de Gestion des Erreurs - Newbi

Ce guide explique comment utiliser le système centralisé de gestion des erreurs pour améliorer l'expérience utilisateur en transformant les erreurs techniques en messages clairs et compréhensibles.

## 🎯 Objectif

Remplacer les messages d'erreur techniques comme :
- `GraphQL error: Field 'total' is not defined by type 'ItemInput'`
- `ValidationError: Path 'email' is required`
- `Network error: Failed to fetch`

Par des messages utilisateur clairs comme :
- `Veuillez saisir une adresse email valide`
- `Le serveur est temporairement indisponible. Veuillez réessayer dans quelques instants.`
- `Impossible de créer le client. Vérifiez les informations saisies.`

## 📁 Architecture du Système

### 1. Utilitaires Centralisés
- **`/src/utils/errorMessages.js`** : Messages d'erreur par catégorie et logique de transformation
- **`/src/hooks/useErrorHandler.js`** : Hook pour la gestion centralisée des erreurs

### 2. Composants UI
- **`/src/components/ErrorMessage.jsx`** : Composants d'affichage d'erreurs
- **`/src/components/ErrorBoundary.jsx`** : Boundary pour capturer les erreurs React

### 3. Intégrations
- **Apollo Client** : Intercepteur d'erreurs GraphQL
- **Hooks GraphQL** : Gestion d'erreur dans les mutations et requêtes

## 🚀 Utilisation

### Hook useErrorHandler

```javascript
import { useErrorHandler } from '@/src/hooks/useErrorHandler';

function MyComponent() {
  const { handleError, handleMutationError } = useErrorHandler();

  // Gestion d'erreur générique
  const handleSubmit = async () => {
    try {
      await someOperation();
    } catch (error) {
      handleError(error, 'client'); // Contexte: client, invoice, quote, etc.
    }
  };

  // Gestion d'erreur de mutation GraphQL
  const [createClient] = useMutation(CREATE_CLIENT, {
    onError: (error) => {
      handleMutationError(error, 'create', 'client');
    }
  });
}
```

### Composants d'Affichage

```javascript
import { ErrorMessage, FormErrorMessage, LoadingErrorMessage } from '@/src/components/ErrorMessage';

// Message d'erreur simple
<ErrorMessage 
  error={error} 
  context="client" 
  variant="error" 
/>

// Erreur de formulaire
<FormErrorMessage 
  errors={formErrors} 
  fieldName="email" 
/>

// Erreur de chargement avec retry
<LoadingErrorMessage 
  error={error} 
  onRetry={() => refetch()} 
  context="invoice"
/>
```

### Error Boundary

```javascript
import ErrorBoundary, { CriticalErrorBoundary } from '@/src/components/ErrorBoundary';

// Protection globale
<ErrorBoundary context="dashboard">
  <MyComponent />
</ErrorBoundary>

// Protection pour sections critiques
<CriticalErrorBoundary context="invoice">
  <InvoiceForm />
</CriticalErrorBoundary>
```

## 📝 Contextes Disponibles

### Contextes Métier
- **`client`** : Gestion des clients
- **`invoice`** : Gestion des factures
- **`quote`** : Gestion des devis
- **`creditNote`** : Gestion des avoirs
- **`company`** : Informations d'entreprise
- **`auth`** : Authentification
- **`payment`** : Paiements
- **`file`** : Gestion de fichiers

### Contextes Techniques
- **`network`** : Erreurs réseau
- **`validation`** : Erreurs de validation
- **`generic`** : Erreurs génériques

## 🔧 Messages d'Erreur par Catégorie

### Authentification
```javascript
AUTH: {
  INVALID_CREDENTIALS: "Email ou mot de passe incorrect",
  SESSION_EXPIRED: "Votre session a expiré. Veuillez vous reconnecter.",
  EMAIL_NOT_VERIFIED: "Veuillez vérifier votre adresse email avant de vous connecter"
}
```

### Validation
```javascript
VALIDATION: {
  REQUIRED_FIELD: "Ce champ est obligatoire",
  INVALID_EMAIL: "Veuillez saisir une adresse email valide",
  INVALID_SIRET: "Le SIRET doit contenir exactement 14 chiffres"
}
```

### Réseau
```javascript
NETWORK: {
  CONNECTION_FAILED: "Impossible de se connecter au serveur. Vérifiez votre connexion internet.",
  SERVER_UNAVAILABLE: "Le serveur est temporairement indisponible. Veuillez réessayer dans quelques instants."
}
```

## 🎨 Exemples d'Intégration

### 1. Hook GraphQL avec Gestion d'Erreur

**Avant :**
```javascript
const [createClient] = useMutation(CREATE_CLIENT, {
  onError: (error) => {
    toast.error(error.message || "Erreur lors de la création du client");
  }
});
```

**Après :**
```javascript
const { handleMutationError } = useErrorHandler();

const [createClient] = useMutation(CREATE_CLIENT, {
  onError: (error) => {
    handleMutationError(error, 'create', 'client');
  }
});
```

### 2. Formulaire avec Validation

**Avant :**
```javascript
if (errors.email) {
  return <span className="text-red-500">{errors.email.message}</span>
}
```

**Après :**
```javascript
<FormErrorMessage errors={errors} fieldName="email" />
```

### 3. Page de Chargement avec Erreur

**Avant :**
```javascript
if (error) {
  return <div>Erreur: {error.message}</div>
}
```

**Après :**
```javascript
if (error) {
  return (
    <LoadingErrorMessage 
      error={error} 
      onRetry={() => refetch()} 
      context="invoice"
    />
  );
}
```

## 🔍 Détection Automatique d'Erreurs

Le système détecte automatiquement différents types d'erreurs :

### Patterns GraphQL
- Erreurs de validation : `ValidationError`, `Path .* is required`
- Erreurs réseau : `Network error`, `Failed to fetch`
- Erreurs d'authentification : `UNAUTHENTICATED`, `token expired`

### Patterns MongoDB
- Clés dupliquées : `duplicate key error`, `E11000`
- Erreurs de validation : `ValidationError`, `Cast to .* failed`

### Patterns Métier
- Emails invalides : `invalid email`, `format invalide`
- SIRET invalide : `siret`, numéros de 14 chiffres
- Ressources non trouvées : `not found`, `introuvable`

## 🚨 Gestion des Erreurs Critiques

Certaines erreurs nécessitent des actions immédiates :

```javascript
import { isCriticalError, requiresUserAction } from '@/src/utils/errorMessages';

if (isCriticalError(error)) {
  // Redirection automatique vers login
  setTimeout(() => router.push('/auth/login'), 2000);
}

if (requiresUserAction(error)) {
  // Affichage d'un warning avec action requise
  toast.warning(message, {
    description: "Une action de votre part est requise"
  });
}
```

## 📊 Monitoring et Debug

### Logs de Développement
```javascript
// Les erreurs sont automatiquement loggées en développement
if (process.env.NODE_ENV === 'development') {
  console.error(`[${context.toUpperCase()}] Erreur:`, error);
}
```

### Callback Personnalisé
```javascript
const { handleError } = useErrorHandler();

handleError(error, 'client', {
  onError: (error, userMessage) => {
    // Analytics, monitoring, etc.
    analytics.track('error_occurred', {
      context: 'client',
      originalError: error.message,
      userMessage: userMessage
    });
  }
});
```

## 🔄 Migration des Composants Existants

### Étapes de Migration

1. **Identifier les `toast.error(error.message)`**
2. **Remplacer par `handleError(error, context)`**
3. **Ajouter les contextes appropriés**
4. **Tester les différents scénarios d'erreur**

### Script de Recherche
```bash
# Trouver tous les toast.error avec error.message
grep -r "toast\.error.*error\.message" src/
```

## 🎯 Bonnes Pratiques

### ✅ À Faire
- Utiliser des contextes spécifiques (`client`, `invoice`, etc.)
- Fournir des actions de retry quand possible
- Tester les messages d'erreur avec de vrais utilisateurs
- Logger les erreurs en développement pour le debug

### ❌ À Éviter
- Afficher des messages techniques aux utilisateurs
- Utiliser `error.message` directement dans l'UI
- Ignorer les erreurs silencieusement
- Créer des messages d'erreur trop génériques

## 🧪 Tests

### Test des Messages d'Erreur
```javascript
import { getErrorMessage } from '@/src/utils/errorMessages';

describe('Error Messages', () => {
  it('should return user-friendly message for validation error', () => {
    const error = new Error('ValidationError: Path email is required');
    const message = getErrorMessage(error, 'client');
    expect(message).toBe("L'email est requis");
  });
});
```

### Test des Composants
```javascript
import { render } from '@testing-library/react';
import { ErrorMessage } from '@/src/components/ErrorMessage';

test('displays user-friendly error message', () => {
  const { getByText } = render(
    <ErrorMessage error="SIRET invalid" context="client" />
  );
  expect(getByText(/SIRET doit contenir/)).toBeInTheDocument();
});
```

## 📈 Métriques de Succès

- **Réduction des tickets support** liés aux erreurs incompréhensibles
- **Amélioration du taux de conversion** sur les formulaires
- **Réduction du taux d'abandon** lors d'erreurs
- **Feedback utilisateur positif** sur la clarté des messages

---

Ce système transforme l'expérience utilisateur en rendant les erreurs compréhensibles et actionnables, tout en maintenant une architecture propre et maintenable pour les développeurs.
