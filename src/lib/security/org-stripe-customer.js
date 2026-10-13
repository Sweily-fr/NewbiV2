import { ObjectId } from "mongodb";
import { mongoDb } from "@/src/lib/mongodb";
import { apiError } from "./api-error";
import { requireOrgAction } from "./require-org-action";
import { withoutManagerCustomers } from "@/src/lib/manager-billing";

/**
 * Espace visé par une route de facturation : celui passé explicitement par
 * le client (vérifié ensuite comme n'importe quel autre), sinon l'espace
 * actif de la session.
 *
 * @param {Object} session - session Better Auth (`session.activeOrganizationId`)
 * @param {string|null|undefined} requestedOrgId - espace passé par le client
 * @returns {string}
 * @throws {NextResponse} 400 si aucun espace n'est désigné
 */
export function resolveBillingOrgId(session, requestedOrgId) {
  const orgId = requestedOrgId || session?.activeOrganizationId;
  if (!orgId || typeof orgId !== "string") {
    throw apiError(400, "Aucun espace actif");
  }
  return orgId;
}

/**
 * Clients Stripe rattachés à un espace, du plus récent au plus ancien : ceux
 * des documents `subscription` de l'espace (référencés par `referenceId` en
 * chaîne ou `organizationId` en ObjectId selon l'origine du document).
 * Le client Stripe d'un cabinet qui paie l'abonnement de l'espace en est
 * exclu : son portail et ses factures couvrent tous les espaces qu'il paie.
 *
 * @param {string} orgId
 * @returns {Promise<string[]>}
 */
export async function getOrgStripeCustomerIds(orgId) {
  const or = [{ referenceId: orgId }];
  if (ObjectId.isValid(orgId)) {
    or.push({ organizationId: new ObjectId(orgId) });
  }
  const docs = await mongoDb
    .collection("subscription")
    .find(
      { $or: or, stripeCustomerId: { $nin: [null, ""] } },
      { projection: { stripeCustomerId: 1 }, sort: { updatedAt: -1 } },
    )
    .toArray();
  return withoutManagerCustomers(mongoDb, [
    ...new Set(docs.map((d) => d.stripeCustomerId).filter(Boolean)),
  ]);
}

/**
 * Client Stripe de l'espace sur lequel l'utilisateur de la session a le
 * droit `billing.<action>` (« view » pour lire, « manage » pour agir).
 *
 * Un `customerId` envoyé par le client n'est accepté que s'il appartient à
 * l'espace : sans ce contrôle, n'importe quel utilisateur connecté pouvait
 * lire ou ouvrir le portail Stripe d'un autre client en changeant l'id.
 * Sans `customerId`, on prend le client de l'abonnement le plus récent.
 *
 * @param {Object} params
 * @param {string} params.userId - utilisateur de la session
 * @param {string} params.orgId - espace visé
 * @param {"view"|"manage"} params.action - droit exigé sur la facturation
 * @param {string|null} [params.customerId] - client demandé par le front
 * @returns {Promise<string|null>} le client Stripe, ou null si l'espace n'en a pas
 * @throws {NextResponse} 403 si le droit manque ou si le client n'est pas celui de l'espace
 */
export async function requireOrgStripeCustomer({
  userId,
  orgId,
  action,
  customerId = null,
}) {
  await requireOrgAction(userId, orgId, "billing", action);

  const customerIds = await getOrgStripeCustomerIds(orgId);

  if (customerId) {
    if (!customerIds.includes(customerId)) {
      throw apiError(
        403,
        "Non autorisé",
        `Client Stripe ${customerId} absent des abonnements de l'espace ${orgId}`,
      );
    }
    return customerId;
  }

  return customerIds[0] || null;
}
