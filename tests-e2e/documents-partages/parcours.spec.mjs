/**
 * Documents partagés : règles de l'arborescence vérifiées en base.
 *   - Un dossier ne se range ni sous lui-même ni sous un de ses sous-dossiers
 *     (un cycle bloquait l'API en boucle sans fin).
 *   - Un sous-dossier créé sans visibilité dans un dossier privé hérite de
 *     son parent : un membre hors liste ne le voit pas.
 *   - Renommer avec un nom vide, ou un dossier comme son voisin : refusé.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { BASE_URL, connecte, SESSION_TOKEN_COLLAB, SESSION_TOKEN_COLLAB_MEMBRE, SESSION_TOKEN_COLLAB_EDITEUR } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { base } from "../base.mjs";
import { appelApi, id } from "../securite.mjs";
import { photo } from "../securite-collaboration.mjs";
import { DOSSIERS, DOCUMENTS } from "../donnees/lot-collaboration.mjs";

const ORG = id(COMPTES.collab.organisation);

const MAJ_DOSSIER = `mutation($w: ID!,$id: ID!,$input: UpdateSharedFolderInput!){ updateSharedFolder(workspaceId:$w,id:$id,input:$input){ success message folder{ id } } }`;
const MAJ_DOCUMENT = `mutation($w: ID!,$id: ID!,$input: UpdateSharedDocumentInput!){ updateSharedDocument(workspaceId:$w,id:$id,input:$input){ success message } }`;
const CREER_DOSSIER = `mutation($w: ID!,$input: CreateSharedFolderInput!){ createSharedFolder(workspaceId:$w,input:$input){ success message folder{ id } } }`;
const DOSSIERS_VISIBLES = `query($w: ID!){ sharedFolders(workspaceId:$w){ success folders{ id name } } }`;

test.describe("Documents partagés : un dossier ne devient pas son propre parent", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  for (const [cas, parent] of [
    ["sous lui-même", DOSSIERS.cycleA],
    ["sous son sous-dossier", DOSSIERS.cycleB],
  ]) {
    test(`Ranger un dossier ${cas} : refusé avec message, base inchangée`, async ({ page }) => {
      const avant = await photo("sharedfolders", { _id: DOSSIERS.cycleA._id });
      const reponse = await appelApi(
        page,
        MAJ_DOSSIER,
        { w: ORG, id: id(DOSSIERS.cycleA), input: { parentId: id(parent) } },
        { organisation: ORG, delai: 10_000 },
      );
      expect(reponse.sansReponse, "L'API n'a pas répondu (boucle sans fin)").toBe(false);
      const resultat = reponse.data?.updateSharedFolder;
      expect(resultat?.success, `Un dossier a été rangé ${cas}`).toBe(false);
      expect(resultat?.message).toMatch(/dans lui-même ou dans un de ses sous-dossiers/);
      expect(await photo("sharedfolders", { _id: DOSSIERS.cycleA._id })).toBe(avant);
    });
  }

  test("La liste des dossiers répond toujours", async ({ page }) => {
    const reponse = await appelApi(page, DOSSIERS_VISIBLES, { w: ORG }, { organisation: ORG, delai: 10_000 });
    expect(reponse.sansReponse).toBe(false);
    const noms = (reponse.data?.sharedFolders?.folders || []).map((f) => f.name);
    expect(noms).toEqual(expect.arrayContaining([DOSSIERS.cycleA.name, DOSSIERS.cycleB.name]));
  });
});

test.describe("Documents partagés : sous-dossier d'un dossier privé", () => {
  const NOM = "Paie (sous-dossier privé)";

  test("Créé sans visibilité : hérite du dossier privé, invisible du Membre et de l'Éditeur", async ({ browser }) => {
    const proprietaire = await browser.newContext({ storageState: connecte(SESSION_TOKEN_COLLAB), baseURL: BASE_URL });
    const page = await proprietaire.newPage();
    await ouvrir(page, "/dashboard");
    let paieId;
    await etape(page, "Le propriétaire crée « Paie » dans son dossier privé, sans choisir de visibilité", async () => {
      const reponse = await appelApi(page, CREER_DOSSIER, { w: ORG, input: { name: NOM, parentId: id(DOSSIERS.prive) } }, { organisation: ORG });
      expect(reponse.data?.createSharedFolder?.success, JSON.stringify(reponse.errors)).toBe(true);
      paieId = reponse.data.createSharedFolder.folder.id;
      const visibles = await appelApi(page, DOSSIERS_VISIBLES, { w: ORG }, { organisation: ORG });
      expect(visibles.data.sharedFolders.folders.map((f) => f.id)).toContain(paieId);
    });
    await proprietaire.close();

    for (const [role, jeton] of [
      ["Membre", SESSION_TOKEN_COLLAB_MEMBRE],
      ["Éditeur", SESSION_TOKEN_COLLAB_EDITEUR],
    ]) {
      const contexte = await browser.newContext({ storageState: connecte(jeton), baseURL: BASE_URL });
      const p = await contexte.newPage();
      await ouvrir(p, "/dashboard");
      const reponse = await appelApi(p, DOSSIERS_VISIBLES, { w: ORG }, { organisation: ORG });
      const ids = (reponse.data?.sharedFolders?.folders || []).map((f) => f.id);
      expect(ids, `Le ${role} voit le dossier privé`).not.toContain(id(DOSSIERS.prive));
      expect(ids, `Le ${role} voit le sous-dossier « Paie » du dossier privé`).not.toContain(paieId);
      await contexte.close();
    }

    const enBase = await (await base()).collection("sharedfolders").findOne({ name: NOM });
    expect(enBase?.visibility ?? null, "Le sous-dossier ne doit pas être enregistré public").not.toBe("public");
  });
});

test.describe("Documents partagés : renommer, nom vide ou déjà pris", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Dossier renommé avec un nom vide : refusé, nom inchangé", async ({ page }) => {
    const avant = await photo("sharedfolders", { _id: DOSSIERS.renommer._id });
    const reponse = await appelApi(page, MAJ_DOSSIER, { w: ORG, id: id(DOSSIERS.renommer), input: { name: "" } }, { organisation: ORG });
    expect(reponse.data?.updateSharedFolder?.success, "Un nom de dossier vide a été accepté").toBe(false);
    expect(reponse.data?.updateSharedFolder?.message).toMatch(/ne peut pas être vide/);
    expect(await photo("sharedfolders", { _id: DOSSIERS.renommer._id })).toBe(avant);
  });

  test("Dossier renommé comme un voisin : refusé, nom inchangé", async ({ page }) => {
    const avant = await photo("sharedfolders", { _id: DOSSIERS.renommer._id });
    const reponse = await appelApi(
      page,
      MAJ_DOSSIER,
      { w: ORG, id: id(DOSSIERS.renommer), input: { name: DOSSIERS.cycleA.name } },
      { organisation: ORG },
    );
    expect(reponse.data?.updateSharedFolder?.success, "Deux dossiers voisins portent le même nom").toBe(false);
    expect(reponse.data?.updateSharedFolder?.message).toBe("Un dossier avec ce nom existe déjà");
    expect(await photo("sharedfolders", { _id: DOSSIERS.renommer._id })).toBe(avant);
  });

  test("Document renommé avec un nom vide : refusé, nom inchangé", async ({ page }) => {
    const avant = await photo("shareddocuments", { _id: DOCUMENTS.modifier._id });
    const reponse = await appelApi(page, MAJ_DOCUMENT, { w: ORG, id: id(DOCUMENTS.modifier), input: { name: "  " } }, { organisation: ORG });
    expect(reponse.data?.updateSharedDocument?.success, "Un nom de document vide a été accepté").toBe(false);
    expect(await photo("shareddocuments", { _id: DOCUMENTS.modifier._id })).toBe(avant);
  });
});
