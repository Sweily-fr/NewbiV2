/**
 * Prévision de trésorerie : droits vérifiés à l'API (saisies, scénarios,
 * prévisions mensuelles, récurrences détectées, occurrences) pour le Membre,
 * l'Éditeur, une autre entreprise et un visiteur (voir achats-banque.mjs).
 * Plus : le plafond de 5 scénarios et les bornes des valeurs tenus par
 * l'API, et un nom de prévision piégé qui reste du texte.
 */
import { ObjectId } from "mongodb";
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_EDITEUR_ACHATS, SESSION_TOKEN_SAISIE_ACHATS } from "../config.mjs";
import { ORGANISATION_BORNES, ORGANISATION_SCENARIOS, PREVISIONS_MENSUELLES, RECURRENCES, SAISIES, SAISIES_SAISIE, SCENARIOS } from "../donnees/lot-achats-banque.mjs";
import { appelApi, id } from "../securite.mjs";
import { base } from "../base.mjs";
import { oid } from "../donnees/base.mjs";
import { ORG, ORG_SAISIE, PIEGE, avecSession, connecteAchats, photo, verifierDroits, verifierPiegeInerte } from "../achats-banque.mjs";

/** Données visées : « Achats » (Membre, intrus, visiteur) ou « Saisie Achats » (écritures permises de l'Éditeur). */
const CIBLES = {
  [ORG]: { saisie: SAISIES.loyer, aSupprimer: SAISIES.logiciel, scenario: SCENARIOS.optimiste, prevision: PREVISIONS_MENSUELLES.achats, muter: RECURRENCES.orange, modifier: RECURRENCES.orange },
  [ORG_SAISIE]: { saisie: SAISIES_SAISIE.editeur, aSupprimer: SAISIES_SAISIE.editeur, scenario: SCENARIOS.editeur, prevision: PREVISIONS_MENSUELLES.saisie, muter: RECURRENCES.editeurMuter, modifier: RECURRENCES.editeurModifier },
};
const cibles = (w) => CIBLES[w] || CIBLES[ORG];
const parId = (doc) => ({ _id: doc._id });
const sansId = ({ _id, ...reste }) => reste;
const mois = (n = 0) => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
};
const aujourdhui = () => new Date().toISOString().slice(0, 10);
const orgDe = (w) => new ObjectId(w === ORG_SAISIE ? ORG_SAISIE : ORG);

const LECTURES = [
  {
    nom: "Les données de trésorerie",
    champ: "treasuryForecastData",
    requete: `query($w: ID, $debut: String!, $fin: String!) { treasuryForecastData(workspaceId: $w, startDate: $debut, endDate: $fin) { kpi { currentBalance } months { month forecastExpense } } }`,
    variables: (w) => ({ w, debut: `${mois(0)}-01`, fin: `${mois(3)}-28` }),
  },
  { nom: "Les scénarios", champ: "forecastScenarios", requete: `query($w: ID) { forecastScenarios(workspaceId: $w) { id name } }`, variables: (w) => ({ w }) },
  { nom: "Les prévisions mensuelles", champ: "treasuryForecasts", requete: `query($w: ID, $d: String!, $f: String!) { treasuryForecasts(workspaceId: $w, startMonth: $d, endMonth: $f) { id month forecastAmount } }`, variables: (w) => ({ w, d: mois(0), f: mois(6) }) },
  { nom: "Les saisies", champ: "manualCashflowEntries", requete: `query($w: ID) { manualCashflowEntries(workspaceId: $w) { id name amount } }`, variables: (w) => ({ w }) },
  { nom: "Les récurrences détectées", champ: "detectedRecurrences", requete: `query($w: ID) { detectedRecurrences(workspaceId: $w) { id partyName } }`, variables: (w) => ({ w }) },
  {
    nom: "Le détail d'un mois",
    champ: "forecastMonthDetails",
    requete: `query($w: ID, $m: String!) { forecastMonthDetails(workspaceId: $w, month: $m) { month bankTransactions { id description } purchaseInvoices { id partyName } forecastEntries { id name } } }`,
    variables: (w) => ({ w, m: mois(0) }),
  },
  {
    nom: "Les occurrences des prévisions",
    champ: "forecastOccurrences",
    requete: `query($w: ID, $d: String!, $f: String!) { forecastOccurrences(workspaceId: $w, startMonth: $d, endMonth: $f) { id name amount } }`,
    variables: (w) => ({ w, d: mois(0), f: mois(3) }),
  },
];

