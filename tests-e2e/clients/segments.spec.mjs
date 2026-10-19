/**
 * Segments (groupes de contacts définis par des règles) : formulaire, résultats
 * des règles comparés à la base, modification, suppression. Organisation
 * « Clients » ; les résultats attendus sont calculés à partir des contacts
 * en base au moment du test (d'autres tests en ajoutent).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { verifierFormulaire } from "../champs.mjs";
import { connecte, SESSION_TOKEN_CLIENTS } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { CONTACTS, SEGMENTS } from "../donnees/clients.mjs";

const ORG = COMPTES.clients.organisation._id;
const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });

const ouvrirSegments = (page) => ouvrir(page, "/dashboard/clients/segments", { pret: page.getByText(SEGMENTS.lyonnais.name).first() });

async function nouveauSegment(page) {
  await page.getByRole("button", { name: "Nouveau segment" }).first().click();
  const fenetre = page.getByRole("dialog", { name: "Nouveau segment" });
  await expect(fenetre).toBeVisible();
  return fenetre;
}

/**
 * Choisit une option d'une liste déroulante (Radix) de la fenêtre, puis attend
 * qu'elle soit refermée : tant qu'elle est ouverte, le reste de la page est
 * masqué aux technologies d'assistance (et donc aux recherches par rôle).
 */
async function choisir(page, declencheur, option) {
  await declencheur.click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
}

/** Libellés possibles de la liste « champ » d'une règle (son texte affiche le champ choisi). */
const CHAMP_DE_REGLE = /^(Champ|Type de client|Nom|Email|Ville|Pays|Code postal|Assigné à|Bloqué|International|Date de création)$/;

/**
 * Règle n° `n` (0 = première) : champ, opérateur, valeur. Chaque règle est une
 * ligne (la liste « champ », la liste « opérateur », puis une liste ou une
 * saisie de valeur selon le champ).
 */
async function regle(page, fenetre, n, { champ, operateur, valeur }) {
  // La ligne : le plus proche bloc qui contient la liste « champ » et au moins une autre liste.
  const ligne = () => fenetre.getByRole("combobox").filter({ hasText: CHAMP_DE_REGLE }).nth(n).locator("xpath=ancestor::div[count(.//*[@role='combobox'])>=2][1]");
  if (champ) await choisir(page, ligne().getByRole("combobox").nth(0), champ);
  if (operateur) await choisir(page, ligne().getByRole("combobox").nth(1), operateur);
  if (valeur !== undefined) {
    // Selon le champ, la valeur se saisit (ville…) ou se choisit dans une liste (type…).
    const saisie = ligne().getByRole("textbox");
    const liste = ligne().getByRole("combobox").nth(2);
    await expect(saisie.or(liste), "Champ de valeur de la règle").toBeVisible();
    if (await saisie.count()) await saisie.fill(valeur);
    else await choisir(page, liste, valeur);
  }
}

async function segmentEnBase(filtre) {
  return (await base()).collection("clientsegments").findOne({ workspaceId: ORG, ...filtre });
}

async function ouvrirSegment(page, nom) {
  await ouvrirSegments(page);
  await page.getByText(nom, { exact: true }).first().click();
  await attendreCalme(page);
}

// --- Formulaire (organisation « Atelier ») -------------------------------------------

