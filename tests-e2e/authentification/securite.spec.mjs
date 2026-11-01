/**
 * Authentification : ce qu'une personne pourrait tenter en dehors des
 * écrans (adresse de retour piégée, routes de codes OTP, proxy de
 * l'application mobile, compte désactivé, anciennes opérations de l'API,
 * jeton à usage unique), chaque refus vérifié en base.
 *
 * Comptes du lot compte-espaces (donnees/lot-compte-espaces.mjs), un par
 * usage : se connecter ou désactiver ne touche aucun autre compte de test.
 */
import { createOTP } from "@better-auth/utils/otp";
import { signJWT } from "better-auth/crypto";
import { test, expect, etape, notificationsErreur } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { API_URL, BASE_URL, connecte, SECRET } from "../config.mjs";
import { MOT_DE_PASSE, SECRET_TOTP } from "../donnees/lot-parametres-auth.mjs";
import { COMPTES_CE, INVITATION_LIEN } from "../donnees/lot-compte-espaces.mjs";
import { appelAuth, appelSite, attendreQuota, connexionApi, SANS_SESSION } from "./outils-auth.mjs";

const db = () => base();
const sessionsDe = async (compte) => (await db()).collection("session").find({ userId: compte.utilisateur._id }).toArray();
const utilisateur = async (compte) => (await db()).collection("user").findOne({ _id: compte.utilisateur._id });
const codeTotp = () => createOTP(SECRET_TOTP, { period: 30, digits: 6 }).totp();

/** Page légère du site (aucune requête à l'API) pour lancer des appels. */
const surLeSite = (page) => ouvrir(page, "/mentions-legales", { pret: page.getByRole("heading", { level: 1 }) });

async function seConnecter(page, url, email, motDePasse = MOT_DE_PASSE) {
  await ouvrir(page, url, { pret: page.getByRole("button", { name: "Continuer avec l'email" }) });
  await page.getByRole("button", { name: "Continuer avec l'email" }).click();
  await page.getByPlaceholder("Saisissez votre email").fill(email);
  await page.getByPlaceholder("Saisissez votre mot de passe").fill(motDePasse);
  await attendreQuota("/sign-in/email");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
}

/** Requête GraphQL directe à l'API, sans cookie, avec un jeton (ou aucun). */
async function graphql(page, query, { jeton = null, variables = {} } = {}) {
  return page.evaluate(
    async ({ api, query, variables, jeton }) => {
      const res = await fetch(`${api}/graphql`, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json", "x-app-client": "web", ...(jeton ? { authorization: `Bearer ${jeton}` } : {}) },
        body: JSON.stringify({ query, variables }),
      });
      const corps = await res.json().catch(() => ({}));
      return { statut: res.status, data: corps.data ?? null, errors: corps.errors ?? [] };
    },
    { api: API_URL, query, variables, jeton },
  );
}

