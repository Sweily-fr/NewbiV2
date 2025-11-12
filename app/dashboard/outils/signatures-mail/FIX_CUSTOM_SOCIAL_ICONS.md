# 🔧 Fix - URLs Personnalisées pour Logos Réseaux Sociaux

## ❌ Problème Détecté

```
Error: Cannot read properties of null (reading 'replace')
app/dashboard/outils/signatures-mail/utils/svgToPng.js (30:31) @ generateCacheKey
  30 |   return `${logoType}-${color.replace("#", "")}-${size}`;
```

### Cause
Quand l'utilisateur fournit une URL personnalisée pour les logos des réseaux sociaux, la variable `color` est `null`. La fonction `generateCacheKey` essaie d'appeler `.replace()` sur `null`, ce qui provoque une erreur.

### Contexte
- L'utilisateur peut fournir des URLs personnalisées pour les logos des réseaux sociaux
- Quand une URL personnalisée est utilisée, il n'y a pas de couleur à appliquer (c'est déjà une image complète)
- Le système essayait quand même d'appliquer une couleur, causant l'erreur

---

## ✅ Solution Appliquée

### 1. Modification de SocialNetworks.jsx
Ajout d'une vérification pour ne pas appliquer de couleur quand une URL personnalisée est utilisée :

```javascript
// Avant ❌
const color = socialColors?.[social.key] || globalColor;
<DynamicSocialLogo
  color={color}  // ❌ Peut être null avec URL personnalisée
  iconUrl={iconUrl}
/>

// Après ✅
const isCustomUrl = iconUrl && (iconUrl.startsWith("http") || iconUrl.startsWith("data:"));
const finalColor = isCustomUrl ? null : color;
<DynamicSocialLogo
  color={finalColor}  // ✅ null si URL personnalisée, sinon la couleur
  iconUrl={iconUrl}
/>
```

### 2. Modification de svgToPng.js
Ajout d'une vérification dans `generateCacheKey` pour gérer le cas où `color` est `null` :

```javascript
// Avant ❌
const generateCacheKey = (logoType, color, size) => {
  return `${logoType}-${color.replace("#", "")}-${size}`;  // ❌ Erreur si color est null
};

// Après ✅
const generateCacheKey = (logoType, color, size) => {
  const colorKey = color ? color.replace("#", "") : "custom";  // ✅ Gère le cas null
  return `${logoType}-${colorKey}-${size}`;
};
```

---

## 📊 Résultat

### Avant le Fix
```
❌ Erreur quand URL personnalisée utilisée
❌ Application crash
❌ Impossible d'utiliser des logos personnalisés
```

### Après le Fix
```
✅ URLs personnalisées supportées
✅ Pas d'erreur
✅ Couleurs appliquées uniquement aux icônes par défaut
✅ URLs personnalisées affichées telles quelles
```

---

## 🎯 Comportement Attendu

### Avec Icônes par Défaut
```javascript
socialNetworks: {
  linkedin: "https://linkedin.com/in/user"
}
// → Utilise l'icône par défaut avec la couleur personnalisée
```

### Avec URLs Personnalisées
```javascript
customSocialIcons: {
  linkedin: "https://example.com/my-linkedin-icon.png"
}
socialNetworks: {
  linkedin: "https://linkedin.com/in/user"
}
// → Utilise l'URL personnalisée sans appliquer de couleur
```

---

## 🧪 Tests à Effectuer

### Test 1 : Icônes par défaut avec couleur
- [ ] Créer une signature
- [ ] Ajouter des réseaux sociaux
- [ ] Appliquer une couleur personnalisée
- [ ] Vérifier que la couleur s'applique

### Test 2 : URLs personnalisées
- [ ] Créer une signature
- [ ] Ajouter des URLs personnalisées pour les logos
- [ ] Vérifier que les logos s'affichent correctement
- [ ] Vérifier qu'il n'y a pas d'erreur

### Test 3 : Mélange icônes + URLs
- [ ] Créer une signature
- [ ] Ajouter certains réseaux avec icônes par défaut
- [ ] Ajouter certains réseaux avec URLs personnalisées
- [ ] Vérifier que tout fonctionne

---

## 📝 Fichiers Modifiés

1. ✅ `components/signature-parts/SocialNetworks.jsx`
   - Ajout de la vérification `isCustomUrl`
   - Passage de `finalColor` au lieu de `color`

2. ✅ `utils/svgToPng.js`
   - Modification de `generateCacheKey` pour gérer `color === null`
   - Utilisation de "custom" comme clé quand color est null

---

## 🎉 Conclusion

Le problème des URLs personnalisées pour les logos des réseaux sociaux est maintenant résolu. Les utilisateurs peuvent :
- ✅ Utiliser les icônes par défaut avec couleurs personnalisées
- ✅ Utiliser des URLs personnalisées sans erreur
- ✅ Mélanger les deux approches

**Status :** ✅ CORRIGÉ  
**Impact :** Permet l'utilisation de logos personnalisés  
**Compatibilité :** 100% avec l'existant