const ECRITURES = [
  {
    nom: "Ajouter une prévision",
    editeur: true,
    champ: "upsertManualCashflowEntry",
    requete: `mutation($input: UpsertManualCashflowEntryInput!) { upsertManualCashflowEntry(input: $input) { id } }`,
    variables: (w, qui) => ({ input: { workspaceId: w, name: `Prévision de ${qui}`, type: "EXPENSE", category: "OTHER_EXPENSE", amount: 10, startDate: aujourdhui(), frequency: "ONCE" } }),
    temoin: (qui) => ["manualcashflowentries", { name: `Prévision de ${qui}` }],
  },
  {
    nom: "Modifier une prévision",
    editeur: true,
    cible: true,
    champ: "upsertManualCashflowEntry",
    requete: `mutation($input: UpsertManualCashflowEntryInput!) { upsertManualCashflowEntry(input: $input) { id } }`,
    variables: (w) => ({ input: { id: id(cibles(w).saisie), workspaceId: w, name: cibles(w).saisie.name, type: "EXPENSE", category: "OTHER_EXPENSE", amount: 999, startDate: aujourdhui(), frequency: "MONTHLY" } }),
    temoin: (qui, w) => ["manualcashflowentries", parId(cibles(w).saisie)],
  },
  {
    nom: "Supprimer une prévision",
    editeur: false,
    cible: true,
    champ: "deleteManualCashflowEntry",
    resultat: "succes",
    requete: `mutation($id: ID!) { deleteManualCashflowEntry(id: $id) { success message } }`,
    variables: (w) => ({ id: id(cibles(w).aSupprimer) }),
    temoin: (qui, w) => ["manualcashflowentries", parId(cibles(w).aSupprimer)],
  },
  {
    nom: "Créer un scénario",
    editeur: true,
    champ: "upsertForecastScenario",
    requete: `mutation($input: UpsertForecastScenarioInput!) { upsertForecastScenario(input: $input) { id } }`,
    variables: (w, qui) => ({ input: { workspaceId: w, name: `Scénario de ${qui}`, incomeMultiplier: 1, expenseMultiplier: 1 } }),
    temoin: (qui) => ["forecastscenarios", { name: `Scénario de ${qui}` }],
  },
  {
    nom: "Modifier un scénario",
    editeur: true,
    cible: true,
    champ: "upsertForecastScenario",
    requete: `mutation($input: UpsertForecastScenarioInput!) { upsertForecastScenario(input: $input) { id } }`,
    variables: (w) => ({ input: { id: id(cibles(w).scenario), workspaceId: w, name: cibles(w).scenario.name, incomeMultiplier: 1.5, expenseMultiplier: 0.5 } }),
    temoin: (qui, w) => ["forecastscenarios", parId(cibles(w).scenario)],
  },
  {
    nom: "Supprimer un scénario",
    editeur: false,
    cible: true,
    champ: "deleteForecastScenario",
    resultat: "succes",
    requete: `mutation($id: ID!) { deleteForecastScenario(id: $id) { success message } }`,
    variables: (w) => ({ id: id(cibles(w).scenario) }),
    temoin: (qui, w) => ["forecastscenarios", parId(cibles(w).scenario)],
  },
  {
    nom: "Enregistrer une prévision mensuelle",
    editeur: true,
    champ: "upsertTreasuryForecast",
    requete: `mutation($input: UpsertTreasuryForecastInput!) { upsertTreasuryForecast(input: $input) { id } }`,
    variables: (w) => ({ input: { workspaceId: w, month: cibles(w).prevision.month, category: "MARKETING", type: "EXPENSE", forecastAmount: 777 } }),
    temoin: (qui, w) => ["treasuryforecasts", { workspaceId: orgDe(w) }],
  },
  {
    nom: "Supprimer une prévision mensuelle",
    editeur: false,
    cible: true,
    champ: "deleteTreasuryForecast",
    resultat: "succes",
    requete: `mutation($id: ID!) { deleteTreasuryForecast(id: $id) { success message } }`,
    variables: (w) => ({ id: id(cibles(w).prevision) }),
    temoin: (qui, w) => ["treasuryforecasts", parId(cibles(w).prevision)],
  },
  {
    nom: "Masquer une récurrence détectée",
    editeur: true,
    cible: true,
    champ: "muteDetectedRecurrence",
    requete: `mutation($id: ID!) { muteDetectedRecurrence(id: $id, muted: true) { id isMuted } }`,
    variables: (w) => ({ id: id(cibles(w).muter) }),
    temoin: (qui, w) => ["detectedrecurrences", parId(cibles(w).muter)],
  },
  {
    nom: "Corriger une récurrence détectée",
    editeur: true,
    cible: true,
    champ: "updateDetectedRecurrence",
    requete: `mutation($id: ID!) { updateDetectedRecurrence(id: $id, input: { amount: 99, label: "Récurrence corrigée" }) { id } }`,
    variables: (w) => ({ id: id(cibles(w).modifier) }),
    temoin: (qui, w) => ["detectedrecurrences", parId(cibles(w).modifier)],
  },
  {
    nom: "Supprimer une récurrence détectée",
    editeur: false,
    cible: true,
    champ: "deleteDetectedRecurrence",
    resultat: "succes",
    requete: `mutation($id: ID!) { deleteDetectedRecurrence(id: $id) { success message } }`,
    variables: (w) => ({ id: id(cibles(w).modifier) }),
    temoin: (qui, w) => ["detectedrecurrences", parId(cibles(w).modifier)],
  },
  {
    nom: "Masquer une saisie dans un scénario",
    editeur: true,
    cible: true,
    champ: "hideManualCashflowEntryInScenario",
    requete: `mutation($id: ID!, $s: ID!) { hideManualCashflowEntryInScenario(id: $id, scenarioId: $s, hidden: true) { id } }`,
    variables: (w) => ({ id: id(cibles(w).saisie), s: id(cibles(w).scenario) }),
    temoin: (qui, w) => ["forecastscenarios", parId(cibles(w).scenario)],
  },
  {
    nom: "Retirer un mois d'une prévision récurrente",
    editeur: true,
    cible: true,
    champ: "excludeForecastOccurrence",
    resultat: "booleen",
    requete: `mutation($id: ID!, $m: String!) { excludeForecastOccurrence(kind: MANUAL, id: $id, month: $m) }`,
    variables: (w) => ({ id: id(cibles(w).saisie), m: mois(2) }),
    temoin: (qui, w) => ["manualcashflowentries", parId(cibles(w).saisie)],
  },
  {
    nom: "Relancer la détection des récurrences",
    editeur: true,
    champ: "runRecurrenceDetection",
    requete: `mutation($w: ID) { runRecurrenceDetection(workspaceId: $w) }`,
    variables: (w) => ({ w }),
    temoin: (qui, w) => ["detectedrecurrences", { workspaceId: orgDe(w) }],
  },
];

