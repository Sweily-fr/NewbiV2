/**
 * Accueil : chaque lien et chaque raccourci mène à la bonne page, déjà
 * filtrée sur ce que la ligne annonce (« En retard » ouvre les factures en
 * retard, « Justificatifs manquants » l'onglet des transactions sans
 * justificatif…). Plusieurs lignes partagent la même adresse : le test
 * « tous les boutons » n'en essaie qu'une, celles-ci sont essayées ici.
 */
import { test, expect, etape, fenetre } from "../outils.mjs";
import { attendrePagePrete, cliquer } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_PILOTAGE } from "../config.mjs";
import { cadreDuMois, ouvrirAccueil } from "./outils-accueil.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

const ligne = (page, libelle) => page.getByRole("link", { name: new RegExp(`^${libelle}\\s*\\d+$`) });
const ongletActif = (page, nom) => page.getByRole("tab", { name: new RegExp(`^${nom}`) });

async function suivre(page, lien, url) {
  await cliquer(page, lien);
  await expect(page).toHaveURL(url, { timeout: 30_000 });
  await attendrePagePrete(page);
}

test.describe("Accueil : liens du cadre du mois", () => {
  test("« En cours » ouvre les factures à encaisser", async ({ page }) => {
    await ouvrirAccueil(page);
    await suivre(page, cadreDuMois(page).locator('a[href="/dashboard/outils/factures?status=pending"]'), /\/dashboard\/outils\/factures\?status=pending$/);
    await etape(page, "Onglet « À encaisser » ouvert", () => expect(ongletActif(page, "À encaisser")).toHaveAttribute("aria-selected", "true"), { capture: "ecran" });
  });

  test("« En retard » (ventes) ouvre les factures en retard", async ({ page }) => {
    await ouvrirAccueil(page);
    await suivre(page, cadreDuMois(page).locator('a[href="/dashboard/outils/factures?status=overdue"]'), /\/dashboard\/outils\/factures\?status=overdue$/);
    await expect(ongletActif(page, "En retard")).toHaveAttribute("aria-selected", "true");
  });

  test("« À payer » (achats) ouvre les factures d'achat", async ({ page }) => {
    await ouvrirAccueil(page);
    await suivre(page, cadreDuMois(page).locator('a[href="/dashboard/outils/factures-achat"]').filter({ hasText: "À payer" }), /\/dashboard\/outils\/factures-achat$/);
  });

  test("« Voir les factures » ouvre la liste des factures", async ({ page }) => {
    await ouvrirAccueil(page);
    await suivre(page, cadreDuMois(page).getByRole("link", { name: "Voir les factures" }), /\/dashboard\/outils\/factures$/);
  });
});

test.describe("Accueil : lignes « À traiter »", () => {
  test("« Factures en retard » ouvre les factures en retard", async ({ page }) => {
    await ouvrirAccueil(page);
    await cliquer(page, ligne(page, "Factures en retard"));
    await expect(page).toHaveURL(/\/dashboard\/outils\/factures/);
    await attendrePagePrete(page);
    await etape(
      page,
      "Onglet « En retard » ouvert",
      () => expect(ongletActif(page, "En retard"), `Le lien mène à ${new URL(page.url()).pathname + new URL(page.url()).search}, qui ouvre toutes les factures`).toHaveAttribute("aria-selected", "true"),
      { capture: "ecran" },
    );
  });

  test("« Factures à envoyer » ouvre la liste des factures", async ({ page }) => {
    await ouvrirAccueil(page);
    await suivre(page, ligne(page, "Factures à envoyer"), /\/dashboard\/outils\/factures$/);
  });

  test("« Devis en attente » ouvre la liste des devis", async ({ page }) => {
    await ouvrirAccueil(page);
    await suivre(page, ligne(page, "Devis en attente"), /\/dashboard\/outils\/devis$/);
  });

  test("« Rapprochements à faire » ouvre l'onglet « À rapprocher » des transactions", async ({ page }) => {
    await ouvrirAccueil(page);
    await suivre(page, ligne(page, "Rapprochements à faire"), /\/dashboard\/outils\/transactions\?filter=unmatched$/);
    await expect(ongletActif(page, "À rapprocher")).toHaveAttribute("aria-selected", "true");
  });

  test("« Justificatifs manquants » ouvre l'onglet « Justificatif manquant » des transactions", async ({ page }) => {
    await ouvrirAccueil(page);
    await suivre(page, ligne(page, "Justificatifs manquants"), /\/dashboard\/outils\/transactions\?filter=/);
    await etape(
      page,
      "Onglet « Justificatif manquant » ouvert",
      () => expect(ongletActif(page, "Justificatif manquant"), "Le lien (?filter=missing_receipts) ouvre l'onglet « Toutes »").toHaveAttribute("aria-selected", "true"),
      { capture: "ecran" },
    );
  });

  test("« Notifications non lues » ouvre les notifications", async ({ page }) => {
    await ouvrirAccueil(page);
    await cliquer(page, ligne(page, "Notifications non lues"));
    await etape(
      page,
      "Paramètres ouverts sur les notifications",
      () => expect(fenetre(page, "Paramètres de l'application"), "Le clic ne fait rien : l'événement « openSettingsModal » n'est écouté nulle part").toBeVisible({ timeout: 5_000 }),
      { capture: "ecran" },
    );
  });

  test("« Achats à payer » ouvre les factures d'achat", async ({ page }) => {
    await ouvrirAccueil(page);
    await suivre(page, ligne(page, "Achats à payer"), /\/dashboard\/outils\/factures-achat$/);
  });

  test("« Transferts en cours » ouvre les transferts de fichiers", async ({ page }) => {
    await ouvrirAccueil(page);
    await suivre(page, ligne(page, "Transferts en cours"), /\/dashboard\/outils\/transferts-fichiers$/);
  });
});
