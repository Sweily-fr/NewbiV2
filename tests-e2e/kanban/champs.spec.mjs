/**
 * Kanban : tous les champs du formulaire « Nouvelle liste » (création d'un
 * tableau). Le titre est obligatoire ; description, catégorie et couleur sont
 * libres. Chaque cas crée un tableau distinct, retrouvé en base par son titre.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { verifierFormulaire, marque } from "../champs.mjs";
import { connecte, SESSION_TOKEN_COLLAB } from "../config.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });

const COLLAB = COMPTES.collab.organisation._id;

async function ouvrirDialogue(page) {
  await ouvrir(page, "/dashboard/outils/kanban", { pret: page.getByRole("button", { name: "Nouvelle liste" }).first() });
  await page.getByRole("button", { name: "Nouvelle liste" }).first().click();
  const fenetre = page.getByRole("dialog").filter({ has: page.getByText("Nouvelle liste", { exact: true }) });
  await expect(fenetre).toBeVisible();
  await attendreCalme(page);
  return fenetre;
}

const boutonValider = (fenetre) => fenetre.getByRole("button", { name: /Créer la liste/ });

async function boardEnregistre(v) {
  return (await base()).collection("boards").findOne({ workspaceId: COLLAB, title: (v.title || "").trim() });
}

verifierFormulaire({
  nom: "Nouvelle liste (tableau kanban)",
  ouvrir: ouvrirDialogue,
  remplir: async (fenetre, v) => {
    if (v.title !== undefined) await fenetre.getByPlaceholder("Nom de la liste").fill(v.title);
    if (v.description !== undefined) await fenetre.getByPlaceholder("Description de la liste (optionnel)").fill(v.description);
  },
  valider: (fenetre) => boutonValider(fenetre).click(),
  valeurs: (cas) => ({ title: `Liste ${marque(cas)}`, description: "Objectif du trimestre" }),
  enregistre: boardEnregistre,
  champs: {
    Titre: {
      cle: "title",
      obligatoire: true,
      lu: (doc) => doc.title,
      acceptes: {
        "avec accents (Été à Paris)": "Été à Paris",
        "avec ligature œ (Nœud marketing)": "Nœud marketing",
        "avec apostrophe typographique": "L’atelier du mois",
        "avec n° (Sprint n° 3)": "Sprint n° 3",
        "long (120 caractères)": `Projet ${"a".repeat(112)}`,
      },
    },
    Description: {
      cle: "description",
      obligatoire: false,
      lu: (doc) => doc.description,
      acceptes: { "avec accents et œil": "Suivi des tâches œuvre à livrer" },
    },
  },
});