verifierDroits({
  fonctionnalite: "Prévision",
  lectures: LECTURES,
  ecritures: ECRITURES,
  fuites: [id(SAISIES.loyer), SAISIES.loyer.name, SAISIES.subvention.name, id(SCENARIOS.optimiste), SCENARIOS.optimiste.name, id(RECURRENCES.orange), RECURRENCES.orange.partyName, "PRLV LOYER SCI DES TILLEULS"],
});

/**
 * Plafond de 5 scénarios par espace (organisation « Scénarios Test SASU »,
 * 4 scénarios au départ) : l'API refuse le 6e, y compris quand on lui passe
 * un identifiant neuf. Chaque test complète d'abord jusqu'à 5.
 */
test.describe("Prévision : 5 scénarios au plus", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_SAISIE_ACHATS) });
  const W = ORGANISATION_SCENARIOS._id.toHexString();
  const CREER = `mutation($input: UpsertForecastScenarioInput!) { upsertForecastScenario(input: $input) { id name } }`;
  const compter = async () => (await base()).collection("forecastscenarios").countDocuments({ workspaceId: ORGANISATION_SCENARIOS._id });

  async function completerA5(page, prefixe) {
    for (let i = 1; i <= 5 && (await compter()) < 5; i++) {
      const r = await appelApi(page, CREER, { input: { workspaceId: W, name: `${prefixe} ${i}`, incomeMultiplier: 1, expenseMultiplier: 1 } }, { organisation: W });
      expect(r.errors, `Création du scénario « ${prefixe} ${i} »`).toEqual([]);
    }
    expect(await compter()).toBe(5);
  }

  test("Un 6e scénario est refusé avec un message", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await completerA5(page, "Plafond A");
    const r = await appelApi(page, CREER, { input: { workspaceId: W, name: "Sixième scénario", incomeMultiplier: 1, expenseMultiplier: 1 } }, { organisation: W });
    expect(r.data?.upsertForecastScenario ?? null, "Un 6e scénario a été créé").toBeNull();
    expect(r.errors.map((e) => e.message).join(" | ")).toMatch(/5 scénarios/);
    expect(await compter()).toBe(5);
  });

  test("Un 6e scénario passé avec un identifiant neuf est refusé aussi", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await completerA5(page, "Plafond B");
    const r = await appelApi(
      page,
      CREER,
      { input: { id: new ObjectId().toHexString(), workspaceId: W, name: "Sixième scénario par identifiant", incomeMultiplier: 1, expenseMultiplier: 1 } },
      { organisation: W },
    );
    expect(await compter(), "Le plafond de 5 scénarios est contourné en passant un identifiant neuf à l'API").toBe(5);
    expect(r.data?.upsertForecastScenario ?? null).toBeNull();
  });
});

