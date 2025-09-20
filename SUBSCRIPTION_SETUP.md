# Système d'Essai Gratuit et Abonnement Stripe - Documentation

## 🎯 Vue d'ensemble

Ce système implémente un essai gratuit de 14 jours suivi d'un passage obligatoire à la version payante via Stripe et Better Auth.

## 🏗️ Architecture

### Composants principaux

1. **Better Auth + Plugin Stripe** - Authentification et gestion des abonnements
2. **Middleware de protection** - Vérification du statut d'abonnement
3. **Hooks React** - Gestion côté client
4. **Pages et composants UI** - Interface utilisateur
5. **Webhooks Stripe** - Synchronisation automatique

## 📋 Configuration requise

### Variables d'environnement

Ajoutez ces variables à votre fichier `.env.local` :

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Better Auth (existant)
BETTER_AUTH_SECRET=your-secret-key
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

### Configuration Stripe Dashboard

1. **Créer les produits** dans Stripe Dashboard :
   - Plan Professionnel (29€/mois)
   - Plan Entreprise (99€/mois)

2. **Configurer les webhooks** :
   - URL : `https://votre-domaine.com/api/webhooks/stripe`
   - Événements : `customer.subscription.*`, `invoice.*`, `payment_intent.*`

## 🔧 Flux utilisateur

### 1. Inscription

```
Utilisateur s'inscrit → Accès immédiat (essai 14 jours) → Dashboard complet
```

### 2. Période d'essai

```
Jours 1-11 : Alerte discrète (bleue)
Jours 12-14 : Alerte d'urgence (orange)
Jour 15+ : Accès bloqué → Redirection vers /pricing
```

### 3. Abonnement

```
Utilisateur choisit plan → Stripe Checkout → Webhook → Accès débloqué
```

## 📁 Structure des fichiers

### Configuration

- `src/lib/auth.js` - Configuration Better Auth + plugin Stripe
- `middleware.js` - Middleware principal Next.js
- `src/middleware/subscription.js` - Logique de vérification d'abonnement

### Hooks et utilitaires

- `src/hooks/useSubscription.js` - Hook principal pour gérer les abonnements
- `src/components/subscription-error-boundary.jsx` - Gestion d'erreurs
- `src/components/trial-alert.jsx` - Alertes d'essai
- `src/components/subscription-status.jsx` - Statut d'abonnement

### Pages et composants

- `app/pricing/page.jsx` - Page de tarification
- `app/dashboard/settings/components/BillingSection.jsx` - Gestion d'abonnement
- `app/api/webhooks/stripe/route.js` - Endpoint webhooks

## 🛠️ API et Hooks

### Hook useSubscription

```javascript
const {
  subscription, // Données Stripe
  isInTrial, // true si en essai
  isTrialExpired, // true si essai expiré
  trialDaysRemaining, // Jours restants
  hasActiveSubscription, // true si abonné
  canAccessApp, // true si accès autorisé
  createCheckoutSession, // Fonction checkout
  createCustomerPortal, // Fonction portail client
  loading, // État de chargement
  error, // Erreurs éventuelles
} = useSubscription();
```

### Middleware de protection

Le middleware protège automatiquement ces routes :

- `/dashboard/*`
- `/api/graphql`
- `/api/upload`
- `/api/bridge`
- `/api/ocr`

Routes exclues :

- `/auth/*`
- `/pricing`
- `/api/webhooks/stripe`

## 🎨 Composants UI

### TrialAlert

Affiche des alertes contextuelles selon le statut :

```jsx
<TrialAlert /> // Auto-détecte le statut et affiche l'alerte appropriée
```

### SubscriptionStatus

Badge de statut d'abonnement :

```jsx
<SubscriptionStatus variant="badge" />     // Badge simple
<SubscriptionStatus variant="detailed" />  // Avec boutons d'action
```

### BillingSection

Section complète de gestion d'abonnement dans les paramètres.

## 🔄 Gestion des webhooks

Les webhooks Stripe sont automatiquement gérés par le plugin Better Auth. La route `/api/webhooks/stripe` délègue le traitement au plugin.

Événements synchronisés :

- Création d'abonnement
- Modification d'abonnement
- Annulation d'abonnement
- Échec de paiement
- Renouvellement

## 🚀 Déploiement

### 1. Configuration Stripe

1. Créer les produits et prix dans Stripe Dashboard
2. Configurer les webhooks
3. Récupérer les clés API

### 2. Variables d'environnement

```bash
# Production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Test des webhooks

```bash
# Utiliser Stripe CLI pour tester localement
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 🧪 Tests

### Scénarios de test

1. **Inscription et essai**
   - Créer un compte
   - Vérifier l'accès pendant 14 jours
   - Vérifier les alertes aux jours 12-14

2. **Expiration d'essai**
   - Simuler une date > 14 jours
   - Vérifier la redirection vers /pricing
   - Vérifier le blocage d'accès

3. **Abonnement**
   - Processus de checkout complet
   - Vérification webhook
   - Accès débloqué après paiement

4. **Gestion d'abonnement**
   - Portail client Stripe
   - Modification/annulation
   - Synchronisation des statuts

### Cartes de test Stripe

```
# Paiement réussi
4242 4242 4242 4242

# Paiement échoué
4000 0000 0000 0002

# Authentification 3D Secure
4000 0025 0000 3155
```

## 🔍 Débogage

### Logs utiles

```javascript
// Dans useSubscription.js
console.log("Subscription data:", subscription);
console.log("Trial status:", { isInTrial, trialDaysRemaining });

// Dans le middleware
console.log("User creation date:", user.createdAt);
console.log("Days since creation:", daysSinceCreation);
```

### Erreurs communes

1. **Webhook non reçu** : Vérifier l'URL et les événements configurés
2. **Essai non détecté** : Vérifier la date de création utilisateur
3. **Redirection infinie** : Vérifier les routes exclues du middleware
4. **Erreur Stripe** : Vérifier les clés API et les permissions

## 📊 Métriques recommandées

- Taux de conversion essai → payant
- Durée moyenne avant conversion
- Taux d'abandon au checkout
- Taux de désabonnement

## 🔒 Sécurité

- Les webhooks Stripe sont vérifiés via signature
- Le middleware protège toutes les routes sensibles
- Les clés API ne sont jamais exposées côté client
- Validation des données utilisateur à chaque étape

## 📞 Support

En cas de problème :

1. Vérifier les logs de l'application
2. Consulter les événements Stripe Dashboard
3. Tester avec les cartes de test Stripe
4. Vérifier la configuration des webhooks

---

**Note** : Ce système est conçu pour être robuste et gérer automatiquement tous les cas d'usage. La configuration initiale est la seule étape manuelle requise.
