# 🔧 Dépannage Factur-X

## ❌ Problème : "PDF téléchargé sans Factur-X"

Ce message apparaît quand les données de la facture sont **incomplètes** pour générer un XML Factur-X valide.

---

## 🔍 Diagnostic

### Étape 1 : Ouvrir la Console du Navigateur

1. **Chrome/Edge** : `F12` ou `Cmd+Option+I` (Mac)
2. **Firefox** : `F12` ou `Cmd+Option+K` (Mac)
3. Aller dans l'onglet **Console**

### Étape 2 : Télécharger une Facture

Cliquez sur "Télécharger (Factur-X)" et observez les logs :

```
🔍 Validation Factur-X - Données reçues: {
  number: "FAC-001",
  issueDate: "2025-10-14",
  companyName: "Ma Société",
  companyTVA: undefined,  ← ⚠️ MANQUANT
  clientName: "Client Test",
  itemsCount: 2
}

⚠️ Validation Factur-X échouée: [
  "Numéro de TVA manquant"
]
```

### Étape 3 : Identifier les Données Manquantes

Le toast affiche aussi les erreurs :
```
⚠️ PDF téléchargé sans Factur-X
Données manquantes: Numéro de TVA manquant
```

---

## ✅ Solutions par Donnée Manquante

### 1. "Numéro de TVA manquant"

**Cause :** Le numéro de TVA intracommunautaire n'est pas renseigné dans les paramètres de l'entreprise.

**Solution :**
1. Aller dans **Paramètres** → **Informations légales**
2. Remplir le champ **"Numéro de TVA intracommunautaire"**
   - Format France : `FR12345678901`
   - 2 lettres + 11 chiffres
3. Sauvegarder
4. Retélécharger la facture

**Vérification :**
```javascript
// Dans la console
console.log(invoiceData.companyInfo?.tva);
// Doit afficher : "FR12345678901"
```

---

### 2. "Nom de l'entreprise manquant"

**Cause :** Le nom de l'entreprise n'est pas renseigné.

**Solution :**
1. Aller dans **Paramètres** → **Informations générales**
2. Remplir le champ **"Nom de l'entreprise"**
3. Sauvegarder

---

### 3. "Nom du client manquant"

**Cause :** Le client n'a pas de nom renseigné.

**Solution :**
1. Éditer la facture
2. Sélectionner un client avec un nom
3. Ou créer/modifier le client pour ajouter un nom
4. Sauvegarder la facture

---

### 4. "Numéro de facture manquant"

**Cause :** La facture est en brouillon ou n'a pas de numéro.

**Solution :**
1. **Créer la facture** (passer du statut DRAFT à PENDING)
2. Un numéro sera automatiquement attribué
3. Le bouton Factur-X apparaîtra

**Note :** Les brouillons ne peuvent pas générer de Factur-X.

---

### 5. "Date d'émission manquante"

**Cause :** La date d'émission n'est pas définie.

**Solution :**
1. Éditer la facture
2. Définir une date d'émission
3. Sauvegarder

---

### 6. "Aucun article dans la facture"

**Cause :** La facture n'a pas d'articles/lignes.

**Solution :**
1. Éditer la facture
2. Ajouter au moins un article avec :
   - Description
   - Quantité
   - Prix unitaire
3. Sauvegarder

---

## 🔧 Données Optionnelles (Non Bloquantes)

Ces données améliorent le XML mais ne sont **pas obligatoires** :

### SIRET
- **Champ :** `companyInfo.siret` et `client.siret`
- **Impact :** Recommandé pour la conformité française
- **Solution :** Remplir dans Paramètres → Informations légales

### IBAN/BIC
- **Champ :** `bankDetails.iban` et `bankDetails.bic`
- **Impact :** Facilite le paiement automatique
- **Solution :** Remplir dans Paramètres → Coordonnées bancaires

### Date d'échéance
- **Champ :** `dueDate`
- **Impact :** Conditions de paiement
- **Solution :** Définir lors de la création de la facture

---

## 📊 Checklist Complète

Avant de télécharger une facture Factur-X, vérifiez :

### Informations Entreprise (Paramètres)
- [ ] Nom de l'entreprise
- [ ] Adresse complète (rue, ville, code postal, pays)
- [ ] Numéro de TVA intracommunautaire (obligatoire)
- [ ] SIRET (recommandé)
- [ ] IBAN/BIC (optionnel)

### Informations Facture
- [ ] Numéro de facture (généré automatiquement)
- [ ] Date d'émission
- [ ] Client sélectionné avec nom
- [ ] Au moins un article

### Informations Client
- [ ] Nom du client
- [ ] Adresse complète
- [ ] SIRET (si entreprise française)
- [ ] Numéro de TVA (si assujetti)

---

## 🧪 Test de Validation

Pour tester si vos données sont complètes, ouvrez la console et collez :

