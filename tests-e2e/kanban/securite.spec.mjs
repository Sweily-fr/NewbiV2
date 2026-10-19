/**
 * Kanban : droits vérifiés à l'API, pas seulement à l'écran. Chaque opération
 * (tableaux, colonnes, tâches, étiquettes, checklist, commentaires, minuteur,
 * liens) est appelée directement, avec la session du navigateur :
 *   - « Membre » (lecture seule, viewer) : lit, ne modifie rien ;
 *   - « Éditeur » (member) : crée et modifie, ne supprime pas ;
 *   - « Comptable » (accountant) : aucun accès au kanban (lecture comprise) ;
 *   - intrus (autre entreprise) : refus sur l'organisation des autres, et
 *     « introuvable » en visant leurs données depuis la sienne ;
 *   - visiteur sans session : refus.
 * Plus : le lien public d'un tableau ne donne accès qu'à ce tableau, en
 * lecture ; un lien expiré ou révoqué ne donne plus rien ; et un titre ou une
 * description de tâche piégés ne s'exécutent jamais (XSS stockée).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import {
  BASE_URL,
  connecte,
  SESSION_TOKEN_COLLAB,
  SESSION_TOKEN_COLLAB_MEMBRE,
  SESSION_TOKEN_COLLAB_EDITEUR,
  SESSION_TOKEN_COLLAB_COMPTABLE,
  SESSION_TOKEN_INTRUS,
} from "../config.mjs";
import { COMPTES, MEMBRES } from "../donnees/base.mjs";
import { appelApi, id } from "../securite.mjs";
import { refusSansEffet, verifierRefusCollab, verifierReussite, sansFuite, photo } from "../securite-collaboration.mjs";
import { TABLEAUX, COLONNES, TACHES, PARTAGES, VISITEUR, PIEGE } from "../donnees/lot-collaboration.mjs";

const ORG = id(COMPTES.collab.organisation);
const ORG_INTRUS = id(COMPTES.intrus.organisation);
const TAG = { name: "Priorité", className: "c", bg: "#eee", text: "#111", border: "#ccc" };

/* --- Lectures ------------------------------------------------------------- */

const LECTURES = [
  ["Les tableaux", "boards", `query($w: ID){ boards(workspaceId:$w){ id title } }`, (w) => ({ w })],
  ["Un tableau", "board", `query($w: ID,$id: ID!){ board(workspaceId:$w,id:$id){ id title } }`, (w) => ({ w, id: id(TABLEAUX.lecture) })],
  ["Les colonnes", "columns", `query($w: ID,$b: ID!){ columns(workspaceId:$w,boardId:$b){ id title } }`, (w) => ({ w, b: id(TABLEAUX.lecture) })],
  ["Les tâches", "tasks", `query($w: ID,$b: ID!){ tasks(workspaceId:$w,boardId:$b){ id title } }`, (w) => ({ w, b: id(TABLEAUX.lecture) })],
  ["Une tâche", "task", `query($w: ID,$id: ID!){ task(workspaceId:$w,id:$id){ id title } }`, (w) => ({ w, id: id(TACHES.lecture1) })],
  ["Recherche de tâches", "searchTasks", `query($w: ID,$s: String){ searchTasks(workspaceId:$w,search:$s){ id title boardTitle } }`, (w) => ({ w, s: "maquette" })],
  ["Les membres de l'espace", "organizationMembers", `query($w: ID!){ organizationMembers(workspaceId:$w){ id name } }`, (w) => ({ w })],
];

/* --- Écritures ------------------------------------------------------------ */

