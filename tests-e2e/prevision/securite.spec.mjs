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
import { ORG, ORG_SAISIE, PIEGE, avecSession, connecteAchats, verifierDroits, verifierPiegeInerte } from "../achats-banque.mjs";

/** Données visées : « Achats » (Membre, intrus, visiteur) ou « Saisie Achats » (écritures permises de l'Éditeur). */
const CIBLES = {
  [ORG]: { saisie: SAISIES.loyer, aSupprimer: SAISIES.logiciel, scenario: SCENARIOS.optimiste, prevision: PREVISIONS_MENSUELLES.achats, muter: RECURRENCES.orange, modifier: RECURRENCES.orange },
  [ORG_SAISIE]: { saisie: SAISIES_SAISIE.editeur, aSupprimer: SAISIES_SAISIE.editeur, scenario: SCENARIOS.editeur, prevision: PREVISIONS_MENSUELLES.saisie, muter: RECURRENCES.editeurMuter, modifier: RECURRENCES.editeurModifier },
};
const cibles = (w) => CIBLES[w] || CIBLES[ORG];
const parId = (doc) => ({ _id: doc._id });
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
