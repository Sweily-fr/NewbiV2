# Configuration Stripe Connect

## Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Votre clé secrète Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Votre clé publique Stripe
NEXT_PUBLIC_APP_URL=http://localhost:3000  # URL de votre application
```

## Configuration Stripe Dashboard

1. **Connectez-vous à votre tableau de bord Stripe**
   - Allez sur https://dashboard.stripe.com

2. **Activez Stripe Connect**
   - Dans le menu de gauche, cliquez sur "Connect"
   - Suivez les instructions pour activer Connect

3. **Configurez les paramètres Connect**
   - Définissez vos URLs de redirection
   - Configurez les webhooks si nécessaire

## Fonctionnalités implémentées

### Interface utilisateur
- **Card Stripe Connect** dans l'onglet "Sécurité et confidentialité"
- **Bouton de connexion** avec les couleurs officielles Stripe
- **Indicateur de statut** (connecté/non connecté)
- **Boutons d'action** : Connecter, Tableau de bord, Déconnecter
- **Section informative** expliquant les avantages

### API Routes
- `POST /api/stripe/connect/onboard` - Créer un compte et lien d'onboarding
- `POST /api/stripe/connect/disconnect` - Déconnecter un compte
- `GET /api/stripe/connect/status` - Vérifier le statut de connexion

### Gestion d'état
- **Vérification automatique** du statut au chargement
- **Gestion des redirections** après onboarding Stripe
- **États de chargement** pour une meilleure UX

## Intégration base de données

Pour une implémentation complète, vous devrez :

1. **Ajouter une table/collection** pour stocker les comptes Stripe :
```sql
-- Exemple pour PostgreSQL
ALTER TABLE users ADD COLUMN stripe_account_id VARCHAR(255);
ALTER TABLE users ADD COLUMN stripe_connected_at TIMESTAMP;
```

2. **Modifier les routes API** pour sauvegarder/récupérer les données :
```javascript
// Dans onboard/route.js
// Sauvegarder l'ID du compte Stripe
await updateUser(userId, { stripe_account_id: account.id });

// Dans status/route.js  
// Récupérer l'ID du compte depuis la DB
const user = await getUserById(userId);
const stripeAccountId = user.stripe_account_id;
```

## Webhooks Stripe (Optionnel)

Pour une synchronisation en temps réel, configurez des webhooks :

```javascript
// app/api/stripe/webhooks/route.js
export async function POST(request) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();
  
  try {
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    switch (event.type) {
      case 'account.updated':
        // Mettre à jour le statut du compte
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    return new Response('OK', { status: 200 });
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
}
```

## Sécurité

- ✅ **Validation des paramètres** dans toutes les routes API
- ✅ **Gestion d'erreurs** appropriée
- ✅ **Logs de débogage** pour le développement
- ⚠️ **Authentification** : Ajoutez la vérification de session dans les routes API
- ⚠️ **Autorisation** : Vérifiez que l'utilisateur peut modifier son propre compte

## Test

1. **Mode test Stripe** : Utilisez les clés de test pour le développement
2. **URLs de redirection** : Configurez les bonnes URLs dans Stripe Dashboard
3. **Logs** : Surveillez les logs pour déboguer les problèmes

## Production

Avant de passer en production :
- [ ] Remplacez les clés de test par les clés de production
- [ ] Configurez les webhooks en production
- [ ] Testez le flux complet d'onboarding
- [ ] Vérifiez la conformité réglementaire selon votre région
