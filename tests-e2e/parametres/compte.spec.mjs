/**
 * Paramètres du compte : double authentification activée ou coupée (mêmes
 * appels que la fenêtre « Double authentification »), durée de session de
 * l'espace, texte de la fenêtre « Désactiver le compte ».
 *
 * Comptes du lot compte-espaces (donnees/lot-compte-espaces.mjs), un par test.
 */
import { createOTP } from "@better-auth/utils/otp";
import { symmetricDecrypt } from "better-auth/crypto";
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SECRET } from "../config.mjs";
import { MOT_DE_PASSE } from "../donnees/lot-parametres-auth.mjs";
import { COMPTES_CE } from "../donnees/lot-compte-espaces.mjs";
import { appelAuth, appelSite, contenuParametres, ouvrirParametres, SANS_SESSION } from "../authentification/outils-auth.mjs";

const db = () => base();
const REFUS_CONSOLE = /status of 4\d\d/;
const surLeSite = (page) => ouvrir(page, "/mentions-legales", { pret: page.getByRole("heading", { level: 1 }) });
const utilisateur = async (compte) => (await db()).collection("user").findOne({ _id: compte.utilisateur._id });
const deuxFacteurs = async (compte) => (await db()).collection("twoFactor").findOne({ userId: compte.utilisateur._id });
const codeEnvoye = async (compte) => (await (await db()).collection("twoFactorSetupOtp").findOne({ userId: compte.utilisateur._id.toHexString() }))?.otp;
/**
 * Code de mise en place « envoyé par e-mail » : le service d'e-mails est
 * coupé dans les tests (la route d'envoi y échoue), le code est donc posé en
 * base comme /api/auth/send-2fa-setup-otp l'enregistre (src/lib/setup-otp-store.js).
 */
async function codeRecuParEmail(compte, code) {
  await (await db()).collection("twoFactorSetupOtp").updateOne(
    { userId: compte.utilisateur._id.toHexString() },
    { $set: { userId: compte.utilisateur._id.toHexString(), otp: code, expiresAt: new Date(Date.now() + 5 * 60_000), attempts: 0 } },
    { upsert: true },
  );
  return code;
}

test.describe("Double authentification par e-mail : activée depuis les Paramètres", () => {
  test.use({ storageState: connecte(COMPTES_CE.a2fEmail.token), erreursConsoleAutorisees: REFUS_CONSOLE });
  test("Mot de passe puis code reçu par e-mail : double authentification active", async ({ page }) => {
    const compte = COMPTES_CE.a2fEmail;
    await surLeSite(page);
    const active = await appelAuth(page, "/two-factor/enable", { corps: { password: MOT_DE_PASSE, issuer: "Newbi" } });
    expect(active.statut).toBe(200);
    expect(active.corps.backupCodes?.length, "Aucun code de secours remis").toBeGreaterThan(0);
    const code = await codeRecuParEmail(compte, "482913");
    const verif = await appelSite(page, "/api/auth/verify-2fa-setup-otp", { methode: "POST", corps: { code } });
    expect(verif.statut).toBe(200);
    expect((await utilisateur(compte)).twoFactorEnabled).toBe(true);
    expect(await deuxFacteurs(compte), "Aucun secret ni code de secours enregistré").not.toBeNull();
    expect(await codeEnvoye(compte), "Le code reste utilisable après la vérification").toBeUndefined();
  });
});

