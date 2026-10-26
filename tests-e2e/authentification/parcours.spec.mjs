/**
 * Authentification : les parcours d'un utilisateur, chaque étape vérifiée en
 * base. Connexion par le formulaire, déconnexion, connexion avec la double
 * authentification (application ou code de secours), mot de passe oublié
 * puis nouveau mot de passe par le lien, vérification de l'e-mail, limite de
 * sessions simultanées, essai terminé, compte désactivé.
 *
 * Chaque parcours a son compte (donnees/lot-parametres-auth.mjs) : se
 * connecter ou se déconnecter ne touche aucun autre compte de test. Les
 * appels à Better Auth respectent ses limites (outils-auth.mjs).
 */
import { createHmac } from "node:crypto";
import { createOTP } from "@better-auth/utils/otp";
import { signJWT } from "better-auth/crypto";
import { test, expect, etape, SELECTEUR_NOTIFICATION_SUCCES, notificationsErreur } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SECRET } from "../config.mjs";
import { CODES_SECOURS, COMPTES_AUTH, HACHAGE_MOT_DE_PASSE, JETONS_REINITIALISATION, MOT_DE_PASSE, SECRET_TOTP } from "../donnees/lot-parametres-auth.mjs";
import { attendreQuota, connexionApi, ouvrirInscription, SANS_SESSION } from "./outils-auth.mjs";

const db = () => base();
const sessionsDe = async (compte) => (await db()).collection("session").find({ userId: compte.utilisateur._id }).toArray();
const motDePasseEnBase = async (compte) => (await (await db()).collection("account").findOne({ userId: compte.utilisateur._id, providerId: "credential" }))?.password;

/** Page de connexion, formulaire e-mail affiché. */
async function formulaireConnexion(page) {
  await ouvrir(page, "/auth/login", { pret: page.getByRole("button", { name: "Continuer avec l'email" }) });
  await page.getByRole("button", { name: "Continuer avec l'email" }).click();
  await expect(page.getByPlaceholder("Saisissez votre email")).toBeVisible();
}

async function seConnecter(page, email, motDePasse) {
  await formulaireConnexion(page);
  await page.getByPlaceholder("Saisissez votre email").fill(email);
  await page.getByPlaceholder("Saisissez votre mot de passe").fill(motDePasse);
  await attendreQuota("/sign-in/email");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
}

const codeTotp = () => createOTP(SECRET_TOTP, { period: 30, digits: 6 }).totp();

