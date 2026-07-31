import { mongoDb } from "@/src/lib/mongodb";
import { toObjectId } from "@/src/lib/security";
import { mapOrganizationToCompanyInfo } from "@/src/utils/organizationCompanyInfo";

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

  try {
    const organization = await mongoDb
      .collection("organization")
      .findOne({ _id: toObjectId(String(document.workspaceId)) });

    if (!organization) return document?.companyInfo;

    return mapOrganizationToCompanyInfo(organization);
  } catch {
    // Repli impossible : on laisse le document tel quel plutôt que d'échouer
    // la génération du PDF.
    return document?.companyInfo;
  }
}
