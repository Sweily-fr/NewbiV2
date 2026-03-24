import Stripe from "stripe";
import { getPlanLimits as getCentralizedPlanLimits, getSeatPrice, SEAT_PRICE } from "../lib/plan-limits.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SEAT_PRICE_ID = process.env.STRIPE_SEAT_PRICE_ID; // Prix par siège additionnel
const BASE_PRICE_ID = process.env.STRIPE_PRICE_ID_MONTH; // Prix du plan Pro de base

/**
 * Service de gestion des limites d'utilisateurs par plan
 * Les utilisateurs sont INCLUS dans le plan (pas de facturation par siège)
 * - Freelance : Owner seul (0 invité)
 * - PME : 10 utilisateurs invités max
 * - Entreprise : 25 utilisateurs invités max
 */
export class SeatSyncService {
  /**
   * Récupère les limites d'un plan (utilise la config centralisée)
   * @param {string} planName
   * @returns {Object}
   */
  getPlanLimits(planName) {
    const centralLimits = getCentralizedPlanLimits(planName);

    // Adapter le format pour la compatibilité avec le code existant
    return {
      users: centralLimits.invitableUsers,  // Nombre d'utilisateurs invitables
      accountants: centralLimits.accountants,
      canAddPaidUsers: centralLimits.canAddPaidUsers,
      workspaces: centralLimits.workspaces,
      bankAccounts: centralLimits.bankAccounts,
      storage: centralLimits.storage,
    };
  }

