/**
 * Membres, invitations et rôles : droits vérifiés au serveur, pas seulement
 * à l'écran. Chaque opération est appelée directement avec la session du
 * navigateur, comme le ferait quelqu'un qui contourne l'interface :
 *   - routes du plugin organisation de Better Auth (site) : inviter, changer
 *     un rôle, retirer, annuler une invitation, modifier ou supprimer l'espace ;
 *   - opérations GraphQL de l'API : rôles personnalisés, transfert du rôle de
 *     super admin, droits de l'utilisateur ;
 *   - routes du site /api/organizations/<espace>/… (membres, sièges, abonnement).
 * Rôles de l'espace « Paramètres » (Administrateur, Éditeur, Membre,
 * Comptable, « Recrutement » qui peut inviter), rôle « Gestion d'équipe »
 * d'« Équipe », intrus (autre entreprise) et visiteur sans session. Un refus
 * doit être explicite et la base ne doit pas bouger.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { appelApi } from "../securite.mjs";
import {
  connecte,
  SESSION_TOKEN_ADMIN_PARAMETRES,
  SESSION_TOKEN_COMPTABLE_PARAMETRES,
  SESSION_TOKEN_EDITEUR_PARAMETRES,
  SESSION_TOKEN_EQUIPE,
  SESSION_TOKEN_GESTION_EQUIPE,
  SESSION_TOKEN_INTRUS,
  SESSION_TOKEN_MEMBRE_PARAMETRES,
  SESSION_TOKEN_RECRUTEUR_PARAMETRES,
} from "../config.mjs";
import { COMPTES, MEMBRES, oid } from "../donnees/base.mjs";
import { COMPTES_AUTH, INVITATIONS, MEMBRES_CIBLES, ROLES_PERSO } from "../donnees/lot-parametres-auth.mjs";
import { appelAuth, appelSite } from "../authentification/outils-auth.mjs";

/**
 * Les refus de Better Auth et des routes du site sont des réponses HTTP 4xx,
 * que le navigateur écrit dans la console : attendues ici.
 */
const REFUS_CONSOLE = /status of 4\d\d.*\/api\/(auth|organizations)\//;
/** Page légère du site : les appels partent de son origine, avec la session du navigateur. */
const surLeSite = (page) => ouvrir(page, "/mentions-legales");

const PARAMETRES = COMPTES.parametres;
const EQUIPE = COMPTES.equipe;
const INTRUS = COMPTES.intrus;
const hex = (x) => (typeof x === "string" ? x : x.toHexString());
const idInvitation = (cle) => oid("invitationAuth", INVITATIONS[cle].n);
const idCible = (cle) => oid("membreAuth", MEMBRES_CIBLES[cle].n);

/** Adhésion d'un utilisateur à un espace (les membres du socle ont un id calculé à l'écriture). */
async function adhesion(userId, orgId) {
  const m = await (await base()).collection("member").findOne({ userId, organizationId: orgId });
  if (!m) throw new Error(`Adhésion introuvable (${hex(userId)} dans ${hex(orgId)})`);
  return m._id;
}

/** Document(s) tels qu'en base, sans la date de mise à jour : un refus ne doit rien changer. */
async function photo([collection, filtre]) {
  const docs = await (await base()).collection(collection).find(filtre).sort({ _id: 1 }).toArray();
  return JSON.stringify(docs.map(({ updatedAt, ...d }) => d));
}

const REFUS = /pas membre|FORBIDDEN|UNAUTHORIZED|UNAUTHENTICATED|NOT_FOUND|BAD_REQUEST|permission|autoris|droit|acc[eè]s|interdit|introuvable|non trouv|not found|not allowed|not a member|n'est pas membre|ne permet pas|super admin|cannot|recipient|ne s'attribue|Rôles se gèrent|rôles se gèrent|Seul|own role|propre rôle|invalide|invalid/i;

/** Message d'erreur d'une réponse (Better Auth ou GraphQL). */
function messageDe(reponse) {
  if (reponse.errors) return reponse.errors.map((e) => `${e.extensions?.code || ""} ${e.message}`).join(" | ");
  const c = reponse.corps;
  return typeof c === "string" ? c : `${c?.code || ""} ${c?.message || c?.error || ""}`;
}

