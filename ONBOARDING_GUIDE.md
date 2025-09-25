# Guide d'Onboarding Newbi

## 🎯 Vue d'ensemble

Le système d'onboarding de Newbi guide les nouveaux utilisateurs à travers 6 étapes essentielles pour découvrir la plateforme. L'onboarding est lié à l'**organisation** et ne s'affiche que pour les **owners** d'organisations qui n'ont pas encore complété le processus.

## 📋 Étapes de l'onboarding

1. **Bienvenue sur Newbi** - Introduction à la plateforme
2. **Paramètres entreprise** - Configuration des informations d'entreprise
3. **Catalogue** - Création du catalogue de produits/services
4. **Produits** - Gestion des produits et services
5. **Communauté** - Présentation de la communauté Newbi
6. **Les outils** - Découverte des outils disponibles

## 🏗️ Architecture technique

### Composants créés

- **`OnboardingModal`** (`/src/components/onboarding-modal.jsx`)
  - Modal avec 6 étapes personnalisées
  - Design moderne avec icônes et couleurs thématiques
  - Progression visuelle avec dots
  - Boutons "Passer" et "Suivant/Commencer"

- **`useOnboarding`** (`/src/hooks/useOnboarding.js`)
  - Hook pour gérer l'état de l'onboarding
  - Détection automatique si l'onboarding doit être affiché
  - Fonctions pour compléter ou passer l'onboarding

- **`OnboardingTestButton`** (`/src/components/onboarding-test-button.jsx`)
  - Bouton de test (dev uniquement)
  - Permet de déclencher manuellement l'onboarding

### Champs ajoutés à l'organization

```javascript
// Dans auth-plugins.js
hasCompletedOnboarding: {
  type: "boolean",
  input: true,
  required: false,
},
onboardingStep: {
  type: "number",
  input: true,
  required: false,
}
```

## 🚀 Logique d'affichage

L'onboarding s'affiche automatiquement si :
- L'utilisateur est **owner** de l'organisation (`session.user.role === 'owner'`)
- L'organisation n'a **pas complété** l'onboarding (`organization.hasCompletedOnboarding === false`)

## 🧪 Tests et développement

### Bouton de test (développement)
Un bouton "🧪 Test Onboarding" apparaît en bas à droite en mode développement pour tester facilement le modal.

### Script de réinitialisation
```bash
# Réinitialiser toutes les organisations
node scripts/reset-onboarding.js

# Réinitialiser une organisation spécifique
node scripts/reset-onboarding.js [organizationId]
```

## 📱 Expérience utilisateur

### Première connexion (Owner)
1. L'utilisateur se connecte pour la première fois
2. Le modal d'onboarding s'ouvre automatiquement
3. L'utilisateur peut naviguer à travers les 6 étapes
4. À la fin, `hasCompletedOnboarding` est mis à `true`
5. L'onboarding ne s'affiche plus

### Membres invités
- Les membres invités ne voient pas l'onboarding
- L'organisation est déjà configurée par l'owner

### Actions possibles
- **Suivant** : Passer à l'étape suivante
- **Passer** : Terminer immédiatement l'onboarding
- **Commencer** : Bouton final pour terminer l'onboarding

## 🎨 Design

- **Responsive** : Adapté mobile et desktop
- **Icônes thématiques** : Chaque étape a sa propre icône et couleur
- **Progression visuelle** : Dots de progression avec états (actuel, complété, à venir)
- **Animations** : Transitions fluides et effets hover
- **Accessibilité** : Boutons et navigation clavier

## 🔧 Configuration

### Variables d'environnement
Aucune variable spécifique requise. Utilise la configuration MongoDB existante.

### Dépendances
- `lucide-react` : Icônes
- `sonner` : Notifications toast
- `shadcn/ui` : Composants UI (Dialog, Button)

## 📝 Personnalisation

Pour modifier les étapes de l'onboarding, éditer le tableau `onboardingSteps` dans `OnboardingModal.jsx` :

```javascript
const onboardingSteps = [
  {
    id: 1,
    title: "Titre de l'étape",
    description: "Description détaillée...",
    icon: IconComponent,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  // ...
]
```

## 🚨 Points d'attention

1. **Hydratation** : Le hook attend que la session soit chargée avant d'afficher l'onboarding
2. **Permissions** : Seuls les owners voient l'onboarding
3. **Une seule fois** : L'onboarding ne s'affiche qu'une fois par organisation
4. **Rechargement** : Après completion, la page se recharge pour mettre à jour la session

## 🎉 Prêt pour production

Le système d'onboarding est entièrement fonctionnel et prêt pour la production. Il s'intègre parfaitement avec l'architecture existante de Newbi et respecte les bonnes pratiques UX.
