/**
 * Automatisations des contacts (organisation « Réglages ») : automatisations
 * de listes (création, contrôles, effet réel quand un client est créé,
 * activation, suppression) et automatisations d'e-mails (création et
 * contrôles du formulaire).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_REGLAGES } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { CHAMPS_REGLAGES, LISTE_REGLAGES } from "../donnees/clients.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_REGLAGES) });

const ORG = COMPTES.reglages.organisation._id;
const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });

async function ouvrirAutomatisations(page) {
  await ouvrir(page, "/dashboard/clients", { pret: page.getByRole("button", { name: "Nouveau contact" }) });
  await page.locator("main button:has(svg.lucide-zap)").first().click();
  const panneau = page.getByRole("dialog", { name: "Automatisations" });
  await expect(panneau).toBeVisible();
  return panneau;
}

/** Ajoute une automatisation de liste : déclencheur et action (facultatifs), liste. */
async function nouvelleAutomatisation(page, { declencheur, action, liste } = {}) {
  const panneau = await ouvrirAutomatisations(page);
  await panneau.getByRole("button", { name: "Ajouter une automatisation" }).click();
  const listes = panneau.getByRole("combobox");
  const n = await listes.count();
  if (declencheur) {
    await listes.nth(n - 3).click();
    await page.getByRole("option", { name: declencheur, exact: true }).click();
  }
  if (action) {
    await listes.nth(n - 2).click();
    await page.getByRole("option", { name: action, exact: true }).click();
  }
  if (liste) {
    await listes.nth(n - 1).click();
    await page.getByRole("option", { name: liste }).click();
  }
  return panneau;
}

