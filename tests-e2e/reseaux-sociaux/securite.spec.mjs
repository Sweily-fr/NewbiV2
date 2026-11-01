/**
 * Posts réseaux sociaux (programmés depuis le kanban) : droits vérifiés à
 * l'API, opération par opération, avec la session du navigateur.
 *   - lecture des posts : lecture du kanban, et accès au tableau comme la
 *     requête `board` (un tableau restreint n'est lu que par son
 *     propriétaire, ses membres listés et l'Administrateur) ;
 *   - programmer : création dans le kanban ; modifier, annuler, réessayer :
 *     modification ; comptes (connecter, déconnecter, actualiser) : droit
 *     « Applications et banques » ;
 *   - « Membre » : lit, ne modifie rien ; « Comptable » : aucun accès au
 *     kanban ; une autre entreprise : refus, et « introuvable » en visant les
 *     données des autres depuis son espace ; sans session : rien.
 * En CI, aucun fournisseur de publication n'est configuré : une écriture
 * permise par les droits s'arrête sur « pas encore disponible », sans rien
 * créer. Les comptes et médias d'un autre espace et la limite mensuelle de
 * posts X sont vérifiés par les tests de l'API (fournisseur simulé).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte } from "../config.mjs";
import { appelApi, id } from "../securite.mjs";
import { refusSansEffet, verifierRefusCollab, verifierReussite, sansFuite, photo, messagesDe } from "../securite-collaboration.mjs";
import {
  COMPTES_RESEAUX,
  MEMBRES_RESEAUX,
  TABLEAUX_RESEAUX,
  COLONNES_RESEAUX,
  CARTES_RESEAUX,
  COMPTES_SOCIAUX,
  MEDIAS_RESEAUX,
  POSTS_RESEAUX,
} from "../donnees/lot-reseaux-sociaux.mjs";

const ORG = id(COMPTES_RESEAUX.proprietaire.organisation);
const ORG_AUTRE = id(COMPTES_RESEAUX.autre.organisation);
const PAS_DISPONIBLE = /pas encore disponible/;

/* --- Lectures ------------------------------------------------------------- */

const STATUT = `query($w: ID){ socialPublishingStatus(workspaceId:$w){ enabled canManageAccounts canSchedule platforms accounts{ id } } }`;
const POSTS_DU_TABLEAU = `query($w: ID,$b: ID!){ boardSocialPosts(workspaceId:$w,boardId:$b){ id content status targets{ platform username } } }`;
const UN_POST = `query($w: ID,$id: ID!){ socialPost(workspaceId:$w,id:$id){ id content } }`;

const lirePosts = (page, tableau, w = ORG) => appelApi(page, POSTS_DU_TABLEAU, { w, b: id(tableau) }, { organisation: w, delai: 15_000 });
const lirePost = (page, post, w = ORG) => appelApi(page, UN_POST, { w, id: id(post) }, { organisation: w, delai: 15_000 });

/* --- Écritures -------------------------------------------------------------- */

const dans = (jours) => new Date(Date.now() + jours * 86_400_000).toISOString();
const tachesDuTableau = (tableau) => ["tasks", { boardId: tableau._id }];

