/**
 * Import de contacts (organisation « Réglages ») avec de vrais fichiers :
 * CSV d'Excel français (point-virgule, accents, encodage Windows-1252), CSV
 * UTF-8, classeur .xlsx, fichiers vides ou faux, lignes invalides, doublons,
 * colonnes manquantes. Chaque contact importé est vérifié en base.
 */
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_REGLAGES } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_REGLAGES) });

const ORG = COMPTES.reglages.organisation._id;
const XLSX = createRequire(import.meta.url)("xlsx");
const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });
const contactEnBase = async (email) => (await base()).collection("clients").findOne({ workspaceId: ORG, email });

const EN_TETES = ["Type", "Nom", "Email", "Téléphone", "Adresse", "Ville", "Code postal", "Pays", "SIRET", "TVA"];

/** Écrit un fichier de test (texte ou octets) et renvoie son chemin. */
function fichier(nom, contenu) {
  const chemin = test.info().outputPath(nom);
  writeFileSync(chemin, contenu);
  return chemin;
}
const csv = (lignes, separateur = ";") => lignes.map((l) => l.join(separateur)).join("\r\n");

/** Ouvre l'import, dépose le fichier, passe à la correspondance des colonnes. */
async function deposer(page, chemin) {
  await ouvrir(page, "/dashboard/clients", { pret: page.getByRole("button", { name: "Importer" }) });
  await page.getByRole("button", { name: "Importer" }).click();
  const fenetre = page.getByRole("dialog", { name: /Importer des contacts/ });
  await expect(fenetre).toBeVisible();
  await fenetre.locator("input[type=file]").setInputFiles(chemin);
  return fenetre;
}

async function importer(page, chemin, { attendus }) {
  const fenetre = await deposer(page, chemin);
  await fenetre.getByRole("button", { name: "Suivant" }).click();
  await attendreCalme(page);
  const bouton = fenetre.getByRole("button", { name: /^Importer \d+ contact/ });
  await expect(bouton, `Bouton « Importer ${attendus} contact(s) »`).toHaveText(new RegExp(`Importer ${attendus} contact`));
  await etape(page, "Importer", async () => {
    await bouton.click();
    // « 3 contacts importés » ou « 1 erreur lors de l'import » : l'import doit se terminer.
    await expect(notification(page, /importé|erreur/).first(), "L'import ne se termine pas (« Import en cours » sans fin)").toBeVisible({ timeout: 30_000 });
    if (await notification(page, /erreur/).count()) {
      const details = (await fenetre.innerText().catch(() => "")).replace(/\s+/g, " ").trim().slice(0, 500);
      throw new Error(`L'import a échoué : ${details}`);
    }
  }, { capture: "ecran" });
  return fenetre;
}

