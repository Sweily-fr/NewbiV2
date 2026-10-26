/**
 * Contacts bloqués : la page des bloqués reflète la base, le déblocage et le
 * blocage sont enregistrés, et un contact bloqué ne peut plus servir à créer
 * un document (« exclu de la création de documents », dit la confirmation).
 */
import { test, expect, etape, fenetre } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { ouvrirEditeur } from "../editeur.mjs";
import { connecte, SESSION_TOKEN_CLIENTS } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { CONTACTS } from "../donnees/clients.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_CLIENTS) });

const ORG = COMPTES.clients.organisation._id;
const ouvrirBloques = (page) => ouvrir(page, "/dashboard/clients/blocked", { pret: page.getByText(CONTACTS.bloque.name).first() });
const enBase = async (contact) => (await base()).collection("clients").findOne({ _id: contact._id });

test.describe("Contacts bloqués", () => {
  test("La page affiche exactement les contacts bloqués de l'organisation", async ({ page }) => {
    await ouvrirBloques(page);
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "50" }).click();
    await attendreCalme(page);
    const bloques = await (await base()).collection("clients").find({ workspaceId: ORG, isBlocked: true }).toArray();
    for (const c of bloques) await expect.soft(page.getByText(c.name, { exact: true }).first(), `« ${c.name} » est bloqué`).toBeVisible();
    await expect(page.getByText(CONTACTS.complet.name, { exact: true }), "Un contact non bloqué est affiché").toHaveCount(0);
    await expect(page.getByText(CONTACTS.intrus.name, { exact: true }), "Un contact d'une autre organisation est affiché").toHaveCount(0);
  });

  test("La raison du blocage est affichée", async ({ page }) => {
    await ouvrirBloques(page);
    await expect(page.getByText(CONTACTS.bloque.blockedReason).first()).toBeVisible();
  });

  test("Rechercher un contact bloqué, sans accents ni majuscules", async ({ page }) => {
    await ouvrirBloques(page);
    await page.getByRole("textbox", { name: "Rechercher" }).fill("debloquer depuis la fiche");
    await attendreCalme(page);
    await expect(page.getByText(CONTACTS.aDebloquerFiche.name).first()).toBeVisible();
    await expect(page.getByText(CONTACTS.bloque.name, { exact: true })).toHaveCount(0);
  });

  test("Débloquer un contact : confirmé, enregistré, il quitte la page", async ({ page }) => {
    await ouvrirBloques(page);
    const rangee = page.getByRole("row").filter({ hasText: CONTACTS.aDebloquer.name });
    await cliquer(page, rangee.getByRole("button", { name: "Débloquer" }));
    const alerte = page.getByRole("alertdialog", { name: "Débloquer ce contact ?" });
    await etape(page, "Confirmer", async () => {
      await alerte.getByRole("button", { name: "Débloquer" }).click();
      await expect(alerte).toBeHidden();
    }, { capture: "ecran" });
    await expect.poll(async () => (await enBase(CONTACTS.aDebloquer)).isBlocked, { message: "Toujours bloqué en base" }).toBe(false);
    await expect(rangee).toHaveCount(0);
  });

  test("Débloquer puis annuler : le contact reste bloqué", async ({ page }) => {
    await ouvrirBloques(page);
    const rangee = page.getByRole("row").filter({ hasText: CONTACTS.bloque.name });
    await cliquer(page, rangee.getByRole("button", { name: "Débloquer" }));
    const alerte = page.getByRole("alertdialog", { name: "Débloquer ce contact ?" });
    await alerte.getByRole("button", { name: "Annuler" }).click();
    await expect(alerte).toBeHidden();
    expect((await enBase(CONTACTS.bloque)).isBlocked).toBe(true);
  });

  test("Bloquer depuis la liste des contacts, avec une raison : enregistré et affiché parmi les bloqués", async ({ page }) => {
    await ouvrir(page, "/dashboard/clients", { pret: page.getByRole("row").filter({ hasText: CONTACTS.complet.name }) });
    await page.getByPlaceholder("Recherchez par nom, email ou SIRET...").fill(CONTACTS.aBloquer.name);
    await attendreCalme(page);
    const rangee = page.getByRole("row").filter({ hasText: CONTACTS.aBloquer.name });
    await cliquer(page, rangee.getByRole("button", { name: "Actions du client" }));
    await page.getByRole("menuitem", { name: "Bloquer" }).click();
    const alerte = fenetre(page, `Bloquer ${CONTACTS.aBloquer.name} ?`);
    await alerte.getByLabel("Raison du blocage (optionnel)").fill("Facture contestée depuis trois mois");
    await etape(page, "Bloquer", async () => {
      await alerte.getByRole("button", { name: "Bloquer" }).click();
      await expect(alerte).toBeHidden();
    }, { capture: "ecran" });
    await expect.poll(async () => (await enBase(CONTACTS.aBloquer)).isBlocked).toBe(true);
    const doc = await enBase(CONTACTS.aBloquer);
    expect(doc.blockedReason).toBe("Facture contestée depuis trois mois");
    expect(doc.blockedAt, "Date de blocage enregistrée").toBeTruthy();
    await ouvrirBloques(page);
    await expect(page.getByText(CONTACTS.aBloquer.name).first()).toBeVisible();
  });

  test("Un contact bloqué n'est pas proposé dans l'éditeur de factures", async ({ page }) => {
    await ouvrirEditeur(page, "/dashboard/outils/factures/new");
    await page.getByRole("combobox").filter({ hasText: "Rechercher un client" }).click();
    const recherche = page.getByRole("dialog").getByRole("textbox").first();
    await recherche.fill("Client Bloqué");
    await attendreCalme(page);
    await etape(page, "Résultats de la recherche", async () => {
      await expect(page.getByRole("dialog").getByRole("button", { name: CONTACTS.bloque.name, exact: true }), "Le contact bloqué est proposé comme client").toHaveCount(0);
    }, { capture: "ecran" });
  });
});
