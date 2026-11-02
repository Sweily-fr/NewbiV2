/**
 * Kanban : tableau réservé à une liste de membres (« Projet RH
 * confidentiel », lot-kanban.mjs). Le site présente la liste comme une
 * restriction d'accès : un Éditeur absent de la liste ne doit ni lire ni
 * modifier le tableau, par aucune opération de l'API (colonnes, tâches,
 * recherche, modification, déplacement, commentaire, lien public, visiteurs
 * invités). Réponse « introuvable », aucune donnée du tableau, base
 * inchangée.
 *
 * La liste est appliquée par toutes ces opérations (newbi-api
 * src/services/kanbanBoardAccess.js), pas seulement par `boards` et `board`.
 * Contrôles : le propriétaire, l'Éditeur listé et l'Administrateur y ont
 * accès.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte } from "../config.mjs";
import { appelApi, id } from "../securite.mjs";
import { refusSansEffet, verifierRefusCollab, verifierReussite, sansFuite } from "../securite-collaboration.mjs";
import { KANBAN, MEMBRES_KANBAN, TABLEAUX_KANBAN, COLONNES_KANBAN, TACHES_KANBAN } from "../donnees/lot-kanban.mjs";

const ORG = id(KANBAN.organisation);
const T = TACHES_KANBAN;
const TABLEAU = TABLEAUX_KANBAN.restreint;

// Ce qui ne doit jamais sortir du tableau pour un membre absent de la liste.
const SECRETS = [TABLEAU.title, T.restreintLire.title, "48 000", "Ne pas diffuser avant validation"];

const LECTURES = [
  ["Un tableau", "board", `query($w: ID,$id: ID!){ board(workspaceId:$w,id:$id){ id title } }`, { id: id(TABLEAU) }],
  ["Les colonnes", "columns", `query($w: ID,$b: ID!){ columns(workspaceId:$w,boardId:$b){ id title } }`, { b: id(TABLEAU) }],
  ["Les tâches", "tasks", `query($w: ID,$b: ID!){ tasks(workspaceId:$w,boardId:$b){ id title description comments{ content } } }`, { b: id(TABLEAU) }],
  ["Une tâche", "task", `query($w: ID,$id: ID!){ task(workspaceId:$w,id:$id){ id title description comments{ content } } }`, { id: id(T.restreintLire) }],
  ["Les tâches du tableau (recherche)", "searchTasks", `query($w: ID,$b: ID){ searchTasks(workspaceId:$w,boardId:$b){ id title boardTitle } }`, { b: id(TABLEAU) }],
  ["Les visiteurs invités du tableau", "getInvitedUsersForBoard", `query($w: ID,$b: ID!){ getInvitedUsersForBoard(workspaceId:$w,boardId:$b){ id email } }`, { b: id(TABLEAU) }],
];

const ECRITURES = [
  {
    nom: "Modifier une tâche",
    champ: "updateTask",
    requete: `mutation($w: ID,$input: UpdateTaskInput!){ updateTask(workspaceId:$w,input:$input){ id title } }`,
    variables: (w) => ({ w, input: { id: id(T.restreintModifier), title: "Modifiée hors liste" } }),
    temoin: () => ["tasks", { _id: T.restreintModifier._id }],
  },
  {
    nom: "Déplacer une tâche",
    champ: "moveTask",
    requete: `mutation($w: ID,$id: ID!,$c: String!){ moveTask(workspaceId:$w,id:$id,columnId:$c,position:0){ id columnId } }`,
    variables: (w) => ({ w, id: id(T.restreintDeplacer), c: id(COLONNES_KANBAN.restreintEnCours) }),
    temoin: () => ["tasks", { _id: T.restreintDeplacer._id }],
  },
  {
    nom: "Commenter une tâche",
    champ: "addComment",
    requete: `mutation($w: ID,$t: ID!){ addComment(workspaceId:$w,taskId:$t,input:{content:"Commentaire hors liste"}){ id } }`,
    variables: (w) => ({ w, t: id(T.restreintCommenter) }),
    temoin: () => ["tasks", { _id: T.restreintCommenter._id }],
  },
  {
    nom: "Créer une tâche dans le tableau",
    champ: "createTask",
    requete: `mutation($w: ID,$input: CreateTaskInput!){ createTask(workspaceId:$w,input:$input){ id } }`,
    variables: (w) => ({
      w,
      input: { title: "Tâche ajoutée hors liste", boardId: id(TABLEAU), columnId: id(COLONNES_KANBAN.restreintAfaire), status: id(COLONNES_KANBAN.restreintAfaire) },
    }),
    temoin: () => ["tasks", { boardId: TABLEAU._id }],
  },
  {
    nom: "Publier le tableau par un lien public",
    champ: "createPublicShare",
    requete: `mutation($w: ID,$input: CreatePublicShareInput!){ createPublicShare(workspaceId:$w,input:$input){ id token } }`,
    variables: (w) => ({ w, input: { boardId: id(TABLEAU), name: "Lien hors liste" } }),
    temoin: () => ["publicboardshares", { boardId: TABLEAU._id }],
  },
];

test.describe("Kanban : un Éditeur absent de la liste d'un tableau restreint n'y a pas accès", () => {
  test.use({ storageState: connecte(MEMBRES_KANBAN.editeurHors.token) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Le tableau n'apparaît pas dans sa liste et s'ouvre « introuvable »", async ({ page }) => {
    const liste = verifierReussite(await appelApi(page, `query($w: ID){ boards(workspaceId:$w){ id title } }`, { w: ORG }, { organisation: ORG }), "boards", "Liste des tableaux");
    expect(liste.map((b) => b.id), "Le tableau restreint est listé").not.toContain(id(TABLEAU));
    const reponse = await appelApi(page, LECTURES[0][2], { w: ORG, ...LECTURES[0][3] }, { organisation: ORG });
    verifierRefusCollab(reponse, "board", "Un tableau restreint");
  });

  for (const [nom, champ, requete, variables] of LECTURES.slice(1)) {
    test(`${nom} : introuvable, rien de son contenu`, async ({ page }) => {
      const reponse = await appelApi(page, requete, { w: ORG, ...variables }, { organisation: ORG, delai: 15_000 });
      sansFuite(reponse, SECRETS, `${nom} (Éditeur hors liste)`);
      verifierRefusCollab(reponse, champ, `${nom} (Éditeur hors liste)`);
    });
  }

  test("La recherche dans l'espace ne renvoie aucune tâche du tableau", async ({ page }) => {
    const reponse = await appelApi(page, `query($w: ID,$s: String){ searchTasks(workspaceId:$w,search:$s){ id title boardTitle } }`, { w: ORG, s: "confidentiel" }, { organisation: ORG });
    sansFuite(reponse, SECRETS, "searchTasks (Éditeur hors liste)");
  });

  for (const op of ECRITURES) {
    test(`${op.nom} : refusé, base inchangée`, async ({ page }) => {
      const reponse = await refusSansEffet(page, op, "Éditeur hors liste", ORG);
      sansFuite(reponse, SECRETS, `${op.nom} (Éditeur hors liste)`);
    });
  }
});

test.describe("Kanban : le tableau restreint reste ouvert à ses membres", () => {
  test.describe("Éditeur listé", () => {
    test.use({ storageState: connecte(MEMBRES_KANBAN.editeurListe.token) });
    test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

    test("Lit les tâches et en modifie une", async ({ page }) => {
      const taches = verifierReussite(await appelApi(page, LECTURES[2][2], { w: ORG, ...LECTURES[2][3] }, { organisation: ORG }), "tasks", "Tâches (Éditeur listé)");
      expect(taches.map((t) => t.title)).toContain(T.restreintLire.title);
      await etape(page, "Modifier une tâche du tableau", async () => {
        const titre = "Tâche relue par l'Éditeur listé";
        const reponse = await appelApi(
          page,
          ECRITURES[0].requete,
          { w: ORG, input: { id: id(T.restreintListe), title: titre } },
          { organisation: ORG, delai: 15_000 },
        );
        expect(verifierReussite(reponse, "updateTask", "Modifier (Éditeur listé)").title).toBe(titre);
      });
    });
  });

  test.describe("Administrateur", () => {
    test.use({ storageState: connecte(MEMBRES_KANBAN.admin.token) });
    test("Ouvre le tableau restreint", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const reponse = await appelApi(page, LECTURES[0][2], { w: ORG, ...LECTURES[0][3] }, { organisation: ORG });
      expect(verifierReussite(reponse, "board", "Tableau (Administrateur)").title).toBe(TABLEAU.title);
    });
  });

  test.describe("Propriétaire", () => {
    test.use({ storageState: connecte(KANBAN.token) });
    test("Voit le tableau restreint dans sa liste et l'ouvre à l'écran", async ({ page }) => {
      await ouvrir(page, `/dashboard/outils/kanban/${id(TABLEAU)}`, { pret: page.getByText(T.restreintLire.title).first() });
      // Titre jamais modifié par un autre test (le commentaire ne change pas le titre).
      await expect(page.getByText(T.restreintCommenter.title).first()).toBeVisible();
    });
  });
});