/**
 * Bornes des valeurs (modèle ForecastScenario, ManualCashflowEntry,
 * TreasuryForecast) : multiplicateur entre 0 et 5, nom obligatoire de 60
 * caractères au plus, montant positif, mois au format AAAA-MM. L'API doit
 * les tenir, à la création comme à la modification.
 */
test.describe("Prévision : valeurs hors limites refusées par l'API", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_SAISIE_ACHATS) });
  const SCENARIO = `mutation($input: UpsertForecastScenarioInput!) { upsertForecastScenario(input: $input) { id name incomeMultiplier } }`;
  const SAISIE = `mutation($input: UpsertManualCashflowEntryInput!) { upsertManualCashflowEntry(input: $input) { id name amount } }`;

  test("Scénario : multiplicateur de 50, nom vide ou de 200 caractères, refusés", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const db = await base();
    const W = ORGANISATION_BORNES._id.toHexString();
    for (const [cas, input, filtre] of [
      ["multiplicateur des entrées de 50 (maximum 5)", { name: "Scénario multiplicateur 50", incomeMultiplier: 50, expenseMultiplier: 1 }, { name: "Scénario multiplicateur 50" }],
      ["multiplicateur des sorties négatif", { name: "Scénario multiplicateur négatif", incomeMultiplier: 1, expenseMultiplier: -2 }, { name: "Scénario multiplicateur négatif" }],
      ["nom fait d'espaces", { name: "   ", incomeMultiplier: 1, expenseMultiplier: 1 }, { name: { $in: ["", "   "] } }],
      ["nom de 200 caractères (maximum 60)", { name: "S".repeat(200), incomeMultiplier: 1, expenseMultiplier: 1 }, { name: "S".repeat(200) }],
    ]) {
      const r = await appelApi(page, SCENARIO, { input: { workspaceId: W, ...input } }, { organisation: W });
      expect.soft(r.data?.upsertForecastScenario ?? null, `Scénario avec ${cas} : accepté par l'API`).toBeNull();
      expect.soft(await db.collection("forecastscenarios").countDocuments({ workspaceId: ORGANISATION_BORNES._id, ...filtre }), `Scénario avec ${cas} : enregistré`).toBe(0);
    }
  });

  test("Prévision modifiée avec un montant négatif ou un nom de 300 caractères : refusée", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const cible = SAISIES_SAISIE.bornes;
    const avant = await (await base()).collection("manualcashflowentries").findOne({ _id: cible._id });
    for (const [cas, modif] of [
      ["un montant de -500 €", { amount: -500 }],
      ["un nom de 300 caractères (maximum 120)", { name: "P".repeat(300) }],
    ]) {
      const input = { id: id(cible), workspaceId: ORG_SAISIE, name: avant.name, type: avant.type, category: avant.category, amount: avant.amount, startDate: aujourdhui(), frequency: avant.frequency, ...modif };
      const r = await appelApi(page, SAISIE, { input }, { organisation: ORG_SAISIE });
      expect.soft(r.data?.upsertManualCashflowEntry ?? null, `Prévision modifiée avec ${cas} : acceptée par l'API`).toBeNull();
    }
    const apres = await (await base()).collection("manualcashflowentries").findOne({ _id: cible._id });
    expect.soft(apres.amount, "Montant négatif enregistré").toBeGreaterThanOrEqual(0);
    expect.soft(apres.name.length, "Nom de plus de 120 caractères enregistré").toBeLessThanOrEqual(120);
  });

  test("Prévision mensuelle au mois « 2026-13 » ou au montant négatif : refusée", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const db = await base();
    for (const [cas, input] of [
      ["mois 2026-13", { month: "2026-13", forecastAmount: 100 }],
      ["montant de -300 €", { month: "2031-01", forecastAmount: -300 }],
    ]) {
      const r = await appelApi(
        page,
        `mutation($input: UpsertTreasuryForecastInput!) { upsertTreasuryForecast(input: $input) { id } }`,
        { input: { workspaceId: ORG_SAISIE, category: "TRAINING", type: "EXPENSE", ...input } },
        { organisation: ORG_SAISIE },
      );
      expect.soft(r.data?.upsertTreasuryForecast ?? null, `Prévision mensuelle avec ${cas} : acceptée par l'API`).toBeNull();
    }
    expect.soft(await db.collection("treasuryforecasts").countDocuments({ workspaceId: new ObjectId(ORG_SAISIE), category: "TRAINING" }), "Prévision mensuelle invalide enregistrée").toBe(0);
  });
});

