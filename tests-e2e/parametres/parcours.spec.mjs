/**
 * Paramètres : les parcours, chaque action vérifiée en base. Les effets
 * internes à la fenêtre (onglets, thème, catégories des applications) que
 * boutons.spec.mjs renvoie ici, puis les enregistrements : page de démarrage,
 * tutoriel, notifications, réglages de session, nom, mot de passe, e-mail,
 * téléphone, désactivation du compte. Chaque action qui modifie a son compte
 * (donnees/lot-parametres-auth.mjs).
 */
import { test, expect, etape, SELECTEUR_NOTIFICATION_SUCCES, notificationsErreur } from "../outils.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { connecte, SESSION_TOKEN_CONFIGURATION, SESSION_TOKEN_PARAMETRES } from "../config.mjs";
import { COMPTES_AUTH, HACHAGE_MOT_DE_PASSE, MOT_DE_PASSE } from "../donnees/lot-parametres-auth.mjs";
import { attendreQuota, connexionApi, contenuParametres, fenetreParametres, menuParametres, ouvrirParametres } from "../authentification/outils-auth.mjs";

const succes = (page, texte) => page.locator(SELECTEUR_NOTIFICATION_SUCCES).filter({ hasText: texte });
const utilisateur = async (compte) => (await base()).collection("user").findOne({ _id: compte.utilisateur._id });
const organisation = async (compte) => (await base()).collection("organization").findOne({ _id: compte.organisation._id });
const sessionsReglees = async (orgId) =>
  (await base()).collection("organization").updateOne({ _id: orgId }, { $set: { "sessionSettings.maxSessions": 3 } });

