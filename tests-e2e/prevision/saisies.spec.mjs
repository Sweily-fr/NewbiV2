/**
 * Prévision de trésorerie : la saisie d'une prévision (tous les champs), sa
 * modification et sa suppression, les scénarios (création, saisie propre à
 * un scénario, suppression avec ses saisies, plafond de 5 à l'écran, bornes
 * des pourcentages), le détail d'un mois et l'export (contenu du fichier).
 * Lecture : « Achats » ; actions : « Saisie Achats ».
 */
import { readFileSync } from "node:fs";
import { test, expect, etape, fenetre } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { SAISIES, SAISIES_SAISIE, SCENARIOS } from "../donnees/lot-achats-banque.mjs";
import { SESSION_TOKEN_ACHATS, SESSION_TOKEN_FREELANCE_ACHATS, SESSION_TOKEN_SAISIE_ACHATS } from "../config.mjs";
import { connecteAchats } from "../achats-banque.mjs";
import { verifierFormulaire, marque } from "../champs.mjs";

// Par défaut : « Saisie Achats » (les descriptions de lecture visent « Achats »).
test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });

const URL = "/dashboard/outils/prevision";
const ORG_SAISIE = COMPTES.saisieAchats.organisation._id;
const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const entreeEnBase = async (doc) => (await base()).collection("manualcashflowentries").findOne({ _id: doc._id });

async function ouvrirPrevision(page) {
  await ouvrir(page, URL, { pret: page.getByRole("button", { name: /^12 mois$/ }) });
}

/** Bouton « Modifier » de la ligne d'une saisie (nom affiché dans la liste des saisies). */
async function modifierSaisie(page, saisie) {
  // Crayon de la ligne de la saisie (titre « Modifier ») ; les « Modifier » écrits sont ceux des récurrences détectées.
  await page.getByText(saisie.name, { exact: true }).first().locator("xpath=following::button[@title='Modifier'][1]").click();
  const dialogue = fenetre(page, "Modifier la saisie");
  await expect(dialogue).toBeVisible();
  return dialogue;
}

// --- Nouvelle saisie : tous les champs ---------------------------------------------------

function lettres(cas) {
  let h = 11;
  for (const c of marque(cas)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  let s = "";
  for (let i = 0; i < 6; i++, h = Math.floor(h / 26)) s += String.fromCharCode(97 + (h % 26));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function ouvrirSaisie(page) {
  await ouvrirPrevision(page);
  await page.getByRole("button", { name: "Ajouter une prévision" }).click();
  const dialogue = fenetre(page, "Nouvelle saisie");
  await expect(dialogue).toBeVisible();
  return dialogue;
}

async function remplir(dialogue, v) {
  if (v.type) await dialogue.getByRole("button", { name: v.type, exact: true }).click();
  if (v.nom !== undefined) await dialogue.getByPlaceholder("Ex: Loyer bureau").fill(v.nom);
  if (v.montant !== undefined) {
    const champ = dialogue.getByPlaceholder("0,00");
    await champ.fill("");
    if (v.montant) await champ.pressSequentially(v.montant);
  }
  if (v.notes !== undefined) await dialogue.getByPlaceholder("Ajouter un commentaire...").fill(v.notes);
}

verifierFormulaire({
  nom: "Nouvelle saisie de prévision",
  ouvrir: ouvrirSaisie,
  remplir,
  valider: (dialogue) => dialogue.getByRole("button", { name: "Ajouter", exact: true }).click(),
  boutonValider: (dialogue) => dialogue.getByRole("button", { name: "Ajouter", exact: true }),
  valeurs: (cas) => ({ nom: `Prévision ${lettres(cas)}`, montant: "250", notes: "" }),
  // La page affiche des montants négatifs en rouge : les messages se lisent dans la fenêtre.
  zoneErreurs: (page) => page.getByRole("dialog").last(),
  enregistre: async (v) => (await base()).collection("manualcashflowentries").findOne({ workspaceId: ORG_SAISIE, name: (v.nom || "").trim() || "__aucun__" }),
  champs: {
    Libellé: {
      cle: "nom",
      obligatoire: true,
      lu: (doc) => doc.name,
      acceptes: {
        "avec ligature œ (Cœur de métier)": "Cœur de métier : sous-traitance",
        "avec apostrophe typographique (Loyer de l’entrepôt)": "Loyer de l’entrepôt Nord",
        "texte piégé (balise image)": "<img src=x onerror=alert(1)> prévision",
      },
    },
    "Montant prévu": {
      cle: "montant",
      obligatoire: true,
      sansEspaces: true,
      lu: (doc) => doc.amount,
      normaliser: (v) => Number(v.replace(",", ".")),
      refuses: { "à zéro": "0", négatif: "-100" },
      // Saisie au point décimal : le navigateur des tests (format anglais) ignore la virgule dans un champ numérique.
      acceptes: { "avec centimes (1234.56)": "1234.56" },
    },
    Commentaire: {
      cle: "notes",
      lu: (doc) => doc.notes,
      acceptes: { "avec apostrophe et accents": "Révision prévue d’ici l’été" },
    },
  },
  combinaisons: {
    "Entrée (encaissement) de 5 000 €": { valeurs: { type: "Entrée", nom: "Prévision entrée subvention", montant: "5000" }, accepte: true },
  },
});

test.describe("Nouvelle saisie : ce qui est enregistré", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });

  test("Entrée mensuelle : type, montant, fréquence et date de début enregistrés", async ({ page }) => {
    const dialogue = await ouvrirSaisie(page);
    await remplir(dialogue, { type: "Entrée", nom: "Abonnements clients mensuels", montant: "1500" });
    await dialogue.getByRole("switch").first().click();
    await dialogue.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(dialogue).toBeHidden({ timeout: 15_000 });
    const doc = await (await base()).collection("manualcashflowentries").findOne({ workspaceId: ORG_SAISIE, name: "Abonnements clients mensuels" });
    expect({ type: doc.type, montant: doc.amount, frequence: doc.frequency, scenario: doc.scenarioId }).toEqual({ type: "INCOME", montant: 1500, frequence: "MONTHLY", scenario: null });
  });

  test("Le calendrier de la date de la saisie est en français", async ({ page }) => {
    const dialogue = await ouvrirSaisie(page);
    await dialogue.getByRole("button", { name: /\d{1,2} [a-zéû]+\.? \d{4}/ }).first().click();
    const calendrier = page.locator("[data-radix-popper-content-wrapper]").last();
    await expect(calendrier).toBeVisible();
    const mois = MOIS[new Date().getMonth()].toLowerCase();
    await etape(page, "Mois et jours en français", async () => {
      expect((await calendrier.innerText()).toLowerCase(), "Le calendrier de la saisie affiche les mois en anglais").toContain(mois);
    }, { capture: "ecran" });
  });
});

