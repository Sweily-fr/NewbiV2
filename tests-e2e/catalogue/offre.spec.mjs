/**
 * Plafonds de l'offre d'entrée (« freelance », src/lib/plan-limits.js) pour
 * le catalogue : 5 champs personnalisés produits. L'interface les applique ;
 * l'API doit les appliquer aussi, sinon un appel direct les contourne.
 * L'organisation « Achats Freelance » a déjà ses 5 champs.
 */
import { test, expect, etape, fenetre } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { appelApi, verifierRefus } from "../securite.mjs";
import { SESSION_TOKEN_FREELANCE_ACHATS } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { connecteAchats } from "../achats-banque.mjs";

test.use({ storageState: connecteAchats(SESSION_TOKEN_FREELANCE_ACHATS) });

const ORG = COMPTES.freelanceAchats.organisation._id;
const W = ORG.toHexString();
const compter = async () => (await base()).collection("productcustomfields").countDocuments({ workspaceId: ORG });

async function ouvrirChamps(page) {
  await ouvrir(page, "/dashboard/catalogues", { pret: page.getByRole("button", { name: "Champs" }) });
  await page.getByRole("button", { name: "Champs" }).click();
  const panneau = fenetre(page, "Champs personnalisés produits");
  await expect(panneau).toBeVisible();
  return panneau;
}

test.describe("Offre d'entrée : plafonds du catalogue", () => {
  test("Champs personnalisés produits : l'interface annonce la limite et grise la création", async ({ page }) => {
    const panneau = await ouvrirChamps(page);
    await etape(page, "Limite affichée", async () => {
      await expect(panneau.getByText(/Limite atteinte \(5\/5 champs\)/).first()).toBeVisible();
      await expect(panneau.getByRole("button", { name: /Nouveau champ|Créer un champ/ }).first()).toBeDisabled();
    }, { capture: "ecran" });
  });

  test("Champs personnalisés produits : le message de limite propose l'offre qui la lève (TPE)", async ({ page }) => {
    const panneau = await ouvrirChamps(page);
    await expect(panneau.getByText(/Limite atteinte/).first(), "Le message propose l'offre Entreprise alors que l'offre TPE lève déjà la limite").toContainText(/TPE/);
  });

  test("Champs personnalisés produits : un 6e champ créé par l'API est refusé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const avant = await compter();
    const reponse = await appelApi(
      page,
      `mutation($w: ID!, $input: CreateProductCustomFieldInput!) { createProductCustomField(workspaceId: $w, input: $input) { id } }`,
      { w: W, input: { name: "Sixième champ hors offre", fieldType: "TEXT" } },
      { organisation: W },
    );
    verifierRefus(reponse, "createProductCustomField", "6e champ personnalisé produit sur l'offre d'entrée");
    expect(await compter(), "Un 6e champ produit a été créé malgré la limite de l'offre").toBe(avant);
  });
});
