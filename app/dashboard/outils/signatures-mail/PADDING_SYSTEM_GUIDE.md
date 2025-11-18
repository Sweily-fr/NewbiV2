# 📐 Guide du Système de Padding Détaillé

## Vue d'ensemble

Le système de padding détaillé permet de contrôler précisément l'espacement autour de **chaque élément** de la signature mail (haut, droite, bas, gauche). Il détecte automatiquement les `<td>` dans la structure HTML et propose des contrôles individuels pour chaque champ.

## 🎯 Fonctionnalités

### 1. Mode Global (par défaut)
- Espacement global appliqué à tous les éléments
- Interface simple avec un seul slider
- Compatible avec l'ancien système

### 2. Mode Avancé (détaillé)
- Contrôle individuel du padding pour chaque élément
- 4 valeurs par élément : top, right, bottom, left
- Détection automatique des éléments visibles/masqués
- Interface pliable/dépliable pour chaque élément

## 📋 Éléments Détectés

Le système détecte automatiquement les éléments suivants :

| Élément | Clé | Icône | Description |
|---------|-----|-------|-------------|
| Photo de profil | `photo` | 📷 | Image de profil ronde/carrée |
| Nom complet | `name` | 👤 | Prénom + Nom |
| Poste | `position` | 💼 | Titre du poste |
| Entreprise | `company` | 🏢 | Nom de l'entreprise |
| Téléphone | `phone` | 📞 | Numéro de téléphone fixe |
| Mobile | `mobile` | 📱 | Numéro de mobile |
| Email | `email` | ✉️ | Adresse email |
| Site web | `website` | 🌐 | URL du site web |
| Adresse | `address` | 📍 | Adresse postale |
| Séparateur | `separator` | ➖ | Ligne horizontale |
| Logo entreprise | `logo` | 🏷️ | Logo de l'entreprise |
| Réseaux sociaux | `social` | 🔗 | Icônes des réseaux |

## 🔧 Utilisation dans le Code

### 1. Structure des Données

```javascript
// Dans use-signature-data.js
paddings: {
  photo: { top: 0, right: 0, bottom: 12, left: 0 },
  name: { top: 0, right: 0, bottom: 8, left: 0 },
  position: { top: 0, right: 0, bottom: 8, left: 0 },
  // ... autres éléments
}
```

### 2. Helper Functions

```javascript
import { 
  getPaddingStyle,
  getPaddingStyleObject,
  getIndividualPaddingStyles,
  getPaddingInlineStyle,
  detectSignatureElements,
  generatePaddingReport
} from "../../utils/padding-helper";
```

### 3. Intégration dans les Composants

#### Exemple avec PersonalInfo.jsx

```javascript
<td
  style={{
    textAlign: nameAlignment,
    // Padding détaillé ou espacement par défaut
    ...(signatureData.detailedSpacing
      ? getIndividualPaddingStyles(signatureData, "name", { bottom: 8 })
      : { paddingBottom: `${getSpacing(signatureData, undefined, 8)}px` }),
  }}
>
  {/* Contenu */}
</td>
```

#### Exemple avec ContactInfo.jsx

```javascript
<td
  style={{
    // Padding détaillé pour le téléphone
    ...(signatureData.detailedSpacing
      ? getIndividualPaddingStyles(signatureData, "phone", { bottom: 4 })
      : { paddingBottom: `${spacing ?? 6}px` }),
  }}
>
  {/* Contenu */}
</td>
```

### 4. Génération HTML pour Email

```javascript
// Pour les emails HTML (inline styles)
const paddingStyle = getPaddingInlineStyle(signatureData, "name", { bottom: 8 });

const html = `
  <td style="${paddingStyle}">
    ${signatureData.fullName}
  </td>
`;
```

## 🎨 Interface Utilisateur

### Activation du Mode Avancé

1. Aller dans **Espacements** (section Layout)
2. Activer le switch **"Mode avancé"**
3. Les contrôles de padding détaillé apparaissent

### Contrôles par Élément

Chaque élément affiche :
- **Icône** : Identification visuelle
- **Label** : Nom de l'élément
- **Badge "Masqué"** : Si l'élément n'est pas visible
- **Résumé** : Format `top|right|bottom|left`
- **Chevron** : Pour plier/déplier les contrôles

### Modification des Paddings

1. Cliquer sur un élément pour le déplier
2. Modifier les 4 valeurs (Haut, Droite, Bas, Gauche)
3. Valeurs entre 0 et 50 pixels
4. Les changements sont appliqués en temps réel

## 🔍 Algorithme de Détection

Le système utilise `detectSignatureElements()` pour :

1. **Analyser** les données de signature
2. **Identifier** les éléments présents
3. **Filtrer** les éléments masqués
4. **Mapper** chaque élément à sa clé de padding
5. **Générer** un rapport complet

