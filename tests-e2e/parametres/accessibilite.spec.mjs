/**
 * Paramètres : accessibilité des réglages. Un interrupteur ou une case sans
 * nom accessible est lu « interrupteur, désactivé » par un lecteur d'écran :
 * impossible de savoir ce qu'il règle. Chaque contrôle doit porter le nom de
 * ce qu'il règle (étiquette reliée, aria-label).
 */
import { test, expect } from "../outils.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { connecte, SESSION_TOKEN_PARAMETRES } from "../config.mjs";
import { contenuParametres, ouvrirParametres } from "../authentification/outils-auth.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_PARAMETRES) });
test.beforeEach(async () => {
  await (await base()).collection("organization").updateOne({ _id: COMPTES.parametres.organisation._id }, { $set: { "sessionSettings.maxSessions": 3 } });
});

/** Noms accessibles des contrôles d'un rôle donné dans une zone. */
async function nomsDe(zone, role) {
  const noms = [];
  for (const el of await zone.getByRole(role).all()) {
    if (!(await el.isVisible().catch(() => false))) continue;
    const snap = await el.ariaSnapshot({ timeout: 2_000 }).catch(() => "");
    const m = /^- [a-z]+(?: "((?:[^"\\]|\\.)*)")?/.exec(snap.split("\n")[0] || "");
    noms.push(m?.[1] ? JSON.parse(`"${m[1]}"`) : "");
  }
  return noms;
}

test.describe("Paramètres : chaque réglage a un nom accessible", () => {
  test("Sécurité : l'interrupteur de la double authentification", async ({ page }) => {
    await ouvrirParametres(page, "securite");
    const noms = await nomsDe(contenuParametres(page), "switch");
    expect(noms.length).toBeGreaterThan(0);
    expect(noms.filter((n) => !n), "Interrupteur(s) sans nom dans l'onglet Sécurité").toEqual([]);
  });

  test("Sécurité : les listes de durée, d'inactivité et de sessions", async ({ page }) => {
    await ouvrirParametres(page, "securite");
    const noms = await nomsDe(contenuParametres(page), "combobox");
    expect(noms.filter((n) => !n || /^\d|jours|minutes|heures|sessions?$/.test(n)), "Liste(s) nommées seulement par leur valeur, sans dire ce qu'elles règlent").toEqual([]);
  });

  test("Informations légales : les interrupteurs de TVA", async ({ page }) => {
    await ouvrirParametres(page, "informations-legales");
    const noms = await nomsDe(contenuParametres(page), "switch");
    expect(noms.filter((n) => !n), "Interrupteur(s) sans nom dans Informations légales").toEqual([]);
  });

  test("Notifications : les interrupteurs e-mail et push de chaque notification", async ({ page }) => {
    await ouvrirParametres(page, "notifications");
    await contenuParametres(page).getByRole("tab", { name: "Préférences" }).click();
    await expect(contenuParametres(page).getByRole("switch").first()).toBeVisible();
    const noms = await nomsDe(contenuParametres(page), "switch");
    expect(noms.filter((n) => !n).length, `${noms.filter((n) => !n).length} interrupteur(s) sur ${noms.length} sans nom dans les préférences de notifications`).toBe(0);
  });

  test("Rôles : les cases des droits d'un rôle", async ({ page }) => {
    await ouvrirParametres(page, "roles");
    await contenuParametres(page).getByRole("button", { name: "Créer un rôle" }).click();
    const fenetre = page.getByRole("dialog", { name: "Nouveau rôle" });
    await expect(fenetre).toBeVisible();
    const noms = await nomsDe(fenetre, "checkbox");
    expect(noms.length).toBeGreaterThan(0);
    expect(noms.filter((n) => !n).length, `${noms.filter((n) => !n).length} case(s) sur ${noms.length} sans nom dans l'éditeur de rôle`).toBe(0);
  });
});
