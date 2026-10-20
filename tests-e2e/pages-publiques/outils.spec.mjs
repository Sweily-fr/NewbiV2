/**
 * Outils publics (visiteur sans session) : générateurs de facture et de
 * devis (totaux, franchise de TVA, téléchargement du PDF, libellés des
 * champs, texte piégé) et calculateur de pénalités de retard (calculs,
 * saisies réelles, paragraphe de relance). Tout se passe dans le navigateur.
 */
import { readFileSync } from "node:fs";
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { visiteur } from "./consentement.mjs";

test.use({ storageState: visiteur() });

/**
 * Le générateur appelle, pour un visiteur, des routes réservées aux comptes
 * connectés (organisation active) : refus 401 écrits dans la console. Tolérés
 * dans les tests du générateur ; un test dédié le signale.
 */
const REFUS_ORGANISATION = /status of 401.*\/api\/auth\/organization\//;

const ESPACES_SPECIAUX = new RegExp(`[${String.fromCharCode(0x202f, 0xa0)}]`, "g");
const simple = (t) => String(t ?? "").replace(ESPACES_SPECIAUX, " ").replace(/\s+/g, " ").trim();
const deuxDecimales = (n) => simple(n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const jourLocal = (decalage = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + decalage);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(d);
};

// --- Générateurs ------------------------------------------------------------------

const total = async (page, libelle) => simple(await page.locator("main dl").getByText(libelle, { exact: true }).locator("xpath=following-sibling::dd[1]").innerText());

