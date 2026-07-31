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
    // Franchise en base de TVA (art. 293 B du CGI) : embarquée dans le
    // document car elle pilote une mention obligatoire en pied de page.
    vatFranchise: organization?.vatFranchise ?? false,
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

/**
 * Construit un companyInfo complet à partir d'une organisation.
 *
 * L'organisation nomme ses champs companyName / companyEmail / addressStreet…,
 * alors que les documents et le PDF lisent name / email / address. Recopier
 * l'organisation telle quelle (spread) produit un objet dont aucune clé
 * d'identité ne correspond : le PDF affichait alors un nom et une adresse
 * vides. Cette fonction fait la traduction, en miroir de
 * mapOrganizationToCompanyInfo côté API.
 */
export function mapOrganizationToCompanyInfo(organization) {
  if (!organization) return {};

  const companyInfo = {
    ...getOrganizationCompanyExtras(organization),
    name: organization.companyName || "",
    email: organization.companyEmail || "",
    phone: organization.companyPhone || "",
    website: organization.website || "",
    logo: organization.logo || "",
    address: {
      street: organization.addressStreet || "",
      city: organization.addressCity || "",
      postalCode: organization.addressZipCode || "",
      country: organization.addressCountry || "France",
    },
    siren: organization.siren || "",
    siret: organization.siret || "",
    vatNumber: organization.vatNumber || "",
    rcs: organization.rcs || "",
    capitalSocial: organization.capitalSocial || "",
    // Le pied de page lit legalForm, le reste du document companyStatus :
    // les deux sont posés pour qu'aucun rendu ne se retrouve à court.
    legalForm: organization.legalForm || "",
    companyStatus: organization.legalForm || "",
    transactionCategory: organization.activityCategory || "",
    // Cohérent avec l'API : pas de repli sur le régime fiscal, qui
    // ressuscitait la mention après un décochage de l'assujettissement.
    // vatMode suffit, les écrans de réglages le vident déjà dans ce cas ;
    // isVatSubject est undefined pour les organisations ne l'ayant jamais
    // enregistré et masquerait alors un régime pourtant valide.
    vatPaymentCondition: organization.vatMode || "",
  };

  if (organization.bankIban || organization.bankBic || organization.bankName) {
    companyInfo.bankDetails = {
      iban: organization.bankIban || "",
      bic: organization.bankBic || "",
      bankName: organization.bankName || "",
    };
  }

  return companyInfo;
}