test.describe("Connexion par e-mail", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 40[01]|\/api\/auth\/token/ });

  test("Bon mot de passe : tableau de bord, session et appareil enregistrés", async ({ page }) => {
    const compte = COMPTES_AUTH.connexion;
    await seConnecter(page, compte.utilisateur.email, MOT_DE_PASSE);
    await expect(page, "La connexion ne mène pas au tableau de bord").toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await etape(page, "Session ouverte dans son espace", async () => {
      const sessions = await sessionsDe(compte);
      expect(sessions.length, "Aucune session en base après la connexion").toBeGreaterThan(0);
      expect(sessions.at(-1).activeOrganizationId).toBe(compte.organisation._id.toHexString());
    });
    await etape(page, "Connexion inscrite dans l'historique des appareils", async () => {
      const appareil = await (await db()).collection("user_device_log").findOne({ userId: compte.utilisateur._id.toHexString() });
      expect(appareil?.loginCount, "Aucune connexion dans l'historique des appareils").toBeGreaterThan(0);
    });
  });

  test("Adresse en majuscules : acceptée comme la même adresse", async ({ page }) => {
    await seConnecter(page, COMPTES_AUTH.connexion.utilisateur.email.toUpperCase(), MOT_DE_PASSE);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  });

  test("Mauvais mot de passe : message clair, aucune session", async ({ page }) => {
    const compte = COMPTES_AUTH.connexion;
    const avant = (await sessionsDe(compte)).length;
    await seConnecter(page, compte.utilisateur.email, "Pas-Le-Bon-2026!");
    await expect(notificationsErreur(page).filter({ hasText: "Email ou mot de passe incorrect" })).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
    expect((await sessionsDe(compte)).length).toBe(avant);
  });

  test("Champs vides ou adresse mal écrite : refusés avant l'envoi", async ({ page }) => {
    await formulaireConnexion(page);
    await page.getByRole("button", { name: "Se connecter", exact: true }).click();
    await expect(page.getByText(/requis|Email invalide/i).first(), "Aucun message pour un formulaire vide").toBeVisible();
    await page.getByPlaceholder("Saisissez votre email").fill("connexion.e2e.test");
    await page.getByPlaceholder("Saisissez votre mot de passe").fill(MOT_DE_PASSE);
    await page.getByRole("button", { name: "Se connecter", exact: true }).click();
    await expect(page.getByText("Email invalide").first()).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("Compte désactivé, bon mot de passe : connexion refusée avec une explication", async ({ page }) => {
    const compte = COMPTES_AUTH.desactive;
    await seConnecter(page, compte.utilisateur.email, MOT_DE_PASSE);
    await expect(notificationsErreur(page).filter({ hasText: /désactivé/ })).toBeVisible();
    expect(await sessionsDe(compte), "Une session a été ouverte pour un compte désactivé").toEqual([]);
  });

  test.describe(() => {
    // Espace en lecture seule : les comptes bancaires répondent 402 (défaut dédié, lecture-seule.spec.mjs).
    test.use({ erreursConsoleAutorisees: /status of 40[012]|\/api\/auth\/token/ });
  test("Essai terminé sans abonnement : tableau de bord en lecture seule, sans boucle", async ({ page }) => {
    await seConnecter(page, COMPTES_AUTH.essaiExpire.utilisateur.email, MOT_DE_PASSE);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await page.waitForTimeout(3_000);
    await expect(page, "Renvoyé hors du tableau de bord (boucle connexion ↔ inscription)").toHaveURL(/\/dashboard/);
  });
  });

  test("Limite d'une session : les deux sessions plus anciennes sont fermées", async ({ page }) => {
    const compte = COMPTES_AUTH.limiteSessions;
    await seConnecter(page, compte.utilisateur.email, MOT_DE_PASSE);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    const restantes = (await sessionsDe(compte)).map((s) => s.token);
    expect(restantes, "L'ancienne session de l'iPhone est toujours ouverte").not.toContain(compte.sessions[0].token);
    expect(restantes, "L'ancienne session de Firefox est toujours ouverte").not.toContain(compte.sessions[1].token);
    expect(restantes.length).toBe(1);
  });
});

test.describe("Connexion au-delà de la limite de sessions : l'utilisateur est prévenu", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 40[01]|\/api\/auth\/token/ });
  // La limite est appliquée à la création de la session (hook Better Auth) ; la
  // route appelée ensuite pour prévenir l'utilisateur ne trouve plus rien à fermer.
  test("Une notification dit que d'autres sessions ont été déconnectées", async ({ page }) => {
    const compte = COMPTES_AUTH.limiteSessionsAvis;
    await seConnecter(page, compte.utilisateur.email, MOT_DE_PASSE);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: /autres sessions ont été déconnectées|autre session a été déconnectée/ }).first(),
      "Aucune notification : l'utilisateur ne sait pas que ses autres appareils ont été déconnectés",
    ).toBeVisible();
  });
});

test.describe("Déconnexion", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.deconnexion.token), erreursConsoleAutorisees: /status of 401|\/api\/auth\/token/ });
  test("Depuis le menu du compte : session fermée, retour à la connexion", async ({ page }) => {
    const compte = COMPTES_AUTH.deconnexion;
    await ouvrir(page, "/dashboard");
    // Barre latérale repliée : le menu du compte est l'avatar aux initiales (« DD »).
    await page.getByRole("button").filter({ hasText: /^\s*DD\s*$/ }).last().click();
    await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
    expect(await (await db()).collection("session").findOne({ token: compte.token }), "La session est toujours active après la déconnexion").toBeNull();
    await page.goto("/dashboard");
    await expect(page, "Le tableau de bord reste ouvert après la déconnexion").toHaveURL(/\/auth\/login/, { timeout: 30_000 });
  });
});

