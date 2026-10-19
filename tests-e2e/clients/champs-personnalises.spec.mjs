/**
 * Champs personnalisés des contacts (organisation « Réglages ») : création de
 * chaque type, contrôles du formulaire, renommage, désactivation, affichage
 * sur les documents, suppression (y compris d'un champ qui a des valeurs),
 * puis saisie des valeurs dans la fiche contact, justes et fausses.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { verifierFormulaire } from "../champs.mjs";
import { connecte, SESSION_TOKEN_REGLAGES } from "../config.mjs";
import { COMPTES, oid } from "../donnees/base.mjs";
import { CHAMPS_REGLAGES, CONTACT_AVEC_VALEUR } from "../donnees/clients.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_REGLAGES) });

const ORG = COMPTES.reglages.organisation._id;
const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });
const champEnBase = async (filtre) => (await base()).collection("clientcustomfields").findOne({ workspaceId: ORG, ...filtre });

async function ouvrirChamps(page) {
  await ouvrir(page, "/dashboard/clients", { pret: page.getByRole("button", { name: "Champs" }) });
  await page.getByRole("button", { name: "Champs" }).click();
  const panneau = page.getByRole("dialog", { name: "Champs personnalisés clients" });
  await expect(panneau).toBeVisible();
  return panneau;
}

async function nouveauChamp(page) {
  const panneau = await ouvrirChamps(page);
  await panneau.getByRole("button", { name: /^(Nouveau champ|Créer un champ)$/ }).first().click();
  const fenetre = page.getByRole("dialog", { name: "Nouveau champ personnalisé" });
  await expect(fenetre).toBeVisible();
  return fenetre;
}

/** Ligne d'un champ dans le panneau (son nom, ses cases et ses boutons). */
const ligneDeChamp = (panneau, nom) => panneau.locator("div").filter({ hasText: nom }).filter({ has: panneau.page().locator("button") }).last();

const TYPES = {
  TEXT: "Texte court",
  TEXTAREA: "Texte long",
  NUMBER: "Nombre",
  DATE: "Date",
  SELECT: "Choix unique",
  MULTISELECT: "Choix multiple",
  CHECKBOX: "Case à cocher",
  URL: "Lien URL",
  EMAIL: "Email",
  PHONE: "Téléphone",
};

test.describe("Champs personnalisés : créer chaque type", () => {
  for (const [type, libelle] of Object.entries(TYPES)) {
    test(`Champ « ${libelle} » : créé avec le bon type`, async ({ page }) => {
      const fenetre = await nouveauChamp(page);
      const nom = `Champ de type ${libelle}`;
      await fenetre.getByLabel("Nom du champ *").fill(nom);
      await fenetre.getByRole("combobox").first().click();
      await page.getByRole("option", { name: libelle, exact: true }).click();
      if (type === "SELECT" || type === "MULTISELECT") {
        for (const option of ["Option A", "Option B"]) {
          await fenetre.getByPlaceholder("Nouvelle option...").fill(option);
          await fenetre.getByPlaceholder("Nouvelle option...").press("Enter");
        }
      }
      await etape(page, "Créer", async () => {
        await fenetre.getByRole("button", { name: "Créer", exact: true }).click();
        await expect(notification(page, "Champ créé avec succès")).toBeVisible();
      }, { capture: "ecran" });
      const doc = await champEnBase({ name: nom });
      expect(doc, "Champ enregistré").not.toBeNull();
      expect(doc.fieldType).toBe(type);
      if (type === "SELECT" || type === "MULTISELECT") expect(doc.options.map((o) => o.label)).toEqual(["Option A", "Option B"]);
    });
  }

  test("Choix unique sans option : refusé avec un message", async ({ page }) => {
    const fenetre = await nouveauChamp(page);
    await fenetre.getByLabel("Nom du champ *").fill("Choix sans option");
    await fenetre.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Choix unique", exact: true }).click();
    await fenetre.getByRole("button", { name: "Créer", exact: true }).click();
    await expect(notification(page, "Ajoutez au moins une option")).toBeVisible();
    expect(await champEnBase({ name: "Choix sans option" })).toBeNull();
  });

  test("Même nom qu'un champ existant : refusé avec un message", async ({ page }) => {
    const fenetre = await nouveauChamp(page);
    await fenetre.getByLabel("Nom du champ *").fill(CHAMPS_REGLAGES.texte.name);
    await fenetre.getByRole("button", { name: "Créer", exact: true }).click();
    await expect(notification(page, /existe déjà/)).toBeVisible();
    expect(await (await base()).collection("clientcustomfields").countDocuments({ workspaceId: ORG, name: CHAMPS_REGLAGES.texte.name })).toBe(1);
  });
});

