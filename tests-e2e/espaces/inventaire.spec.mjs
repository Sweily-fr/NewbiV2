/**
 * Relevé des pages d'espaces (E2E_INVENTAIRE=1 seulement) : création d'un
 * espace, invitation, bienvenue après inscription.
 */
import { test } from "../outils.mjs";
import { relever } from "../releve.mjs";
import { connecte, SESSION_TOKEN_EQUIPE } from "../config.mjs";
import { oid } from "../donnees/base.mjs";
import { COMPTES_AUTH, INVITATIONS } from "../donnees/lot-parametres-auth.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const corps = (p) => p.locator("body");
const invitation = (cle) => oid("invitationAuth", INVITATIONS[cle].n).toHexString();

test.describe("Relevé des espaces (sans connexion)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  relever(
    {
      "espaces-invitation-sans-session": `/accept-invitation/${invitation("nouvelInscrit")}`,
      "espaces-invitation-expiree": `/accept-invitation/${invitation("expiree")}`,
      "espaces-invitation-annulee": `/accept-invitation/${invitation("annulee")}`,
      "espaces-invitation-inconnue": `/accept-invitation/${"e2e1e".padEnd(24, "f")}`,
    },
    { zone: corps },
  );
});

test.describe("Relevé des espaces (invité connecté)", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.invite.token) });
  relever({ "espaces-invitation-connecte": `/accept-invitation/${invitation("acceptee")}` }, { zone: corps });
});

test.describe("Relevé des espaces (autre compte connecté)", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.inviteAutre.token) });
  relever({ "espaces-invitation-autre-compte": `/accept-invitation/${invitation("autreDestinataire")}` }, { zone: corps });
});

test.describe("Relevé des espaces (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_EQUIPE) });
  relever(
    {
      "espaces-creer": "/create-workspace",
      "espaces-creer-succes": "/create-workspace/success",
      "espaces-creer-erreur-paiement": "/create-workspace/payment-error",
      "espaces-bienvenue": "/onboarding/success",
    },
    { zone: corps },
  );
});
