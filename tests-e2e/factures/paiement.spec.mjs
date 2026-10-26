/**
 * Paiement en ligne d'une facture : lien public de l'API
 * (/pay/invoice/:id, redirection vers Stripe Checkout) et pages publiques
 * du site après le paiement (/pay/invoice/[id]/success et /cancel), ouvertes
 * par le client de la facture, sans compte Newbi. Stripe est injoignable en
 * test : le passage par Stripe n'est pas couvert.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { API_URL, BASE_URL } from "../config.mjs";
import { F, F_OFFRE } from "../donnees/lot-factures.mjs";

test.use({ storageState: { cookies: [], origins: [] } });
const id = (doc) => doc._id.toHexString();
const lien = (doc) => `${API_URL}/pay/invoice/${typeof doc === "string" ? doc : id(doc)}`;

test.describe("Paiement en ligne : pages publiques", () => {
  test("Paiement reçu : page de remerciement, sans compte", async ({ page }) => {
    await ouvrir(page, `/pay/invoice/${id(F.payee)}/success`);
    await expect(page.getByRole("heading", { name: "Paiement reçu" })).toBeVisible();
    await expect(page.getByText("votre paiement a bien été enregistré")).toBeVisible();
    await expect(page).toHaveTitle(/Paiement reçu/);
  });

  test("Paiement annulé : message et lien pour réessayer vers le lien de paiement de la facture", async ({ page }) => {
    await ouvrir(page, `/pay/invoice/${id(F.attente)}/cancel`);
    await expect(page.getByRole("heading", { name: "Paiement annulé" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Réessayer le paiement" })).toHaveAttribute("href", lien(F.attente));
  });

  test("Paiement annulé : un identifiant piégé dans l'adresse ne s'exécute pas et le lien reste sur l'API", async ({ page }) => {
    const piege = encodeURIComponent(`"><img src=x onerror="window.__piege=1">`);
    await page.goto(`/pay/invoice/${piege}/cancel`);
    await page.waitForTimeout(1_000);
    expect(await page.evaluate(() => window.__piege ?? null), "Le texte piégé s'est exécuté").toBeNull();
    const href = await page.getByRole("link", { name: "Réessayer le paiement" }).getAttribute("href");
    expect(new URL(href, BASE_URL).origin, "Le lien de nouvel essai quitte l'API de Newbi").toBe(new URL(API_URL).origin);
  });
});

test.describe("Paiement en ligne : lien de paiement de l'API", () => {
  const sansSuivre = { maxRedirects: 0 };

  test("Facture déjà payée : renvoie vers la page « Paiement reçu »", async ({ page }) => {
    const r = await page.request.get(lien(F.payee), sansSuivre);
    expect(r.status()).toBe(302);
    expect(r.headers().location).toBe(`${BASE_URL}/pay/invoice/${id(F.payee)}/success`);
  });

  for (const [cas, f] of [
    ["brouillon", F.brouillon],
    ["annulée", F.annulee],
  ]) {
    test(`Facture ${cas} : « Facture non payable », sans détail de la facture`, async ({ page }) => {
      const r = await page.request.get(lien(f), sansSuivre);
      expect(r.status()).toBe(409);
      const texte = await r.text();
      expect(texte).toContain("Facture non payable");
      expect(texte, "Le client de la facture est révélé").not.toContain(f.client.name);
    });
  }

  test("Organisation sans paiement en ligne : « Paiement en ligne indisponible »", async ({ page }) => {
    const r = await page.request.get(lien(F_OFFRE.attente), sansSuivre);
    expect(r.status()).toBe(409);
    expect(await r.text()).toContain("Paiement en ligne indisponible");
  });

  test("Facture inconnue : « Facture introuvable » (404)", async ({ page }) => {
    const r = await page.request.get(lien("e2e4b0000000000000000999"), sansSuivre);
    expect(r.status()).toBe(404);
    expect(await r.text()).toContain("Facture introuvable");
  });

  test("Identifiant malformé : « Facture introuvable » (404), pas une erreur serveur", async ({ page }) => {
    const r = await page.request.get(lien("pas-un-identifiant"), sansSuivre);
    expect(r.status(), "Un lien de paiement abîmé répond « Erreur de paiement » (500) au lieu de « introuvable »").toBe(404);
  });
});
