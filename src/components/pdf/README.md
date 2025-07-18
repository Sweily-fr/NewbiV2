# UniversalPDFGenerator

Composant React universel pour générer des PDF de factures et devis.

## Fonctionnalités

- ✅ Support des factures et devis
- ✅ Génération PDF avec html2canvas et jsPDF
- ✅ Styles inline pour éviter les erreurs oklch
- ✅ Pagination automatique format A4
- ✅ Nommage automatique des fichiers
- ✅ Gestion des erreurs et feedback utilisateur
- ✅ Rendu hors écran pour capture optimisée

## Installation

```bash
npm install html2canvas jspdf
```

## Utilisation

### Bouton PDF simple

```jsx
import UniversalPDFGenerator from '@/components/pdf/UniversalPDFGenerator';

<UniversalPDFGenerator
  data={invoiceData}
  type="invoice"
  filename="ma-facture.pdf"
/>
```

### Wrapper personnalisé

```jsx
<UniversalPDFGenerator
  data={quoteData}
  type="quote"
  filename="mon-devis.pdf"
>
  <Button variant="outline" size="sm">
    <Download className="w-4 h-4 mr-2" />
    Télécharger PDF
  </Button>
</UniversalPDFGenerator>
```

### Icône dans un menu

```jsx
<UniversalPDFGenerator
  data={invoiceData}
  type="invoice"
>
  <DropdownMenuItem>
    <Download className="w-4 h-4 mr-2" />
    Télécharger PDF
  </DropdownMenuItem>
</UniversalPDFGenerator>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | Object | - | Données de la facture/devis (requis) |
| `type` | String | 'invoice' | Type de document ('invoice' ou 'quote') |
| `filename` | String | Auto | Nom du fichier PDF généré |
| `children` | ReactNode | - | Contenu personnalisé (bouton, icône, etc.) |
| `className` | String | '' | Classes CSS additionnelles |
| `variant` | String | 'outline' | Variante du bouton par défaut |
| `size` | String | 'sm' | Taille du bouton par défaut |
| `disabled` | Boolean | false | Désactiver le composant |

## Structure des données

```javascript
const documentData = {
  number: 'F-202501-001',
  date: '2025-01-17',
  dueDate: '2025-02-17', // Pour les factures
  validUntil: '2025-02-17', // Pour les devis
  purchaseOrder: 'BC-123',
  customerReference: 'REF-CLIENT-001',
  paymentMethod: 'Virement bancaire', // Pour les factures
  paymentTerms: 'Paiement à 30 jours',
  penaltyRate: 3, // Taux de pénalité en %
  recoveryIndemnity: 40, // Indemnité forfaitaire en €
  
  companyInfo: {
    name: 'Mon Entreprise',
    address: '123 Rue Example', // ou objet {street, city, postalCode, country}
    city: 'Paris',
    postalCode: '75001',
    email: 'contact@entreprise.com',
    phone: '01 23 45 67 89',
    fax: '01 23 45 67 90',
    website: 'www.monentreprise.com',
    siret: '12345678901234',
    siren: '123456789',
    vatNumber: 'FR12345678901',
    rcs: 'RCS Paris B 123 456 789',
    codeAPE: '6201Z',
    capital: 10000, // Capital social en €
    logo: 'data:image/png;base64,...'
  },
  
  clientInfo: {
    name: 'Client ABC',
    address: '456 Avenue Client', // ou objet {street, city, postalCode, country}
    city: 'Lyon',
    postalCode: '69001',
    country: 'France',
    email: 'client@example.com',
    phone: '04 12 34 56 78',
    siret: '98765432101234', // Pour les clients professionnels
    vatNumber: 'FR98765432101' // Pour les clients avec TVA
  },
  
  items: [
    {
      description: 'Prestation de service',
      details: 'Détails supplémentaires',
      quantity: 2,
      unit: 'heures',
      unitPrice: 100,
      vatRate: 20
    }
  ],
  
  subtotal: 200,
  discount: 20,
  totalTax: 36,
  total: 216,
  
  headerNotes: 'Notes d\'en-tête',
  footerNotes: 'Conditions générales',
  
  showBankDetails: true,
  bankDetails: {
    iban: 'FR76 1234 5678 9012 3456 7890 123',
    bic: 'ABCDEFGH',
    bankName: 'Ma Banque'
  }
};
```

## Intégration dans les sidebars existantes

### Invoice Sidebar

```jsx
// Remplacer le bouton PDF existant par :
import UniversalPDFGenerator from '@/components/pdf/UniversalPDFGenerator';

<UniversalPDFGenerator
  data={invoice}
  type="invoice"
  disabled={invoice.status === 'DRAFT'}
>
  <Button 
    variant="outline" 
    size="sm"
    disabled={invoice.status === 'DRAFT'}
  >
    <Download className="w-4 h-4 mr-2" />
    PDF
  </Button>
</UniversalPDFGenerator>
```

### Quote Sidebar

```jsx
// Remplacer le bouton PDF existant par :
import UniversalPDFGenerator from '@/components/pdf/UniversalPDFGenerator';

<UniversalPDFGenerator
  data={quote}
  type="quote"
  disabled={quote.status === 'DRAFT'}
>
  <Button 
    variant="outline" 
    size="sm"
    disabled={quote.status === 'DRAFT'}
  >
    <Download className="w-4 h-4 mr-2" />
    PDF
  </Button>
</UniversalPDFGenerator>
```

## Avantages

1. **Code unifié** : Un seul composant pour factures et devis
2. **Résolution oklch** : Styles inline compatibles html2canvas
3. **UX cohérente** : Même comportement partout
4. **Performance** : Imports dynamiques et rendu optimisé
5. **Maintenabilité** : Architecture propre et réutilisable
