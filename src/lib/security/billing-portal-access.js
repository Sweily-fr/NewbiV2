import { ObjectId } from "mongodb";
import { mongoDb } from "@/src/lib/mongodb";
import {
  getOrgBillingScope,
  stripeCustomerPaysOtherWorkspaces,
} from "./org-stripe-customer";

/**
 * L'utilisateur est-il le titulaire de ce client Stripe ?
 *
 * @param {{ id?: string, stripeCustomerId?: string }} user
 * @param {string} customerId
 */
export async function isStripeCustomerOwner(user, customerId) {
  if (!customerId) return false;
  if (user?.stripeCustomerId) return user.stripeCustomerId === customerId;
  if (!ObjectId.isValid(user?.id)) return false;
  const doc = await mongoDb
    .collection("user")
    .findOne(
      { _id: new ObjectId(user.id) },
      { projection: { stripeCustomerId: 1 } },
    );
  return Boolean(doc?.stripeCustomerId) && doc.stripeCustomerId === customerId;
}

/**
 * Le portail Stripe couvre tout le client : abonnements, factures, carte,
 * coordonnées. Un client Stripe est celui d'un utilisateur et peut régler
 * plusieurs espaces. Pour l'espace `orgId`, le portail de `customerId`
 * s'ouvre au payeur, ou à un membre qui gère l'abonnement quand ce client
 * ne règle aucun autre espace. Le droit « Gérer l'abonnement » est vérifié
 * par l'appelant.
 *
 * @param {Object} params
 * @param {Object} [params.stripe] - client Stripe (contrôle complémentaire)
 * @param {{ id?: string, stripeCustomerId?: string }} params.user
 * @param {string} params.orgId
 * @param {string} params.customerId
 * @returns {Promise<boolean>}
 */
export async function canOpenBillingPortal({
  stripe,
  user,
  orgId,
  customerId,
}) {
  if (await isStripeCustomerOwner(user, customerId)) return true;
  const scope = await getOrgBillingScope(orgId, customerId);
  if (scope.paysOtherWorkspaces) return false;
  if (!stripe) return true;
  const paysOther = await stripeCustomerPaysOtherWorkspaces(
    stripe,
    customerId,
    orgId,
  );
  return paysOther !== true;
}

export const SHARED_PAYER_PORTAL_MESSAGE =
  "Le moyen de paiement de cet espace règle aussi d'autres espaces. Seule la personne qui paie l'abonnement peut ouvrir la gestion de la facturation.";
