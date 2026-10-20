/**
 * Kanban : tous les champs du formulaire « Nouvelle liste » (création d'un
 * tableau). Le titre est obligatoire (champ requis du navigateur, puis refus
 * du site s'il n'est que des espaces) ; description, catégorie et couleur sont
 * libres. Chaque cas crée un tableau distinct, retrouvé en base par son titre.
 *
 * La liste des tableaux journalise un avertissement de cache Apollo
 * (fusion des colonnes) : il est toléré ici, il ne concerne pas le formulaire.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { verifierFormulaire, marque } from "../champs.mjs";
import { connecte, SESSION_TOKEN_COLLAB } from "../config.mjs";

const APOLLO = /go\.apollo\.dev\/c\/err|An error occurred! For more details/;
test.use({ storageState: connecte(SESSION_TOKEN_COLLAB), erreursConsoleAutorisees: APOLLO });

const COLLAB = COMPTES.collab.organisation._id;

async function ouvrirDialogue(page) {
  await ouvrir(page, "/dashboard/outils/kanban", { pret: page.getByRole("button", { name: "Nouvelle liste" }).first() });
  await page.getByRole("button", { name: "Nouvelle liste" }).first().click();
  const fenetre = page.getByRole("dialog").filter({ has: page.getByText("Nouvelle liste", { exact: true }) });
  await expect(fenetre).toBeVisible();
  await attendreCalme(page);
  return fenetre;
}

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
  valider: (fenetre) => fenetre.getByRole("button", { name: /Créer la liste/ }).click(),
  valeurs: (cas) => ({ title: `Liste ${marque(cas)}`, description: "Objectif du trimestre" }),
  enregistre: boardEnregistre,
  champs: {
    Titre: {
      cle: "title",
      // Le champ est « required » : un titre vide est bloqué nativement (voir le
      // test dédié plus bas), et un titre d'espaces est refusé par le site.
      obligatoire: false,
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

test.describe("Nouvelle liste : le titre est requis", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB), erreursConsoleAutorisees: APOLLO });

  test("Titre vide : le navigateur bloque l'envoi, rien n'est enregistré", async ({ page }) => {
    const fenetre = await ouvrirDialogue(page);
    await fenetre.getByPlaceholder("Nom de la liste").fill("");
    await fenetre.getByRole("button", { name: /Créer la liste/ }).click();
    await etape(
      page,
      "Le champ requis est signalé, la fenêtre reste ouverte",
      async () => {
        const invalide = await fenetre.getByPlaceholder("Nom de la liste").evaluate((el) => !el.validity.valid);
        expect(invalide, "Le champ titre devrait être marqué invalide (required)").toBe(true);
        await expect(fenetre).toBeVisible();
      },
      { capture: "ecran" },
    );
    expect(await (await base()).collection("boards").findOne({ workspaceId: COLLAB, title: "" }), "Un tableau sans titre a été créé").toBeNull();
  });

  test("Titre d'espaces : refusé avec un message, rien n'est enregistré", async ({ page }) => {
    const fenetre = await ouvrirDialogue(page);
    await fenetre.getByPlaceholder("Nom de la liste").fill("   ");
    await fenetre.getByRole("button", { name: /Créer la liste/ }).click();
    await etape(
      page,
      "Un message signale le titre manquant",
      async () => {
        await expect(page.locator("[data-sonner-toast]")).toContainText(/titre est requis/i);
        await expect(fenetre).toBeVisible();
      },
      { capture: "ecran" },
    );
    expect(await (await base()).collection("boards").findOne({ workspaceId: COLLAB, title: "" }), "Un tableau au titre vide a été créé").toBeNull();
  });
});
