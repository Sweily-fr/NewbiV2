/**
 * Billetterie : prix payé sur place ou en acompte.
 *   - Sur place : l'organisateur crée un événement à 20 € « Sur place, le
 *     jour de l'événement » (sans moyen de paiement connecté) ; un visiteur
 *     s'inscrit sans payer, voit le reste dû sur la confirmation et sur son
 *     billet ; au contrôle, le reste dû s'affiche et l'organisateur le marque
 *     réglé, puis l'annule depuis les inscrits, sans recharger.
 *   - Acompte : avec un compte Stripe connecté (posé en base le temps du
 *     test), événement à 20 € avec 5 € d'acompte ; la page publique annonce
 *     l'acompte et le bouton envoie au paiement de l'acompte. Le paiement
 *     lui-même n'est pas joignable (clé Stripe factice) : la réponse de
 *     l'inscription est simulée, après contrôle de ce que le site envoie.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { connecte } from "../config.mjs";
import { base } from "../base.mjs";
import { COMPTES_RDV, PAGES_RDV } from "../donnees/lot-rendez-vous.mjs";
import { visiteur } from "../pages-publiques/consentement.mjs";
import { API_RDV, brancherIp, choisirDateHeure } from "./outils-rdv.mjs";

/** « AAAA-MM-JJ » dans douze jours. */
function dansDouzeJours() {
  const jour = new Date(Date.now() + 12 * 86_400_000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${jour.getFullYear()}-${pad(jour.getMonth() + 1)}-${pad(jour.getDate())}`;
}

/** Tiroir « Nouveau type » rempli pour un événement payant à 20 €. */
async function creerEvenementPayant(page, { titre, slug, paiement, acompte }) {
  await ouvrir(page, "/dashboard/outils/rendez-vous?onglet=types");
  await cliquer(page, page.getByRole("button", { name: "Nouveau type" }));
  await cliquer(page, page.getByRole("radio", { name: /Événement/ }));
  await page.getByLabel("Titre").fill(titre);
  await page.locator("#event-slug").fill(slug);
  await choisirDateHeure(page, "Début", dansDouzeJours(), "18:00");
  await choisirDateHeure(page, "Fin", dansDouzeJours(), "21:00");
  await page.locator("#event-locationValue").fill("8 place du Marché, 69002 Lyon");
  await page.getByLabel("Nombre de places", { exact: true }).fill("5");
  await page.getByLabel("Prix par place (TTC)").fill("20");
  await cliquer(page, page.getByRole("radio", { name: paiement }));
  if (acompte) await page.getByLabel("Acompte par place (TTC)").fill(acompte);
  await cliquer(page, page.getByRole("button", { name: "Créer l'événement" }));
  await expect(page.getByText(titre).first()).toBeVisible({ timeout: 15_000 });
}

/** Coordonnées du visiteur et nombre de places. */
async function remplirInscription(page, { prenom, nom, places = 1 }) {
  await page.getByLabel("Prénom").fill(prenom);
  await page.getByLabel("Nom", { exact: true }).fill(nom);
  await page.getByLabel("Adresse e-mail").fill(`${prenom.toLowerCase()}-${Date.now()}@e2e.test`);
  if (places > 1) await page.getByLabel("Nombre de places").selectOption(String(places));
  const consentement = page.getByRole("checkbox");
  if (await consentement.count()) await consentement.first().check();
}

test.describe("Billetterie : événement à régler sur place", () => {
  test.describe.configure({ mode: "serial" });
  const TITRE = "Atelier sur place e2e";
  const SLUG = "atelier-sur-place-e2e";
  let numero = null;

  test.describe("Organisateur", () => {
    test.use({ storageState: connecte(COMPTES_RDV.champs.token) });

    test("Crée l'événement à 20 € payé sur place, sans moyen de paiement connecté", async ({ page }) => {
      await creerEvenementPayant(page, { titre: TITRE, slug: SLUG, paiement: /Sur place, le jour de l'événement/ });
      await expect(page.getByText(/20,00\s*€ · sur place/).first()).toBeVisible();
    });
  });

  test.describe("Visiteur", () => {
    test.use({ storageState: visiteur() });

    test("S'inscrit sans payer ; reste dû sur la confirmation et le billet", async ({ page }) => {
      await brancherIp(page);
      await ouvrir(page, `/rdv/${PAGES_RDV.champs.slug}/${SLUG}`);
      await expect(page.getByRole("heading", { name: TITRE })).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText("Paiement sur place le jour de l'événement")).toBeVisible();
      await expect(page.getByText("Moyen de paiement")).toHaveCount(0);

      await remplirInscription(page, { prenom: "Inès", nom: "Surplace" });
      await cliquer(page, page.getByRole("button", { name: "Je m'inscris" }));

      await expect(page.getByRole("heading", { name: "Inscription confirmée" })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/À régler sur place :\s*20,00\s*€/)).toBeVisible();
      const billet = page.getByRole("link", { name: /Ouvrir le billet EVT-/ });
      await expect(billet).toHaveCount(1);
      numero = (await billet.getAttribute("aria-label")).match(/EVT-[A-Z0-9]+/)[0];

      await cliquer(page, billet);
      await expect(page.getByText("Valide", { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/Reste à régler sur place :\s*20,00\s*€/)).toBeVisible();
    });
  });

  test.describe("Contrôle à l'entrée", () => {
    test.use({ storageState: connecte(COMPTES_RDV.champs.token) });

    test("Le contrôle montre le reste dû, « Marquer comme réglé », puis annulation depuis les inscrits", async ({ page }) => {
      expect(numero, "numéro de billet relevé au test précédent").toBeTruthy();
      await ouvrir(page, "/dashboard/outils/rendez-vous?onglet=types");
      await expect(page.getByText(/1\s*\/\s*5 places/).first()).toBeVisible({ timeout: 60_000 });

      await cliquer(page, page.getByRole("button", { name: new RegExp(`Actions pour ${TITRE}`) }));
      await cliquer(page, page.getByRole("menuitem", { name: "Contrôle des billets" }));
      await page.getByLabel("Numéro du billet").fill(numero);
      await cliquer(page, page.getByRole("button", { name: "Vérifier" }));
      await expect(page.getByText("Valide", { exact: true })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/Reste à régler sur place :\s*20,00\s*€/)).toBeVisible();

      await cliquer(page, page.getByRole("button", { name: "Marquer comme réglé" }));
      await expect(page.getByText(/Réglé sur place :\s*20,00\s*€/)).toBeVisible({ timeout: 15_000 });
      const enBase = await (await base()).collection("event_registrations").findOne({ "tickets.number": numero });
      expect(enBase?.onSitePaidAt, "règlement enregistré").toBeTruthy();

      await cliquer(page, page.getByRole("button", { name: "Fermer le contrôle des billets" }));
      await cliquer(page, page.getByRole("button", { name: new RegExp(`Actions pour ${TITRE}`) }));
      await cliquer(page, page.getByRole("menuitem", { name: "Inscrits" }));
      const tiroir = page.getByRole("dialog");
      await expect(tiroir.getByText("Réglé sur place", { exact: true })).toBeVisible({ timeout: 15_000 });

      await cliquer(page, tiroir.getByRole("button", { name: "Actions pour Inès Surplace" }));
      await cliquer(page, page.getByRole("menuitem", { name: "Annuler le règlement sur place" }));
      await expect(tiroir.getByText(/Reste sur place\s*20,00\s*€/).first()).toBeVisible({ timeout: 15_000 });
    });
  });
});

test.describe("Billetterie : acompte en ligne, le reste sur place", () => {
  test.describe.configure({ mode: "serial" });
  const TITRE = "Atelier acompte e2e";
  const SLUG = "atelier-acompte-e2e";
  const COMPTE_STRIPE = { organizationId: String(COMPTES_RDV.champs.organisation._id), accountId: "acct_e2e_acompte" };

  // Compte Stripe « prêt » de l'espace, le temps de ces tests seulement
  test.beforeAll(async () => {
    await (await base()).collection("stripeconnectaccounts").updateOne(
      { organizationId: COMPTE_STRIPE.organizationId },
      {
        $setOnInsert: {
          ...COMPTE_STRIPE,
          connectionType: "oauth",
          chargesEnabled: true,
          detailsSubmitted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  });
  test.afterAll(async () => {
    await (await base()).collection("stripeconnectaccounts").deleteOne(COMPTE_STRIPE);
  });

  test.describe("Organisateur", () => {
    test.use({ storageState: connecte(COMPTES_RDV.champs.token) });

    test("Refuse un acompte égal au prix, puis crée l'événement avec 5 € d'acompte", async ({ page }) => {
      await ouvrir(page, "/dashboard/outils/rendez-vous?onglet=types");
      await cliquer(page, page.getByRole("button", { name: "Nouveau type" }));
      await cliquer(page, page.getByRole("radio", { name: /Événement/ }));
      await page.getByLabel("Prix par place (TTC)").fill("20");
      await cliquer(page, page.getByRole("radio", { name: /Acompte en ligne, le reste sur place/ }));
      await page.getByLabel("Acompte par place (TTC)").fill("20");
      await cliquer(page, page.getByRole("button", { name: "Créer l'événement" }));
      await expect(page.getByText("L'acompte doit être inférieur au prix par place")).toBeVisible();
      await cliquer(page, page.getByRole("button", { name: "Annuler", exact: true }));

      await creerEvenementPayant(page, {
        titre: TITRE,
        slug: SLUG,
        paiement: /Acompte en ligne, le reste sur place/,
        acompte: "5",
      });
      await expect(page.getByText(/20,00\s*€ · acompte 5\s*€/).first()).toBeVisible();
    });
  });

  test.describe("Visiteur", () => {
    test.use({ storageState: visiteur() });

    test("Voit l'acompte et part payer l'acompte de 2 places", async ({ page }) => {
      await brancherIp(page);
      let envoi = null;
      await page.route(`${API_RDV}/**/register`, async (route) => {
        envoi = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ status: "PENDING_PAYMENT", paymentUrl: "https://paiement.e2e.test/acompte" }),
        });
      });
      await page.route("https://paiement.e2e.test/**", (route) =>
        route.fulfill({ contentType: "text/html", body: "<h1>Paiement simulé</h1>" }),
      );

      await ouvrir(page, `/rdv/${PAGES_RDV.champs.slug}/${SLUG}`);
      await expect(page.getByRole("heading", { name: TITRE })).toBeVisible({ timeout: 60_000 });
      await expect(
        page.getByText(/Acompte de 5,00\s*€ par place à la réservation, reste 15,00\s*€ sur place/),
      ).toBeVisible();
      await expect(page.getByText("Moyen de paiement")).toBeVisible();

      await remplirInscription(page, { prenom: "Alix", nom: "Acompte", places: 2 });
      await expect(page.getByText(/Reste 30,00\s*€ à régler sur place/)).toBeVisible();
      await cliquer(page, page.getByRole("button", { name: /Payer l'acompte 10,00\s*€/ }));

      await expect(page).toHaveURL("https://paiement.e2e.test/acompte", { timeout: 30_000 });
      expect(envoi).toMatchObject({ quantity: 2, provider: "stripe" });
    });
  });
});