test.describe("Connexion : adresse de retour (callbackUrl)", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 40[01]|\/api\/auth\/token/ });

  const compte = COMPTES_CE.callback;
  for (const [cas, cible] of [
    ["site extérieur", "https://exemple.invalid/x"],
    ["adresse sans protocole (//)", "//exemple.invalid/x"],
    ["barre oblique inverse", "/\\exemple.invalid/x"],
  ]) {
    test(`${cas} : la connexion reste sur le site`, async ({ page }) => {
      const sorties = [];
      page.on("request", (r) => {
        if (new URL(r.url()).hostname.endsWith("exemple.invalid")) sorties.push(r.url());
      });
      await seConnecter(page, `/auth/login?callbackUrl=${encodeURIComponent(cible)}`, compte.utilisateur.email);
      await expect(page, "La connexion n'a pas mené au tableau de bord").toHaveURL(/\/dashboard/, { timeout: 30_000 });
      expect(new URL(page.url()).origin).toBe(BASE_URL);
      expect(sorties, "Le navigateur est parti vers le site extérieur").toEqual([]);
    });
  }

  test("javascript: : jamais exécuté, tableau de bord", async ({ page }) => {
    await seConnecter(page, `/auth/login?callbackUrl=${encodeURIComponent("javascript:window.__pirate=1")}`, compte.utilisateur.email);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    expect(await page.evaluate(() => window.__pirate), "Le code de l'adresse de retour a été exécuté").toBeUndefined();
  });

  test("Chemin du site (/dashboard/clients) : suivi après la connexion", async ({ page }) => {
    await seConnecter(page, `/auth/login?callbackUrl=${encodeURIComponent("/dashboard/clients")}`, compte.utilisateur.email);
    await expect(page, "Le chemin interne demandé n'est pas suivi").toHaveURL(/\/dashboard\/clients/, { timeout: 30_000 });
  });

  test("Avec la double authentification : retour sur le site après le code", async ({ page }) => {
    const deux = COMPTES_CE.callback2fa;
    await seConnecter(page, `/auth/login?callbackUrl=${encodeURIComponent("https://exemple.invalid/x")}`, deux.utilisateur.email);
    await expect(page).toHaveURL(/\/auth\/verify-2fa/, { timeout: 30_000 });
    await attendreQuota("/two-factor/verify-totp");
    await page.locator("input[data-input-otp]").fill(await codeTotp());
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    expect(new URL(page.url()).origin).toBe(BASE_URL);
  });
});

test.describe("Codes OTP : seule la vérification d'adresse reste ouverte", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 40\d/ });
  const compte = COMPTES_CE.codesOtp;
  const email = compte.utilisateur.email;

  test("Demande d'un code de connexion ou de mot de passe oublié : refusée, aucun code enregistré", async ({ page }) => {
    await surLeSite(page);
    for (const type of ["sign-in", "forget-password", "email-verification-autre"]) {
      const r = await appelAuth(page, "/email-otp/send-verification-otp", { corps: { email, type } });
      expect.soft(r.statut, `Code « ${type} » accepté`).toBeGreaterThanOrEqual(400);
      expect.soft(r.statut).toBeLessThan(500);
    }
    const codes = await (await db()).collection("verification").countDocuments({ identifier: new RegExp(`(sign-in|forget-password)-otp-${email}`) });
    expect(codes, "Un code de connexion a été enregistré (jamais envoyé, mais acceptable)").toBe(0);
  });

  test("Routes de connexion et de réinitialisation par code : fermées, aucune session, mot de passe inchangé", async ({ page }) => {
    await surLeSite(page);
    const motDePasseAvant = (await (await db()).collection("account").findOne({ userId: compte.utilisateur._id, providerId: "credential" }))?.password;
    for (const [chemin, corps] of [
      ["/sign-in/email-otp", { email, otp: "123456" }],
      ["/email-otp/request-password-reset", { email }],
      ["/forget-password/email-otp", { email }],
      ["/email-otp/reset-password", { email, otp: "123456", password: "Pirate-2026-Mdp!" }],
      ["/sign-in/phone-number", { phoneNumber: "+33612345678", password: MOT_DE_PASSE }],
      ["/phone-number/send-otp", { phoneNumber: "+33612345678" }],
      ["/phone-number/verify", { phoneNumber: "+33612345678", code: "123456" }],
      ["/phone-number/reset-password", { phoneNumber: "+33612345678", otp: "123456", newPassword: "Pirate-2026-Mdp!" }],
    ]) {
      const r = await appelAuth(page, chemin, { corps });
      expect.soft(r.statut, `${chemin} répond ${r.statut}`).toBe(404);
    }
    expect(await sessionsDe(compte), "Une session a été ouverte par un code").toEqual([]);
    const motDePasseApres = (await (await db()).collection("account").findOne({ userId: compte.utilisateur._id, providerId: "credential" }))?.password;
    expect(motDePasseApres).toBe(motDePasseAvant);
  });

  test("Vérification d'adresse par code (application mobile) : toujours ouverte", async ({ page }) => {
    await surLeSite(page);
    const r = await appelAuth(page, "/email-otp/send-verification-otp", { corps: { email, type: "email-verification" } });
    expect(r.statut, `La demande de code de vérification d'adresse répond ${r.statut}`).toBe(200);
  });
});