for (const [nom, chemin, prefixe] of [
  ["facture", "/outils/generateur-de-facture", "F"],
  ["devis", "/outils/generateur-de-devis", "D"],
]) {
  test.describe(`Générateur de ${nom}`, () => {
    test.use({ erreursConsoleAutorisees: REFUS_ORGANISATION });
    const ouvrirGenerateur = (page) => ouvrir(page, chemin, { pret: page.getByText("Aperçu en direct", { exact: true }) });

    test("Totaux de deux lignes à 20 % et 5,5 % : HT, TVA et TTC justes", async ({ page }) => {
      await ouvrirGenerateur(page);
      await page.getByPlaceholder("Prestation de conseil").first().fill("Création de logo");
      const nombres = page.locator("main input[type=number]");
      await nombres.nth(0).fill("2");
      await nombres.nth(1).fill("450");
      await page.getByRole("button", { name: "Ajouter une ligne" }).click();
      await page.getByPlaceholder("Prestation de conseil").nth(1).fill("Impression de flyers");
      await nombres.nth(2).fill("3");
      await nombres.nth(3).fill("12.5");
      await page.locator("main select").nth(1).selectOption("5.5");
      const ht = 2 * 450 + 3 * 12.5;
      const tva = 2 * 450 * 0.2 + 3 * 12.5 * 0.055;
      await etape(page, "Totaux", async () => {
        expect(await total(page, "Total HT")).toBe(`${deuxDecimales(ht)} €`);
        expect(await total(page, "TVA")).toBe(`${deuxDecimales(tva)} €`);
        expect(await total(page, "Total TTC")).toBe(`${deuxDecimales(ht + tva)} €`);
      }, { capture: "ecran" });
    });

    test("Franchise en base de TVA : aucune TVA, mention de l'article 293 B dans l'aperçu", async ({ page }) => {
      await ouvrirGenerateur(page);
      const nombres = page.locator("main input[type=number]");
      await nombres.nth(0).fill("1");
      await nombres.nth(1).fill("800");
      await page.getByRole("checkbox", { name: /franchise en base de TVA/ }).click();
      await expect(page.locator("main dl").getByText("TVA", { exact: true })).toHaveCount(0);
      expect(await total(page, "Total à payer")).toBe(`${deuxDecimales(800)} €`);
      await expect(page.getByText(/article 293 B du Code général des impôts/).first()).toBeVisible();
    });

    test("Supprimer une ligne : impossible quand il n'en reste qu'une", async ({ page }) => {
      await ouvrirGenerateur(page);
      await expect(page.getByRole("button", { name: "Supprimer la ligne" })).toBeDisabled();
      await page.getByRole("button", { name: "Ajouter une ligne" }).click();
      await expect(page.getByRole("button", { name: "Supprimer la ligne" })).toHaveCount(2);
      await page.getByRole("button", { name: "Supprimer la ligne" }).last().click();
      await expect(page.getByRole("button", { name: "Supprimer la ligne" })).toHaveCount(1);
    });

    test("Téléchargement : grisé tant que la case de responsabilité n'est pas cochée, puis un vrai PDF", async ({ page }) => {
      test.setTimeout(120_000);
      await ouvrirGenerateur(page);
      await page.getByPlaceholder("Atelier Dupont").fill("Atelier Zoë L’Hôte");
      await page.getByPlaceholder("Société Martin").fill("Cœur d’Artichaut SARL");
      const bouton = page.getByRole("button", { name: new RegExp(`^Télécharger (la facture|le devis) en PDF$`) });
      await expect(bouton).toBeDisabled();
      await page.locator("#consent").click();
      await expect(bouton).toBeEnabled();
      const [telechargement] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), bouton.click()]);
      expect(telechargement.suggestedFilename()).toBe(`${prefixe}-${new Date().getFullYear()}-001.pdf`);
      const fichier = readFileSync(await telechargement.path());
      expect(fichier.subarray(0, 4).toString(), "Le fichier n'est pas un PDF").toBe("%PDF");
    });

    test("Texte piégé dans le nom du client : affiché dans l'aperçu comme du texte", async ({ page }) => {
      await ouvrirGenerateur(page);
      await page.getByPlaceholder("Société Martin").fill(`Client <img src="x-piege" onerror="window.__piege='execute';alert('code exécuté')">`);
      await page.waitForTimeout(1_000);
      expect(await page.evaluate(() => window.__piege ?? null), "Le code s'est exécuté dans l'aperçu").toBeNull();
      await expect(page.getByText(/Client <img/).first()).toBeVisible();
    });

    test("Un visiteur n'appelle aucune route réservée aux comptes connectés", async ({ page }) => {
      const refus = [];
      page.on("response", (r) => {
        if (r.status() === 401) refus.push(new URL(r.url()).pathname);
      });
      await ouvrirGenerateur(page);
      await page.waitForTimeout(1_500);
      expect(refus, "Routes réservées aux comptes connectés appelées depuis la page publique (refus 401 dans la console)").toEqual([]);
    });

    test("Chaque champ de saisie porte son libellé (lu par les lecteurs d'écran)", async ({ page }) => {
      await ouvrirGenerateur(page);
      const sansLibelle = await page.evaluate(() =>
        [...document.querySelectorAll("main input, main select, main textarea")]
          .filter((e) => e.type !== "hidden" && e.getBoundingClientRect().width > 0)
          .filter((e) => !(e.labels?.length || e.getAttribute("aria-label") || e.getAttribute("aria-labelledby")))
          .map((e) => e.getAttribute("placeholder") || `${e.tagName.toLowerCase()}[type=${e.type}]`),
      );
      expect(sansLibelle, "Champs sans libellé associé (le texte au-dessus n'est pas relié au champ)").toEqual([]);
    });
  });
}

// --- Calculateur de pénalités ------------------------------------------------------