/** L'opération a été refusée (Better Auth : statut d'erreur ; GraphQL : erreur et aucune donnée). */
function estRefuse(op, reponse) {
  if (op.api) {
    const valeur = reponse.data?.[op.api.champ];
    return (valeur === null || valeur === undefined) && reponse.errors.length > 0;
  }
  return reponse.statut >= 400;
}

/** Contexte d'un appel : qui, l'espace visé (en-tête ou paramètre) et les données visées. */
async function contexte(qui, cibleOrg, depuisOrg = cibleOrg) {
  const cibles =
    hex(cibleOrg._id) === hex(EQUIPE.organisation._id)
      ? { membre: idCible("intrus"), invitation: idInvitation("intrus"), role: ROLES_PERSO.gestionEquipe.role }
      : { membre: idCible("parametres"), invitation: idInvitation("attenteParametres"), role: ROLES_PERSO.recrutement.role };
  return {
    qui,
    org: hex(depuisOrg._id),
    orgVisee: cibleOrg._id,
    ...cibles,
    proprietaire: await adhesion(cibleOrg === EQUIPE.organisation ? EQUIPE.utilisateur._id : PARAMETRES.utilisateur._id, cibleOrg._id),
  };
}

/**
 * Écritures. `droit` : action de la page « Membres » (team) ou des
 * informations (orgSettings) requise ; `personne` : refusée à tous, même au
 * super admin (règles de l'espace) ; `soi` : vise l'adhésion de l'appelant.
 */
