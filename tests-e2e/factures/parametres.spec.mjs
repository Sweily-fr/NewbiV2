/**
 * Paramètres des factures et relances automatiques, avec l'organisation
 * « Réglages Factures » (ses réglages ne servent à aucun autre test). Chaque
 * enregistrement est vérifié en base : un refus de l'API ne doit jamais être
 * annoncé comme un succès (le site traite les réponses en `errorPolicy:
 * "all"` : une mutation refusée ne lève pas d'erreur).
 */
import { test, expect, etape, notificationsErreur, SELECTEUR_NOTIFICATION_SUCCES } from "../outils.mjs";
import { attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_FACTURES_REGLAGES } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { CLIENTS_FACTURES } from "../donnees/lot-factures.mjs";
import { fenetreTitree, notifications, ouvrirParametres, ouvrirRelances } from "./pages.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_REGLAGES) });

const ORG = COMPTES.facturesReglages.organisation._id;
const organisation = async () => (await base()).collection("organization").findOne({ _id: ORG });
const reglagesRelances = async () => (await base()).collection("invoiceremindersettings").findOne({ workspaceId: { $in: [ORG, ORG.toHexString()] } });
const reglagesEmail = async () => (await base()).collection("emailsettings").findOne({ workspaceId: { $in: [ORG, ORG.toHexString()] } });
const succes = (page) => page.locator(SELECTEUR_NOTIFICATION_SUCCES);

test.describe("Paramètres des factures", () => {
  test("Notes de bas de page et conditions générales : enregistrées sur l'organisation", async ({ page }) => {
    const zone = await ouvrirParametres(page);
    const notes = "Merci pour votre règlement par virement, n° de commande à rappeler.";
    const conditions = "Escompte pour paiement anticipé : néant. Pénalités : 3 fois le taux d’intérêt légal.";
    await zone.getByRole("textbox", { name: "Notes de bas de page" }).fill(notes);
    await zone.getByRole("textbox", { name: "Conditions générales" }).fill(conditions);
    await etape(page, "Enregistrer les modifications", async () => {
      await zone.getByRole("button", { name: "Enregistrer les modifications" }).click();
      await expect(notifications(page).filter({ hasText: "Paramètres enregistrés avec succès" }).first()).toBeVisible();
    }, { capture: "ecran" });
    await expect.poll(async () => (await organisation())?.invoiceFooterNotes).toBe(notes);
    expect((await organisation()).invoiceTermsAndConditions).toBe(conditions);
  });

  test("« Annuler » sans rien changer ferme les paramètres sans parler de modifications", async ({ page }) => {
    const zone = await ouvrirParametres(page);
    await zone.getByRole("button", { name: "Annuler", exact: true }).click();
    await page.waitForTimeout(800);
    await expect(page.getByRole("alertdialog", { name: "Modifications non sauvegardées" }), "Rien n'a été modifié, mais une fenêtre annonce des « modifications non sauvegardées »").toHaveCount(0);
    await expect(zone).toBeHidden();
  });

  test("Préfixe avec une espace : refusé avec un message, rien n'est enregistré", async ({ page }) => {
    const avant = (await organisation())?.invoicePrefix ?? null;
    try {
      const zone = await ouvrirParametres(page);
      await zone.getByRole("textbox", { name: "Préfixe de facture" }).fill("FAC 2026");
      await zone.getByRole("button", { name: "Enregistrer les modifications" }).click();
      await page.waitForTimeout(1_500);
      await expect.soft(zone.getByText(/ne doit contenir que des lettres, chiffres et tirets/).first().or(notificationsErreur(page).first()), "Aucun message pour un préfixe avec une espace").toBeVisible();
      expect((await organisation())?.invoicePrefix ?? null, "Préfixe invalide enregistré : les factures suivantes seront refusées par l'API").toBe(avant);
    } finally {
      // Le défaut ne doit pas gêner les autres tests de l'organisation (numérotation).
      await (await base()).collection("organization").updateOne({ _id: ORG }, avant === null ? { $unset: { invoicePrefix: "" } } : { $set: { invoicePrefix: avant } });
    }
  });

  test("Coordonnées bancaires : un IBAN invalide est refusé avec un message", async ({ page }) => {
    const avant = (await organisation())?.bankIban ?? null;
    const zone = await ouvrirParametres(page);
    await zone.getByRole("button", { name: "Configurer les coordonnées bancaires" }).click();
    const fenetre = fenetreTitree(page, "Coordonnées bancaires");
    await fenetre.getByRole("textbox", { name: "IBAN" }).fill("FR76 1234");
    await fenetre.getByRole("textbox", { name: "BIC/SWIFT" }).fill("AGRIFRPP");
    await fenetre.getByRole("textbox", { name: "Nom de la banque" }).fill("Banque des Tests");
    await fenetre.getByRole("button", { name: "Enregistrer" }).click();
    await page.waitForTimeout(1_200);
    await expect(fenetre.getByText(/IBAN/i).filter({ hasText: /invalide|format/i }).first().or(notificationsErreur(page).first())).toBeVisible();
    expect((await organisation())?.bankIban ?? null, "IBAN invalide enregistré").toBe(avant);
  });

  test("Coordonnées bancaires : un IBAN valide (saisi avec des espaces) est enregistré", async ({ page }) => {
    const zone = await ouvrirParametres(page);
    await zone.getByRole("button", { name: "Configurer les coordonnées bancaires" }).click();
    const fenetre = fenetreTitree(page, "Coordonnées bancaires");
    await fenetre.getByRole("textbox", { name: "IBAN" }).fill("FR76 3000 6000 0112 3456 7890 189");
    await fenetre.getByRole("textbox", { name: "BIC/SWIFT" }).fill("AGRIFRPP");
    await fenetre.getByRole("textbox", { name: "Nom de la banque" }).fill("Crédit Agricole Île-de-France");
    await etape(page, "Enregistrer", async () => {
      await fenetre.getByRole("button", { name: "Enregistrer" }).click();
      await expect(notifications(page).filter({ hasText: "Coordonnées bancaires mises à jour avec succès" }).first()).toBeVisible();
    }, { capture: "ecran" });
    await expect.poll(async () => (await organisation())?.bankBic).toBe("AGRIFRPP");
    expect((await organisation()).bankName).toBe("Crédit Agricole Île-de-France");
  });

  test("Nom de banque avec une apostrophe typographique (d’Île-de-France) : accepté", async ({ page }) => {
    const zone = await ouvrirParametres(page);
    await zone.getByRole("button", { name: "Configurer les coordonnées bancaires" }).click();
    const fenetre = fenetreTitree(page, "Coordonnées bancaires");
    await fenetre.getByRole("textbox", { name: "IBAN" }).fill("FR7630006000011234567890189");
    await fenetre.getByRole("textbox", { name: "BIC/SWIFT" }).fill("AGRIFRPP");
    await fenetre.getByRole("textbox", { name: "Nom de la banque" }).fill("Caisse d’Épargne d’Île-de-France");
    await fenetre.getByRole("button", { name: "Enregistrer" }).click();
    await page.waitForTimeout(1_200);
    await expect(fenetre.getByText("Nom de banque invalide"), "Le vrai nom d'une banque, écrit avec l'apostrophe que posent le Mac et l'iPhone, est refusé").toHaveCount(0);
    await expect.poll(async () => (await organisation())?.bankName).toBe("Caisse d’Épargne d’Île-de-France");
  });
});

