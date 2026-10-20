/**
 * Prévision de trésorerie : tous les boutons de la page, pour le
 * propriétaire, l'Éditeur et le Membre de l'organisation « Achats » (jamais
 * modifiée). « Analyser » crée des récurrences dès le clic : il renvoie à
 * son parcours.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { verifierBoutons } from "../exploration.mjs";
import { SESSION_TOKEN_ACHATS, SESSION_TOKEN_EDITEUR_ACHATS, SESSION_TOKEN_LECTEUR_ACHATS } from "../config.mjs";
import { connecteAchats } from "../achats-banque.mjs";

const ouvrirPrevision = (page) => ouvrir(page, "/dashboard/outils/prevision", { pret: page.getByRole("button", { name: /^12 mois$/ }) });

// Douze mois à partir du mois en cours : « Oct.26 » ouvre « Octobre 2026 ».
const ABREGES = ["Jan.", "Fév.", "Mar.", "Avr.", "Mai.", "Jun.", "Jul.", "Aoû.", "Sep.", "Oct.", "Nov.", "Déc."];
const NOMS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const MOIS = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i);
    return [`button ${ABREGES[d.getMonth()]}${String(d.getFullYear()).slice(2)}`, { fenetre: `${NOMS[d.getMonth()]} ${d.getFullYear()}` }];
  }),
);
const COMMUNS = {
  "button Tous les comptes": { menu: ["Tous les comptes", "Compte courant pro ···0189", "Livret pro ···0123"] },
  "button Tous les comptes > Tous les comptes": { sansEffet: "tous les comptes déjà affichés" },
  "button Tous les comptes > Compte courant pro ···0189": { contenu: true },
  "button Tous les comptes > Livret pro ···0123": { contenu: true },
  "button 12 mois": { menu: ["6 mois", "12 mois", "24 mois", "Période personnalisée"] },
  "button 12 mois > 6 mois": { contenu: true },
  "button 12 mois > 12 mois": { sansEffet: "période déjà choisie" },
  "button 12 mois > 24 mois": { contenu: true },
  "button 12 mois > Période personnalisée": { contenu: true },
  ...MOIS,
};
const ECRITURE = {
  "button Base": { menu: ["Base", "Optimiste +20% / -10% Modifier", "Nouveau scénario"] },
  "button Base > Base": { sansEffet: "Base déjà affichée" },
  "button Base > Optimiste +20% / -10% Modifier": { contenu: true },
  "button Base > Nouveau scénario": { fenetre: "Nouveau scénario" },
  "button Ajouter une prévision": { fenetre: "Nouvelle saisie" },
  "button Exporter": { fenetre: "Exporter la prévision" },
  "button Modifier": { fenetre: "Modifier la saisie" },
  "button Analyser": { parcours: "prevision/securite.spec.mjs : relancer la détection des récurrences (crée des récurrences)" },
};

test.describe("Prévision (propriétaire)", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });
  verifierBoutons({ test, titre: "Prévision", ouvrir: ouvrirPrevision, boutons: { ...ECRITURE, ...COMMUNS } });
});

test.describe("Prévision (éditeur)", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_EDITEUR_ACHATS) });
  verifierBoutons({ test, titre: "Prévision", ouvrir: ouvrirPrevision, boutons: { ...ECRITURE, ...COMMUNS } });
});

test.describe("Prévision (membre, lecture seule)", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_LECTEUR_ACHATS) });
  verifierBoutons({
    test,
    titre: "Prévision",
    ouvrir: ouvrirPrevision,
    boutons: {
      "button Base": { menu: ["Base", "Optimiste +20% / -10%"] },
      "button Base > Base": { sansEffet: "Base déjà affichée" },
      "button Base > Optimiste +20% / -10%": { contenu: true },
      ...COMMUNS,
    },
  });

  test("Le détail d'un mois ne propose ni ajout ni suppression", async ({ page }) => {
    await ouvrirPrevision(page);
    await page.locator("main button").filter({ hasText: /^[A-ZÉÛ][a-zéû]{2}\.\d{2}$/ }).first().click();
    const dialogue = page.getByRole("dialog").last();
    await expect(dialogue).toBeVisible();
    await expect(dialogue.getByRole("button", { name: /Ajouter|Supprimer|Modifier/ })).toHaveCount(0);
  });
});