test.describe("Import de contacts", () => {
  test("CSV d'Excel (point-virgule, UTF-8 avec BOM) : chaque contact enregistré avec ses valeurs", async ({ page }) => {
    const chemin = fichier(
      "contacts-excel.csv",
      "\uFEFF" +
        csv([
          EN_TETES,
          ["Entreprise", "Boulangerie Dupain", "contact@dupain.test", "0478123456", "12 place du Marché", "Lyon", "69002", "France", "55210055400013", "FR40552100554"],
          ["Particulier", "Hélène Lefèvre", "helene.lefevre@e2e.test", "0612345678", "4 rue des Écoles", "Grenoble", "38000", "France", "", ""],
          ["Entreprise", "Café de l'Hôtel de Ville", "cafe-hdv@e2e.test", "0145678901", "1 place de l'Hôtel de Ville", "Paris", "75004", "France", "82345678900021", ""],
        ]),
    );
    await importer(page, chemin, { attendus: 3 });
    const dupain = await contactEnBase("contact@dupain.test");
    expect(dupain, "Entreprise importée").not.toBeNull();
    expect.soft(dupain.name).toBe("Boulangerie Dupain");
    expect.soft(dupain.type).toBe("COMPANY");
    expect.soft(dupain.siret).toBe("55210055400013");
    expect.soft(dupain.vatNumber).toBe("FR40552100554");
    expect.soft(dupain.address?.city).toBe("Lyon");
    expect.soft(dupain.address?.postalCode).toBe("69002");
    expect.soft(dupain.phone, "Le téléphone du fichier doit être celui du contact").toBe("0478123456");
    const helene = await contactEnBase("helene.lefevre@e2e.test");
    expect(helene, "Particulier importé").not.toBeNull();
    expect.soft(helene.type).toBe("INDIVIDUAL");
    expect.soft(helene.address?.street).toBe("4 rue des Écoles");
    const cafe = await contactEnBase("cafe-hdv@e2e.test");
    expect.soft(cafe?.name, "Nom avec apostrophe et accents").toBe("Café de l'Hôtel de Ville");
  });

  test("CSV enregistré par Excel en Windows-1252 : les accents restent justes", async ({ page }) => {
    const texte = csv([EN_TETES, ["Entreprise", "Société Générale de Façades", "facades@e2e.test", "", "8 avenue Émile Zola", "Évry", "91000", "France", "62345678900015", ""]]);
    const octets = Buffer.from(texte, "latin1");
    const chemin = fichier("contacts-windows-1252.csv", octets);
    await importer(page, chemin, { attendus: 1 });
    const doc = await contactEnBase("facades@e2e.test");
    expect(doc, "Contact importé").not.toBeNull();
    expect(doc.name, "Accents abîmés à l'import (lecture en UTF-8 d'un fichier Windows-1252)").toBe("Société Générale de Façades");
    expect(doc.address?.city).toBe("Évry");
  });

  test("CSV séparé par des virgules, avec des guillemets : lu correctement", async ({ page }) => {
    const chemin = fichier(
      "contacts-virgules.csv",
      csv(
        [
          ["Type", "Nom", "Email", "Adresse", "Ville", "Code postal", "SIRET"],
          ["Entreprise", '"Dupont, Fils & Associés"', "dupont-fils@e2e.test", '"3, rue de la Gare"', "Tours", "37000", "12345678900011"],
        ],
        ",",
      ),
    );
    await importer(page, chemin, { attendus: 1 });
    const doc = await contactEnBase("dupont-fils@e2e.test");
    expect(doc?.name).toBe("Dupont, Fils & Associés");
    expect(doc?.address?.street).toBe("3, rue de la Gare");
  });

  test("Classeur Excel (.xlsx) : les contacts sont importés", async ({ page }) => {
    const feuille = XLSX.utils.aoa_to_sheet([EN_TETES, ["Entreprise", "Menuiserie Bois Doré", "bois-dore@e2e.test", "0299887766", "5 rue du Port", "Brest", "29200", "France", "52345678900012", ""]]);
    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Contacts");
    const chemin = fichier("contacts.xlsx", XLSX.write(classeur, { type: "buffer", bookType: "xlsx" }));
    await importer(page, chemin, { attendus: 1 });
    const doc = await contactEnBase("bois-dore@e2e.test");
    expect(doc?.name).toBe("Menuiserie Bois Doré");
    expect(doc?.address?.city).toBe("Brest");
  });

  test("Fichier sans ligne de données : message clair, rien d'importé", async ({ page }) => {
    const chemin = fichier("vide.csv", csv([EN_TETES]));
    const fenetre = await deposer(page, chemin);
    await fenetre.getByRole("button", { name: "Suivant" }).click();
    await expect(notification(page, /au moins un en-tête et une ligne de données|aucune ligne de données/)).toBeVisible();
  });

  test("Fichier qui n'est pas un tableur : refusé avec un message", async ({ page }) => {
    const chemin = fichier("photo.txt", "ceci n'est pas un fichier de contacts");
    const fenetre = await deposer(page, chemin);
    const suivant = fenetre.getByRole("button", { name: "Suivant" });
    if (await suivant.isEnabled({ timeout: 2_000 }).catch(() => false)) await suivant.click();
    await page.waitForTimeout(800);
    const messages = await page.locator("[data-sonner-toast]:has(svg.text-red-500), .text-red-500, .text-destructive, [role=alert]").count();
    expect(messages + ((await suivant.isDisabled({ timeout: 2_000 }).catch(() => false)) ? 1 : 0), "Un fichier texte est accepté sans explication").toBeGreaterThan(0);
  });

  test("Lignes invalides (e-mail faux, entreprise sans SIRET) : écartées avec la raison, les autres importées", async ({ page }) => {
    const chemin = fichier(
      "lignes-invalides.csv",
      csv([
        EN_TETES,
        ["Entreprise", "Ligne valide SARL", "ligne-valide@e2e.test", "", "1 rue Haute", "Caen", "14000", "France", "12345678900011", ""],
        ["Entreprise", "Email faux SARL", "pas-un-email", "", "1 rue Basse", "Caen", "14000", "France", "12345678900011", ""],
        ["Entreprise", "Sans SIRET SARL", "sans-siret@e2e.test", "", "1 rue Neuve", "Caen", "14000", "France", "", ""],
      ]),
    );
    const fenetre = await deposer(page, chemin);
    await fenetre.getByRole("button", { name: "Suivant" }).click();
    await etape(page, "Les lignes écartées sont expliquées (le bouton annonce 1 contact sur 3)", async () => {
      await expect(fenetre.getByText(/Email invalide/).first()).toBeVisible();
      await expect(fenetre.getByText(/SIREN\/SIRET est obligatoire/).first()).toBeVisible();
    }, { capture: "ecran" });
    await fenetre.getByRole("button", { name: /^Importer 1 contact/ }).click();
    await expect(notification(page, /importé/)).toBeVisible({ timeout: 30_000 });
    expect(await contactEnBase("ligne-valide@e2e.test")).not.toBeNull();
    expect(await contactEnBase("sans-siret@e2e.test")).toBeNull();
  });

  test("Contact déjà existant (même e-mail) : signalé, pas de doublon", async ({ page }) => {
    const existant = { name: "Contact déjà là SARL", email: "deja-la@e2e.test" };
    await (await base()).collection("clients").insertOne({
      ...existant,
      type: "COMPANY",
      siret: "12345678900011",
      address: { street: "1 rue du Test", city: "Paris", postalCode: "75001", country: "France" },
      workspaceId: ORG,
      createdBy: COMPTES.reglages.utilisateur._id,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const chemin = fichier("doublon.csv", csv([EN_TETES, ["Entreprise", "Contact déjà là bis SARL", existant.email, "", "2 rue du Test", "Paris", "75001", "France", "12345678900011", ""]]));
    const fenetre = await deposer(page, chemin);
    await fenetre.getByRole("button", { name: "Suivant" }).click();
    await fenetre.getByRole("button", { name: /^Importer \d+ contact/ }).click();
    await page.waitForTimeout(1_500);
    expect(await (await base()).collection("clients").countDocuments({ workspaceId: ORG, email: existant.email }), "Doublon créé").toBe(1);
    const messages = await page.locator("[data-sonner-toast]:has(svg.text-red-500)").count();
    const succesAnnonce = await notification(page, /importé/).count();
    expect(messages, succesAnnonce ? "Le doublon refusé par l'API est annoncé « importé avec succès »" : "Le doublon n'est pas signalé").toBeGreaterThan(0);
  });

  test("Fichier avec seulement nom, e-mail et téléphone : les contacts sont importés", async ({ page }) => {
    const chemin = fichier("sans-adresse.csv", csv([["Type", "Nom", "Email", "Téléphone", "SIRET"], ["Entreprise", "Sans Adresse SARL", "sans-adresse@e2e.test", "0601020304", "12345678900011"]]));
    await importer(page, chemin, { attendus: 1 });
    expect(await contactEnBase("sans-adresse@e2e.test"), "Un fichier sans adresse ne peut pas être importé").not.toBeNull();
  });

  test("Texte piégé dans le fichier : importé comme du texte, jamais exécuté", async ({ page }) => {
    const piege = `<img src=x onerror="window.__piege=1">`;
    const chemin = fichier("piege.csv", csv([EN_TETES, ["Entreprise", "Piège importé SARL", "piege-import@e2e.test", "", piege, "Paris", "75001", "France", "12345678900011", ""]]));
    await importer(page, chemin, { attendus: 1 });
    const doc = await contactEnBase("piege-import@e2e.test");
    if (doc) {
      await ouvrir(page, `/dashboard/clients/${doc._id.toHexString()}`, { pret: page.getByText("piege-import@e2e.test").first() });
      await page.waitForTimeout(1_000);
      expect(await page.evaluate(() => window.__piege ?? null)).toBeNull();
    }
  });
});