test.describe("Relances automatiques", () => {
  async function regler(page, { premier, second, heure, objet, expediteur = "relances@reglages-factures.test" }) {
    const fenetre = await ouvrirRelances(page);
    const interrupteur = fenetre.getByRole("switch").first();
    if ((await interrupteur.getAttribute("aria-checked")) !== "true") await interrupteur.click();
    const [jours1, jours2, heureEnvoi] = await fenetre.getByRole("spinbutton").all();
    if (premier !== undefined) await jours1.fill(String(premier));
    if (second !== undefined) await jours2.fill(String(second));
    if (heure !== undefined) await heureEnvoi.fill(String(heure));
    if (expediteur !== undefined) await fenetre.getByPlaceholder("facturation@mon-entreprise.fr").fill(expediteur);
    if (objet !== undefined) await fenetre.getByPlaceholder("Rappel de paiement - Facture {invoiceNumber}").fill(objet);
    return fenetre;
  }

  test("Réglages valides : délais, heure, expéditeur et objet enregistrés", async ({ page }) => {
    const objet = "Relance de la facture {invoiceNumber} (réglages valides)";
    const fenetre = await regler(page, { premier: 5, second: 12, heure: 10, objet });
    await etape(page, "Enregistrer", async () => {
      await fenetre.getByRole("button", { name: /^Enregistrer/ }).click();
      await expect(notifications(page).filter({ hasText: "Paramètres de relance automatique sauvegardés" }).first()).toBeVisible();
    }, { capture: "ecran" });
    await expect.poll(async () => (await reglagesRelances())?.emailSubject).toBe(objet);
    expect(await reglagesRelances()).toMatchObject({ enabled: true, firstReminderDays: 5, secondReminderDays: 12, reminderHour: 10 });
    expect((await reglagesEmail())?.fromEmail, "Expéditeur enregistré").toBe("relances@reglages-factures.test");
  });

  test("Deuxième relance avant la première : refusée avec un message, rien n'est enregistré", async ({ page }) => {
    const objet = "Relance incohérente (deuxième avant la première)";
    const fenetre = await regler(page, { premier: 10, second: 4, objet });
    const reponse = page.waitForResponse((r) => r.url().includes("/graphql") && (r.request().postData() || "").includes("updateInvoiceReminderSettings"));
    await fenetre.getByRole("button", { name: /^Enregistrer/ }).click();
    const corps = await (await reponse).json().catch(() => ({}));
    await etape(page, "Message affiché", async () => {
      await page.waitForTimeout(1_200);
      const refus = corps.errors?.[0]?.message;
      expect.soft(refus, "L'API accepte une deuxième relance avant la première").toBeTruthy();
      await expect.soft(notificationsErreur(page).first(), `L'API refuse (« ${refus} ») mais aucun message d'erreur n'est affiché`).toBeVisible();
      await expect.soft(page.locator(SELECTEUR_NOTIFICATION_SUCCES).filter({ hasText: "sauvegardés" }), "« Paramètres sauvegardés » annoncé alors que rien n'est enregistré").toHaveCount(0);
    }, { capture: "ecran" });
    expect((await reglagesRelances())?.emailSubject ?? null, "Réglages incohérents enregistrés").not.toBe(objet);
  });

  test("Adresse d'expéditeur invalide : refusée avec un message", async ({ page }) => {
    const fenetre = await regler(page, { expediteur: "facturation@", objet: "Relance avec expéditeur invalide" });
    const reponse = page.waitForResponse((r) => r.url().includes("/graphql") && (r.request().postData() || "").includes("updateEmailSettings"), { timeout: 15_000 }).catch(() => null);
    await fenetre.getByRole("button", { name: /^Enregistrer/ }).click();
    const r = await reponse;
    const corps = r ? await r.json().catch(() => ({})) : {};
    await page.waitForTimeout(1_200);
    if (r) {
      await expect.soft(notificationsErreur(page).first(), `L'API refuse l'adresse (« ${corps.errors?.[0]?.message} ») mais aucun message d'erreur n'est affiché`).toBeVisible();
      await expect.soft(succes(page).filter({ hasText: "sauvegardés" }), "« Paramètres sauvegardés » annoncé alors que l'expéditeur est refusé").toHaveCount(0);
    } else {
      // Refus avant l'envoi : un message sous le champ.
      await expect(fenetre.locator("[aria-invalid=true], .text-red-500, .text-destructive").first()).toBeVisible();
    }
    expect((await reglagesEmail())?.fromEmail ?? null, "Adresse invalide enregistrée").not.toBe("facturation@");
  });

  test("Fermer les relances sans enregistrer : rien n'est enregistré", async ({ page }) => {
    const objet = "Objet modifié puis abandonné";
    for (const fermer of ["Annuler", "croix"]) {
      const fenetre = await regler(page, { objet, expediteur: undefined });
      if (fermer === "Annuler") await fenetre.getByRole("button", { name: "Annuler", exact: true }).click();
      else await fenetre.locator("button:has(svg.lucide-x)").first().click();
      await expect(fenetre, `« ${fermer} » ne ferme pas la fenêtre`).toBeHidden();
      await attendreCalme(page);
      expect((await reglagesRelances())?.emailSubject ?? null, `« ${fermer} » a enregistré les modifications`).not.toBe(objet);
    }
  });

  test("Clients concernés : exclure un client des relances l'enregistre", async ({ page }) => {
    const fenetre = await regler(page, { objet: "Relances sans le client exclu" });
    await fenetre.getByRole("tab", { name: "Clients concernés" }).click();
    const client = CLIENTS_FACTURES.ancien;
    const caseClient = fenetre.locator(`[id="client-${client._id.toHexString()}"]`);
    await expect(fenetre.getByText(client.name).first(), "Le client apparaît dans les clients concernés").toBeVisible();
    await expect(caseClient).toHaveAttribute("aria-checked", "true");
    await caseClient.click();
    await expect(caseClient).toHaveAttribute("aria-checked", "false");
    await fenetre.getByRole("button", { name: /^Enregistrer/ }).click();
    await expect(notifications(page).filter({ hasText: "sauvegardés" }).first()).toBeVisible();
    await expect.poll(async () => ((await reglagesRelances())?.excludedClientIds || []).map(String)).toContain(client._id.toHexString());
  });
});