verifierFormulaire({
  nom: "Nouveau champ personnalisé",
  ouvrir: nouveauChamp,
  remplir: async (fenetre, v) => {
    if (v.nom !== undefined) await fenetre.getByLabel("Nom du champ *").fill(v.nom);
  },
  valider: (fenetre) => fenetre.getByRole("button", { name: "Créer", exact: true }).click(),
  valeurs: (cas) => ({ nom: `Champ ${cas}`.slice(0, 90) }),
  enregistre: async (v) => ((v.nom || "").trim() ? champEnBase({ name: v.nom.trim() }) : null),
  champs: {
    "Nom du champ": {
      cle: "nom",
      obligatoire: true,
      lu: (doc) => doc.name,
      refuses: { "d'un seul caractère": "C", "de 101 caractères": "C".repeat(101) },
      acceptes: { "avec accents et apostrophe": "Date d'anniversaire du gérant", "texte piégé (balise image)": "<img src=x onerror=alert(1)>" },
    },
  },
});

test.describe("Champs personnalisés : modifier, désactiver, supprimer", () => {
  test("Renommer un champ : enregistré", async ({ page }) => {
    const panneau = await ouvrirChamps(page);
    await cliquer(page, ligneDeChamp(panneau, CHAMPS_REGLAGES.aRenommer.name).locator("button:has(svg.lucide-pen)"));
    const fenetre = page.getByRole("dialog", { name: "Modifier le champ" });
    await fenetre.getByLabel("Nom du champ *").fill("Champ renommé par le test");
    await fenetre.getByRole("button", { name: "Enregistrer" }).click();
    await expect(notification(page, "Champ modifié avec succès")).toBeVisible();
    expect((await champEnBase({ _id: CHAMPS_REGLAGES.aRenommer._id })).name).toBe("Champ renommé par le test");
  });

  test("Désactiver un champ : enregistré, il n'est plus proposé dans la fiche contact", async ({ page }) => {
    const panneau = await ouvrirChamps(page);
    await ligneDeChamp(panneau, CHAMPS_REGLAGES.aDesactiver.name).getByRole("switch").click();
    await expect.poll(async () => (await champEnBase({ _id: CHAMPS_REGLAGES.aDesactiver._id })).isActive).toBe(false);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Nouveau contact" }).click();
    const fiche = page.getByRole("dialog", { name: "Ajouter un client" });
    await expect(fiche.getByPlaceholder(CHAMPS_REGLAGES.texte.name)).toBeVisible();
    await expect(fiche.getByPlaceholder(CHAMPS_REGLAGES.aDesactiver.name), "Un champ désactivé est encore proposé").toHaveCount(0);
  });

  test("« Sur les documents » : enregistré", async ({ page }) => {
    const panneau = await ouvrirChamps(page);
    await ligneDeChamp(panneau, CHAMPS_REGLAGES.surDocuments.name).getByRole("checkbox").click();
    await expect.poll(async () => (await champEnBase({ _id: CHAMPS_REGLAGES.surDocuments._id })).showOnDocuments).toBe(true);
  });

  test("Supprimer un champ qui a des valeurs : supprimé, la fiche du contact reste lisible", async ({ page }) => {
    const panneau = await ouvrirChamps(page);
    await cliquer(page, ligneDeChamp(panneau, CHAMPS_REGLAGES.aSupprimer.name).locator("button:has(svg.lucide-trash2)"));
    const alerte = page.getByRole("alertdialog", { name: "Supprimer le champ" });
    await alerte.getByRole("button", { name: "Supprimer" }).click();
    await expect(notification(page, "Champ supprimé")).toBeVisible();
    expect(await champEnBase({ _id: CHAMPS_REGLAGES.aSupprimer._id })).toBeNull();
    await etape(page, "Fiche du contact qui avait une valeur", async () => {
      await ouvrir(page, `/dashboard/clients/${CONTACT_AVEC_VALEUR._id.toHexString()}`, { pret: page.getByText(CONTACT_AVEC_VALEUR.email).first() });
      await expect(page.getByText("Valeur qui va disparaître"), "La valeur d'un champ supprimé s'affiche encore").toHaveCount(0);
    }, { capture: "ecran" });
  });
});

