# 🗓️ Guide de Correction du Calendrier

## 🚨 Problèmes Identifiés

### 1. **Erreur "Maximum update depth exceeded"**
**Cause :** Boucle infinie dans le `useEffect` du composant `page.jsx`
- Le tableau `dbEvents` change de référence à chaque render
- `setLocalEvents` déclenche un nouveau render
- Cycle infini : render → useEffect → setState → render

### 2. **Aucune donnée affichée**
**Cause :** Logique de loading trop restrictive dans `useEvents`
- Condition `(workspaceLoading && !workspaceId)` empêche le chargement
- Les événements ne sont jamais récupérés

## ✅ Solutions Appliquées

### 1. **Correction de la Boucle Infinie**

**Fichier :** `app/dashboard/calendar/page.jsx`

```javascript
// ❌ AVANT - Problématique
const [localEvents, setLocalEvents] = useState([]);

useEffect(() => {
  if (dbEvents && dbEvents.length > 0) {
    const transformedEvents = dbEvents.map(/* ... */);
    setLocalEvents(transformedEvents); // ← Cause la boucle infinie
  }
}, [dbEvents, loading]);

// ✅ APRÈS - Corrigé
const localEvents = useMemo(() => {
  if (loading || !dbEvents) {
    return [];
  }
  return dbEvents.map(/* transformation */);
}, [dbEvents, loading]);
```

**Avantages :**
- ✅ Pas de `setState` dans `useEffect`
- ✅ Recalcul uniquement si `dbEvents` ou `loading` changent
- ✅ Performance optimisée avec `useMemo`

### 2. **Correction du Hook useEvents**

**Fichier :** `src/hooks/useEvents.js`

```javascript
// ❌ AVANT - Trop restrictif
loading: (workspaceLoading && !finalWorkspaceId) || (queryLoading && !data?.getEvents)

// ✅ APRÈS - Logique simplifiée
loading: workspaceLoading || (queryLoading && !data?.getEvents)
```

**Explication :**
- `workspaceLoading` : Affiche loading pendant la récupération du workspace
- `queryLoading && !data?.getEvents` : Affiche loading seulement si pas de données en cache

### 3. **Logs de Debug Ajoutés**

**Temporaires pour diagnostic :**
```javascript
// Dans page.jsx
console.log('📅 Calendar Debug:', {
  dbEvents: dbEvents?.length || 0,
  loading,
  error: error?.message,
  hasEvents: !!dbEvents
});

// Dans useEvents.js
console.log('🔍 useEvents Debug:', {
  contextWorkspaceId,
  finalWorkspaceId,
  workspaceLoading,
  skip: skip || !finalWorkspaceId
});
```

## 🧪 Tests de Validation

### Script de Test
```bash
node scripts/test-calendar-debug.js
```

### Scénarios à Vérifier

1. **Chargement Initial**
   - ✅ Skeleton affiché pendant le chargement
   - ✅ Pas de boucle infinie
   - ✅ Événements affichés après chargement

2. **Navigation dans le Calendrier**
   - ✅ Changement de vue (mois/semaine/jour)
   - ✅ Navigation entre les dates
   - ✅ Pas de re-chargement inutile

3. **Gestion des Événements**
   - ✅ Création d'événement
   - ✅ Modification d'événement
   - ✅ Suppression d'événement

## 🔧 Diagnostic des Problèmes

### Console du Navigateur
Vérifier les logs :
```
📅 Calendar Debug: { dbEvents: X, loading: false, error: null, hasEvents: true }
🔍 useEvents Debug: { workspaceId: "...", skip: false }
```

### Problèmes Possibles

| Symptôme | Cause Probable | Solution |
|----------|---------------|----------|
| Boucle infinie | `useEffect` mal configuré | Utiliser `useMemo` |
| Pas de données | `workspaceId` manquant | Vérifier `useWorkspace` |
| Loading permanent | Logique de loading incorrecte | Revoir conditions |
| Erreur GraphQL | Requête malformée | Vérifier variables |

## 🚀 Optimisations Futures

### 1. **Cache Intelligent**
```javascript
// Utiliser Apollo Client cache
const { data, loading } = useQuery(GET_EVENTS, {
  fetchPolicy: 'cache-and-network',
  notifyOnNetworkStatusChange: true
});
```

### 2. **Pagination des Événements**
```javascript
// Charger seulement les événements visibles
const { events } = useEvents({
  startDate: viewStart,
  endDate: viewEnd,
  limit: 50
});
```

### 3. **Optimistic Updates**
```javascript
// Mise à jour immédiate lors de la création
const handleEventAdd = async (event) => {
  // Ajouter immédiatement à l'UI
  setLocalEvents(prev => [...prev, event]);
  
  try {
    await createEvent(event);
  } catch (error) {
    // Rollback en cas d'erreur
    setLocalEvents(prev => prev.filter(e => e.id !== event.id));
  }
};
```

## 📝 Checklist de Déploiement

- [ ] Tests unitaires passent
- [ ] Pas d'erreurs dans la console
- [ ] Performance acceptable (< 100ms render)
- [ ] Fonctionnalités CRUD opérationnelles
- [ ] Responsive design validé
- [ ] **Supprimer les logs de debug**

## 🔄 Rollback Plan

Si problèmes en production :

1. **Rollback Immédiat**
   ```bash
   git revert <commit-hash>
   ```

2. **Version de Secours**
   - Désactiver le calendrier temporairement
   - Afficher message "Maintenance en cours"
   - Rediriger vers liste simple d'événements

## 📚 Documentation Technique

### Architecture
```
Calendar Page
├── useEvents (données)
├── useEventOperations (actions)
├── EventCalendar (affichage)
│   ├── MonthView
│   ├── WeekView
│   ├── DayView
│   └── AgendaView
└── EventDialog (édition)
```

### Flux de Données
```
Backend → GraphQL → useEvents → useMemo → EventCalendar → Views
```

### Gestion d'État
- **Server State :** Apollo Client (événements BDD)
- **Local State :** React State (UI, formulaires)
- **Derived State :** useMemo (événements transformés)
