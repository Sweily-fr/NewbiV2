# Implémentation Factur-X dans Newbi

## 📋 Vue d'ensemble

Factur-X est le standard français/européen de facturation électronique conforme à la norme **EN 16931**. Il combine :
- Un **PDF lisible** (pour les humains)
- Un **fichier XML structuré** (pour les machines)
- Des **métadonnées PDF/A-3** (pour l'archivage)

## 🎯 Objectif

Rendre les factures Newbi conformes à la réglementation européenne de facturation électronique obligatoire à partir de 2024-2026.

## 🏗️ Architecture Implémentée

### 1. Générateur XML Factur-X
**Fichier:** `/src/utils/facturx-generator.js`

**Fonctions principales:**
- `generateFacturXXML(invoiceData)` - Génère le XML conforme EN 16931
- `embedFacturXInPDF(pdfBytes, invoiceData)` - Embarque le XML dans le PDF
- `validateFacturXData(invoiceData)` - Valide les données requises

**Profil implémenté:** BASIC (le plus simple, suffisant pour la plupart des cas)

### 2. Composant de téléchargement amélioré
**Fichier:** `/src/components/pdf/UniversalPDFDownloaderWithFacturX.jsx`

**Workflow:**
```
1. Génération PDF visuel (screenshot + jsPDF)
   ↓
2. Validation des données Factur-X
   ↓
3. Génération du XML depuis les données de facture
   ↓
4. Embarquement du XML dans le PDF via pdf-lib
   ↓
5. Ajout des métadonnées PDF/A-3
   ↓
6. Téléchargement du PDF enrichi
```

## 📦 Dépendances Requises

```bash
npm install pdf-lib
```

**Dépendances déjà présentes:**
- `jspdf` - Génération PDF
- `modern-screenshot` - Capture DOM

## 🚀 Utilisation

### Option 1 : Remplacer le composant existant

```jsx
// Dans vos pages de factures
import UniversalPDFDownloaderWithFacturX from '@/src/components/pdf/UniversalPDFDownloaderWithFacturX';

<UniversalPDFDownloaderWithFacturX
  data={invoiceData}
  type="invoice"
  enableFacturX={true} // Active Factur-X
/>
```

### Option 2 : Utilisation conditionnelle

```jsx
// Activer Factur-X uniquement pour les factures finalisées
<UniversalPDFDownloaderWithFacturX
  data={invoiceData}
  type="invoice"
  enableFacturX={invoiceData.status === 'COMPLETED'}
/>
```

### Option 3 : Désactiver Factur-X

```jsx
// Pour les devis et avoirs (pas concernés par Factur-X)
<UniversalPDFDownloaderWithFacturX
  data={quoteData}
  type="quote"
  enableFacturX={false}
/>
```

## ✅ Données Requises pour Factur-X

### Obligatoires
- ✅ Numéro de facture (`number`)
- ✅ Date d'émission (`issueDate`)
- ✅ Nom de l'entreprise (`companyInfo.name`)
- ✅ Numéro de TVA (`companyInfo.tva`)
- ✅ Nom du client (`client.name`)
- ✅ Au moins un article (`items[]`)

### Recommandées
- Date d'échéance (`dueDate`)
- Adresse complète entreprise et client
- SIRET (`companyInfo.siret`)
- Détails des articles

## 🔍 Validation et Fallback

Le système intègre une **validation automatique** :

```javascript
const validation = validateFacturXData(invoiceData);

if (validation.isValid) {
  // Génération Factur-X
} else {
  // Fallback : PDF standard
  console.warn('Données manquantes:', validation.errors);
}
```

**Comportement en cas d'erreur:**
1. Tentative de génération Factur-X
2. Si échec → Téléchargement du PDF standard
3. Toast informatif pour l'utilisateur

## 📊 Structure du XML Généré

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice>
  <rsm:ExchangedDocumentContext>
    <!-- Profil BASIC -->
  </rsm:ExchangedDocumentContext>
  
  <rsm:ExchangedDocument>
    <!-- Numéro, date, type -->
  </rsm:ExchangedDocument>
  
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <!-- Vendeur et acheteur -->
    </ram:ApplicableHeaderTradeAgreement>
    
    <ram:ApplicableHeaderTradeSettlement>
      <!-- Totaux, TVA, paiement -->
    </ram:ApplicableHeaderTradeSettlement>
    
    <ram:IncludedSupplyChainTradeLineItem>
      <!-- Articles de la facture -->
    </ram:IncludedSupplyChainTradeLineItem>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
```

## 🎨 Interface Utilisateur

### Icône et Label
- **Factures avec Factur-X:** Icône `FileCheck` + "Télécharger (Factur-X)"
- **Autres documents:** Icône `Download` + "Télécharger le PDF"

### Notifications Toast
- ✅ **Succès:** "PDF Factur-X téléchargé avec succès"
- ⚠️ **Avertissement:** "PDF téléchargé sans Factur-X" (si données incomplètes)
- ❌ **Erreur:** "Erreur lors de la génération"

## 🧪 Tests et Validation

### Vérifier le XML embarqué

1. **Ouvrir le PDF avec Adobe Acrobat Reader**
   - Aller dans "Fichier" → "Propriétés" → "Description"
   - Vérifier la présence de "factur-x.xml" dans les pièces jointes

2. **Extraire le XML**
   ```bash
   # Avec pdftk
   pdftk facture.pdf unpack_files output extracted/
   
   # Le fichier factur-x.xml sera dans extracted/
   ```

3. **Valider le XML**
   - Utiliser un validateur EN 16931 en ligne
   - Exemple: https://portal3.gefeg.com/validation

### Tests unitaires recommandés

```javascript
import { generateFacturXXML, validateFacturXData } from '@/src/utils/facturx-generator';

test('Génération XML valide', () => {
  const invoiceData = {
    number: 'FAC-001',
    issueDate: new Date(),
    companyInfo: { name: 'Test', tva: 'FR12345678901' },
    client: { name: 'Client Test' },
    items: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
    finalTotalHT: 100,
    totalVAT: 20,
    finalTotalTTC: 120
  };
  
  const xml = generateFacturXXML(invoiceData);
  expect(xml).toContain('CrossIndustryInvoice');
  expect(xml).toContain('FAC-001');
});
```

## 🚨 Limitations Actuelles

### ⚠️ Approche Hybride
- Le PDF visuel est une **image** (screenshot)
- Le XML contient les **données structurées**
- **Pas de PDF/A-3 complet** (texte extractible)

### 📝 Profil BASIC
- Profil le plus simple de Factur-X
- Suffisant pour la conformité légale
- Moins de détails que les profils COMFORT ou EXTENDED

### 🔄 Améliorations Futures

1. **Migration vers @react-pdf/renderer**
   - PDF textuel au lieu d'image
   - Meilleure accessibilité
   - Taille de fichier réduite

2. **Support des profils avancés**
   - COMFORT : Plus de détails
   - EXTENDED : Informations complètes

3. **Validation XML stricte**
   - Intégration d'un validateur EN 16931
   - Vérification avant génération

## 🔗 Ressources

- [Norme EN 16931](https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/Obtaining+a+copy+of+the+European+standard+on+eInvoicing)
- [Factur-X Specification](https://fnfe-mpe.org/factur-x/)
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [ZUGFeRD (équivalent allemand)](https://www.ferd-net.de/standards/zugferd-2.2.1/index.html)

## 📞 Support

Pour toute question sur l'implémentation Factur-X :
1. Vérifier les logs console (préfixe 🔧)
2. Consulter les messages toast
3. Valider les données avec `validateFacturXData()`

## ✨ Avantages pour Newbi

- ✅ **Conformité légale** : Prêt pour la facturation électronique obligatoire
- ✅ **Interopérabilité** : Compatible avec tous les systèmes européens
- ✅ **Automatisation** : Les clients peuvent importer automatiquement les factures
- ✅ **Archivage** : Format PDF/A-3 pour conservation légale
- ✅ **Différenciation** : Fonctionnalité premium par rapport aux concurrents