const ECRITURES = [
  {
    nom: "Programmer un post",
    droit: "create",
    champ: "scheduleSocialPost",
    requete: `mutation($w: ID,$input: ScheduleSocialPostInput!){ scheduleSocialPost(workspaceId:$w,input:$input){ post{ id } task{ id } } }`,
    variables: (w, qui) => ({
      w,
      input: {
        boardId: id(TABLEAUX_RESEAUX.ouvert),
        columnId: id(COLONNES_RESEAUX.ouvert),
        accountIds: [id(COMPTES_SOCIAUX.linkedin)],
        mediaIds: [id(MEDIAS_RESEAUX.image)],
        content: `Post programmé par ${qui}`,
        scheduledFor: dans(2),
      },
    }),
    // Ni carte ni post créés sur le tableau.
    temoin: () => tachesDuTableau(TABLEAUX_RESEAUX.ouvert),
    temoinPosts: () => ["socialposts", { boardId: TABLEAUX_RESEAUX.ouvert._id }],
  },
  {
    nom: "Modifier un post",
    droit: "edit",
    champ: "updateSocialPost",
    requete: `mutation($w: ID,$id: ID!,$input: UpdateSocialPostInput!){ updateSocialPost(workspaceId:$w,id:$id,input:$input){ id } }`,
    variables: (w, qui) => ({ w, id: id(POSTS_RESEAUX.ouvert), input: { content: `Modifié par ${qui}` } }),
    temoin: () => ["socialposts", { _id: POSTS_RESEAUX.ouvert._id }],
  },
  {
    nom: "Annuler un post",
    droit: "edit",
    champ: "cancelSocialPost",
    requete: `mutation($w: ID,$id: ID!){ cancelSocialPost(workspaceId:$w,id:$id){ id status } }`,
    variables: (w) => ({ w, id: id(POSTS_RESEAUX.ouvert) }),
    temoin: () => ["socialposts", { _id: POSTS_RESEAUX.ouvert._id }],
  },
  {
    nom: "Republier un post en échec",
    droit: "edit",
    champ: "retrySocialPost",
    requete: `mutation($w: ID,$id: ID!){ retrySocialPost(workspaceId:$w,id:$id){ id status } }`,
    variables: (w) => ({ w, id: id(POSTS_RESEAUX.ouvert) }),
    temoin: () => ["socialposts", { _id: POSTS_RESEAUX.ouvert._id }],
  },
  {
    nom: "Connecter un compte",
    droit: "integrations",
    champ: "connectSocialAccount",
    requete: `mutation($w: ID){ connectSocialAccount(workspaceId:$w,platform:"linkedin",returnTo:"/dashboard/outils/kanban"){ } }`.replace("{ }", ""),
    variables: (w) => ({ w }),
    temoin: () => ["socialconnectstates", { workspaceId: COMPTES_RESEAUX.proprietaire.organisation._id, platform: "linkedin" }],
  },
  {
    nom: "Déconnecter un compte",
    droit: "integrations",
    champ: "disconnectSocialAccount",
    requete: `mutation($w: ID,$a: ID!){ disconnectSocialAccount(workspaceId:$w,accountId:$a) }`,
    variables: (w) => ({ w, a: id(COMPTES_SOCIAUX.linkedin) }),
    temoin: () => ["socialaccounts", { _id: COMPTES_SOCIAUX.linkedin._id }],
  },
  {
    nom: "Actualiser les comptes",
    droit: "integrations",
    champ: "refreshSocialAccounts",
    requete: `mutation($w: ID){ refreshSocialAccounts(workspaceId:$w){ id } }`,
    variables: (w) => ({ w }),
    temoin: () => ["socialaccounts", { workspaceId: COMPTES_RESEAUX.proprietaire.organisation._id }],
  },
];

/** Appel refusé : refus explicite, ni carte ni post créés (programmer), base inchangée. */
async function refusSansCreation(page, op, qui, w, options) {
  const postsAvant = op.temoinPosts ? await photo(...op.temoinPosts()) : null;
  const reponse = await refusSansEffet(page, op, qui, w, options);
  if (op.temoinPosts) expect(await photo(...op.temoinPosts()), `${op.nom} (${qui}) : un post a été créé`).toBe(postsAvant);
  return reponse;
}

/* --- Membre (lecture seule) ----------------------------------------------- */