test.describe("Champs personnalisés : saisie dans la fiche contact", () => {
  async function nouveauContact(page) {
    await ouvrir(page, "/dashboard/clients", { pret: page.getByRole("button", { name: "Nouveau contact" }) });
    await page.getByRole("button", { name: "Nouveau contact" }).click();
    const fiche = page.getByRole("dialog", { name: "Ajouter un client" });
    await expect(fiche).toBeVisible();
    await fiche.getByPlaceholder("Prénom", { exact: true }).fill("Valentin");
    await fiche.getByPlaceholder("123 Rue de la Paix").fill("3 rue des Champs");
    await fiche.getByPlaceholder("Paris", { exact: true }).fill("Rennes");
    await fiche.getByPlaceholder("75001").fill("35000");
    await fiche.getByPlaceholder("France", { exact: true }).fill("France");
    return fiche;
  }
  const contactEnBase = async (nom) => (await base()).collection("clients").findOne({ workspaceId: ORG, lastName: nom });
  const valeur = (doc, champ) => doc?.customFields?.find((c) => String(c.fieldId) === champ._id.toHexString())?.value;

  test("Une valeur pour chaque type : toutes enregistrées", async ({ page }) => {
    const fiche = await nouveauContact(page);
    await fiche.getByPlaceholder("Nom", { exact: true }).fill("Valeurs");
    await fiche.getByPlaceholder("client@exemple.com").fill("valeurs-perso@e2e.test");
    await fiche.getByPlaceholder(CHAMPS_REGLAGES.texte.name).fill("Salon professionnel");
    await fiche.getByPlaceholder(CHAMPS_REGLAGES.url.name).fill("https://www.exemple.fr");
    await fiche.getByPlaceholder(CHAMPS_REGLAGES.email.name).fill("compta@exemple.fr");
    await fiche.getByPlaceholder(CHAMPS_REGLAGES.telephone.name).fill("0123456789");
    await fiche.getByPlaceholder(CHAMPS_REGLAGES.texteLong.name).fill("Client rencontré au salon de Lyon.");
    await fiche.getByLabel(CHAMPS_REGLAGES.caseACocher.name).check();
    await fiche.getByRole("button", { name: "Créer un contact" }).click();
    await expect(fiche).toBeHidden({ timeout: 15_000 });
    const doc = await contactEnBase("Valeurs");
    expect(doc, "Contact enregistré").not.toBeNull();
    expect.soft(valeur(doc, CHAMPS_REGLAGES.texte)).toBe("Salon professionnel");
    expect.soft(valeur(doc, CHAMPS_REGLAGES.url)).toBe("https://www.exemple.fr");
    expect.soft(valeur(doc, CHAMPS_REGLAGES.email)).toBe("compta@exemple.fr");
    expect.soft(valeur(doc, CHAMPS_REGLAGES.telephone)).toBe("0123456789");
    expect.soft(valeur(doc, CHAMPS_REGLAGES.texteLong)).toBe("Client rencontré au salon de Lyon.");
    expect.soft(String(valeur(doc, CHAMPS_REGLAGES.caseACocher))).toBe("true");
  });

  for (const [libelle, champ, faux] of [
    ["E-mail", CHAMPS_REGLAGES.email, "pas-un-email"],
    ["Lien URL", CHAMPS_REGLAGES.url, "pas une adresse"],
    ["Téléphone", CHAMPS_REGLAGES.telephone, "abc"],
  ]) {
    test(`Champ « ${libelle} » avec une valeur fausse : refusé avec un message`, async ({ page }) => {
      const fiche = await nouveauContact(page);
      const nom = `Faux ${libelle.replace(/[^a-zA-Z]/g, "")}`;
      await fiche.getByPlaceholder("Nom", { exact: true }).fill(nom);
      await fiche.getByPlaceholder("client@exemple.com").fill(`faux-${libelle.replace(/[^a-z]/gi, "").toLowerCase()}@e2e.test`);
      await fiche.getByPlaceholder(champ.name).fill(faux);
      await fiche.getByRole("button", { name: "Créer un contact" }).click();
      await page.waitForTimeout(800);
      const messages = await page.locator(".text-red-500, .text-destructive, [data-sonner-toast][data-type=error]").count();
      expect(messages, `« ${faux} » accepté sans message dans un champ ${libelle}`).toBeGreaterThan(0);
      expect(await contactEnBase(nom), `« ${faux} » enregistré dans un champ ${libelle}`).toBeNull();
    });
  }

  test("Champ obligatoire vide : la fiche est refusée avec un message", async ({ page }) => {
    const obligatoire = { _id: oid("champClient", 199), name: "Numéro client obligatoire", fieldType: "TEXT", options: [], isRequired: true, isActive: true, showOnDocuments: false, order: 99, workspaceId: ORG, createdBy: COMPTES.reglages.utilisateur._id, createdAt: new Date(), updatedAt: new Date() };
    const champs = (await base()).collection("clientcustomfields");
    await champs.insertOne(obligatoire);
    try {
      const fiche = await nouveauContact(page);
      await fiche.getByPlaceholder("Nom", { exact: true }).fill("Sansnumero");
      await fiche.getByPlaceholder("client@exemple.com").fill("sans-numero@e2e.test");
      await fiche.getByRole("button", { name: "Créer un contact" }).click();
      await expect(page.locator(".text-red-500, [data-sonner-toast][data-type=error]").first()).toBeVisible();
      expect(await contactEnBase("Sansnumero"), "Contact enregistré sans le champ obligatoire").toBeNull();
    } finally {
      await champs.deleteOne({ _id: obligatoire._id });
    }
  });
});
