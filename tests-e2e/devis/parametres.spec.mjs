/**
 * Devis : paramètres. Ceux de l'organisation (notes, couleurs, conditions des
 * devis, enregistrés par la fenêtre « Paramètres » du devis) et ceux des
 * documents (saveDocumentSettings : notes et lien des conditions par défaut).
 *
 *   - seul un rôle qui peut modifier les informations de l'entreprise les
 *     enregistre : l'Éditeur et le Membre sont refusés, l'organisation ne
 *     change pas ;
 *   - un lien des conditions invalide est refusé avec un message ;
 *   - une autre entreprise ne lit jamais les paramètres des autres.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import {
  connecte,
  SESSION_TOKEN_CONTROLE_VENTES,
  SESSION_TOKEN_INTRUS,
  SESSION_TOKEN_VENTES_EDITEUR,
  SESSION_TOKEN_VENTES_LECTEUR,
} from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { PARAMETRES_DEVIS_VENTES } from "../donnees/lot-devis-bc-bl.mjs";
import { appelApi } from "../securite.mjs";
import { ORG, ORG_INTRUS, photo } from "./droits.mjs";
import { appelControle, collection, messages, ORG_CONTROLE_ID } from "./controle.mjs";

const LIRE = `query { getDocumentSettings(documentType: QUOTE) { defaultHeaderNotes defaultTermsAndConditionsLink } }`;
const ENREGISTRER = `mutation($input: DocumentSettingsInput!) { saveDocumentSettings(input: $input) { defaultHeaderNotes defaultTermsAndConditionsLink } }`;
const parametresDevis = (workspaceId) => ["documentsettings", { workspaceId, documentType: "QUOTE" }];

/** Enregistre des informations de l'organisation comme la fenêtre « Paramètres » (Better Auth). */
const enregistrerOrganisation = (page, organizationId, data) =>
  page.evaluate(
    async ({ organizationId, data }) => {
      const res = await fetch("/api/auth/organization/update", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, data }),
      });
      return { statut: res.status, corps: await res.text() };
    },
    { organizationId, data },
  );

test.describe("Devis : paramètres de l'organisation, droits d'enregistrement", () => {
  for (const [role, token] of [
    ["Éditeur", SESSION_TOKEN_VENTES_EDITEUR],
    ["Membre", SESSION_TOKEN_VENTES_LECTEUR],
  ]) {
    test.describe(() => {
      // Refus attendu de Better Auth (403), signalé par le navigateur.
      test.use({ storageState: connecte(token), erreursConsoleAutorisees: /organization\/update/ });
      test(`${role} : enregistrer les paramètres des devis est refusé, l'organisation ne change pas`, async ({ page }) => {
        await ouvrir(page, "/dashboard");
        const temoin = ["organization", { _id: COMPTES.ventes.organisation._id }];
        const avant = await photo(temoin);
        const reponse = await enregistrerOrganisation(page, ORG, {
          quoteHeaderNotes: `Notes enregistrées par le rôle ${role}`,
          quoteHeaderBgColor: "#ff0000",
        });
        expect(reponse.statut, "Enregistrement accepté").toBeGreaterThanOrEqual(400);
        expect(reponse.corps).toContain("Votre rôle ne permet pas de modifier les informations de l'entreprise");
        expect(await photo(temoin), "L'organisation a changé").toBe(avant);
      });
    });
  }
});

test.describe("Devis : paramètres des documents (notes et lien des conditions par défaut)", () => {
  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_CONTROLE_VENTES) });

    test("Lien des conditions « javascript:alert(1) » : refusé avec un message, rien d'enregistré", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const avant = await photo(parametresDevis(ORG_CONTROLE_ID));
      const reponse = await appelControle(page, ENREGISTRER, {
        input: { documentType: "QUOTE", defaultHeaderNotes: "Notes avec un lien piégé", defaultTermsAndConditionsLink: "javascript:alert(1)" },
      });
      expect(reponse.data?.saveDocumentSettings ?? null, "Lien piégé enregistré").toBeNull();
      expect(messages(reponse), "Le refus doit expliquer que le lien est invalide").toMatch(/URL valide/);
      expect(await photo(parametresDevis(ORG_CONTROLE_ID))).toBe(avant);
    });

    test("Notes et lien valides : enregistrés puis relus à l'identique", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const valeurs = { defaultHeaderNotes: "Devis valable 30 jours, acompte de 30 %", defaultTermsAndConditionsLink: "https://www.menuiserie-controle.test/cgv" };
      await etape(page, "Enregistrer", async () => {
        const reponse = await appelControle(page, ENREGISTRER, { input: { documentType: "QUOTE", ...valeurs } });
        expect(reponse.errors).toEqual([]);
      });
      await etape(page, "Relire", async () => {
        const reponse = await appelControle(page, LIRE);
        expect(reponse.data.getDocumentSettings).toEqual(valeurs);
        expect(await (await collection("documentsettings")).countDocuments({ workspaceId: ORG_CONTROLE_ID, documentType: "QUOTE" })).toBe(1);
      });
    });
  });

  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_VENTES_EDITEUR) });
    test("Éditeur : enregistrer les paramètres des documents est refusé", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const avant = await photo(parametresDevis(COMPTES.ventes.organisation._id));
      const reponse = await appelApi(page, ENREGISTRER, { input: { documentType: "QUOTE", defaultHeaderNotes: "Notes de l'Éditeur" } }, { organisation: ORG });
      expect(reponse.data?.saveDocumentSettings ?? null).toBeNull();
      expect(messages(reponse)).toMatch(/permission/);
      expect(await photo(parametresDevis(COMPTES.ventes.organisation._id))).toBe(avant);
    });
  });

  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
    test("Autre entreprise : les paramètres des devis des autres ne sont jamais lus", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      for (const [contexte, organisation] of [
        ["En visant leur organisation", ORG],
        ["Depuis sa propre organisation", ORG_INTRUS],
      ]) {
        const reponse = await appelApi(page, LIRE, {}, { organisation });
        expect(JSON.stringify(reponse.data ?? {}), `${contexte} : paramètres des autres renvoyés`).not.toContain(PARAMETRES_DEVIS_VENTES.defaultHeaderNotes);
      }
    });
  });
});
