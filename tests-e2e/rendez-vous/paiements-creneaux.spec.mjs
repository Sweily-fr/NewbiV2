/**
 * Prise de rendez-vous payante : créneaux et événements, tous les moyens des
 * transferts (carte Stripe, PayPal, SumUp, virement).
 *   - Créneau « Sur place » : réservé et confirmé sans paiement en ligne, reste
 *     dû annoncé.
 *   - Créneau « En ligne » par carte : choix du moyen après le créneau et le
 *     formulaire, jusqu'à la redirection vers le prestataire (clé Stripe
 *     factice : la réponse de la réservation est simulée, après contrôle de ce
 *     que le site envoie). Le premier créneau est proche : le virement
 *     reste proposé (aucun délai minimum), virement instantané conseillé.
 *   - Créneau « En ligne » par virement, pour de vrai : panneau (IBAN,
 *     référence, montant), « J'ai fait le virement » (rien de confirmé),
 *     « Marquer comme payé » par l'organisateur, puis confirmation visible
 *     par l'invité.
 *   - Événement payé par virement : même parcours avec les inscrits.
 *   - Moyens choisis par l'organisateur (comme les transferts) : liste des
 *     moyens et leur état dans le tiroir, moyen décoché absent de la page
 *     publique, aucun moyen utilisable : message au lieu du bouton.
 *
 * Espace « Paiements » du lot (IBAN renseigné) ; compte Stripe « prêt » posé
 * en base le temps de ces tests.
 */
import { mkdirSync } from "node:fs";
import { test, expect } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { connecte } from "../config.mjs";
import { base } from "../base.mjs";
import { COMPTES_RDV, PAGES_RDV } from "../donnees/lot-rendez-vous.mjs";
import { visiteur } from "../pages-publiques/consentement.mjs";
import { brancherIp, choisirDateHeure } from "./outils-rdv.mjs";

const COMPTE = COMPTES_RDV.paiements;
const PAGE = PAGES_RDV.paiements;
const ORG = String(COMPTE.organisation._id);
const COMPTE_STRIPE = { organizationId: ORG, accountId: "acct_e2e_paiements_rdv" };
const SUR_PLACE = { nom: "Consultation sur place e2e", slug: "consultation-sur-place-e2e" };
const EN_LIGNE = { nom: "Consultation payante e2e", slug: "consultation-payante-e2e" };
const EVENEMENT = { nom: "Atelier virement e2e", slug: "atelier-virement-e2e" };

// Captures de contrôle visuel (CAPTURES_PAIEMENTS=<dossier>), sans effet sinon
async function capture(page, nom) {
  const dossier = process.env.CAPTURES_PAIEMENTS;
  if (!dossier) return;
  mkdirSync(dossier, { recursive: true });
  // Fin des animations d'ouverture (tiroirs, fenêtres)
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${dossier}/${nom}.png`, fullPage: true });
}

const adresse = (prenom) => `${prenom.toLowerCase()}-${Date.now()}@e2e.test`;

/** « AAAA-MM-JJ » dans douze jours. */
function dansDouzeJours() {
  const jour = new Date(Date.now() + 12 * 86_400_000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${jour.getFullYear()}-${pad(jour.getMonth() + 1)}-${pad(jour.getDate())}`;
}

/** Tiroir « Nouveau type » rempli pour un type Créneaux payant à 40 €. */
async function creerCreneauPayant(page, { nom, slug, paiement }) {
  await cliquer(page, page.getByRole("button", { name: "Nouveau type" }));
  await page.getByLabel("Nom", { exact: true }).fill(nom);
  await page.locator("#type-slug").fill(slug);
  await page.getByLabel("Prix du rendez-vous (TTC)").fill("40");
  await cliquer(page, page.getByRole("radio", { name: paiement }));
  await cliquer(page, page.getByRole("button", { name: "Créer le type" }));
  await expect(page.getByText(nom).first()).toBeVisible({ timeout: 15_000 });
}

/** Premier créneau proposé, puis coordonnées de l'invité. */
async function choisirCreneauEtRemplir(page, { prenom, nom }) {
  await expect(page.getByRole("heading", { name: "Choisissez un créneau" })).toBeVisible({ timeout: 60_000 });
  const premier = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
  await expect(premier).toBeVisible({ timeout: 30_000 });
  await premier.click();
  await expect(page.getByRole("heading", { name: "Vos coordonnées" })).toBeVisible();
  await page.getByLabel("Prénom").fill(prenom);
  await page.getByLabel("Nom", { exact: true }).fill(nom);
  const email = adresse(prenom);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Téléphone").fill("+33 6 12 34 56 78");
  return email;
}

