/**
 * Paramètres : opérations GraphQL des onglets (rôles, compte, logo de
 * l'entreprise, facturation électronique) vérifiées au serveur, pas seulement
 * à l'écran.
 *   - Membre (lecture seule), Éditeur, Comptable de « Paramètres » : ce que
 *     leur rôle refuse l'est aussi par l'API, et la base ne bouge pas ;
 *   - intrus (autre entreprise) : refus, et aucune fuite en visant l'espace
 *     des autres ;
 *   - visiteur sans session : refus.
 * Les écritures permises à un rôle sont vérifiées dans parcours.spec.mjs.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { appelApi, verifierRefus } from "../securite.mjs";
import {
  connecte,
  SESSION_TOKEN_COMPTABLE_PARAMETRES,
  SESSION_TOKEN_EDITEUR_PARAMETRES,
  SESSION_TOKEN_INTRUS,
  SESSION_TOKEN_MEMBRE_PARAMETRES,
} from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { ROLES_PERSO } from "../donnees/lot-parametres-auth.mjs";

const PARAMETRES = COMPTES.parametres;
const ORG = PARAMETRES.organisation._id.toHexString();
const ORG_INTRUS = COMPTES.intrus.organisation._id.toHexString();

/** Document(s) d'une collection, sans la date de mise à jour. */
async function photo([collection, filtre]) {
  const docs = await (await base()).collection(collection).find(filtre).sort({ _id: 1 }).toArray();
  return JSON.stringify(docs.map(({ updatedAt, ...d }) => d));
}

/** Écritures des onglets. `droit` : page → action de la grille de l'API. */
const ECRITURES = [
  {
    nom: "Modifier le logo de l'entreprise",
    droit: ["orgSettings", "write"],
    champ: "updateCompanyLogo",
    requete: `mutation($w: ID!, $u: String) { updateCompanyLogo(workspaceId: $w, logoUrl: $u) { id } }`,
    variables: (w, qui) => ({ w, u: `https://fichiers.e2e.invalid/${qui}.png` }),
    temoin: () => ["organization", { _id: PARAMETRES.organisation._id }],
  },
  {
    nom: "Activer la facturation électronique",
    droit: ["integrations", "manage"],
    champ: "enableEInvoicing",
    requete: `mutation($w: ID!) { enableEInvoicing(workspaceId: $w) { success } }`,
    variables: (w) => ({ w }),
    // SuperPDP est injoignable en CI : le refus de droits tombe avant l'appel réseau.
    temoin: () => ["organization", { _id: PARAMETRES.organisation._id }],
    reseau: true,
  },
  {
    nom: "Désactiver la facturation électronique",
    droit: ["integrations", "manage"],
    champ: "disableEInvoicing",
    requete: `mutation($w: ID!) { disableEInvoicing(workspaceId: $w) { success } }`,
    variables: (w) => ({ w }),
    temoin: () => ["organization", { _id: PARAMETRES.organisation._id }],
  },
  {
    nom: "Créer un rôle personnalisé",
    droit: ["owner"],
    champ: "createOrganizationRole",
    requete: `mutation($input: OrganizationRoleInput!) { createOrganizationRole(input: $input) { key } }`,
    variables: (w, qui) => ({ input: { name: `Rôle onglet ${qui}`, actions: { invoices: ["view"] } } }),
    temoin: (qui) => ["organizationRole", { name: `Rôle onglet ${qui}` }],
  },
  {
    nom: "Modifier un rôle personnalisé",
    droit: ["owner"],
    champ: "updateOrganizationRole",
    requete: `mutation($key: String!, $input: OrganizationRoleInput!) { updateOrganizationRole(key: $key, input: $input) { key } }`,
    variables: (w, qui) => ({ key: ROLES_PERSO.recrutement.role, input: { description: `Onglet ${qui}` } }),
    temoin: () => ["organizationRole", { role: ROLES_PERSO.recrutement.role }],
  },
  {
    nom: "Supprimer un rôle personnalisé",
    droit: ["owner"],
    champ: "deleteOrganizationRole",
    requete: `mutation($key: String!) { deleteOrganizationRole(key: $key, fallbackRole: "viewer") { success } }`,
    variables: () => ({ key: ROLES_PERSO.recrutement.role }),
    temoin: () => ["organizationRole", { role: ROLES_PERSO.recrutement.role }],
    nombre: true,
  },
];

/** Lectures des onglets (tout membre peut lire, l'intrus et le visiteur non). */
const LECTURES = [
  ["Ses droits", "myPermissions", `query { myPermissions { organizationId role isOwner } }`, () => ({})],
  ["Le catalogue des droits", "roleCatalog", `query { roleCatalog { defaultInviteRole } }`, () => ({})],
  ["Les rôles de l'espace", "organizationRoles", `query { organizationRoles { key name } }`, () => ({})],
  ["Les réglages de facturation électronique", "eInvoicingSettings", `query($w: ID!) { eInvoicingSettings(workspaceId: $w) { eInvoicingEnabled } }`, (w) => ({ w })],
  ["Les préférences de notifications", "getNotificationPreferences", `query { getNotificationPreferences { invoice_overdue { email push } } }`, () => ({})],
];