verifierFormulaire({
  nom: "Nouveau segment",
  ouvrir: async (page) => {
    await ouvrir(page, "/dashboard/clients/segments", { pret: page.getByRole("button", { name: /Nouveau segment|Créer un segment/ }).first() });
    await page.getByRole("button", { name: /Nouveau segment|Créer un segment/ }).first().click();
    const fenetre = page.getByRole("dialog", { name: "Nouveau segment" });
    await expect(fenetre).toBeVisible();
    return fenetre;
  },
  remplir: async (fenetre, v) => {
    if (v.nom !== undefined) await fenetre.getByPlaceholder("Ex: Entreprises parisiennes").fill(v.nom);
    if (v.description !== undefined) await fenetre.getByPlaceholder("Description optionnelle").fill(v.description);
  },
  valider: (fenetre) => fenetre.getByRole("button", { name: "Créer", exact: true }).click(),
  boutonValider: (fenetre) => fenetre.getByRole("button", { name: "Créer", exact: true }),
  valeurs: (cas) => ({ nom: `Segment ${cas}`.slice(0, 90), description: "" }),
  enregistre: async (v) => (v.nom || "").trim() ? (await base()).collection("clientsegments").findOne({ workspaceId: COMPTES.atelier.organisation._id, name: v.nom.trim() }) : null,
  champs: {
    "Nom du segment": {
      cle: "nom",
      obligatoire: true,
      lu: (doc) => doc.name,
      refuses: { "d'un seul caractère": "S", "de 101 caractères": "S".repeat(101) },
      acceptes: { "avec accents et apostrophe": "Clients d'Île-de-France", "texte piégé (balise image)": "<img src=x onerror=alert(1)>" },
    },
    Description: {
      cle: "description",
      lu: (doc) => doc.description,
      refuses: { "de 501 caractères": "d".repeat(501) },
    },
  },
});

test("Nom de segment refusé par le serveur : le message dit pourquoi", async ({ page }) => {
  await ouvrir(page, "/dashboard/clients/segments", { pret: page.getByRole("button", { name: /Nouveau segment|Créer un segment/ }).first() });
  await page.getByRole("button", { name: /Nouveau segment|Créer un segment/ }).first().click();
  const fenetre = page.getByRole("dialog", { name: "Nouveau segment" });
  await fenetre.getByPlaceholder("Ex: Entreprises parisiennes").fill("S");
  await fenetre.getByRole("button", { name: "Créer", exact: true }).click();
  await etape(page, "Message affiché", async () => {
    const message = page.locator("[data-sonner-toast]").first();
    await expect(message, "Aucun message après le refus").toBeVisible();
    const texte = (await message.innerText()).replace(/\s+/g, " ").trim();
    expect(texte, `Message qui n'explique rien : « ${texte} » (attendu : le nom doit faire au moins 2 caractères)`).toMatch(/caract|court|longueur|nom/i);
  }, { capture: "ecran" });
});

// --- Règles et résultats (organisation « Clients ») ----------------------------------

