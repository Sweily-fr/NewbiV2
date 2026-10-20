/**
 * Contrôles de droits à l'API des devis, bons de commande et bons de
 * livraison, sur le modèle de clients/securite.spec.mjs. Chaque opération est
 * appelée directement, avec la session du navigateur, comme le ferait
 * quelqu'un qui contourne l'interface :
 *   - « Membre » (lecture seule) : il lit tout, chaque écriture est refusée et
 *     la base ne bouge pas ;
 *   - « Éditeur » : il crée, modifie, envoie, change les statuts, convertit et
 *     fait signer, il ne supprime rien ;
 *   - intrus (autre entreprise) : refus en visant leur organisation, puis
 *     « introuvable » depuis la sienne avec leurs identifiants, et rien non
 *     plus en donnant leur organisation en argument depuis la sienne ;
 *   - visiteur sans session : rien.
 *
 * Une opération décrite :
 *   { nom, droit ("create" | "edit" | "delete" | "send" | "status" | "convert" | "sign"),
 *     champ, requete, variables(w, qui), temoin(qui) → [collection, filtre],
 *     cible (vise une donnée précise), externe (aboutit chez un service
 *     coupé en test : e-mail, prestataire de signature, stockage ; « permis »
 *     veut alors dire « pas de refus de droits ») }
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_INTRUS, SESSION_TOKEN_VENTES_EDITEUR, SESSION_TOKEN_VENTES_LECTEUR } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { appelApi, verifierRefus, id } from "../securite.mjs";
import { base } from "../base.mjs";

export const ORG = id(COMPTES.ventes.organisation);
export const ORG_INTRUS = id(COMPTES.intrus.organisation);
export const ORG_ID = COMPTES.ventes.organisation._id;

/** PDF minimal (en base64), pour les opérations qui demandent un document. */
export const PDF_BASE64 = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
).toString("base64");

/** Document(s) tels qu'en base, sans la date de mise à jour : un refus ne doit rien changer. */
export async function photo([collection, filtre]) {
  const docs = await (await base()).collection(collection).find(filtre).sort({ _id: 1 }).toArray();
  return JSON.stringify(docs.map(({ updatedAt, ...d }) => d));
}

/** Erreur de droits ou d'authentification dans une réponse. */
const REFUS_DE_DROITS = /FORBIDDEN|UNAUTHENTICATED|UNAUTHORIZED|permission|autoris|n'êtes pas membre/i;
const messages = (reponse) => reponse.errors.map((e) => `${e.extensions?.code || ""} ${e.message}`).join(" | ");

async function appeler(page, op, w, qui, organisation = w) {
  const reponse = await appelApi(page, op.requete, op.variables(w, qui), { organisation, delai: 20_000 });
  expect(reponse.sansReponse, `${op.nom} (${qui}) : l'API n'a pas répondu en 20 s`).toBe(false);
  return reponse;
}

/** Refus explicite et base inchangée. */
export async function refusSansEffet(page, op, qui, w, organisation = w) {
  const avant = await photo(op.temoin(qui));
  const reponse = await appeler(page, op, w, qui, organisation);
  if (op.nombre && reponse.data?.[op.champ] === 0) {
    // « 0 supprimé » : refus silencieux mais sans effet, vérifié par le témoin.
  } else {
    verifierRefus(reponse, op.champ, `${op.nom} (${qui})`);
  }
  expect(await photo(op.temoin(qui)), `${op.nom} (${qui}) : la base a changé malgré le refus`).toBe(avant);
}

/** Droits de l'« Éditeur » (rolePermissions.js) : tout sauf supprimer. */
const editeurPeut = (op) => op.droit !== "delete";

/** Une réponse ne contient aucune donnée de l'organisation « Ventes » (identifiants, noms). */
function sansFuite(reponse, temoins) {
  const texte = JSON.stringify(reponse.data ?? {});
  for (const t of temoins) expect(texte, `Fuite : « ${t} » renvoyé à l'intrus`).not.toContain(t);
}

/**
 * Déclare les tests de droits d'une fonctionnalité :
 *   titre      : « Devis »
 *   lectures   : [[nom, champ, requete, variables(w)]]
 *   ecritures  : opérations décrites ci-dessus
 *   temoinsFuite : textes de l'organisation « Ventes » qu'aucune réponse à l'intrus ne doit contenir
 */
