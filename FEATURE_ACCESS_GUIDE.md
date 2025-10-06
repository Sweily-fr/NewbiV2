# Guide d'utilisation du système de contrôle d'accès aux fonctionnalités

## 📋 Vue d'ensemble

Le système de contrôle d'accès a été amélioré pour offrir une meilleure expérience utilisateur et éviter les redirections intempestives.

## 🔧 Composants principaux

### 1. **ProRouteGuard** (Amélioré)

Composant de protection des routes avec gestion intelligente du timing.

**Améliorations :**
- ✅ Délai de 300ms pour la synchronisation des données
- ✅ Skeleton pendant la vérification
- ✅ Prévention des redirections multiples
- ✅ Support des abonnements payants uniquement
- ✅ Logs détaillés pour le débogage

**Utilisation :**

```jsx
import { ProRouteGuard } from "@/src/components/pro-route-guard";

export default function MaPage() {
  return (
    <ProRouteGuard pageName="Ma Page">
      <MonContenu />
    </ProRouteGuard>
  );
}

// Pour les fonctionnalités nécessitant un abonnement payant (pas de trial)
export default function Catalogues() {
  return (
    <ProRouteGuard pageName="Catalogues" requirePaidSubscription={true}>
      <CataloguesContent />
    </ProRouteGuard>
  );
}
```

### 2. **useFeatureAccess** (Nouveau)

Hook centralisé pour vérifier l'accès aux fonctionnalités.

**Fonctionnalités :**
- ✅ Vérification d'accès centralisée
- ✅ Messages d'erreur personnalisés
- ✅ Informations d'abonnement détaillées
- ✅ Configuration par fonctionnalité

**Utilisation :**

```jsx
import { useFeatureAccess } from "@/src/hooks/useFeatureAccess";

function MonComposant() {
  const {
    hasAccess,
    reason,
    message,
    action,
    loading,
    getAccessMessage,
    subscriptionInfo,
  } = useFeatureAccess("factures");

  if (loading) {
    return <Skeleton />;
  }

  if (!hasAccess) {
    const accessMessage = getAccessMessage();
    return (
      <div>
        <h3>{accessMessage.title}</h3>
        <p>{accessMessage.description}</p>
        <Button>{accessMessage.cta}</Button>
      </div>
    );
  }

  return <MonContenu />;
}
```

### 3. **AccessDeniedCard** (Nouveau)

Composant pour afficher un message d'accès refusé élégant.

**Utilisation :**

```jsx
import { AccessDeniedCard } from "@/src/components/access-denied-card";

function MaPage() {
  const { hasAccess, reason } = useFeatureAccess("factures");

  if (!hasAccess) {
    return (
      <AccessDeniedCard
        reason={reason}
        featureName="Factures"
        onUpgrade={() => {
          // Logique personnalisée d'upgrade
        }}
        onSettings={() => {
          // Logique personnalisée de paramètres
        }}
      />
    );
  }

  return <MonContenu />;
}
```

### 4. **FeatureAccessBanner** (Nouveau)

Bannière d'information sur l'abonnement.

**Utilisation :**

```jsx
import { FeatureAccessBanner } from "@/src/components/feature-access-banner";

function Dashboard() {
  const { subscriptionInfo } = useFeatureAccess("dashboard");

  return (
    <div>
      <FeatureAccessBanner
        subscriptionInfo={subscriptionInfo}
        onUpgrade={() => {
          // Logique d'upgrade
        }}
      />
      <MonContenu />
    </div>
  );
}
```

## 📊 Configuration des fonctionnalités

Les fonctionnalités sont configurées dans `useFeatureAccess.js` :

```javascript
const featureConfig = {
  // Fonctionnalités gratuites
  kanban: {
    requiresPro: false,
    requiresCompanyInfo: false,
    requiresPaidSubscription: false,
  },

  // Fonctionnalités Pro
  factures: {
    requiresPro: true,
    requiresCompanyInfo: true,
    requiresPaidSubscription: false,
  },

  // Fonctionnalités nécessitant un abonnement payant
  catalogues: {
    requiresPro: true,
    requiresCompanyInfo: false,
    requiresPaidSubscription: true,
  },
};
```