test.describe("Paramètres : la fenêtre et ses onglets", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PARAMETRES) });
  test.beforeEach(async () => sessionsReglees(COMPTES.parametres.organisation._id));

  test("Chaque onglet du menu ouvre sa page", async ({ page }) => {
    await ouvrirParametres(page, "notifications");
    const menu = menuParametres(page);
    const contenu = contenuParametres(page);
    for (const [bouton, titre] of [
      ["Préférences", "Préférences"],
      ["Générale", "Générale"],
      ["Coordonnées bancaires", "Coordonnées bancaires"],
      ["Informations légales", "Informations légales"],
      ["Sécurité", "Sécurité"],
      ["Espaces", "Gestion des espaces"],
      ["Rôles", "Rôles"],
      ["Applications", /Applications/],
      ["Comptes bancaires", "Comptes bancaires"],
      ["Facturation électronique", "Facturation électronique"],
      ["Abonnement", "Abonnement"],
      ["Facturation", "Facturation"],
      ["Notifications", "Notifications"],
      [`N ${COMPTES.parametres.utilisateur.name}`, "Mon compte"],
    ]) {
      await etape(page, `Onglet « ${bouton} »`, async () => {
        await menu.getByRole("button", { name: bouton, exact: true }).click();
        await expect(contenu.getByRole("heading", { level: 2, name: titre }).first()).toBeVisible();
      });
    }
  });

  test("« Annuler » ferme la fenêtre", async ({ page }) => {
    await ouvrirParametres(page, "generale");
    await contenuParametres(page).getByRole("button", { name: "Annuler", exact: true }).click();
    await expect(fenetreParametres(page)).toBeHidden();
  });

  test("Changer d'onglet sans sauvegarder : confirmation demandée, rien n'est enregistré", async ({ page }) => {
    const avant = await organisation(COMPTES.parametres);
    await ouvrirParametres(page, "generale", { pret: (z) => z.getByRole("textbox", { name: "Nom commercial", exact: true }) });
    await contenuParametres(page).getByRole("textbox", { name: "Nom commercial", exact: true }).fill("Enseigne jamais enregistrée");
    await menuParametres(page).getByRole("button", { name: "Coordonnées bancaires", exact: true }).click();
    const alerte = page.getByRole("alertdialog", { name: "Modifications non sauvegardées" });
    await etape(page, "Confirmation demandée", () => expect(alerte).toBeVisible(), { capture: "ecran" });
    await alerte.getByRole("button", { name: "Changer d'onglet sans sauvegarder" }).click();
    await expect(contenuParametres(page).getByRole("heading", { level: 2, name: "Coordonnées bancaires" })).toBeVisible();
    expect((await organisation(COMPTES.parametres)).commercialName ?? "").toBe(avant.commercialName ?? "");
  });

  test("Aides des coordonnées bancaires : l'info-bulle explique le format", async ({ page }) => {
    await ouvrirParametres(page, "coordonnees-bancaires");
    await contenuParametres(page).getByRole("button", { name: "Aide IBAN" }).hover();
    await expect(page.getByRole("tooltip").filter({ hasText: /Format international/ })).toBeVisible();
    await contenuParametres(page).getByRole("button", { name: "Aide BIC/SWIFT" }).hover();
    await expect(page.getByRole("tooltip").last()).toBeVisible();
  });

  test("Catégories des applications : chaque catégorie filtre la liste", async ({ page }) => {
    await ouvrirParametres(page, "applications");
    const contenu = contenuParametres(page);
    for (const [categorie, presente, absente] of [
      ["Paiement", "Stripe", "Pennylane"],
      ["Banque", "Qonto", "Stripe"],
      ["Comptabilité", "Pennylane", "Qonto"],
      ["Automatisations", "Zapier", "Pennylane"],
      ["CRM", "HubSpot", "Zapier"],
      ["Intelligence artificielle", "OpenAI", "HubSpot"],
      ["E-mailing", "Mailchimp", "OpenAI"],
      ["Productivité", "Notion", "Mailchimp"],
      ["Toutes", "Stripe", null],
    ]) {
      await etape(page, `Catégorie « ${categorie} »`, async () => {
        await contenu.getByRole("button", { name: categorie, exact: true }).click();
        await expect(contenu.getByText(presente, { exact: true }).first()).toBeVisible();
        if (absente) await expect(contenu.getByText(absente, { exact: true })).toHaveCount(0);
      });
    }
  });

  test("Liens de la facturation électronique vers les autres onglets", async ({ page }) => {
    await ouvrirParametres(page, "facturation-electronique");
    await contenuParametres(page).getByRole("button", { name: "informations légales", exact: true }).click();
    await expect(contenuParametres(page).getByRole("heading", { level: 2, name: "Informations légales" })).toBeVisible();
    await menuParametres(page).getByRole("button", { name: "Facturation électronique", exact: true }).click();
    await contenuParametres(page).getByRole("button", { name: "situation de TVA", exact: true }).click();
    await expect(contenuParametres(page).getByRole("heading", { level: 2, name: "Informations légales" })).toBeVisible();
  });

  test("Bascule mensuel / annuel : les prix annuels s'affichent", async ({ page }) => {
    await ouvrirParametres(page, "subscription");
    const contenu = contenuParametres(page);
    await contenu.getByRole("button", { name: "Annuel -10%" }).click();
    await expect(contenu.getByText(/facturé .*€\/an/).first()).toBeVisible();
    await contenu.getByRole("button", { name: "Mensuel", exact: true }).click();
    await expect(contenu.getByText(/facturé .*€\/an/)).toHaveCount(0);
  });

  test("« Changer de plan » et « Gérer mon abonnement » ouvrent l'onglet Abonnement", async ({ page }) => {
    await ouvrirParametres(page, "facturation");
    await contenuParametres(page).getByRole("button", { name: "Changer de plan" }).click();
    await expect(contenuParametres(page).getByRole("heading", { level: 2, name: "Abonnement" })).toBeVisible();
    await ouvrirParametres(page, "user-info");
    await contenuParametres(page).getByRole("button", { name: "Gérer mon abonnement" }).click();
    await expect(contenuParametres(page).getByRole("heading", { level: 2, name: "Abonnement" })).toBeVisible();
  });

  test("Thème et mode daltonien : appliqués à toute l'application", async ({ page }) => {
    await ouvrirParametres(page, "preferences");
    const contenu = contenuParametres(page);
    await contenu.getByText("Sombre", { exact: true }).first().click();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    await contenu.getByText("Claire", { exact: true }).first().click();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);
    await contenu.getByText("Daltonien", { exact: true }).first().click();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("colorblind-mode"))).toBe(true);
    await contenu.getByText("Standard", { exact: true }).first().click();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("colorblind-mode"))).toBe(false);
  });
});