const ECRITURES = [
  {
    nom: "Inviter un membre",
    droit: "invite",
    auth: (c) => ["/organization/invite-member", { email: `invite-par-${c.qui}@e2e.test`, role: "viewer", organizationId: c.org }],
    temoin: (c) => ["invitation", { email: `invite-par-${c.qui}@e2e.test` }],
  },
  {
    nom: "Inviter quelqu'un comme super admin",
    personne: true,
    auth: (c) => ["/organization/invite-member", { email: `super-admin-par-${c.qui}@e2e.test`, role: "owner", organizationId: c.org }],
    temoin: (c) => ["invitation", { email: `super-admin-par-${c.qui}@e2e.test` }],
  },
  {
    nom: "Changer le rôle d'un membre",
    droit: "changeRole",
    cible: true,
    auth: (c) => ["/organization/update-member-role", { memberId: hex(c.membre), role: "member", organizationId: c.org }],
    temoin: (c) => ["member", { _id: c.membre }],
  },
  {
    nom: "Se donner le rôle Administrateur",
    personne: true,
    soi: true,
    auth: (c) => ["/organization/update-member-role", { memberId: hex(c.soi), role: "admin", organizationId: c.org }],
    temoin: (c) => ["member", { _id: c.soi }],
  },
  {
    nom: "Donner le rôle de super admin à un membre",
    personne: true,
    cible: true,
    auth: (c) => ["/organization/update-member-role", { memberId: hex(c.membre), role: "owner", organizationId: c.org }],
    temoin: (c) => ["member", { _id: c.membre }],
  },
  {
    nom: "Rétrograder le super admin",
    personne: true,
    cible: true,
    auth: (c) => ["/organization/update-member-role", { memberId: hex(c.proprietaire), role: "viewer", organizationId: c.org }],
    temoin: (c) => ["member", { _id: c.proprietaire }],
  },
  {
    nom: "Retirer un membre",
    droit: "remove",
    cible: true,
    auth: (c) => ["/organization/remove-member", { memberIdOrEmail: hex(c.membre), organizationId: c.org }],
    temoin: (c) => ["member", { _id: c.membre }],
  },
  {
    nom: "Retirer le super admin",
    personne: true,
    cible: true,
    auth: (c) => ["/organization/remove-member", { memberIdOrEmail: hex(c.proprietaire), organizationId: c.org }],
    temoin: (c) => ["member", { _id: c.proprietaire }],
  },
  {
    nom: "Annuler une invitation",
    droit: "invite",
    cible: true,
    auth: (c) => ["/organization/cancel-invitation", { invitationId: hex(c.invitation) }],
    temoin: (c) => ["invitation", { _id: c.invitation }],
  },
  {
    nom: "Accepter l'invitation de quelqu'un d'autre",
    personne: true,
    cible: true,
    auth: (c) => ["/organization/accept-invitation", { invitationId: hex(c.invitation) }],
    temoin: (c) => ["invitation", { _id: c.invitation }],
  },
  {
    nom: "Modifier les informations de l'entreprise",
    droit: "orgSettings",
    auth: (c) => ["/organization/update", { data: { website: `https://${c.qui}.e2e.test` }, organizationId: c.org }],
    temoin: (c) => ["organization", { _id: c.orgVisee }],
  },
  {
    nom: "Archiver l'espace",
    proprietaireSeul: true,
    auth: (c) => ["/organization/update", { data: { metadata: { archived: true } }, organizationId: c.org }],
    temoin: (c) => ["organization", { _id: c.orgVisee }],
  },
  {
    nom: "Supprimer l'espace",
    proprietaireSeul: true,
    auth: (c) => ["/organization/delete", { organizationId: c.org }],
    temoin: (c) => ["organization", { _id: c.orgVisee }],
  },
  {
    nom: "Définir un rôle par Better Auth (route fermée)",
    personne: true,
    auth: (c) => ["/organization/create-role", { role: `pirate-${c.qui}`, permission: { member: ["create", "update", "delete"] }, organizationId: c.org }],
    temoin: (c) => ["organizationRole", { role: `pirate-${c.qui}` }],
  },
  {
    nom: "S'ajouter soi-même comme Administrateur",
    personne: true,
    auth: (c) => ["/organization/add-member", { userId: c.userId, role: "admin", organizationId: c.org }],
    temoin: (c) => ["member", { organizationId: c.orgVisee }],
  },
  {
    nom: "Créer un rôle personnalisé",
    proprietaireSeul: true,
    api: {
      champ: "createOrganizationRole",
      requete: `mutation($input: OrganizationRoleInput!) { createOrganizationRole(input: $input) { key name } }`,
      variables: (c) => ({ input: { name: `Rôle de ${c.qui}`, actions: { invoices: ["view"] } } }),
    },
    temoin: (c) => ["organizationRole", { name: `Rôle de ${c.qui}` }],
  },
  {
    nom: "Modifier un rôle personnalisé",
    proprietaireSeul: true,
    cible: true,
    api: {
      champ: "updateOrganizationRole",
      requete: `mutation($key: String!, $input: OrganizationRoleInput!) { updateOrganizationRole(key: $key, input: $input) { key } }`,
      variables: (c) => ({ key: c.role, input: { description: `Modifié par ${c.qui}`, actions: { team: ["view", "invite", "changeRole", "remove"], billing: ["view", "manage"] } } }),
    },
    temoin: (c) => ["organizationRole", { role: c.role }],
  },
  {
    nom: "Ajuster les droits d'un rôle prédéfini",
    proprietaireSeul: true,
    api: {
      champ: "updateOrganizationRole",
      requete: `mutation($key: String!, $input: OrganizationRoleInput!) { updateOrganizationRole(key: $key, input: $input) { key } }`,
      variables: () => ({ key: "viewer", input: { actions: { team: ["view", "invite", "changeRole", "remove"], orgSettings: ["view", "edit"] } } }),
    },
    temoin: (c) => ["organizationRole", { organizationId: c.orgVisee, role: "viewer" }],
  },
  {
    nom: "Remettre un rôle prédéfini par défaut",
    proprietaireSeul: true,
    api: {
      champ: "resetOrganizationRole",
      requete: `mutation($key: String!) { resetOrganizationRole(key: $key) { key } }`,
      variables: () => ({ key: "member" }),
    },
    temoin: (c) => ["organizationRole", { organizationId: c.orgVisee }],
  },
  {
    nom: "Supprimer un rôle personnalisé",
    proprietaireSeul: true,
    cible: true,
    api: {
      champ: "deleteOrganizationRole",
      requete: `mutation($key: String!) { deleteOrganizationRole(key: $key, fallbackRole: "viewer") { success } }`,
      variables: (c) => ({ key: c.role }),
    },
    temoin: (c) => ["organizationRole", { role: c.role }],
  },
  {
    nom: "Transférer le rôle de super admin",
    proprietaireSeul: true,
    cible: true,
    api: {
      champ: "transferOrganizationOwnership",
      requete: `mutation($m: ID!) { transferOrganizationOwnership(memberId: $m) { success } }`,
      variables: (c) => ({ m: hex(c.soi || c.membre) }),
    },
    temoin: (c) => ["member", { organizationId: c.orgVisee }],
  },
];