test.describe("Application mobile : proxy d'autorisation et origines", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 40\d/ });

  test("Proxy vers un site extérieur : refusé, aucune redirection", async ({ page }) => {
    for (const parametres of [
      `authorizationURL=${encodeURIComponent("https://exemple.invalid/")}&oauthState=x`,
      `authorizationURL=${encodeURIComponent("https://exemple.invalid/?state=abc")}`,
    ]) {
      const r = await page.request.get(`/api/auth/expo-authorization-proxy?${parametres}`, { maxRedirects: 0 });
      expect.soft(r.status(), "Le proxy redirige vers une adresse quelconque").toBe(400);
      expect.soft(r.headers().location || "").not.toContain("exemple.invalid");
    }
  });

  test("En-tête expo-origin d'un site extérieur : adresse de retour refusée", async ({ page }) => {
    const r = await page.request.post("/api/auth/sign-in/social", {
      headers: { "expo-origin": "https://exemple.invalid", "content-type": "application/json" },
      data: { provider: "google", callbackURL: "https://exemple.invalid/retour", disableRedirect: true },
    });
    expect(r.status(), "Une adresse de retour extérieure est acceptée").toBe(403);
    expect(JSON.stringify(await r.json().catch(() => ({})))).not.toContain("accounts.google.com");
  });
});

test.describe("Compte désactivé : aucune voie de connexion", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 40\d/ });
  const compte = COMPTES_CE.desactiveVariantes;

  for (const [cas, email] of [
    ["adresse en majuscules", compte.utilisateur.email.toUpperCase()],
    ["espaces autour de l'adresse", `  ${compte.utilisateur.email}  `],
  ]) {
    test(`${cas} : refusée avec l'explication, aucune session`, async ({ page }) => {
      await surLeSite(page);
      const r = await connexionApi(page, email, MOT_DE_PASSE);
      expect(r.statut, `La connexion répond ${r.statut}`).toBeGreaterThanOrEqual(400);
      expect(JSON.stringify(r.corps)).toMatch(/désactivé/);
      expect(await sessionsDe(compte), "Une session a été ouverte pour un compte désactivé").toEqual([]);
    });
  }

  test("Adresse en majuscules dans le formulaire : message de désactivation", async ({ page }) => {
    await seConnecter(page, "/auth/login", compte.utilisateur.email.toUpperCase());
    await expect(notificationsErreur(page).filter({ hasText: /désactivé/ })).toBeVisible();
    expect(await sessionsDe(compte)).toEqual([]);
  });

  test("Adresse envoyée comme un objet ({ $regex }) : 400, aucune session", async ({ page }) => {
    await surLeSite(page);
    const r = await appelAuth(page, "/sign-in/email", { corps: { email: { $regex: "^desactive" }, password: "x" } });
    expect(r.statut).toBe(400);
    expect(await sessionsDe(compte)).toEqual([]);
  });
});

test.describe("Compte désactivé : le jeton de l'API obtenu avant ne sert plus", () => {
  test.use({ storageState: connecte(COMPTES_CE.desactivationJeton.token), erreursConsoleAutorisees: /status of 40\d/ });
  test("Désactiver son compte : l'API refuse ensuite son jeton", async ({ page }) => {
    const compte = COMPTES_CE.desactivationJeton;
    await surLeSite(page);
    const jeton = await page.evaluate(() => fetch("/api/auth/token", { credentials: "include" }).then((r) => r.json()).then((d) => d.token));
    expect(jeton, "Aucun jeton de l'API pour la session").toBeTruthy();
    const r = await appelSite(page, "/api/account/deactivate", { methode: "POST", corps: { email: compte.utilisateur.email } });
    expect(r.statut).toBe(200);
    expect((await utilisateur(compte)).isActive).toBe(false);
    // Le cache de l'API garde un utilisateur 30 s au plus
    await expect
      .poll(async () => (await graphql(page, "query { me { id email } }", { jeton })).data?.me ?? null, {
        timeout: 45_000,
        intervals: [2_000],
        message: "L'API accepte encore le jeton d'un compte désactivé",
      })
      .toBeNull();
  });
});

