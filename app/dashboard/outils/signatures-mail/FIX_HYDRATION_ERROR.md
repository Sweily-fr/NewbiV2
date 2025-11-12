# 🔧 Fix - Erreur d'Hydration (td imbriqués)

## ❌ Problème Détecté

```
Error: In HTML, <td> cannot be a child of <td>.
This will cause a hydration error.
```

### Cause
Le composant `ProfileImage.jsx` retournait toujours un `<td>`, mais dans `VerticalSignature.jsx`, il était déjà appelé à l'intérieur d'un `<td>`, créant des `<td>` imbriqués (invalide en HTML).

```javascript
// ❌ AVANT - Structure invalide
<td>  <!-- td parent dans VerticalSignature -->
  <ProfileImage />  <!-- retourne un <td> -->
    <td>  <!-- td enfant - INVALIDE ! -->
      <img ... />
    </td>
</td>
```

---

## ✅ Solution Appliquée

### 1. Modification de ProfileImage.jsx
Ajout d'une prop `wrapInTd` pour contrôler le wrapper :

```javascript
const ProfileImage = ({
  photoSrc,
  size = 80,
  shape = "round",
  onImageChange,
  isEditable = true,
  spacing = 0,
  wrapInTd = true, // ✅ Nouvelle prop
}) => {
  const content = /* ... contenu de l'image ... */;

  // Si wrapInTd est false, retourner juste le contenu
  if (!wrapInTd) {
    return content;
  }

  // Sinon, wrapper dans un <td>
  return (
    <td style={{ ... }}>
      {content}
    </td>
  );
};
```

### 2. Mise à jour de VerticalSignature.jsx
Utilisation de `wrapInTd={false}` :

```javascript
{/* ✅ APRÈS - Structure valide */}
<tr>
  <td style={{ paddingBottom: `${spacings.photoBottom || 12}px` }}>
    <ProfileImage
      photoSrc={signatureData.photo}
      size={signatureData.imageSize || 80}
      shape={signatureData.imageShape || "round"}
      onImageChange={(imageUrl) => handleImageChange("photo", imageUrl)}
      isEditable={true}
      spacing={0}
      wrapInTd={false}  {/* ✅ Pas de wrapper <td> */}
    />
  </td>
</tr>
```

### 3. HorizontalSignature.jsx (pas de changement)
Dans HorizontalSignature, ProfileImage est directement dans un `<tr>`, donc il a besoin du wrapper `<td>` (comportement par défaut) :

```javascript
{/* ✅ Structure valide */}
<tr>
  <ProfileImage
    photoSrc={signatureData.photo}
    size={signatureData.imageSize || 80}
    shape={signatureData.imageShape || "round"}
    onImageChange={(imageUrl) => handleImageChange("photo", imageUrl)}
    isEditable={true}
    spacing={spacings.photoBottom || 0}
    {/* wrapInTd={true} par défaut - OK */}
  />
</tr>
```

---

## 📊 Résultat

### Avant le Fix
```
❌ Erreur d'hydration
❌ Structure HTML invalide
❌ <td> imbriqués dans VerticalSignature
```

### Après le Fix
```
✅ Pas d'erreur d'hydration
✅ Structure HTML valide
✅ Composant flexible (avec ou sans wrapper <td>)
```

---

## 🎯 Avantages de la Solution

### Flexibilité
Le composant `ProfileImage` peut maintenant être utilisé dans deux contextes :
1. **Directement dans un `<tr>`** → `wrapInTd={true}` (défaut)
2. **Déjà dans un `<td>`** → `wrapInTd={false}`

### Réutilisabilité
Le même composant fonctionne pour :
- HorizontalSignature (wrapper nécessaire)
- VerticalSignature (wrapper non nécessaire)
- Futurs layouts (flexible)

### Maintenabilité
- Code centralisé dans ProfileImage.jsx
- Pas de duplication
- Facile à adapter selon le contexte

---

## 🧪 Tests à Effectuer

### Vérifier que l'erreur est corrigée
1. ✅ Ouvrir la console du navigateur
2. ✅ Aller sur `/dashboard/outils/signatures-mail/new`
3. ✅ Vérifier qu'il n'y a plus d'erreur "td cannot be a child of td"
4. ✅ Tester le layout vertical
5. ✅ Tester le layout horizontal
6. ✅ Vérifier que l'image s'affiche correctement dans les deux cas

### Tester l'édition d'image
- [ ] Cliquer sur l'image de profil (layout horizontal)
- [ ] Cliquer sur l'image de profil (layout vertical)
- [ ] Upload d'une nouvelle image
- [ ] Vérifier que l'image s'affiche correctement

---

## 📝 Fichiers Modifiés

1. ✅ `components/signature-parts/ProfileImage.jsx`
   - Ajout de la prop `wrapInTd`
   - Logique conditionnelle pour le wrapper

2. ✅ `components/VerticalSignature.jsx`
   - Ajout de `wrapInTd={false}` à ProfileImage

3. ✅ `components/HorizontalSignature.jsx`
   - Pas de modification (comportement par défaut OK)

---

## 🎉 Conclusion

L'erreur d'hydration a été corrigée en rendant le composant `ProfileImage` plus flexible. Il peut maintenant s'adapter à différents contextes d'utilisation sans créer de structure HTML invalide.

**Status :** ✅ CORRIGÉ  
**Impact :** Aucun changement visuel, juste une correction technique  
**Compatibilité :** 100% avec l'existant
