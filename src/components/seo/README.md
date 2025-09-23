# Système SEO Newbi

Ce dossier contient le système SEO complet et réutilisable pour améliorer le référencement du site vitrine Newbi.

## 📁 Structure des fichiers

```
src/
├── components/seo/
│   ├── seo-head.jsx          # Composant SEO principal avec Head
│   ├── seo-metadata.jsx      # Composants pour Next.js 13+ App Router
│   └── README.md            # Cette documentation
├── hooks/
│   └── use-seo.js           # Hooks personnalisés pour le SEO
└── utils/
    └── seo-data.js          # Configuration SEO centralisée
```

## 🚀 Utilisation

### 1. Composant SEOHead (Recommandé)

Pour les pages utilisant le système classique :

```jsx
import SEOHead from "@/src/components/seo/seo-head";
import { JsonLd } from "@/src/components/seo/seo-metadata";
import { useSEO } from "@/src/hooks/use-seo";

export default function MaPage() {
  const seoData = useSEO("home"); // Clé de la page dans seo-data.js

  return (
    <>
      <SEOHead {...seoData} />
      <JsonLd jsonLd={seoData.jsonLd} />
      <div>
        {/* Contenu de la page */}
      </div>
    </>
  );
}
```

### 2. Hooks spécialisés

#### Pour les pages produits :
```jsx
import { useProductSEO } from "@/src/hooks/use-seo";

const seoData = useProductSEO("Factures"); // Nom du produit
```

#### Pour les pages d'authentification :
```jsx
import { useAuthSEO } from "@/src/hooks/use-seo";

const seoData = useAuthSEO("login"); // "login" ou "signup"
```

#### Pour les pages légales :
```jsx
import { useLegalSEO } from "@/src/hooks/use-seo";

const seoData = useLegalSEO("mentions-legales"); // ou "politique-de-confidentialite"
```

### 3. SEO personnalisé

```jsx
import { useSEO } from "@/src/hooks/use-seo";

const customSEO = {
  title: "Mon titre personnalisé",
  description: "Ma description personnalisée",
  keywords: "mot-clé1, mot-clé2, mot-clé3"
};

const breadcrumbs = [
  { name: "Accueil", url: "https://newbi.fr" },
  { name: "Ma page", url: "https://newbi.fr/ma-page" }
];

const seoData = useSEO("pageKey", customSEO, breadcrumbs);
```

## 📋 Fonctionnalités

### ✅ Métadonnées de base
- Title et description optimisés
- Mots-clés ciblés
- URL canonique automatique
- Langue et géolocalisation

### ✅ Réseaux sociaux
- **Open Graph** (Facebook, LinkedIn)
- **Twitter Cards**
- Images optimisées (1200x630px)
- Métadonnées personnalisables

### ✅ Référencement structuré
- **JSON-LD** pour Schema.org
- Breadcrumbs automatiques
- Données d'organisation
- Applications logicielles

### ✅ Optimisations techniques
- Favicons et icônes
- Preconnect pour les performances
- Meta tags mobiles
- Instructions pour les robots

## 🎯 Pages intégrées

Le SEO a été intégré sur toutes les pages demandées :

- ✅ **Accueil** (`/`)
- ✅ **Produits/Factures** (`/produits/factures`)
- ✅ **Produits/Devis** (`/produits/devis`)
- ✅ **Produits/Signatures** (`/produits/signatures`)
- ✅ **Produits/Kanban** (`/produits/kanban`)
- ✅ **Produits/Transfers** (`/produits/transfers`)
- ✅ **Connexion** (`/auth/login`)
- ✅ **Inscription** (`/auth/signup`)
- ✅ **Mentions légales** (`/mentions-legales`)
- ✅ **Politique de confidentialité** (`/politique-de-confidentialite`)

## ⚙️ Configuration

### Variables d'environnement requises

```env
NEXT_PUBLIC_APP_URL=https://newbi.fr
```

### Images SEO à ajouter

Placez ces images dans le dossier `/public/` :

```
public/
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png
├── og-image.jpg           # Image par défaut (1200x630px)
├── og-home.jpg           # Image page d'accueil
├── og-factures.jpg       # Image page factures
├── og-devis.jpg          # Image page devis
├── og-signatures.jpg     # Image page signatures
├── og-kanban.jpg         # Image page kanban
└── og-transfers.jpg      # Image page transfers
```

## 🔧 Personnalisation

### Ajouter une nouvelle page

1. **Ajouter les données SEO** dans `/src/utils/seo-data.js` :

```javascript
export const seoData = {
  // ... pages existantes
  maNouvellePage: {
    title: "Titre de ma nouvelle page - Newbi",
    description: "Description de ma nouvelle page...",
    keywords: "mots, clés, pertinents",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      // ... autres données structurées
    }
  }
};
```

2. **Utiliser dans la page** :

```jsx
const seoData = useSEO("maNouvellePage");
```

### Modifier les données par défaut

Éditez `/src/utils/seo-data.js` :

```javascript
export const defaultSEO = {
  siteName: "Newbi - Solution de gestion pour entrepreneurs",
  author: "Newbi",
  language: "fr-FR",
  twitterHandle: "@newbi_fr",
  defaultImage: `${baseUrl}/og-image.jpg`,
};
```

## 📊 Validation SEO

### Outils recommandés

1. **Google Search Console** - Suivi des performances
2. **Google Rich Results Test** - Test des données structurées
3. **Facebook Sharing Debugger** - Test Open Graph
4. **Twitter Card Validator** - Test Twitter Cards
5. **Lighthouse** - Audit SEO complet

### Points de contrôle

- [ ] Tous les titres sont uniques et < 60 caractères
- [ ] Toutes les descriptions sont uniques et < 160 caractères
- [ ] Toutes les images OG sont optimisées (1200x630px)
- [ ] Les données JSON-LD sont valides
- [ ] Les URLs canoniques sont correctes
- [ ] Les breadcrumbs fonctionnent

## 🚨 Bonnes pratiques

### À faire ✅
- Utiliser des titres descriptifs et uniques
- Inclure des mots-clés pertinents naturellement
- Optimiser les images (format, taille, alt)
- Tester sur tous les appareils
- Valider les données structurées

### À éviter ❌
- Dupliquer les titres/descriptions
- Bourrer de mots-clés (keyword stuffing)
- Utiliser des images trop lourdes
- Oublier les URLs canoniques
- Négliger les données mobiles

## 🔄 Maintenance

### Mise à jour régulière
- Vérifier les performances dans Search Console
- Mettre à jour les mots-clés selon les tendances
- Optimiser les images selon les retours
- Tester les nouvelles fonctionnalités SEO

### Monitoring
- Suivre le positionnement des mots-clés
- Analyser le taux de clic (CTR)
- Surveiller les erreurs de crawl
- Vérifier les rich snippets

---

**Développé pour Newbi** - Système SEO complet et évolutif 🚀