// --- Modifier, supprimer, scénarios (« Saisie Achats ») -----------------------------------

test.describe("Prévision : chaque action vérifiée en base", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });

  test("Modifier une saisie : nouveau montant enregistré", async ({ page }) => {
    await ouvrirPrevision(page);
    const dialogue = await modifierSaisie(page, SAISIES_SAISIE.aModifier);
    const montant = dialogue.getByPlaceholder("0,00");
    await montant.fill("");
    await montant.pressSequentially("95.50");
    await dialogue.getByRole("button", { name: "Enregistrer" }).click();
    await expect(dialogue).toBeHidden({ timeout: 15_000 });
    expect((await entreeEnBase(SAISIES_SAISIE.aModifier)).amount).toBe(95.5);
  });

  test("Supprimer une saisie : plus en base", async ({ page }) => {
    await ouvrirPrevision(page);
    const dialogue = await modifierSaisie(page, SAISIES_SAISIE.aSupprimer);
    await dialogue.getByRole("button", { name: "Supprimer" }).click();
    const confirmation = page.getByRole("alertdialog");
    if (await confirmation.isVisible({ timeout: 2_000 }).catch(() => false)) await confirmation.getByRole("button", { name: /Supprimer/ }).click();
    await expect.poll(() => entreeEnBase(SAISIES_SAISIE.aSupprimer)).toBeNull();
  });

  test("Nouveau scénario (+10 % d'entrées, -5 % de sorties) : enregistré avec ses multiplicateurs", async ({ page }) => {
    await ouvrirPrevision(page);
    await page.getByRole("button", { name: "Base" }).click();
    await page.getByRole("menuitem", { name: "Nouveau scénario" }).click();
    const dialogue = fenetre(page, "Nouveau scénario");
    await dialogue.getByPlaceholder("Ex: Optimiste, Pessimiste...").fill("Scénario prudent 2027");
    const pourcents = dialogue.getByRole("spinbutton");
    await pourcents.nth(0).fill("10");
    await pourcents.nth(1).fill("-5");
    await dialogue.getByRole("button", { name: "Créer" }).click();
    await expect(dialogue).toBeHidden({ timeout: 15_000 });
    const doc = await (await base()).collection("forecastscenarios").findOne({ workspaceId: ORG_SAISIE, name: "Scénario prudent 2027" });
    expect({ entrees: doc.incomeMultiplier, sorties: doc.expenseMultiplier }).toEqual({ entrees: 1.1, sorties: 0.95 });
  });

  test("Nouveau scénario à +500 % d'entrées (multiplicateur 6, maximum 5) : refusé avec un message", async ({ page }) => {
    await ouvrirPrevision(page);
    await page.getByRole("button", { name: "Base" }).click();
    await page.getByRole("menuitem", { name: "Nouveau scénario" }).click();
    const dialogue = fenetre(page, "Nouveau scénario");
    await dialogue.getByPlaceholder("Ex: Optimiste, Pessimiste...").fill("Scénario irréaliste");
    await dialogue.getByRole("spinbutton").nth(0).fill("500");
    await dialogue.getByRole("button", { name: "Créer" }).click();
    await page.waitForTimeout(1_500);
    expect(await (await base()).collection("forecastscenarios").countDocuments({ workspaceId: ORG_SAISIE, name: "Scénario irréaliste" }), "Un scénario au multiplicateur 6 (+500 %) est enregistré").toBe(0);
  });

  test("Saisie ajoutée dans un scénario : rattachée au scénario, absente de Base", async ({ page }) => {
    await ouvrirPrevision(page);
    await page.getByRole("button", { name: "Base" }).click();
    await page.getByRole("menuitem", { name: new RegExp(SCENARIOS.aRenommer.name) }).click();
    await attendreCalme(page);
    await page.getByRole("button", { name: "Ajouter une prévision" }).click();
    const dialogue = fenetre(page, "Nouvelle saisie");
    await remplir(dialogue, { nom: "Prévision propre au scénario", montant: "320" });
    await dialogue.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(dialogue).toBeHidden({ timeout: 15_000 });
    const doc = await (await base()).collection("manualcashflowentries").findOne({ workspaceId: ORG_SAISIE, name: "Prévision propre au scénario" });
    expect(String(doc.scenarioId), "La saisie faite dans un scénario n'y est pas rattachée (elle modifie Base)").toBe(SCENARIOS.aRenommer._id.toHexString());
    await page.getByRole("button", { name: "Revenir à Base" }).click();
    await attendreCalme(page);
    await expect(page.getByText("Prévision propre au scénario")).toHaveCount(0);
  });

  test("Supprimer un scénario : ses saisies disparaissent avec lui", async ({ page }) => {
    await ouvrirPrevision(page);
    await page.getByRole("button", { name: "Base" }).click();
    const element = page.getByRole("menuitem", { name: new RegExp(SCENARIOS.aSupprimer.name) });
    await element.hover();
    await element.getByText("Modifier", { exact: true }).click();
    const dialogue = fenetre(page, "Modifier le scénario");
    await dialogue.getByRole("button", { name: "Supprimer" }).or(dialogue.getByText("Supprimer", { exact: true })).first().click();
    const confirmation = page.getByRole("alertdialog");
    if (await confirmation.isVisible({ timeout: 2_000 }).catch(() => false)) await confirmation.getByRole("button", { name: /Supprimer/ }).click();
    await expect.poll(async () => (await base()).collection("forecastscenarios").countDocuments({ _id: SCENARIOS.aSupprimer._id })).toBe(0);
    expect(await entreeEnBase(SAISIES_SAISIE.duScenario), "La saisie du scénario supprimé est restée").toBeNull();
  });
});

