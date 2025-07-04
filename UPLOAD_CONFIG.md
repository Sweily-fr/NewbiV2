# Configuration de l'Upload d'Images

## Variables d'environnement

Pour activer l'upload d'images vers Cloudinary, ajoutez ces variables à votre fichier `.env.local` :

```env
# Configuration Cloudinary pour l'upload d'images
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=votre_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=votre_upload_preset
```

## Configuration Cloudinary

1. **Créer un compte Cloudinary** : https://cloudinary.com/
2. **Obtenir votre Cloud Name** : Disponible dans votre dashboard Cloudinary
3. **Créer un Upload Preset** :
   - Allez dans Settings > Upload
   - Cliquez sur "Add upload preset"
   - Configurez les paramètres :
     - Upload preset name : `profile-avatars` (ou autre nom de votre choix)
     - Signing Mode : `Unsigned`
     - Folder : `profile-avatars` (optionnel, pour organiser vos images)
     - Transformation : Vous pouvez ajouter des transformations automatiques (redimensionnement, etc.)

## Mode de développement

Si les variables d'environnement Cloudinary ne sont pas configurées, le système utilisera automatiquement un mode de simulation qui :
- Convertit les images en base64 pour la prévisualisation
- Simule un processus d'upload avec barre de progression
- Permet de tester l'interface sans service externe

## Fonctionnalités

### Upload d'images
- ✅ Validation des types de fichiers (JPG, PNG, WebP, GIF)
- ✅ Validation de la taille (max 5MB)
- ✅ Redimensionnement automatique (400x400px par défaut)
- ✅ Barre de progression
- ✅ Prévisualisation en temps réel
- ✅ Gestion d'erreurs avec notifications

### Interface utilisateur
- ✅ Avatar avec bouton d'upload
- ✅ Boutons "Changer" et "Supprimer"
- ✅ Indicateurs de chargement
- ✅ Messages de statut

### Intégration
- ✅ Hook personnalisé `useProfileImageUpload`
- ✅ Composant réutilisable `ProfileImageUpload`
- ✅ Service d'upload modulaire
- ✅ Intégration avec le formulaire de profil

## Utilisation

Le système d'upload est maintenant intégré dans le formulaire de profil. Les utilisateurs peuvent :

1. Cliquer sur l'avatar ou le bouton "Ajouter une photo"
2. Sélectionner une image depuis leur appareil
3. Voir la prévisualisation immédiatement
4. L'image est automatiquement redimensionnée et uploadée
5. Cliquer sur "Mettre à jour le profil" pour sauvegarder

## Architecture

```
src/
├── lib/upload/
│   └── image-upload.js          # Service d'upload principal
├── hooks/
│   └── useProfileImageUpload.js # Hook pour la gestion d'état
└── components/profile/
    └── ProfileImageUpload.jsx   # Composant UI
```

## Personnalisation

Vous pouvez personnaliser :
- Les tailles d'avatar (`sm`, `md`, `lg`, `xl`)
- Les dimensions de redimensionnement
- Les types de fichiers acceptés
- La taille maximum des fichiers
- Le service d'upload (Cloudinary, AWS S3, etc.)
