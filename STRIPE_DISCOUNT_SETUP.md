# Configuration de la Réduction Automatique de 20%

## 🎯 Objectif
Appliquer automatiquement une réduction de 20% sur la première année pour tous les nouveaux abonnements (mensuel et annuel).

## 📋 Étapes de Configuration

### 1. Créer le Coupon dans Stripe Dashboard

1. **Aller dans Stripe Dashboard** → Produits → Coupons
2. **Créer un nouveau coupon** avec ces paramètres :
   - **ID du coupon** : `first-year-20-percent`
   - **Type** : Pourcentage
   - **Valeur** : 20%
   - **Durée** : Répéter pendant 12 mois
   - **Utilisation** : Illimitée
   - **Restrictions** : Aucune

### 2. Ajouter la Variable d'Environnement

Ajouter cette ligne dans votre fichier `.env` :

```env
# Coupon Stripe pour réduction de 20% première année
STRIPE_FIRST_YEAR_DISCOUNT_COUPON_ID=L4KHXReH
```

### 3. Configuration Appliquée

Le code dans `src/lib/auth-plugins.js` applique automatiquement :

✅ **Réduction de 20%** sur tous les nouveaux abonnements
✅ **Message personnalisé** dans le checkout
✅ **Codes promo** activés pour flexibilité
✅ **Adresse de facturation** requise
✅ **Métadonnées** pour le suivi

## 🔄 Fonctionnement

1. **Utilisateur clique** "Passer à Pro"
2. **Stripe Checkout** s'ouvre avec réduction automatique
3. **Message affiché** : "🎉 Réduction de 20% appliquée sur votre première année !"
4. **Prix réduit** visible immédiatement
5. **Abonnement créé** avec réduction active

## 💡 Avantages

- **Automatique** : Pas d'action requise de l'utilisateur
- **Visible** : La réduction est clairement affichée
- **Flexible** : Fonctionne pour mensuel et annuel
- **Traçable** : Métadonnées pour analytics

## 🧪 Test

Pour tester :
1. Créer le coupon dans Stripe
2. Ajouter la variable d'environnement
3. Redéployer l'application
4. Tenter un abonnement → La réduction doit apparaître

## ⚠️ Important

- Le coupon doit être créé **avant** le déploiement
- La variable d'environnement doit être définie sur **tous les environnements**
- Vérifier que le coupon est **actif** dans Stripe