test.describe("Prévision : plafond de 5 scénarios à l'écran", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_FREELANCE_ACHATS) });

  test("Cinq scénarios : « Nouveau scénario » n'est plus proposé", async ({ page }) => {
    await ouvrirPrevision(page);
    await page.getByRole("button", { name: "Base" }).click();
    await expect(page.getByRole("menuitem", { name: SCENARIOS.freelance1.name, exact: false }).first()).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Nouveau scénario" })).toHaveCount(0);
  });
});

// --- Lecture (« Achats ») -------------------------------------------------------------------

test.describe("Prévision : détail d'un mois et export", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });

  test("Détail du mois en cours : les prévisions du mois (loyer, logiciel)", async ({ page }) => {
    await ouvrirPrevision(page);
    const maintenant = new Date();
    await page.locator("main button").filter({ hasText: /^[A-ZÉÛ][a-zéû]{2}\.\d{2}$/ }).first().click();
    const dialogue = fenetre(page, `${MOIS[maintenant.getMonth()]} ${maintenant.getFullYear()}`);
    await expect(dialogue).toBeVisible();
    await dialogue.getByRole("button", { name: "Prévision" }).click();
    await expect(dialogue.getByText(SAISIES.loyer.name).first()).toBeVisible();
    await expect(dialogue.getByText(SAISIES.logiciel.name).first()).toBeVisible();
  });

  test("Export CSV : les prévisions de chaque mois", async ({ page }) => {
    await ouvrirPrevision(page);
    await page.getByRole("button", { name: "Exporter" }).click();
    const dialogue = fenetre(page, "Exporter la prévision");
    const [telechargement] = await Promise.all([page.waitForEvent("download"), dialogue.getByRole("button", { name: "Télécharger le CSV" }).click()]);
    expect(telechargement.suggestedFilename()).toMatch(/^prevision-tresorerie_\d{4}-\d{2}-\d{2}\.csv$/);
    const chemin = test.info().outputPath("prevision.csv");
    await telechargement.saveAs(chemin);
    const contenu = readFileSync(chemin, "utf8");
    expect(contenu.split(/\r?\n/).length, "Fichier sans lignes").toBeGreaterThan(2);
    expect(contenu).toMatch(/1\s?200|1200/);
  });
});
