/**
 * Relevé des pages d'authentification (E2E_INVENTAIRE=1 seulement), sans
 * session ou avec le compte propre à chaque page.
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { relever, releverEtat } from "../releve.mjs";
import { connecte } from "../config.mjs";
import { COMPTES_AUTH, MOT_DE_PASSE } from "../donnees/lot-parametres-auth.mjs";
import { connexionApi } from "./outils-auth.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const corps = (p) => p.locator("body");

test.describe("Relevé de l'authentification (sans connexion)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  relever(
    {
      "auth-connexion": "/auth/login",
      "auth-inscription": "/auth/signup",
      "auth-mot-de-passe-oublie": "/auth/forget-password",
      "auth-reinitialisation": "/auth/reset-password?token=e2eJetonInconnu",
      "auth-reinitialisation-sans-jeton": "/auth/reset-password",
      "auth-verification-email-erreur": "/auth/verify-email?error=invalid-token",
      "auth-verification-email": "/auth/verify-email",
      "auth-verifier": "/auth/verify?email=nouveau%40e2e.test",
      "auth-session-expiree": "/auth/session-expired?reason=inactivity",
      "auth-session-revoquee": "/auth/session-expired?reason=revoked",
      "auth-reactivation": `/reactivate-account?email=${encodeURIComponent(COMPTES_AUTH.reactivation.utilisateur.email)}&token=e2eJetonInvalide`,
      "auth-supprimer-compte": "/supprimer-compte",
    },
    { zone: corps },
  );
});

test.describe("Relevé de la double authentification", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  releverEtat(
    "auth-verification-2fa",
    async (p) => {
      await p.goto("/auth/login");
      await connexionApi(p, COMPTES_AUTH.deuxFacteurs.utilisateur.email, MOT_DE_PASSE);
      await ouvrir(p, "/auth/verify-2fa");
    },
    { zone: corps },
  );
});

test.describe("Relevé de la gestion des appareils", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.gestionAppareils.token) });
  relever({ "auth-gestion-appareils": "/auth/manage-devices" }, { zone: corps });
});

test.describe("Relevé de l'inscription commencée (étape entreprise)", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.inscriptionFormes.token) });
  relever({ "auth-inscription-entreprise": "/auth/signup" }, { zone: corps });
});
