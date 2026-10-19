/**
 * Robustesse de l'API des contacts : une saisie que l'API refuse doit
 * recevoir une réponse qui dit pourquoi, jamais une requête laissée sans
 * réponse (l'écran de l'utilisateur tourne alors sans fin : import bloqué sur
 * « Import en cours… 0 / 1 », enregistrement qui ne finit jamais).
 *
 * Les noms ci-dessous sont réels et courants (ligature œ, apostrophe
 * typographique insérée par la correction automatique du Mac et de l'iPhone).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_CLIENTS } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { appelApi, id } from "../securite.mjs";
import { base } from "../base.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_CLIENTS) });

const ORG = id(COMPTES.clients.organisation);
const CREER = `mutation($w: String, $input: ClientInput!) { createClient(workspaceId: $w, input: $input) { id name } }`;
const adresse = { street: "3 rue de la Paix", city: "Paris", postalCode: "75002", country: "France" };

const CAS = [
  {
    cas: "entreprise avec « œ » (Cœur de Lion SARL)",
    input: { type: "COMPANY", name: "Cœur de Lion SARL", email: "coeur-de-lion@e2e.test", siret: "12345678900011", address: adresse },
  },
  {
    cas: "entreprise avec une apostrophe typographique (L’Atelier du Bois)",
    input: { type: "COMPANY", name: "L’Atelier du Bois", email: "atelier-du-bois@e2e.test", siret: "12345678900011", address: adresse },
  },
  {
    cas: "particulier avec « œ » (Anne Lecœur)",
    input: { type: "INDIVIDUAL", firstName: "Anne", lastName: "Lecœur", email: "anne-lecoeur@e2e.test", address: adresse },
  },
];

test.describe("Contacts : l'API répond toujours", () => {
  for (const { cas, input } of CAS) {
    test(`Création d'un contact, ${cas} : enregistré ou refusé avec un message, jamais sans réponse`, async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const reponse = await etape(page, "Appel de l'API (10 s au plus)", () => appelApi(page, CREER, { w: ORG, input }, { organisation: ORG, delai: 10_000 }));
      expect(reponse.sansReponse, `Aucune réponse de l'API en 10 s : la requête reste bloquée (${cas})`).toBe(false);
      const cree = reponse.data?.createClient;
      if (!cree) {
        const messages = reponse.errors.map((e) => e.message).join(" | ");
        expect(messages, "Refus sans explication").not.toBe("");
      } else {
        const doc = await (await base()).collection("clients").findOne({ workspaceId: COMPTES.clients.organisation._id, email: input.email });
        expect(doc, "Contact annoncé créé mais absent de la base").not.toBeNull();
      }
    });
  }
});
