# Intégration OCR - Documentation

## Vue d'ensemble

L'intégration OCR permet de traiter automatiquement les reçus et documents uploadés pour extraire les données structurées (montant, date, commerçant, description) via l'API Mistral.

## Architecture

### Backend (newbi-api)
- ✅ **Service Cloudflare** (`src/services/cloudflareService.js`) - Upload vers Cloudflare R2
- ✅ **Service Mistral OCR** (`src/services/mistralOcrService.js`) - Traitement OCR
- ✅ **Resolver GraphQL** (`src/resolvers/ocr.js`) - Mutation `processDocumentOcr`
- ✅ **Modèle MongoDB** (`src/models/OcrDocument.js`) - Sauvegarde des résultats
- ✅ **Schéma GraphQL** (`src/schemas/types/ocr.graphql`) - Types GraphQL

### Frontend (newbiv2)
- ✅ **Mutation GraphQL** (`src/graphql/mutations/ocr.js`) - Appel API backend
- ✅ **Hook personnalisé** (`src/hooks/useOcr.js`) - Gestion état OCR
- ✅ **Composant d'affichage** (`src/components/ocr/OcrResultsDisplay.jsx`) - Interface résultats
- ✅ **Intégration drawer** (`app/dashboard/outils/gestion-depenses/components/receipt-upload-drawer.jsx`) - Interface existante modifiée

## Flux de traitement

1. **Upload du fichier** - L'utilisateur upload un fichier via le drawer
2. **Clic "Traiter le reçu"** - Déclenche le processus OCR
3. **Upload Cloudflare** - Le fichier est uploadé vers Cloudflare R2 (URL publique)
4. **Traitement Mistral** - L'URL est envoyée à l'API Mistral OCR
5. **Extraction des données** - Mistral retourne le texte et les données structurées
6. **Sauvegarde BDD** - Les résultats sont sauvegardés en base
7. **Affichage résultats** - Les données s'affichent dans le drawer
8. **Validation** - L'utilisateur peut valider les données extraites

## Utilisation

### Page de gestion des dépenses
```
/dashboard/outils/gestion-depenses
```

1. Cliquer sur le bouton d'ajout de transaction
2. Dans le drawer, uploader un reçu/facture
3. Cliquer sur "Traiter le reçu"
4. Attendre le traitement OCR
5. Vérifier les données extraites
6. Cliquer sur "Valider les données"

## Types de fichiers supportés

- Images: JPG, PNG, GIF, WebP, TIFF, BMP
- Documents: PDF

## Données extraites

- **Montant** - Montant total de la facture/reçu
- **Date** - Date de la transaction
- **Commerçant** - Nom du magasin/entreprise
- **Description** - Description des articles/services
- **Texte complet** - Tout le texte extrait du document
- **Données brutes** - Réponse complète de l'API Mistral

## États du traitement

- **Upload en cours** - Fichier en cours d'upload
- **Prêt pour traitement** - Fichier uploadé, bouton "Traiter le reçu" actif
- **Traitement OCR en cours** - Appel API Mistral en cours
- **Résultats disponibles** - Données extraites affichées
- **Erreur** - Affichage des erreurs éventuelles

## Fonctionnalités

- ✅ Drag & drop de fichiers
- ✅ Validation des types de fichiers
- ✅ Barre de progression d'upload
- ✅ Traitement OCR asynchrone
- ✅ Affichage des résultats structurés
- ✅ Copie des données dans le presse-papier
- ✅ Visualisation des données brutes Mistral
- ✅ Gestion des erreurs
- ✅ Validation des données extraites

## Configuration requise

### Variables d'environnement Backend
```env
# Cloudflare R2
AWS_S3_BUCKET_NAME=your-bucket
AWS_S3_API_URL=https://your-account-id.r2.cloudflarestorage.com
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_R2_PUBLIC_URL=https://your-domain.com

# Mistral API
MISTRAL_API_KEY=your-mistral-api-key
MISTRAL_OCR_ENDPOINT=https://api.mistral.ai/v1/ocr
```

## Prochaines étapes

- [ ] Ajouter des queries GraphQL pour récupérer l'historique des documents OCR
- [ ] Créer une page dédiée à l'historique OCR
- [ ] Ajouter la possibilité d'éditer les données extraites
- [ ] Intégrer avec le système de facturation
- [ ] Ajouter des statistiques de traitement OCR
