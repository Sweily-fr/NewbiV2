/**
 * Transferts de fichiers : droits vérifiés à l'API, et liens publics.
 *   - Un transfert est personnel : seul son auteur le voit, le renomme ou le
 *     supprime (filtre userId côté API), même au sein de l'espace.
 *   - « Membre » : lit (ses transferts), ne crée ni ne modifie rien ;
 *     « Éditeur » : renomme les siens, ne supprime pas ; seuls propriétaire et
 *     administrateur suppriment.
 *   - Un lien expiré, supprimé ou avec une mauvaise clé ne donne plus rien.
 * Le stockage des fichiers (R2) est absent en CI : les transferts sont semés
 * en base, sans contenu réel à télécharger.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import {
  connecte,
  SESSION_TOKEN_COLLAB,
  SESSION_TOKEN_COLLAB_MEMBRE,
  SESSION_TOKEN_COLLAB_EDITEUR,
  SESSION_TOKEN_INTRUS,
} from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { appelApi, id } from "../securite.mjs";
import { refusSansEffet, verifierReussite, photo } from "../securite-collaboration.mjs";
import { TRANSFERTS } from "../donnees/lot-collaboration.mjs";

const ORG = id(COMPTES.collab.organisation);
const ORG_INTRUS = id(COMPTES.intrus.organisation);

const PAR_LIEN = `query($l: String!,$k: String!){ getFileTransferByLink(shareLink:$l,accessKey:$k){ success message fileTransfer{ id files{ originalName } } } }`;
const parLien = (page, t, cle = t.accessKey) => appelApi(page, PAR_LIEN, { l: t.shareLink, k: cle });

const RENOMMER = {
  nom: "Renommer le transfert du propriétaire",
  champ: "renameFileTransfer",
  requete: `mutation($id: ID!,$t: String!){ renameFileTransfer(id:$id,title:$t){ id title } }`,
  variables: (_w, qui) => ({ id: id(TRANSFERTS.renommer), t: `Renommé par ${qui}` }),
  temoin: () => ["filetransfers", { _id: TRANSFERTS.renommer._id }],
};
const SUPPRIMER = {
  nom: "Supprimer le transfert du propriétaire",
  champ: "deleteFileTransfer",
  requete: `mutation($id: ID!){ deleteFileTransfer(id:$id) }`,
  variables: () => ({ id: id(TRANSFERTS.renommer) }),
  temoin: () => ["filetransfers", { _id: TRANSFERTS.renommer._id }],
};
const LIRE_UN = `query($id: ID!){ fileTransferById(id:$id){ id title } }`;

for (const [role, token, qui] of [
  ["Membre", SESSION_TOKEN_COLLAB_MEMBRE, "membre"],
  ["Éditeur", SESSION_TOKEN_COLLAB_EDITEUR, "editeur"],
]) {
  test.describe(`Transferts : le rôle « ${role} » n'atteint pas ceux du propriétaire`, () => {
    test.use({ storageState: connecte(token) });
    test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

    test("Lire un transfert du propriétaire : refusé", async ({ page }) => {
      const reponse = await appelApi(page, LIRE_UN, { id: id(TRANSFERTS.actif) }, { organisation: ORG });
      expect(reponse.data?.fileTransferById ?? null, "Le transfert d'un autre membre est renvoyé").toBeNull();
    });
    test(`${RENOMMER.nom} : refusé`, async ({ page }) => {
      await refusSansEffet(page, RENOMMER, qui, ORG);
    });
    test(`${SUPPRIMER.nom} : refusé`, async ({ page }) => {
      await refusSansEffet(page, SUPPRIMER, qui, ORG);
    });
  });
}

test.describe("Transferts : une autre entreprise n'atteint rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Lister les transferts des autres : rien de leur organisation", async ({ page }) => {
    const reponse = await appelApi(page, `query($w: ID){ myFileTransfers(workspaceId:$w){ items{ id title } } }`, { w: ORG }, { organisation: ORG });
    expect(JSON.stringify(reponse.data ?? {})).not.toContain(TRANSFERTS.actif.title);
  });
  for (const op of [RENOMMER, SUPPRIMER]) {
    test(`${op.nom} : refusé`, async ({ page }) => {
      await refusSansEffet(page, op, "intrus", ORG);
      await refusSansEffet(page, op, "intrus", ORG_INTRUS);
    });
  }
});

test.describe("Transferts : le lien public ne donne plus rien quand il ne doit plus", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.beforeEach(async ({ page }) => ouvrir(page, "/auth/login"));

  test("Lien actif avec la bonne clé : le transfert est accessible", async ({ page }) => {
    const reponse = await parLien(page, TRANSFERTS.actif);
    const v = verifierReussite(reponse, "getFileTransferByLink", "Lien actif");
    expect(v.fileTransfer?.files?.map((f) => f.originalName)).toContain("document.pdf");
  });
  test("Lien expiré : rien n'est renvoyé", async ({ page }) => {
    const reponse = await parLien(page, TRANSFERTS.expire);
    expect(reponse.data?.getFileTransferByLink?.success, "Un lien expiré donne encore accès").toBe(false);
    expect(reponse.data?.getFileTransferByLink?.fileTransfer ?? null).toBeNull();
  });
  test("Transfert supprimé : rien n'est renvoyé", async ({ page }) => {
    const reponse = await parLien(page, TRANSFERTS.supprimeStatut);
    expect(reponse.data?.getFileTransferByLink?.success, "Un transfert supprimé donne encore accès").toBe(false);
    expect(reponse.data?.getFileTransferByLink?.fileTransfer ?? null).toBeNull();
  });
  test("Mauvaise clé d'accès : rien n'est renvoyé", async ({ page }) => {
    const reponse = await parLien(page, TRANSFERTS.actif, "clefausse0000000000000000000000000");
    expect(reponse.data?.getFileTransferByLink?.success, "Une mauvaise clé donne accès").toBe(false);
    expect(reponse.data?.getFileTransferByLink?.fileTransfer ?? null).toBeNull();
  });
});

test.describe("Transferts : un transfert supprimé par son auteur ne donne plus rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });
  test("Suppression puis lien mort, et base marquée « deleted »", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await etape(page, "Le propriétaire supprime son transfert", async () => {
      const reponse = await appelApi(page, `mutation($id: ID!){ deleteFileTransfer(id:$id) }`, { id: id(TRANSFERTS.supprimer) }, { organisation: ORG });
      verifierReussite(reponse, "deleteFileTransfer", "Suppression par l'auteur");
    });
    await etape(page, "Le lien ne donne plus rien", async () => {
      const reponse = await parLien(page, TRANSFERTS.supprimer);
      expect(reponse.data?.getFileTransferByLink?.success, "Le lien d'un transfert supprimé donne encore accès").toBe(false);
    });
    const doc = JSON.parse(await photo("filetransfers", { _id: TRANSFERTS.supprimer._id }))[0];
    expect(doc?.status, "Le transfert n'est pas marqué supprimé en base").toBe("deleted");
  });
});
