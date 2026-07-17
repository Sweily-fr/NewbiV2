/**
 * Champs companyInfo dérivés des réglages de l'organisation, communs aux
 * devis, factures, bons de commande et avoirs :
 * - nom commercial (inclus uniquement si l'affichage est activé dans les paramètres)
 * - activité réglementée : titre professionnel (affiché dans les infos entreprise),
 *   organisme de rattachement, numéro professionnel et assurances (affichés en bas de page)
 */
/**
 * Construit le payload de mise à jour de l'organisation à partir des champs
 * "généraux" du formulaire de paramètres d'un document (infos entreprise,
 * nom commercial, activité réglementée, logo). La numérotation, les couleurs
 * et les notes restent locales au document et ne sont pas incluses.
 * Les champs absents du formulaire (undefined) conservent la valeur de
 * l'organisation pour ne rien écraser.
 */
export function buildCompanyOrganizationUpdate(values, organization) {
  const keep = (formValue, orgValue, fallback = "") =>
    formValue !== undefined && formValue !== null
      ? formValue
      : (orgValue ?? fallback);

  return {
    companyName: keep(values.companyName, organization?.companyName),
    companyEmail: keep(values.companyEmail, organization?.companyEmail),
    companyPhone: keep(values.companyPhone, organization?.companyPhone),
    website: keep(values.website, organization?.website),
    addressStreet: keep(values.addressStreet, organization?.addressStreet),
    addressCity: keep(values.addressCity, organization?.addressCity),
    addressZipCode: keep(values.addressZipCode, organization?.addressZipCode),
    addressCountry: keep(
      values.addressCountry,
      organization?.addressCountry,
      "France",
    ),
    logo: keep(values.logo, organization?.logo),
    commercialName: keep(values.commercialName, organization?.commercialName),
    showCommercialName: keep(
      values.showCommercialName,
      organization?.showCommercialName,
      false,
    ),
    isRegulatedActivity: keep(
      values.isRegulatedActivity,
      organization?.isRegulatedActivity,
      false,
    ),
    professionalTitle: keep(
      values.professionalTitle,
      organization?.professionalTitle,
    ),
    regulatoryBody: keep(values.regulatoryBody, organization?.regulatoryBody),
    professionalNumber: keep(
      values.professionalNumber,
      organization?.professionalNumber,
    ),
    decennialInsurance: keep(
      values.decennialInsurance,
      organization?.decennialInsurance,
    ),
    professionalLiabilityInsurance: keep(
      values.professionalLiabilityInsurance,
      organization?.professionalLiabilityInsurance,
    ),
  };
}

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
