# 🔄 Problème de Cache - Factur-X

## ❌ Symptôme

Les erreurs XSD persistent même après les corrections :
```
Element 'PostcodeCode': This element is not expected. Expected is ( 'CountrySubDivisionName' ).
Element 'SpecifiedLegalOrganization': This element is not expected. Expected is ( 'SpecifiedTaxRegistration' ).
```

## 🔍 Cause

Le code JavaScript est **mis en cache** par :
1. **Next.js** (compilation côté serveur)
2. **Le navigateur** (cache JavaScript)

Les modifications du fichier `facturx-generator.js` ne sont pas prises en compte immédiatement.

---

## ✅ Solutions

### Solution 1 : Redémarrer Next.js (Recommandé)

```bash
# 1. Arrêter le serveur Next.js
# Ctrl+C dans le terminal où Next.js tourne

# 2. Redémarrer
npm run dev
# ou
yarn dev

# 3. Attendre le message "Ready in X ms"

# 4. Rafraîchir le navigateur (Cmd+R ou Ctrl+R)
```

---

### Solution 2 : Hard Refresh du Navigateur

Si le serveur Next.js est déjà redémarré :

**Chrome/Edge :**
```
Cmd+Shift+R (Mac)
Ctrl+Shift+R (Windows/Linux)
```

**Firefox :**
```
Cmd+Shift+R (Mac)
Ctrl+F5 (Windows/Linux)
```

**Safari :**
```
Cmd+Option+R (Mac)
```

---

### Solution 3 : Vider le Cache Complet

**Chrome/Edge :**
1. Ouvrir DevTools (`F12`)
2. Clic droit sur le bouton Refresh
3. Sélectionner "Empty Cache and Hard Reload"

**Firefox :**
1. Menu → Préférences → Vie privée et sécurité
2. Cookies et données de sites → Effacer les données
3. Cocher "Contenu web en cache"
4. Cliquer sur "Effacer"

---

### Solution 4 : Supprimer le Dossier .next

Si rien ne fonctionne, supprimer le cache de build Next.js :

```bash
# Dans le dossier NewbiV2
rm -rf .next
npm run dev
```

---

## 🧪 Vérifier que les Modifications sont Prises en Compte

### 1. Vérifier dans la Console du Navigateur

Ouvrir la console (`F12`) et télécharger une facture. Vous devriez voir :

```javascript
🔍 Validation Factur-X - Données reçues: {
  companyVatNumber: "FR70981576541",  // ← Nouveau nom de variable
  ...
}
```

Si vous voyez encore `companyTVA`, le cache n'est pas vidé.

### 2. Vérifier le XML Généré

Extraire le XML et vérifier l'ordre :

```bash
pdftk facture.pdf unpack_files output extracted/
cat extracted/factur-x.xml
```

**Ordre attendu :**
```xml
<ram:PostalTradeAddress>
  <ram:LineOne>...</ram:LineOne>
  <ram:CityName>...</ram:CityName>
  <ram:CountryID>FR</ram:CountryID>
  <ram:PostcodeCode>75001</ram:PostcodeCode>
</ram:PostalTradeAddress>

<ram:SellerTradeParty>
  ...
  <ram:SpecifiedTaxRegistration>...</ram:SpecifiedTaxRegistration>
  <ram:SpecifiedLegalOrganization>...</ram:SpecifiedLegalOrganization>
</ram:SellerTradeParty>
```

---

## 🔧 Procédure Complète de Redémarrage

```bash
# 1. Arrêter Next.js
# Ctrl+C dans le terminal

# 2. Supprimer le cache (optionnel mais recommandé)
cd /Users/joaquimgameiro/Downloads/Newbi_project/Newbi_FB_V2/NewbiV2
rm -rf .next

# 3. Redémarrer
npm run dev

# 4. Attendre "Ready"
# ✓ Ready in 2s

# 5. Dans le navigateur
# - Ouvrir une fenêtre privée (Cmd+Shift+N)
# - Ou faire un Hard Refresh (Cmd+Shift+R)

# 6. Télécharger une nouvelle facture

# 7. Vérifier le XML
pdftk facture.pdf unpack_files output extracted/
cat extracted/factur-x.xml | grep -A5 "SellerTradeParty"
```

---

## 📊 Checklist de Vérification

Après redémarrage, vérifier :

- [ ] Le serveur Next.js a redémarré
- [ ] Le navigateur a été rafraîchi (Hard Refresh)
- [ ] La console affiche `companyVatNumber` (pas `companyTVA`)
- [ ] Le XML a `SpecifiedTaxRegistration` AVANT `SpecifiedLegalOrganization`
- [ ] Le XML a `CountryID` AVANT `PostcodeCode`
- [ ] Le validateur accepte le XML

---

## 🚨 Si le Problème Persiste

### Vérifier que le Fichier est Bien Modifié

```bash
# Vérifier le contenu du fichier
cat /Users/joaquimgameiro/Downloads/Newbi_project/Newbi_FB_V2/NewbiV2/src/utils/facturx-generator.js | grep -A3 "SpecifiedTaxRegistration"
```

**Résultat attendu :**
```javascript
<ram:SpecifiedTaxRegistration>
  <ram:ID schemeID="VA">${escapeXML(companyInfo?.vatNumber || '')}</ram:ID>
</ram:SpecifiedTaxRegistration>
${companyInfo?.siret ? `<ram:SpecifiedLegalOrganization>
```

Si vous voyez `SpecifiedLegalOrganization` AVANT `SpecifiedTaxRegistration`, le fichier n'a pas été sauvegardé.

### Vérifier les Logs Next.js

Dans le terminal où Next.js tourne, vous devriez voir :

```
○ Compiling /api/generate-facturx/route ...
✓ Compiled in 500ms
```

Si vous ne voyez pas de recompilation, Next.js n'a pas détecté les changements.

---

## ✅ Solution Définitive

**Pour éviter ce problème à l'avenir :**

1. **Toujours redémarrer Next.js** après modification de fichiers utilitaires
2. **Utiliser le mode navigation privée** pour les tests
3. **Vider le cache** régulièrement pendant le développement

---

**Date :** 14 octobre 2025  
**Problème :** Cache JavaScript non vidé  
**Solution :** Redémarrage Next.js + Hard Refresh navigateur