test.describe("Réseaux sociaux : droits du rôle « Membre » (lecture seule)", () => {
  test.use({ storageState: connecte(MEMBRES_RESEAUX.membre.token) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Lit les posts d'un tableau ouvert à l'espace, sans pouvoir programmer", async ({ page }) => {
    const posts = verifierReussite(await lirePosts(page, TABLEAUX_RESEAUX.ouvert), "boardSocialPosts", "Posts du tableau (Membre)");
    expect(posts.map((p) => p.id)).toEqual([id(POSTS_RESEAUX.ouvert)]);
    expect(posts[0].content).toBe(POSTS_RESEAUX.ouvert.content);
    const statut = verifierReussite(await appelApi(page, STATUT, { w: ORG }, { organisation: ORG }), "socialPublishingStatus", "Statut (Membre)");
    expect(statut.canSchedule, "Le Membre ne doit pas pouvoir programmer").toBe(false);
    expect(statut.canManageAccounts, "Le Membre ne doit pas gérer les comptes").toBe(false);
  });

  test("Tableau restreint au propriétaire : posts introuvables", async ({ page }) => {
    const reponse = await lirePosts(page, TABLEAUX_RESEAUX.restreint);
    sansFuite(reponse, [POSTS_RESEAUX.restreint.content], "Posts d'un tableau restreint (Membre)");
    verifierRefusCollab(reponse, "boardSocialPosts", "Posts d'un tableau restreint (Membre)");
    expect((await lirePost(page, POSTS_RESEAUX.restreint)).data?.socialPost ?? null, "Post d'un tableau restreint lu par le Membre").toBeNull();
  });

  for (const op of ECRITURES) {
    test(`${op.nom} : refusé`, async ({ page }) => {
      await refusSansCreation(page, op, "membre", ORG);
    });
  }
});

/* --- Éditeur -------------------------------------------------------------- */

test.describe("Réseaux sociaux : droits du rôle « Éditeur »", () => {
  test.use({ storageState: connecte(MEMBRES_RESEAUX.editeur.token) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Lit les posts d'un tableau ouvert ; peut programmer, sans gérer les comptes", async ({ page }) => {
    const posts = verifierReussite(await lirePosts(page, TABLEAUX_RESEAUX.ouvert), "boardSocialPosts", "Posts du tableau (Éditeur)");
    expect(posts.map((p) => p.id)).toEqual([id(POSTS_RESEAUX.ouvert)]);
    expect(posts[0].targets).toEqual([{ platform: "linkedin", username: COMPTES_SOCIAUX.linkedin.username }]);
    const statut = verifierReussite(await appelApi(page, STATUT, { w: ORG }, { organisation: ORG }), "socialPublishingStatus", "Statut (Éditeur)");
    expect(statut.canSchedule, "L'Éditeur peut programmer (création dans le kanban)").toBe(true);
    expect(statut.canManageAccounts, "L'Éditeur n'a pas « Applications et banques »").toBe(false);
    expect(statut.enabled, "Aucun fournisseur de publication en CI").toBe(false);
  });

  test("Tableau restreint dont il n'est pas membre : posts introuvables", async ({ page }) => {
    const reponse = await lirePosts(page, TABLEAUX_RESEAUX.restreint);
    sansFuite(reponse, [POSTS_RESEAUX.restreint.content], "Posts d'un tableau restreint (Éditeur)");
    verifierRefusCollab(reponse, "boardSocialPosts", "Posts d'un tableau restreint (Éditeur)");
    const post = await lirePost(page, POSTS_RESEAUX.restreint);
    sansFuite(post, [POSTS_RESEAUX.restreint.content], "Post d'un tableau restreint (Éditeur)");
    expect(post.data?.socialPost ?? null, "Post d'un tableau restreint lu par l'Éditeur").toBeNull();
  });

  test("Données d'une autre entreprise visées depuis son espace : introuvables", async ({ page }) => {
    const posts = await lirePosts(page, TABLEAUX_RESEAUX.autre);
    sansFuite(posts, [POSTS_RESEAUX.autre.content], "Posts du tableau d'une autre entreprise");
    verifierRefusCollab(posts, "boardSocialPosts", "Posts du tableau d'une autre entreprise");
    const post = await lirePost(page, POSTS_RESEAUX.autre);
    sansFuite(post, [POSTS_RESEAUX.autre.content], "Post d'une autre entreprise");
    expect(post.data?.socialPost ?? null).toBeNull();
  });

  test("Programmer un post : sans fournisseur configuré, refus clair et rien de créé", async ({ page }) => {
    const op = ECRITURES[0];
    const [collection, filtre] = op.temoin();
    const avant = await photo(collection, filtre);
    const postsAvant = await photo(...op.temoinPosts());
    const reponse = await appelApi(page, op.requete, op.variables(ORG, "editeur"), { organisation: ORG, delai: 15_000 });
    expect(reponse.data?.scheduleSocialPost ?? null).toBeNull();
    expect(messagesDe(reponse), "Le refus doit dire que la publication n'est pas disponible").toMatch(PAS_DISPONIBLE);
    expect(await photo(collection, filtre), "Une carte a été créée malgré le refus").toBe(avant);
    expect(await photo(...op.temoinPosts()), "Un post a été créé malgré le refus").toBe(postsAvant);
  });

  for (const op of ECRITURES.filter((o) => o.droit === "integrations")) {
    test(`${op.nom} : refusé (sans « Applications et banques »)`, async ({ page }) => {
      await refusSansEffet(page, op, "editeur", ORG);
    });
  }
});

