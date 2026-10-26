/**
 * Plafonds de l'offre d'entrée (« freelance », src/lib/plan-limits.js) pour
 * les contacts : 5 champs personnalisés, pas de segments, pas
 * d'automatisations d'e-mails. L'interface les applique ; l'API doit les
 * appliquer aussi, sinon un appel direct les contourne (fonctionnalités
 * payantes obtenues sans payer).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { appelApi, verifierRefus } from "../securite.mjs";
import { connecte, SESSION_TOKEN_FREELANCE } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { CHAMPS_FREELANCE } from "../donnees/clients.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_FREELANCE) });

const ORG = COMPTES.freelance.organisation._id;
const W = ORG.toHexString();
const compter = async (collection) => (await base()).collection(collection).countDocuments({ workspaceId: ORG });

test.describe("Offre d'entrée : plafonds des contacts", () => {
  test("Champs personnalisés : l'interface annonce la limite et grise la création", async ({ page }) => {
    await ouvrir(page, "/dashboard/clients", { pret: page.getByRole("button", { name: "Champs" }) });
    await page.getByRole("button", { name: "Champs" }).click();
    const panneau = page.getByRole("dialog", { name: "Champs personnalisés clients" });
    await etape(page, "Limite affichée", async () => {
      await expect(panneau.getByText(/Limite atteinte \(5\/5 champs\)/)).toBeVisible();
      await expect(panneau.getByRole("button", { name: /Nouveau champ|Créer un champ/ }).first()).toBeDisabled();
    }, { capture: "ecran" });
  });

  test("Champs personnalisés : un 6e champ créé par l'API est refusé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const avant = await compter("clientcustomfields");
    const reponse = await appelApi(
      page,
      `mutation($w: ID!, $input: ClientCustomFieldInput!) { createClientCustomField(workspaceId: $w, input: $input) { id } }`,
      { w: W, input: { name: "Sixième champ hors offre", fieldType: "TEXT" } },
      { organisation: W },
    );
    verifierRefus(reponse, "createClientCustomField", "6e champ personnalisé sur l'offre d'entrée");
    expect(await compter("clientcustomfields"), "Un 6e champ a été créé malgré la limite de l'offre").toBe(avant);
  });

  test("Segments : absents de l'offre, refusés par l'API", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelApi(
      page,
      `mutation($w: String!, $input: CreateClientSegmentInput!) { createClientSegment(workspaceId: $w, input: $input) { id } }`,
      { w: W, input: { name: "Segment hors offre", matchType: "all", rules: [{ field: "type", operator: "equals", value: "COMPANY" }] } },
      { organisation: W },
    );
    verifierRefus(reponse, "createClientSegment", "Segment sur l'offre d'entrée");
    expect(await compter("clientsegments"), "Un segment a été créé malgré l'offre").toBe(0);
  });

  test("Automatisations d'e-mails : absentes de l'offre, refusées par l'API", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelApi(
      page,
      `mutation($w: ID!, $input: CreateCrmEmailAutomationInput!) { createCrmEmailAutomation(workspaceId: $w, input: $input) { id } }`,
      {
        w: W,
        input: {
          name: "Relance hors offre",
          customFieldId: CHAMPS_FREELANCE[0]._id.toHexString(),
          timing: { type: "ON_DATE", sendHour: 9 },
          email: { subject: "Bonjour", body: "Message de test" },
          isActive: false,
        },
      },
      { organisation: W },
    );
    verifierRefus(reponse, "createCrmEmailAutomation", "Automatisation d'e-mails sur l'offre d'entrée");
    expect(await compter("crmemailautomations"), "Une automatisation d'e-mails a été créée malgré l'offre").toBe(0);
  });

  test("Segments : la page propose de changer d'offre au lieu de créer", async ({ page }) => {
    await ouvrir(page, "/dashboard/clients/segments");
    await expect(page.getByRole("button", { name: "Nouveau segment" })).toHaveCount(0);
  });
});
