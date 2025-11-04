
# Composant InvoiceFilters

Le composant `InvoiceFilters` est un composant React qui remplace les deux boutons de filtres (statuts et colonnes) par un seul bouton "..." avec un dropdown contenant les deux filtres.

## Utilisation

```jsx
import InvoiceFilters from './invoice-filters';

function InvoiceTable() {
  return (
    <InvoiceFilters
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      table={table}
    />
  );
}
```

## Props

- `statusFilter` : Le filtre de statut actuel
- `setStatusFilter` : Fonction pour mettre à jour le filtre de statut
- `table` : L'instance de la table React Table
- `className` : Classe CSS supplémentaire pour le bouton

## Fonctionnalités

- Bouton "..." avec un dropdown contenant les filtres de statuts et de colonnes
- Indicateur visuel du nombre de filtres actifs
- Indicateur visuel du nombre de colonnes visibles
- Filtrage par statut avec badges colorés
- Visibilité des colonnes avec indicateurs visuels

## Implémentation

Le composant utilise les composants UI suivants :

- `DropdownMenu` pour le dropdown
- `Button` pour le bouton "..."
- `Badge` pour les indicateurs visuels
- `ListFilterIcon` et `Columns3Icon` pour les icônes

## Personnalisation

Le composant peut être personnalisé en modifiant les props `className` et `variant` du bouton.

## Exemple

```jsx
<InvoiceFilters
  statusFilter={statusFilter}
  setStatusFilter={setStatusFilter}
  table={table}
  className="ml-2"
/>
```

## Conclusion

Le composant `InvoiceFilters` est un composant réutilisable qui permet de remplacer les deux boutons de filtres par un seul bouton "..." avec un dropdown contenant les deux filtres. Il est facile à utiliser et à personnaliser.