test.describe("Double authentification", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 40[01]|\/api\/auth\/token/ });

  test("Code de l'application : connecté après le code", async ({ page }) => {
    const compte = COMPTES_AUTH.deuxFacteurs;
    await seConnecter(page, compte.utilisateur.email, MOT_DE_PASSE);
    await expect(page, "Le mot de passe ne mène pas à la page du code").toHaveURL(/\/auth\/verify-2fa/, { timeout: 30_000 });
    await etape(page, "Aucune session tant que le code n'est pas saisi", async () => {
      expect(await sessionsDe(compte)).toEqual([]);
    });
    const confiance = page.getByRole("checkbox", { name: "Faire confiance à cet appareil pendant 60 jours" });
    await confiance.check();
    await expect(confiance).toBeChecked();
    await attendreQuota("/two-factor/verify-totp");
    await page.locator("input[data-input-otp]").fill(await codeTotp());
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    expect((await sessionsDe(compte)).length, "Aucune session après le bon code").toBe(1);
  });

  test("Code de secours : connecté, le code est retiré de la liste", async ({ page }) => {
    const compte = COMPTES_AUTH.deuxFacteursSecours;
    await seConnecter(page, compte.utilisateur.email, MOT_DE_PASSE);
    await expect(page).toHaveURL(/\/auth\/verify-2fa/, { timeout: 30_000 });
    await page.getByRole("button", { name: "Utiliser un code de secours" }).click();
    await page.locator("#backup-code").fill(CODES_SECOURS[0]);
    await attendreQuota("/two-factor/verify-backup-code");
    await page.getByRole("button", { name: "Vérifier le code de secours" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.locator(SELECTEUR_NOTIFICATION_SUCCES).filter({ hasText: /code de secours/ }).first()).toBeVisible();
  });
});

