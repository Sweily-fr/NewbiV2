/**
 * Espace gestionnaire, listes de documents (factures, devis, bons de
 * commande, bons de livraison, avoirs) de tous les clients du cabinet :
 * compteurs des onglets comparés à la base, recherche par numéro complet,
 * filtre par client, pages, et ouverture d'un document dans l'espace de son
 * client. Seuls les espaces confiés au cabinet (fiche active) comptent.
 */
import { test, expect, etape } from "../outils.mjs";
import { cliquer } from "../navigation.mjs";
import { base } from "../base.mjs";
import { id } from "../securite.mjs";
import { connecte, SESSION_TOKEN_CABINET } from "../config.mjs";
import { COMPTES, MEMBRES } from "../donnees/base.mjs";
import { CABINET, FACTURES_BOULANGERIE, FACTURES_PILOTAGE } from "../donnees/lot-pilotage.mjs";
import { lignes, ouvrirListe, remettreEspace } from "./outils-gestionnaire.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_CABINET) });

const G = "/dashboard/gestionnaire";

/** Espaces confiés au cabinet (fiche active) où il est encore membre. */
async function espacesConfies() {
  const db = await base();
  const liens = await db.collection("managedclients").find({ managerId: CABINET._id, status: "active" }).toArray();
  const membres = await db.collection("member").find({ userId: MEMBRES.cabinet.utilisateur._id, organizationId: { $in: liens.map((l) => l.organizationId) } }).toArray();
  return membres.map((m) => m.organizationId);
}

const debutDuJour = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const LISTES = [
  {
    nom: "Factures clients",
    chemin: "factures",
    collection: "invoices",
    onglets: {
      Toutes: () => true,
      Brouillons: (d) => d.status === "DRAFT",
      "À encaisser": (d) => d.status === "PENDING",
      "En retard": (d) => d.status === "OVERDUE" || (d.status === "PENDING" && d.dueDate && d.dueDate < debutDuJour()),
      Terminées: (d) => d.status === "COMPLETED",
    },
  },
  { nom: "Devis", chemin: "devis", collection: "quotes", onglets: { Tous: () => true, Brouillons: (d) => d.status === "DRAFT", Envoyés: (d) => d.status === "PENDING", Acceptés: (d) => d.status === "COMPLETED" } },
  {
    nom: "Bons de commande",
    chemin: "bons-commande",
    collection: "purchaseorders",
    onglets: { Tous: () => true, Brouillons: (d) => d.status === "DRAFT", "En attente": (d) => d.status === "CONFIRMED", Validés: (d) => d.status === "VALIDATED", Livrés: (d) => d.status === "DELIVERED" },
  },
  {
    nom: "Bons de livraison",
    chemin: "bons-de-livraison",
    collection: "deliverynotes",
    onglets: { Tous: () => true, Brouillons: (d) => d.status === "DRAFT", "À expédier": (d) => d.status === "PENDING", Expédiés: (d) => d.status === "SHIPPED", Livrés: (d) => d.status === "DELIVERED" },
  },
  { nom: "Avoirs", chemin: "avoirs", collection: "creditnotes", onglets: { Tous: () => true } },
];

for (const liste of LISTES) {
  test(`${liste.nom} : chaque onglet compte les documents des clients du cabinet, comme en base`, async ({ page }) => {
    const espaces = await espacesConfies();
    const docs = await (await base()).collection(liste.collection).find({ workspaceId: { $in: espaces } }).toArray();
    await ouvrirListe(page, `${G}/${liste.chemin}`);
    for (const [onglet, filtre] of Object.entries(liste.onglets)) {
      const attendu = docs.filter(filtre).length;
      await expect.soft(page.getByRole("tab", { name: new RegExp(`^${onglet}\\s*${attendu}$`) }), `Onglet « ${onglet} » : ${attendu} attendu(s)`).toBeVisible();
    }
  });
}

test("Factures : 50 par page, la page suivante montre la suite", async ({ page }) => {
  const espaces = await espacesConfies();
  const total = await (await base()).collection("invoices").countDocuments({ workspaceId: { $in: espaces } });
  expect(total, "Données de départ : plus de 50 factures chez les clients").toBeGreaterThan(50);
  await ouvrirListe(page, `${G}/factures`);
  expect((await lignes(page)).length).toBe(50);
  await cliquer(page, page.getByRole("button", { name: "Page suivante" }));
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator("main table tbody tr[role=link]")).toHaveCount(total - 50);
});

test("Factures : recherche par numéro complet (préfixe, tiret, numéro)", async ({ page }) => {
  const f = FACTURES_PILOTAGE.aEncaisser;
  await ouvrirListe(page, `${G}/factures`);
  await page.getByRole("textbox", { name: "Rechercher" }).fill(`${f.prefix}-${f.number}`);
  await expect(page).toHaveURL(/q=/);
  await expect(page.locator("main table tbody tr[role=link]")).toHaveCount(1);
  await expect(page.locator("main table tbody tr[role=link]").first()).toHaveAttribute("aria-label", `Ouvrir ${f.prefix}-${f.number} de ${COMPTES.pilotage.organisation.name}`);
});

test("Factures : filtre sur un client, seulement ses factures", async ({ page }) => {
  await ouvrirListe(page, `${G}/factures?dossier=${id(COMPTES.pilotage.organisation)}`);
  const attendu = Object.keys(FACTURES_PILOTAGE).length;
  await expect(page.getByRole("tab", { name: new RegExp(`^Toutes\\s*${attendu}$`) })).toBeVisible();
  for (const l of await lignes(page)) expect.soft(l.startsWith(COMPTES.pilotage.organisation.name), `Ligne d'un autre client : ${l}`).toBe(true);
});

test("Factures en retard : les factures échues des clients, dont les plus anciennes", async ({ page }) => {
  await ouvrirListe(page, `${G}/factures?statut=overdue`);
  const texte = (await lignes(page)).join("\n");
  for (const f of [FACTURES_PILOTAGE.enRetard, FACTURES_PILOTAGE.ancienneEnRetard, ...FACTURES_BOULANGERIE.filter((x) => x.status === "PENDING" && x.dueDate < new Date())]) {
    expect.soft(texte, `${f.prefix}-${f.number} en retard`).toContain(`${f.prefix}-${f.number}`);
  }
});

test("Ouvrir une facture d'un client : l'espace du client s'ouvre sur la facture", async ({ page }) => {
  const f = FACTURES_PILOTAGE.aEncaisser;
  try {
    await ouvrirListe(page, `${G}/factures?q=${encodeURIComponent(`${f.prefix}-${f.number}`)}`);
    await cliquer(page, page.getByRole("link", { name: `Ouvrir ${f.prefix}-${f.number} de ${COMPTES.pilotage.organisation.name}` }));
    await expect(page).toHaveURL(/\/dashboard\/outils\/factures/, { timeout: 30_000 });
    await etape(page, "Facture ouverte dans l'espace du client", async () => {
      await expect(page.getByText(`${f.prefix}-${f.number}`).first()).toBeVisible({ timeout: 30_000 });
      const session = await (await base()).collection("session").findOne({ token: SESSION_TOKEN_CABINET });
      expect(session.activeOrganizationId).toBe(id(COMPTES.pilotage.organisation));
    }, { capture: "ecran" });
  } finally {
    await remettreEspace(SESSION_TOKEN_CABINET, COMPTES.clientCabinet.organisation._id);
  }
});