/**
 * Nom piégé (XSS stockée) : l'Éditeur renomme une prévision avec du HTML
 * exécutable ; le propriétaire ouvre la prévision et sa fenêtre.
 */
test.describe("Prévision : un nom piégé ne s'exécute jamais", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });
  const NOM = `${PIEGE}Prévision piégée`;

  test.beforeAll(async ({ browser }) => {
    const cible = SAISIES_SAISIE.piege;
    const reponse = await avecSession(browser, SESSION_TOKEN_EDITEUR_ACHATS, (page) =>
      appelApi(
        page,
        `mutation($input: UpsertManualCashflowEntryInput!) { upsertManualCashflowEntry(input: $input) { id } }`,
        { input: { id: id(cible), workspaceId: ORG_SAISIE, name: NOM.slice(0, 120), type: "EXPENSE", category: "OTHER_EXPENSE", amount: 41, startDate: aujourdhui(), frequency: "MONTHLY", notes: `${PIEGE}Note` } },
        { organisation: ORG_SAISIE },
      ),
    );
    expect(reponse.errors, "L'Éditeur doit pouvoir modifier une prévision").toEqual([]);
  });

  test("Page de prévision et détail du mois : le nom s'affiche, rien ne s'exécute", async ({ page }) => {
    await ouvrir(page, "/dashboard/outils/prevision", { pret: page.getByText("Prévision piégée").first() });
    await etape(page, "Page", async () => {
      await page.waitForTimeout(1_000);
      await verifierPiegeInerte(page);
    }, { capture: "ecran" });
    await etape(page, "Détail du mois en cours", async () => {
      await page.locator("main button").filter({ hasText: /^[A-ZÉÛ][a-zéû]{2}\.\d{2}$/ }).first().click();
      await expect(page.getByRole("dialog").last()).toBeVisible();
      await page.waitForTimeout(1_000);
      await verifierPiegeInerte(page);
    }, { capture: "ecran" });
  });
});

