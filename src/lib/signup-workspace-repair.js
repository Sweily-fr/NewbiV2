/**
 * Espace d'inscription manquant à l'étape « Votre entreprise ».
 *
 * L'espace provisoire est créé à la création du compte
 * (databaseHooks.user.create.after, src/lib/auth.js). Il peut manquer :
 * création échouée (non bloquante pour l'inscription), compte créé avant ce
 * mécanisme (16 comptes de mai et juin 2026 arrêtés à cette étape), ou
 * invité d'un espace non qualifié, qui doit déclarer sa propre entreprise.
 * L'étape répondait alors « Aucune organisation rattachée : recommencez
 * l'inscription », une impasse : l'adresse e-mail est déjà prise. Constaté le
 * 19/11/2026 par les tests de bout en bout de l'inscription.
 *
 * L'espace est maintenant recréé comme à l'inscription, une seule fois :
 * un verrou daté sur l'utilisateur empêche un double clic ou un second
 * onglet d'en créer deux.
 */
import { ObjectId } from "mongodb";
import { createOrganizationWithSubscription } from "./org-creation.js";

export const REPAIR_LOCK_FIELD = "signupWorkspaceRepairAt";
// Un verrou plus ancien (création interrompue) n'empêche pas de réessayer
export const REPAIR_LOCK_TTL_MS = 60 * 1000;

/**
 * Crée l'espace provisoire d'un utilisateur qui n'en a aucun.
 * @param {object} params
 * @param {object} params.mongoDb
 * @param {string} params.userId
 * @param {string} [params.userName] nom affiché provisoire de l'espace
 * @param {Date} [params.now]
 * @returns {Promise<{organizationId?: ObjectId, pending?: boolean}>}
 *   pending : une autre requête est en train de le créer
 */
export async function repairMissingSignupWorkspace({
  mongoDb,
  userId,
  userName,
  now = new Date(),
}) {
  const userObjectId = new ObjectId(String(userId));
  const claimed = await mongoDb.collection("user").findOneAndUpdate(
    {
      _id: userObjectId,
      $or: [
        { [REPAIR_LOCK_FIELD]: { $exists: false } },
        {
          [REPAIR_LOCK_FIELD]: {
            $lt: new Date(now.getTime() - REPAIR_LOCK_TTL_MS),
          },
        },
      ],
    },
    { $set: { [REPAIR_LOCK_FIELD]: now } },
    { projection: { _id: 1 } },
  );
  if (!claimed) return { pending: true };

  try {
    const name = String(userName || "").trim() || "Mon entreprise";
    const result = await createOrganizationWithSubscription({
      mongoDb,
      userId: String(userId),
      // Provisoire, comme à l'inscription : l'étape entreprise y écrit
      // aussitôt la raison sociale et la déclaration d'usage professionnel
      orgData: { companyName: name, orgName: name, orgType: "business" },
      // Pas d'essai sans carte : l'essai est celui de Stripe, au paiement
      appTrialDays: null,
      markOnboardingComplete: false,
    });
    return { organizationId: new ObjectId(result.organizationId) };
  } catch (error) {
    await mongoDb
      .collection("user")
      .updateOne({ _id: userObjectId }, { $unset: { [REPAIR_LOCK_FIELD]: "" } })
      .catch(() => {});
    throw error;
  }
}