test.describe("Prise de rendez-vous : créneaux et événements payants", () => {
  test.describe.configure({ mode: "serial" });
  let emailVirement = null;
  let gestionVirement = null;
  let inscriptionVirement = null;

  test.beforeAll(async () => {
    await (await base()).collection("stripeconnectaccounts").updateOne(
      { organizationId: ORG },
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
    test.use({ storageState: connecte(COMPTE.token) });

    test("Crée un créneau payé sur place et un créneau payé en ligne ; acompte trop élevé refusé", async ({ page }) => {
      await ouvrir(page, "/dashboard/outils/rendez-vous?onglet=types");

      // Acompte égal au prix : refusé avant tout envoi
      await cliquer(page, page.getByRole("button", { name: "Nouveau type" }));
      await page.getByLabel("Prix du rendez-vous (TTC)").fill("40");
      await cliquer(page, page.getByRole("radio", { name: /Acompte en ligne, le reste sur place/ }));
      await page.getByLabel("Acompte (TTC)").fill("40");
      // Moyens proposés, comme les transferts : une case et un état chacun
      await expect(page.getByText("Moyens de paiement proposés")).toBeVisible();
      await expect(page.getByRole("checkbox", { name: "Carte bancaire (Stripe)" })).toBeChecked({ timeout: 15_000 });
      await expect(page.getByRole("checkbox", { name: "Virement bancaire" })).toBeChecked();
      await expect(page.getByRole("checkbox", { name: "Carte bancaire (SumUp)" })).toBeVisible();
      await expect(page.getByRole("checkbox", { name: "PayPal" })).toBeVisible();
      await expect(page.getByText(/Sur votre compte Stripe/)).toBeVisible();
      await expect(page.getByText(/Votre client voit votre IBAN/)).toBeVisible();
      await page.getByRole("checkbox", { name: "Virement bancaire" }).scrollIntoViewIfNeeded();
      await capture(page, "tiroir-creneau-payant");
      await cliquer(page, page.getByRole("button", { name: "Créer le type" }));
      await expect(page.getByText("L'acompte doit être inférieur au prix")).toBeVisible();
      await cliquer(page, page.getByRole("button", { name: "Annuler", exact: true }));

      await creerCreneauPayant(page, { ...SUR_PLACE, paiement: /Sur place, au rendez-vous/ });
      await expect(page.getByText(/40,00\s*€ · sur place/).first()).toBeVisible();
      await creerCreneauPayant(page, { ...EN_LIGNE, paiement: /En ligne à la réservation/ });

      const types = await (await base())
        .collection("appointment_types")
        .find({ workspaceId: COMPTE.organisation._id, slug: { $in: [SUR_PLACE.slug, EN_LIGNE.slug] } })
        .toArray();
      const parSlug = Object.fromEntries(types.map((type) => [type.slug, type]));
      expect(parSlug[SUR_PLACE.slug]?.paymentMode).toBe("ON_SITE");
      expect(parSlug[EN_LIGNE.slug]?.paymentMode).toBe("ONLINE");
    });
  });

  test.describe("Invité", () => {
    test.use({ storageState: visiteur() });

    test("Créneau sur place : confirmé sans paiement, reste dû annoncé", async ({ page }) => {
      await brancherIp(page);
      await ouvrir(page, `/rdv/${PAGE.slug}`);
      await expect(page.getByRole("link", { name: new RegExp(SUR_PLACE.nom) })).toContainText(/40,00\s*€, sur place/, {
        timeout: 60_000,
      });
      await ouvrir(page, `/rdv/${PAGE.slug}/${SUR_PLACE.slug}`);
      await expect(page.getByText("Paiement sur place, au rendez-vous")).toBeVisible({ timeout: 60_000 });
      const email = await choisirCreneauEtRemplir(page, { prenom: "Sacha", nom: "Surplace" });
      await expect(page.getByText("Moyen de paiement")).toHaveCount(0);
      await expect(page.getByText(/40,00\s*€ à régler sur place, au rendez-vous/)).toBeVisible();
      await cliquer(page, page.getByRole("button", { name: "Confirmer le rendez-vous" }));

      await expect(page.getByRole("heading", { name: "Rendez-vous confirmé" })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/À régler sur place :\s*40,00\s*€/)).toBeVisible();
      const enBase = await (await base()).collection("bookings").findOne({ "guest.email": email });
      expect(enBase).toMatchObject({ status: "CONFIRMED", paymentMode: "ON_SITE" });
    });

    test("Créneau en ligne : moyen choisi après le formulaire, redirection vers la carte", async ({ page }) => {
      await brancherIp(page);
      let envoi = null;
      await page.route(`**/api/public/booking/${PAGE.slug}/${EN_LIGNE.slug}/book`, async (route) => {
        envoi = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ status: "PENDING_PAYMENT", paymentUrl: "https://paiement.e2e.test/rdv" }),
        });
      });
      await page.route("https://paiement.e2e.test/**", (route) =>
        route.fulfill({ contentType: "text/html", body: "<h1>Paiement simulé</h1>" }),
      );

      await ouvrir(page, `/rdv/${PAGE.slug}/${EN_LIGNE.slug}`);
      await expect(page.getByText("Paiement en ligne à la réservation")).toBeVisible({ timeout: 60_000 });
      await choisirCreneauEtRemplir(page, { prenom: "Camille", nom: "Carte" });
      await expect(page.getByText("Moyen de paiement")).toBeVisible();
      await expect(page.getByRole("radio", { name: /Carte bancaire/ })).toBeChecked();
      // Premier créneau proche : virement proposé quand même (virement
      // instantané conseillé), aucune règle des 48 h
      await expect(page.getByRole("radio", { name: /Virement/ })).toHaveCount(1);
      await expect(page.getByText(/faites de préférence un virement instantané/)).toBeVisible();
      await expect(page.getByText(/48 h/)).toHaveCount(0);
      await capture(page, "page-publique-creneau-payant");
      await cliquer(page, page.getByRole("button", { name: /Payer 40,00\s*€/ }));

      await expect(page).toHaveURL("https://paiement.e2e.test/rdv", { timeout: 30_000 });
      expect(envoi).toMatchObject({ provider: "stripe" });
    });

    test("Créneau en ligne par virement : panneau, annonce, rien de confirmé", async ({ page }) => {
      // Préavis de 3 jours : le premier créneau proposé permet le virement
      await (await base())
        .collection("appointment_types")
        .updateOne({ workspaceId: COMPTE.organisation._id, slug: EN_LIGNE.slug }, { $set: { minNoticeMinutes: 4320 } });
      await brancherIp(page);
      await ouvrir(page, `/rdv/${PAGE.slug}/${EN_LIGNE.slug}`);
      emailVirement = await choisirCreneauEtRemplir(page, { prenom: "Victor", nom: "Virement" });
      // Début à plus de 3 jours : garde de 3 jours, pas de conseil
      await expect(
        page.getByText(/^Le créneau est gardé jusqu'au .+\. Il est confirmé dès que le virement arrive\.$/),
      ).toBeVisible();
      await capture(page, "page-publique-creneau-virement");
      await cliquer(page, page.getByRole("radio", { name: /Virement/ }));
      await cliquer(page, page.getByRole("button", { name: /Payer 40,00\s*€/ }));

      await expect(page).toHaveURL(/\/rdv\/gerer\/[A-Za-z0-9_-]+$/, { timeout: 30_000 });
      gestionVirement = new URL(page.url()).pathname;
      await expect(page.getByText("Virement en attente", { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText("FR76 3000 6000 0112 3456 7890 189")).toBeVisible();
      await expect(page.getByText(/^NB-[A-Z0-9]{6}$/)).toBeVisible();
      await expect(page.getByText(/Virement en attente :\s*40,00\s*€/)).toBeVisible();
      await expect(page.getByText("Le créneau vous est gardé jusqu'au", { exact: false })).toBeVisible();
      await capture(page, "panneau-virement-creneau");

      await cliquer(page, page.getByRole("button", { name: "J'ai fait le virement" }));
      await expect(page.getByText(/Virement annoncé le/)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("Confirmé", { exact: true })).toHaveCount(0);

      const enBase = await (await base()).collection("bookings").findOne({ "guest.email": emailVirement });
      expect(enBase).toMatchObject({ status: "PENDING_PAYMENT", payment: { provider: "bank_transfer" } });
      expect(enBase.payment?.declaredAt, "annonce enregistrée").toBeTruthy();
    });
  });

  test.describe("Organisateur reçoit le virement", () => {
    test.use({ storageState: connecte(COMPTE.token) });

    test("« Marquer comme payé » confirme le rendez-vous sans recharger", async ({ page }) => {
      expect(emailVirement, "réservation par virement du test précédent").toBeTruthy();
      await ouvrir(page, "/dashboard/outils/rendez-vous");
      await cliquer(page, page.getByRole("tab", { name: /En attente de paiement/ }));
      const ligne = page.getByRole("button", { name: /Victor Virement/ });
      await expect(ligne).toBeVisible({ timeout: 30_000 });
      await expect(ligne.getByText("Virement en attente")).toBeVisible();
      await capture(page, "reservations-en-attente");
      await cliquer(page, ligne);

      const fiche = page.getByRole("dialog");
      await expect(fiche.getByText(/^NB-[A-Z0-9]{6}$/)).toBeVisible({ timeout: 15_000 });
      await expect(fiche.getByText("Annoncé le", { exact: true })).toBeVisible();
      await capture(page, "fiche-reservation-virement");
      await cliquer(page, fiche.getByRole("button", { name: "Marquer comme payé" }));
      await cliquer(page, page.getByRole("button", { name: "Confirmer le rendez-vous" }));
      await expect(page.getByText("Rendez-vous confirmé, l'invité est prévenu")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole("dialog").getByText(/Rendez-vous confirmé ·/)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole("dialog").getByText(/Payé en ligne :\s*40,00\s*€/)).toBeVisible();

      const enBase = await (await base()).collection("bookings").findOne({ "guest.email": emailVirement });
      expect(enBase?.status).toBe("CONFIRMED");
    });
  });

  test.describe("Invité après le virement", () => {
    test.use({ storageState: visiteur() });

    test("La page du rendez-vous le montre confirmé et payé", async ({ page }) => {
      expect(gestionVirement).toBeTruthy();
      await brancherIp(page);
      await ouvrir(page, gestionVirement);
      await expect(page.getByText("Confirmé", { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/Payé en ligne :\s*40,00\s*€/)).toBeVisible();
      await expect(page.getByRole("button", { name: "J'ai fait le virement" })).toHaveCount(0);
    });
  });

  test.describe("Événement par virement : organisateur", () => {
    test.use({ storageState: connecte(COMPTE.token) });

    test("Crée un événement à 15 € payé en ligne (IBAN seul suffit)", async ({ page }) => {
      await ouvrir(page, "/dashboard/outils/rendez-vous?onglet=types");
      await cliquer(page, page.getByRole("button", { name: "Nouveau type" }));
      await cliquer(page, page.getByRole("radio", { name: /Événement/ }));
      await page.getByLabel("Titre").fill(EVENEMENT.nom);
      await page.locator("#event-slug").fill(EVENEMENT.slug);
      await choisirDateHeure(page, "Début", dansDouzeJours(), "18:00");
      await choisirDateHeure(page, "Fin", dansDouzeJours(), "21:00");
      await page.locator("#event-locationValue").fill("8 place du Marché, 69002 Lyon");
      await page.getByLabel("Nombre de places", { exact: true }).fill("5");
      await page.getByLabel("Prix par place (TTC)").fill("15");
      await cliquer(page, page.getByRole("radio", { name: /En ligne à l'inscription/ }));
      await cliquer(page, page.getByRole("button", { name: "Créer l'événement" }));
      await expect(page.getByText(EVENEMENT.nom).first()).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe("Événement par virement : participant", () => {
    test.use({ storageState: visiteur() });

    test("S'inscrit par virement : coordonnées, référence, annonce", async ({ page }) => {
      await brancherIp(page);
      await ouvrir(page, `/rdv/${PAGE.slug}/${EVENEMENT.slug}`);
      await expect(page.getByRole("heading", { name: EVENEMENT.nom })).toBeVisible({ timeout: 60_000 });
      await page.getByLabel("Prénom").fill("Vera");
      await page.getByLabel("Nom", { exact: true }).fill("Virement");
      await page.getByLabel("Adresse e-mail").fill(adresse("Vera"));
      const consentement = page.getByRole("checkbox");
      if (await consentement.count()) await consentement.first().check();
      await expect(
        page.getByText(/^Votre place est gardée jusqu'au .+\. Elle est confirmée dès que le virement arrive\.$/),
      ).toBeVisible();
      // Liste « Nombre de places » : vrai <select>, flèche dessinée
      await page.getByLabel("Nombre de places").selectOption("2");
      await expect(page.getByLabel("Nombre de places")).toHaveValue("2");
      await page.getByLabel("Nombre de places").selectOption("1");
      await capture(page, "page-publique-evenement");
      await cliquer(page, page.getByRole("radio", { name: /Virement/ }));
      await cliquer(page, page.getByRole("button", { name: /Payer 15,00\s*€/ }));

      await expect(page).toHaveURL(/\/rdv\/inscription\/[A-Za-z0-9_-]+$/, { timeout: 30_000 });
      inscriptionVirement = new URL(page.url()).pathname;
      await expect(page.getByRole("heading", { name: "Inscription en attente de votre virement" })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText(/^NB-[A-Z0-9]{6}$/)).toBeVisible();
      await capture(page, "panneau-virement-evenement");
      await cliquer(page, page.getByRole("button", { name: "J'ai fait le virement" }));
      await expect(page.getByText(/Virement annoncé le/)).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe("Événement par virement : inscrits", () => {
    test.use({ storageState: connecte(COMPTE.token) });

    test("« Virement en attente », puis « Marquer comme payé » émet les billets", async ({ page }) => {
      expect(inscriptionVirement).toBeTruthy();
      await ouvrir(page, "/dashboard/outils/rendez-vous?onglet=types");
      await cliquer(page, page.getByRole("button", { name: new RegExp(`Actions pour ${EVENEMENT.nom}`) }));
      await cliquer(page, page.getByRole("menuitem", { name: "Inscrits" }));
      const tiroir = page.getByRole("dialog");
      await expect(tiroir.getByText("Virement en attente").first()).toBeVisible({ timeout: 30_000 });
      await expect(tiroir.getByText(/Annoncé le/).first()).toBeVisible();
      await capture(page, "inscrits-virement");

      await cliquer(page, tiroir.getByRole("button", { name: /Actions pour Vera Virement/ }));
      await cliquer(page, page.getByRole("menuitem", { name: "Marquer comme payé" }));
      await cliquer(page, page.getByRole("button", { name: "Confirmer l'inscription" }));
      await expect(page.getByText("Inscription confirmée, les billets sont envoyés")).toBeVisible({ timeout: 30_000 });
      await expect(tiroir.getByText("Confirmée", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe("Événement par virement : billets", () => {
    test.use({ storageState: visiteur() });

    test("La page de l'inscription montre les billets", async ({ page }) => {
      await brancherIp(page);
      await ouvrir(page, inscriptionVirement);
      await expect(page.getByRole("heading", { name: "Vos billets" })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/Payé en ligne :\s*15,00\s*€/)).toBeVisible();
    });
  });

  test.describe("Moyens choisis : organisateur", () => {
    test.use({ storageState: connecte(COMPTE.token) });

    test("Décocher le virement d'un créneau payant : enregistré, carte seule", async ({ page }) => {
      await ouvrir(page, "/dashboard/outils/rendez-vous?onglet=types");
      await cliquer(page, page.getByRole("button", { name: new RegExp(`Actions pour ${EN_LIGNE.nom}`) }));
      await cliquer(page, page.getByRole("menuitem", { name: "Modifier" }));
      const virement = page.getByRole("checkbox", { name: "Virement bancaire" });
      await expect(virement).toBeChecked({ timeout: 15_000 });
      await cliquer(page, virement);
      await expect(virement).not.toBeChecked();
      await virement.scrollIntoViewIfNeeded();
      await capture(page, "tiroir-moyens-choisis");
      await cliquer(page, page.getByRole("button", { name: "Enregistrer" }));
      await expect
        .poll(
          async () =>
            (
              await (await base())
                .collection("appointment_types")
                .findOne({ workspaceId: COMPTE.organisation._id, slug: EN_LIGNE.slug })
            )?.paymentMethods,
          { timeout: 15_000 },
        )
        .toEqual(["stripe"]);
    });
  });

  test.describe("Moyens choisis : invité", () => {
    test.use({ storageState: visiteur() });

    test("Seuls les moyens choisis et prêts ; aucun : message au lieu du bouton", async ({ page }) => {
      await brancherIp(page);
      await ouvrir(page, `/rdv/${PAGE.slug}/${EN_LIGNE.slug}`);
      await choisirCreneauEtRemplir(page, { prenom: "Clara", nom: "Choix" });
      await expect(page.getByRole("radio", { name: /Carte bancaire/ })).toBeChecked();
      await expect(page.getByRole("radio", { name: /Virement/ })).toHaveCount(0);

      // Seul moyen choisi non prêt (PayPal non connecté) : rien à proposer
      await (await base())
        .collection("appointment_types")
        .updateOne(
          { workspaceId: COMPTE.organisation._id, slug: EN_LIGNE.slug },
          { $set: { paymentMethods: ["paypal"] } },
        );
      await ouvrir(page, `/rdv/${PAGE.slug}/${EN_LIGNE.slug}`);
      await choisirCreneauEtRemplir(page, { prenom: "Clara", nom: "Choix" });
      await expect(page.getByText(/^Paiement en ligne indisponible pour le moment\. Contactez .+ pour réserver\.$/)).toBeVisible();
      await expect(page.getByRole("button", { name: /Payer/ })).toHaveCount(0);
      await expect(page.getByRole("radio")).toHaveCount(0);
      await capture(page, "page-publique-aucun-moyen");
    });
  });
});