function estVide(valeur) {
  return valeur === null || valeur === undefined || (Array.isArray(valeur) && valeur.length === 0);
}

async function refusSansEffet(page, op, qui, w) {
  const avant = await photo(op.temoin(qui));
  const reponse = await appelApi(page, op.requete, op.variables(w, qui), { organisation: w, delai: 15_000 });
  expect(reponse.sansReponse, `${op.nom} (${qui}) : aucune réponse de l'API`).not.toBe(true);
  if (op.nombre && reponse.data?.[op.champ] === 0) {
    // 0 suppression : refus silencieux, vérifié par le témoin.
  } else {
    verifierRefus(reponse, op.champ, `${op.nom} (${qui})`);
  }
  expect(await photo(op.temoin(qui)), `${op.nom} (${qui}) : la base a changé malgré le refus`).toBe(avant);
}

const ROLES = [
  ["Membre (lecture seule)", SESSION_TOKEN_MEMBRE_PARAMETRES, "membre"],
  ["Éditeur", SESSION_TOKEN_EDITEUR_PARAMETRES, "editeur"],
  ["Comptable", SESSION_TOKEN_COMPTABLE_PARAMETRES, "comptable"],
];

for (const [libelle, token, qui] of ROLES) {
  test.describe(`Paramètres : droits du rôle « ${libelle} »`, () => {
    test.use({ storageState: connecte(token) });
    test.beforeEach(async ({ page }) => {
      await ouvrir(page, "/dashboard");
    });

    test("Peut lire les onglets qui lui sont ouverts", async ({ page }) => {
      for (const [nom, champ, requete, variables] of LECTURES) {
        const reponse = await appelApi(page, requete, variables(ORG), { organisation: ORG });
        expect.soft(reponse.data?.[champ], `${nom} : aucune donnée renvoyée à « ${libelle} »`).toBeTruthy();
      }
    });

    // Aucun des trois rôles n'a orgSettings.write, integrations.manage ni owner.
    for (const op of ECRITURES) {
      test(`${op.nom} : refusé`, async ({ page }) => {
        await refusSansEffet(page, op, qui, ORG);
      });
    }
  });
}

test.describe("Paramètres : une autre entreprise n'atteint rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  for (const [nom, champ, requete, variables] of LECTURES) {
    test(`Lire « ${nom} » des autres : refusé`, async ({ page }) => {
      await etape(page, "En visant leur espace", async () => {
        const reponse = await appelApi(page, requete, variables(ORG), { organisation: ORG });
        const valeur = reponse.data?.[champ];
        // myPermissions / roleCatalog renvoient le rôle de l'intrus dans SON espace
        // quand il vise un espace dont il n'est pas membre : la lecture ne doit rien
        // révéler de « Paramètres » (rôles personnalisés, membres).
        expect(JSON.stringify(reponse.data ?? {}), `${nom} : fuite d'un rôle de « Paramètres »`).not.toContain(ROLES_PERSO.recrutement.name);
        // Les préférences de notifications sont celles de l'appelant (aucun espace en jeu).
        if (champ === "organizationRoles" || champ === "eInvoicingSettings") {
          expect(estVide(valeur), `${nom} : donnée des autres renvoyée à l'intrus`).toBe(true);
        }
      });
    });
  }

  for (const op of ECRITURES) {
    test(`${op.nom} chez les autres : refusé`, async ({ page }) => {
      await etape(page, "En visant leur espace", () => refusSansEffet(page, op, "intrus", ORG));
    });
  }
});

test.describe("Paramètres : sans session, rien", () => {
  test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });

  test("Lectures et écritures refusées", async ({ page }) => {
    await ouvrir(page, "/mentions-legales");
    for (const [nom, champ, requete, variables] of LECTURES) {
      const reponse = await appelApi(page, requete, variables(ORG), { organisation: ORG });
      expect.soft(reponse.data?.[champ] ?? null, `${nom} : renvoyé sans session`).toBeNull();
    }
    for (const op of ECRITURES) {
      const avant = await photo(op.temoin("visiteur"));
      const reponse = await appelApi(page, op.requete, op.variables(ORG, "visiteur"), { organisation: ORG, delai: 15_000 });
      expect.soft(reponse.data?.[op.champ] ?? null, `${op.nom} : accepté sans session`).toBeFalsy();
      expect.soft(await photo(op.temoin("visiteur")), `${op.nom} : la base a changé sans session`).toBe(avant);
    }
  });
});
