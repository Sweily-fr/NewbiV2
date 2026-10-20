/**
 * Consultation d'une facture émise (/dashboard/outils/factures/[id]) : la
 * page affiche l'éditeur en lecture seule sous un en-tête (retour,
 * « Envoyer », menu « Dupliquer / Convertir en devis »). Ce qu'on peut y
 * faire, et ce qu'on ne doit pas pouvoir y faire.
 */
import { test, expect, etape } from "../outils.mjs";
import { attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_FACTURES } from "../config.mjs";
import { F } from "../donnees/lot-factures.mjs";
import { LISTE, ouvrirConsultation } from "./pages.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });
const f = F.attente;

test.describe("Factures : consultation", () => {
  test("« Continuer » montre les articles et les totaux de la facture", async ({ page }) => {
    await ouvrirConsultation(f)(page);
    await page.getByRole("button", { name: /Continuer/ }).click();
    await expect(page.getByText("Articles et produits").first()).toBeVisible();
    await expect(page.getByText(f.items[0].description).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Créer la facture" }), "On ne crée rien en consultation").toHaveCount(0);
    await expect(page.getByRole("button", { name: "Enregistrer brouillon" })).toHaveCount(0);
  });

  test("Boutons de l'en-tête de la consultation : retour, « Envoyer » et menu sont cliquables", async ({ page }) => {
    await ouvrirConsultation(f)(page);
    for (const [nom, bouton] of [
      ["Retour", page.locator("main button:has(svg.lucide-arrow-left)").first()],
      ["Envoyer", page.getByRole("button", { name: "Envoyer", exact: true })],
      ["Menu des actions", page.locator("main button:has(svg.lucide-ellipsis), main button:has(svg.lucide-more-horizontal)").first()],
    ]) {
      await expect(bouton, `${nom} : absent`).toBeVisible();
      const cliquable = await bouton.click({ trial: true, timeout: 3_000 }).then(() => true, () => false);
      expect.soft(cliquable, `« ${nom} » est recouvert par l'éditeur plein écran : impossible de cliquer dessus`).toBe(true);
    }
  });

  test("« Envoyer » de l'en-tête ouvre l'envoi par e-mail", async ({ page }) => {
    await ouvrirConsultation(f)(page);
    // Clic envoyé au bouton lui-même : il est sous l'éditeur (voir le test précédent) ; on vérifie ici ce qu'il fait.
    await page.getByRole("button", { name: "Envoyer", exact: true }).dispatchEvent("click");
    await page.waitForTimeout(1_000);
    await expect(page.getByRole("dialog", { name: "Envoyer la facture" }), "« Envoyer » n'a aucune action (bouton sans gestionnaire de clic)").toBeVisible({ timeout: 3_000 });
  });

  test("Menu de l'en-tête : « Dupliquer » crée une nouvelle facture à partir de celle-ci", async ({ page }) => {
    await ouvrirConsultation(f)(page);
    // Au clavier : le menu est sous l'éditeur (voir plus haut) ; on vérifie ici ce que fait « Dupliquer ».
    await page.locator("main button:has(svg.lucide-ellipsis), main button:has(svg.lucide-more-horizontal)").first().focus();
    await page.keyboard.press("Enter");
    const dupliquer = page.getByRole("menuitem", { name: "Dupliquer" });
    await expect(dupliquer).toBeVisible();
    await dupliquer.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1_500);
    expect(page.url(), "« Dupliquer » ne mène nulle part (élément de menu sans action)").toMatch(/\/factures\/new|\/factures\/[0-9a-f]{24}\/editer/);
  });

  test("Quitter la consultation : « Annuler » ramène à la liste sans parler de modifications perdues", async ({ page }) => {
    await ouvrirConsultation(f)(page);
    await page.getByRole("button", { name: "Annuler", exact: true }).click();
    await page.waitForTimeout(800);
    await expect(page.getByRole("alertdialog", { name: "Quitter l'éditeur ?" }), "Une facture en lecture seule demande de confirmer la perte de « modifications non enregistrées »").toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`${LISTE}$`));
  });

  test("Rien ne se modifie en consultation : ni retirer le client, ni en créer un", async ({ page }) => {
    await ouvrirConsultation(f)(page);
    await etape(page, "Commandes de modification", async () => {
      const retirer = page.getByRole("button", { name: "Supprimer la sélection" });
      const actif = (await retirer.count()) > 0 && (await retirer.isEnabled({ timeout: 2_000 }).catch(() => false));
      expect.soft(actif, "« Supprimer la sélection » (retirer le client) est actif sur une facture émise").toBe(false);
      const nouveau = page.getByRole("tab", { name: "Nouveau client" });
      const ongletActif = (await nouveau.count()) > 0 && (await nouveau.isEnabled({ timeout: 2_000 }).catch(() => false));
      expect.soft(ongletActif, "L'onglet « Nouveau client » est actif sur une facture émise").toBe(false);
    }, { capture: "ecran" });
    const apres = await (await base()).collection("invoices").findOne({ _id: f._id });
    expect(apres.client.name, "Le client de la facture a changé").toBe(f.client.name);
  });

  test("Données d'impression du PDF : nature de l'opération, notes, conditions et coordonnées bancaires", async ({ page }) => {
    const c = F.complete;
    await ouvrirConsultation(c)(page);
    const reponse = await page.request.get(`/api/invoices/data/${c._id.toHexString()}`);
    expect(reponse.status()).toBe(200);
    const donnees = JSON.stringify(await reponse.json());
    for (const [quoi, attendu] of [
      ["Nature de l'opération (prestation de services)", '"operationType":"PS"'],
      ["Notes d'en-tête", c.headerNotes],
      ["Notes de bas de page", c.footerNotes],
      ["Conditions générales", c.termsAndConditions],
      ["IBAN", c.bankDetails.iban],
    ]) {
      expect.soft(donnees, `${quoi} absent des données d'impression du PDF`).toContain(attendu);
    }
    await attendreCalme(page);
  });
});