/* --- Administrateur -------------------------------------------------------- */

test.describe("Réseaux sociaux : l'Administrateur lit un tableau restreint", () => {
  test.use({ storageState: connecte(MEMBRES_RESEAUX.admin.token) });

  test("Posts d'un tableau restreint lus par l'Administrateur (niveau suppression du kanban)", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const posts = verifierReussite(await lirePosts(page, TABLEAUX_RESEAUX.restreint), "boardSocialPosts", "Posts restreints (Administrateur)");
    expect(posts.map((p) => p.id)).toEqual([id(POSTS_RESEAUX.restreint)]);
  });
});

/* --- Propriétaire ------------------------------------------------------------ */

test.describe("Réseaux sociaux : le propriétaire", () => {
  test.use({ storageState: connecte(COMPTES_RESEAUX.proprietaire.token) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Lit son tableau restreint et ses posts ; gère les comptes", async ({ page }) => {
    const posts = verifierReussite(await lirePosts(page, TABLEAUX_RESEAUX.restreint), "boardSocialPosts", "Posts restreints (propriétaire)");
    expect(posts.map((p) => p.id)).toEqual([id(POSTS_RESEAUX.restreint)]);
    const post = verifierReussite(await lirePost(page, POSTS_RESEAUX.restreint), "socialPost", "Post restreint (propriétaire)");
    expect(post.content).toBe(POSTS_RESEAUX.restreint.content);
    const statut = verifierReussite(await appelApi(page, STATUT, { w: ORG }, { organisation: ORG }), "socialPublishingStatus", "Statut (propriétaire)");
    expect(statut.canManageAccounts).toBe(true);
    expect(statut.canSchedule).toBe(true);
  });

  test("Connecter un compte : sans fournisseur configuré, refus clair et aucun parcours ouvert", async ({ page }) => {
    const op = ECRITURES.find((o) => o.champ === "connectSocialAccount");
    const [collection, filtre] = op.temoin();
    const avant = await photo(collection, filtre);
    const reponse = await appelApi(page, op.requete, op.variables(ORG), { organisation: ORG, delai: 15_000 });
    expect(reponse.data?.connectSocialAccount ?? null).toBeNull();
    expect(messagesDe(reponse)).toMatch(PAS_DISPONIBLE);
    expect(await photo(collection, filtre), "Un parcours de connexion a été ouvert").toBe(avant);
  });
});

/* --- Comptable : aucun accès au kanban ------------------------------------ */

