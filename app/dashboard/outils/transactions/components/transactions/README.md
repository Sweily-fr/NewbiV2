# Structure du TransactionTable

Cette structure modulaire permet une meilleure organisation et maintenabilité du code.

## 📁 Architecture

```
transactions/
├── TransactionTable.jsx           # Fichier principal (logique & orchestration)
├── columns/
│   └── transactionColumns.jsx     # Définition des colonnes du tableau
├── filters/
│   ├── multiColumnFilterFn.js     # Fonction de filtrage multi-colonnes
│   └── typeFilterFn.js            # Fonction de filtrage par type
├── components/
│   ├── RowActions.jsx             # Actions sur les lignes (éditer, supprimer, etc.)
│   ├── DesktopFilters.jsx         # Filtres desktop (recherche, filtres, vue)
│   ├── MobileToolbar.jsx          # Barre d'outils mobile
│   ├── DesktopTable.jsx           # Tableau desktop
│   ├── MobileTable.jsx            # Tableau mobile
│   └── TablePagination.jsx        # Pagination
└── utils/
    └── mappers.js                 # Fonctions de mapping (catégories, méthodes de paiement)
```

## 🔧 Responsabilités

### TransactionTable.jsx
- Gestion de l'état global (filtres, pagination, sélection)
- Orchestration des hooks (useExpenses, useInvoices, etc.)
- Gestion des actions (ajout, édition, suppression)
- Configuration de react-table
- Coordination des sous-composants

### columns/transactionColumns.jsx
- Définition complète des colonnes du tableau
- Rendu des cellules (badges, avatars, icônes)
- Configuration du tri et des filtres par colonne
- Traduction des catégories et méthodes de paiement

### filters/
- **multiColumnFilterFn.js**: Recherche globale sur plusieurs colonnes
- **typeFilterFn.js**: Filtrage par type de transaction

### components/
- **RowActions.jsx**: Menu d'actions par ligne (éditer, copier, supprimer, télécharger)
- **DesktopFilters.jsx**: Barre de filtres desktop avec ButtonGroup
- **MobileToolbar.jsx**: Barre d'outils simplifiée pour mobile
- **DesktopTable.jsx**: Affichage du tableau sur desktop
- **MobileTable.jsx**: Affichage du tableau sur mobile
- **TablePagination.jsx**: Contrôles de pagination

### utils/mappers.js
- Conversion des catégories formulaire → API
- Conversion des méthodes de paiement formulaire → API

## 🔄 Flux de données

```
TransactionTable (état & logique)
    ↓
    ├─→ DesktopFilters (filtres & actions)
    ├─→ DesktopTable (affichage desktop)
    │       └─→ columns → RowActions
    ├─→ MobileToolbar (barre mobile)
    ├─→ MobileTable (affichage mobile)
    └─→ TablePagination (pagination)
```

## ✅ Avantages de cette structure

1. **Séparation des responsabilités**: Chaque fichier a un rôle clair
2. **Réutilisabilité**: Les composants peuvent être réutilisés
3. **Maintenabilité**: Plus facile de trouver et modifier du code
4. **Testabilité**: Chaque module peut être testé indépendamment
5. **Performance**: Imports optimisés et code splitting possible

## 🚀 Utilisation

Le composant s'utilise exactement comme avant :

```jsx
import TransactionTable from "./components/table";

<TransactionTable
  expenses={expenses}
  invoices={invoices}
  loading={loading}
  refetchExpenses={refetchExpenses}
  refetchInvoices={refetchInvoices}
/>
```

L'ancien fichier `table.jsx` fait maintenant un simple re-export pour maintenir la compatibilité.