test.describe("Segments : règles et résultats", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_CLIENTS) });

  /** Les contacts affichés dans le détail d'un segment, comparés à ceux attendus en base. */
  async function verifierResultats(page, attendus, exclus) {
    for (const c of attendus) await expect(page.getByText(c.name, { exact: true }).first(), `« ${c.name} » doit être dans le segment`).toBeVisible();
    for (const c of exclus) await expect(page.getByText(c.name, { exact: true }), `« ${c.name} » ne doit pas être dans le segment`).toHaveCount(0);
  }

  test("« Ville est Lyon » : seuls les contacts lyonnais", async ({ page }) => {
    await ouvrirSegment(page, SEGMENTS.lyonnais.name);
    const lyonnais = await (await base()).collection("clients").find({ workspaceId: ORG, "address.city": "Lyon" }).toArray();
    await etape(page, "Contacts du segment", () => verifierResultats(page, lyonnais, [CONTACTS.particulier, CONTACTS.international]), { capture: "ecran" });
  });

  test("Créer un segment « Ville est Nantes » OU « Type est Particulier »", async ({ page }) => {
    await ouvrirSegments(page);
    const fenetre = await nouveauSegment(page);
    await fenetre.getByPlaceholder("Ex: Entreprises parisiennes").fill("Nantais ou particuliers");
    await choisir(page, fenetre.getByRole("combobox").first(), "Au moins une règle (OU)");
    await regle(page, fenetre, 0, { champ: "Ville", operateur: "est", valeur: "Nantes" });
    await fenetre.getByRole("button", { name: "Ajouter une règle" }).click();
    await regle(page, fenetre, 1, { champ: "Type de client", operateur: "est", valeur: "Particulier" });
    await etape(page, "Créer", async () => {
      await fenetre.getByRole("button", { name: "Créer", exact: true }).click();
      await expect(fenetre).toBeHidden();
    }, { capture: "ecran" });
    const doc = await segmentEnBase({ name: "Nantais ou particuliers" });
    expect(doc, "Segment enregistré").not.toBeNull();
    expect(doc.matchType).toBe("any");
    expect(doc.rules).toEqual([
      expect.objectContaining({ field: "address.city", operator: "equals", value: "Nantes" }),
      expect.objectContaining({ field: "type", operator: "equals", value: "INDIVIDUAL" }),
    ]);
    await page.getByText("Nantais ou particuliers", { exact: true }).first().click();
    await attendreCalme(page);
    await verifierResultats(page, [CONTACTS.particulier], [CONTACTS.complet, CONTACTS.international]);
  });

  test("Une règle sans valeur est refusée (sinon le segment ne veut rien dire)", async ({ page }) => {
    await ouvrirSegments(page);
    const fenetre = await nouveauSegment(page);
    await fenetre.getByPlaceholder("Ex: Entreprises parisiennes").fill("Règle vide");
    await regle(page, fenetre, 0, { champ: "Ville", operateur: "contient" });
    await fenetre.getByRole("button", { name: "Créer", exact: true }).click();
    await page.waitForTimeout(800);
    const grise = await fenetre.getByRole("button", { name: "Créer", exact: true }).isDisabled({ timeout: 2_000 }).catch(() => false);
    expect(grise || (await notification(page, /valeur/i).count()) > 0, "Une règle « Ville contient (rien) » a été acceptée sans message").toBe(true);
    expect(await segmentEnBase({ name: "Règle vide" }), "Segment à règle vide enregistré").toBeNull();
  });

  test("Modifier un segment : nouvelle règle enregistrée et appliquée", async ({ page }) => {
    await ouvrirSegments(page);
    const carte = page.locator("div").filter({ hasText: SEGMENTS.aModifier.name }).filter({ has: page.getByRole("button") }).last();
    await cliquer(page, carte.getByRole("button").last());
    await page.getByRole("menuitem", { name: "Modifier" }).click();
    const fenetre = page.getByRole("dialog", { name: "Modifier le segment" });
    await regle(page, fenetre, 0, { champ: "Bloqué", operateur: "est vrai" });
    await etape(page, "Enregistrer", async () => {
      await fenetre.getByRole("button", { name: "Enregistrer" }).click();
      await expect(fenetre).toBeHidden();
    }, { capture: "ecran" });
    const doc = await segmentEnBase({ _id: SEGMENTS.aModifier._id });
    expect(doc.rules).toEqual([expect.objectContaining({ field: "isBlocked", operator: "is_true" })]);
    await page.getByText(SEGMENTS.aModifier.name, { exact: true }).first().click();
    await attendreCalme(page);
    await verifierResultats(page, [CONTACTS.bloque], [CONTACTS.complet]);
  });

  test("Supprimer un segment : il disparaît, les contacts restent", async ({ page }) => {
    await ouvrirSegments(page);
    const carte = page.locator("div").filter({ hasText: SEGMENTS.aSupprimer.name }).filter({ has: page.getByRole("button") }).last();
    await cliquer(page, carte.getByRole("button").last());
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    const alerte = page.getByRole("alertdialog", { name: "Supprimer ce segment ?" });
    await etape(page, "Confirmer", async () => {
      await alerte.getByRole("button", { name: "Supprimer" }).click();
      await expect(alerte).toBeHidden();
    }, { capture: "ecran" });
    expect(await segmentEnBase({ _id: SEGMENTS.aSupprimer._id }), "Segment encore en base").toBeNull();
    expect(await (await base()).collection("clients").countDocuments({ _id: CONTACTS.bloque._id })).toBe(1);
    await expect(page.getByText(SEGMENTS.aSupprimer.name, { exact: true })).toHaveCount(0);
  });

  test("Un segment s'ouvre aussi au clavier", async ({ page }) => {
    await ouvrirSegments(page);
    const carte = page.getByText(SEGMENTS.lyonnais.name, { exact: true }).first();
    await carte.focus();
    const focusable = await carte.evaluate((e) => {
      const cible = e.closest("[tabindex], button, a, [role=button], [role=link]");
      return Boolean(cible);
    });
    expect(focusable, "La carte du segment n'est ni un bouton ni un lien : impossible de l'ouvrir au clavier").toBe(true);
  });
});