const ECRITURES = [
  {
    nom: "Créer un tableau",
    droit: "create",
    champ: "createBoard",
    requete: `mutation($w: ID,$input: CreateBoardInput!){ createBoard(workspaceId:$w,input:$input){ id } }`,
    variables: (w, qui) => ({ w, input: { title: `Tableau de ${qui}` } }),
    temoin: (qui) => ["boards", { title: `Tableau de ${qui}` }],
  },
  {
    nom: "Modifier un tableau",
    droit: "edit",
    cible: true,
    champ: "updateBoard",
    requete: `mutation($w: ID,$input: UpdateBoardInput!){ updateBoard(workspaceId:$w,input:$input){ id } }`,
    variables: (w, qui) => ({ w, input: { id: id(TABLEAUX.modifier), description: `Modifié par ${qui}` } }),
    temoin: () => ["boards", { _id: TABLEAUX.modifier._id }],
  },
  {
    nom: "Supprimer un tableau",
    droit: "delete",
    cible: true,
    champ: "deleteBoard",
    requete: `mutation($w: ID,$id: ID!){ deleteBoard(workspaceId:$w,id:$id) }`,
    variables: (w) => ({ w, id: id(TABLEAUX.supprimer) }),
    temoin: () => ["boards", { _id: TABLEAUX.supprimer._id }],
    booleen: true,
  },
  {
    nom: "Mettre un tableau en favori",
    droit: "edit",
    // toggleBoardFavorite exige le niveau « read » : permis au Membre aussi.
    niveauLecture: true,
    cible: true,
    champ: "toggleBoardFavorite",
    requete: `mutation($w: ID,$b: ID!){ toggleBoardFavorite(workspaceId:$w,boardId:$b){ id isFavorite } }`,
    variables: (w) => ({ w, b: id(TABLEAUX.favori) }),
    temoin: () => ["boards", { _id: TABLEAUX.favori._id }],
  },
  {
    nom: "Créer une colonne",
    droit: "create",
    champ: "createColumn",
    requete: `mutation($w: ID,$input: CreateColumnInput!){ createColumn(workspaceId:$w,input:$input){ id } }`,
    variables: (w, qui) => ({ w, input: { title: `Colonne de ${qui}`, color: "#111111", boardId: id(TABLEAUX.colonnes), order: 5 } }),
    temoin: (qui) => ["columns", { title: `Colonne de ${qui}` }],
  },
  {
    nom: "Modifier une colonne",
    droit: "edit",
    cible: true,
    champ: "updateColumn",
    requete: `mutation($w: ID,$input: UpdateColumnInput!){ updateColumn(workspaceId:$w,input:$input){ id } }`,
    variables: (w, qui) => ({ w, input: { id: id(COLONNES.modifier), title: `Colonne ${qui}` } }),
    temoin: () => ["columns", { _id: COLONNES.modifier._id }],
  },
  {
    nom: "Supprimer une colonne",
    droit: "delete",
    cible: true,
    champ: "deleteColumn",
    requete: `mutation($w: ID,$id: ID!){ deleteColumn(workspaceId:$w,id:$id) }`,
    variables: (w) => ({ w, id: id(COLONNES.supprimer) }),
    temoin: () => ["columns", { _id: COLONNES.supprimer._id }],
    booleen: true,
  },
  {
    nom: "Créer une tâche",
    droit: "create",
    champ: "createTask",
    requete: `mutation($w: ID,$input: CreateTaskInput!){ createTask(workspaceId:$w,input:$input){ id } }`,
    variables: (w, qui) => ({
      w,
      input: { title: `Tâche de ${qui}`, boardId: id(TABLEAUX.taches), columnId: id(COLONNES.taches) },
    }),
    temoin: (qui) => ["tasks", { title: `Tâche de ${qui}` }],
  },
  {
    nom: "Modifier une tâche",
    droit: "edit",
    cible: true,
    champ: "updateTask",
    requete: `mutation($w: ID,$input: UpdateTaskInput!){ updateTask(workspaceId:$w,input:$input){ id } }`,
    variables: (w, qui) => ({ w, input: { id: id(TACHES.modifier), description: `Modifiée par ${qui}` } }),
    temoin: () => ["tasks", { _id: TACHES.modifier._id }],
  },
  {
    nom: "Supprimer une tâche",
    droit: "delete",
    cible: true,
    champ: "deleteTask",
    requete: `mutation($w: ID,$id: ID!){ deleteTask(workspaceId:$w,id:$id) }`,
    variables: (w) => ({ w, id: id(TACHES.supprimer) }),
    temoin: () => ["tasks", { _id: TACHES.supprimer._id }],
    booleen: true,
  },
  {
    nom: "Déplacer une tâche",
    droit: "edit",
    cible: true,
    champ: "moveTask",
    requete: `mutation($w: ID,$id: ID!,$c: String!,$p: Int!){ moveTask(workspaceId:$w,id:$id,columnId:$c,position:$p){ id } }`,
    variables: (w) => ({ w, id: id(TACHES.deplacer), c: id(COLONNES.taches), p: 0 }),
    temoin: () => ["tasks", { _id: TACHES.deplacer._id }],
  },
  {
    nom: "Assigner un membre à une tâche",
    droit: "edit",
    cible: true,
    champ: "assignTaskMember",
    requete: `mutation($w: ID,$t: ID!,$m: String!){ assignTaskMember(workspaceId:$w,taskId:$t,memberId:$m){ id } }`,
    variables: (w) => ({ w, t: id(TACHES.assigner), m: id(MEMBRES.collabEditeur.utilisateur) }),
    temoin: () => ["tasks", { _id: TACHES.assigner._id }],
  },
  {
    nom: "Étiqueter une tâche",
    droit: "edit",
    cible: true,
    champ: "addTaskTag",
    requete: `mutation($w: ID,$t: ID!,$tag: TagInput!){ addTaskTag(workspaceId:$w,taskId:$t,tag:$tag){ id } }`,
    variables: (w) => ({ w, t: id(TACHES.etiqueter), tag: TAG }),
    temoin: () => ["tasks", { _id: TACHES.etiqueter._id }],
  },
  {
    nom: "Ajouter un point de checklist",
    droit: "edit",
    cible: true,
    champ: "addChecklistItem",
    requete: `mutation($w: ID,$t: ID!,$x: String!){ addChecklistItem(workspaceId:$w,taskId:$t,text:$x){ id } }`,
    variables: (w, qui) => ({ w, t: id(TACHES.checklist), x: `Point de ${qui}` }),
    temoin: () => ["tasks", { _id: TACHES.checklist._id }],
  },
  {
    nom: "Commenter une tâche",
    droit: "comment",
    cible: true,
    champ: "addComment",
    requete: `mutation($w: ID,$t: ID!,$input: CommentInput!){ addComment(workspaceId:$w,taskId:$t,input:$input){ id } }`,
    variables: (w, qui) => ({ w, t: id(TACHES.commenter), input: { content: `Commentaire de ${qui}` } }),
    temoin: () => ["tasks", { _id: TACHES.commenter._id }],
  },
  {
    nom: "Modifier le commentaire d'un autre membre",
    droit: "comment",
    // Seul l'auteur peut modifier son commentaire.
    auteurSeulement: true,
    cible: true,
    champ: "updateComment",
    requete: `mutation($w: ID,$t: ID!,$c: ID!,$x: String!){ updateComment(workspaceId:$w,taskId:$t,commentId:$c,content:$x){ id } }`,
    variables: (w, qui) => ({ w, t: id(TACHES.commenter), c: TACHES.commenter.comments[0]._id.toHexString(), x: `Modifié par ${qui}` }),
    temoin: () => ["tasks", { _id: TACHES.commenter._id }],
  },
  {
    nom: "Lancer le minuteur d'une tâche",
    droit: "edit",
    cible: true,
    champ: "startTimer",
    requete: `mutation($w: ID,$t: ID!){ startTimer(workspaceId:$w,taskId:$t){ id } }`,
    variables: (w) => ({ w, t: id(TACHES.minuteur) }),
    temoin: () => ["tasks", { _id: TACHES.minuteur._id }],
  },
  {
    nom: "Lier deux tâches",
    droit: "edit",
    cible: true,
    champ: "linkTask",
    requete: `mutation($w: ID,$t: ID!,$l: ID!){ linkTask(workspaceId:$w,taskId:$t,linkedTaskId:$l){ id } }`,
    variables: (w) => ({ w, t: id(TACHES.lier), l: id(TACHES.lierCible) }),
    temoin: () => ["tasks", { _id: TACHES.lier._id }],
  },
];

