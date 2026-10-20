/**
 * Authentification : tous les boutons et liens des pages publiques
 * (connexion, inscription, mot de passe oublié, nouveau mot de passe,
 * session expirée, suppression du compte) et de la page du code de double
 * authentification. Visiteur qui a déjà répondu à la bannière des cookies.
 * Les actions qui partent vers un service extérieur (Google, Apple) ou qui
 * envoient un formulaire renvoient à leur parcours.
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { verifierBoutons } from "../exploration.mjs";
import { COMPTES_AUTH, MOT_DE_PASSE } from "../donnees/lot-parametres-auth.mjs";
import { connexionApi, ouvrirInscription, SANS_SESSION } from "./outils-auth.mjs";

const corps = (page) => page.locator("body");
const page_ = (url, pret) => async (page) => ouvrir(page, url, { pret: pret(page) });

test.describe("Pages publiques de l'authentification", () => {
  // La page d'inscription précharge le lien cassé « /politique-confidentialite » (404) :
  // défaut dédié dans parcours.spec.mjs, toléré ici.
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /politique-confidentialite/ });

  verifierBoutons({
    test,
    titre: "Connexion",
    ouvrir: page_("/auth/login", (p) => p.getByRole("button", { name: "Continuer avec l'email" })),
    zone: corps,
    boutons: {
      "button Continuer avec Google": { parcours: "non testable : Google injoignable dans les tests" },
      "button Continuer avec Apple": { parcours: "parcours.spec.mjs : « Continuer avec Apple »" },
      "button Continuer avec l'email": { parcours: "parcours.spec.mjs : connexion par e-mail" },
      "link /mentions-legales": { navigation: "/mentions-legales" },
      "link /politique-de-confidentialite": { navigation: "/politique-de-confidentialite" },
      "link /auth/signup": { navigation: "/auth/signup" },
      "link /": { navigation: "/" },
    },
  });

  verifierBoutons({
    test,
    titre: "Connexion (formulaire e-mail)",
    ouvrir: async (page) => {
      await ouvrir(page, "/auth/login", { pret: page.getByRole("button", { name: "Continuer avec l'email" }) });
      await page.getByRole("button", { name: "Continuer avec l'email" }).click();
      await page.getByPlaceholder("Saisissez votre email").waitFor();
    },
    zone: corps,
    boutons: {
      "button Afficher le mot de passe": { sansEffet: "montre le mot de passe en clair dans le champ" },
      "button Se connecter": { parcours: "parcours.spec.mjs : connexion par e-mail" },
      "button Retour à la connexion": { parcours: "retour au choix du mode de connexion" },
      "link /auth/forget-password": { navigation: "/auth/forget-password" },
    },
  });

  verifierBoutons({
    test,
    titre: "Inscription",
    ouvrir: (p) => ouvrirInscription(p, p.getByRole("button", { name: "Continuer avec l'email" })),
    zone: corps,
    boutons: {
      "button Continuer avec Google": { parcours: "non testable : Google injoignable dans les tests" },
      "button Continuer avec Apple": { parcours: "non testable : Apple injoignable dans les tests" },
      "button Continuer avec l'email": { parcours: "inscription.spec.mjs : formulaire d'inscription" },
      "link /mentions-legales": { navigation: "/mentions-legales" },
      // Lien cassé (le dossier est politique-de-confidentialite) : parcours.spec.mjs.
      "link /politique-confidentialite": { parcours: "parcours.spec.mjs : chaque lien de la page d'inscription mène à une page qui existe" },
      "link /auth/login": { navigation: "/auth/login" },
    },
  });

  verifierBoutons({
    test,
    titre: "Mot de passe oublié",
    ouvrir: page_("/auth/forget-password", (p) => p.getByRole("button", { name: "Envoyer le lien" })),
    zone: corps,
    boutons: {
      "button Envoyer le lien": { parcours: "parcours.spec.mjs : mot de passe oublié" },
      "link /auth/login": { navigation: "/auth/login" },
    },
  });

  verifierBoutons({
    test,
    titre: "Nouveau mot de passe",
    ouvrir: page_("/auth/reset-password?token=e2eJetonInconnu", (p) => p.getByPlaceholder("Nouveau mot de passe").first()),
    zone: corps,
    boutons: {
      "button Afficher le mot de passe": { sansEffet: "montre le mot de passe en clair dans le champ" },
      "button Réinitialiser le mot de passe": { parcours: "parcours.spec.mjs : mot de passe oublié" },
      "link /auth/login": { navigation: "/auth/login" },
    },
  });

  verifierBoutons({
    test,
    titre: "Session expirée",
    ouvrir: async (page) => {
      await page.goto("/auth/session-expired?reason=inactivity");
      await page.getByRole("heading", { level: 1 }).waitFor();
    },
    zone: corps,
    boutons: {
      "button Se reconnecter": { navigation: /\/auth\/login/ },
      "link /contact": { navigation: "/contact" },
    },
  });

});

test.describe("Page du code de double authentification", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 40[01]/ });
  verifierBoutons({
    test,
    titre: "Code de double authentification",
    ouvrir: async (page) => {
      await page.goto("/auth/login");
      await connexionApi(page, COMPTES_AUTH.deuxFacteurs.utilisateur.email, MOT_DE_PASSE);
      await page.goto("/auth/verify-2fa");
      await page.locator("input[data-input-otp]").waitFor();
    },
    zone: corps,
    boutons: {
      "button Vérifier": { desactive: "aucun code saisi" },
      // Page qui ne devient jamais « calme » : cochée dans parcours.spec.mjs (code de l'application).
      "checkbox Faire confiance à cet appareil pendant 60 jours": { parcours: "parcours.spec.mjs : code de l'application" },
      "button Recevoir un code par email": { parcours: "non testable : l'e-mail du code part par Resend, injoignable dans les tests" },
      "button Utiliser un code de secours": { parcours: "parcours.spec.mjs : code de secours" },
    },
  });
});