```javascript
const report = generatePaddingReport(signatureData);
console.log(report);
// {
//   totalElements: 8,
//   detailedMode: true,
//   elements: [
//     { key: "photo", label: "Photo de profil", padding: {...}, ... },
//     { key: "name", label: "Nom complet", padding: {...}, ... },
//     ...
//   ]
// }
```

## 📊 Compatibilité

### Clients Mail Supportés

✅ **Gmail** : Padding inline styles  
✅ **Outlook** : Padding avec VML fallback  
✅ **Apple Mail** : Padding natif  
✅ **Thunderbird** : Padding natif  
✅ **Yahoo Mail** : Padding inline styles  

### Orientations Supportées

✅ **Verticale** : Photo en haut, contenu centré  
✅ **Horizontale** : Photo à gauche, contenu à droite  

## 🚀 Migration depuis l'Ancien Système

### Avant (Espacement Global)

```javascript
spacings: {
  global: 8,
  photoBottom: 12,
  nameBottom: 8,
  // ...
}
```

### Après (Padding Détaillé)

```javascript
paddings: {
  photo: { top: 0, right: 0, bottom: 12, left: 0 },
  name: { top: 0, right: 0, bottom: 8, left: 0 },
  // ...
}
```

### Rétrocompatibilité

Le système est **100% rétrocompatible** :
- Si `detailedSpacing: false` → Utilise l'ancien système
- Si `detailedSpacing: true` → Utilise le nouveau système
- Les anciennes signatures continuent de fonctionner

## 🛠️ Développement

### Ajouter un Nouvel Élément

1. **Ajouter dans `use-signature-data.js`** :
```javascript
paddings: {
  // ... éléments existants
  newElement: { top: 0, right: 0, bottom: 0, left: 0 },
}
```

2. **Ajouter dans `DetailedPaddingSection.jsx`** :
```javascript
const elements = [
  // ... éléments existants
  { key: "newElement", label: "Nouvel Élément", icon: "🆕" },
];
```

3. **Ajouter dans `padding-helper.js`** :
```javascript
// Dans detectSignatureElements()
if (signatureData.newElement) {
  elements.push({
    key: "newElement",
    label: "Nouvel Élément",
    type: "custom",
    value: signatureData.newElement,
  });
}
```

4. **Intégrer dans le composant** :
```javascript
<td
  style={{
    ...(signatureData.detailedSpacing
      ? getIndividualPaddingStyles(signatureData, "newElement")
      : { padding: "0" }),
  }}
>
  {/* Contenu */}
</td>
```

## 📝 Bonnes Pratiques

### 1. Valeurs Recommandées

- **Photo** : `bottom: 12-16px`
- **Nom** : `bottom: 8-12px`
- **Poste** : `bottom: 8-12px`
- **Contacts** : `bottom: 4-6px`
- **Séparateur** : `top: 12px, bottom: 12px`

### 2. Cohérence Visuelle

- Utiliser des valeurs multiples de 4 (4, 8, 12, 16, 20...)
- Garder des espacements similaires pour les éléments du même type
- Tester dans plusieurs clients mail

### 3. Performance

- Le mode détaillé n'impacte pas les performances
- Les calculs sont optimisés avec des helpers
- Pas de re-render inutiles

## 🐛 Débogage

### Vérifier les Paddings Appliqués

```javascript
import { generatePaddingReport } from "../../utils/padding-helper";

const report = generatePaddingReport(signatureData);
console.log("📊 Rapport de padding:", report);
```

### Tester la Détection

```javascript
import { detectSignatureElements } from "../../utils/padding-helper";

const elements = detectSignatureElements(signatureData);
console.log("🔍 Éléments détectés:", elements);
```

## 📚 Ressources

- **Fichiers principaux** :
  - `/src/hooks/use-signature-data.js` - Structure des données
  - `/utils/padding-helper.js` - Fonctions helper
  - `/components/editor/layout/sections/DetailedPaddingSection.jsx` - Interface
  - `/components/signature-parts/*.jsx` - Intégration

- **Documentation** :
  - `PADDING_SYSTEM_GUIDE.md` - Ce guide
  - `spacing-helper.js` - Ancien système (toujours utilisé)

## ✨ Améliorations Futures

- [ ] Présets de padding (Compact, Normal, Spacieux)
- [ ] Copier/coller les paddings entre éléments
- [ ] Visualisation en temps réel des zones de padding
- [ ] Export/import de configurations de padding
- [ ] Suggestions intelligentes basées sur l'orientation

---

**Créé le** : 17 novembre 2024  
**Version** : 1.0.0  
**Auteur** : Système de Signatures Mail Newbi