/** L'Éditeur (member) : tout sauf supprimer ; les commentaires d'autrui lui sont fermés. */
const editeurPeut = (op) => op.droit !== "delete" && !op.auteurSeulement;

/* --- Membre (lecture seule) ----------------------------------------------- */

test.describe("Kanban : droits du rôle « Membre » (lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_MEMBRE) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Peut lire tableaux, colonnes et tâches", async ({ page }) => {
    for (const [nom, champ, requete, variables] of LECTURES) {
      const reponse = await appelApi(page, requete, variables(ORG), { organisation: ORG });
      expect.soft(reponse.errors, `${nom} : le Membre doit pouvoir lire`).toEqual([]);
      expect.soft(reponse.data?.[champ], `${nom} : aucune donnée renvoyée au Membre`).toBeTruthy();
    }
  });

  for (const op of ECRITURES) {
    // toggleBoardFavorite n'exige que la lecture : le Membre peut l'utiliser.
    if (op.niveauLecture) continue;
    test(`${op.nom} : refusé`, async ({ page }) => {
      await refusSansEffet(page, op, "membre", ORG);
    });
  }
});

/* --- Éditeur -------------------------------------------------------------- */

test.describe("Kanban : droits du rôle « Éditeur »", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_EDITEUR) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  for (const op of ECRITURES) {
    if (editeurPeut(op) || op.niveauLecture) {
      test(`${op.nom} : permis`, async ({ page }) => {
        const reponse = await appelApi(page, op.requete, op.variables(ORG, "editeur"), { organisation: ORG, delai: 15_000 });
        verifierReussite(reponse, op.champ, op.nom);
      });
    } else {
      test(`${op.nom} : refusé`, async ({ page }) => {
        await refusSansEffet(page, op, "editeur", ORG);
      });
    }
  }
});