test.describe("Réseaux sociaux : le rôle « Comptable » n'a aucun accès", () => {
  test.use({ storageState: connecte(MEMBRES_RESEAUX.comptable.token) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Statut, posts d'un tableau et post : refusés", async ({ page }) => {
    verifierRefusCollab(await appelApi(page, STATUT, { w: ORG }, { organisation: ORG }), "socialPublishingStatus", "Statut (Comptable)");
    const posts = await lirePosts(page, TABLEAUX_RESEAUX.ouvert);
    sansFuite(posts, [POSTS_RESEAUX.ouvert.content], "Posts (Comptable)");
    verifierRefusCollab(posts, "boardSocialPosts", "Posts (Comptable)");
    const post = await lirePost(page, POSTS_RESEAUX.ouvert);
    sansFuite(post, [POSTS_RESEAUX.ouvert.content], "Post (Comptable)");
    verifierRefusCollab(post, "socialPost", "Post (Comptable)");
  });

  for (const op of ECRITURES) {
    test(`${op.nom} : refusé`, async ({ page }) => {
      await refusSansCreation(page, op, "comptable", ORG);
    });
  }
});

/* --- Autre entreprise ------------------------------------------------------- */

test.describe("Réseaux sociaux : une autre entreprise n'atteint rien", () => {
  test.use({ storageState: connecte(COMPTES_RESEAUX.autre.token) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Lire les posts des autres : refusé, et introuvable depuis son espace", async ({ page }) => {
    await etape(page, "En visant leur espace", async () => {
      const posts = await lirePosts(page, TABLEAUX_RESEAUX.ouvert);
      sansFuite(posts, [POSTS_RESEAUX.ouvert.content, COMPTES_SOCIAUX.linkedin.username], "Posts des autres (leur espace)");
      verifierRefusCollab(posts, "boardSocialPosts", "Posts des autres (leur espace)");
      verifierRefusCollab(await appelApi(page, STATUT, { w: ORG }, { organisation: ORG }), "socialPublishingStatus", "Statut des autres");
    });
    await etape(page, "Depuis son espace, avec leurs identifiants", async () => {
      const posts = await lirePosts(page, TABLEAUX_RESEAUX.ouvert, ORG_AUTRE);
      sansFuite(posts, [POSTS_RESEAUX.ouvert.content], "Posts des autres (son espace)");
      verifierRefusCollab(posts, "boardSocialPosts", "Posts des autres (son espace)");
      const post = await lirePost(page, POSTS_RESEAUX.ouvert, ORG_AUTRE);
      sansFuite(post, [POSTS_RESEAUX.ouvert.content], "Post des autres (son espace)");
      expect(post.data?.socialPost ?? null).toBeNull();
    });
    await etape(page, "Ses propres posts restent lisibles", async () => {
      const posts = verifierReussite(await lirePosts(page, TABLEAUX_RESEAUX.autre, ORG_AUTRE), "boardSocialPosts", "Ses posts");
      expect(posts.map((p) => p.id)).toEqual([id(POSTS_RESEAUX.autre)]);
    });
  });

  for (const op of ECRITURES) {
    test(`${op.nom} chez les autres : refusé`, async ({ page }) => {
      await etape(page, "En visant leur espace", () => refusSansCreation(page, op, "intrus", ORG));
      await etape(page, "Depuis son espace, avec leurs identifiants", () =>
        refusSansCreation(page, op, "intrus", ORG_AUTRE, { organisation: ORG_AUTRE }),
      );
    });
  }
});

/* --- Sans session ---------------------------------------------------------- */

test.describe("Réseaux sociaux : sans session, rien", () => {
  test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });

  test("Lectures et écritures refusées", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    for (const [nom, champ, reponse] of [
      ["Statut", "socialPublishingStatus", await appelApi(page, STATUT, { w: ORG }, { organisation: ORG })],
      ["Posts du tableau", "boardSocialPosts", await lirePosts(page, TABLEAUX_RESEAUX.ouvert)],
      ["Un post", "socialPost", await lirePost(page, POSTS_RESEAUX.ouvert)],
    ]) {
      expect.soft(reponse.data?.[champ] ?? null, `${nom} : renvoyé sans session`).toBeNull();
      sansFuite(reponse, [POSTS_RESEAUX.ouvert.content], `${nom} sans session`);
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
