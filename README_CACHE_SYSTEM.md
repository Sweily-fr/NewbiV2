# Système de Cache Dashboard - Guide Développeur

## 🎯 Vue d'ensemble

Le système de cache dashboard optimise les performances en évitant les rechargements inutiles des données utilisateur, organisation et abonnement. Il élimine les flashs visuels et réduit significativement les appels API.

## 🏗️ Architecture

### Composants principaux

1. **`useDashboardLayout`** - Hook principal avec logique de cache
2. **`DashboardLayoutProvider`** - Contexte unifié pour toute l'application
3. **Hooks de compatibilité** - `useSubscription()`, `useOnboarding()`
4. **Panel de debug** - Monitoring en développement

### Flux de données

```
localStorage ←→ useDashboardLayout ←→ DashboardLayoutProvider ←→ Composants
                      ↓
              API calls (si cache expiré)
```

## 🚀 Utilisation

### Pour les nouveaux composants

```javascript
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";

function MonComposant() {
  const { user, organization, subscription, trial, isActive } = useDashboardLayoutContext();
  
  if (!user) return <div>Chargement...</div>;
  
  return (
    <div>
      <h1>Bonjour {user.name}</h1>
      {isActive() ? <PremiumFeature /> : <UpgradePrompt />}
    </div>
  );
}
```

### Pour les composants existants (compatibilité)

```javascript
// Ancien code - fonctionne toujours
import { useSubscription } from "@/src/contexts/dashboard-layout-context";

function MonComposant() {
  const { isActive, subscription } = useSubscription();
  // Le reste du code reste identique
}
```

## 📊 Données disponibles

### Via `useDashboardLayoutContext()`

```javascript
const {
  // Données utilisateur
  user,                    // Objet utilisateur complet
  organization,            // Données d'organisation
  
  // Abonnement
  subscription,            // Objet abonnement
  isActive,               // () => boolean - abonnement actif
  hasFeature,             // (feature) => boolean
  getLimit,               // (feature) => number
  
  // Trial
  trial,                  // Objet trial complet
  
  // Onboarding
  isOnboardingOpen,       // boolean
  completeOnboarding,     // () => Promise<void>
  
  // États
  isLoading,              // boolean
  isInitialized,          // boolean
  
  // Cache
  refreshLayoutData,      // () => void - force refresh
  cacheInfo              // Métadonnées du cache
} = useDashboardLayoutContext();
```

### Via hooks de compatibilité

```javascript
// useSubscription() - API identique à l'ancien
const { subscription, loading, isActive, hasFeature } = useSubscription();

// useOnboarding() - API identique à l'ancien
const { isOnboardingOpen, completeOnboarding } = useOnboarding();
```

## ⚙️ Configuration du cache

### Durée de vie
```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

### Clé de cache
```javascript
const cacheKey = `dashboard-layout-${userId}-${organizationId}`;
```

### Invalidation automatique
- Changement d'utilisateur
- Changement d'organisation
- Expiration du cache (5 min)
- Appel manuel à `refreshLayoutData()`

## 🔧 Panel de Debug

En mode développement, un panel apparaît en bas à droite avec :

### Informations affichées
- **Apollo Cache** : Nombre d'entrées, taille
- **Layout Cache** : Status (Cache/Fresh), dernière MAJ
- **État** : Chargement en cours

### Actions disponibles
- **Stats** : Rafraîchir les statistiques
- **Layout** : Forcer le rechargement du cache layout
- **Vider Apollo Cache** : Nettoyer le cache GraphQL

## 🐛 Dépannage

### Problème : Données obsolètes
**Cause** : Cache non invalidé après modification
**Solution** : Utiliser `refreshLayoutData()` ou le bouton "Layout" du debug panel

### Problème : Flash des informations
**Cause** : Composant n'utilise pas le cache
**Solution** : Migrer vers `useDashboardLayoutContext()`

### Problème : Erreur "Context not found"
**Cause** : Composant hors du `DashboardLayoutProvider`
**Solution** : Vérifier la hiérarchie des composants

### Problème : Performance dégradée
**Cause** : Cache trop volumineux ou trop d'invalidations
**Solution** : Vérifier le panel de debug, ajuster `CACHE_DURATION`

## 📈 Métriques de Performance

### Avant le cache
- ~15-20 appels API au chargement
- Flashs visibles lors de la navigation
- Rechargement complet à chaque page

### Après le cache
- ~3-5 appels API au chargement initial
- Navigation instantanée
- Données servies depuis le cache

## 🔒 Sécurité

### Données en cache
- ✅ Informations utilisateur publiques
- ✅ Données d'organisation
- ✅ Statut d'abonnement
- ❌ Tokens d'authentification
- ❌ Mots de passe
- ❌ Données sensibles

### Stockage
- **localStorage** pour la persistance
- **Mémoire** pour l'accès rapide
- **Validation** à chaque utilisation

## 🧪 Tests

### Tests automatiques
```bash
# Exécuter les tests du système de cache
node scripts/test-cache-system.js
```

### Tests manuels
1. **Navigation** : Aucun flash visible
2. **Rafraîchissement** : Données chargées instantanément
3. **Mise à jour organisation** : Cache invalidé automatiquement
4. **Panel debug** : Statistiques cohérentes

## 📝 Migration des composants existants

### Étape 1 : Identifier les composants
```bash
# Trouver les composants utilisant l'ancien contexte
grep -r "subscription-context" src/
```

### Étape 2 : Migrer les imports
```javascript
// Ancien
import { useSubscription } from "@/src/contexts/subscription-context";

// Nouveau
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
```

### Étape 3 : Tester
- Vérifier que le composant fonctionne
- Valider les données affichées
- Confirmer l'absence de flashs

## 🚀 Déploiement

### Checklist pré-déploiement
- [ ] Tous les tests passent
- [ ] Aucun import de l'ancien contexte
- [ ] Panel de debug fonctionne en dev
- [ ] Navigation fluide sans flashs
- [ ] Données cohérentes dans toute l'app

### Variables d'environnement
Aucune nouvelle variable requise - le système utilise les configurations existantes.

## 📚 Ressources

### Fichiers clés
- `src/hooks/useDashboardLayout.js` - Logique principale
- `src/contexts/dashboard-layout-context.jsx` - Contexte et hooks
- `src/components/cache-debug-panel.jsx` - Panel de debug
- `app/dashboard/layout.jsx` - Intégration layout

### Scripts utiles
- `scripts/test-cache-system.js` - Tests automatiques
- `scripts/migrate-subscription-context.js` - Migration automatique

---

**Le système de cache est maintenant opérationnel et prêt pour la production !** 🎉
