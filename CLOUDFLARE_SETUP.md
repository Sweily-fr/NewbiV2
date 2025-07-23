# Configuration Cloudflare R2 pour les Images de Signature

## 🎯 Objectif
Stocker les images de profil et logos d'entreprise des signatures email sur Cloudflare R2 au lieu du stockage local.

## 📋 Prérequis

### 1. Compte Cloudflare
- Créer un compte sur [Cloudflare](https://cloudflare.com)
- Accéder au dashboard Cloudflare

### 2. Configuration R2
1. **Activer R2** dans votre dashboard Cloudflare
2. **Créer un bucket** nommé `newbi-signatures` (ou personnalisé)
3. **Générer des clés API R2** :
   - Aller dans "R2 Object Storage" > "Manage R2 API tokens"
   - Créer un token avec permissions "Object Read & Write"
   - Noter l'Access Key ID et Secret Access Key

### 3. Domaine personnalisé (optionnel mais recommandé)
1. **Configurer un domaine custom** pour votre bucket R2
2. **Exemple** : `images.newbi.com` → pointant vers votre bucket
3. **Avantages** : URLs plus propres et contrôle total

## ⚙️ Configuration Backend

### Variables d'environnement
Ajouter dans votre fichier `.env` :

```bash
# Configuration Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key_here
CLOUDFLARE_R2_BUCKET_NAME=newbi-signatures
CLOUDFLARE_R2_PUBLIC_URL=https://images.newbi.com  # Optionnel
```

### Installation des dépendances
```bash
cd newbi-api
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## 🚀 Fonctionnalités Disponibles

### 1. Upload d'images
```javascript
// Côté frontend - automatique via ImageDropZone
const handleImageChange = async (field, file) => {
  // Upload automatique vers Cloudflare R2
  // Stockage de l'URL publique et de la clé
};
```

### 2. API GraphQL

#### Mutations
```graphql
# Upload d'image
mutation UploadSignatureImage($file: Upload!, $imageType: String!) {
  uploadSignatureImage(file: $file, imageType: $imageType) {
    success
    key
    url
    contentType
    message
  }
}

# Suppression d'image
mutation DeleteSignatureImage($key: String!) {
  deleteSignatureImage(key: $key) {
    success
    message
  }
}
```

#### Queries
```graphql
# Récupération d'URL
query GetImageUrl($key: String!) {
  getImageUrl(key: $key) {
    success
    url
    message
  }
}
```

## 📁 Structure de Stockage

Les images sont organisées par utilisateur et type :
```
signatures/
├── {userId}/
│   ├── profile/
│   │   └── {uuid}.jpg
│   └── company/
│       └── {uuid}.png
```

## 🔒 Sécurité

- **Validation côté client et serveur** (format, taille max 5MB)
- **Isolation par utilisateur** : chaque utilisateur ne peut accéder qu'à ses images
- **Clés uniques** : UUID pour éviter les conflits
- **URLs signées** disponibles pour l'accès temporaire

## 🎨 Avantages

### Avant (stockage local)
- ❌ Images converties en base64 (lourdes)
- ❌ Problèmes d'affichage dans les clients email
- ❌ Stockage local limité
- ❌ URLs blob non persistantes

### Après (Cloudflare R2)
- ✅ URLs publiques directes
- ✅ Compatible tous clients email
- ✅ Stockage illimité et rapide
- ✅ CDN mondial intégré
- ✅ Coûts optimisés

## 🧪 Test de l'intégration

1. **Démarrer l'API** avec les nouvelles variables d'environnement
2. **Aller sur la page de signature** `/dashboard/outils/signatures-mail/new`
3. **Uploader une image** de profil ou logo
4. **Vérifier dans les logs** que l'upload vers Cloudflare fonctionne
5. **Copier la signature** et tester dans un client email

## 🐛 Dépannage

### Erreurs courantes
- **"Access denied"** → Vérifier les clés API et permissions R2
- **"Bucket not found"** → Vérifier le nom du bucket
- **"Invalid file format"** → Seuls JPG, PNG, GIF, WebP sont supportés
- **"File too large"** → Limite de 5MB par image

### Logs utiles
```javascript
// Côté frontend
console.log('🖼️ UPLOAD IMAGE TO CLOUDFLARE:', file);

// Côté backend
console.log('Erreur upload Cloudflare:', error);
```

## 📞 Support

En cas de problème :
1. Vérifier les logs côté frontend et backend
2. Tester les clés API Cloudflare
3. Vérifier la configuration du bucket R2
4. Consulter la documentation Cloudflare R2