/* --- Comptable : aucun accès au kanban ------------------------------------ */

test.describe("Kanban : le rôle « Comptable » n'a aucun accès", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_COMPTABLE) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  for (const [nom, champ, requete, variables] of LECTURES) {
    test(`Lire « ${nom} » : refusé`, async ({ page }) => {
      const reponse = await appelApi(page, requete, variables(ORG), { organisation: ORG });
      verifierRefusCollab(reponse, champ, `${nom} (comptable)`);
    });
  }
  for (const op of ECRITURES) {
    test(`${op.nom} : refusé`, async ({ page }) => {
      await refusSansEffet(page, op, "comptable", ORG);
    });
  }
});

/* --- Intrus (autre entreprise) -------------------------------------------- */

test.describe("Kanban : une autre entreprise n'atteint rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  for (const [nom, champ, requete, variables] of LECTURES) {
    test(`Lire « ${nom} » des autres : refusé`, async ({ page }) => {
      await etape(page, "En visant leur organisation", async () => {
        const reponse = await appelApi(page, requete, variables(ORG), { organisation: ORG });
        sansFuite(reponse, [TABLEAUX.lecture.title, id(TABLEAUX.lecture), TACHES.lecture1.title], `${nom} (org des autres)`);
        verifierRefusCollab(reponse, champ, `${nom} (org des autres)`);
      });
      await etape(page, "Depuis sa propre organisation, avec leurs identifiants", async () => {
        const reponse = await appelApi(page, requete, variables(ORG_INTRUS), { organisation: ORG_INTRUS });
        sansFuite(reponse, [TABLEAUX.lecture.title, id(TABLEAUX.lecture), TACHES.lecture1.title], `${nom} (depuis l'intrus)`);
      });
    });
  }
  for (const op of ECRITURES) {
    test(`${op.nom} chez les autres : refusé`, async ({ page }) => {
      await etape(page, "En visant leur organisation", () => refusSansEffet(page, op, "intrus", ORG));
      if (op.cible) {
        await etape(page, "Depuis sa propre organisation, avec leurs identifiants", () =>
          refusSansEffet(page, op, "intrus", ORG_INTRUS, { organisation: ORG_INTRUS }),
        );
      }
    });
  }
});

/* --- Visiteur sans session ------------------------------------------------ */

test.describe("Kanban : sans session, rien", () => {
  test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });
  test("Lectures et écritures refusées", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    for (const [nom, champ, requete, variables] of LECTURES) {
      const reponse = await appelApi(page, requete, variables(ORG), { organisation: ORG });
      expect.soft(reponse.data?.[champ] ?? null, `${nom} : renvoyé sans session`).toBeNull();
    }
    for (const op of ECRITURES) {
      const [collection, filtre] = op.temoin("visiteur");
      const avant = await photo(collection, filtre);
      const reponse = await appelApi(page, op.requete, op.variables(ORG, "visiteur"), { organisation: ORG });
      expect.soft(reponse.data?.[op.champ] ?? null, `${op.nom} : accepté sans session`).toBeFalsy();
      expect.soft(await photo(collection, filtre), `${op.nom} : la base a changé sans session`).toBe(avant);
    }
  });
});