  /**
   * Vérifie si l'organisation peut inviter un nouveau membre selon son rôle
   * Logique :
   * - Freelance : 0 utilisateur, 1 comptable (pas de siège payant)
   * - PME : 10 utilisateurs inclus, 3 comptables, sièges payants possibles (7,49€/mois)
   * - Entreprise : 25 utilisateurs inclus, 5 comptables, sièges payants possibles (7,49€/mois)
   *
   * @param {string} organizationId
   * @param {string} role - Rôle de l'invité (member, admin, viewer, accountant)
   * @returns {Promise<Object>}
   */
  async canInviteMember(organizationId, role = "member") {
    try {
      const { mongoDb } = await import("../lib/mongodb.js");
      const { ObjectId } = await import("mongodb");

      // 1. Récupérer l'abonnement
      const subscription = await mongoDb.collection("subscription").findOne({
        referenceId: organizationId,
      });

      if (!subscription) {
        return {
          canInvite: false,
          reason: "Aucun abonnement actif. Veuillez souscrire à un plan.",
          planName: "none",
        };
      }

      // 2. Récupérer les limites du plan
      const planLimits = this.getPlanLimits(subscription.plan);
      const isAccountant = role === "accountant";

      // 3. Compter les membres actuels par type
      const members = await mongoDb
        .collection("member")
        .find({ organizationId: new ObjectId(organizationId) })
        .toArray();

      const currentUsers = members.filter(
        (m) => m.role !== "accountant" && m.role !== "owner"
      ).length;
      const currentAccountants = members.filter(
        (m) => m.role === "accountant"
      ).length;

      // 4. Compter les invitations pending par type
      const pendingInvitations = await mongoDb
        .collection("invitation")
        .find({
          organizationId: new ObjectId(organizationId),
          status: "pending",
        })
        .toArray();

      const pendingUsers = pendingInvitations.filter(
        (i) => i.role !== "accountant"
      ).length;
      const pendingAccountants = pendingInvitations.filter(
        (i) => i.role === "accountant"
      ).length;

      // 5. Totaux (membres + invitations pending)
      const totalUsers = currentUsers + pendingUsers;
      const totalAccountants = currentAccountants + pendingAccountants;

      console.log(`📊 [INVITE CHECK] Organisation ${organizationId}:`, {
        plan: subscription.plan,
        role,
        currentUsers,
        pendingUsers,
        totalUsers,
        limitUsers: planLimits.users,
        currentAccountants,
        pendingAccountants,
        totalAccountants,
        limitAccountants: planLimits.accountants,
        canAddPaidUsers: planLimits.canAddPaidUsers,
      });

      // 6. Vérification selon le type d'invitation
      if (isAccountant) {
        // Vérifier la limite de comptables
        if (totalAccountants >= planLimits.accountants) {
          return {
            canInvite: false,
            reason: `Limite de ${planLimits.accountants} comptable(s) atteinte pour le plan ${subscription.plan.toUpperCase()}. Passez à un plan supérieur pour inviter plus de comptables.`,
            planName: subscription.plan,
            currentAccountants,
            pendingAccountants,
            totalAccountants,
            limitAccountants: planLimits.accountants,
          };
        }

        return {
          canInvite: true,
          reason: "OK",
          planName: subscription.plan,
          currentAccountants,
          pendingAccountants,
          totalAccountants,
          limitAccountants: planLimits.accountants,
          availableAccountants: planLimits.accountants - totalAccountants,
        };
      } else {
        // Vérifier la limite d'utilisateurs
        const usersIncluded = planLimits.users;
        const availableIncluded = Math.max(0, usersIncluded - totalUsers);

        // Si dans la limite incluse
        if (totalUsers < usersIncluded) {
          return {
            canInvite: true,
            reason: "OK",
            planName: subscription.plan,
            currentUsers,
            pendingUsers,
            totalUsers,
            limitUsers: usersIncluded,
            availableUsers: availableIncluded,
            isPaid: false,
            additionalCost: 0,
          };
        }

        // Au-delà de la limite incluse
        if (planLimits.canAddPaidUsers) {
          // Siège payant possible (tous les plans)
          const additionalSeats = totalUsers - usersIncluded + 1; // +1 pour le nouveau
          return {
            canInvite: true,
            reason: "OK - Siège supplémentaire payant",
            planName: subscription.plan,
            currentUsers,
            pendingUsers,
            totalUsers,
            limitUsers: usersIncluded,
            availableUsers: 0,
            isPaid: true,
            additionalCost: 7.49,
            totalAdditionalSeats: additionalSeats,
            totalAdditionalCost: additionalSeats * 7.49,
          };
        } else {
          // Fallback : pas de siège payant pour ce plan
          return {
            canInvite: false,
            reason: `Votre plan ne permet pas d'ajouter d'utilisateurs supplémentaires. Passez à un plan supérieur.`,
            planName: subscription.plan,
            currentUsers,
            pendingUsers,
            totalUsers,
            limitUsers: usersIncluded,
            availableUsers: 0,
            isPaid: false,
          };
        }
      }
    } catch (error) {
      console.error("❌ Erreur vérification invitation:", error);
      throw error;
    }
  }

  /**
   * @deprecated Utiliser canInviteMember() à la place
   */
  async canAddMember(organizationId, adapter) {
    // Redirige vers la nouvelle méthode pour compatibilité
    return this.canInviteMember(organizationId, "member");
  }
  /**
   * Récupère les prix depuis Stripe (avec cache)
   * @returns {Promise<{baseCost: number, seatCost: number}>}
   */
  async getPricesFromStripe() {
    try {
      // Récupérer les prix depuis Stripe
      const [basePrice, seatPrice] = await Promise.all([
        stripe.prices.retrieve(BASE_PRICE_ID),
        stripe.prices.retrieve(SEAT_PRICE_ID),
      ]);

      return {
        baseCost: basePrice.unit_amount / 100, // Convertir centimes en euros
        seatCost: seatPrice.unit_amount / 100,
        baseCurrency: basePrice.currency.toUpperCase(),
        seatCurrency: seatPrice.currency.toUpperCase(),
      };
    } catch (error) {
      console.error("❌ Erreur récupération prix Stripe:", error);
      // Fallback sur les prix par défaut si Stripe échoue
      return {
        baseCost: 14.99,
        seatCost: 7.49,
        baseCurrency: "EUR",
        seatCurrency: "EUR",
      };
    }
  }

