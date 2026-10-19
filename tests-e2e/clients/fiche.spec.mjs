/**
 * Fiche d'un contact : ce qu'elle affiche comparé à la base, la navigation
 * entre contacts, les notes (ajouter, modifier, lier, supprimer), le blocage,
 * l'assignation, les rappels, les factures du contact et la suppression.
 * Organisation « Clients » ; chaque action a son contact (donnees/clients.mjs).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_CLIENTS } from "../config.mjs";
import { COMPTES, MEMBRES } from "../donnees/base.mjs";
import { CONTACTS, FACTURES_CONTACTS } from "../donnees/clients.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_CLIENTS) });

const ORG = COMPTES.clients.organisation._id;
const id = (doc) => doc._id.toHexString();
const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });
const enBase = async (contact) => (await base()).collection("clients").findOne({ _id: contact._id });
const euros = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n).replace(/\s/g, " ");

async function ouvrirFiche(page, contact, suffixe = "") {
  await ouvrir(page, `/dashboard/clients/${id(contact)}${suffixe}`, { pret: page.getByText(contact.email).first() });
}

async function menuDeLaFiche(page, action) {
  await cliquer(page, page.locator("main button:has(svg.lucide-settings2)").first());
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

test.describe("Fiche d'un contact : contenu", () => {
  test("Les informations affichées sont celles de la base", async ({ page }) => {
    await ouvrirFiche(page, CONTACTS.complet);
    const c = CONTACTS.complet;
    const texte = (await page.locator("main").innerText()).replace(/\s+/g, " ");
    await etape(page, "Informations", async () => {
      for (const [libelle, valeur] of [
        ["nom", c.name],
        ["e-mail", c.email],
        ["SIRET", c.siret],
        ["TVA", c.vatNumber],
        ["rue", c.address.street],
        ["ville", c.address.city],
        ["code postal", c.address.postalCode],
        ["fonction", c.contactFunction],
        ["champ personnalisé « Secteur d'activité »", "Industrie"],
      ]) {
        expect.soft(texte, `${libelle} (« ${valeur} ») absent de la fiche`).toContain(valeur);
      }
      const chiffresTelephone = texte.replace(/[^\d+]/g, "");
      expect.soft(chiffresTelephone, "Téléphone absent de la fiche").toContain(c.phone.replace(/[^\d+]/g, "").slice(-9));
    }, { capture: "page" });
  });

  test("Contact précédent et suivant : l'ordre alphabétique de la liste", async ({ page }) => {
    const tous = (await (await base()).collection("clients").find({ workspaceId: ORG }).toArray()).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    const i = tous.findIndex((c) => c._id.equals(CONTACTS.particulier._id));
    await ouvrirFiche(page, CONTACTS.particulier);
    await cliquer(page, page.locator("main button:has(svg.lucide-chevron-right)").first());
    await expect(page).toHaveURL(new RegExp(`/dashboard/clients/${id(tous[i + 1])}$`));
    await expect(page.getByText(tous[i + 1].email).first()).toBeVisible();
    await cliquer(page, page.locator("main button:has(svg.lucide-chevron-left)").first());
    await expect(page).toHaveURL(new RegExp(`/dashboard/clients/${id(CONTACTS.particulier)}$`));
  });

  test("Factures du contact : chaque facture avec son numéro et son montant", async ({ page }) => {
    await ouvrirFiche(page, CONTACTS.avecFactures, "?tab=invoices");
    for (const f of Object.values(FACTURES_CONTACTS)) {
      await expect.soft(page.getByText(`${f.prefix}-${f.number}`).first(), `Facture ${f.prefix}-${f.number}`).toBeVisible();
      await expect.soft(page.getByText(euros(f.finalTotalTTC)).first(), `Montant ${euros(f.finalTotalTTC)}`).toBeVisible();
    }
  });

  test("« Nouvelle facture » depuis la fiche : l'éditeur s'ouvre avec ce client", async ({ page }) => {
    await ouvrirFiche(page, CONTACTS.avecFactures, "?tab=invoices");
    await cliquer(page, page.getByRole("button", { name: "Nouvelle facture" }));
    await expect(page).toHaveURL(new RegExp(`/dashboard/outils/factures/new\\?clientId=${id(CONTACTS.avecFactures)}`));
    await expect(page.getByRole("combobox").filter({ hasText: CONTACTS.avecFactures.name })).toBeVisible({ timeout: 30_000 });
  });

  test("Copier le numéro (WhatsApp) : le presse-papiers contient le téléphone", async ({ page }) => {
    await ouvrirFiche(page, CONTACTS.complet);
    await menuDeLaFiche(page, "Copier le numéro sur WhatsApp");
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(CONTACTS.complet.phone);
  });
});

test.describe("Fiche d'un contact : notes", () => {
  const editeur = (page) => page.locator("main [contenteditable=true]").first();

  test("Ajouter, modifier puis supprimer une note", async ({ page }) => {
    await ouvrirFiche(page, CONTACTS.aNoter, "?tab=notes");
    await etape(page, "Ajouter", async () => {
      await editeur(page).click();
      await page.keyboard.type("Rappeler le client lundi pour le devis");
      await page.getByRole("button", { name: "Envoyer" }).click();
      await expect(page.locator("main").getByText("Rappeler le client lundi pour le devis").last()).toBeVisible();
    }, { capture: "ecran" });
    await expect.poll(async () => (await enBase(CONTACTS.aNoter)).notes?.length ?? 0).toBe(1);
    const note = (await enBase(CONTACTS.aNoter)).notes[0];
    expect(note.content).toContain("Rappeler le client lundi pour le devis");
    expect(String(note.userId)).toBe(id(COMPTES.clients.utilisateur));

    await etape(page, "Modifier", async () => {
      await cliquer(page, page.locator("main button:has(svg.lucide-pen)").first());
      const enEdition = page.locator("main [contenteditable=true]").last();
      await enEdition.click();
      await page.keyboard.press("ControlOrMeta+a");
      await page.keyboard.type("Rappeler le client mardi");
      await page.getByRole("button", { name: "Envoyer" }).last().click();
      await expect(page.locator("main").getByText("Rappeler le client mardi").last()).toBeVisible();
    }, { capture: "ecran" });
    await expect.poll(async () => (await enBase(CONTACTS.aNoter)).notes[0].content).toContain("Rappeler le client mardi");

    await etape(page, "Supprimer", async () => {
      await cliquer(page, page.locator("main button:has(svg.lucide-trash2)").last());
      const alerte = page.getByRole("alertdialog", { name: "Supprimer la note" });
      await alerte.getByRole("button", { name: "Supprimer" }).click();
      await expect(alerte).toBeHidden();
    }, { capture: "ecran" });
    await expect.poll(async () => (await enBase(CONTACTS.aNoter)).notes.length).toBe(0);
  });

  test("Une note vide ne peut pas être envoyée", async ({ page }) => {
    await ouvrirFiche(page, CONTACTS.aNoter, "?tab=notes");
    await expect(page.getByRole("button", { name: "Envoyer" })).toBeDisabled();
    await editeur(page).click();
    await page.keyboard.type("   ");
    await expect(page.getByRole("button", { name: "Envoyer" })).toBeDisabled();
  });

  test.describe(() => {
    test.use({ dialoguesAttendus: [/URL du lien/] });
    test("Lien dans une note : l'adresse saisie devient un lien", async ({ page }) => {
      await ouvrirFiche(page, CONTACTS.aRappeler, "?tab=notes");
      await editeur(page).click();
      await page.keyboard.type("Voir le site");
      await page.keyboard.press("ControlOrMeta+a");
      page.once("dialog", (d) => d.accept("https://www.newbi.fr"));
      await page.locator("main button:has(svg.lucide-link)").first().click();
      await page.getByRole("button", { name: "Envoyer" }).click();
      await expect.poll(async () => (await enBase(CONTACTS.aRappeler)).notes?.[0]?.content ?? "").toContain('href="https://www.newbi.fr"');
      await expect(page.locator("main a[href='https://www.newbi.fr']").first()).toBeVisible();
    });
  });

  test("Une note tapée avec des balises reste du texte", async ({ page }) => {
    await ouvrirFiche(page, CONTACTS.aAssignerFiche, "?tab=notes");
    await editeur(page).click();
    await page.keyboard.type(`<img src=x onerror="window.__piege=1">`);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.locator("main").getByText("<img src=x").last()).toBeVisible();
    await page.reload();
    await page.waitForTimeout(1_500);
    expect(await page.evaluate(() => window.__piege ?? null)).toBeNull();
  });
});

test.describe("Fiche d'un contact : actions", () => {
  test("Bloquer depuis la fiche, avec une raison : enregistré et affiché", async ({ page }) => {
    await ouvrirFiche(page, CONTACTS.aBloquerFiche);
    await menuDeLaFiche(page, "Bloquer le contact");
    const alerte = page.getByRole("alertdialog", { name: "Bloquer ce contact ?" });
    await alerte.getByPlaceholder("Raison du blocage (optionnel)").fill("Coordonnées à vérifier");
    await alerte.getByRole("button", { name: "Bloquer" }).click();
    await expect(alerte).toBeHidden();
    await expect.poll(async () => (await enBase(CONTACTS.aBloquerFiche)).isBlocked).toBe(true);
    expect((await enBase(CONTACTS.aBloquerFiche)).blockedReason).toBe("Coordonnées à vérifier");
    await expect(page.getByText("Coordonnées à vérifier").first()).toBeVisible();
  });

  test("Débloquer depuis la fiche : enregistré", async ({ page }) => {
    await ouvrirFiche(page, CONTACTS.aDebloquerFiche);
    await menuDeLaFiche(page, "Débloquer le contact");
    await expect(notification(page, "Contact débloqué")).toBeVisible();
    await expect.poll(async () => (await enBase(CONTACTS.aDebloquerFiche)).isBlocked).toBe(false);
  });

  test("Assigner un membre depuis la fiche : enregistré", async ({ page }) => {
    await ouvrirFiche(page, CONTACTS.aAssignerFiche);
    await menuDeLaFiche(page, "Assigner");
    const fenetre = page.getByRole("dialog", { name: "Assigner des membres" });
    await fenetre.getByRole("button", { name: new RegExp(MEMBRES.editeur.utilisateur.email) }).click();
    await fenetre.getByRole("button", { name: "Enregistrer" }).click();
    await expect(fenetre).toBeHidden();
    await expect.poll(async () => (await enBase(CONTACTS.aAssignerFiche)).assignedMembers).toContain(id(MEMBRES.editeur.utilisateur));
  });

  test("Créer un rappel : l'événement est enregistré et lié au contact", async ({ page }) => {
    await ouvrirFiche(page, CONTACTS.aRappeler);
    await cliquer(page, page.getByRole("button", { name: "Créer un rappel" }));
    const fenetre = page.getByRole("dialog", { name: "Nouvel événement" });
    await fenetre.getByPlaceholder("Titre de l'événement").fill("Rappeler pour le devis");
    await etape(page, "Créer", async () => {
      await fenetre.getByRole("button", { name: "Créer", exact: true }).click();
      await expect(fenetre).toBeHidden();
    }, { capture: "ecran" });
    await expect
      .poll(async () => (await (await base()).collection("events").findOne({ title: "Rappeler pour le devis" }))?.clientId?.toString() ?? null, { message: "Rappel non lié au contact" })
      .toBe(id(CONTACTS.aRappeler));
    const evenement = await (await base()).collection("events").findOne({ title: "Rappeler pour le devis" });
    expect(String(evenement.workspaceId)).toBe(id(COMPTES.clients.organisation));
  });

  test("Créer un rappel sans titre : refusé avec un message", async ({ page }) => {
    await ouvrirFiche(page, CONTACTS.aRappeler);
    await cliquer(page, page.getByRole("button", { name: "Créer un rappel" }));
    const fenetre = page.getByRole("dialog", { name: "Nouvel événement" });
    const avant = await (await base()).collection("events").countDocuments({ clientId: CONTACTS.aRappeler._id });
    await fenetre.getByRole("button", { name: "Créer", exact: true }).click();
    await page.waitForTimeout(800);
    const grise = await fenetre.getByRole("button", { name: "Créer", exact: true }).isDisabled().catch(() => false);
    const message = await page.locator(".text-red-500, .text-destructive, [data-sonner-toast][data-type=error]").count();
    expect(grise || message > 0, "Aucune explication pour un rappel sans titre").toBe(true);
    expect(await (await base()).collection("events").countDocuments({ clientId: CONTACTS.aRappeler._id })).toBe(avant);
  });

  test("Supprimer définitivement depuis la fiche : retour à la liste, contact supprimé", async ({ page }) => {
    await ouvrirFiche(page, CONTACTS.aSupprimerFiche);
    await menuDeLaFiche(page, "Supprimer définitivement");
    const alerte = page.getByRole("alertdialog", { name: "Supprimer ce contact ?" });
    await etape(page, "Confirmer", async () => {
      await alerte.getByRole("button", { name: "Supprimer" }).click();
      await expect(page).toHaveURL(/\/dashboard\/clients$/, { timeout: 15_000 });
    }, { capture: "ecran" });
    await expect.poll(() => enBase(CONTACTS.aSupprimerFiche)).toBeNull();
  });

  test("Supprimer définitivement un contact facturé : rien n'est supprimé", async ({ page }) => {
    await ouvrirFiche(page, CONTACTS.avecFactures);
    await menuDeLaFiche(page, "Supprimer définitivement");
    await page.waitForTimeout(800);
    expect(await enBase(CONTACTS.avecFactures)).not.toBeNull();
  });
});
