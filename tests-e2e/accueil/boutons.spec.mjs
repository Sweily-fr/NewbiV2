/**
 * Accueil : tous les boutons, pour le propriétaire, l'Éditeur et le Membre
 * (lecture seule) de « Pilotage ». Les liens qui partagent une adresse avec
 * un autre ne sont essayés ici qu'une fois : liens.spec.mjs les essaie tous.
 * La liste des banques est simulée (Bridge injoignable en CI).
 */
import { test, expect } from "../outils.mjs";
import { verifierBoutons } from "../exploration.mjs";
import { connecte, SESSION_TOKEN_PILOTAGE, SESSION_TOKEN_PILOTAGE_EDITEUR, SESSION_TOKEN_PILOTAGE_MEMBRE } from "../config.mjs";
import { ouvrirAccueil, cadreSolde } from "./outils-accueil.mjs";

const COMMUNS = {
  "button Tous les comptes": { fenetre: "(fenêtre sans titre)" },
  "button Voir tout": { navigation: "/dashboard/outils/transactions" },
  "link /dashboard/outils/analytiques/vue-densemble": { navigation: "/dashboard/outils/analytiques/vue-densemble" },
  "link /dashboard/outils/factures": { navigation: "/dashboard/outils/factures" },
  "link /dashboard/outils/factures-achat": { navigation: "/dashboard/outils/factures-achat" },
  "link /dashboard/outils/transactions": { navigation: "/dashboard/outils/transactions" },
  "link /dashboard/outils/devis": { navigation: "/dashboard/outils/devis" },
  "link /dashboard/outils/kanban": { navigation: "/dashboard/outils/kanban" },
  "link /": { parcours: "liens.spec.mjs : « Notifications non lues » (le clic ne fait rien)" },
  "link /dashboard/outils/transferts-fichiers": { navigation: "/dashboard/outils/transferts-fichiers" },
};
const CREATIONS = {
  "button Créer un devis": { navigation: "/dashboard/outils/devis/new" },
  "button Créer une facture": { navigation: "/dashboard/outils/factures/new" },
  "button Ajouter une facture d'achat": { navigation: /\/dashboard\/outils\/factures-achat/, fenetre: "Nouvelle facture d'achat" },
  "button Transférer un fichier": { navigation: /\/dashboard\/outils\/transferts-fichiers/, fenetre: "Nouveau transfert" },
  "link /dashboard/outils/factures/new": { navigation: "/dashboard/outils/factures/new" },
};

test.describe("Accueil (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });
  verifierBoutons({
    test,
    titre: "Accueil",
    ouvrir: ouvrirAccueil,
    boutons: {
      ...COMMUNS,
      ...CREATIONS,
      // Bouton « + » du cadre Solde, sans nom : voir le test d'accessibilité ci-dessous
      "button ": { parcours: "boutons.spec.mjs : le bouton « + » du solde a un nom" },
    },
  });

  test("Le bouton « + » du cadre Solde porte un nom lisible (lecteur d'écran)", async ({ page }) => {
    await ouvrirAccueil(page);
    const bouton = cadreSolde(page).getByRole("button");
    await expect(bouton).toHaveCount(1);
    await expect(bouton, "Bouton sans nom accessible (une icône seule) : un lecteur d'écran annonce « bouton »").toHaveAccessibleName(/\S/);
  });
});

test.describe("Accueil (Éditeur)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE_EDITEUR) });
  verifierBoutons({ test, titre: "Accueil", ouvrir: ouvrirAccueil, boutons: { ...COMMUNS, ...CREATIONS } });
});

test.describe("Accueil (Membre, lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE_MEMBRE) });
  verifierBoutons({ test, titre: "Accueil", ouvrir: ouvrirAccueil, boutons: COMMUNS });
});