test.describe("Déconnexion : le jeton de l'API obtenu avant ne sert plus", () => {
  test.use({ storageState: connecte(COMPTES_CE.jwtRevoque.token), erreursConsoleAutorisees: /status of 40\d/ });
  test("Le jeton porte l'id de sa session ; une fois la session fermée, l'API le refuse", async ({ page }) => {
    const compte = COMPTES_CE.jwtRevoque;
    await surLeSite(page);
    const jeton = await page.evaluate(() => fetch("/api/auth/token", { credentials: "include" }).then((r) => r.json()).then((d) => d.token));
    expect(jeton, "Aucun jeton de l'API pour la session").toBeTruthy();
    const charge = JSON.parse(Buffer.from(jeton.split(".")[1], "base64url").toString("utf8"));
    expect(charge.sid, "Le jeton ne dit pas de quelle session il vient").toBe(compte.sessions[0]._id.toHexString());
    expect((await graphql(page, "query { me { id } }", { jeton })).data?.me?.id).toBe(compte.utilisateur._id.toHexString());

    const sortie = await appelAuth(page, "/sign-out", { corps: {} });
    expect(sortie.statut).toBe(200);
    expect(await sessionsDe(compte), "La session n'a pas été fermée").toHaveLength(0);
    // L'API garde l'état d'une session 15 s au plus
    await expect
      .poll(async () => (await graphql(page, "query { me { id } }", { jeton })).data?.me ?? null, {
        timeout: 30_000,
        intervals: [2_000],
        message: "L'API accepte encore le jeton d'une session fermée",
      })
      .toBeNull();
  });
});

test.describe("Anciennes opérations de compte de l'API : absentes", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 400/ });
  const NOUVEAU = "ancienne-api-inscription@e2e.test";
  const OPERATIONS = [
    ["register", `mutation { register(input: { email: "${NOUVEAU}", password: "Pirate-2026-Mdp!" }) { __typename } }`],
    ["login (compte existant)", `mutation { login(input: { email: "${COMPTES_CE.callback.utilisateur.email}", password: "x" }) { __typename } }`],
    ["login (adresse inconnue)", `mutation { login(input: { email: "inconnu-total@e2e.test", password: "x" }) { __typename } }`],
    ["requestPasswordReset", `mutation { requestPasswordReset(input: { email: "${COMPTES_CE.callback.utilisateur.email}" }) }`],
    ["resetPassword", `mutation { resetPassword(input: { token: "x", newPassword: "Pirate-2026-Mdp!" }) { __typename } }`],
    ["verifyEmail", `mutation { verifyEmail(token: "x") { __typename } }`],
    ["resendVerificationEmail", `mutation { resendVerificationEmail(email: "${COMPTES_CE.callback.utilisateur.email}") }`],
    ["reactivateAccount", `mutation { reactivateAccount(email: "${COMPTES_CE.desactiveVariantes.utilisateur.email}", password: "${MOT_DE_PASSE}") { __typename } }`],
  ];

  test("Sans session : chaque opération est refusée par le schéma, aucun compte créé", async ({ page }) => {
    await surLeSite(page);
    const reponses = {};
    for (const [nom, query] of OPERATIONS) {
      const r = await graphql(page, query);
      reponses[nom] = r.errors.map((e) => e.message).join(" | ");
      expect.soft(r.data, `${nom} : des données renvoyées`).toBeNull();
      expect.soft(reponses[nom], `${nom} : l'opération existe encore`).toMatch(/^Cannot query field/);
    }
    // Même réponse pour un compte existant et une adresse inconnue : rien n'est révélé
    expect(reponses["login (compte existant)"]).toBe(reponses["login (adresse inconnue)"]);
    expect(await (await db()).collection("user").countDocuments({ email: NOUVEAU }), "Un compte a été créé hors de Better Auth").toBe(0);
    expect((await utilisateur(COMPTES_CE.desactiveVariantes)).isActive).toBe(false);
  });

  test("Avec une session : setStripeCustomerId et disableAccount absents, compte inchangé", async ({ page, browser }) => {
    const contexte = await browser.newContext({ storageState: connecte(COMPTES_CE.jetonUnique.token) });
    const p = await contexte.newPage();
    try {
      await surLeSite(p);
      const jeton = await p.evaluate(() => fetch("/api/auth/token", { credentials: "include" }).then((r) => r.json()).then((d) => d.token));
      for (const query of [`mutation { setStripeCustomerId(stripeCustomerId: "cus_pirate") { id } }`, `mutation { disableAccount(password: "x") { __typename } }`]) {
        const r = await graphql(p, query, { jeton });
        expect.soft(r.errors.map((e) => e.message).join(" | ")).toMatch(/^Cannot query field/);
      }
      const u = await utilisateur(COMPTES_CE.jetonUnique);
      expect(u.stripeCustomerId ?? null).toBeNull();
      expect(u.isActive).toBe(true);
    } finally {
      await contexte.close();
    }
  });
});