/**
 * Identifiants de scénario d'un autre espace : depuis « Saisie Achats », ses
 * propres saisies et récurrences avec le scénario « Optimiste » d'« Achats »
 * (et l'inverse) sont refusés, sans rien écrire ni d'un côté ni de l'autre.
 */
test.describe("Prévision : scénario d'un autre espace refusé", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_SAISIE_ACHATS) });
  const AUTRE = SCENARIOS.optimiste;
  const scenarioIntact = async (scenario, avant, contexte) => expect(await photo(["forecastscenarios", parId(scenario)]), `${contexte} : le scénario a changé`).toBe(avant);
  const refuse = (r, champ, contexte) => {
    expect(r.data?.[champ] ?? null, `${contexte} : accepté par l'API`).toBeNull();
    expect(r.errors.map((e) => e.message).join(" | "), `${contexte} : refus sans message`).toMatch(/non trouv/i);
  };

  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  test("Nouvelle saisie rattachée au scénario d'un autre espace : refusée, rien créé", async ({ page }) => {
    const nom = "Saisie vers le scénario des autres";
    const r = await appelApi(
      page,
      `mutation($input: UpsertManualCashflowEntryInput!) { upsertManualCashflowEntry(input: $input) { id scenarioId } }`,
      { input: { workspaceId: ORG_SAISIE, scenarioId: id(AUTRE), name: nom, type: "EXPENSE", category: "OTHER_EXPENSE", amount: 10, startDate: aujourdhui(), frequency: "MONTHLY" } },
      { organisation: ORG_SAISIE },
    );
    refuse(r, "upsertManualCashflowEntry", "Saisie dans le scénario d'« Achats »");
    expect(await (await base()).collection("manualcashflowentries").countDocuments({ name: nom })).toBe(0);
  });

  test("Masquer sa saisie dans le scénario d'un autre espace : refusé", async ({ page }) => {
    const avant = await photo(["forecastscenarios", parId(AUTRE)]);
    const r = await appelApi(
      page,
      `mutation($id: ID!, $s: ID!) { hideManualCashflowEntryInScenario(id: $id, scenarioId: $s, hidden: true) { id } }`,
      { id: id(SAISIES_SAISIE.bornes), s: id(AUTRE) },
      { organisation: ORG_SAISIE },
    );
    refuse(r, "hideManualCashflowEntryInScenario", "Masquage dans le scénario d'« Achats »");
    await scenarioIntact(AUTRE, avant, "Masquage");
  });

  test("Retirer un mois de sa saisie dans le scénario d'un autre espace : refusé", async ({ page }) => {
    const avant = await photo(["forecastscenarios", parId(AUTRE)]);
    const saisieAvant = await photo(["manualcashflowentries", parId(SAISIES_SAISIE.bornes)]);
    const r = await appelApi(
      page,
      `mutation($id: ID!, $m: String!, $s: ID) { excludeForecastOccurrence(kind: MANUAL, id: $id, month: $m, scenarioId: $s) }`,
      { id: id(SAISIES_SAISIE.bornes), m: mois(2), s: id(AUTRE) },
      { organisation: ORG_SAISIE },
    );
    refuse(r, "excludeForecastOccurrence", "Exclusion dans le scénario d'« Achats »");
    await scenarioIntact(AUTRE, avant, "Exclusion");
    expect(await photo(["manualcashflowentries", parId(SAISIES_SAISIE.bornes)]), "La saisie a changé").toBe(saisieAvant);
  });

  test("Masquer sa récurrence dans le scénario d'un autre espace : refusé", async ({ page }) => {
    const avant = await photo(["forecastscenarios", parId(AUTRE)]);
    const r = await appelApi(
      page,
      `mutation($id: ID!, $s: ID) { muteDetectedRecurrence(id: $id, muted: true, scenarioId: $s) { id isMuted } }`,
      { id: id(RECURRENCES.editeurModifier), s: id(AUTRE) },
      { organisation: ORG_SAISIE },
    );
    refuse(r, "muteDetectedRecurrence", "Récurrence dans le scénario d'« Achats »");
    await scenarioIntact(AUTRE, avant, "Récurrence");
  });

  test("L'inverse : la saisie d'« Achats » dans son propre scénario, refusée", async ({ page }) => {
    const sien = SCENARIOS.aRenommer;
    const r = await appelApi(
      page,
      `mutation($id: ID!, $s: ID!) { hideManualCashflowEntryInScenario(id: $id, scenarioId: $s, hidden: true) { id } }`,
      { id: id(SAISIES.loyer), s: id(sien) },
      { organisation: ORG_SAISIE },
    );
    refuse(r, "hideManualCashflowEntryInScenario", "Saisie d'« Achats » masquée dans son scénario");
    const scenario = await (await base()).collection("forecastscenarios").findOne(parId(sien));
    expect((scenario?.hiddenManualEntryIds || []).map(String)).not.toContain(id(SAISIES.loyer));
  });
});

