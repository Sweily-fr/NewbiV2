# Guide d'Utilisation Factur-X

## 🎯 Résumé Rapide

**OUI**, vous pouvez utiliser `UniversalPDFDownloaderWithFacturX.jsx` pour :
- ✅ **Factures** (recommandé et conforme)
- ✅ **Avoirs** (optionnel, si activé explicitement)
- ❌ **Devis** (pas concernés par Factur-X)

---

## 📝 Utilisation par Type de Document

### 1️⃣ FACTURES (Recommandé - Factur-X activé par défaut)

```jsx
import UniversalPDFDownloaderWithFacturX from '@/src/components/pdf/UniversalPDFDownloaderWithFacturX';

// Dans votre page de facture
<UniversalPDFDownloaderWithFacturX
  data={invoiceData}
  type="invoice"
  enableFacturX={true} // Par défaut
  filename={`facture_${invoiceData.number}.pdf`}
>
  Télécharger la facture
</UniversalPDFDownloaderWithFacturX>
```

**Résultat :** PDF avec XML Factur-X embarqué ✅

---

### 2️⃣ AVOIRS (Factur-X optionnel)

#### Option A : Avec Factur-X (recommandé pour conformité)

```jsx
<UniversalPDFDownloaderWithFacturX
  data={creditNoteData}
  type="creditNote"
  enableFacturX={true} // Activer explicitement
  filename={`avoir_${creditNoteData.number}.pdf`}
>
  Télécharger l'avoir
</UniversalPDFDownloaderWithFacturX>
```

**Résultat :** PDF avec XML Factur-X (TypeCode 381 = Avoir) ✅

#### Option B : Sans Factur-X (PDF standard)

```jsx
<UniversalPDFDownloaderWithFacturX
  data={creditNoteData}
  type="creditNote"
  enableFacturX={false} // Désactiver
  filename={`avoir_${creditNoteData.number}.pdf`}
>
  Télécharger l'avoir
</UniversalPDFDownloaderWithFacturX>
```

**Résultat :** PDF standard sans XML ⚪

---

### 3️⃣ DEVIS (Pas de Factur-X)

```jsx
<UniversalPDFDownloaderWithFacturX
  data={quoteData}
  type="quote"
  enableFacturX={false} // Toujours false pour les devis
  filename={`devis_${quoteData.number}.pdf`}
>
  Télécharger le devis
</UniversalPDFDownloaderWithFacturX>
```

**Résultat :** PDF standard (les devis ne sont pas concernés par Factur-X) ⚪

---

## 🔍 Différences XML : Facture vs Avoir

### Facture (TypeCode 380)
```xml
<rsm:ExchangedDocument>
  <ram:ID>FAC-001</ram:ID>
  <ram:TypeCode>380</ram:TypeCode> <!-- Facture -->
  ...
</rsm:ExchangedDocument>
```

### Avoir (TypeCode 381)
```xml
<rsm:ExchangedDocument>
  <ram:ID>AV-001</ram:ID>
  <ram:TypeCode>381</ram:TypeCode> <!-- Avoir -->
  ...
</rsm:ExchangedDocument>
```

---

## ⚙️ Configuration Avancée

### Activation conditionnelle selon le statut

```jsx
// Activer Factur-X uniquement pour les factures finalisées
<UniversalPDFDownloaderWithFacturX
  data={invoiceData}
  type="invoice"
  enableFacturX={invoiceData.status === 'COMPLETED'}
/>
```

### Personnalisation du bouton

```jsx
<UniversalPDFDownloaderWithFacturX
  data={invoiceData}
  type="invoice"
  variant="default"
  size="lg"
  className="w-full"
>
  📄 Télécharger Facture Électronique
</UniversalPDFDownloaderWithFacturX>
```

---

## 🎨 Interface Utilisateur

### Icônes automatiques

| Type | Factur-X | Icône | Label |
|------|----------|-------|-------|
| Facture | ✅ Activé | `FileCheck` | "Télécharger (Factur-X)" |
| Facture | ❌ Désactivé | `Download` | "Télécharger le PDF" |
| Avoir | ✅ Activé | `FileCheck` | "Télécharger (Factur-X)" |
| Avoir | ❌ Désactivé | `Download` | "Télécharger le PDF" |
| Devis | ❌ N/A | `Download` | "Télécharger le PDF" |

