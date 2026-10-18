/**
 * Morceaux communs aux documents pré-remplis (factures, devis, bons de
 * commande, bons de livraison, avoirs) : copie du client et de l'entreprise
 * telles que l'éditeur les enregistre, articles et totaux calculés.
 */
import { COMPTES, DANS, MAINTENANT } from "./base.mjs";

/** Client tel que copié dans un document. */
export function snapshotClient(c) {
  const { organisation: _, _id, ...reste } = c;
  return { ...reste, id: _id.toHexString(), documentFields: [], hasDifferentShippingAddress: false };
}

/** Informations d'entreprise copiées dans un document, pour un compte de test. */
export function entreprise(compte) {
  const org = COMPTES[compte].organisation;
  return {
    name: org.companyName,
    email: org.companyEmail,
    phone: org.companyPhone,
    siret: org.siret,
    vatNumber: org.vatNumber,
    companyStatus: "SASU",
    capitalSocial: "10000",
    rcs: "Paris B 987 654 321",
    transactionCategory: "SERVICES",
    vatPaymentCondition: "NONE",
    vatFranchise: false,
    address: { street: "1 rue de la Paix", city: "Paris", postalCode: "75001", country: "France" },
  };
}

export const ligne = (description, quantity, unitPrice, vatRate = 20) => ({ description, quantity, unitPrice, vatRate });

/** Articles avec les valeurs par défaut de l'éditeur. */
export const articles = (lignes) =>
  lignes.map((a) => ({ details: "", unit: "", discount: 0, discountType: "PERCENTAGE", progressPercentage: 100, vatExemptionText: "", ...a }));

/** Totaux d'un document sans remise, arrondis au centime. */
export function totaux(lignes) {
  const arrondi = (n) => Math.round(n * 100) / 100;
  const ht = arrondi(lignes.reduce((t, a) => t + a.quantity * a.unitPrice, 0));
  const tva = arrondi(lignes.reduce((t, a) => t + (a.quantity * a.unitPrice * a.vatRate) / 100, 0));
  const ttc = arrondi(ht + tva);
  return { totalHT: ht, totalVAT: tva, totalTTC: ttc, finalTotalHT: ht, finalTotalVAT: tva, finalTotalTTC: ttc };
}

/** Champs communs à un document de vente pré-rempli (devis, bon de commande, facture). */
export function documentVente({ compte, prefixe, numero, statut, emiseIlYa = 0, client, lignes, creeIlYa = 1 }) {
  const { utilisateur, organisation } = COMPTES[compte];
  const emise = DANS(-emiseIlYa);
  return {
    prefix: prefixe,
    number: numero,
    status: statut,
    issueDate: emise,
    issueYear: emise.getFullYear(),
    client: snapshotClient(client),
    companyInfo: entreprise(compte),
    items: articles(lignes),
    discount: 0,
    discountType: "PERCENTAGE",
    ...totaux(lignes),
    shipping: { billShipping: false, shippingAddress: null, shippingAmountHT: 0, shippingVatRate: 20 },
    showBankDetails: false,
    headerNotes: "",
    footerNotes: "",
    termsAndConditions: "",
    customFields: [],
    appearance: { headerBgColor: "#5b50FF", headerTextColor: "#ffffff", textColor: "#000000" },
    clientPositionRight: false,
    operationType: null,
    retenueGarantie: 0,
    escompte: 0,
    isReverseCharge: false,
    isVatExempt: false,
    linkedInvoices: [],
    workspaceId: organisation._id,
    createdBy: utilisateur._id,
    createdAt: DANS(-creeIlYa),
    updatedAt: MAINTENANT,
  };
}