/** Rôles de « Paramètres » et ce que chacun peut (grille de rolePermissions.js de l'API). */
const ROLES = [
  { cle: "admin", token: SESSION_TOKEN_ADMIN_PARAMETRES, peut: ["orgSettings"] },
  { cle: "editeur", token: SESSION_TOKEN_EDITEUR_PARAMETRES, peut: [] },
  { cle: "membre", token: SESSION_TOKEN_MEMBRE_PARAMETRES, peut: [] },
  { cle: "comptable", token: SESSION_TOKEN_COMPTABLE_PARAMETRES, peut: [] },
  // « Recrutement » : voir et inviter, rien d'autre.
  { cle: "recruteur", token: SESSION_TOKEN_RECRUTEUR_PARAMETRES, peut: ["invite"] },
];
const MEMBRE_DE_ROLE = {
  admin: MEMBRES.adminParametres,
  editeur: MEMBRES.editeurParametres,
  membre: MEMBRES.membreParametres,
  comptable: MEMBRES.comptableParametres,
  recruteur: MEMBRES.recruteurParametres,
};

async function appeler(page, op, c) {
  if (op.api) {
    return appelApi(page, op.api.requete, op.api.variables(c), { organisation: c.org, delai: 15_000 });
  }
  const [chemin, corps] = op.auth(c);
  return appelAuth(page, chemin, { corps });
}

async function refusSansEffet(page, op, c) {
  const avant = await photo(op.temoin(c));
  const reponse = await appeler(page, op, c);
  expect(reponse.sansReponse, `${op.nom} (${c.qui}) : aucune réponse du serveur`).not.toBe(true);
  expect(estRefuse(op, reponse), `${op.nom} (${c.qui}) : accepté alors qu'il devait être refusé (réponse ${JSON.stringify(reponse.data ?? reponse.corps)?.slice(0, 200)})`).toBe(true);
  // Une route réservée au serveur (add-member) n'existe pas pour le navigateur : 404 sans message.
  if (reponse.statut !== 404) expect(messageDe(reponse), `${op.nom} (${c.qui}) : le refus doit être expliqué`).toMatch(REFUS);
  expect(await photo(op.temoin(c)), `${op.nom} (${c.qui}) : la base a changé malgré le refus`).toBe(avant);
}

for (const role of ROLES) {
  test.describe(`Membres : droits du rôle « ${role.cle} » de « Paramètres »`, () => {
    test.use({ storageState: connecte(role.token), erreursConsoleAutorisees: REFUS_CONSOLE });
    test.beforeEach(async ({ page }) => {
      await surLeSite(page);
    });

    for (const op of ECRITURES) {
      const permis = !op.personne && !op.proprietaireSeul && role.peut.includes(op.droit);
      // Les écritures permises sont vérifiées dans « Équipe » (parcours.spec.mjs) ou ci-dessous.
      if (permis) continue;
      test(`${op.nom} : refusé`, async ({ page }) => {
        const membre = MEMBRE_DE_ROLE[role.cle];
        const c = await contexte(role.cle, PARAMETRES.organisation);
        c.userId = hex(membre.utilisateur._id);
        c.soi = await adhesion(membre.utilisateur._id, PARAMETRES.organisation._id);
        await refusSansEffet(page, op, c);
      });
    }
  });
}

