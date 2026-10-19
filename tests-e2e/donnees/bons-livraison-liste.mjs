/**
 * Bons de livraison pré-remplis de l'organisation « Liste », un par état,
 * pour les tests de la liste et des actions (chaque action a le sien).
 * Pas de prix : un bon de livraison ne liste que les articles et quantités.
 * Un brouillon s'affiche « Brouillon », sans numéro : chacun a son propre
 * transporteur pour retrouver sa ligne.
 */
import { CLIENTS, COMPTES, DANS, MAINTENANT, oid } from "./base.mjs";
import { entreprise, snapshotClient } from "./documents.mjs";

const { utilisateur, organisation } = COMPTES.liste;

function bonLivraison({ n, numero, statut, emiseIlYa = 0, livraisonDans = 3, client, articles, transporteur = "", suivi = "", recuPar = "" }) {
  const emise = DANS(-emiseIlYa);
  return {
    _id: oid("bonLivraison", n),
    prefix: "BL-202609",
    number: numero,
    status: statut,
    issueDate: emise,
    issueYear: emise.getFullYear(),
    deliveryDate: DANS(livraisonDans),
    client: snapshotClient(client),
    companyInfo: entreprise("liste"),
    items: articles.map(([description, quantity]) => ({ description, quantity, details: "", unit: "unité", reference: "" })),
    deliveryAddress: { fullName: client.name, street: client.address.street, postalCode: client.address.postalCode, city: client.address.city, country: "France" },
    carrier: transporteur,
    trackingNumber: suivi,
    notes: "",
    receivedBy: recuPar,
    receivedAt: recuPar ? DANS(-1) : null,
    headerNotes: "",
    footerNotes: "",
    termsAndConditions: "",
    customFields: [],
    clientPositionRight: false,
    sourceQuote: null,
    sourceInvoice: null,
    linkedInvoices: [],
    workspaceId: organisation._id,
    createdBy: utilisateur._id,
    createdAt: DANS(-(30 - (n % 100))),
    updatedAt: MAINTENANT,
  };
}

/** Les bons de livraison, par rôle dans les tests. */
export const BONS_LIVRAISON_LISTE = {
  brouillon: bonLivraison({ n: 101, numero: "DRAFT-0001", statut: "DRAFT", client: CLIENTS.gamma, articles: [["Cartons d'archives", 20]], transporteur: "Transports Brouillon" }),
  brouillonASupprimer: bonLivraison({ n: 102, numero: "DRAFT-0002", statut: "DRAFT", client: CLIENTS.delta, articles: [["Livraison jetable", 1]], transporteur: "Transports Jetables" }),
  brouillonAEmettre: bonLivraison({ n: 103, numero: "DRAFT-0003", statut: "DRAFT", client: CLIENTS.gamma, articles: [["Palette à émettre", 2]], transporteur: "Transports Émission" }),
  aExpedier: bonLivraison({ n: 104, numero: "0001", statut: "PENDING", emiseIlYa: 2, client: CLIENTS.gamma, articles: [["Imprimante laser", 1], ["Ramettes de papier", 10]], transporteur: "Chronopost" }),
  expedie: bonLivraison({ n: 105, numero: "0002", statut: "SHIPPED", emiseIlYa: 4, client: CLIENTS.delta, articles: [["Ordinateur portable", 3]], transporteur: "DHL", suivi: "JD014600003FR" }),
  livre: bonLivraison({ n: 106, numero: "0003", statut: "DELIVERED", emiseIlYa: 10, livraisonDans: -5, client: CLIENTS.gamma, articles: [["Chaises de bureau", 6]], transporteur: "Livraison en propre", recuPar: "Claire Martin" }),
  annule: bonLivraison({ n: 107, numero: "0004", statut: "CANCELED", emiseIlYa: 8, client: CLIENTS.delta, articles: [["Livraison annulée", 1]] }),
  aMarquerExpedie: bonLivraison({ n: 108, numero: "0005", statut: "PENDING", emiseIlYa: 1, client: CLIENTS.delta, articles: [["Colis à expédier", 1]] }),
  aMarquerLivre: bonLivraison({ n: 109, numero: "0006", statut: "SHIPPED", emiseIlYa: 3, client: CLIENTS.gamma, articles: [["Colis à livrer", 1]], transporteur: "Colissimo", suivi: "6A12345678901" }),
  aFacturer: bonLivraison({ n: 111, numero: "0008", statut: "DELIVERED", emiseIlYa: 6, livraisonDans: -2, client: CLIENTS.delta, articles: [["Colis à facturer", 4]], transporteur: "UPS", recuPar: "Marc Petit" }),
  aAnnuler: bonLivraison({ n: 110, numero: "0007", statut: "PENDING", emiseIlYa: 1, client: CLIENTS.gamma, articles: [["Colis à annuler", 1]] }),
};

/** Référence affichée : « BL-202609-0001 », ou « Brouillon » tant qu'il n'est pas émis. */
export const referenceBonLivraison = (b) => (b.status === "DRAFT" ? "Brouillon" : `${b.prefix}-${b.number}`);
