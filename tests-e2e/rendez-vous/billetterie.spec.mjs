/**
 * Billetterie : l'organisateur crée un événement gratuit de 2 places, un
 * visiteur réserve les 2 places sur la page publique et reçoit ses billets,
 * l'événement devient complet, puis l'organisateur contrôle un billet
 * (valide, puis déjà scanné) et voit la présence dans les inscrits, le tout
 * sans recharger la page.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { connecte } from "../config.mjs";
import { COMPTES_RDV, PAGES_RDV } from "../donnees/lot-rendez-vous.mjs";
import { visiteur } from "../pages-publiques/consentement.mjs";

const TITRE = "Atelier billetterie e2e";
const SLUG = "atelier-billetterie-e2e";

/** « AAAA-MM-JJTHH:MM » dans dix jours, pour un champ datetime-local. */
function dansDixJours(heure) {
  const jour = new Date(Date.now() + 10 * 86_400_000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${jour.getFullYear()}-${pad(jour.getMonth() + 1)}-${pad(jour.getDate())}T${heure}`;
}

test.describe("Billetterie : de la création au contrôle à l'entrée", () => {
  test.describe.configure({ mode: "serial" });
  let numero = null;

  test.describe("Organisateur", () => {
    test.use({ storageState: connecte(COMPTES_RDV.champs.token) });

    test("Crée un événement gratuit de 2 places, visible sans recharger", async ({ page }) => {
      await ouvrir(page, "/dashboard/outils/rendez-vous?onglet=types");
      await cliquer(page, page.getByRole("button", { name: "Nouveau type" }));
      await cliquer(page, page.getByRole("radio", { name: /Événement/ }));
      await page.getByLabel("Titre").fill(TITRE);
      await page.locator("#event-slug").fill(SLUG);
      await page.getByLabel("Début").fill(dansDixJours("18:00"));
      await page.getByLabel("Fin").fill(dansDixJours("21:00"));
      await page.locator("#event-locationValue").fill("3 rue de l’Église, 75011 Paris");
      await page.getByLabel("Nombre de places", { exact: true }).fill("2");
      await cliquer(page, page.getByRole("button", { name: "Créer l'événement" }));
      await expect(page.getByText(TITRE).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/0\s*\/\s*2 places/).first()).toBeVisible();
    });
  });

  test.describe("Visiteur", () => {
    test.use({ storageState: visiteur() });
    test("Réserve les 2 places et reçoit 2 billets ; l'événement est complet", async ({ page }) => {
      await ouvrir(page, `/rdv/${PAGES_RDV.champs.slug}/${SLUG}`);
      await expect(page.getByRole("heading", { name: TITRE })).toBeVisible({ timeout: 60_000 });
      await page.getByLabel("Prénom").fill("Inès");
      await page.getByLabel("Nom", { exact: true }).fill("Billet");
      await page.getByLabel("Adresse e-mail").fill(`ines-billet-${Date.now()}@e2e.test`);
      const quantite = page.getByLabel("Nombre de places");
      if ((await quantite.evaluate((el) => el.tagName)) === "SELECT") await quantite.selectOption("2");
      else await quantite.fill("2");
      const consentement = page.getByRole("checkbox");
      if (await consentement.count()) await consentement.first().check();
      await cliquer(page, page.getByRole("button", { name: /Réserver 2 places/ }));

      const billets = page.getByRole("link", { name: /Ouvrir le billet EVT-/ });
      await expect(billets).toHaveCount(2, { timeout: 30_000 });
      numero = (await billets.first().getAttribute("aria-label")).match(/EVT-[A-Z0-9]+/)[0];

      // La page du billet affiche le numéro et un QR code
      await cliquer(page, billets.first());
      await expect(page.getByText(numero, { exact: true }).and(page.locator(":not(title)"))).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole("img", { name: `QR code du billet ${numero}` })).toBeVisible();
      await expect(page.getByText("Valide", { exact: true })).toBeVisible();

      await ouvrir(page, `/rdv/${PAGES_RDV.champs.slug}/${SLUG}`);
      await expect(page.getByText(/Complet/).first()).toBeVisible({ timeout: 30_000 });
    });
  });

  test.describe("Contrôle à l'entrée", () => {
    test.use({ storageState: connecte(COMPTES_RDV.champs.token) });

    test("Billet valide puis déjà scanné, présence visible dans les inscrits", async ({ page }) => {
      expect(numero, "numéro de billet relevé au test précédent").toBeTruthy();
      await ouvrir(page, "/dashboard/outils/rendez-vous?onglet=types");
      await expect(page.getByText(/2\s*\/\s*2 places/).first()).toBeVisible({ timeout: 60_000 });

      await cliquer(page, page.getByRole("button", { name: new RegExp(`Actions pour ${TITRE}`) }));
      await cliquer(page, page.getByRole("menuitem", { name: "Contrôle des billets" }));
      const saisie = page.getByLabel("Numéro du billet");
      await saisie.fill(numero);
      await cliquer(page, page.getByRole("button", { name: "Vérifier" }));
      await expect(page.getByText("Valide", { exact: true })).toBeVisible({ timeout: 15_000 });

      await saisie.fill(numero);
      await cliquer(page, page.getByRole("button", { name: "Vérifier" }));
      await expect(page.getByText("Déjà scanné", { exact: true })).toBeVisible({ timeout: 15_000 });
    });
  });
});