test.describe("Jeton à usage unique de l'application mobile", () => {
  test.use({ storageState: connecte(COMPTES_CE.jetonUnique.token), erreursConsoleAutorisees: /status of 40\d/ });
  test("Accepté une seule fois ; un jeton inventé est refusé", async ({ page, browser }) => {
    const compte = COMPTES_CE.jetonUnique;
    await surLeSite(page);
    const genere = await appelAuth(page, "/one-time-token/generate", { methode: "GET" });
    expect(genere.statut).toBe(200);
    const jeton = genere.corps.token;
    expect(jeton).toBeTruthy();

    // Vérifié depuis un navigateur sans session (comme l'application)
    const contexte = await browser.newContext({ storageState: SANS_SESSION });
    const p = await contexte.newPage();
    try {
      await surLeSite(p);
      const premier = await appelAuth(p, "/one-time-token/verify", { corps: { token: jeton } });
      expect(premier.statut, "Le jeton n'ouvre pas la session de l'application").toBe(200);
      // Le jeton transmet la session ouverte sur le site, celle du compte
      expect(premier.corps?.session?.userId ?? premier.corps?.user?.id).toBe(compte.utilisateur._id.toHexString());
      const second = await appelAuth(p, "/one-time-token/verify", { corps: { token: jeton } });
      expect(second.statut, "Le même jeton sert deux fois").toBeGreaterThanOrEqual(400);
      const invente = await appelAuth(p, "/one-time-token/verify", { corps: { token: "jeton-invente-e2e" } });
      expect(invente.statut).toBeGreaterThanOrEqual(400);
    } finally {
      await contexte.close();
    }
  });
});

test.describe("Lien de connexion qui porte une invitation", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 40[01]|\/api\/auth\/token/ });
  // Défaut connu : l'invitation est acceptée dès la connexion, sans que
  // l'utilisateur l'ait choisie, et toutes ses sessions changent d'espace.
  test("Se connecter par ce lien n'accepte pas l'invitation à sa place", async ({ page }) => {
    const compte = COMPTES_CE.invitationLien;
    await seConnecter(page, `/auth/login?invitation=${INVITATION_LIEN._id.toHexString()}&email=${encodeURIComponent(compte.utilisateur.email)}`, compte.utilisateur.email);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await page.waitForTimeout(2_000);
    const invitation = await (await db()).collection("invitation").findOne({ _id: INVITATION_LIEN._id });
    expect(invitation.status, "Invitation acceptée sans geste de l'utilisateur").toBe("pending");
  });
});