test.describe("Membres : ce que l'Administrateur peut faire", () => {
  test.use({ erreursConsoleAutorisees: REFUS_CONSOLE });
  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_ADMIN_PARAMETRES) });
    test("L'Administrateur modifie les informations de l'entreprise", async ({ page }) => {
      await surLeSite(page);
      const reponse = await appelAuth(page, "/organization/update", {
        corps: { data: { website: "https://administratrice.e2e.test" }, organizationId: hex(PARAMETRES.organisation._id) },
      });
      expect(reponse.statut, `Modification refusée : ${messageDe(reponse)}`).toBe(200);
      const org = await (await base()).collection("organization").findOne({ _id: PARAMETRES.organisation._id });
      expect(org.website).toBe("https://administratrice.e2e.test");
    });
  });
});

test.describe("Membres : le rôle « Gestion d'équipe » d'« Équipe »", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_GESTION_EQUIPE), erreursConsoleAutorisees: REFUS_CONSOLE });
  test.beforeEach(async ({ page }) => {
    await surLeSite(page);
  });
  const ORG = hex(EQUIPE.organisation._id);

  test("Invite, change un rôle, retire un membre et annule une invitation", async ({ page }) => {
    const db = await base();
    await etape(page, "Inviter", async () => {
      const r = await appelAuth(page, "/organization/invite-member", { corps: { email: "invite-par-gestion@e2e.test", role: "viewer", organizationId: ORG } });
      expect(r.statut, messageDe(r)).toBe(200);
      expect((await db.collection("invitation").findOne({ email: "invite-par-gestion@e2e.test" }))?.status).toBe("pending");
    });
    await etape(page, "Changer un rôle (Membre → Éditeur)", async () => {
      const r = await appelAuth(page, "/organization/update-member-role", { corps: { memberId: hex(idCible("gestionRole")), role: "member", organizationId: ORG } });
      expect(r.statut, messageDe(r)).toBe(200);
      expect((await db.collection("member").findOne({ _id: idCible("gestionRole") }))?.role).toBe("member");
    });
    await etape(page, "Retirer un membre", async () => {
      const r = await appelAuth(page, "/organization/remove-member", { corps: { memberIdOrEmail: hex(idCible("gestionRetrait")), organizationId: ORG } });
      expect(r.statut, messageDe(r)).toBe(200);
      expect(await db.collection("member").findOne({ _id: idCible("gestionRetrait") })).toBeNull();
    });
    await etape(page, "Annuler une invitation", async () => {
      const r = await appelAuth(page, "/organization/cancel-invitation", { corps: { invitationId: hex(idInvitation("gestionAnnuler")) } });
      expect(r.statut, messageDe(r)).toBe(200);
      expect((await db.collection("invitation").findOne({ _id: idInvitation("gestionAnnuler") }))?.status).toBe("canceled");
    });
  });

  for (const op of ECRITURES.filter((o) => o.personne || o.proprietaireSeul || o.droit === "orgSettings")) {
    test(`${op.nom} : refusé`, async ({ page }) => {
      const c = await contexte("gestion", EQUIPE.organisation);
      c.userId = hex(MEMBRES.gestionnaireEquipe.utilisateur._id);
      c.soi = await adhesion(MEMBRES.gestionnaireEquipe.utilisateur._id, EQUIPE.organisation._id);
      c.membre = idCible("intrus");
      await refusSansEffet(page, op, c);
    });
  }

  // Élévation de droits : « Gestion d'équipe » n'a ni les factures, ni
  // l'abonnement, ni les informations de l'entreprise. En invitant une autre
  // adresse à lui comme Administrateur, il obtient tout cela.
  test("Ne peut pas inviter avec un rôle aux droits plus étendus que les siens (Administrateur)", async ({ page }) => {
    const r = await appelAuth(page, "/organization/invite-member", { corps: { email: "complice-admin@e2e.test", role: "admin", organizationId: ORG } });
    const inv = await (await base()).collection("invitation").findOne({ email: "complice-admin@e2e.test" });
    expect(
      inv,
      `Invitation comme Administrateur acceptée (statut ${r.statut}) : un rôle qui ne gère que les membres peut faire entrer quelqu'un (ou lui-même, sous une autre adresse) avec plus de droits que les siens`,
    ).toBeNull();
  });
});

