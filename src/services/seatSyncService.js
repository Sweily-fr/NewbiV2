import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SEAT_PRICE_ID = process.env.STRIPE_SEAT_PRICE_ID; // 7.49€/mois par siège additionnel

/**
 * Service de synchronisation de la facturation par siège
 * Gère l'ajout/suppression de sièges additionnels dans Stripe
 */
export class SeatSyncService {
  /**
   * Calcule le nombre de sièges additionnels (exclut le propriétaire)
   * Le propriétaire est inclus dans le plan de base à 29€/mois
   * 
   * @param {string} organizationId - ID de l'organisation
   * @param {Object} adapter - Adapter Better Auth pour accéder à la DB
   * @returns {Promise<number>} Nombre de sièges additionnels
   */
  async getAdditionalSeatsCount(organizationId, adapter) {
    try {
      const members = await adapter.findMany({
        model: "member",
        where: { organizationId }
      });
      
      // Exclure le propriétaire (inclus dans le plan de base)
      const additionalMembers = members.filter(m => m.role !== "owner");
      
      console.log(`📊 Organisation ${organizationId}:`, {
        totalMembers: members.length,
        additionalSeats: additionalMembers.length
      });
      
      return additionalMembers.length;
    } catch (error) {
      console.error("❌ Erreur calcul sièges additionnels:", error);
      throw error;
    }
  }

  /**
   * Met à jour l'abonnement Stripe avec le nombre de sièges additionnels
   * Gère la proration automatique (facturation ou crédit immédiat)
   * 
   * @param {string} organizationId - ID de l'organisation
   * @param {Object} adapter - Adapter Better Auth
   * @returns {Promise<Object>} Résultat de la synchronisation
   */
  async syncSeatsAfterInvitationAccepted(organizationId, adapter) {
    try {
      console.log(`🔄 Début synchronisation sièges pour organisation ${organizationId}`);

      // 1. Récupérer l'abonnement de l'organisation
      const subscription = await adapter.findFirst({
        model: "subscription",
        where: { referenceId: organizationId }
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        console.warn("⚠️ Aucun abonnement Stripe trouvé pour cette organisation");
        throw new Error("Aucun abonnement Stripe trouvé");
      }

      console.log(`📋 Abonnement trouvé: ${subscription.stripeSubscriptionId}`);

      // 2. Calculer le nombre de sièges additionnels
      const additionalSeats = await this.getAdditionalSeatsCount(
        organizationId,
        adapter
      );

      // 3. Récupérer l'abonnement Stripe complet
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      console.log(`💳 Abonnement Stripe récupéré, items actuels: ${stripeSubscription.items.data.length}`);

      // 4. Trouver le subscription_item pour les sièges additionnels
      let seatItem = stripeSubscription.items.data.find(
        item => item.price.id === SEAT_PRICE_ID
      );

      // 5. Mettre à jour selon le nombre de sièges
      if (additionalSeats > 0) {
        if (!seatItem) {
          // Créer un nouvel item pour les sièges additionnels
          console.log(`➕ Création item sièges: ${additionalSeats} siège(s) à 7.49€/mois`);
          
          await stripe.subscriptionItems.create({
            subscription: subscription.stripeSubscriptionId,
            price: SEAT_PRICE_ID,
            quantity: additionalSeats,
            proration_behavior: "create_prorations", // Facturation immédiate du prorata
          }, {
            idempotencyKey: `seat-add-${organizationId}-${Date.now()}`
          });

          console.log(`✅ Item sièges créé avec succès`);
        } else {
          // Mettre à jour la quantité existante SEULEMENT si elle a changé
          const oldQuantity = seatItem.quantity;
          
          if (oldQuantity !== additionalSeats) {
            console.log(`🔄 Mise à jour item sièges: ${oldQuantity} → ${additionalSeats} siège(s)`);
            
            await stripe.subscriptionItems.update(seatItem.id, {
              quantity: additionalSeats,
              proration_behavior: "create_prorations", // Proration automatique
            }, {
              idempotencyKey: `seat-update-${organizationId}-${Date.now()}`
            });

            const difference = additionalSeats - oldQuantity;
            if (difference > 0) {
              console.log(`💰 Facturation prorata: +${difference} siège(s)`);
            } else {
              console.log(`💳 Crédit prorata: ${difference} siège(s)`);
            }
          } else {
            console.log(`✅ Quantity inchangée (${oldQuantity} siège(s)), pas de mise à jour nécessaire`);
          }
        }
      } else if (seatItem && additionalSeats === 0) {
        // Supprimer l'item si plus de sièges additionnels
        console.log(`➖ Suppression item sièges (aucun collaborateur additionnel)`);
        
        await stripe.subscriptionItems.del(seatItem.id, {
          proration_behavior: "create_prorations", // Crédit du prorata
        });

        console.log(`✅ Item sièges supprimé, crédit appliqué`);
      }

      // 6. Mettre à jour la base de données locale (seulement si changement)
      if (subscription.seatQuantity !== additionalSeats) {
        await adapter.update({
          model: "subscription",
          where: { id: subscription.id },
          data: { 
            seatQuantity: additionalSeats,
            updatedAt: new Date()
          }
        });
        console.log(`📝 BDD mise à jour: seatQuantity = ${additionalSeats}`);
      } else {
        console.log(`📝 BDD déjà à jour (seatQuantity = ${additionalSeats})`);
      }

      console.log(`✅ Synchronisation terminée: ${additionalSeats} siège(s) additionnel(s)`);
      console.log(`💰 Facturation mensuelle: 29€ (base) + ${additionalSeats} × 7.49€ = ${29 + (additionalSeats * 7.49)}€`);

      return { 
        success: true, 
        seats: additionalSeats,
        totalCost: 29 + (additionalSeats * 7.49)
      };
    } catch (error) {
      console.error("❌ Erreur synchronisation sièges:", error);
      console.error("Stack:", error.stack);
      throw error;
    }
  }

  /**
   * Synchronise après suppression de membre
   * Utilise la même logique que l'acceptation d'invitation
   * 
   * @param {string} organizationId - ID de l'organisation
   * @param {Object} adapter - Adapter Better Auth
   * @returns {Promise<Object>} Résultat de la synchronisation
   */
  async syncSeatsAfterMemberRemoved(organizationId, adapter) {
    console.log(`🗑️ Synchronisation après suppression de membre`);
    return this.syncSeatsAfterInvitationAccepted(organizationId, adapter);
  }

  /**
   * Récupère les informations de facturation actuelles
   * Utile pour afficher dans l'interface utilisateur
   * 
   * @param {string} organizationId - ID de l'organisation
   * @param {Object} adapter - Adapter Better Auth
   * @returns {Promise<Object>} Informations de facturation
   */
  async getBillingInfo(organizationId, adapter) {
    try {
      const subscription = await adapter.findFirst({
        model: "subscription",
        where: { referenceId: organizationId }
      });

      if (!subscription) {
        return {
          hasSubscription: false,
          baseCost: 0,
          additionalSeats: 0,
          seatCost: 0,
          totalCost: 0
        };
      }

      const additionalSeats = await this.getAdditionalSeatsCount(
        organizationId,
        adapter
      );

      const baseCost = 29; // Plan Pro Base
      const seatCost = additionalSeats * 7.49;
      const totalCost = baseCost + seatCost;

      return {
        hasSubscription: true,
        baseCost,
        additionalSeats,
        seatCost,
        totalCost,
        currency: "EUR"
      };
    } catch (error) {
      console.error("❌ Erreur récupération info facturation:", error);
      throw error;
    }
  }
}

// Export singleton
export const seatSyncService = new SeatSyncService();
