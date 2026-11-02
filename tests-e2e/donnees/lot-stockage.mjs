/**
 * Données du stockage des espaces (comptes 80 à 84, comptes-collaboration.mjs).
 *
 *   - « Stockage Plein » (Freelance, 75 Go) : compteur à 75 Go, tout nouvel
 *     envoi est refusé ; propriétaire et un « Membre » (lecture seule, ne voit
 *     pas l'abonnement) ;
 *   - « Stockage Presque » (TPE, 400 Go) : compteur à 330 Go, alerte 80 %.
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
    alertLevel: totalBytes >= 75 * GO ? 100 : 80,
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
        75 * GO,
        { sharedDocuments: 60 * GO, kanban: 15 * GO },
        { [proprietaire]: 70 * GO, unattributed: 5 * GO },
      ),
      compteur(
        COMPTES_STOCKAGE.presque,
        330 * GO,
        { sharedDocuments: 330 * GO },
        { unattributed: 330 * GO },
      ),
    ],
  };
}
