/**
 * Bons de commande pré-remplis de l'organisation « Liste », un par état,
 * pour les tests de la liste et des actions (chaque action a le sien).
 */
import { CLIENTS, DANS, oid } from "./base.mjs";
import { documentVente, ligne } from "./documents.mjs";

function bonCommande({ n, numero, statut, emiseIlYa = 0, client, lignes, referenceDevis = "" }) {
  return {
    _id: oid("bonCommande", n),
    ...documentVente({ compte: "liste", prefixe: "BC-092026", numero, statut, emiseIlYa, client, lignes, creeIlYa: 30 - (n % 100) }),
    validUntil: DANS(30 - emiseIlYa),
    purchaseOrderNumber: referenceDevis,
    sourceQuoteId: null,
  };
}

/** Les bons de commande, par rôle dans les tests. */
export const BONS_COMMANDE_LISTE = {
  brouillon: bonCommande({ n: 101, numero: "DRAFT-0001", statut: "DRAFT", client: CLIENTS.gamma, lignes: [ligne("Fournitures de bureau", 10, 12)] }),
  brouillonASupprimer: bonCommande({ n: 102, numero: "DRAFT-0002", statut: "DRAFT", client: CLIENTS.delta, lignes: [ligne("Commande jetable", 1, 40)] }),
  enAttente: bonCommande({ n: 103, numero: "0001", statut: "CONFIRMED", emiseIlYa: 6, client: CLIENTS.gamma, lignes: [ligne("Licences logicielles", 5, 120)], referenceDevis: "D-092026-0003" }),
  valide: bonCommande({ n: 104, numero: "0002", statut: "VALIDATED", emiseIlYa: 12, client: CLIENTS.delta, lignes: [ligne("Mobilier de réunion", 1, 2400)] }),
  enCours: bonCommande({ n: 105, numero: "0003", statut: "IN_PROGRESS", emiseIlYa: 15, client: CLIENTS.gamma, lignes: [ligne("Installation réseau", 1, 1800)] }),
  livre: bonCommande({ n: 106, numero: "0004", statut: "DELIVERED", emiseIlYa: 25, client: CLIENTS.delta, lignes: [ligne("Écrans 27 pouces", 4, 300)] }),
  annule: bonCommande({ n: 107, numero: "0005", statut: "CANCELED", emiseIlYa: 20, client: CLIENTS.gamma, lignes: [ligne("Commande annulée", 1, 450)] }),
  aValider: bonCommande({ n: 108, numero: "0006", statut: "CONFIRMED", emiseIlYa: 2, client: CLIENTS.delta, lignes: [ligne("Commande à valider", 1, 650)] }),
  aDemarrer: bonCommande({ n: 109, numero: "0007", statut: "VALIDATED", emiseIlYa: 3, client: CLIENTS.gamma, lignes: [ligne("Commande à démarrer", 1, 720)] }),
  aLivrer: bonCommande({ n: 110, numero: "0008", statut: "IN_PROGRESS", emiseIlYa: 4, client: CLIENTS.delta, lignes: [ligne("Commande à livrer", 1, 830)] }),
  brouillonAConfirmer: bonCommande({ n: 112, numero: "DRAFT-0003", statut: "DRAFT", client: CLIENTS.delta, lignes: [ligne("Commande à confirmer", 3, 90)] }),
  aAnnuler: bonCommande({ n: 111, numero: "0009", statut: "CONFIRMED", emiseIlYa: 1, client: CLIENTS.gamma, lignes: [ligne("Commande à annuler", 1, 940)] }),
};

export const referenceBonCommande = (b) => `${b.prefix}-${b.number}`;
