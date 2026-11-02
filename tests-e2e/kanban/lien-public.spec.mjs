/**
 * Kanban : ce que le lien public d'un tableau donne à un visiteur
 * (lot-kanban.mjs), appelé comme la page /public/kanban/<jeton>.
 *   - Lien protégé par mot de passe : sans mot de passe ou avec un faux,
 *     aucun tableau ; avec le bon, le tableau et un jeton d'accès qui suffit
 *     ensuite seul ; ni le mot de passe ni son empreinte ne sont renvoyés.
 *   - Deux clients commentent le même tableau : chacun ne reçoit pas
 *     l'adresse e-mail de l'autre, ni le taux horaire des tâches.
 *   - Lien créé sans les commentaires, les pièces jointes ni les membres :
 *     rien de tout cela n'est renvoyé.
 * Le visiteur ne reçoit que sa propre adresse, ni taux horaire ni
 * identifiant interne (newbi-api src/utils/publicBoardVisitorView.js).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { appelApi, id } from "../securite.mjs";
import { sansFuite, verifierReussite } from "../securite-collaboration.mjs";
import { MOT_DE_PASSE_PARTAGE, PARTAGES_KANBAN, TABLEAUX_KANBAN, TACHES_KANBAN, VISITEURS_KANBAN, sessionVisiteur } from "../donnees/lot-kanban.mjs";

const TABLEAU_PUBLIC = `query($t: String!,$s: String,$p: String,$a: String){
  getPublicBoard(token:$t,sessionToken:$s,password:$p,accessToken:$a){
    success message requiresPassword requiresVisitorSession accessToken visitorEmail
    share{ id hasPassword permissions{ canViewComments canViewAttachments canViewAssignees canComment } }
    board{ id title members{ id name }
      tasks{ id title userId assignedMembers{ id name } images{ id url } timeTracking{ totalSeconds hourlyRate }
        comments{ id userName userEmail content isExternal } } }
  }
}`;

// Membre assigné à la tâche partagée (Éditeur listé de lot-kanban.mjs).
const MEMBRES_NOMS = "Lina Listée";

const lire = (page, variables) => appelApi(page, TABLEAU_PUBLIC, variables, { delai: 15_000 });

test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });
test.beforeEach(async ({ page }) => ouvrir(page, "/auth/login"));

/* --- Mot de passe ---------------------------------------------------------- */

test.describe("Kanban : lien public protégé par mot de passe", () => {
  const LIEN = PARTAGES_KANBAN.protege;
  const session = () => sessionVisiteur("protege", "protege");
  const SANS_EMPREINTE = [MOT_DE_PASSE_PARTAGE, LIEN.passwordHash, "$2a$", "$2b$", "passwordHash"];

  test("Sans mot de passe : aucun tableau, mot de passe demandé", async ({ page }) => {
    const reponse = await lire(page, { t: LIEN.token, s: session() });
    const resultat = reponse.data?.getPublicBoard;
    expect(resultat?.success).toBe(false);
    expect(resultat?.requiresPassword).toBe(true);
    expect(resultat?.board ?? null).toBeNull();
    sansFuite(reponse, [TABLEAUX_KANBAN.protege.title, TACHES_KANBAN.protege.title, ...SANS_EMPREINTE], "Lien protégé sans mot de passe");
  });

  test("Mot de passe faux : refusé avec un message, aucun tableau", async ({ page }) => {
    const reponse = await lire(page, { t: LIEN.token, s: session(), p: "mot-de-passe-faux" });
    const resultat = reponse.data?.getPublicBoard;
    expect(resultat?.success).toBe(false);
    expect(resultat?.message).toMatch(/Mot de passe incorrect/);
    expect(resultat?.board ?? null).toBeNull();
    expect(resultat?.accessToken ?? null).toBeNull();
    sansFuite(reponse, [TACHES_KANBAN.protege.title, ...SANS_EMPREINTE], "Lien protégé, mot de passe faux");
  });

  test("Bon mot de passe : le tableau et un jeton d'accès, qui suffit ensuite seul", async ({ page }) => {
    const reponse = await lire(page, { t: LIEN.token, s: session(), p: MOT_DE_PASSE_PARTAGE });
    const resultat = verifierReussite(reponse, "getPublicBoard", "Lien protégé, bon mot de passe");
    expect(resultat.board.id).toBe(id(TABLEAUX_KANBAN.protege));
    expect(resultat.share.hasPassword).toBe(true);
    expect(resultat.accessToken, "Un jeton d'accès doit être remis").toBeTruthy();
    sansFuite(reponse, SANS_EMPREINTE, "Lien protégé, bon mot de passe");

    await etape(page, "Le jeton seul rouvre le tableau, un jeton modifié non", async () => {
      const avecJeton = await lire(page, { t: LIEN.token, s: session(), a: resultat.accessToken });
      expect(verifierReussite(avecJeton, "getPublicBoard", "Jeton d'accès").board.id).toBe(id(TABLEAUX_KANBAN.protege));
      const jetonModifie = `${resultat.accessToken.slice(0, -2)}xx`;
      const refus = await lire(page, { t: LIEN.token, s: session(), a: jetonModifie });
      expect(refus.data?.getPublicBoard?.requiresPassword).toBe(true);
      expect(refus.data?.getPublicBoard?.board ?? null).toBeNull();
    });
  });
});

