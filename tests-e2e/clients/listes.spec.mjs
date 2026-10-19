/**
 * Listes de contacts : le formulaire de création (tous les champs, compte
 * « Atelier »), puis chaque action sur les listes de l'organisation
 * « Clients », vérifiée en base : modifier, supprimer (sans toucher aux
 * contacts), ajouter et retirer des contacts, ouvrir une liste, rechercher.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { verifierFormulaire } from "../champs.mjs";
import { connecte, SESSION_TOKEN_CLIENTS } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { CONTACTS, LISTES_CLIENTS } from "../donnees/clients.mjs";

const id = (doc) => doc._id.toHexString();
const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });

async function listeEnBase(filtre) {
  return (await base()).collection("clientlists").findOne(filtre);
}

// --- Création : tous les champs (organisation « Atelier ») --------------------------

const ATELIER = COMPTES.atelier.organisation._id;

// Un refus du serveur fait planter l'enregistrement côté site (erreur de la console) :
// défaut couvert par son propre test ci-dessous, toléré ici pour juger chaque champ.
const ERREUR_CREATION_LISTE = /Erreur lors de la création de la liste/;

async function ouvrirNouvelleListe(page) {
  await ouvrir(page, "/dashboard/clients/listes", { pret: page.getByRole("button", { name: "Nouvelle liste" }) });
  await page.getByRole("button", { name: "Nouvelle liste" }).click();
  const fenetre = page.getByRole("dialog", { name: "Créer une nouvelle liste" });
  await expect(fenetre).toBeVisible();
  return fenetre;
}

test.describe("Nouvelle liste", () => {
  test.use({ erreursConsoleAutorisees: ERREUR_CREATION_LISTE });

verifierFormulaire({
  nom: "Nouvelle liste de contacts",
  ouvrir: ouvrirNouvelleListe,
  remplir: async (fenetre, v) => {
    if (v.nom !== undefined) await fenetre.getByLabel("Nom de la liste *").fill(v.nom);
    if (v.description !== undefined) await fenetre.getByLabel("Description").fill(v.description);
  },
  valider: (fenetre) => fenetre.getByRole("button", { name: "Créer la liste" }).click(),
  valeurs: (cas) => ({ nom: `Liste ${cas}`.slice(0, 90), description: `Créée par le cas ${cas}`.slice(0, 200) }),
  enregistre: async (v) => {
    const parNom = (v.nom || "").trim() ? { name: v.nom.trim() } : { description: (v.description || "").trim() };
    return listeEnBase({ workspaceId: ATELIER, ...parNom });
  },
  champs: {
    "Nom de la liste": {
      cle: "nom",
      obligatoire: true,
      lu: (doc) => doc.name,
      refuses: { "d'un seul caractère": "A", "de 101 caractères": "L".repeat(101) },
      acceptes: {
        "avec accents et apostrophe": "Clients d'Île-de-France",
        "avec chiffres": "Salon 2026",
        "texte piégé (balise image)": "<img src=x onerror=alert(1)>",
      },
    },
    Description: {
      cle: "description",
      lu: (doc) => doc.description,
      refuses: { "de 501 caractères": "d".repeat(501) },
      acceptes: { "avec ponctuation": "Relance : mars, avril & mai." },
    },
  },
});
});

test("Nom de liste refusé par le serveur : le message explique pourquoi, sans erreur technique", async ({ page }) => {
  const fenetre = await ouvrirNouvelleListe(page);
  await fenetre.getByLabel("Nom de la liste *").fill("A");
  await fenetre.getByRole("button", { name: "Créer la liste" }).click();
  await etape(page, "Message affiché", async () => {
    const message = page.locator("[data-sonner-toast]").first();
    await expect(message, "Aucun message après le refus").toBeVisible();
    const texte = (await message.innerText()).replace(/\s+/g, " ").trim();
    expect(texte, `Message technique affiché à l'utilisateur : « ${texte} »`).not.toMatch(/Cannot read|TypeError|undefined|null|properties of/i);
  }, { capture: "ecran" });
});

// --- Actions sur les listes (organisation « Clients ») ---------------------------

test.describe("Listes de contacts : actions", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_CLIENTS) });

  const ouvrirListes = (page) => ouvrir(page, "/dashboard/clients/listes", { pret: page.getByText(LISTES_CLIENTS.prospects.name).first() });
  const ligne = (page, nom) => page.getByRole("row").filter({ hasText: nom });

  async function actionDeListe(page, nom, action) {
    await cliquer(page, ligne(page, nom).getByRole("button").last());
    await page.getByRole("menuitem", { name: action, exact: true }).click();
  }

  test("Modifier une liste : nom et description enregistrés", async ({ page }) => {
    await ouvrirListes(page);
    await actionDeListe(page, LISTES_CLIENTS.aModifier.name, "Modifier");
    const fenetre = page.getByRole("dialog", { name: "Modifier la liste" });
    await expect(fenetre.getByLabel("Nom de la liste *")).toHaveValue(LISTES_CLIENTS.aModifier.name);
    await fenetre.getByLabel("Nom de la liste *").fill("Liste modifiée par le test");
    await fenetre.getByLabel("Description").fill("Nouvelle description");
    await etape(page, "Mettre à jour", async () => {
      await fenetre.getByRole("button", { name: "Mettre à jour" }).click();
      await expect(notification(page, "Liste mise à jour avec succès")).toBeVisible();
    }, { capture: "ecran" });
    const doc = await listeEnBase({ _id: LISTES_CLIENTS.aModifier._id });
    expect(doc.name).toBe("Liste modifiée par le test");
    expect(doc.description).toBe("Nouvelle description");
    await expect(ligne(page, "Liste modifiée par le test")).toBeVisible();
  });

  test("Modifier une liste en vidant son nom : refusé avec un message", async ({ page }) => {
    await ouvrirListes(page);
    await actionDeListe(page, LISTES_CLIENTS.prospects.name, "Modifier");
    const fenetre = page.getByRole("dialog", { name: "Modifier la liste" });
    await fenetre.getByLabel("Nom de la liste *").fill("   ");
    await fenetre.getByRole("button", { name: "Mettre à jour" }).click();
    await expect(notification(page, "Le nom de la liste est requis")).toBeVisible();
    expect((await listeEnBase({ _id: LISTES_CLIENTS.prospects._id })).name).toBe(LISTES_CLIENTS.prospects.name);
  });

  test("Supprimer une liste : la liste disparaît, ses contacts restent", async ({ page }) => {
    await ouvrirListes(page);
    await actionDeListe(page, LISTES_CLIENTS.aSupprimer.name, "Supprimer");
    const fenetre = page.getByRole("dialog", { name: "Supprimer la liste" });
    await etape(page, "Confirmer la suppression", async () => {
      await fenetre.getByRole("button", { name: "Supprimer" }).click();
      await expect(notification(page, "Liste supprimée avec succès")).toBeVisible();
    }, { capture: "ecran" });
    expect(await listeEnBase({ _id: LISTES_CLIENTS.aSupprimer._id }), "Liste encore en base").toBeNull();
    const contact = await (await base()).collection("clients").findOne({ _id: CONTACTS.particulier._id });
    expect(contact, "Le contact de la liste a été supprimé avec elle").not.toBeNull();
    await expect(ligne(page, LISTES_CLIENTS.aSupprimer.name)).toHaveCount(0);
  });

  test("Supprimer une liste puis annuler : rien ne change", async ({ page }) => {
    await ouvrirListes(page);
    await actionDeListe(page, LISTES_CLIENTS.prospects.name, "Supprimer");
    const fenetre = page.getByRole("dialog", { name: "Supprimer la liste" });
    await fenetre.getByRole("button", { name: "Annuler" }).click();
    await expect(fenetre).toBeHidden();
    expect(await listeEnBase({ _id: LISTES_CLIENTS.prospects._id })).not.toBeNull();
  });

  test("Ajouter des contacts à une liste : enregistrés dans la liste", async ({ page }) => {
    await ouvrirListes(page);
    await actionDeListe(page, LISTES_CLIENTS.prospects.name, "Ajouter des contacts");
    const fenetre = page.getByRole("dialog", { name: `Ajouter des contacts à « ${LISTES_CLIENTS.prospects.name} »` });
    await fenetre.getByPlaceholder("Rechercher un contact").fill("annoter");
    await attendreCalme(page);
    await fenetre.getByRole("checkbox", { name: `Sélectionner ${CONTACTS.aNoter.name}` }).check();
    await etape(page, "Ajouter", async () => {
      await fenetre.getByRole("button", { name: "Ajouter (1)" }).click();
      await expect(fenetre).toBeHidden();
    }, { capture: "ecran" });
    const doc = await listeEnBase({ _id: LISTES_CLIENTS.prospects._id });
    expect(doc.clients.map(String), "Contact ajouté à la liste").toContain(id(CONTACTS.aNoter));
  });

  test("Ajouter des contacts : sans sélection, le bouton reste grisé", async ({ page }) => {
    await ouvrirListes(page);
    await actionDeListe(page, LISTES_CLIENTS.prospects.name, "Ajouter des contacts");
    const fenetre = page.getByRole("dialog", { name: `Ajouter des contacts à « ${LISTES_CLIENTS.prospects.name} »` });
    await expect(fenetre.getByRole("button", { name: "Ajouter", exact: true })).toBeDisabled();
  });

  test("Retirer un contact d'une liste : il n'en fait plus partie, il existe toujours", async ({ page }) => {
    await ouvrir(page, `/dashboard/clients/listes?listId=${id(LISTES_CLIENTS.prospects)}`, { pret: page.getByRole("row").filter({ hasText: CONTACTS.aModifier.name }) });
    const rangee = page.getByRole("row").filter({ hasText: CONTACTS.aModifier.name });
    await cliquer(page, rangee.getByRole("button", { name: "Actions du client" }));
    await etape(page, "Retirer de la liste", async () => {
      await page.getByRole("menuitem", { name: "Retirer de la liste" }).click();
      await expect(notification(page, `Contact retiré de "${LISTES_CLIENTS.prospects.name}"`)).toBeVisible();
    }, { capture: "ecran" });
    const doc = await listeEnBase({ _id: LISTES_CLIENTS.prospects._id });
    expect(doc.clients.map(String)).not.toContain(id(CONTACTS.aModifier));
    expect(await (await base()).collection("clients").findOne({ _id: CONTACTS.aModifier._id })).not.toBeNull();
    await expect(rangee).toHaveCount(0);
  });

  test("Ouvrir une liste : seuls ses contacts sont affichés", async ({ page }) => {
    await ouvrir(page, `/dashboard/clients/listes?listId=${id(LISTES_CLIENTS.droits)}`, { pret: page.getByText(LISTES_CLIENTS.droits.name).first() });
    await attendreCalme(page);
    const doc = await listeEnBase({ _id: LISTES_CLIENTS.droits._id });
    const membres = await (await base()).collection("clients").find({ _id: { $in: doc.clients } }).toArray();
    for (const m of membres) await expect(page.getByRole("row").filter({ hasText: m.name }), `« ${m.name} » est dans la liste`).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: CONTACTS.particulier.name }), "Un contact hors liste est affiché").toHaveCount(0);
  });

  test("Rechercher une liste par une partie de son nom, sans accents ni majuscules", async ({ page }) => {
    await ouvrirListes(page);
    await page.getByPlaceholder("Rechercher une liste").fill("prosp");
    await attendreCalme(page);
    await expect(ligne(page, LISTES_CLIENTS.prospects.name)).toBeVisible();
    await expect(ligne(page, LISTES_CLIENTS.droits.name)).toHaveCount(0);
  });

  test("Créer une liste depuis le menu d'un contact : le contact y est ajouté", async ({ page }) => {
    await ouvrir(page, "/dashboard/clients", { pret: page.getByRole("row").filter({ hasText: CONTACTS.complet.name }) });
    await page.getByPlaceholder("Recherchez par nom, email ou SIRET...").fill(CONTACTS.international.name);
    await attendreCalme(page);
    const rangee = page.getByRole("row").filter({ hasText: CONTACTS.international.name });
    await cliquer(page, rangee.getByRole("button", { name: "Actions du client" }));
    await page.getByRole("menuitem", { name: "Ajouter à une liste" }).click();
    await page.getByRole("menuitem", { name: "Créer une liste" }).click();
    const fenetre = page.getByRole("dialog", { name: "Créer une nouvelle liste" });
    await fenetre.getByLabel("Nom de la liste *").fill("Liste créée depuis un contact");
    await fenetre.getByRole("button", { name: "Créer la liste" }).click();
    await expect(fenetre).toBeHidden();
    await expect
      .poll(async () => (await listeEnBase({ name: "Liste créée depuis un contact" }))?.clients?.map(String) ?? [], { message: "Le contact n'a pas été ajouté à la nouvelle liste" })
      .toContain(id(CONTACTS.international));
  });
});
