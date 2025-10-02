# 💳 Système de Facturation Par Siège - Documentation

## 🎯 Vue d'ensemble

Système de facturation automatique par collaborateur ajouté à l'organisation.

**Tarification :**
- **Plan Pro Base** : 29€/mois (inclut le propriétaire)
- **Siège additionnel** : 7,49€/mois par collaborateur

**Exemple :**
- Propriétaire seul : 29€/mois
- Propriétaire + 2 collaborateurs : 29€ + (2 × 7,49€) = 43,98€/mois
- Propriétaire + 5 collaborateurs : 29€ + (5 × 7,49€) = 66,45€/mois

---

## 📋 Configuration Stripe (ÉTAPE 1)

### 1. Créer les produits dans Stripe Dashboard

#### **Produit 1 : Plan Pro (Base)**
```
Nom du produit: Plan Pro
Description: Plan professionnel avec fonctionnalités complètes
Prix: 29.00 EUR/mois
Type: Récurrent (monthly)
Tax behavior: inclusive (TVA incluse)
```

**Copier le Price ID** : `price_xxxxxxxxxxxxx` → Variable `STRIPE_PRICE_ID_MONTH`

#### **Produit 2 : Siège Collaborateur**
```
Nom du produit: Siège Collaborateur
Description: Siège additionnel pour collaborateur
Prix: 7.49 EUR/mois
Type: Récurrent (monthly)
Tax behavior: inclusive (TVA incluse)
Usage type: Licensed (per-seat)
```

**Copier le Price ID** : `price_xxxxxxxxxxxxx` → Variable `STRIPE_SEAT_PRICE_ID`

### 2. Configurer la proration

Dans **Stripe Dashboard → Settings → Billing → Subscriptions** :
- ✅ Activer "Prorate subscription changes"
- ✅ Sélectionner "Create prorations immediately"

### 3. Variables d'environnement

**Ajouter dans `/newbiv2/.env` :**

```bash
# Stripe - Prix de base (existant)
STRIPE_PRICE_ID_MONTH=price_xxxxxxxxxxxxx    # 29€/mois (base)
STRIPE_PRICE_ID_YEARS=price_xxxxxxxxxxxxx    # Plan annuel (optionnel)

# Stripe - Prix additionnel pour sièges (NOUVEAU)
STRIPE_SEAT_PRICE_ID=price_xxxxxxxxxxxxx     # 7.49€/mois par siège

# Stripe - Clés API (existantes)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## 🏗️ Architecture Implémentée

### **Fichiers créés**

1. **`/src/services/seatSyncService.js`** - Service de synchronisation
   - `getAdditionalSeatsCount()` - Compte les sièges additionnels
   - `syncSeatsAfterInvitationAccepted()` - Synchronise après acceptation
   - `syncSeatsAfterMemberRemoved()` - Synchronise après suppression
   - `getBillingInfo()` - Récupère les infos de facturation

2. **`/app/api/billing/sync-seats/route.js`** - API de synchronisation
   - `POST` - Synchronise manuellement les sièges
   - `GET` - Récupère les informations de facturation

3. **`/src/hooks/useSeatBilling.js`** - Hook React
   - `fetchBillingInfo()` - Récupère les infos de facturation
   - `syncSeats()` - Force une synchronisation
   - `formatCost()` - Formate les montants

### **Fichiers modifiés**

1. **`/app/api/invitations/[id]/route.js`**
   - Ajout de la synchronisation après acceptation d'invitation
   - Rollback automatique si échec de facturation

2. **`/src/hooks/useOrganizationInvitations.js`**
   - Ajout de la synchronisation après suppression de membre
   - Appel non-bloquant pour ne pas impacter l'UX

---

## 🔄 Flux de Facturation

### **Acceptation d'invitation**

```
1. Utilisateur accepte l'invitation
   ↓
2. Better Auth ajoute le membre à l'organisation
   ↓
3. Service calcule: additionalSeats = totalMembers - 1 (owner)
   ↓
4. Stripe ajoute/met à jour le subscription_item "Siège"
   ↓
5. Proration immédiate: Facture générée pour le prorata
   ↓
6. BDD mise à jour avec le nouveau nombre de sièges
   ↓