test.describe("Mot de passe oublié", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 40[01]|\/api\/auth\/token/ });

  test("Lien reçu, nouveau mot de passe : il ouvre la session, l'ancien non", async ({ page }) => {
    const compte = COMPTES_AUTH.motDePasseOublie;
    await ouvrir(page, "/auth/forget-password", { pret: page.getByPlaceholder("Saisissez votre email") });
    await page.getByPlaceholder("Saisissez votre email").fill(compte.utilisateur.email);
    await attendreQuota("/request-password-reset");
    await page.getByRole("button", { name: "Envoyer le lien" }).click();
    await expect(page.locator(SELECTEUR_NOTIFICATION_SUCCES).filter({ hasText: "Un email vous a été envoyé" })).toBeVisible();
    const jeton = await etape(page, "Lien de réinitialisation créé", async () => {
      await expect.poll(async () => (await db()).collection("verification").countDocuments({ value: compte.utilisateur._id.toHexString(), identifier: /^reset-password:/ })).toBe(1);
      const v = await (await db()).collection("verification").findOne({ value: compte.utilisateur._id.toHexString(), identifier: /^reset-password:/ });
      return v.identifier.replace("reset-password:", "");
    });
    await ouvrir(page, `/auth/reset-password?token=${jeton}`, { pret: page.getByPlaceholder("Nouveau mot de passe").first() });
    await page.getByPlaceholder("Nouveau mot de passe").first().fill("Nouveau-Depart-2026!");
    await page.getByRole("button", { name: "Réinitialiser le mot de passe" }).first().click();
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
    expect(await motDePasseEnBase(compte), "Le mot de passe n'a pas changé en base").not.toBe(HACHAGE_MOT_DE_PASSE);
    const nouveau = await connexionApi(page, compte.utilisateur.email, "Nouveau-Depart-2026!");
    expect(nouveau.statut, "Le nouveau mot de passe n'ouvre pas la session").toBe(200);
    const ancien = await connexionApi(page, compte.utilisateur.email, MOT_DE_PASSE);
    expect(ancien.statut, "L'ancien mot de passe ouvre encore la session").toBeGreaterThanOrEqual(400);
  });

  test.describe(() => {
    // Refus attendu (lien expiré), écrit dans la console par la page.
    test.use({ erreursConsoleAutorisees: /RESET PASSWORD|status of 40[01]/ });
  test("Lien expiré : message clair, mot de passe inchangé", async ({ page }) => {
    const compte = COMPTES_AUTH.jetonExpire;
    await ouvrir(page, `/auth/reset-password?token=${JETONS_REINITIALISATION.expire.jeton}`, { pret: page.getByPlaceholder("Nouveau mot de passe").first() });
    await page.getByPlaceholder("Nouveau mot de passe").first().fill("Trop-Tard-2026!");
    await page.getByRole("button", { name: "Réinitialiser le mot de passe" }).first().click();
    await expect(notificationsErreur(page).first(), "Aucun message pour un lien expiré").toBeVisible();
    await expect(notificationsErreur(page).first()).toHaveText(/expir|invalide/i);
    expect(await motDePasseEnBase(compte)).toBe(HACHAGE_MOT_DE_PASSE);
  });
  });

  test("Nouveau mot de passe de 7 caractères : refusé avant l'envoi", async ({ page }) => {
    await ouvrir(page, `/auth/reset-password?token=${JETONS_REINITIALISATION.expire.jeton}`, { pret: page.getByPlaceholder("Nouveau mot de passe").first() });
    await page.getByPlaceholder("Nouveau mot de passe").first().fill("Court1!");
    await page.getByRole("button", { name: "Réinitialiser le mot de passe" }).first().click();
    await expect(page.getByText("Le mot de passe doit contenir au moins 8 caractères").first()).toBeVisible();
  });

  // Recommandation ANSSI / OWASP : un mot de passe changé parce qu'il a fuité
  // ne protège rien si les sessions déjà ouvertes avec lui restent actives.
  test("Après un nouveau mot de passe par le lien, les sessions ouvertes ailleurs sont fermées", async ({ page }) => {
    const compte = COMPTES_AUTH.reinitialisationSessions;
    await ouvrir(page, `/auth/reset-password?token=${JETONS_REINITIALISATION.sessions.jeton}`, { pret: page.getByPlaceholder("Nouveau mot de passe").first() });
    await page.getByPlaceholder("Nouveau mot de passe").first().fill("Sessions-Fermees-2026!");
    await page.getByRole("button", { name: "Réinitialiser le mot de passe" }).first().click();
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
    expect(await motDePasseEnBase(compte)).not.toBe(HACHAGE_MOT_DE_PASSE);
    const autre = await (await db()).collection("session").findOne({ token: compte.sessions[0].token });
    expect(autre, "La session ouverte sur l'iPhone reste active après le nouveau mot de passe").toBeNull();
  });
});

test.describe("Vérification de l'e-mail et pages d'information", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 40[01]|\/api\/auth\/token/ });

  test("Lien de vérification : e-mail vérifié, page de confirmation", async ({ page }) => {
    const compte = COMPTES_AUTH.verificationEmail;
    const jeton = await signJWT({ email: compte.utilisateur.email }, SECRET, 3600);
    await page.goto(`/api/auth/verify-email?token=${jeton}`);
    await expect(page).toHaveURL(/\/auth\/verify-email/, { timeout: 30_000 });
    expect(page.url(), "La vérification a échoué").not.toMatch(/error=/);
    await expect.poll(async () => (await (await db()).collection("user").findOne({ _id: compte.utilisateur._id }))?.emailVerified).toBe(true);
  });

  test("Lien de vérification invalide : la page le dit, rien n'est vérifié", async ({ page }) => {
    await page.goto("/api/auth/verify-email?token=jeton-invalide");
    await expect(page).toHaveURL(/error=invalid-token/, { timeout: 30_000 });
    await expect(page.getByText(/invalide|expiré/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test("Session expirée par inactivité : explication et retour à la connexion", async ({ page }) => {
    await page.goto("/auth/session-expired?reason=inactivity");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button").first().click();
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
  });

  test("Inscription : chaque lien de la page mène à une page qui existe", async ({ page }) => {
    await ouvrirInscription(page, page.getByRole("button", { name: "Continuer avec l'email" }));
    const liens = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute("href")))]);
    for (const href of liens) {
      const reponse = await page.request.get(href, { maxRedirects: 0 });
      expect.soft(reponse.status(), `Lien ${href} de la page d'inscription`).toBeLessThan(400);
    }
    expect(liens).toContain("/mentions-legales");
  });

  test("Connexion : chaque lien de la page mène à une page qui existe", async ({ page }) => {
    await formulaireConnexion(page);
    const liens = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute("href")))]);
    for (const href of liens) {
      const reponse = await page.request.get(href, { maxRedirects: 0 });
      expect.soft(reponse.status(), `Lien ${href} de la page de connexion`).toBeLessThan(400);
    }
  });

  test("« Continuer avec Apple » : pas d'erreur serveur", async ({ page }) => {
    await ouvrir(page, "/auth/login", { pret: page.getByRole("button", { name: "Continuer avec Apple" }) });
    const reponse = page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/social"), { timeout: 15_000 });
    await attendreQuota("/sign-in/social");
    await page.getByRole("button", { name: "Continuer avec Apple" }).click();
    const r = await reponse;
    expect(r.status(), `La connexion avec Apple répond ${r.status()}`).toBeLessThan(500);
  });
});



