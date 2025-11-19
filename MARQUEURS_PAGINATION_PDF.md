# 📋 Marqueurs de Pagination Intelligente - PDF

## ✅ Marqueurs ajoutés à UniversalPreviewPDF.jsx

### 🎯 Vue d'ensemble

Les marqueurs `data-*` ont été ajoutés pour permettre une pagination intelligente lors de la génération PDF. Ces marqueurs indiquent au générateur PDF comment découper le document sans casser la mise en page.

---

## 📊 Hiérarchie des marqueurs

```
data-pdf-root                              ← Racine du document
│
├─ data-pdf-section="body"                 ← Corps principal
│  │
│  ├─ data-pdf-section="header"            ← En-tête
│  │  └─ data-no-break                     ← Ne jamais couper
│  │  └─ data-critical                     ← Critique
│  │
│  ├─ data-pdf-section="info"              ← Informations entreprise/client
│  │  └─ data-no-break                     ← Ne jamais couper
│  │  └─ data-critical                     ← Critique
│  │
│  ├─ data-pdf-section="items"             ← Tableau des articles
│  │  ├─ data-pdf-table-header             ← En-tête du tableau
│  │  │  └─ data-repeat-on-page            ← À répéter sur chaque page
│  │  │  └─ data-no-break                  ← Ne jamais couper
│  │  │
│  │  └─ data-pdf-items-body               ← Corps du tableau
│  │     └─ data-pdf-item                  ← Chaque ligne
│  │        ├─ data-item-index={index}     ← Index de la ligne
│  │        ├─ data-item-type="product"    ← Type d'article
│  │        └─ data-no-break="true"        ← Ne pas couper la ligne
│  │
│  ├─ data-pdf-section="totals"            ← Section des totaux
│  │  └─ data-no-break                     ← Ne jamais couper
│  │  └─ data-critical                     ← Critique
│  │  └─ data-keep-with-footer             ← Garder avec le footer
│  │
│  └─ data-pdf-section="footer-notes"      ← Notes de footer
│     └─ data-no-break={condition}         ← Conditionnel selon longueur
```

---

## 🏷️ Types de marqueurs

### 1. **Marqueurs de structure**

#### `data-pdf-root`
- **Élément** : Conteneur principal du document
- **Usage** : Identifie la racine du document PDF
- **Exemple** :
```jsx
<div data-pdf-document="true" data-pdf-root>
```

#### `data-pdf-section`
- **Valeurs** : `"body"`, `"header"`, `"info"`, `"items"`, `"totals"`, `"footer-notes"`
- **Usage** : Identifie les grandes sections du document
- **Exemple** :
```jsx
<div data-pdf-section="header" data-no-break data-critical>
```

---

### 2. **Marqueurs de pagination**

#### `data-no-break`
- **Type** : Boolean ou conditionnel
- **Usage** : Empêche la coupure de l'élément lors de la pagination
- **Exemples** :
```jsx
{/* Toujours ne pas couper */}
<div data-no-break>

{/* Conditionnel selon la longueur */}
<div data-no-break={data.footerNotes && data.footerNotes.length < 200}>
```

#### `data-critical`
- **Type** : Boolean
- **Usage** : Marque un élément comme critique (ne peut JAMAIS être coupé)
- **Sections critiques** :
  - Header (logo + titre)
  - Informations entreprise/client
  - Totaux
- **Exemple** :
```jsx
<div data-pdf-section="header" data-no-break data-critical>
```

#### `data-keep-with-footer`
- **Type** : Boolean
- **Usage** : Garde l'élément avec le footer (ex: totaux)
- **Exemple** :
```jsx
<div data-pdf-section="totals" data-keep-with-footer>
```

---

### 3. **Marqueurs de tableau**

#### `data-pdf-table-header`
- **Usage** : Identifie l'en-tête du tableau
- **Combiné avec** : `data-repeat-on-page`
- **Exemple** :
```jsx
<thead data-pdf-table-header data-repeat-on-page data-no-break>
```

#### `data-repeat-on-page`
- **Usage** : Indique que l'élément doit être répété en haut de chaque page
- **Utilisé pour** : En-têtes de tableau
- **Exemple** :
```jsx
<thead data-pdf-table-header data-repeat-on-page data-no-break>
  <tr>
    <th>Désignation</th>
    <th>Qté</th>
    <th>Prix unit. HT</th>
    <th>TVA</th>
    <th>Montant HT</th>
  </tr>
</thead>
```

#### `data-pdf-items-body`
- **Usage** : Identifie le corps du tableau contenant les articles
- **Exemple** :
```jsx
<tbody data-pdf-items-body>
```

#### `data-pdf-item`
- **Usage** : Identifie chaque ligne d'article
- **Combiné avec** :
  - `data-item-index={index}` - Numéro de la ligne
  - `data-item-type="product"` - Type d'article
  - `data-no-break="true"` - Ne pas couper la ligne
- **Exemple** :
```jsx
<tr 
  data-pdf-item 
  data-item-index={0} 
  data-item-type="product" 
  data-no-break="true"
>
```

---

## 🎨 Logique de pagination

### **Règles de découpage**

1. **Sections critiques** (`data-critical`)
   - Ne JAMAIS couper
   - Déplacer entièrement sur la page suivante si nécessaire