/* --- Lien public : ce tableau seulement, en lecture ----------------------- */

const PUBLIC_BOARD = `query($t: String!,$s: String){ getPublicBoard(token:$t,sessionToken:$s){ success message requiresVisitorSession board{ id title columns{ id title tasks{ id title description } } } } }`;

test.describe("Kanban : le lien public ne donne que ce tableau, en lecture", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Un lien actif, avec la session du visiteur, ouvre son tableau", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    const reponse = await appelApi(page, PUBLIC_BOARD, { t: PARTAGES.actif.token, s: VISITEUR.sessionToken });
    const board = verifierReussite(reponse, "getPublicBoard", "Lien public actif");
    expect(board.board?.id, "Le lien doit ouvrir le tableau partagé").toBe(id(TABLEAUX.partage));
    expect(board.board?.title).toBe(TABLEAUX.partage.title);
  });

  test("Un lien expiré ne donne plus rien", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    const reponse = await appelApi(page, PUBLIC_BOARD, { t: PARTAGES.expire.token, s: VISITEUR.sessionToken });
    expect(reponse.data?.getPublicBoard?.success, "Un lien expiré ne doit rien ouvrir").toBe(false);
    expect(reponse.data?.getPublicBoard?.board, "Un lien expiré ne doit renvoyer aucun tableau").toBeNull();
    expect(reponse.data?.getPublicBoard?.message || "").toMatch(/expir/i);
  });

  test("Un lien révoqué (désactivé) ne donne plus rien", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    const reponse = await appelApi(page, PUBLIC_BOARD, { t: PARTAGES.revoque.token, s: VISITEUR.sessionToken });
    expect(reponse.data?.getPublicBoard?.success, "Un lien révoqué ne doit rien ouvrir").toBe(false);
    expect(reponse.data?.getPublicBoard?.board).toBeNull();
  });

  test("Le lien public ne permet aucune écriture sur le tableau", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    // Les mutations du kanban exigent une session de membre : un visiteur en est dépourvu.
    const avant = await photo("tasks", { _id: TACHES.partage._id });
    const reponse = await appelApi(
      page,
      `mutation($id: ID!){ updateTask(input:{id:$id, title:"Piraté par le visiteur"}){ id } }`,
      { id: id(TACHES.partage) },
      { organisation: ORG },
    );
    expect(reponse.data?.updateTask ?? null, "Un visiteur ne doit pas modifier une tâche").toBeNull();
    expect(await photo("tasks", { _id: TACHES.partage._id }), "La tâche a changé via le lien public").toBe(avant);
  });

  test("La session d'un visiteur ne donne pas accès à un autre tableau non partagé", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    // getPublicBoard renvoie toujours le tableau du lien, jamais un autre id passé par le visiteur.
    const reponse = await appelApi(page, PUBLIC_BOARD, { t: PARTAGES.actif.token, s: VISITEUR.sessionToken });
    const board = reponse.data?.getPublicBoard?.board;
    expect(board?.id, "Le lien ne doit ouvrir que son propre tableau").toBe(id(TABLEAUX.partage));
    expect(board?.id, "Le lien ne doit pas ouvrir le tableau de lecture interne").not.toBe(id(TABLEAUX.lecture));
  });
});

/* --- Texte piégé (XSS stockée) -------------------------------------------- */
/**
 * La description (et le titre) d'une tâche écrite par l'Éditeur contiennent du
 * HTML qui exécute du code. Ouverte par un autre membre (vues tableau, liste,
 * Gantt, modale) ou par un visiteur du lien public, rien ne doit s'exécuter :
 * sinon le code agit avec la session de la victime. La surveillance échoue sur
 * toute boîte de dialogue, et la marque posée par le code (window.__xssCollab)
 * ne doit pas apparaître.
 *
 * Défaut connu : le site rend `task.description` en HTML brut
 * (dangerouslySetInnerHTML) sans nettoyage, dans TaskCard.jsx (~l.112),
 * KanbanListView.jsx (~l.112), KanbanGanttView.jsx (~l.1180) et
 * app/public/kanban/[token]/page.jsx ; l'API ne nettoie pas non plus la
 * description. Ces tests restent rouges jusqu'à la correction.
 */