test.describe("Calculateur de pénalités de retard", () => {
  const ouvrirCalculateur = (page) => ouvrir(page, "/outils/calculateur-penalites-retard", { pret: page.getByLabel("Montant TTC resté impayé") });
  const resultat = (page) => page.locator("main").getByText("montant total dû", { exact: true }).locator("xpath=preceding-sibling::p[1]");
  const ligneDetail = async (page, libelle) => simple(await page.locator("main dl").getByText(libelle, { exact: true }).locator("xpath=following-sibling::dd[1]").innerText());
  const euros = (n) => simple(new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n));

  async function calculer(page, { montant, echeance, paiement, taux }) {
    await page.getByLabel("Montant TTC resté impayé").fill(montant);
    await page.getByLabel("Date d'échéance").fill(echeance);
    if (paiement) await page.getByLabel("Date de paiement").fill(paiement);
    await page.getByLabel("Taux annuel des pénalités").fill(taux);
  }

  test("1 000 € payés 30 jours après l'échéance, taux 12 % : pénalités, indemnité et total justes", async ({ page }) => {
    await ouvrirCalculateur(page);
    await calculer(page, { montant: "1000", echeance: jourLocal(-30), taux: "12" });
    const penalites = (1000 * 0.12 * 30) / 365;
    await etape(page, "Résultat", async () => {
      await expect(page.getByText("30 jours de retard", { exact: true })).toBeVisible();
      expect(await ligneDetail(page, "Pénalités de retard")).toBe(euros(penalites));
      expect(await ligneDetail(page, "Indemnité forfaitaire")).toBe(euros(40));
      expect(simple(await resultat(page).innerText())).toBe(euros(1000 + penalites + 40));
    }, { capture: "ecran" });
  });

  test("Montant écrit comme l'exemple du champ (« 1 200 ») : calculé sur 1 200 €", async ({ page }) => {
    await ouvrirCalculateur(page);
    await calculer(page, { montant: "1 200", echeance: jourLocal(-10), taux: "10" });
    expect(await ligneDetail(page, "Facture impayée"), "« 1 200 » (avec l'espace, comme l'exemple affiché) est lu comme 1 €").toBe(euros(1200));
  });

  test("Montant avec une virgule (1200,50) : accepté", async ({ page }) => {
    await ouvrirCalculateur(page);
    await calculer(page, { montant: "1200,50", echeance: jourLocal(-10), taux: "10" });
    expect(await ligneDetail(page, "Facture impayée")).toBe(euros(1200.5));
  });

  test("Paiement le jour de l'échéance : aucun retard, aucune indemnité", async ({ page }) => {
    await ouvrirCalculateur(page);
    const jour = jourLocal(-5);
    await calculer(page, { montant: "500", echeance: jour, paiement: jour, taux: "12" });
    await expect(page.getByText("Aucun retard", { exact: true })).toBeVisible();
    expect(await ligneDetail(page, "Indemnité forfaitaire")).toBe(euros(0));
    expect(simple(await resultat(page).innerText())).toBe(euros(500));
  });

  test("Sans l'indemnité forfaitaire : 0 € d'indemnité", async ({ page }) => {
    await ouvrirCalculateur(page);
    await calculer(page, { montant: "500", echeance: jourLocal(-20), taux: "12" });
    await page.getByLabel(/Ajouter l'indemnité forfaitaire/).click();
    expect(await ligneDetail(page, "Indemnité forfaitaire")).toBe(euros(0));
  });

  test("Montant négatif : aucun montant dû négatif", async ({ page }) => {
    await ouvrirCalculateur(page);
    await calculer(page, { montant: "-500", echeance: jourLocal(-20), taux: "12" });
    await page.waitForTimeout(300);
    const affiche = (await resultat(page).count()) ? simple(await resultat(page).innerText()) : "";
    expect(affiche, "Un montant dû négatif est calculé et affiché").not.toMatch(/^-/);
  });

  test("Copier le paragraphe de relance : le texte copié reprend le calcul", async ({ page }) => {
    await ouvrirCalculateur(page);
    await calculer(page, { montant: "1000", echeance: jourLocal(-30), taux: "12" });
    await page.getByRole("button", { name: "Copier" }).click();
    await expect(page.getByRole("button", { name: "Copié" })).toBeVisible();
    const copie = simple(await page.evaluate(() => navigator.clipboard.readText()));
    expect(copie).toContain("30 jours de retard");
    expect(copie).toContain("au taux annuel de 12 %");
    expect(copie).toContain(euros(1000 + (1000 * 0.12 * 30) / 365 + 40));
  });
});