test.describe("Paramètres : préférences et notifications enregistrées", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_CONFIGURATION) });

  test("Page de démarrage : « Factures » est enregistrée", async ({ page }) => {
    await ouvrirParametres(page, "preferences");
    await contenuParametres(page).getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Factures", exact: true }).click();
    await expect.poll(async () => (await utilisateur(COMPTES.configuration)).redirect_after_login, { message: "Page de démarrage non enregistrée" }).toBe("factures");
  });

  test("Préférences de notifications : un interrupteur coupé est enregistré", async ({ page }) => {
    await ouvrirParametres(page, "notifications");
    await contenuParametres(page).getByRole("tab", { name: "Préférences" }).click();
    const premier = contenuParametres(page).getByRole("switch").first();
    await expect(premier).toBeVisible();
    const avant = (await premier.getAttribute("aria-checked")) === "true";
    await premier.click();
    await expect
      .poll(async () => (await utilisateur(COMPTES.configuration)).notificationPreferences?.invoice_overdue?.email, { message: "Préférence non enregistrée" })
      .toBe(!avant);
  });
});

test.describe("Paramètres : relancer le tutoriel", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.tutoriel.token) });
  // Relance purement locale : rien n'est écrit en base, le tutoriel s'ouvre.
  test("Le tutoriel s'ouvre, sans toucher au compte", async ({ page }) => {
    await ouvrirParametres(page, "preferences");
    await contenuParametres(page).getByRole("button", { name: "Relancer le tutoriel" }).click();
    await expect(page.getByRole("dialog").filter({ hasText: "Bienvenue sur Newbi" })).toBeVisible();
    expect((await utilisateur(COMPTES_AUTH.tutoriel)).hasCompletedTutorial).toBe(true);
  });
});

test.describe("Paramètres : réglages de session de l'espace", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.reglagesSession.token) });

  test("Durée de session et délai d'inactivité : enregistrés", async ({ page }) => {
    await ouvrirParametres(page, "securite");
    const listes = contenuParametres(page).getByRole("combobox");
    await listes.nth(0).click();
    await page.getByRole("option", { name: "90 jours" }).click();
    await expect(succes(page, "Paramètres de session mis à jour").first()).toBeVisible();
    await listes.nth(1).click();
    await page.getByRole("option", { name: "1 heure" }).click();
    await expect.poll(async () => (await organisation(COMPTES_AUTH.reglagesSession)).sessionSettings).toMatchObject({ sessionDuration: 90, inactivityTimeout: 1 });
  });
});

test.describe("Paramètres : réglage de sessions hérité", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.securiteHeritee.token), erreursConsoleAutorisees: /session-settings|paramètres de session/ });

  // L'ancienne option « Illimité » (0) n'est plus proposée : la liste ne trouve
  // pas la valeur et enregistre une valeur vide dès l'ouverture de l'onglet.
  test("Onglet Sécurité d'un espace au réglage « illimité » : aucune erreur à l'ouverture", async ({ page }) => {
    await ouvrirParametres(page, "securite");
    await page.waitForTimeout(2_000);
    await etape(
      page,
      "Aucune erreur affichée",
      async () => {
        const erreurs = await notificationsErreur(page).allInnerTexts();
        expect(erreurs.map((t) => t.replace(/\s+/g, " ").trim()), "L'onglet affiche une erreur dès son ouverture, sans action de l'utilisateur").toEqual([]);
      },
      { capture: "ecran" },
    );
  });
});