test.describe("Membres : une autre entreprise n'atteint rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS), erreursConsoleAutorisees: REFUS_CONSOLE });
  test.beforeEach(async ({ page }) => {
    await surLeSite(page);
  });

  for (const op of ECRITURES) {
    test(`${op.nom} chez les autres : refusé`, async ({ page }) => {
      const soi = await adhesion(INTRUS.utilisateur._id, INTRUS.organisation._id);
      await etape(page, "En visant leur espace", async () => {
        const c = await contexte("intrus", EQUIPE.organisation);
        Object.assign(c, { userId: hex(INTRUS.utilisateur._id), soi: c.membre });
        await refusSansEffet(page, op, c);
      });
      if (op.cible) {
        await etape(page, "Depuis son propre espace, avec leurs identifiants", async () => {
          const c = await contexte("intrus", EQUIPE.organisation, INTRUS.organisation);
          Object.assign(c, { userId: hex(INTRUS.utilisateur._id), soi: c.membre, proprietaireIntrus: soi });
          await refusSansEffet(page, op, c);
        });
      }
    });
  }

  const LECTURES_AUTH = [
    ["La liste des membres", (o) => `/organization/list-members?organizationId=${o}`],
    ["Les invitations", (o) => `/organization/list-invitations?organizationId=${o}`],
    ["L'espace complet (membres, invitations)", (o) => `/organization/get-full-organization?organizationId=${o}`],
    ["Le rôle d'un membre", (o) => `/organization/get-active-member-role?organizationId=${o}&userId=${hex(PARAMETRES.utilisateur._id)}`],
  ];
  const LECTURES_SITE = [
    ["Les membres (route du site)", (o) => `/api/organizations/${o}/members`],
    ["Les sièges", (o) => `/api/organizations/${o}/seats-info`],
    ["L'abonnement", (o) => `/api/organizations/${o}/subscription`],
    ["Le cabinet payeur", (o) => `/api/organizations/${o}/cabinet`],
  ];
  const LECTURES_API = [
    ["Les rôles de l'espace", "organizationRoles", `query { organizationRoles { key name memberCount } }`],
    ["Le catalogue des droits", "roleCatalog", `query { roleCatalog { defaultInviteRole } }`],
    ["Ses droits dans l'espace", "myPermissions", `query { myPermissions { organizationId role } }`],
  ];

  /** La réponse ne contient rien de « Paramètres » (membres, invitations, rôle personnalisé). */
  function sansFuite(texte, nom) {
    for (const fuite of [MEMBRES.membreParametres.utilisateur.email, INVITATIONS.attenteParametres.email, ROLES_PERSO.recrutement.name, PARAMETRES.utilisateur.email]) {
      expect(texte, `${nom} : « ${fuite} » renvoyé à l'intrus`).not.toContain(fuite);
    }
  }

  for (const [nom, url] of LECTURES_AUTH) {
    test(`Lire « ${nom} » des autres (Better Auth) : refusé`, async ({ page }) => {
      const r = await appelAuth(page, url(hex(PARAMETRES.organisation._id)), { methode: "GET" });
      sansFuite(JSON.stringify(r.corps ?? ""), nom);
      expect(r.statut, `${nom} : lu par l'intrus`).toBeGreaterThanOrEqual(400);
    });
  }
  for (const [nom, url] of LECTURES_SITE) {
    test(`Lire « ${nom} » des autres (site) : refusé`, async ({ page }) => {
      const r = await appelSite(page, url(hex(PARAMETRES.organisation._id)));
      sansFuite(JSON.stringify(r.corps ?? ""), nom);
      expect(r.statut, `${nom} : lu par l'intrus`).toBeGreaterThanOrEqual(400);
    });
  }
  for (const [nom, champ, requete] of LECTURES_API) {
    test(`Lire « ${nom} » des autres (API) : refusé`, async ({ page }) => {
      const r = await appelApi(page, requete, {}, { organisation: hex(PARAMETRES.organisation._id), delai: 15_000 });
      sansFuite(JSON.stringify(r.data ?? {}), nom);
      expect(r.data?.[champ] ?? null, `${nom} : lu par l'intrus`).toBeNull();
      expect(messageDe(r)).toMatch(REFUS);
    });
  }

  test("Demander l'accès à une page d'un espace des autres : refusé", async ({ page }) => {
    const db = await base();
    const avant = await db.collection("notifications").countDocuments({});
    const r = await appelApi(page, `mutation { requestModuleAccess(module: "billing", action: "view") { success } }`, {}, { organisation: hex(PARAMETRES.organisation._id), delai: 15_000 });
    expect(r.data?.requestModuleAccess ?? null, "Demande d'accès envoyée au super admin d'une autre entreprise").toBeNull();
    expect(await db.collection("notifications").countDocuments({})).toBe(avant);
  });
});

