/**
 * Analytiques et Vue d'ensemble : droits vérifiés à l'API. Les lectures
 * (indicateurs, prévision de trésorerie, courbes et catégories) sont ouvertes
 * au Membre et à l'Éditeur de « Pilotage », refusées à une autre entreprise
 * (et sans rien de « Pilotage » depuis son propre espace) et au visiteur.
 * Aucun plafond de l'offre d'entrée ne concerne ces pages
 * (advancedAnalytics: true pour toutes les offres, src/lib/plan-limits.js).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { appelApi, verifierRefus, id } from "../securite.mjs";
import { connecte, SESSION_TOKEN_INTRUS, SESSION_TOKEN_PILOTAGE_EDITEUR, SESSION_TOKEN_PILOTAGE_MEMBRE } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { CONTACTS_PILOTAGE, FACTURES_PILOTAGE } from "../donnees/lot-pilotage.mjs";
import { aujourdhui } from "./attendus.mjs";

const ORG = id(COMPTES.pilotage.organisation);
const ORG_INTRUS = id(COMPTES.intrus.organisation);
const { a } = aujourdhui();
const PERIODE = { debut: `${a - 1}-01-01`, fin: `${a}-12-31` };

const LECTURES = [
  {
    nom: "Indicateurs (Analytiques, Vue d'ensemble)",
    champ: "financialAnalytics",
    requete: `query($w: ID, $d: String!, $f: String!) { financialAnalytics(workspaceId: $w, startDate: $d, endDate: $f) { kpi { netRevenueHT totalExpensesHT invoiceCount outstandingReceivables } topClients { clientName totalTTC } collection { overdueInvoices { invoiceId invoiceNumber clientName } } } }`,
    variables: (w) => ({ w, d: PERIODE.debut, f: PERIODE.fin }),
  },
  {
    nom: "Prévision de trésorerie",
    champ: "treasuryForecastData",
    requete: `query($w: ID, $d: String!, $f: String!) { treasuryForecastData(workspaceId: $w, startDate: $d, endDate: $f) { months { month closingBalance } } }`,
    variables: (w) => ({ w, d: PERIODE.debut, f: PERIODE.fin }),
  },
  {
    nom: "Courbe de trésorerie (Vue d'ensemble)",
    champ: "dashboardTreasuryChart",
    requete: `query($w: ID!) { dashboardTreasuryChart(workspaceId: $w, period: { preset: "365d" }) { totalIncome totalExpenses endBalance } }`,
    variables: (w) => ({ w }),
  },
  {
    nom: "Dépenses par catégorie (Vue d'ensemble)",
    champ: "dashboardCategoryAggregation",
    requete: `query($w: ID!) { dashboardCategoryAggregation(workspaceId: $w, type: "expense", period: { preset: "365d" }) { categories { name amount } } }`,
    variables: (w) => ({ w }),
  },
];

function sansFuite(reponse, contexte) {
  const texte = JSON.stringify(reponse.data ?? {});
  for (const [quoi, valeur] of [
    ["une facture", id(FACTURES_PILOTAGE.ancienneEnRetard)],
    ["un client", CONTACTS_PILOTAGE.pilote.name],
    ["un client", CONTACTS_PILOTAGE.coeur.name],
    ["un numéro de facture", `${FACTURES_PILOTAGE.ancienneEnRetard.prefix}-${FACTURES_PILOTAGE.ancienneEnRetard.number}`],
    ["le solde", "12550"],
  ]) {
    expect(texte, `${contexte} : ${quoi} de « Pilotage » renvoyé (${valeur})`).not.toContain(valeur);
  }
}

for (const [role, token] of [
  ["Membre (lecture seule)", SESSION_TOKEN_PILOTAGE_MEMBRE],
  ["Éditeur", SESSION_TOKEN_PILOTAGE_EDITEUR],
]) {
  test.describe(`Analytiques : le rôle « ${role} » lit les indicateurs`, () => {
    test.use({ storageState: connecte(token) });
    test("Chaque lecture répond", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      for (const l of LECTURES) {
        const r = await appelApi(page, l.requete, l.variables(ORG), { organisation: ORG });
        expect.soft(r.errors, `${l.nom} : refusé`).toEqual([]);
        expect.soft(r.data?.[l.champ], `${l.nom} : rien renvoyé`).toBeTruthy();
      }
    });
  });
}

test.describe("Analytiques : une autre entreprise n'atteint rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  for (const l of LECTURES) {
    test(`« ${l.nom} » de « Pilotage » : refusé`, async ({ page }) => {
      await etape(page, "En visant leur organisation", async () => {
        const r = await appelApi(page, l.requete, l.variables(ORG), { organisation: ORG });
        sansFuite(r, `${l.nom} (organisation des autres)`);
        verifierRefus(r, l.champ, `${l.nom} (organisation des autres)`);
      });
      await etape(page, "Depuis sa propre organisation, avec l'identifiant de « Pilotage »", async () => {
        const r = await appelApi(page, l.requete, l.variables(ORG), { organisation: ORG_INTRUS });
        sansFuite(r, `${l.nom} (depuis son organisation)`);
      });
    });
  }
});

test.describe("Analytiques : sans session, rien", () => {
  test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });

  test("Lectures refusées", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    for (const l of LECTURES) {
      const r = await appelApi(page, l.requete, l.variables(ORG), { organisation: ORG });
      expect.soft(r.data?.[l.champ] ?? null, `${l.nom} : renvoyé sans session`).toBeNull();
    }
  });

  test("Les pages renvoient vers la connexion", async ({ page }) => {
    for (const url of ["/dashboard/outils/analytiques", "/dashboard/outils/analytiques/vue-densemble", "/dashboard/analytics"]) {
      await page.goto(url);
      await expect.soft(page, url).toHaveURL(/\/auth\/login/);
    }
  });
});