```javascript
// Remplacer par votre objet invoice
const testData = {
  number: "FAC-001",
  issueDate: new Date(),
  companyInfo: {
    name: "Ma Société",
    tva: "FR12345678901",
    siret: "12345678901234",
    address: {
      street: "1 rue Test",
      city: "Paris",
      postalCode: "75001",
      country: "FR"
    }
  },
  client: {
    name: "Client Test",
    address: {
      street: "2 rue Client",
      city: "Lyon",
      postalCode: "69001",
      country: "FR"
    }
  },
  items: [
    { description: "Service", quantity: 1, unitPrice: 100, vatRate: 20 }
  ],
  finalTotalHT: 100,
  totalVAT: 20,
  finalTotalTTC: 120
};

// Importer et tester
import('@/src/utils/facturx-generator').then(module => {
  const result = module.validateFacturXData(testData);
  console.log('Validation:', result);
});
```

**Résultat attendu :**
```javascript
✅ Validation Factur-X réussie
{
  isValid: true,
  errors: []
}
```

---

## 🚨 Erreurs Fréquentes

### 1. TVA au format incorrect

**Erreur :** `companyTVA: "12345678901"` (sans préfixe pays)

**Solution :** Ajouter le préfixe pays : `"FR12345678901"`

### 2. Client sans nom

**Erreur :** Client créé avec seulement email/téléphone

**Solution :** Ajouter un nom au client

### 3. Facture en brouillon

**Erreur :** Tentative de télécharger un brouillon

**Solution :** Créer la facture d'abord (bouton "Créer la facture")

### 4. Articles vides

**Erreur :** Facture avec 0 article

**Solution :** Ajouter au moins un article avec description et prix

---

## 🔄 Workflow Recommandé

### Pour Éviter les Erreurs

1. **Configuration initiale (une fois)**
   ```
   Paramètres → Informations générales
   ✓ Nom entreprise
   ✓ Adresse complète
   
   Paramètres → Informations légales
   ✓ Numéro de TVA (obligatoire)
   ✓ SIRET (recommandé)
   
   Paramètres → Coordonnées bancaires
   ✓ IBAN/BIC (optionnel)
   ```

2. **Création de clients**
   ```
   Clients → Nouveau client
   ✓ Nom obligatoire
   ✓ Adresse complète
   ✓ SIRET si entreprise
   ```

3. **Création de factures**
   ```
   Factures → Nouvelle facture
   ✓ Sélectionner un client
   ✓ Ajouter des articles
   ✓ Définir date d'émission
   ✓ Créer la facture (génère le numéro)
   ```

4. **Téléchargement**
   ```
   ✓ Vérifier le statut (pas DRAFT)
   ✓ Cliquer "Télécharger (Factur-X)"
   ✓ Vérifier le toast de succès
   ```

---

## 📞 Support

### Si le problème persiste

1. **Copier les logs console**
   - Ouvrir la console (F12)
   - Télécharger une facture
   - Copier tous les logs commençant par 🔍 ou ⚠️

2. **Vérifier la structure des données**
   ```javascript
   // Dans la console
   console.log('Invoice data:', invoice);
   ```

3. **Tester la validation manuellement**
   ```javascript
   import('@/src/utils/facturx-generator').then(module => {
     const result = module.validateFacturXData(invoice);
     console.log('Validation result:', result);
   });
   ```

4. **Contacter le support avec :**
   - Logs console
   - Message d'erreur exact
   - Capture d'écran du toast

---

## ✅ Vérification Finale

Une fois toutes les données renseignées, vous devriez voir :

```
🔍 Validation Factur-X - Données reçues: {
  number: "FAC-001",
  issueDate: "2025-10-14T...",
  companyName: "Ma Société",
  companyTVA: "FR12345678901",
  clientName: "Client Test",
  itemsCount: 2
}

✅ Validation Factur-X réussie

🔧 Intégration Factur-X conforme...
📤 Envoi au serveur pour conversion PDF/A-3...
✅ PDF Factur-X conforme téléchargé avec succès

Toast: ✅ PDF Factur-X 100% conforme téléchargé
       PDF/A-3 + XML EN16931 + Métadonnées XMP
```

---

## 🎓 Formation Utilisateurs

### Message à afficher aux utilisateurs

```
⚠️ Pour générer des factures Factur-X, vous devez :

1. Renseigner votre numéro de TVA intracommunautaire
   → Paramètres → Informations légales

2. Vérifier que vos clients ont un nom
   → Clients → Modifier le client

3. Créer la facture (pas de brouillon)
   → Bouton "Créer la facture"

Une fois ces informations renseignées, vos factures 
seront automatiquement conformes Factur-X ! 🎉
```

---

**Date de création :** 14 octobre 2025  
**Version :** 1.0  
**Status :** Guide de dépannage complet