test.describe("Double authentification par application : activée depuis les Paramètres", () => {
  test.use({ storageState: connecte(COMPTES_CE.a2fApplication.token), erreursConsoleAutorisees: REFUS_CONSOLE });
  test("Mot de passe puis code de l'application : double authentification active", async ({ page }) => {
    const compte = COMPTES_CE.a2fApplication;
    await surLeSite(page);
    const active = await appelAuth(page, "/two-factor/enable", { corps: { password: MOT_DE_PASSE, issuer: "Newbi" } });
    expect(active.statut).toBe(200);
    expect(active.corps.totpURI).toMatch(/^otpauth:\/\/totp\//);
    expect((await utilisateur(compte)).twoFactorEnabled, "Activée avant la saisie du code").not.toBe(true);
    const secret = await symmetricDecrypt({ key: SECRET, data: (await deuxFacteurs(compte)).secret });
    const verif = await appelAuth(page, "/two-factor/verify-totp", { corps: { code: await createOTP(secret, { period: 30, digits: 6 }).totp() } });
    expect(verif.statut).toBe(200);
    expect((await utilisateur(compte)).twoFactorEnabled).toBe(true);
  });
});

test.describe("Double authentification : erreurs à l'activation", () => {
  test.use({ storageState: connecte(COMPTES_CE.a2fEssais.token), erreursConsoleAutorisees: REFUS_CONSOLE });
  test("Mauvais mot de passe refusé ; cinq mauvais codes invalident le code envoyé", async ({ page }) => {
    const compte = COMPTES_CE.a2fEssais;
    await surLeSite(page);
    await etape(page, "Mauvais mot de passe : refusé, rien d'enregistré", async () => {
      const r = await appelAuth(page, "/two-factor/enable", { corps: { password: "Pas-Le-Bon-2026!" } });
      expect(r.statut).toBeGreaterThanOrEqual(400);
      expect(await deuxFacteurs(compte)).toBeNull();
    });
    await appelAuth(page, "/two-factor/enable", { corps: { password: MOT_DE_PASSE } });
    const bon = await codeRecuParEmail(compte, "735146");
    const faux = "000000";
    for (let i = 0; i < 5; i++) {
      const r = await appelSite(page, "/api/auth/verify-2fa-setup-otp", { methode: "POST", corps: { code: faux } });
      expect.soft(r.statut).toBe(400);
    }
    const apres = await appelSite(page, "/api/auth/verify-2fa-setup-otp", { methode: "POST", corps: { code: bon } });
    expect(apres.statut, "Le code reste valable après cinq essais ratés").toBe(400);
    expect((await utilisateur(compte)).twoFactorEnabled).not.toBe(true);
  });
});

test.describe("Double authentification : la couper demande le bon mot de passe", () => {
  test.use({ storageState: connecte(COMPTES_CE.a2fCoupure.token), erreursConsoleAutorisees: REFUS_CONSOLE });
  test("Mauvais mot de passe : refusé, toujours active", async ({ page }) => {
    const compte = COMPTES_CE.a2fCoupure;
    await surLeSite(page);
    const r = await appelAuth(page, "/two-factor/disable", { corps: { password: "Pas-Le-Bon-2026!" } });
    expect(r.statut).toBeGreaterThanOrEqual(400);
    expect((await utilisateur(compte)).twoFactorEnabled).toBe(true);
    expect(await deuxFacteurs(compte)).not.toBeNull();
  });
});

test.describe("Double authentification : sans session, rien", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: REFUS_CONSOLE });
  test("Envoi et vérification du code de mise en place : 401", async ({ page }) => {
    await surLeSite(page);
    expect((await appelSite(page, "/api/auth/send-2fa-setup-otp", { methode: "POST" })).statut).toBe(401);
    expect((await appelSite(page, "/api/auth/verify-2fa-setup-otp", { methode: "POST", corps: { code: "123456" } })).statut).toBe(401);
  });
});

test.describe("Durée de session de l'espace", () => {
  test.use({ storageState: connecte(COMPTES_CE.dureeSession.token), erreursConsoleAutorisees: REFUS_CONSOLE });
  // La durée choisie dans Sécurité (7, 30 ou 90 jours) borne la session
  // depuis la connexion, renouvellement compris.
  test("Durée de 7 jours : une session ouverte il y a 8 jours n'est plus valable", async ({ page }) => {
    await surLeSite(page);
    const r = await appelAuth(page, "/get-session", { methode: "GET" });
    expect(r.corps?.session ?? null, "La session de 8 jours est encore acceptée malgré une durée de 7 jours").toBeNull();
  });
});

test.describe("Désactiver le compte : la fenêtre dit ce qui se passe", () => {
  // L'espace, sans abonnement, est en lecture seule (402 des comptes bancaires, défaut dédié).
  test.use({ storageState: connecte(COMPTES_CE.desactivationTexte.token), erreursConsoleAutorisees: /401|status of 402/ });
  // Défaut connu : la fenêtre annonce une suppression définitive et
  // irréversible, alors que le compte est seulement suspendu (réactivable par
  // le lien envoyé à la prochaine connexion, données conservées).
  test("Le texte n'annonce pas une suppression définitive d'un compte réactivable", async ({ page }) => {
    await ouvrirParametres(page, "user-info");
    await contenuParametres(page).getByRole("button", { name: "Désactiver", exact: true }).click();
    const fenetre = page.getByRole("dialog").filter({ hasText: "Tapez votre adresse e-mail pour confirmer." });
    await expect(fenetre).toBeVisible();
    const texte = (await fenetre.innerText()).replace(/\s+/g, " ");
    expect(texte, "La fenêtre promet une suppression définitive").not.toMatch(/définitivement|irréversible/i);
    await fenetre.getByRole("button", { name: "Annuler" }).click();
    expect((await utilisateur(COMPTES_CE.desactivationTexte)).isActive).toBe(true);
  });
});