## 🎯 Types de restrictions

### 1. **no_pro_subscription**
- L'utilisateur n'a pas d'abonnement Pro
- Action : Upgrade vers Pro

### 2. **trial_not_allowed**
- La fonctionnalité nécessite un abonnement payant (pas de trial)
- Action : Souscrire à un abonnement payant

### 3. **incomplete_company_info**
- Les informations d'entreprise sont incomplètes
- Action : Compléter le profil

## 🔄 Flux utilisateur

### Utilisateur Free

```
Connexion → /dashboard/outils
  ↓
Clic outil Pro → Modal Pricing
  ↓
Upgrade → Stripe Checkout
  ↓
Abonnement actif → Accès aux fonctionnalités Pro
```

### Utilisateur Pro (Trial)

```
Connexion → /dashboard
  ↓
Bannière "X jours restants"
  ↓
Navigation → Accès aux fonctionnalités Pro
  ↓
Expiration trial → Redirection vers /dashboard/outils
```

### Utilisateur Pro (Payant)

```
Connexion → /dashboard
  ↓
Navigation → Accès complet à toutes les fonctionnalités
```

## 🐛 Débogage

### Logs ProRouteGuard

Le composant affiche des logs détaillés dans la console :

```javascript
[ProRouteGuard] Factures {
  hasActiveSubscription: true,
  isPaidSubscription: true,
  requirePaidSubscription: false,
  accessGranted: true,
  subscriptionStatus: "active",
  trialActive: false,
  trialDaysRemaining: 0
}
```

### Vérifier l'accès manuellement

```javascript
const { hasAccess, reason, subscriptionInfo } = useFeatureAccess("factures");

console.log("Accès:", hasAccess);
console.log("Raison:", reason);
console.log("Abonnement:", subscriptionInfo);
```

## ✅ Checklist d'implémentation

Pour ajouter une nouvelle fonctionnalité protégée :

1. [ ] Ajouter la configuration dans `useFeatureAccess.js`
2. [ ] Entourer la page avec `ProRouteGuard`
3. [ ] Ajouter la fonctionnalité dans `section-cards.jsx` avec `isPro: true`
4. [ ] Tester les 3 scénarios : Free, Trial, Payant
5. [ ] Vérifier les redirections et messages d'erreur
6. [ ] Tester le rechargement de page

## 🚀 Améliorations apportées

### ProRouteGuard
- ✅ Délai de synchronisation de 300ms
- ✅ Prévention des redirections multiples avec `useRef`
- ✅ Skeleton pendant la vérification
- ✅ Support des abonnements payants uniquement
- ✅ Logs détaillés avec informations trial

### Page /dashboard/outils
- ✅ Ouverture automatique du modal pricing si `access=restricted`
- ✅ Meilleure gestion des paramètres URL

### Transferts de fichiers
- ✅ ProRouteGuard réactivé

### Nouveaux composants
- ✅ `useFeatureAccess` - Hook centralisé
- ✅ `AccessDeniedCard` - Message d'accès refusé élégant
- ✅ `FeatureAccessBanner` - Bannière d'information abonnement

## 📝 Notes importantes

1. **Délai de synchronisation** : Le délai de 300ms permet d'éviter les redirections intempestives lors du rechargement de page.

2. **Prévention des boucles** : L'utilisation de `hasRedirectedRef` empêche les redirections multiples.

3. **Skeleton** : Un skeleton est affiché pendant la vérification pour améliorer l'UX.

4. **Paramètre URL** : Le paramètre `?access=restricted` ouvre automatiquement le modal de pricing.

5. **Logs** : Les logs détaillés facilitent le débogage en développement.

## 🔮 Évolutions futures possibles

- [ ] Système de permissions granulaires par rôle
- [ ] Cache des vérifications d'accès
- [ ] Analytics sur les tentatives d'accès refusées
- [ ] A/B testing des messages d'upgrade
- [ ] Notifications push pour expiration trial