const marqueXss = (page) => page.evaluate(() => window.__xssCollab ?? null);

async function ouvrirVueKanban(page, vue) {
  await ouvrir(page, `/dashboard/outils/kanban/${id(TABLEAUX.xss)}`, {
    pret: page.getByRole("tab", { name: vue }),
  });
  await cliquer(page, page.getByRole("tab", { name: vue }));
  await page.waitForTimeout(800);
}

/** Ouvre le volet de description de la tâche piégée (la seule du tableau). */
async function ouvrirDescription(page) {
  const declencheur = page.locator("svg.lucide-align-left").first();
  if (await declencheur.count()) {
    await declencheur.click({ timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(800);
  }
}

test.describe("Kanban : un texte piégé ne s'exécute jamais (défaut connu)", () => {
  test.use({
    storageState: connecte(SESSION_TOKEN_COLLAB),
    dialoguesAttendus: /code|xss|piég/i,
  });

  for (const vue of ["List", "Board", "Gantt"]) {
    test(`Vue ${vue} : la description piégée s'affiche comme du texte`, async ({ page }) => {
      await ouvrirVueKanban(page, vue);
      await etape(page, "Ouvrir la description de la tâche piégée", () => ouvrirDescription(page), { capture: "ecran" });
      expect(await marqueXss(page), `Le code de la description s'est exécuté (vue ${vue})`).toBeNull();
    });
  }

  test("Modale de la tâche : la description piégée ne s'exécute pas", async ({ page }) => {
    await ouvrirVueKanban(page, "Board");
    await etape(
      page,
      "Ouvrir la tâche piégée",
      async () => {
        await page.getByText("texte piégé").first().click({ timeout: 5_000 }).catch(() => {});
        await page.waitForTimeout(1_000);
      },
      { capture: "ecran" },
    );
    expect(await marqueXss(page), "Le code de la description s'est exécuté dans la modale").toBeNull();
  });
});

test.describe("Kanban : texte piégé ouvert par un visiteur du lien public (défaut connu)", () => {
  test.use({
    storageState: { cookies: [], origins: [] },
    // Le temps réel du lien public (graphql-ws) et le chargement peuvent bruiter la console.
    erreursConsoleAutorisees: /graphql|websocket|ws:|subscription|401|Failed to load/i,
    dialoguesAttendus: /code|xss|piég/i,
  });

  test("La description piégée ne s'exécute pas sur la page publique", async ({ page }) => {
    // Injecter la session du visiteur comme le ferait l'authentification par e-mail.
    await page.addInitScript(
      ([cle, jeton]) => {
        try {
          window.localStorage.setItem(cle, JSON.stringify({ sessionToken: jeton, savedAt: Date.now() }));
        } catch {}
      },
      [VISITEUR.cleStockage, VISITEUR.sessionToken],
    );
    await page.goto(`/public/kanban/${PARTAGES.actif.token}`);
    await page.waitForTimeout(3_000);
    await ouvrirDescription(page);
    await page.getByText("Tâche piégée du lien public").first().click({ timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(1_500);
    expect(await marqueXss(page), "Le code de la description s'est exécuté sur le lien public").toBeNull();
  });
});

test.describe("Kanban : l'API ne nettoie pas la description (constat)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });
  test("getPublicBoard renvoie la description telle quelle (preuve de l'absence de nettoyage)", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelApi(page, PUBLIC_BOARD, { t: PARTAGES.actif.token, s: VISITEUR.sessionToken });
    const tasks = reponse.data?.getPublicBoard?.board?.columns?.flatMap((c) => c.tasks) || [];
    const piegee = tasks.find((t) => t.description?.includes("onerror"));
    expect(piegee, "La description piégée est renvoyée en HTML brut par l'API (aucun nettoyage côté serveur)").toBeTruthy();
  });
});
