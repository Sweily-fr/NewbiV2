# Signatures Mail - Structure du projet

## 📁 Structure des dossiers

```
signatures-mail/
├── page.jsx                          # Page liste des signatures
├── new/
│   └── page.jsx                      # Page création/édition
│
├── components/
│   ├── table/                        # 📊 Composants du tableau
│   │   ├── signature-table.jsx       # Tableau principal avec colonnes
│   │   └── signature-row-actions.jsx # Actions par ligne (éditer, dupliquer, supprimer)
│   │
│   ├── preview/                      # 👁️ Composants de prévisualisation
│   │   ├── signature-preview-modal.jsx  # Modal de preview
│   │   ├── signature-preview.css        # Styles de preview
│   │   ├── HorizontalSignature.jsx      # Layout horizontal
│   │   └── TabSignature.jsx             # Onglets d'édition (ancien)
│   │
│   ├── signature-parts/              # 🧩 Parties modulaires de la signature
│   │   ├── CompanyLogo.jsx           # Logo entreprise
│   │   ├── ContactInfo.jsx           # Informations de contact
│   │   ├── HorizontalSeparator.jsx   # Séparateur horizontal
│   │   ├── PersonalInfo.jsx          # Nom, poste, entreprise
│   │   ├── ProfileImage.jsx          # Photo de profil
│   │   ├── SocialNetworks.jsx        # Réseaux sociaux
│   │   └── VerticalSeparator.jsx     # Séparateur vertical
│   │
│   ├── editor/                       # ✏️ Composants d'édition
│   │   ├── layout/                   # Onglet Layout
│   │   │   ├── LayoutTab.jsx         # Wrapper de l'onglet
│   │   │   ├── LayoutContent.jsx     # Contenu de l'onglet
│   │   │   └── sections/             # Sections de configuration
│   │   │       ├── ColumnWidthSection.jsx
│   │   │       ├── CompanyLogoSection.jsx
│   │   │       ├── DisplayModeSection.jsx
│   │   │       ├── ProfileImageSection.jsx
│   │   │       ├── SocialNetworksSection.jsx
│   │   │       ├── SpacingSection.jsx
│   │   │       └── StructureSection.jsx
│   │   │
│   │   └── typography/               # Onglet Typographie
│   │       ├── TypographyTab.jsx     # Wrapper de l'onglet
│   │       ├── TypographyContent.jsx # Contenu de l'onglet
│   │       └── sections/
│   │           └── TypographySection.jsx
│   │
│   └── modals/                       # 🔔 Modals
│       └── CancelConfirmationModal.jsx
│
├── hooks/                            # 🎣 Hooks personnalisés
│   ├── use-signature-table.js        # Gestion du tableau (queries, mutations)
│   ├── useCustomSocialIcons.js       # Gestion des icônes sociales
│   ├── useImageUpload.js             # Upload d'images vers Cloudflare
│   └── useSignatureGenerator.js      # Génération HTML des signatures
│
└── utils/                            # 🛠️ Utilitaires
    ├── cloudflareUrls.js             # URLs Cloudflare
    ├── imageOptimizer.js             # Optimisation d'images
    ├── spacing-helper.js             # Calcul des espacements
    └── standalone-signature-generator.js  # Générateur HTML standalone
```

## 🎯 Organisation par fonctionnalité

### 📊 Table (Liste des signatures)
- **Localisation** : `components/table/`
- **Fichiers** : `signature-table.jsx`, `signature-row-actions.jsx`
- **Responsabilité** : Affichage, tri, filtrage, actions sur les signatures

### 👁️ Preview (Prévisualisation)
- **Localisation** : `components/preview/`
- **Fichiers** : `signature-preview-modal.jsx`, `HorizontalSignature.jsx`, etc.
- **Responsabilité** : Affichage de la signature en mode lecture seule

### 🧩 Signature Parts (Composants modulaires)
- **Localisation** : `components/signature-parts/`
- **Fichiers** : `ProfileImage.jsx`, `PersonalInfo.jsx`, `ContactInfo.jsx`, etc.
- **Responsabilité** : Parties réutilisables de la signature (photo, nom, contact, etc.)

### ✏️ Editor (Édition)
- **Localisation** : `components/editor/`
- **Structure** : Divisé en `layout/` et `typography/`
- **Responsabilité** : Panneaux de configuration pour personnaliser la signature

### 🎣 Hooks
- **Localisation** : `hooks/`
- **Responsabilité** : Logique métier réutilisable (GraphQL, upload, génération HTML)

### 🛠️ Utils
- **Localisation** : `utils/`
- **Responsabilité** : Fonctions utilitaires pures (calculs, transformations)

## 🔄 Flux de données

### Création/Édition d'une signature
1. **Page** : `new/page.jsx`
2. **Preview** : `components/preview/HorizontalSignature.jsx`
3. **Édition** : `components/editor/layout/` ou `components/editor/typography/`
4. **Hooks** : `useSignatureData`, `useSignatureGenerator`, `useImageUpload`
5. **Sauvegarde** : Mutation GraphQL via `use-signature-table.js`

### Affichage de la liste
1. **Page** : `page.jsx`
2. **Tableau** : `components/table/signature-table.jsx`
3. **Actions** : `components/table/signature-row-actions.jsx`
4. **Preview** : `components/preview/signature-preview-modal.jsx`

## 📝 Conventions de nommage

- **Composants React** : PascalCase (ex: `ProfileImage.jsx`)
- **Hooks** : camelCase avec préfixe `use` (ex: `useImageUpload.js`)
- **Utils** : kebab-case (ex: `spacing-helper.js`)
- **Dossiers** : kebab-case (ex: `signature-parts/`)

## 🚀 Améliorations apportées

✅ **Séparation claire des responsabilités**
- Table, Preview, Editor, Parts séparés

✅ **Meilleure navigation**
- Structure hiérarchique logique
- Facile de trouver un composant

✅ **Réutilisabilité**
- Composants modulaires dans `signature-parts/`
- Hooks partagés

✅ **Maintenabilité**
- Code organisé par fonctionnalité
- Imports plus clairs

✅ **Scalabilité**
- Facile d'ajouter de nouvelles sections
- Structure extensible