test.describe("Paramètres > Compte : nom, mot de passe, e-mail, téléphone", () => {
  test.describe(() => {
    test.use({ storageState: connecte(COMPTES_AUTH.nomComplet.token) });
    test("Nom complet : enregistré en quittant le champ", async ({ page }) => {
      await ouvrirParametres(page, "user-info");
      const champ = contenuParametres(page).getByRole("textbox", { name: "Nom complet" });
      await champ.fill("Nora Nom-Lecœur");
      await champ.blur();
      await expect(succes(page, "Nom complet mis à jour").first()).toBeVisible();
      expect((await utilisateur(COMPTES_AUTH.nomComplet)).name).toBe("Nora Nom-Lecœur");
    });

    // La fenêtre annonce un e-mail envoyé, mais rien n'est fait (« TODO », attente simulée).
    test("Changer d'adresse e-mail : la demande est réellement prise en compte", async ({ page }) => {
      await ouvrirParametres(page, "user-info");
      await contenuParametres(page).getByRole("button", { name: "Changer d'adresse e-mail" }).click();
      const fenetre = page.getByRole("dialog").filter({ hasText: "Nouvelle adresse e-mail" });
      await fenetre.locator("#new-email").fill("nouvelle-adresse@e2e.test");
      await fenetre.locator("#confirm-email").fill("nouvelle-adresse@e2e.test");
      await fenetre.getByRole("button", { name: "Confirmer" }).click();
      await page.waitForTimeout(2_000);
      const db = await base();
      const u = await utilisateur(COMPTES_AUTH.nomComplet);
      const demande = await db.collection("verification").findOne({ value: { $regex: "nouvelle-adresse@e2e.test" } });
      expect(
        u.email === "nouvelle-adresse@e2e.test" || Boolean(demande),
        "« Un email de confirmation a été envoyé » est affiché, mais l'adresse n'a pas changé et aucune demande n'existe : le changement est simulé",
      ).toBe(true);
    });

    test("Modifier le numéro de téléphone : enregistré", async ({ page }) => {
      test.info().annotations.push({ type: "cause", description: "Better Auth (plugin phoneNumber) refuse phoneNumber dans update-user" });
      await ouvrirParametres(page, "user-info");
      await contenuParametres(page).getByRole("button", { name: "Modifier votre numéro" }).click();
      const fenetre = page.getByRole("dialog").filter({ hasText: "Nouveau numéro de téléphone" });
      await fenetre.locator("#new-phone").fill("+33 6 12 34 56 78");
      await fenetre.getByRole("button", { name: "Modifier", exact: true }).click();
      await expect.poll(async () => (await utilisateur(COMPTES_AUTH.nomComplet)).phoneNumber, { message: "Le numéro n'est pas enregistré" }).toBe("+33 6 12 34 56 78");
    });
  });

  test.describe(() => {
    test.use({ storageState: connecte(COMPTES_AUTH.changementMotDePasse.token), erreursConsoleAutorisees: /change-password/ });
    // Chaque test repart du mot de passe connu.
    test.beforeEach(async () => {
      await (await base())
        .collection("account")
        .updateOne({ userId: COMPTES_AUTH.changementMotDePasse.utilisateur._id, providerId: "credential" }, { $set: { password: HACHAGE_MOT_DE_PASSE } });
    });
    const fenetreMdp = async (page) => {
      await ouvrirParametres(page, "user-info");
      await contenuParametres(page).getByRole("button", { name: "Modifier le mot de passe" }).click();
      return page.getByRole("dialog").filter({ has: page.locator("#current-password") });
    };
    const remplirMdp = async (fenetre, actuel, nouveau, confirmation = nouveau) => {
      await fenetre.locator("#current-password").fill(actuel);
      await fenetre.locator("#new-password").fill(nouveau);
      await fenetre.locator("#confirm-password").fill(confirmation);
      // Better Auth : 3 changements de mot de passe par 10 s depuis une même adresse.
      await attendreQuota("/change-password");
      await fenetre.getByRole("button", { name: "Modifier", exact: true }).click();
    };
    const motDePasseEnBase = async () =>
      (await (await base()).collection("account").findOne({ userId: COMPTES_AUTH.changementMotDePasse.utilisateur._id, providerId: "credential" })).password;

    test("Nouveau mot de passe : enregistré, il ouvre la session", async ({ page }) => {
      const fenetre = await fenetreMdp(page);
      await remplirMdp(fenetre, MOT_DE_PASSE, "Nouveau-Secret-2026!");
      await expect(succes(page, "Mot de passe modifié avec succès").first()).toBeVisible();
      expect(await motDePasseEnBase(), "Le mot de passe n'a pas changé en base").not.toBe(HACHAGE_MOT_DE_PASSE);
      const r = await connexionApi(page, COMPTES_AUTH.changementMotDePasse.utilisateur.email, "Nouveau-Secret-2026!");
      expect(r.statut, "Le nouveau mot de passe n'ouvre pas la session").toBe(200);
    });

    for (const [cas, actuel, nouveau, confirmation] of [
      ["mot de passe actuel faux", "Mauvais-Mot-2026!", "Nouveau-Secret-2026!", "Nouveau-Secret-2026!"],
      ["confirmation différente", MOT_DE_PASSE, "Nouveau-Secret-2026!", "Autre-Secret-2026!"],
      ["de 7 caractères", MOT_DE_PASSE, "Court1!", "Court1!"],
    ]) {
      test(`Changer le mot de passe, ${cas} : refusé avec un message`, async ({ page }) => {
        const fenetre = await fenetreMdp(page);
        await remplirMdp(fenetre, actuel, nouveau, confirmation);
        await expect(notificationsErreur(page).first(), "Aucun message n'explique le refus").toBeVisible();
        expect(await motDePasseEnBase(), "Le mot de passe a changé malgré le refus").toBe(HACHAGE_MOT_DE_PASSE);
        await expect(fenetre).toBeVisible();
      });
    }
  });

  test.describe(() => {
    test.use({ storageState: connecte(COMPTES_AUTH.changementSessions.token) });
    // Changer son mot de passe parce qu'on le croit connu d'un autre ne sert à
    // rien si ses sessions ouvertes restent actives.
    test("Après un changement de mot de passe, les autres sessions sont fermées", async ({ page }) => {
      await ouvrirParametres(page, "user-info");
      await contenuParametres(page).getByRole("button", { name: "Modifier le mot de passe" }).click();
      const fenetre = page.getByRole("dialog").filter({ has: page.locator("#current-password") });
      await fenetre.locator("#current-password").fill(MOT_DE_PASSE);
      await fenetre.locator("#new-password").fill("Changement-Sessions-2026!");
      await fenetre.locator("#confirm-password").fill("Changement-Sessions-2026!");
      await attendreQuota("/change-password");
      await fenetre.getByRole("button", { name: "Modifier", exact: true }).click();
      await expect(succes(page, "Mot de passe modifié avec succès").first()).toBeVisible();
      const autre = await (await base()).collection("session").findOne({ token: COMPTES_AUTH.changementSessions.sessions[1].token });
      expect(autre, "La session ouverte sur l'autre appareil (iPhone) reste active après le changement de mot de passe").toBeNull();
    });
  });

  test.describe(() => {
    // Une fois le compte désactivé, ses requêtes en cours sont refusées (401) avant le retour à la
    // connexion ; l'espace, sans abonnement, est en lecture seule (402 des comptes bancaires,
    // défaut dédié dans lecture-seule.spec.mjs).
    test.use({ storageState: connecte(COMPTES_AUTH.desactivation.token), erreursConsoleAutorisees: /401|status of 402/ });
    test("Désactiver son compte : compte désactivé, sessions fermées, retour à la connexion sans erreur serveur", async ({ page }) => {
      await ouvrirParametres(page, "user-info");
      await contenuParametres(page).getByRole("button", { name: "Désactiver", exact: true }).click();
      const fenetre = page.getByRole("dialog").filter({ hasText: "Tapez votre adresse e-mail pour confirmer." });
      await expect(fenetre.getByRole("button", { name: "Désactiver le compte" })).toBeDisabled();
      await fenetre.getByPlaceholder(COMPTES_AUTH.desactivation.utilisateur.email).fill(COMPTES_AUTH.desactivation.utilisateur.email);
      await fenetre.getByRole("button", { name: "Désactiver le compte" }).click();
      await expect.poll(async () => (await utilisateur(COMPTES_AUTH.desactivation)).isActive).toBe(false);
      expect(await (await base()).collection("session").countDocuments({ userId: COMPTES_AUTH.desactivation.utilisateur._id })).toBe(0);
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
    });
  });
});