/* --- Données renvoyées au visiteur ------------------------------------------ */

test.describe("Kanban : un visiteur ne reçoit pas les données des autres visiteurs", () => {
  test("Témoin : Claire lit le tableau et les commentaires", async ({ page }) => {
    const reponse = await lire(page, { t: PARTAGES_KANBAN.clients.token, s: sessionVisiteur("claire", "clients") });
    const resultat = verifierReussite(reponse, "getPublicBoard", "Lien des clients (Claire)");
    const tache = resultat.board.tasks.find((t) => t.id === id(TACHES_KANBAN.partage));
    expect(tache.comments.map((c) => c.content)).toEqual(expect.arrayContaining(["Pouvez-vous agrandir le logo ?", "Le bouton d’appel est-il cliquable ?"]));
  });

  test("Claire ne reçoit pas l'adresse e-mail de Bruno, autre client du même tableau", async ({ page }) => {
    const reponse = await lire(page, { t: PARTAGES_KANBAN.clients.token, s: sessionVisiteur("claire", "clients") });
    verifierReussite(reponse, "getPublicBoard", "Lien des clients (Claire)");
    sansFuite(reponse, [VISITEURS_KANBAN.bruno.email], "getPublicBoard (Claire)");
  });

  test("Le taux horaire des tâches n'est pas renvoyé au visiteur", async ({ page }) => {
    const reponse = await lire(page, { t: PARTAGES_KANBAN.clients.token, s: sessionVisiteur("claire", "clients") });
    const resultat = verifierReussite(reponse, "getPublicBoard", "Lien des clients (Claire)");
    const tache = resultat.board.tasks.find((t) => t.id === id(TACHES_KANBAN.partage));
    expect(tache.timeTracking?.hourlyRate ?? null, "Taux horaire renvoyé au visiteur").toBeNull();
  });

  test("Les identifiants internes du propriétaire ne sont pas renvoyés au visiteur", async ({ page }) => {
    const reponse = await lire(page, { t: PARTAGES_KANBAN.clients.token, s: sessionVisiteur("claire", "clients") });
    const resultat = verifierReussite(reponse, "getPublicBoard", "Lien des clients (Claire)");
    for (const tache of resultat.board.tasks) expect(tache.userId ?? null, `userId de « ${tache.title} » renvoyé`).toBeNull();
  });
});

test.describe("Kanban : un lien sans commentaires, pièces jointes ni membres ne les renvoie pas", () => {
  test("Permissions du lien appliquées par l'API", async ({ page }) => {
    const reponse = await lire(page, { t: PARTAGES_KANBAN.reduit.token, s: sessionVisiteur("claire", "reduit") });
    const resultat = verifierReussite(reponse, "getPublicBoard", "Lien aux permissions réduites");
    expect(resultat.share.permissions).toMatchObject({ canViewComments: false, canViewAttachments: false, canViewAssignees: false });
    const tache = resultat.board.tasks.find((t) => t.id === id(TACHES_KANBAN.partage));
    expect.soft(tache.comments ?? [], "Commentaires renvoyés malgré canViewComments: false").toEqual([]);
    expect.soft(tache.images ?? [], "Pièces jointes renvoyées malgré canViewAttachments: false").toEqual([]);
    expect.soft(tache.assignedMembers ?? [], "Membres assignés renvoyés malgré canViewAssignees: false").toEqual([]);
    sansFuite(reponse, ["Logo agrandi, à valider", "Pouvez-vous agrandir le logo ?", MEMBRES_NOMS], "Lien aux permissions réduites");
  });
});
