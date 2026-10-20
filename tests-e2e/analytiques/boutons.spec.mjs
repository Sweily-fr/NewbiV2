/**
 * Analytiques, Vue d'ensemble et correspondance avec le plan comptable :
 * tous les boutons (propriétaire, et Membre pour les Analytiques).
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { verifierBoutons } from "../exploration.mjs";
import { connecte, SESSION_TOKEN_PILOTAGE, SESSION_TOKEN_PILOTAGE_MEMBRE } from "../config.mjs";

const ANALYTIQUES = {
  "button Année en cours": { fenetre: "(fenêtre sans titre)" },
  "tab Synthèse": { sansEffet: "onglet déjà affiché" },
  "tab Rentabilité": { etat: /\[selected\]/ },
  "tab Trésorerie": { etat: /\[selected\]/ },
  "tab Clients": { etat: /\[selected\]/ },
  "tab Taxes": { etat: /\[selected\]/ },
};
const ouvrirAnalytiques = (page) => ouvrir(page, "/dashboard/outils/analytiques", { pret: page.getByText("CA HT net", { exact: true }).first() });

const PERIODES_COURBE = ["Cumul mensuel", "Cumul trimestriel", "Cumul annuel", "30 derniers jours", "3 derniers mois", "12 derniers mois", "Période personnalisée"];

test.describe("Pilotage (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  verifierBoutons({ test, titre: "Analytiques", ouvrir: ouvrirAnalytiques, boutons: ANALYTIQUES });

  verifierBoutons({
    test,
    titre: "Vue d'ensemble",
    ouvrir: (page) => ouvrir(page, "/dashboard/outils/analytiques/vue-densemble", { pret: page.getByText("Encours Clients", { exact: true }) }),
    boutons: {
      "button Cumul annuel": { menu: PERIODES_COURBE },
      "button Cumul annuel > Cumul mensuel": { contenu: true },
      "button Cumul annuel > 30 derniers jours": { contenu: true },
      "button Cumul annuel > 12 derniers mois": { contenu: true },
      "button Cumul annuel > Période personnalisée": { menu: [] },
      "button Prévisions": { navigation: "/dashboard/outils/prevision" },
      "combobox icône chevron-down": { options: ["Mensuel", "Trimestriel", "Annuel"] },
    },
  });

  verifierBoutons({
    test,
    titre: "Correspondance avec le plan comptable",
    ouvrir: (page) => ouvrir(page, "/dashboard/analytics", { pret: page.getByPlaceholder("Rechercher par catégorie, compte PCG...") }),
    boutons: {
      "button Respecter les majuscules et les accents": { etat: /\[pressed\]/ },
      "tab Plan Comptable (PCG)": { sansEffet: "onglet unique, déjà affiché" },
      "combobox icône chevron-down": {
        options: ["Tous", "Incomes", "Taxes", "Misc.", "Home", "Shopping", "Health", "Bank", "Transport", "Business", "Education", "Food", "Entertainment", "Bills", "Transfers", "… 16 en tout"],
      },
    },
  });
});

test.describe("Pilotage (Membre, lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE_MEMBRE) });
  verifierBoutons({ test, titre: "Analytiques", ouvrir: ouvrirAnalytiques, boutons: ANALYTIQUES });
});