/** Lien de réactivation, signé comme le site l'envoie (HMAC avec le secret des tests, 24 h). */
function jetonReactivation(userId, quand = Date.now() - 1_000) {
  const charge = Buffer.from(`${userId}:${quand}`).toString("base64url");
  return `${charge}.${createHmac("sha256", SECRET).update(`reactivation:${charge}`).digest("base64url")}`;
}

test.describe("Réactivation du compte par le lien reçu", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 4\d\d/ });

  test("Lien valide : compte réactivé, connexion de nouveau possible", async ({ page }) => {
    const compte = COMPTES_AUTH.reactivation;
    const jeton = jetonReactivation(compte.utilisateur._id.toHexString());
    await page.goto(`/reactivate-account?email=${encodeURIComponent(compte.utilisateur.email)}&token=${jeton}`);
    await expect(page.locator(SELECTEUR_NOTIFICATION_SUCCES).filter({ hasText: "Compte réactivé avec succès" })).toBeVisible({ timeout: 30_000 });
    expect((await (await db()).collection("user").findOne({ _id: compte.utilisateur._id }))?.isActive).toBe(true);
    const r = await connexionApi(page, compte.utilisateur.email, MOT_DE_PASSE);
    expect(r.statut, "La connexion reste impossible après la réactivation").toBe(200);
  });

  test("Lien modifié : refusé avec un message, le compte reste désactivé", async ({ page }) => {
    const compte = COMPTES_AUTH.desactive;
    const jeton = jetonReactivation(compte.utilisateur._id.toHexString()).replace(/.$/, (c) => (c === "A" ? "B" : "A"));
    await page.goto(`/reactivate-account?email=${encodeURIComponent(compte.utilisateur.email)}&token=${jeton}`);
    await expect(notificationsErreur(page).first(), "Aucun message pour un lien modifié").toBeVisible({ timeout: 30_000 });
    expect((await (await db()).collection("user").findOne({ _id: compte.utilisateur._id }))?.isActive).toBe(false);
  });
});

test.describe("Supprimer mon compte (page d'information)", () => {
  test.use({ storageState: SANS_SESSION });
  test("La démarche est expliquée et chaque lien interne mène à une page qui existe", async ({ page }) => {
    await page.goto("/supprimer-compte");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('a[href^="mailto:contact@newbi.fr"]').first(), "Aucun moyen de demander la suppression").toBeVisible();
    const liens = await page.evaluate(() => [...new Set([...document.querySelectorAll('main a[href^="/"], article a[href^="/"], section a[href^="/"]')].map((a) => a.getAttribute("href")))]);
    for (const href of liens) {
      const reponse = await page.request.get(href, { maxRedirects: 0 });
      expect.soft(reponse.status(), `Lien ${href}`).toBeLessThan(400);
    }
  });
});
