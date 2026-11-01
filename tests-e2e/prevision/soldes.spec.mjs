/**
 * Prévision de trésorerie de « Pilotage » : soldes et flux réels comparés à
 * la base, avec les mêmes règles que l'accueil.
 *   - Sans compte choisi : solde des comptes actifs et des espèces (dépôt de
 *     50 €), comme le cadre « Solde du compte » de l'accueil ; l'ancien
 *     compte « inactive » (1 000 €) ne compte pas.
 *   - Compte choisi (« De … ») : son solde et ses seuls mouvements.
 *   - Réel d'un mois : opérations réalisées non supprimées ; la
 *     pré-autorisation annulée par la banque (500 €) n'en fait pas partie.
 *   - Paramètres invalides : refus avec un message clair.
 * Les mois de la prévision suivent la date des opérations en UTC (regroupement
 * « AAAA-MM » de l'API) : le mois attendu est calculé de la même façon.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { appelApi, id } from "../securite.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_PILOTAGE } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { COMPTE_BANCAIRE_PILOTAGE, COMPTE_INACTIF_PILOTAGE, TRANSACTIONS_PILOTAGE } from "../donnees/lot-pilotage.mjs";
import { arrondi, soldeEtFlux } from "../accueil/attendus.mjs";

const W = COMPTES.pilotage.organisation._id;
const ORG = id(COMPTES.pilotage.organisation);
const REQUETE = `query($w: ID, $d: String!, $f: String!, $c: ID) {
  treasuryForecastData(workspaceId: $w, startDate: $d, endDate: $f, accountId: $c) {
    kpi { currentBalance }
    months { month actualIncome actualExpense }
  }
}`;

const moisUtc = (date) => date.toISOString().slice(0, 7);
/** Mois « AAAA-MM » décalé de n mois. */
const decale = (mois, n) => {
  const [a, m] = mois.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + n, 1)).toISOString().slice(0, 7);
};
/** Mois de la pré-autorisation annulée : la plage de la prévision le contient toujours, même la nuit du 1er. */
const MOIS = moisUtc(TRANSACTIONS_PILOTAGE.annulee.date);
const PLAGE = { d: `${MOIS}-01`, f: `${decale(MOIS, 2)}-01` };

/** Sorties réelles attendues du mois (opérations réalisées, non supprimées), d'un compte si précisé. */
async function sortiesDuMois(mois, compte = null) {
  const transactions = await (await base())
    .collection("transactions")
    .find({ workspaceId: W.toHexString(), deletedAt: null, status: "completed", amount: { $lt: 0 }, ...(compte ? { fromAccount: compte } : {}) })
    .toArray();
  return arrondi(transactions.filter((t) => moisUtc(t.date) === mois).reduce((s, t) => s + Math.abs(t.amount), 0));
}

async function prevision(page, variables) {
  const r = await appelApi(page, REQUETE, { w: ORG, ...PLAGE, ...variables }, { organisation: ORG });
  expect(r.errors, "La prévision doit répondre").toEqual([]);
  return r.data.treasuryForecastData;
}
const duMois = (donnees, mois) => donnees.months.find((m) => m.month === mois);

test.describe("Prévision : soldes et flux réels comme en base (propriétaire de « Pilotage »)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  test("Tous les comptes : solde actuel des comptes actifs et des espèces, comme l'accueil", async ({ page }) => {
    const { solde } = await soldeEtFlux(W);
    const { kpi } = await prevision(page, {});
    expect(
      arrondi(kpi.currentBalance),
      `Accueil ${solde} (compte actif 12 500 + espèces 50) ; compte inactif de ${COMPTE_INACTIF_PILOTAGE.balance} € à exclure`,
    ).toBe(solde);
  });

  test("Compte choisi : son solde seul, sans les espèces ni l'autre compte", async ({ page }) => {
    const { kpi } = await prevision(page, { c: id(COMPTE_BANCAIRE_PILOTAGE) });
    expect(arrondi(kpi.currentBalance)).toBe(COMPTE_BANCAIRE_PILOTAGE.balance);
  });

  test("Compte choisi : les sorties réelles du mois sont celles de ce compte", async ({ page }) => {
    const attendu = await sortiesDuMois(MOIS, COMPTE_BANCAIRE_PILOTAGE.externalId);
    expect(attendu, "Données de départ : des sorties sur ce compte ce mois-ci").toBeGreaterThan(0);
    const donnees = await prevision(page, { c: id(COMPTE_BANCAIRE_PILOTAGE) });
    expect(arrondi(duMois(donnees, MOIS)?.actualExpense ?? -1)).toBe(attendu);
  });

  test("Compte inactif choisi : aucun solde ni mouvement", async ({ page }) => {
    const donnees = await prevision(page, { c: id(COMPTE_INACTIF_PILOTAGE) });
    expect.soft(arrondi(donnees.kpi.currentBalance), "Solde du compte inactif compté").toBe(0);
    expect.soft(arrondi(duMois(donnees, MOIS)?.actualExpense ?? -1), "Sorties attribuées au compte inactif").toBe(0);
  });

  test("Réel du mois : la pré-autorisation annulée par la banque n'est pas comptée", async ({ page }) => {
    const annulee = TRANSACTIONS_PILOTAGE.annulee;
    const attendu = await sortiesDuMois(MOIS);
    const donnees = await prevision(page, {});
    const affiche = arrondi(duMois(donnees, MOIS)?.actualExpense ?? -1);
    expect(affiche, affiche === arrondi(attendu + Math.abs(annulee.amount)) ? "L'opération annulée de 500 € est comptée" : `Sorties réelles de ${MOIS}`).toBe(attendu);
  });
});

test.describe("Prévision : paramètres invalides refusés avec un message", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  for (const [cas, variables, motif] of [
    ["date de début « abcd »", { d: "abcd" }, /Période invalide/],
    ["mois 13", { d: "2026-13-01" }, /Période invalide/],
    ["fin avant le début", { d: `${decale(MOIS, 3)}-01`, f: `${MOIS}-01` }, /début doit précéder/],
    ["compte « pas-un-compte »", { c: "pas-un-compte" }, /Compte bancaire invalide/],
  ]) {
    test(`${cas} : refus de validation, sans erreur de permissions`, async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const r = await appelApi(page, REQUETE, { w: ORG, ...PLAGE, ...variables }, { organisation: ORG });
      expect(r.data?.treasuryForecastData ?? null, "Une prévision a été renvoyée").toBeNull();
      const messages = r.errors.map((e) => `${e.extensions?.code || ""} ${e.message}`).join(" | ");
      expect(messages).not.toMatch(/vérification des permissions/);
      expect(messages).toMatch(motif);
    });
  }
});
