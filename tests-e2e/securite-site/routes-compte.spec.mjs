/**
 * Routes du site qui modifient le compte ou l'espace sans passer par l'API
 * GraphQL : réglages de session de l'espace (/api/session-settings) et
 * numéro de téléphone du profil (/api/account/phone). Appelées directement
 * avec la session du navigateur.
 */
import { test, expect } from "../outils.mjs";
import { base } from "../base.mjs";
import {
  connecte,
  SESSION_TOKEN_MEMBRE_PARAMETRES,
  SESSION_TOKEN_PARAMETRES,
  SESSION_TOKEN_RECRUTEUR_PARAMETRES,
} from "../config.mjs";
import { COMPTES, MEMBRES } from "../donnees/base.mjs";

const ORG = COMPTES.parametres.organisation._id;
const reglages = async () => JSON.stringify((await (await base()).collection("organization").findOne({ _id: ORG }))?.sessionSettings ?? null);

const put = (request, data) => request.put("/api/session-settings", { data });

for (const [qui, jeton] of [
  ["Membre (lecture seule)", SESSION_TOKEN_MEMBRE_PARAMETRES],
  ["rôle personnalisé sans « Modifier » l'entreprise", SESSION_TOKEN_RECRUTEUR_PARAMETRES],
]) {
  test.describe(`Réglages de session : ${qui}`, () => {
    test.use({ storageState: connecte(jeton) });

    for (const corps of [{ maxSessions: 1 }, { sessionDuration: 7 }, { inactivityTimeout: 0.25 }]) {
      test(`${Object.keys(corps)[0]} : 403, réglages inchangés`, async ({ request }) => {
        const avant = await reglages();
        const reponse = await put(request, corps);
        expect(reponse.status()).toBe(403);
        expect(await reglages()).toBe(avant);
      });
    }
  });
}

test.describe("Réglages de session : valeurs hors liste", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PARAMETRES) });

  for (const [cas, corps] of [
    ["durée de 365 jours", { sessionDuration: 365 }],
    ["sessions illimitées (0)", { maxSessions: 0 }],
    ["texte après un nombre", { inactivityTimeout: "1; x" }],
    ["objet", { maxSessions: { $gt: 0 } }],
  ]) {
    test(`${cas} : 400, réglages inchangés`, async ({ request }) => {
      const avant = await reglages();
      const reponse = await put(request, corps);
      expect(reponse.status()).toBe(400);
      expect(await reglages()).toBe(avant);
    });
  }
});

test.describe("Réglages de session et téléphone : sans session", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("401 pour la lecture, la modification et le téléphone", async ({ request }) => {
    const avant = await reglages();
    expect((await request.get("/api/session-settings")).status()).toBe(401);
    expect((await put(request, { maxSessions: 1 })).status()).toBe(401);
    expect((await request.patch("/api/account/phone", { data: { phoneNumber: "06 12 34 56 78" } })).status()).toBe(401);
    expect(await reglages()).toBe(avant);
  });
});

test.describe("Téléphone du profil", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_RECRUTEUR_PARAMETRES) });
  const MOI = MEMBRES.recruteurParametres.utilisateur;
  const AUTRE = COMPTES.parametres.utilisateur;
  const utilisateur = async (u) => (await base()).collection("user").findOne({ _id: u._id });

  for (const [cas, valeur] of [
    ["balise HTML", "<img src=x onerror=1>"],
    ["40 chiffres", "1".repeat(40)],
    ["lettres", "06 AB CD EF GH"],
  ]) {
    test(`${cas} : refusé avec un message, profil inchangé`, async ({ request }) => {
      const avant = (await utilisateur(MOI))?.phoneNumber ?? null;
      const reponse = await request.patch("/api/account/phone", { data: { phoneNumber: valeur } });
      expect(reponse.status()).toBe(400);
      expect((await reponse.json()).error).toMatch(/téléphone invalide/i);
      expect((await utilisateur(MOI))?.phoneNumber ?? null).toBe(avant);
    });
  }

  test("Numéro valide : enregistré sur son seul compte, non vérifié", async ({ request }) => {
    const avant = await utilisateur(MOI);
    const autreAvant = JSON.stringify(await utilisateur(AUTRE));
    try {
      const reponse = await request.patch("/api/account/phone", {
        data: { phoneNumber: "+33 6 12 34 56 78", userId: AUTRE._id.toHexString(), phoneNumberVerified: true },
      });
      expect(reponse.status()).toBe(200);
      const apres = await utilisateur(MOI);
      expect(apres.phoneNumber).toBe("+33 6 12 34 56 78");
      expect(apres.phoneNumberVerified).toBe(false);
      expect(JSON.stringify(await utilisateur(AUTRE))).toBe(autreAvant);
    } finally {
      await (await base()).collection("user").updateOne(
        { _id: MOI._id },
        avant?.phoneNumber === undefined
          ? { $unset: { phoneNumber: "", phoneNumberVerified: "" } }
          : { $set: { phoneNumber: avant.phoneNumber, phoneNumberVerified: avant.phoneNumberVerified ?? false } },
      );
    }
  });
});