### Notifications Toast

**Succès Factur-X :**
```
✅ PDF Factur-X téléchargé avec succès
Votre facture est conforme à la norme européenne EN 16931
```

**Avertissement (données incomplètes) :**
```
⚠️ PDF téléchargé sans Factur-X
Données manquantes: Numéro de TVA, Nom du client
```

**Erreur technique :**
```
❌ Erreur lors de la génération
[Message d'erreur détaillé]
```

---

## ✅ Checklist de Validation

Avant d'utiliser Factur-X, assurez-vous que vos données contiennent :

- [ ] Numéro de document (`number`)
- [ ] Date d'émission (`issueDate`)
- [ ] Nom de l'entreprise (`companyInfo.name`)
- [ ] Numéro de TVA (`companyInfo.tva`)
- [ ] Nom du client (`client.name`)
- [ ] Au moins un article (`items[]`)

**Si une donnée manque :** Le système génère automatiquement un PDF standard avec un toast d'avertissement.

---

## 🧪 Vérifier le XML Embarqué

### Méthode 1 : Adobe Acrobat Reader
1. Ouvrir le PDF
2. Fichier → Propriétés → Description
3. Vérifier la présence de "factur-x.xml"

### Méthode 2 : Ligne de commande
```bash
# Extraire les pièces jointes
pdftk facture.pdf unpack_files output extracted/

# Le fichier factur-x.xml sera dans extracted/
cat extracted/factur-x.xml
```

### Méthode 3 : Validateur en ligne
- https://portal3.gefeg.com/validation
- https://www.fnfe-mpe.org/factur-x/

---

## 🚨 Gestion des Erreurs

Le système intègre un **fallback automatique** :

```
1. Tentative de génération Factur-X
   ↓
2. Validation des données
   ↓
3. Si OK → PDF Factur-X ✅
   ↓
4. Si KO → PDF standard ⚪ + Toast avertissement
```

**Aucune interruption de service** : L'utilisateur obtient toujours un PDF.

---

## 📊 Tableau Récapitulatif

| Document | Type | enableFacturX | Résultat |
|----------|------|---------------|----------|
| Facture | `invoice` | `true` (défaut) | PDF + XML (TypeCode 380) ✅ |
| Facture | `invoice` | `false` | PDF standard ⚪ |
| Avoir | `creditNote` | `true` | PDF + XML (TypeCode 381) ✅ |
| Avoir | `creditNote` | `false` (défaut) | PDF standard ⚪ |
| Devis | `quote` | `false` (forcé) | PDF standard ⚪ |

---

## 💡 Recommandations

### Pour la Production

1. **Factures :** Toujours activer Factur-X
   ```jsx
   enableFacturX={true}
   ```

2. **Avoirs :** Activer si vous voulez la conformité complète
   ```jsx
   enableFacturX={true}
   ```

3. **Devis :** Garder désactivé (pas concernés)
   ```jsx
   enableFacturX={false}
   ```

### Pour les Tests

```jsx
// Mode test : désactiver Factur-X
const isProduction = process.env.NODE_ENV === 'production';

<UniversalPDFDownloaderWithFacturX
  data={invoiceData}
  type="invoice"
  enableFacturX={isProduction}
/>
```

---

## 🔗 Ressources

- [Documentation complète](./FACTURX_IMPLEMENTATION.md)
- [Norme EN 16931](https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/Obtaining+a+copy+of+the+European+standard+on+eInvoicing)
- [Factur-X Specification](https://fnfe-mpe.org/factur-x/)

---

## ❓ FAQ

**Q : Puis-je utiliser le même composant pour tous les documents ?**  
✅ Oui ! Le composant détecte automatiquement le type et applique Factur-X si activé.

**Q : Que se passe-t-il si les données sont incomplètes ?**  
⚪ Le système génère un PDF standard avec un toast d'avertissement.

**Q : Les avoirs doivent-ils avoir Factur-X ?**  
🤔 Optionnel. Recommandé pour une conformité complète, mais pas obligatoire.

**Q : Comment tester si le XML est valide ?**  
🧪 Utiliser un validateur EN 16931 en ligne ou extraire le XML avec pdftk.

**Q : Quelle est la taille du fichier avec Factur-X ?**  
📊 +5-10 KB environ (le XML fait ~3-8 KB selon le nombre d'articles).