test.describe("Membres : changer d'espace actif pour celui des autres", () => {
  // Compte intrus du lot : Better Auth vide l'espace actif de la session sur un refus.
  test.use({ storageState: connecte(COMPTES_AUTH.intrusSessions.token), erreursConsoleAutorisees: REFUS_CONSOLE });
  test("Refusé : la session n'obtient pas l'espace des autres", async ({ page }) => {
    await surLeSite(page);
    const compte = COMPTES_AUTH.intrusSessions;
    const r = await appelAuth(page, "/organization/set-active", { corps: { organizationId: hex(PARAMETRES.organisation._id) } });
    expect(r.statut, "Better Auth a accepté l'espace d'une autre entreprise comme espace actif").toBeGreaterThanOrEqual(400);
    const apres = await (await base()).collection("session").findOne({ token: compte.token });
    expect(apres.activeOrganizationId, "La session a reçu l'espace d'une autre entreprise").not.toBe(hex(PARAMETRES.organisation._id));
    // Remet l'espace actif de ce compte pour les tests suivants.
    await (await base()).collection("session").updateOne({ token: compte.token }, { $set: { activeOrganizationId: hex(compte.organisation._id) } });
  });
});

test.describe("Membres : sans session, rien", () => {
  // Refus attendus : le jeton est refusé (401), l'API répond « non authentifié ».
  test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token|status of 4\d\d.*\/api\/(auth|organizations)\// });

  test("Lectures et écritures refusées", async ({ page }) => {
    await surLeSite(page);
    const c = await contexte("visiteur", EQUIPE.organisation);
    Object.assign(c, { userId: hex(COMPTES_AUTH.connexion.utilisateur._id), soi: c.membre });
    for (const op of ECRITURES) {
      const avant = await photo(op.temoin(c));
      const r = await appeler(page, op, c);
      expect.soft(estRefuse(op, r), `${op.nom} : accepté sans session`).toBe(true);
      expect.soft(await photo(op.temoin(c)), `${op.nom} : la base a changé sans session`).toBe(avant);
    }
    for (const url of [`/organization/list-members?organizationId=${c.org}`, `/organization/get-full-organization?organizationId=${c.org}`]) {
      const r = await appelAuth(page, url, { methode: "GET" });
      expect.soft(JSON.stringify(r.corps ?? ""), `${url} : renvoyé sans session`).not.toContain(MEMBRES_CIBLES.intrus.email);
    }
    for (const url of [`/api/organizations/${c.org}/members`, `/api/organizations/${c.org}/seats-info`]) {
      const r = await appelSite(page, url);
      expect.soft(r.statut, `${url} : lu sans session`).toBeGreaterThanOrEqual(400);
    }
  });
});

test.describe("Membres : le super admin ne quitte pas son espace sans successeur", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.quitter.token), erreursConsoleAutorisees: REFUS_CONSOLE });
  test("Quitter son propre espace en étant le seul super admin : refusé", async ({ page }) => {
    await surLeSite(page);
    const org = COMPTES_AUTH.quitter.organisation._id;
    const avant = await photo(["member", { organizationId: org }]);
    const r = await appelAuth(page, "/organization/leave", { corps: { organizationId: hex(org) } });
    expect(r.statut, "Le seul super admin a pu quitter son espace, qui reste sans propriétaire").toBeGreaterThanOrEqual(400);
    expect(await photo(["member", { organizationId: org }])).toBe(avant);
  });
});
