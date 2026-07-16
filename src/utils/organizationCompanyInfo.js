/**
 * Champs companyInfo dérivés des réglages de l'organisation, communs aux
 * devis, factures, bons de commande et avoirs :
 * - nom commercial (inclus uniquement si l'affichage est activé dans les paramètres)
 * - activité réglementée : titre professionnel (affiché dans les infos entreprise),
 *   organisme de rattachement, numéro professionnel et assurances (affichés en bas de page)
 */
export function getOrganizationCompanyExtras(organization) {
  return {
    commercialName: organization?.showCommercialName
      ? organization?.commercialName || ""
      : "",
    professionalTitle: organization?.isRegulatedActivity
      ? organization?.professionalTitle || ""
      : "",
    regulatoryBody: organization?.isRegulatedActivity
      ? organization?.regulatoryBody || ""
      : "",
    professionalNumber: organization?.isRegulatedActivity
      ? organization?.professionalNumber || ""
      : "",
    decennialInsurance: organization?.isRegulatedActivity
      ? organization?.decennialInsurance || ""
      : "",
    professionalLiabilityInsurance: organization?.isRegulatedActivity
      ? organization?.professionalLiabilityInsurance || ""
      : "",
  };
}
