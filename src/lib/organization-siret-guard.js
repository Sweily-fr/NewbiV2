import { ObjectId } from "mongodb";
import {
  verifySiret,
  siretVerificationMessage,
  SIRET_VERIFICATION_ERRORS,
} from "./siret-verification.js";

/**
 * Contrôle serveur d'un SIRET modifié dans les paramètres de l'espace.
 *
 * L'inscription vérifie le SIRET au registre, mais elle peut désormais se
 * terminer sans SIRET : c'est alors dans les paramètres (web et mobile, tous
 * deux via `organization.update` de Better Auth) qu'il est saisi. Sans ce
 * contrôle, 14 chiffres quelconques y passaient, et le SIRET d'un autre
 * espace aussi.
 *
 * Seul un SIRET qui CHANGE est contrôlé : un espace existant dont le SIRET
 * n'a pas bougé s'enregistre comme avant, même s'il n'a jamais été vérifié.
 *
 * Registre injoignable : l'enregistrement passe, sans marque de
 * vérification. Bloquer les paramètres d'un client déjà installé le temps
 * d'une panne d'un service public serait disproportionné ; la vérification
 * fail-closed reste celle de l'inscription.
 *
 * @returns {Promise<
 *   { ok: true, data: Object | null } | { ok: false, message: string }
 * >} `data` complète la mise à jour (SIREN et preuve de vérification),
 *   `null` quand le SIRET n'est pas modifié.
 */
export async function checkOrganizationSiretUpdate({
  mongoDb,
  organizationId,
  userId,
  siret,
}) {
  if (typeof siret !== "string") return { ok: true, data: null };

  const normalized = siret.replace(/\s/g, "");
  const orgObjectId = new ObjectId(String(organizationId));

  const current = await mongoDb
    .collection("organization")
    .findOne({ _id: orgObjectId }, { projection: { siret: 1 } });

  // Comparaison sans espaces : un ancien SIRET saisi « 123 456 789 00012 »
  // et renvoyé tel quel n'est pas une modification.
  const currentSiret = (current?.siret || "").replace(/\s/g, "");
  if (normalized === currentSiret) return { ok: true, data: null };

  // SIRET retiré : plus rien à prouver, la vérification précédente ne vaut
  // plus pour cet espace.
  if (!normalized) {
    return { ok: true, data: { siret: "", siretVerifiedAt: null } };
  }

  // Un SIRET appartient à un seul espace, sauf aux espaces dont l'utilisateur
  // est déjà membre (même règle que /api/check-siret à l'inscription).
  const otherOrganizations = await mongoDb
    .collection("organization")
    .find(
      { siret: normalized, _id: { $ne: orgObjectId } },
      { projection: { _id: 1 } },
    )
    .toArray();

  if (otherOrganizations.length > 0) {
    const membership = await mongoDb.collection("member").findOne({
      userId: new ObjectId(String(userId)),
      organizationId: { $in: otherOrganizations.map((o) => o._id) },
    });
    if (!membership) {
      return {
        ok: false,
        message:
          "Ce numéro SIRET est déjà utilisé par un autre espace Newbi. Demandez une invitation à son administrateur.",
      };
    }
  }

  const verification = await verifySiret(normalized);

  if (verification.ok) {
    const company = verification.company;
    return {
      ok: true,
      data: {
        siret: company.siret,
        siren: company.siren,
        siretVerifiedAt: new Date(),
        siretVerificationSource: "recherche-entreprises.api.gouv.fr",
        denominationUniteLegale: company.denominationUniteLegale,
        activitePrincipale: company.activitePrincipale,
        dateCreationUniteLegale: company.dateCreation,
      },
    };
  }

  if (verification.reason === SIRET_VERIFICATION_ERRORS.SERVICE_UNAVAILABLE) {
    console.warn(
      `⚠️ [SIRET-GUARD] Registre injoignable, SIRET ${normalized} enregistré sans vérification (org ${organizationId})`,
    );
    return {
      ok: true,
      data: {
        siret: normalized,
        siren: normalized.slice(0, 9),
        siretVerifiedAt: null,
      },
    };
  }

  console.warn(
    `⚠️ [SIRET-GUARD] SIRET ${normalized} refusé pour l'org ${organizationId} (${verification.reason})`,
  );
  return { ok: false, message: siretVerificationMessage(verification.reason) };
}
