import { mongoDb } from "@/src/lib/mongodb";
import { toObjectId } from "@/src/lib/security";
import { mapOrganizationToCompanyInfo } from "@/src/utils/organizationCompanyInfo";

/**
 * Charge l'organisation émettrice d'un document, ou null si introuvable.
 * @param {Object} document - document Mongo (invoice, quote, purchaseOrder, creditNote)
 * @returns {Promise<Object|null>}
 */
async function loadIssuerOrganization(document) {
  if (!document?.workspaceId) return null;

  try {
    return await mongoDb
      .collection("organization")
      .findOne({ _id: toObjectId(String(document.workspaceId)) });
  } catch {
    return null;
  }
}

/**
 * Renvoie le companyInfo à imprimer sur le PDF d'un document.
 *
 * Les brouillons n'ont volontairement pas de snapshot companyInfo en base :
 * côté GraphQL il est résolu à la volée depuis l'organisation. Les routes qui
 * alimentent la génération PDF lisent Mongo directement et n'avaient pas ce
 * repli : le PDF d'un brouillon sortait sans SIRET, RCS, capital, TVA ni
 * forme juridique. On reconstruit donc le snapshot depuis l'organisation
 * quand le document n'en porte pas encore.
 *
 * Un document finalisé garde toujours son propre snapshot : les informations
 * imprimées restent celles de l'émission.
 *
 * @param {Object} document - document Mongo (invoice, quote, purchaseOrder, creditNote)
 * @returns {Promise<Object|undefined>} companyInfo prêt pour le rendu
 */
export async function resolveCompanyInfo(document) {
  if (document?.companyInfo) return document.companyInfo;
  if (!document?.workspaceId) return document?.companyInfo;

  const organization = await loadIssuerOrganization(document);
  if (!organization) return document?.companyInfo;

  try {
    return mapOrganizationToCompanyInfo(organization);
  } catch {
    // Repli impossible : on laisse le document tel quel plutôt que d'échouer
    // la génération du PDF.
    return document?.companyInfo;
  }
}

/**
 * Nom à imprimer en « Nom du bénéficiaire » dans le bloc des coordonnées
 * bancaires.
 *
 * Ce réglage vit dans l'organisation (modale « Coordonnées bancaires ») et
 * n'est jamais recopié dans le document. L'aperçu de l'éditeur le résout via
 * la session et l'organisation active ; la génération PDF headless n'a ni
 * l'une ni l'autre et retombait donc systématiquement sur la dénomination de
 * l'entreprise — un entrepreneur individuel ayant choisi « Nom et prénom »
 * voyait son PDF archivé contredire son aperçu.
 *
 * @param {Object} document - document Mongo (invoice, quote, purchaseOrder)
 * @returns {Promise<{beneficiaryNameType: string, userName: string}>}
 */
export async function resolveBeneficiary(document) {
  const organization = await loadIssuerOrganization(document);
  if (!organization)
    return { beneficiaryNameType: "companyName", userName: "" };

  // Même défaut que l'éditeur : un entrepreneur individuel signe de son nom.
  const beneficiaryNameType =
    organization.beneficiaryNameType ||
    (["EI", "Auto-entrepreneur"].includes(organization.legalForm)
      ? "fullName"
      : "companyName");

  if (beneficiaryNameType !== "fullName") {
    return { beneficiaryNameType, userName: "" };
  }

  return {
    beneficiaryNameType,
    userName: await findOwnerName(organization._id),
  };
}

/**
 * Nom complet du propriétaire de l'organisation (l'entrepreneur), "" à défaut.
 * @param {Object} organizationId - _id de l'organisation
 * @returns {Promise<string>}
 */
async function findOwnerName(organizationId) {
  try {
    const owner = await mongoDb
      .collection("member")
      .findOne({ organizationId, role: "owner" });

    if (!owner?.userId) return "";

    // userId est stocké en ObjectId, mais d'anciens membres peuvent porter une
    // chaîne : on tente les deux plutôt que de renvoyer un nom vide.
    const user = await mongoDb.collection("user").findOne({
      _id:
        typeof owner.userId === "string"
          ? toObjectId(owner.userId)
          : owner.userId,
    });

    return user?.name || "";
  } catch {
    return "";
  }
}