/**
 * Montants et dates hors limites : une saisie de 1e308 €, une progression de
 * +100 000 % par semaine ou une fin avant le début sont refusées avec un
 * message ; une saisie démesurée déjà en base ne rend pas la prévision de
 * l'espace illisible (« Float cannot represent non numeric value »).
 */
test.describe("Prévision : montants extrêmes et dates incohérentes", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_SAISIE_ACHATS) });
  const SAISIE = `mutation($input: UpsertManualCashflowEntryInput!) { upsertManualCashflowEntry(input: $input) { id amount } }`;
  const base_ = (nom) => ({ workspaceId: ORG_SAISIE, name: nom, type: "EXPENSE", category: "OTHER_EXPENSE", amount: 100, startDate: aujourdhui(), frequency: "MONTHLY" });

  for (const [cas, nom, modif, motif] of [
    ["montant de 1e308 €", "Saisie démesurée", { amount: 1e308 }, /1 000 000 000/],
    ["progression de +100 000 % par semaine", "Saisie à progression démesurée", { frequency: "WEEKLY", amountDelta: 100000, amountDeltaType: "PERCENT" }, /progression/i],
    ["fin avant le début", "Saisie qui finit avant de commencer", { startDate: `${mois(2)}-01`, endDate: `${mois(0)}-01` }, /postérieure/],
  ]) {
    test(`${cas} : refusée avec un message, rien en base`, async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const r = await appelApi(page, SAISIE, { input: { ...base_(nom), ...modif } }, { organisation: ORG_SAISIE });
      expect(r.data?.upsertManualCashflowEntry ?? null, `Saisie avec ${cas} acceptée`).toBeNull();
      expect(r.errors.map((e) => e.message).join(" | ")).toMatch(motif);
      expect(await (await base()).collection("manualcashflowentries").countDocuments({ name: nom })).toBe(0);
    });
  }

  test("Une saisie démesurée déjà en base : la prévision de l'espace répond quand même", async ({ page }) => {
    const db = await base();
    const W = ORGANISATION_BORNES._id;
    await db.collection("manualcashflowentries").updateOne(
      { _id: oid("saisiePrevision", 990) },
      { $setOnInsert: { ...sansId(SAISIES_SAISIE.bornes), workspaceId: W, name: "Saisie démesurée en base", amount: 1e308, amountDelta: 1e6, amountDeltaType: "PERCENT", frequency: "WEEKLY" } },
      { upsert: true },
    );
    await ouvrir(page, "/dashboard");
    const r = await appelApi(
      page,
      `query($w: ID, $d: String!, $f: String!) { treasuryForecastData(workspaceId: $w, startDate: $d, endDate: $f) { kpi { currentBalance projectedBalance3Months } months { month forecastExpense closingBalance } } }`,
      { w: W.toHexString(), d: `${mois(0)}-01`, f: `${mois(6)}-01` },
      { organisation: W.toHexString() },
    );
    expect(r.errors.map((e) => e.message), "La prévision de l'espace échoue").toEqual([]);
    for (const m of r.data.treasuryForecastData.months) expect.soft(Number.isFinite(m.forecastExpense), `Sorties prévues de ${m.month}`).toBe(true);
  });
});