  /**
   * Calcule le nombre de sièges additionnels selon le plan
   * - Exclut les comptables (1 gratuit par organisation)
   * - Soustrait la limite incluse dans le plan (1/10/25 users)
   * - Facture uniquement les utilisateurs au-delà de cette limite
   *
   * @param {string} organizationId - ID de l'organisation
   * @param {Object} adapter - Adapter Better Auth pour accéder à la DB
   * @returns {Promise<number>} Nombre de sièges additionnels à facturer
   */
  async getAdditionalSeatsCount(organizationId, adapter) {
    try {
      // Import MongoDB directement
      const { mongoDb } = await import("../lib/mongodb.js");
      const { ObjectId } = await import("mongodb");

      // 1. Récupérer l'abonnement pour connaître le plan
      const subscription = await mongoDb.collection("subscription").findOne({
        referenceId: organizationId,
      });

      if (!subscription) {
        console.log(`⚠️ Aucun abonnement trouvé pour ${organizationId}`);
        return 0;
      }

      // 2. Récupérer la limite d'utilisateurs incluse dans le plan
      const planLimits = this.getPlanLimits(subscription.plan);
      const includedUsers = planLimits.users; // 1, 10 ou 25 selon le plan

      // 3. Compter les membres actuels
      const members = await mongoDb
        .collection("member")
        .find({
          organizationId: new ObjectId(organizationId),
        })
        .toArray();

      // 4. Exclure les comptables ET l'owner (owner n'est pas facturé, comptables sont gratuits)
      const billableMembers = members.filter(
        (m) => m.role !== "accountant" && m.role !== "owner"
      );

      // 5. Calculer les sièges additionnels = membres facturables - limite incluse
      const additionalSeats = Math.max(
        0,
        billableMembers.length - includedUsers
      );

      console.log(`📊 [SEAT CALC] Organisation ${organizationId}:`, {
        plan: subscription.plan,
        includedUsers,
        totalMembers: members.length,
        billableMembers: billableMembers.length,
        ownersExcluded: members.filter((m) => m.role === "owner").length,
        accountantsExcluded: members.filter((m) => m.role === "accountant").length,
        additionalSeats,
      });

      return additionalSeats;
    } catch (error) {
      console.error("❌ Erreur calcul sièges additionnels:", error);
      throw error;
    }
  }

