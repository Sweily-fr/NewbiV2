/**
 * Documents partagés (et leurs automatisations, rattachées au même droit
 * « sharedDocuments ») : droits vérifiés à l'API. Grille par défaut :
 *   - « Membre » (viewer) : lit, ne modifie rien ;
 *   - « Éditeur » (member) : ajoute et modifie, ne supprime pas ;
 *   - « Comptable » (accountant) : complet ;
 *   - autre entreprise et visiteur sans session : rien.
 * Plus deux défauts dédiés : la suppression définitive d'un dossier actif
 * (hors corbeille) et le plafond d'automatisations de l'offre d'entrée, que
 * seule l'interface applique.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import {
  connecte,
  SESSION_TOKEN_COLLAB,
  SESSION_TOKEN_COLLAB_MEMBRE,
  SESSION_TOKEN_COLLAB_EDITEUR,
  SESSION_TOKEN_COLLAB_COMPTABLE,
  SESSION_TOKEN_COLLAB_FREELANCE,
  SESSION_TOKEN_INTRUS,
} from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { base } from "../base.mjs";
import { appelApi, id } from "../securite.mjs";
import { refusSansEffet, verifierReussite, photo } from "../securite-collaboration.mjs";
import { DOSSIERS, DOCUMENTS, TAGS, AUTOMATISATIONS_DOC, DOSSIER_FREELANCE } from "../donnees/lot-collaboration.mjs";

const ORG = id(COMPTES.collab.organisation);
const ORG_INTRUS = id(COMPTES.intrus.organisation);

const LECTURES = [
  ["Les documents", "sharedDocuments", `query($w: ID!){ sharedDocuments(workspaceId:$w){ success documents{ id name } } }`],
  ["Les dossiers", "sharedFolders", `query($w: ID!){ sharedFolders(workspaceId:$w){ success folders{ id name } } }`],
  ["Les étiquettes", "documentTags", `query($w: ID!){ documentTags(workspaceId:$w){ success tags{ id name } } }`],
  ["La corbeille", "trashItems", `query($w: ID!){ trashItems(workspaceId:$w){ success } }`],
  ["Les automatisations", "documentAutomations", `query($w: ID!){ documentAutomations(workspaceId:$w){ id name } }`],
];

const ECRITURES = [
  {
    nom: "Créer un dossier",
    droit: "create",
    champ: "createSharedFolder",
    requete: `mutation($w: ID!,$input: CreateSharedFolderInput!){ createSharedFolder(workspaceId:$w,input:$input){ success message folder{ id } } }`,
    variables: (w, qui) => ({ w, input: { name: `Dossier de ${qui}` } }),
    temoin: (qui) => ["sharedfolders", { name: `Dossier de ${qui}` }],
  },
  {
    nom: "Renommer un dossier",
    droit: "edit",
    cible: true,
    champ: "updateSharedFolder",
    requete: `mutation($w: ID!,$id: ID!,$input: UpdateSharedFolderInput!){ updateSharedFolder(workspaceId:$w,id:$id,input:$input){ success message folder{ id } } }`,
    variables: (w, qui) => ({ w, id: id(DOSSIERS.lecture), input: { name: `Renommé par ${qui}` } }),
    variablesEditeur: (w) => ({ w, id: id(DOSSIERS.renommerEditeur), input: { name: "Renommé par l'éditeur" } }),
    temoin: () => ["sharedfolders", { _id: DOSSIERS.lecture._id }],
  },
  {
    nom: "Supprimer un dossier",
    droit: "delete",
    cible: true,
    champ: "deleteSharedFolder",
    requete: `mutation($w: ID!,$id: ID!){ deleteSharedFolder(workspaceId:$w,id:$id){ success message } }`,
    variables: (w) => ({ w, id: id(DOSSIERS.supprimer) }),
    temoin: () => ["sharedfolders", { _id: DOSSIERS.supprimer._id }],
  },
  {
    nom: "Renommer un document",
    droit: "edit",
    cible: true,
    champ: "updateSharedDocument",
    requete: `mutation($w: ID!,$id: ID!,$input: UpdateSharedDocumentInput!){ updateSharedDocument(workspaceId:$w,id:$id,input:$input){ success message } }`,
    variables: (w, qui) => ({ w, id: id(DOCUMENTS.lecture), input: { name: `renomme-par-${qui}.pdf` } }),
    variablesEditeur: (w) => ({ w, id: id(DOCUMENTS.modifierEditeur), input: { name: "renomme-editeur.pdf" } }),
    temoin: () => ["shareddocuments", { _id: DOCUMENTS.lecture._id }],
  },
  {
    nom: "Supprimer un document",
    droit: "delete",
    cible: true,
    champ: "deleteSharedDocument",
    requete: `mutation($w: ID!,$id: ID!){ deleteSharedDocument(workspaceId:$w,id:$id){ success message } }`,
    variables: (w) => ({ w, id: id(DOCUMENTS.supprimer) }),
    temoin: () => ["shareddocuments", { _id: DOCUMENTS.supprimer._id }],
  },
  {
    nom: "Déplacer un document",
    droit: "edit",
    cible: true,
    champ: "moveSharedDocuments",
    requete: `mutation($w: ID!,$ids: [ID!]!,$f: ID){ moveSharedDocuments(workspaceId:$w,ids:$ids,targetFolderId:$f){ success message } }`,
    variables: (w) => ({ w, ids: [id(DOCUMENTS.lecture)], f: id(DOSSIERS.classement) }),
    variablesEditeur: (w) => ({ w, ids: [id(DOCUMENTS.deplacerEditeur)], f: id(DOSSIERS.classement) }),
    temoin: () => ["shareddocuments", { _id: DOCUMENTS.lecture._id }],
  },
  {
    nom: "Renommer une étiquette",
    droit: "edit",
    cible: true,
    champ: "updateDocumentTag",
    requete: `mutation($w: ID!,$id: ID!,$n: String){ updateDocumentTag(workspaceId:$w,id:$id,name:$n){ success message } }`,
    variables: (w, qui) => ({ w, id: id(TAGS.lecture), n: `Étiquette ${qui}` }),
    variablesEditeur: (w) => ({ w, id: id(TAGS.modifierEditeur), n: "Étiquette éditeur" }),
    temoin: () => ["sharedtags", { _id: TAGS.lecture._id }],
  },
  {
    nom: "Supprimer une étiquette",
    droit: "delete",
    cible: true,
    champ: "deleteDocumentTag",
    requete: `mutation($w: ID!,$id: ID!){ deleteDocumentTag(workspaceId:$w,id:$id){ success message } }`,
    variables: (w) => ({ w, id: id(TAGS.supprimer) }),
    temoin: () => ["sharedtags", { _id: TAGS.supprimer._id }],
  },
  {
    nom: "Modifier une automatisation de documents",
    droit: "edit",
    cible: true,
    champ: "updateDocumentAutomation",
    requete: `mutation($w: ID!,$id: ID!,$input: UpdateDocumentAutomationInput!){ updateDocumentAutomation(workspaceId:$w,id:$id,input:$input){ id } }`,
    variables: (w, qui) => ({ w, id: id(AUTOMATISATIONS_DOC.lecture), input: { description: `Modifiée par ${qui}` } }),
    variablesEditeur: (w) => ({ w, id: id(AUTOMATISATIONS_DOC.modifierEditeur), input: { description: "Modifiée par l'éditeur" } }),
    temoin: () => ["documentautomations", { _id: AUTOMATISATIONS_DOC.lecture._id }],
  },
  {
    nom: "Supprimer une automatisation de documents",
    droit: "delete",
    cible: true,
    champ: "deleteDocumentAutomation",
    requete: `mutation($w: ID!,$id: ID!){ deleteDocumentAutomation(workspaceId:$w,id:$id) }`,
    variables: (w) => ({ w, id: id(AUTOMATISATIONS_DOC.supprimer) }),
    temoin: () => ["documentautomations", { _id: AUTOMATISATIONS_DOC.supprimer._id }],
  },
];

test.describe("Documents partagés : droits du rôle « Membre » (lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_MEMBRE) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Peut lire documents, dossiers, étiquettes et automatisations", async ({ page }) => {
    for (const [nom, champ, requete] of LECTURES) {
      const reponse = await appelApi(page, requete, { w: ORG }, { organisation: ORG });
      expect.soft(reponse.errors, `${nom} : le Membre doit pouvoir lire`).toEqual([]);
      expect.soft(reponse.data?.[champ], `${nom} : aucune donnée renvoyée`).toBeTruthy();
    }
  });
  for (const op of ECRITURES) {
    test(`${op.nom} : refusé`, async ({ page }) => {
      await refusSansEffet(page, op, "membre", ORG);
    });
  }
});

test.describe("Documents partagés : droits du rôle « Éditeur »", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_EDITEUR) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  for (const op of ECRITURES) {
    if (op.droit === "delete") {
      test(`${op.nom} : refusé`, async ({ page }) => {
        await refusSansEffet(page, op, "editeur", ORG);
      });
    } else {
      test(`${op.nom} : permis`, async ({ page }) => {
        const reponse = await appelApi(page, op.requete, (op.variablesEditeur || op.variables)(ORG, "editeur"), { organisation: ORG, delai: 15_000 });
        verifierReussite(reponse, op.champ, op.nom);
      });
    }
  }
});

test.describe("Documents partagés : le rôle « Comptable » peut lire", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_COMPTABLE) });
  test("Lecture des documents permise", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelApi(page, LECTURES[0][2], { w: ORG }, { organisation: ORG });
    verifierReussite(reponse, "sharedDocuments", "Lecture (Comptable)");
  });
});

test.describe("Documents partagés : une autre entreprise n'atteint rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  for (const [nom, champ, requete] of LECTURES) {
    test(`Lire « ${nom} » des autres : refusé`, async ({ page }) => {
      const reponse = await appelApi(page, requete, { w: ORG }, { organisation: ORG });
      expect(reponse.data?.[champ] ?? null, `${nom} : renvoyé à une autre entreprise`).toBeNull();
      const texte = JSON.stringify(reponse.data ?? {});
      for (const v of [DOCUMENTS.lecture.name, DOSSIERS.lecture.name, TAGS.lecture.name]) expect(texte).not.toContain(v);
    });
  }
  for (const op of ECRITURES) {
    test(`${op.nom} chez les autres : refusé`, async ({ page }) => {
      await refusSansEffet(page, op, "intrus", ORG);
      if (op.cible) await refusSansEffet(page, op, "intrus", ORG_INTRUS);
    });
  }
});

test.describe("Documents partagés : sans session, rien", () => {
  test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });
  test("Lectures et écritures refusées", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    for (const [nom, champ, requete] of LECTURES) {
      const reponse = await appelApi(page, requete, { w: ORG }, { organisation: ORG });
      expect.soft(reponse.data?.[champ] ?? null, `${nom} : renvoyé sans session`).toBeNull();
    }
    for (const op of ECRITURES) {
      const [collection, filtre] = op.temoin("visiteur");
      const avant = await photo(collection, filtre);
      await appelApi(page, op.requete, op.variables(ORG, "visiteur"), { organisation: ORG });
      expect.soft(await photo(collection, filtre), `${op.nom} : la base a changé sans session`).toBe(avant);
    }
  });
});

test.describe("Documents partagés : suppression définitive d'un dossier actif", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });
  test("La suppression définitive ne touche qu'aux dossiers de la corbeille", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await appelApi(
      page,
      `mutation($w: ID!,$ids: [ID!]!){ permanentlyDeleteFolders(workspaceId:$w,ids:$ids){ success message } }`,
      { w: ORG, ids: [id(DOSSIERS.suppressionDefinitive)] },
      { organisation: ORG },
    );
    const reste = await (await base()).collection("sharedfolders").findOne({ _id: DOSSIERS.suppressionDefinitive._id });
    expect(
      reste,
      "Un dossier actif (hors corbeille) a été supprimé définitivement, sans passer par la corbeille (permanentlyDeleteFolders sans filtre trashedAt)",
    ).not.toBeNull();
  });
});

test.describe("Documents partagés : plafond d'automatisations de l'offre d'entrée", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_FREELANCE) });
  test("Une 6e automatisation créée par l'API est refusée (plafond de 5)", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const W = id(COMPTES.collabFreelance.organisation);
    const compter = async () => (await base()).collection("documentautomations").countDocuments({ workspaceId: COMPTES.collabFreelance.organisation._id });
    const avant = await compter();
    expect(avant, "Données de départ : 5 automatisations").toBe(5);
    const reponse = await appelApi(
      page,
      `mutation($w: ID!,$input: CreateDocumentAutomationInput!){ createDocumentAutomation(workspaceId:$w,input:$input){ id } }`,
      { w: W, input: { name: "Sixième automatisation hors offre", triggerType: "INVOICE_OVERDUE", actionConfig: { targetFolderId: id(DOSSIER_FREELANCE) } } },
      { organisation: W },
    );
    expect(reponse.data?.createDocumentAutomation ?? null, "La 6e automatisation a été acceptée par l'API").toBeNull();
    expect(await compter(), "Une 6e automatisation a été créée malgré le plafond de l'offre").toBe(avant);
  });
});