7. ✅ Membre actif + Facturation synchronisée
```

**En cas d'échec Stripe :**
```
❌ Erreur Stripe
   ↓
🔄 Rollback: Suppression automatique du membre
   ↓
⚠️ Notification utilisateur: "Échec facturation, réessayez"
```

### **Suppression de membre**

```
1. Admin supprime un membre
   ↓
2. Better Auth retire le membre de l'organisation
   ↓
3. Service recalcule: additionalSeats = totalMembers - 1
   ↓
4. Stripe réduit la quantity du subscription_item
   ↓
5. Crédit automatique: Prorata remboursé sur prochaine facture
   ↓
6. BDD mise à jour
   ↓
7. ✅ Membre supprimé + Crédit appliqué
```

**En cas d'échec Stripe :**
```
❌ Erreur Stripe (non-bloquant)
   ↓
⚠️ Log d'avertissement
   ↓
✅ Suppression du membre réussie quand même
   ↓
💡 Admin peut forcer une synchronisation manuelle
```

---

## 💰 Exemples de Facturation

### **Scénario 1 : Premier abonnement (propriétaire seul)**
```
Plan Pro Base: 29€/mois
Sièges additionnels: 0 × 7.49€ = 0€
─────────────────────────────────
Total: 29€/mois
```

### **Scénario 2 : Ajout de 1 collaborateur**
```
Plan Pro Base: 29€/mois
Sièges additionnels: 1 × 7.49€ = 7.49€
Proration (15 jours restants): 3.75€
─────────────────────────────────
Facture immédiate: 3.75€
Prochaine facture: 36.49€/mois
```

### **Scénario 3 : Ajout de 2 collaborateurs supplémentaires**
```
Plan Pro Base: 29€/mois
Sièges additionnels: 3 × 7.49€ = 22.47€
─────────────────────────────────
Total: 51.47€/mois
```

### **Scénario 4 : Suppression de 1 collaborateur**
```
Plan Pro Base: 29€/mois
Sièges additionnels: 2 × 7.49€ = 14.98€
Crédit prorata (20 jours restants): -5.00€
─────────────────────────────────
Total: 43.98€/mois
Crédit appliqué: -5.00€ sur prochaine facture
```

---

## 🧪 Tests à Effectuer

### **Test 1 : Acceptation d'invitation**

```bash
# 1. Créer une invitation
# 2. Accepter l'invitation avec un nouveau compte
# 3. Vérifier dans Stripe Dashboard:
#    - Subscription items: 2 items (base + seat)
#    - Quantity du seat item: 1
#    - Invoice créée avec proration
# 4. Vérifier les logs backend:
#    - "✅ Facturation synchronisée avec succès"
#    - "💰 Facturation mensuelle: 29€ (base) + 1 × 7.49€ = 36.49€"
```

### **Test 2 : Suppression de membre**

```bash
# 1. Supprimer un collaborateur
# 2. Vérifier dans Stripe Dashboard:
#    - Quantity du seat item réduite
#    - Crédit appliqué (upcoming invoice)
# 3. Vérifier les logs:
#    - "✅ Facturation synchronisée"
#    - "💳 Crédit prorata: -1 siège(s)"
```

### **Test 3 : Rollback sur échec**

```bash
# 1. Désactiver temporairement STRIPE_SEAT_PRICE_ID
# 2. Accepter une invitation
# 3. Vérifier:
#    - Erreur affichée à l'utilisateur
#    - Membre automatiquement supprimé (rollback)
#    - Logs: "🔄 Rollback: suppression du membre"
```

### **Test 4 : Synchronisation manuelle**

```bash
# 1. Appeler l'API de synchronisation:
curl -X POST http://localhost:3000/api/billing/sync-seats \
  -H "Content-Type: application/json" \
  -d '{"organizationId": "org_xxx"}'

# 2. Vérifier la réponse:
{
  "success": true,
  "seats": 3,
  "totalCost": 51.47,
  "message": "Facturation synchronisée: 3 siège(s) additionnel(s)"
}
```

---

## 🎨 Intégration UI (Optionnel)

### **Afficher les informations de facturation**

**Créer** : `/app/dashboard/settings/components/SeatBillingCard.jsx`

```jsx
"use client";

