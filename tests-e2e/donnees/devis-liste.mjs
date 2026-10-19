/**
 * Devis pré-remplis de l'organisation « Liste », un par état, pour les tests
 * de la liste et des actions. Les tests qui modifient un devis ont chacun le
 * leur.
 */
import { CLIENTS, DANS, oid } from "./base.mjs";
import { documentVente, ligne } from "./documents.mjs";

function devis({ n, numero, statut, emiseIlYa = 0, valideDans = 30, client, lignes, reference = "" }) {
  return {
    _id: oid("devis", n),
    ...documentVente({ compte: "liste", prefixe: "D-092026", numero, statut, emiseIlYa, client, lignes, creeIlYa: 30 - (n % 100) }),
    validUntil: DANS(valideDans),
    projectReference: reference,
    convertedToInvoice: null,
    pennylaneSyncStatus: "NOT_SYNCED",
    qontoSyncStatus: "NOT_SYNCED",
    abbySyncStatus: "NOT_SYNCED",
    emailTracking: { emailClickCount: 0, emailOpenCount: 0 },
  };
}

/** Les devis, par rôle dans les tests. */
export const DEVIS_LISTE = {
  brouillon: devis({ n: 101, numero: "DRAFT-0001", statut: "DRAFT", client: CLIENTS.gamma, lignes: [ligne("Étude de faisabilité", 1, 900)] }),
  brouillonASupprimer: devis({ n: 102, numero: "DRAFT-0002", statut: "DRAFT", client: CLIENTS.delta, lignes: [ligne("Devis jetable", 1, 60)] }),
  brouillonAEnvoyer: devis({ n: 103, numero: "DRAFT-0003", statut: "DRAFT", client: CLIENTS.gamma, lignes: [ligne("Refonte à chiffrer", 2, 750)] }),
  envoye: devis({ n: 104, numero: "0001", statut: "PENDING", emiseIlYa: 5, valideDans: 25, client: CLIENTS.gamma, lignes: [ligne("Application mobile", 1, 8000)], reference: "PROJ-GAMMA-01" }),
  expire: devis({ n: 105, numero: "0002", statut: "PENDING", emiseIlYa: 40, valideDans: -10, client: CLIENTS.delta, lignes: [ligne("Shooting photo", 1, 1200)] }),
  accepte: devis({ n: 106, numero: "0003", statut: "COMPLETED", emiseIlYa: 20, valideDans: 10, client: CLIENTS.gamma, lignes: [ligne("Charte graphique", 1, 3000)] }),
  annule: devis({ n: 107, numero: "0004", statut: "CANCELED", emiseIlYa: 30, valideDans: 0, client: CLIENTS.delta, lignes: [ligne("Projet abandonné", 1, 500)] }),
  aAccepter: devis({ n: 108, numero: "0005", statut: "PENDING", emiseIlYa: 3, valideDans: 27, client: CLIENTS.delta, lignes: [ligne("Campagne à accepter", 1, 1500)] }),
  aRejeter: devis({ n: 109, numero: "0006", statut: "PENDING", emiseIlYa: 2, valideDans: 28, client: CLIENTS.gamma, lignes: [ligne("Campagne à rejeter", 1, 1700)] }),
};

/** Référence affichée d'un devis (« D-092026-0001 », brouillons compris). */
export const referenceDevis = (d) => `${d.prefix}-${d.number}`;