test.describe("Automatisations de listes", () => {
  test("« Client créé → Ajouter à » une liste : enregistrée, et elle agit quand un client est créé", async ({ page }) => {
    const panneau = await nouvelleAutomatisation(page, { liste: LISTE_REGLAGES.name });
    await etape(page, "Créer", async () => {
      await panneau.getByRole("button", { name: "Créer", exact: true }).click();
      await attendreCalme(page);
    }, { capture: "ecran" });
    const auto = await (await base()).collection("clientautomations").findOne({ workspaceId: ORG, targetListId: LISTE_REGLAGES._id });
    expect(auto, "Automatisation enregistrée").not.toBeNull();
    expect(auto.triggerType).toBe("CLIENT_CREATED");
    expect(auto.actionType).toBe("ADD_TO_LIST");
    expect(auto.isActive).toBe(true);

    await etape(page, "Créer un client : il rejoint la liste", async () => {
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Nouveau contact" }).click();
      const fiche = page.getByRole("dialog", { name: "Ajouter un client" });
      await fiche.getByPlaceholder("Prénom", { exact: true }).fill("Automate");
      await fiche.getByPlaceholder("Nom", { exact: true }).fill("Declenche");
      await fiche.getByPlaceholder("client@exemple.com").fill("automate@e2e.test");
      await fiche.getByPlaceholder("123 Rue de la Paix").fill("1 rue des Robots");
      await fiche.getByPlaceholder("Paris", { exact: true }).fill("Lille");
      await fiche.getByPlaceholder("75001").fill("59000");
      await fiche.getByPlaceholder("France", { exact: true }).fill("France");
      await fiche.getByRole("button", { name: "Créer un contact" }).click();
      await expect(fiche).toBeHidden({ timeout: 15_000 });
    });
    const client = await (await base()).collection("clients").findOne({ workspaceId: ORG, email: "automate@e2e.test" });
    expect(client, "Client créé").not.toBeNull();
    await expect
      .poll(async () => ((await (await base()).collection("clientlists").findOne({ _id: LISTE_REGLAGES._id })).clients || []).map(String), {
        message: "L'automatisation n'a pas ajouté le nouveau client à la liste",
      })
      .toContain(client._id.toHexString());
  });

  test("Sans liste choisie : refusé avec un message", async ({ page }) => {
    const panneau = await nouvelleAutomatisation(page);
    const avant = await (await base()).collection("clientautomations").countDocuments({ workspaceId: ORG });
    await panneau.getByRole("button", { name: "Créer", exact: true }).click();
    await expect(notification(page, "Veuillez sélectionner une liste")).toBeVisible();
    expect(await (await base()).collection("clientautomations").countDocuments({ workspaceId: ORG })).toBe(avant);
  });

  test("Couper puis supprimer une automatisation : enregistré", async ({ page }) => {
    const auto = {
      name: "Automatisation à couper",
      description: "",
      triggerType: "QUOTE_ACCEPTED",
      triggerConfig: { minAmount: null, daysOverdue: 30 },
      actionType: "ADD_TO_LIST",
      sourceListId: null,
      targetListId: LISTE_REGLAGES._id,
      isActive: true,
      stats: { totalExecutions: 0, lastExecutedAt: null, lastClientId: null },
      workspaceId: ORG,
      createdBy: COMPTES.reglages.utilisateur._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const { insertedId } = await (await base()).collection("clientautomations").insertOne(auto);
    const panneau = await ouvrirAutomatisations(page);
    const interrupteurs = panneau.getByRole("switch");
    await interrupteurs.last().click();
    await expect.poll(async () => (await (await base()).collection("clientautomations").findOne({ _id: insertedId })).isActive).toBe(false);
    await panneau.locator("button:has(svg.lucide-trash2)").last().click();
    const alerte = page.getByRole("alertdialog");
    if (await alerte.isVisible().catch(() => false)) await alerte.getByRole("button", { name: /Supprimer/ }).click();
    await expect.poll(() => (base().then((b) => b.collection("clientautomations").findOne({ _id: insertedId })))).toBeNull();
  });
});

test.describe("Automatisations d'e-mails", () => {
  async function nouvelleRelance(page) {
    const panneau = await ouvrirAutomatisations(page);
    await panneau.getByRole("button", { name: /^Emails/ }).click();
    await panneau.getByRole("button", { name: "Ajouter une automatisation" }).click();
    return panneau;
  }

  test("Relance le jour d'une date : enregistrée", async ({ page }) => {
    const panneau = await nouvelleRelance(page);
    await panneau.getByRole("combobox").filter({ hasText: "Sélectionner un champ date..." }).click();
    await page.getByRole("option", { name: CHAMPS_REGLAGES.anniversaire.name }).click();
    await panneau.getByPlaceholder("Ex: Rappel - {customFieldName}").fill("Joyeux anniversaire de la part de l'équipe");
    await panneau.getByPlaceholder("Bonjour {clientName},...").fill("Bonjour, toute l'équipe vous souhaite un bon anniversaire.");
    await panneau.getByRole("button", { name: /^(Créer|Enregistrer)$/ }).last().click();
    await expect
      .poll(async () => (await (await base()).collection("crmemailautomations").findOne({ workspaceId: ORG }))?.email?.subject ?? null)
      .toBe("Joyeux anniversaire de la part de l'équipe");
  });

  for (const [manque, message] of [
    ["champ date", "Veuillez sélectionner un champ date"],
    ["sujet", "Veuillez saisir un sujet"],
    ["contenu", "Veuillez saisir un contenu"],
  ]) {
    test(`Sans ${manque} : refusée avec un message`, async ({ page }) => {
      const panneau = await nouvelleRelance(page);
      if (manque !== "champ date") {
        await panneau.getByRole("combobox").filter({ hasText: "Sélectionner un champ date..." }).click();
        await page.getByRole("option", { name: CHAMPS_REGLAGES.anniversaire.name }).click();
      }
      if (manque !== "sujet") await panneau.getByPlaceholder("Ex: Rappel - {customFieldName}").fill("Sujet de test");
      if (manque !== "contenu") await panneau.getByPlaceholder("Bonjour {clientName},...").fill("Contenu de test");
      const avant = await (await base()).collection("crmemailautomations").countDocuments({ workspaceId: ORG });
      await panneau.getByRole("button", { name: /^(Créer|Enregistrer)$/ }).last().click();
      await expect(notification(page, message)).toBeVisible();
      expect(await (await base()).collection("crmemailautomations").countDocuments({ workspaceId: ORG })).toBe(avant);
    });
  }
});