export function verifierDroits({ titre, lectures, ecritures, temoinsFuite }) {
  test.describe(`${titre} : droits du rôle « Membre » (lecture seule)`, () => {
    test.use({ storageState: connecte(SESSION_TOKEN_VENTES_LECTEUR) });
    test.beforeEach(async ({ page }) => {
      await ouvrir(page, "/dashboard");
    });

    test("Peut tout lire", async ({ page }) => {
      for (const [nom, champ, requete, variables] of lectures) {
        const reponse = await appelApi(page, requete, variables(ORG), { organisation: ORG, delai: 20_000 });
        expect.soft(reponse.errors, `${nom} : le Membre doit pouvoir lire`).toEqual([]);
        expect.soft(reponse.data?.[champ], `${nom} : aucune donnée renvoyée au Membre`).not.toBeUndefined();
      }
    });

    for (const op of ecritures) {
      test(`${op.nom} : refusé`, async ({ page }) => {
        await refusSansEffet(page, op, "lecteur", ORG);
      });
    }
  });

  test.describe(`${titre} : droits du rôle « Éditeur »`, () => {
    test.use({ storageState: connecte(SESSION_TOKEN_VENTES_EDITEUR) });
    test.beforeEach(async ({ page }) => {
      await ouvrir(page, "/dashboard");
    });

    for (const op of ecritures) {
      if (editeurPeut(op)) {
        test(`${op.nom} : permis`, async ({ page }) => {
          const reponse = await appeler(page, op, ORG, "editeur");
          if (op.externe) {
            // Le service extérieur est coupé en test : seul compte l'absence de refus de droits.
            expect(messages(reponse), `${op.nom} : l'Éditeur doit pouvoir le faire`).not.toMatch(REFUS_DE_DROITS);
            return;
          }
          expect(reponse.errors, `${op.nom} : l'Éditeur doit pouvoir le faire`).toEqual([]);
          expect(reponse.data?.[op.champ], `${op.nom} : réponse vide`).toBeTruthy();
        });
      } else {
        test(`${op.nom} : refusé`, async ({ page }) => {
          await refusSansEffet(page, op, "editeur", ORG);
        });
      }
    }
  });

  test.describe(`${titre} : une autre entreprise n'atteint rien`, () => {
    test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
    test.beforeEach(async ({ page }) => {
      await ouvrir(page, "/dashboard");
    });

    for (const [nom, champ, requete, variables] of lectures) {
      test(`Lire « ${nom} » des autres : refusé`, async ({ page }) => {
        await etape(page, "En visant leur organisation", async () => {
          const reponse = await appelApi(page, requete, variables(ORG), { organisation: ORG, delai: 20_000 });
          sansFuite(reponse, temoinsFuite);
          verifierRefus(reponse, champ, `${nom} (organisation des autres)`);
        });
        await etape(page, "Depuis sa propre organisation, avec leurs identifiants", async () => {
          const reponse = await appelApi(page, requete, variables(ORG_INTRUS), { organisation: ORG_INTRUS, delai: 20_000 });
          sansFuite(reponse, temoinsFuite);
        });
        await etape(page, "Depuis sa propre organisation, leur organisation en argument", async () => {
          const reponse = await appelApi(page, requete, variables(ORG), { organisation: ORG_INTRUS, delai: 20_000 });
          sansFuite(reponse, temoinsFuite);
        });
      });
    }

    for (const op of ecritures) {
      test(`${op.nom} chez les autres : refusé`, async ({ page }) => {
        await etape(page, "En visant leur organisation", () => refusSansEffet(page, op, "intrus", ORG));
        if (op.cible) {
          await etape(page, "Depuis sa propre organisation, avec leurs identifiants", () => refusSansEffet(page, op, "intrus", ORG_INTRUS));
          await etape(page, "Depuis sa propre organisation, leur organisation en argument", () => refusSansEffet(page, op, "intrus", ORG, ORG_INTRUS));
        }
      });
    }
  });

  test.describe(`${titre} : sans session, rien`, () => {
    // Refus attendus : le jeton est refusé (401), l'API répond « non authentifié ».
    test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });

    test("Lectures et écritures refusées", async ({ page }) => {
      await ouvrir(page, "/auth/login");
      for (const [nom, champ, requete, variables] of lectures) {
        const reponse = await appelApi(page, requete, variables(ORG), { organisation: ORG, delai: 20_000 });
        expect.soft(reponse.data?.[champ] ?? null, `${nom} : renvoyé sans session`).toBeNull();
      }
      for (const op of ecritures) {
        const avant = await photo(op.temoin("visiteur"));
        const reponse = await appelApi(page, op.requete, op.variables(ORG, "visiteur"), { organisation: ORG, delai: 20_000 });
        expect.soft(reponse.data?.[op.champ] ?? null, `${op.nom} : accepté sans session`).toBeNull();
        expect.soft(await photo(op.temoin("visiteur")), `${op.nom} : la base a changé sans session`).toBe(avant);
      }
    });
  });
}

/** Client d'un document créé par l'API (ClientInput). */
export const CLIENT_API = {
  name: "Client des contrôles SARL",
  email: "controles@e2e.test",
  type: "COMPANY",
  siret: "12345678900011",
  address: { street: "1 rue du Contrôle", city: "Paris", postalCode: "75001", country: "France" },
};

/** Article d'un document créé ou modifié par l'API (ItemInput), nommé d'après qui l'écrit. */
export const article = (texte, prix = 100) => ({ description: texte, quantity: 1, unitPrice: prix, vatRate: 20, unit: "" });

/** Texte piégé (XSS stockée) : s'il s'exécute, il pose une marque et ouvre une alerte (la surveillance échoue). */
export const PIEGE = `<img src="x-piege" onerror="window.__piege='execute';alert('code exécuté depuis un document')">`;
