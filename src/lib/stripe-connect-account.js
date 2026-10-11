import { ObjectId } from "mongodb";
import { mongoDb } from "@/src/lib/mongodb";

/**
 * Compte Stripe Connect d'un espace, même règle que l'API (résolveur
 * `myStripeConnectAccount`) : le compte rattaché à l'espace
 * (`organizationId`, stocké en chaîne), sinon l'ancien compte rattaché à
 * l'utilisateur de la session (`userId`, avant le passage aux espaces) et
 * à aucun espace : un ancien compte déjà rattaché à un autre espace reste à
 * cet espace.
 *
 * Avec `accountId`, ne renvoie le compte que s'il est bien celui de l'espace
 * ou l'ancien compte de l'utilisateur : un id de compte Stripe venu du
 * client ne suffit jamais à lire ou à modifier un compte.
 *
 * @param {Object} params
 * @param {string} params.orgId - espace (déjà vérifié par l'appelant)
 * @param {string} params.userId - utilisateur de la session
 * @param {string} [params.accountId] - compte Stripe demandé par le client
 * @returns {Promise<Object|null>}
 */
export async function findOrgStripeConnectAccount({
  orgId,
  userId,
  accountId,
}) {
  const collection = mongoDb.collection("stripeconnectaccounts");
  const byAccount = accountId ? { accountId } : {};

  const orgAccount = await collection.findOne({
    ...byAccount,
    organizationId: String(orgId),
  });
  if (orgAccount) return orgAccount;

  if (!ObjectId.isValid(String(userId))) return null;
  return collection.findOne({
    ...byAccount,
    userId: new ObjectId(String(userId)),
    organizationId: { $in: [null, ""] },
  });
}