2. **Lignes de tableau** (`data-pdf-item`)
   - Ne jamais couper une ligne
   - Répéter l'en-tête sur chaque nouvelle page

3. **Totaux** (`data-pdf-section="totals"`)
   - Toujours sur la dernière page
   - Ne jamais couper

4. **Footer** (`data-pdf-section="footer"`)
   - **Uniquement sur la dernière page** (marqué `data-repeat-on-page`)
   - Capturé séparément avec sa couleur de fond
   - Toujours en bas de la dernière page (position fixe)
   - Ne jamais couper (marqué `data-no-break`)
   - Pleine largeur (conserve son padding interne)
   - Contient : détails bancaires, notes de footer, footer dynamique
   
   **Technique de génération :**
   - Chaque section est capturée séparément en haute résolution
   - Les sections sont assemblées page par page avec espacements respectés
   - Le footer est ajouté uniquement en bas de la dernière page du PDF
   - La couleur de fond du footer est préservée lors de la capture
   
   **Espacements appliqués :**
   - Entre sections principales : 2mm
   - Entre items du tableau : 0.5mm
   - Marges de page : 10mm haut/bas
   - Marges horizontales : 13mm gauche/droite (sauf footer)

5. **Notes conditionnelles**
   - Si < 200 caractères → `data-no-break`
   - Si > 200 caractères → Peut être coupé

---

## 📝 Exemple d'utilisation dans le générateur PDF

```javascript
// Pseudo-code pour le générateur PDF

function paginateDocument(documentElement) {
  const A4_HEIGHT = 297; // mm
  let currentPage = [];
  let currentHeight = 0;
  
  // Parcourir tous les éléments
  const elements = documentElement.querySelectorAll('[data-pdf-section], [data-pdf-item]');
  
  elements.forEach(element => {
    const elementHeight = getElementHeight(element);
    const isNoBreak = element.hasAttribute('data-no-break');
    const isCritical = element.hasAttribute('data-critical');
    const isRepeatOnPage = element.hasAttribute('data-repeat-on-page');
    
    // Si l'élément ne peut pas être coupé
    if (isNoBreak || isCritical) {
      // Si l'élément ne rentre pas sur la page actuelle
      if (currentHeight + elementHeight > A4_HEIGHT) {
        // Créer une nouvelle page
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
        
        // Répéter les en-têtes si nécessaire
        if (lastTableHeader) {
          currentPage.push(lastTableHeader);
          currentHeight += getElementHeight(lastTableHeader);
        }
      }
    }
    
    // Ajouter l'élément à la page
    currentPage.push(element);
    currentHeight += elementHeight;
    
    // Mémoriser les en-têtes de tableau
    if (isRepeatOnPage) {
      lastTableHeader = element;
    }
  });
  
  return pages;
}
```

---

## 🔍 Vérification des marqueurs

Pour vérifier que tous les marqueurs sont bien présents :

```javascript
// Dans la console du navigateur
const doc = document.querySelector('[data-pdf-root]');

console.log('✅ Sections trouvées:');
console.log('  - Header:', doc.querySelector('[data-pdf-section="header"]') ? '✅' : '❌');
console.log('  - Info:', doc.querySelector('[data-pdf-section="info"]') ? '✅' : '❌');
console.log('  - Items:', doc.querySelector('[data-pdf-section="items"]') ? '✅' : '❌');
console.log('  - Totals:', doc.querySelector('[data-pdf-section="totals"]') ? '✅' : '❌');

console.log('\n✅ Éléments critiques:');
const criticals = doc.querySelectorAll('[data-critical]');
console.log(`  - ${criticals.length} éléments critiques trouvés`);

console.log('\n✅ Lignes de tableau:');
const items = doc.querySelectorAll('[data-pdf-item]');
console.log(`  - ${items.length} lignes d'articles trouvées`);

console.log('\n✅ En-têtes répétables:');
const repeatables = doc.querySelectorAll('[data-repeat-on-page]');
console.log(`  - ${repeatables.length} en-têtes répétables trouvés`);
```

---

## 🎯 Avantages de cette approche

1. **Pagination intelligente** : Le générateur sait exactement où couper
2. **Préservation du design** : Les sections critiques restent intactes
3. **Répétition automatique** : Les en-têtes de tableau se répètent
4. **Flexibilité** : Conditions dynamiques selon le contenu
5. **Maintenance facile** : Marqueurs sémantiques et documentés
6. **Performance** : Ciblage précis des éléments

---

## 📚 Sections marquées

| Section | Marqueur | Peut être coupée ? | Notes |
|---------|----------|-------------------|-------|
| **Header** | `data-pdf-section="header"` | ❌ Non | Critique |
| **Info entreprise/client** | `data-pdf-section="info"` | ❌ Non | Critique |
| **Tableau - En-tête** | `data-pdf-table-header` | ❌ Non | Répété sur chaque page |
| **Tableau - Ligne** | `data-pdf-item` | ❌ Non | Chaque ligne est indivisible |
| **Totaux** | `data-pdf-section="totals"` | ❌ Non | Critique, garder avec footer |
| **Notes footer** | `data-pdf-section="footer-notes"` | ⚠️ Conditionnel | Si < 200 caractères |

---

**Date** : 19 novembre 2025  
**Version** : 1.0.0  
**Fichier source** : `UniversalPreviewPDF.jsx`  
**Statut** : ✅ Implémenté et documenté
