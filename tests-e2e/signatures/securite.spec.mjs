/**
 * Signatures de mail (V2) : une signature est personnelle (filtre createdBy
 * + espace côté API). Personne d'autre, même dans l'espace, ne doit la lire,
 * la modifier ou la supprimer. Grille par défaut : « Membre » lit (les
 * siennes), « Éditeur » gère les siennes, « Comptable » n'a pas accès.
 *
 * Le HTML de la signature est produit par l'API : chaque champ saisi doit y
 * être échappé (un texte piégé reste du texte, un lien « javascript: » est
 * neutralisé), puisque ce HTML est copié tel quel dans la messagerie.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import {
  connecte,
  SESSION_TOKEN_COLLAB,
  SESSION_TOKEN_COLLAB_MEMBRE,
  SESSION_TOKEN_COLLAB_EDITEUR,
  SESSION_TOKEN_COLLAB_COMPTABLE,
  SESSION_TOKEN_INTRUS,
} from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { appelApi, id } from "../securite.mjs";
import { refusSansEffet, verifierRefusCollab, verifierReussite } from "../securite-collaboration.mjs";
import { SIGNATURES } from "../donnees/lot-collaboration.mjs";

const ORG = id(COMPTES.collab.organisation);
const LISTE = `query{ emailSignaturesV2{ id name } }`;
const UNE = `query($id: ID!){ emailSignatureV2(id:$id){ id name } }`;

const MODIFIER = {
  nom: "Modifier la signature d'un autre membre",
  champ: "updateEmailSignatureV2",
  requete: `mutation($id: ID!,$input: EmailSignatureV2Input!){ updateEmailSignatureV2(id:$id,input:$input){ id } }`,
  variables: (_w, qui) => ({ id: id(SIGNATURES.proprietaire), input: { name: `Modifiée par ${qui}` } }),
  temoin: () => ["emailsignaturev2", { _id: SIGNATURES.proprietaire._id }],
};
const SUPPRIMER = {
  nom: "Supprimer la signature d'un autre membre",
  champ: "deleteEmailSignatureV2",
  requete: `mutation($id: ID!){ deleteEmailSignatureV2(id:$id) }`,
  variables: () => ({ id: id(SIGNATURES.proprietaire) }),
  temoin: () => ["emailsignaturev2", { _id: SIGNATURES.proprietaire._id }],
};
const DUPLIQUER = {
  nom: "Dupliquer la signature d'un autre membre",
  champ: "duplicateEmailSignatureV2",
  requete: `mutation($id: ID!){ duplicateEmailSignatureV2(id:$id){ id } }`,
  variables: () => ({ id: id(SIGNATURES.proprietaire) }),
  temoin: () => ["emailsignaturev2", { name: { $regex: "^Signature du gérant" } }],
};

for (const [role, token, qui] of [
  ["Membre", SESSION_TOKEN_COLLAB_MEMBRE, "membre"],
  ["Éditeur", SESSION_TOKEN_COLLAB_EDITEUR, "editeur"],
]) {
  test.describe(`Signatures : le rôle « ${role} » n'atteint pas celles des autres`, () => {
    test.use({ storageState: connecte(token) });
    test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

    test("La liste ne contient que ses propres signatures", async ({ page }) => {
      const reponse = await appelApi(page, LISTE, {}, { organisation: ORG });
      expect(JSON.stringify(reponse.data ?? {}), "La signature du propriétaire est visible d'un autre membre").not.toContain(SIGNATURES.proprietaire.name);
    });
    test("Lire la signature du propriétaire : rien", async ({ page }) => {
      const reponse = await appelApi(page, UNE, { id: id(SIGNATURES.proprietaire) }, { organisation: ORG });
      expect(reponse.data?.emailSignatureV2 ?? null, "La signature d'un autre membre est renvoyée").toBeNull();
    });
    for (const op of [MODIFIER, SUPPRIMER, DUPLIQUER]) {
      test(`${op.nom} : refusé`, async ({ page }) => {
        await refusSansEffet(page, op, qui, ORG);
      });
    }
  });
}

test.describe("Signatures : le rôle « Membre » ne crée pas de signature", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_MEMBRE) });
  test("Créer une signature : refusé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await refusSansEffet(
      page,
      {
        nom: "Créer une signature",
        champ: "createEmailSignatureV2",
        requete: `mutation($input: EmailSignatureV2Input!){ createEmailSignatureV2(input:$input){ id } }`,
        variables: () => ({ input: { name: "Signature du Membre" } }),
        temoin: () => ["emailsignaturev2", { name: "Signature du Membre" }],
      },
      "membre",
      ORG,
    );
  });
});

test.describe("Signatures : le rôle « Comptable » n'a pas accès", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_COMPTABLE) });
  test("Lister les signatures : refusé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelApi(page, LISTE, {}, { organisation: ORG });
    verifierRefusCollab(reponse, "emailSignaturesV2", "Liste des signatures (Comptable)");
  });
});

test.describe("Signatures : une autre entreprise n'atteint rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));
  test("Lire la signature des autres : rien", async ({ page }) => {
    const reponse = await appelApi(page, UNE, { id: id(SIGNATURES.proprietaire) }, { organisation: ORG });
    expect(reponse.data?.emailSignatureV2 ?? null).toBeNull();
  });
  for (const op of [MODIFIER, SUPPRIMER]) {
    test(`${op.nom} (autre entreprise) : refusé`, async ({ page }) => {
      await refusSansEffet(page, op, "intrus", ORG);
    });
  }
});

test.describe("Signatures : sans session, rien", () => {
  test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });
  test("Lecture refusée", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    const reponse = await appelApi(page, LISTE, {}, { organisation: ORG });
    expect(reponse.data?.emailSignaturesV2 ?? null, "Signatures renvoyées sans session").toBeNull();
  });
});

const RENDU = `query($input: EmailSignatureV2Input!){ renderEmailSignatureV2(input:$input){ html previewHtml } }`;

test.describe("Signatures : les champs sont échappés dans le HTML produit", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Un nom piégé reste du texte (balises échappées)", async ({ page }) => {
    const piege = `<img src=x onerror=alert(1)>Noa`;
    const reponse = await appelApi(
      page,
      RENDU,
      { input: { name: "Rendu piégé", templateId: "newbi", identity: { firstName: piege, lastName: "Collab", jobTitle: `"><b>Gérant</b>` } } },
      { organisation: ORG, delai: 20_000 },
    );
    const rendu = verifierReussite(reponse, "renderEmailSignatureV2", "Rendu de la signature");
    for (const html of [rendu.html, rendu.previewHtml]) {
      expect(html, "Une balise saisie dans un champ arrive telle quelle dans le HTML").not.toContain("<img src=x onerror");
      expect(html, "Une balise saisie dans un champ arrive telle quelle dans le HTML").not.toContain("<b>Gérant</b>");
    }
    expect(rendu.html, "Le nom saisi doit rester visible, échappé").toContain("&lt;img");
  });

  test("Un lien « javascript: » est neutralisé", async ({ page }) => {
    const reponse = await appelApi(
      page,
      RENDU,
      { input: { name: "Rendu lien", templateId: "newbi", identity: { firstName: "Noa" }, contact: { website: "javascript:alert(1)" } } },
      { organisation: ORG, delai: 20_000 },
    );
    const rendu = verifierReussite(reponse, "renderEmailSignatureV2", "Rendu de la signature");
    expect(rendu.html.toLowerCase(), "Un lien javascript: est resté dans le HTML de la signature").not.toContain('href="javascript:');
  });

  test("Les vrais noms passent intacts (accents, œ, apostrophe typographique)", async ({ page }) => {
    const reponse = await appelApi(
      page,
      RENDU,
      { input: { name: "Rendu noms", templateId: "newbi", identity: { firstName: "Hélène", lastName: "Lecœur", company: "L’Atelier du Bois" } } },
      { organisation: ORG, delai: 20_000 },
    );
    const rendu = verifierReussite(reponse, "renderEmailSignatureV2", "Rendu de la signature");
    for (const v of ["Hélène", "Lecœur", "L’Atelier du Bois"]) expect(rendu.html, `« ${v} » a été altéré`).toContain(v);
  });
});
