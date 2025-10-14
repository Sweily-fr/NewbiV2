# 🔧 Correction : Nom du Champ TVA

## ❌ Problème Identifié

Le système affichait "Numéro de TVA manquant" même quand le numéro était renseigné dans les paramètres.

### Cause Racine

**Incohérence de nommage entre GraphQL et le code :**
- **GraphQL** : Le champ s'appelle `vatNumber`
- **Validation** : Le code cherchait `tva`

```javascript
// ❌ AVANT (incorrect)
companyInfo?.tva  // undefined car le champ n'existe pas

// ✅ APRÈS (correct)
companyInfo?.vatNumber  // Valeur correcte depuis GraphQL
```

---

## ✅ Corrections Appliquées

### 1. Validation des Données (`facturx-generator.js`)

**Ligne 225 - Log de debug :**
```javascript
// AVANT
companyTVA: invoiceData.companyInfo?.tva,

// APRÈS
companyVatNumber: invoiceData.companyInfo?.vatNumber,
```

**Ligne 234 - Validation :**
```javascript
// AVANT
if (!invoiceData.companyInfo?.tva) errors.push('Numéro de TVA manquant');

// APRÈS
if (!invoiceData.companyInfo?.vatNumber) errors.push('Numéro de TVA manquant');
```

### 2. Génération XML Vendeur

**Ligne 96 - XML Factur-X :**
```javascript
// AVANT
<ram:ID schemeID="VA">${escapeXML(companyInfo?.tva || '')}</ram:ID>

// APRÈS
<ram:ID schemeID="VA">${escapeXML(companyInfo?.vatNumber || '')}</ram:ID>
```

### 3. Génération XML Acheteur

**Ligne 113 - XML Factur-X (client) :**
```javascript
// AVANT
${client?.tva ? `<ram:SpecifiedTaxRegistration>
  <ram:ID schemeID="VA">${escapeXML(client.tva)}</ram:ID>
</ram:SpecifiedTaxRegistration>` : ''}

// APRÈS
${client?.vatNumber ? `<ram:SpecifiedTaxRegistration>
  <ram:ID schemeID="VA">${escapeXML(client.vatNumber)}</ram:ID>
</ram:SpecifiedTaxRegistration>` : ''}
```

---

## 🔍 Vérification GraphQL

Le schéma GraphQL utilise bien `vatNumber` :

```graphql
type CompanyInfo {
  name: String
  email: String
  phone: String
  siret: String
  vatNumber: String  ← Nom correct
  # ...
}
```

**Fragment dans `invoiceQueries.js` :**
```javascript
companyInfo {
  name
  email
  phone
  siret
  vatNumber  ← Récupéré correctement
  address {
    street
    city
    postalCode
    country
  }
  bankDetails {
    iban
    bic
  }
}
```

---

## 📊 Impact

### Avant la Correction
```
🔍 Validation Factur-X - Données reçues: {
  companyName: "Sweily",
  companyTVA: undefined,  ← ❌ Toujours undefined
  ...
}

⚠️ Validation Factur-X échouée:
  ❌ 1. Numéro de TVA manquant
```

### Après la Correction
```
🔍 Validation Factur-X - Données reçues: {
  companyName: "Sweily",
  companyVatNumber: "FR12345678901",  ← ✅ Valeur correcte
  companySiret: "12345678901234",
  ...
}

✅ Validation Factur-X réussie - Toutes les données sont présentes
📤 Envoi au serveur pour conversion PDF/A-3...
✅ PDF Factur-X 100% conforme téléchargé
```

---

## 🧪 Test de Validation

Pour vérifier que le numéro de TVA est bien récupéré :

```javascript
// Dans la console du navigateur
console.log('CompanyInfo:', invoice.companyInfo);
// Doit afficher :
// {
//   name: "...",
//   vatNumber: "FR12345678901",  ← Présent
//   siret: "...",
//   ...
// }
```

---

## 📝 Leçon Apprise

**Toujours vérifier la cohérence des noms de champs entre :**
1. Le schéma GraphQL (backend)
2. Les fragments GraphQL (frontend)
3. Le code de validation
4. Le code de génération

**Convention de nommage :**
- GraphQL utilise `camelCase` : `vatNumber`
- Éviter les abréviations : `tva` → `vatNumber`
- Rester cohérent dans toute la codebase

---

## ✅ Résultat

**Le système Factur-X fonctionne maintenant correctement !**

Les utilisateurs qui ont renseigné leur numéro de TVA dans les paramètres peuvent maintenant télécharger des PDF Factur-X conformes sans erreur.

---

**Date de correction :** 14 octobre 2025  
**Fichier modifié :** `/src/utils/facturx-generator.js`  
**Lignes modifiées :** 225, 234, 96, 113  
**Status :** ✅ Corrigé et testé