/**
 * Nom de scénario déjà pris (organisation « Bornes ») : « Nouveau scénario »
 * modifiait en silence le scénario existant ; renommer renvoyait l'erreur
 * brute de l'index unique (E11000).
 */
test.describe("Prévision : nom de scénario déjà pris", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_SAISIE_ACHATS) });
  const W = ORGANISATION_BORNES._id.toHexString();
  const SCENARIO = `mutation($input: UpsertForecastScenarioInput!) { upsertForecastScenario(input: $input) { id name incomeMultiplier expenseMultiplier } }`;

  /** Scénario de départ (créé une fois, retrouvé lors d'une nouvelle tentative). */
  async function scenarioDeDepart(page, nom, multiplicateurs) {
    const existant = await (await base()).collection("forecastscenarios").findOne({ workspaceId: ORGANISATION_BORNES._id, name: nom });
    if (existant) return existant;
    const r = await appelApi(page, SCENARIO, { input: { workspaceId: W, name: nom, ...multiplicateurs } }, { organisation: W });
    expect(r.errors, `Création de « ${nom} »`).toEqual([]);
    return (await base()).collection("forecastscenarios").findOne({ workspaceId: ORGANISATION_BORNES._id, name: nom });
  }

  test("Nouveau scénario au nom d'un existant : refusé, l'existant inchangé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const ref = await scenarioDeDepart(page, "Prudence", { incomeMultiplier: 1.2, expenseMultiplier: 0.9 });
    const r = await appelApi(page, SCENARIO, { input: { workspaceId: W, name: "Prudence", incomeMultiplier: 1.5, expenseMultiplier: 1 } }, { organisation: W });
    expect(r.data?.upsertForecastScenario ?? null, "Le scénario existant a été réutilisé (création annoncée)").toBeNull();
    expect(r.errors.map((e) => e.message).join(" | ")).toMatch(/Un scénario porte déjà ce nom/);
    const apres = await (await base()).collection("forecastscenarios").findOne({ _id: ref._id });
    expect({ entrees: apres.incomeMultiplier, sorties: apres.expenseMultiplier }).toEqual({ entrees: 1.2, sorties: 0.9 });
  });

  test("Renommer un scénario avec le nom d'un autre : refusé avec le même message, sans erreur technique", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await scenarioDeDepart(page, "Ambition", { incomeMultiplier: 1.3, expenseMultiplier: 1 });
    const autre = await scenarioDeDepart(page, "Repli", { incomeMultiplier: 0.8, expenseMultiplier: 1 });
    const r = await appelApi(page, SCENARIO, { input: { id: autre._id.toHexString(), workspaceId: W, name: "Ambition", incomeMultiplier: 0.8, expenseMultiplier: 1 } }, { organisation: W });
    const messages = r.errors.map((e) => e.message).join(" | ");
    expect(r.data?.upsertForecastScenario ?? null).toBeNull();
    expect(messages).not.toMatch(/E11000|duplicate key/);
    expect(messages).toMatch(/Un scénario porte déjà ce nom/);
    expect((await (await base()).collection("forecastscenarios").findOne({ _id: autre._id })).name).toBe("Repli");
  });
});