  /**
   * ✅ ACTIVÉ - Synchronise les sièges additionnels avec Stripe
   * Met à jour l'abonnement Stripe avec le nombre de sièges additionnels
   * Gère la proration automatique (facturation ou crédit immédiat)
   *
   * @param {string} organizationId - ID de l'organisation
   * @param {Object} adapter - Adapter Better Auth
   * @returns {Promise<Object>} Résultat de la synchronisation
   */
  async syncSeatsAfterInvitationAccepted(organizationId, adapter) {
    try {
      console.log(
        `🔄 [SEAT SYNC] Début synchronisation sièges pour organisation ${organizationId}`
      );

      // Import MongoDB
      const { mongoDb } = await import("../lib/mongodb.js");

      // 1. Récupérer l'abonnement de l'organisation
      const subscription = await mongoDb.collection("subscription").findOne({
        referenceId: organizationId,
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        console.warn(
          "⚠️ [SEAT SYNC] Aucun abonnement Stripe trouvé pour cette organisation"
        );
        throw new Error("Aucun abonnement Stripe trouvé");
      }

      console.log(
        `📋 [SEAT SYNC] Abonnement trouvé: ${subscription.stripeSubscriptionId}`
      );

      // 2. Calculer le nombre de sièges additionnels (avec notre nouvelle logique)
      const additionalSeats = await this.getAdditionalSeatsCount(
        organizationId,
        adapter
      );

      console.log(
        `📊 [SEAT SYNC] Sièges additionnels à facturer: ${additionalSeats}`
      );

      // 2.5. Récupérer les infos pour les emails
      const planLimits = this.getPlanLimits(subscription.plan);
      const includedSeats = planLimits.users;

      const members = await mongoDb
        .collection("member")
        .find({ organizationId })
        .toArray();

      // Membres facturables = tous sauf owner, accountant et pending
      const billableMembers = members.filter(
        (m) => m.role !== "owner" && m.role !== "accountant" && m.role !== "pending"
      );
      const currentMembers = billableMembers.length;
      const availableSeats = Math.max(0, includedSeats - currentMembers);

      // Récupérer l'organisation et l'owner pour l'email
      const organization = await adapter.findOne({
        model: "organization",
        where: { id: organizationId },
      });

      const ownerMember = members.find((m) => m.role === "owner");
      const owner = ownerMember
        ? await adapter.findOne({
            model: "user",
            where: { id: ownerMember.userId },
          })
        : null;

      // 3. Récupérer l'abonnement Stripe complet
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      console.log(
        `💳 [SEAT SYNC] Abonnement Stripe récupéré, items actuels: ${stripeSubscription.items.data.length}`
      );

      // 4. Trouver le subscription_item pour les sièges additionnels
      let seatItem = stripeSubscription.items.data.find(
        (item) => item.price.id === SEAT_PRICE_ID
      );

      // 5. Mettre à jour selon le nombre de sièges
      if (additionalSeats > 0) {
        if (!seatItem) {
          // Récupérer le prix pour le log
          const prices = await this.getPricesFromStripe();

          // Créer un nouvel item pour les sièges additionnels
          console.log(
            `➕ [SEAT SYNC] Création item sièges: ${additionalSeats} siège(s) à ${prices.seatCost}€/mois`
          );

          await stripe.subscriptionItems.create(
            {
              subscription: subscription.stripeSubscriptionId,
              price: SEAT_PRICE_ID,
              quantity: additionalSeats,
              proration_behavior: "create_prorations", // Facturation immédiate du prorata
            },
            {
              idempotencyKey: `seat-add-${organizationId}-${Date.now()}`,
            }
          );

          console.log(
            `✅ [SEAT SYNC] Item sièges créé avec succès (${additionalSeats} sièges)`
          );

          // Envoyer email d'ajout de siège additionnel
          if (owner?.email) {
            try {
              const { sendAdditionalSeatAddedEmail } = await import(
                "../lib/auth-utils.js"
              );
              const monthlyCost = `${(additionalSeats * 7.49).toFixed(2)}€/mois`;

              await sendAdditionalSeatAddedEmail({
                to: owner.email,
                customerName: owner.name || owner.email,
                plan: subscription.plan.toUpperCase(),
                currentMembers,
                includedSeats,
                additionalSeats,
                monthlyCost,
              });

              console.log(
                `📧 [SEAT SYNC] Email d'ajout de siège envoyé à ${owner.email}`
              );
            } catch (emailError) {
              console.error(
                `⚠️ [SEAT SYNC] Erreur envoi email ajout siège:`,
                emailError
              );
            }
          }
        } else if (seatItem.quantity !== additionalSeats) {
          // Mettre à jour la quantité si elle a changé
          console.log(
            `🔄 [SEAT SYNC] Mise à jour sièges: ${seatItem.quantity} → ${additionalSeats}`
          );

          await stripe.subscriptionItems.update(seatItem.id, {
            quantity: additionalSeats,
            proration_behavior: "create_prorations",
          });

          console.log(
            `✅ [SEAT SYNC] Quantité mise à jour avec succès (${additionalSeats} sièges)`
          );
        } else {
          console.log(
            `ℹ️ [SEAT SYNC] Quantité déjà correcte (${additionalSeats} sièges)`
          );
        }
      } else {
        // Aucun siège additionnel nécessaire
        if (seatItem) {
          // Supprimer l'item si tous les sièges additionnels ont été retirés
          console.log(
            `🗑️ [SEAT SYNC] Suppression item sièges (plus de sièges additionnels)`
          );

          await stripe.subscriptionItems.del(seatItem.id, {
            proration_behavior: "create_prorations",
          });

          console.log(`✅ [SEAT SYNC] Item sièges supprimé avec succès`);
        } else {
          console.log(`ℹ️ [SEAT SYNC] Aucun siège additionnel nécessaire`);
        }
      }

      // 6. Envoyer email d'alerte si proche de la limite (≤ 2 sièges disponibles)
      if (
        additionalSeats === 0 &&
        availableSeats > 0 &&
        availableSeats <= 2 &&
        owner?.email
      ) {
        try {
          const { sendSeatLimitWarningEmail } = await import(
            "../lib/auth-utils.js"
          );

          await sendSeatLimitWarningEmail({
            to: owner.email,
            customerName: owner.name || owner.email,
            plan: subscription.plan.toUpperCase(),
            currentMembers,
            includedSeats,
            availableSeats,
          });

          console.log(
            `📧 [SEAT SYNC] Email d'alerte limite envoyé à ${owner.email} (${availableSeats} sièges restants)`
          );
        } catch (emailError) {
          console.error(
            `⚠️ [SEAT SYNC] Erreur envoi email alerte limite:`,
            emailError
          );
        }
      }

      return {
        success: true,
        additionalSeats,
        message: `Synchronisation réussie: ${additionalSeats} siège(s) additionnel(s)`,
      };
    } catch (error) {
      console.error("❌ [SEAT SYNC] Erreur synchronisation sièges:", error);
      throw error;
    }
  }

  /**
   * ⚠️ ANCIENNE VERSION - Conservée pour référence
   * @deprecated Utiliser canAddMember() à la place
   */
  async syncSeatsAfterInvitationAcceptedOLD(organizationId, adapter) {
    try {
      console.log(
        `🔄 Début synchronisation sièges pour organisation ${organizationId}`
      );

      // Import MongoDB
      const { mongoDb } = await import("../lib/mongodb.js");

      // 1. Récupérer l'abonnement de l'organisation
      const subscription = await mongoDb.collection("subscription").findOne({
        referenceId: organizationId,
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        console.warn(
          "⚠️ Aucun abonnement Stripe trouvé pour cette organisation"
        );
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

      console.log(
        `💳 Abonnement Stripe récupéré, items actuels: ${stripeSubscription.items.data.length}`
      );

      // 4. Trouver le subscription_item pour les sièges additionnels
      let seatItem = stripeSubscription.items.data.find(
        (item) => item.price.id === SEAT_PRICE_ID
      );

      // 5. Mettre à jour selon le nombre de sièges
      if (additionalSeats > 0) {
        if (!seatItem) {
          // Récupérer le prix pour le log
          const prices = await this.getPricesFromStripe();

          // Créer un nouvel item pour les sièges additionnels
          console.log(
            `➕ Création item sièges: ${additionalSeats} siège(s) à ${prices.seatCost}€/mois`
          );

          await stripe.subscriptionItems.create(
            {
              subscription: subscription.stripeSubscriptionId,
              price: SEAT_PRICE_ID,
              quantity: additionalSeats,
              proration_behavior: "create_prorations", // Facturation immédiate du prorata
            },
            {
              idempotencyKey: `seat-add-${organizationId}-${Date.now()}`,
            }
          );

          console.log(`✅ Item sièges créé avec succès`);
        } else {
          // Mettre à jour la quantité existante SEULEMENT si elle a changé
          const oldQuantity = seatItem.quantity;

          if (oldQuantity !== additionalSeats) {
            console.log(
              `🔄 Mise à jour item sièges: ${oldQuantity} → ${additionalSeats} siège(s)`
            );

            await stripe.subscriptionItems.update(
              seatItem.id,
              {
                quantity: additionalSeats,
                proration_behavior: "create_prorations", // Proration automatique
              },
              {
                idempotencyKey: `seat-update-${organizationId}-${Date.now()}`,
              }
            );

            const difference = additionalSeats - oldQuantity;
            if (difference > 0) {
              console.log(`💰 Facturation prorata: +${difference} siège(s)`);
            } else {
              console.log(`💳 Crédit prorata: ${difference} siège(s)`);
            }
          } else {
            console.log(
              `✅ Quantity inchangée (${oldQuantity} siège(s)), pas de mise à jour nécessaire`
            );
          }
        }
      } else if (seatItem && additionalSeats === 0) {
        // Supprimer l'item si plus de sièges additionnels
        console.log(
          `➖ Suppression item sièges (aucun collaborateur additionnel)`
        );

        await stripe.subscriptionItems.del(seatItem.id, {
          proration_behavior: "create_prorations", // Crédit du prorata
        });

        console.log(`✅ Item sièges supprimé, crédit appliqué`);
      }

      // 6. Mettre à jour la base de données locale (seulement si changement)
      if (subscription.seatQuantity !== additionalSeats) {
        await mongoDb.collection("subscription").updateOne(
          { _id: subscription._id },
          {
            $set: {
              seatQuantity: additionalSeats,
              updatedAt: new Date(),
            },
          }
        );
        console.log(`📝 BDD mise à jour: seatQuantity = ${additionalSeats}`);
      } else {
        console.log(`📝 BDD déjà à jour (seatQuantity = ${additionalSeats})`);
      }

      // Récupérer les prix pour les logs
      const prices = await this.getPricesFromStripe();
      const totalCost = prices.baseCost + additionalSeats * prices.seatCost;

      console.log(
        `✅ Synchronisation terminée: ${additionalSeats} siège(s) additionnel(s)`
      );
      console.log(
        `💰 Facturation mensuelle: ${prices.baseCost}€ (Pro) + ${additionalSeats} × ${prices.seatCost}€ = ${totalCost}€`
      );

      return {
        success: true,
        seats: additionalSeats,
        totalCost,
      };
    } catch (error) {
      console.error("❌ Erreur synchronisation sièges:", error);
      console.error("Stack:", error.stack);
      throw error;
    }
  }

  /**
   * ✅ ACTIVÉ - Synchronise les sièges après suppression d'un membre
   * Utilise la même logique que l'acceptation d'invitation
   * Permet de réduire la facturation quand des membres sont supprimés
   *
   * @param {string} organizationId - ID de l'organisation
   * @param {Object} adapter - Adapter Better Auth
   * @returns {Promise<Object>} Résultat de la synchronisation
   */
  async syncSeatsAfterMemberRemoved(organizationId, adapter) {
    console.log(
      `🔄 [SEAT SYNC] Synchronisation après suppression de membre pour organisation ${organizationId}`
    );

    try {
      // Réutiliser la même logique que pour l'acceptation d'invitation
      // Cela va recalculer le nombre de sièges et mettre à jour Stripe si nécessaire
      return await this.syncSeatsAfterInvitationAccepted(organizationId, adapter);
    } catch (error) {
      console.error(
        `❌ [SEAT SYNC] Erreur synchronisation après suppression:`,
        error
      );
      // Ne pas propager l'erreur pour ne pas bloquer la suppression du membre
      return {
        success: false,
        message: `Erreur synchronisation: ${error.message}`,
      };
    }
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
      // Import MongoDB directement
      const { mongoDb } = await import("../lib/mongodb.js");

      const subscription = await mongoDb.collection("subscription").findOne({
        referenceId: organizationId,
      });

      if (!subscription) {
        return {
          hasSubscription: false,
          baseCost: 0,
          additionalSeats: 0,
          seatCost: 0,
          totalCost: 0,
        };
      }

      const additionalSeats = await this.getAdditionalSeatsCount(
        organizationId,
        adapter
      );

      // Récupérer les prix depuis Stripe
      const prices = await this.getPricesFromStripe();
      const seatCost = additionalSeats * prices.seatCost;
      const totalCost = prices.baseCost + seatCost;

      return {
        hasSubscription: true,
        baseCost: prices.baseCost,
        additionalSeats,
        seatCost,
        totalCost,
        currency: prices.baseCurrency,
      };
    } catch (error) {
      console.error("❌ Erreur récupération info facturation:", error);
      throw error;
    }
  }
}

// Export singleton
export const seatSyncService = new SeatSyncService();