test.describe("Compte créé par un tiers avec l'adresse d'un autre", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 40\d|\/api\/auth\/token/ });
  // Défaut connu : quelqu'un inscrit l'adresse d'une autre personne avec son
  // propre mot de passe ; quand la vraie titulaire valide son adresse par le
  // lien reçu, le mot de passe du tiers ouvre toujours le compte.
  test("Après la vérification de l'adresse, le mot de passe posé par le tiers n'ouvre plus le compte", async ({ page, browser }) => {
    const email = "victime-precree@e2e.test";
    const motDePasseTiers = "Tiers-Pose-2026!";
    await surLeSite(page);
    const inscription = await appelAuth(page, "/sign-up/email", { corps: { email, password: motDePasseTiers, name: "Vraie Titulaire" } });
    expect(inscription.statut).toBe(200);

    await etape(page, "La titulaire ouvre le lien de vérification dans son navigateur", async () => {
      const contexte = await browser.newContext({ storageState: SANS_SESSION });
      const p = await contexte.newPage();
      await p.goto(`/api/auth/verify-email?token=${await signJWT({ email }, SECRET, 3600)}`);
      await expect.poll(async () => (await (await db()).collection("user").findOne({ email }))?.emailVerified).toBe(true);
      await contexte.close();
    });

    const contexteTiers = await browser.newContext({ storageState: SANS_SESSION });
    const tiers = await contexteTiers.newPage();
    try {
      await surLeSite(tiers);
      const r = await connexionApi(tiers, email, motDePasseTiers);
      expect(r.statut, "Le mot de passe posé avant la preuve de l'adresse ouvre toujours le compte").toBeGreaterThanOrEqual(400);
    } finally {
      await contexteTiers.close();
    }
  });
});

test.describe("Désactiver un compte : seulement le sien", () => {
  test.use({ storageState: connecte(COMPTES_CE.jetonUnique.token), erreursConsoleAutorisees: /status of 40\d/ });
  test("Adresse d'un autre compte ou objet à la place de l'adresse : refusé, les deux comptes restent actifs", async ({ page }) => {
    await surLeSite(page);
    for (const email of [COMPTES_CE.callback.utilisateur.email, { $ne: null }, ["x"]]) {
      const r = await appelSite(page, "/api/account/deactivate", { methode: "POST", corps: { email } });
      expect.soft(r.statut, `Désactivation avec ${JSON.stringify(email)} : ${r.statut}`).toBeGreaterThanOrEqual(400);
      expect.soft(r.statut).toBeLessThan(500);
    }
    expect((await utilisateur(COMPTES_CE.callback)).isActive).toBe(true);
    expect((await utilisateur(COMPTES_CE.jetonUnique)).isActive).toBe(true);
  });
});

test.describe("Programme partenaire : code transmis à l'inscription", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 40\d|\/api\/auth\/token/ });
  // Défaut connu : le code ?partner= est envoyé par la page d'inscription
  // (referredBy) mais Better Auth l'ignore (champ non saisissable) : aucun
  // filleul n'est jamais rattaché à un partenaire.
  test("Inscription avec un code partenaire : le compte garde le code", async ({ page }) => {
    const email = "filleul-partenaire@e2e.test";
    await surLeSite(page);
    const r = await appelAuth(page, "/sign-up/email", { corps: { email, password: "Filleul-Partenaire-2026!", name: "Félicie Filleule", referredBy: "E2EPARTENAIRE" } });
    expect(r.statut, `Inscription : ${r.statut} ${JSON.stringify(r.corps)?.slice(0, 200)}`).toBe(200);
    const u = await (await db()).collection("user").findOne({ email });
    expect(u?.referredBy ?? null, "Le code partenaire est perdu à l'inscription").toBe("E2EPARTENAIRE");
  });
});