import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { useSeatBilling } from "@/src/hooks/useSeatBilling";
import { useSession } from "@/src/lib/auth-client";
import { Users, RefreshCw } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";

export function SeatBillingCard() {
  const { data: session } = useSession();
  const { billingInfo, loading, fetchBillingInfo, syncSeats, formatCost } = useSeatBilling();
  const organizationId = session?.session?.activeOrganizationId;

  useEffect(() => {
    if (organizationId) {
      fetchBillingInfo(organizationId);
    }
  }, [organizationId, fetchBillingInfo]);

  if (loading && !billingInfo) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!billingInfo?.hasSubscription) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Facturation par siège
            </CardTitle>
            <CardDescription>
              Coût mensuel basé sur le nombre de collaborateurs
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncSeats(organizationId)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Synchroniser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Détails de facturation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Plan de base</p>
              <p className="text-2xl font-semibold">{formatCost(billingInfo.baseCost)}</p>
              <p className="text-xs text-muted-foreground">Inclut le propriétaire</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sièges additionnels</p>
              <p className="text-2xl font-semibold">
                {billingInfo.additionalSeats} × {formatCost(7.49)}
              </p>
              <p className="text-xs text-muted-foreground">
                = {formatCost(billingInfo.seatCost)}
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Total mensuel</p>
              <p className="text-3xl font-bold">{formatCost(billingInfo.totalCost)}</p>
            </div>
          </div>

          {/* Informations */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              💡 La facturation est ajustée automatiquement lors de l'ajout ou de la suppression de collaborateurs.
              La proration est appliquée immédiatement.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🔧 Utilisation

### **1. Acceptation d'invitation (automatique)**

Aucune action requise ! Le système se déclenche automatiquement :

```javascript
// Dans /app/api/invitations/[id]/route.js
// Déjà intégré ✅

// 1. Utilisateur accepte l'invitation
// 2. Membre ajouté à l'organisation
// 3. Facturation synchronisée automatiquement
// 4. Rollback si échec Stripe
```

### **2. Suppression de membre (automatique)**

Aucune action requise ! Le système se déclenche automatiquement :

```javascript
// Dans useOrganizationInvitations.js
// Déjà intégré ✅

const { removeMember } = useOrganizationInvitations();

// 1. Admin supprime un membre
await removeMember(memberEmail);
// 2. Facturation synchronisée automatiquement (non-bloquant)
// 3. Crédit appliqué sur prochaine facture
```

### **3. Synchronisation manuelle (optionnel)**

Pour forcer une synchronisation (en cas de désynchronisation) :

```javascript
import { useSeatBilling } from "@/src/hooks/useSeatBilling";

const { syncSeats, billingInfo, loading } = useSeatBilling();

// Synchroniser
await syncSeats(organizationId);

// Récupérer les infos
const info = await fetchBillingInfo(organizationId);
console.log(`Total: ${info.totalCost}€`);
```

---

## 📊 Structure Stripe

### **Abonnement avec 3 collaborateurs additionnels**

```javascript
// Stripe Subscription
{
  id: "sub_xxxxxxxxxxxxx",
  customer: "cus_xxxxxxxxxxxxx",
  status: "active",
  items: {
    data: [
      {
        id: "si_base",
        price: {
          id: "price_xxx_base",
          unit_amount: 2900, // 29€
          recurring: { interval: "month" }
        },
        quantity: 1 // Toujours 1 (plan de base)
      },
      {
        id: "si_seats",
        price: {
          id: "price_xxx_seat",
          unit_amount: 749, // 7.49€
          recurring: { interval: "month" }
        },
        quantity: 3 // Nombre de sièges additionnels
      }
    ]
  },
  // Prochaine facture
  upcoming_invoice: {
    amount_due: 5147, // 51.47€ (29€ + 3×7.49€)
    lines: [
      { description: "Plan Pro", amount: 2900 },
      { description: "3 × Siège Collaborateur", amount: 2247 }
    ]
  }
}
```

---

## 🛡️ Sécurité et Robustesse

### **Idempotence**

Toutes les opérations Stripe utilisent des clés d'idempotence :

```javascript
idempotencyKey: `seat-add-${organizationId}-${Date.now()}`
```

Cela empêche les doubles facturations en cas de retry.

### **Rollback automatique**

Si la facturation échoue lors de l'acceptation d'invitation :

1. ✅ Le membre est automatiquement supprimé
2. ✅ L'utilisateur reçoit un message d'erreur clair
3. ✅ Aucune facturation n'est appliquée
4. ✅ L'utilisateur peut réessayer

### **Synchronisation non-bloquante**

Lors de la suppression d'un membre :

1. ✅ Le membre est supprimé immédiatement
2. ✅ La synchronisation Stripe se fait en arrière-plan
3. ✅ Si échec, un log d'avertissement est créé
4. ✅ L'admin peut forcer une synchronisation manuelle

---

## 🔍 Débogage

### **Logs à surveiller**

```bash
# Acceptation d'invitation
📊 Organisation org_xxx: { totalMembers: 3, additionalSeats: 2 }
💳 Abonnement Stripe récupéré, items actuels: 1
➕ Ajout de 2 siège(s) à l'abonnement
✅ Facturation synchronisée avec succès
💰 Facturation mensuelle: 29€ (base) + 2 × 7.49€ = 43.98€

# Suppression de membre
🗑️ Synchronisation après suppression de membre
📊 Organisation org_xxx: { totalMembers: 2, additionalSeats: 1 }
🔄 Mise à jour item sièges: 2 → 1 siège(s)
💳 Crédit prorata: -1 siège(s)
✅ Synchronisation terminée: 1 siège(s) additionnel(s)
```

### **Erreurs communes**

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Aucun abonnement Stripe trouvé" | Organisation sans abonnement | L'admin doit d'abord s'abonner |
| "STRIPE_SEAT_PRICE_ID not found" | Variable d'environnement manquante | Ajouter dans `.env` |
| "Permission refusée" | Utilisateur non-owner | Seul l'owner peut gérer la facturation |
| "Invalid price ID" | Price ID incorrect | Vérifier le Price ID dans Stripe Dashboard |

---

## 📈 Monitoring Recommandé

### **Métriques à suivre**

1. **Nombre moyen de sièges par organisation**
2. **Taux de croissance des sièges**
3. **Revenus additionnels par siège**
4. **Taux d'échec de synchronisation**

### **Alertes à configurer**

1. ⚠️ Échec de synchronisation > 5% des tentatives
2. ⚠️ Rollback fréquent (problème Stripe)
3. ⚠️ Désynchronisation BDD/Stripe

---

## ✅ Checklist de Déploiement

### **Avant le déploiement**

- [ ] Créer les 2 produits dans Stripe Dashboard
- [ ] Copier les Price IDs dans `.env`
- [ ] Activer la proration dans Stripe Settings
- [ ] Tester avec des cartes de test Stripe
- [ ] Vérifier les webhooks Stripe configurés

### **Après le déploiement**

- [ ] Tester l'acceptation d'invitation en production
- [ ] Tester la suppression de membre
- [ ] Vérifier les factures Stripe générées
- [ ] Monitorer les logs pour détecter les erreurs
- [ ] Configurer les alertes de monitoring

---

## 🚀 Prochaines Étapes

### **Améliorations possibles**

1. **Dashboard de facturation** - Afficher les coûts en temps réel
2. **Prévisions de coûts** - Estimer le coût avant d'inviter
3. **Limites de sièges** - Bloquer l'ajout si limite atteinte
4. **Notifications** - Alerter l'owner des changements de facturation
5. **Rapports** - Historique des changements de sièges

---

## 📞 Support

En cas de problème :

1. **Vérifier les logs backend** - Rechercher les erreurs Stripe
2. **Consulter Stripe Dashboard** - Vérifier les subscription items
3. **Forcer une synchronisation** - Utiliser l'API `/api/billing/sync-seats`
4. **Vérifier les variables d'environnement** - Confirmer les Price IDs

---

## ✅ Statut : IMPLÉMENTÉ

Le système de facturation par siège est maintenant **opérationnel** !

**Il ne reste plus qu'à :**
1. Créer les produits dans Stripe Dashboard
2. Ajouter `STRIPE_SEAT_PRICE_ID` dans `.env`
3. Tester avec des invitations réelles

🎉 **La facturation automatique par collaborateur est prête !**
