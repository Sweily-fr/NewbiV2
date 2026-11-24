/**
 * Données du stockage des espaces (comptes 80 à 84, comptes-collaboration.mjs).
 *
 *   - « Stockage Plein » (Standard, 100 Go) : compteur à 100 Go, tout nouvel
 *     envoi est refusé ; propriétaire et un « Membre » (lecture seule, ne voit
 *     pas l'abonnement) ;
 *   - « Stockage Presque » (Premium, 500 Go) : compteur à 420 Go, alerte 80 % ;
 *   - « Stockage Entreprise » (Entreprise, 2 To) : compteur à 2 To, plein ;
 *     seule offre qui vend des packs, sans offre supérieure.
 *
 * Le compteur est écrit directement dans la collection workspace_storage_usage
 * (calcul récent, version courante) : l'API le reprend sans recalcul.
 */
import { MAINTENANT } from "./base.mjs";
import { compteLot, docsComptesLot, membreLot } from "./comptes-collaboration.mjs";

const GO = 1_000_000_000;

export const COMPTES_STOCKAGE = {
  plein: compteLot(80, {
    email: "stockage-plein@e2e.test",
    name: "Sacha Stockage",
    espace: "Stockage Plein SAS",
    plan: "freelance",
  }),
  presque: compteLot(82, {
    email: "stockage-presque@e2e.test",
    name: "Paula Presque",
    espace: "Stockage Presque SARL",
    plan: "pme",
  }),
  entreprise: compteLot(83, {
    email: "stockage-entreprise@e2e.test",
    name: "Emma Entreprise",
    espace: "Stockage Entreprise SA",
    plan: "entreprise",
  }),
};

export const MEMBRES_STOCKAGE = {
  membre: membreLot(81, {
    email: "stockage-membre@e2e.test",
    name: "Marc Membre",
    de: COMPTES_STOCKAGE.plein,
    role: "viewer",
  }),
};

function compteur(compte, totalBytes, byCategory, byUser) {
  return {
    workspaceId: compte.organisation._id.toHexString(),
    totalBytes,
    byCategory,
    byUser,
    fileCount: 12,
    unknownSizeCount: 0,
    computedAt: MAINTENANT,
    computingUntil: null,
    stale: false,
    version: 1,
    // Seuils déjà notifiés : aucune notification pendant les tests
    alertLevel: totalBytes >= 100 * GO ? 100 : 80,
    packs: { quantity: 0, interval: null, updatedAt: null },
    createdAt: MAINTENANT,
    updatedAt: MAINTENANT,
  };
}

export function donneesStockage() {
  const proprietaire = COMPTES_STOCKAGE.plein.utilisateur._id.toHexString();
  return {
    ...docsComptesLot({
      comptes: Object.values(COMPTES_STOCKAGE),
      membres: Object.values(MEMBRES_STOCKAGE),
    }),
    workspace_storage_usage: [
      compteur(
        COMPTES_STOCKAGE.plein,
        100 * GO,
        { sharedDocuments: 80 * GO, kanban: 20 * GO },
        { [proprietaire]: 95 * GO, unattributed: 5 * GO },
      ),
      compteur(
        COMPTES_STOCKAGE.presque,
        420 * GO,
        { sharedDocuments: 420 * GO },
        { unattributed: 420 * GO },
      ),
      compteur(
        COMPTES_STOCKAGE.entreprise,
        2000 * GO,
        { sharedDocuments: 2000 * GO },
        { unattributed: 2000 * GO },
      ),
    ],
  };
}
