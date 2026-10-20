/**
 * Droits vérifiés à l'API pour les fonctionnalités du lot « achats-banque »
 * (catalogue, factures d'achat, transactions, prévision), sur le modèle de
 * clients/securite.spec.mjs. Chaque opération GraphQL est appelée
 * directement, avec la session du navigateur :
 *   - « Membre » (lecture seule) de « Achats » : il lit, toute écriture est
 *     refusée et la base ne bouge pas ;
 *   - « Éditeur » : ce que son rôle permet passe (dans « Saisie Achats », où
 *     il est aussi membre, pour ne jamais toucher la référence), le reste
 *     est refusé sans effet ;
 *   - intrus (autre entreprise) : refus en visant « Achats », et rien
 *     d'« Achats » ne sort depuis sa propre organisation avec leurs identifiants ;
 *   - visiteur sans session : rien.
 *
 * Une opération se décrit :
 *   { nom, champ, requete, variables: (w, qui) => ({…}), temoin: (qui, w) => [collection, filtre],
 *     editeur: true|false (l'Éditeur peut-il le faire ?), cible: true (vise une donnée précise),
 *     resultat: "objet" | "succes" ({ success, message }) | "nombre" ({ updatedCount }) | "booleen",
 *     fichier: { cle, nom, type, contenu } (envoi multipart), externe: "raison" (service
 *     injoignable en CI : l'écriture permise n'est pas essayée) }
 * Une réponse « succès : false » ou « 0 mise à jour » vaut refus quand la base n'a pas bougé.
 */
import { test, expect, etape } from "./outils.mjs";
import { ouvrir } from "./navigation.mjs";
import { API_URL, BASE_URL, connecte, SESSION_TOKEN_EDITEUR_ACHATS, SESSION_TOKEN_INTRUS, SESSION_TOKEN_LECTEUR_ACHATS } from "./config.mjs";
import { COMPTES } from "./donnees/base.mjs";
import { appelApi, verifierRefus, id } from "./securite.mjs";
import { base } from "./base.mjs";

export const ORG = id(COMPTES.achats.organisation);
export const ORG_SAISIE = id(COMPTES.saisieAchats.organisation);
export const ORG_INTRUS = id(COMPTES.intrus.organisation);

/** Document(s) tels qu'en base, sans la date de mise à jour : un refus ne doit rien changer. */
export async function photo([collection, filtre]) {
  const docs = await (await base()).collection(collection).find(filtre).sort({ _id: 1 }).toArray();
  return JSON.stringify(docs.map(({ updatedAt, ...d }) => d));
}

/**
 * Requête GraphQL multipart (envoi de fichier), avec la session de la page,
 * comme le lien d'envoi du site. `fichier.cle` : chemin de la variable
 * (« file », « files.0 »).
 */
export async function appelApiFichier(page, query, variables, fichier, { organisation = null } = {}) {
  return page.evaluate(
    async ({ query, variables, api, organisation, fichier }) => {
      const jeton = await fetch("/api/auth/token", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : {}))
        .then((d) => d.token || null)
        .catch(() => null);
      const form = new FormData();
      form.append("operations", JSON.stringify({ query, variables }));
      form.append("map", JSON.stringify({ 0: [`variables.${fichier.cle}`] }));
      form.append("0", new Blob([fichier.contenu], { type: fichier.type }), fichier.nom);
      const res = await fetch(`${api}/graphql`, {
        method: "POST",
        credentials: "include",
        headers: {
          "x-app-client": "web",
          "apollo-require-preflight": "true",
          ...(jeton ? { authorization: `Bearer ${jeton}` } : {}),
          ...(organisation ? { "x-organization-id": organisation } : {}),
        },
        body: form,
      });
      const corps = await res.json().catch(() => ({}));
      return { statut: res.status, data: corps.data ?? null, errors: corps.errors ?? [], sansReponse: false };
    },
    { query, variables, api: API_URL, organisation, fichier },
  );
}

const appeler = (page, op, w, qui) =>
  op.fichier
    ? appelApiFichier(page, op.requete, op.variables(w, qui), op.fichier, { organisation: w })
    : appelApi(page, op.requete, op.variables(w, qui), { organisation: w, delai: 15_000 });

const messages = (reponse) => reponse.errors.map((e) => `${e.extensions?.code || ""} ${e.message}`).join(" | ");

/** La réponse est un refus : erreur explicite, ou échec annoncé (succès faux, rien de mis à jour). */
function verifierRefusOp(reponse, op, contexte) {
  expect(reponse.sansReponse, `${contexte} : l'API n'a pas répondu en 15 s`).toBeFalsy();
  const valeur = reponse.data?.[op.champ];
  if (valeur && op.resultat === "succes") {
    expect(valeur.success, `${contexte} : l'API annonce un succès (${JSON.stringify(valeur).slice(0, 200)})`).toBe(false);
    return;
  }
  if (valeur && op.resultat === "nombre") {
    expect(valeur.updatedCount, `${contexte} : l'API a mis à jour des données (${JSON.stringify(valeur).slice(0, 200)})`).toBe(0);
    return;
  }
  if (op.resultat === "booleen" && valeur === false) return;
  verifierRefus(reponse, op.champ, contexte);
}

async function refusSansEffet(page, op, qui, w) {
  const temoin = op.temoin(qui, w);
  const avant = await photo(temoin);
  const reponse = await appeler(page, op, w, qui);
  verifierRefusOp(reponse, op, `${op.nom} (${qui})`);
  expect(await photo(temoin), `${op.nom} (${qui}) : la base a changé malgré le refus`).toBe(avant);
}

/**
 * Tests de droits d'une fonctionnalité :
 *   fonctionnalite : « Catalogue », « Factures d'achat »…
 *   lectures       : [{ nom, champ, requete, variables: (w) => ({…}), peutEtreVide: true (réponse nulle permise) }]
 *   ecritures      : opérations décrites plus haut
 *   fuites         : textes et identifiants d'« Achats » qui ne doivent jamais sortir vers l'intrus
 */
export function verifierDroits({ fonctionnalite, lectures, ecritures, fuites }) {
  function sansFuite(reponse, contexte) {
    const texte = JSON.stringify(reponse.data ?? {});
    for (const f of fuites) expect(texte, `${contexte} : « ${f} » renvoyé à une autre entreprise`).not.toContain(f);
  }

  test.describe(`${fonctionnalite} : droits du rôle « Membre » (lecture seule)`, () => {
    test.use({ storageState: connecte(SESSION_TOKEN_LECTEUR_ACHATS) });
    test.beforeEach(async ({ page }) => {
      await ouvrir(page, "/dashboard");
    });

    test("Peut tout lire", async ({ page }) => {
      for (const l of lectures) {
        const reponse = await appelApi(page, l.requete, l.variables(ORG), { organisation: ORG, delai: 15_000 });
        expect.soft(messages(reponse), `${l.nom} : le Membre doit pouvoir lire`).toBe("");
        if (!l.peutEtreVide) expect.soft(reponse.data?.[l.champ] ?? null, `${l.nom} : aucune donnée renvoyée au Membre`).not.toBeNull();
      }
    });

    for (const op of ecritures) {
      test(`${op.nom} : refusé`, async ({ page }) => {
        await refusSansEffet(page, op, "lecteur", ORG);
      });
    }
  });

  test.describe(`${fonctionnalite} : droits du rôle « Éditeur »`, () => {
    test.use({ storageState: connecte(SESSION_TOKEN_EDITEUR_ACHATS) });
    test.beforeEach(async ({ page }) => {
      await ouvrir(page, "/dashboard");
    });

    for (const op of ecritures) {
      if (op.editeur && op.externe) continue;
      if (op.editeur) {
        test(`${op.nom} : permis`, async ({ page }) => {
          const reponse = await appeler(page, op, ORG_SAISIE, "editeur");
          expect(messages(reponse), `${op.nom} : l'Éditeur doit pouvoir le faire`).toBe("");
          const valeur = reponse.data?.[op.champ];
          expect(valeur, `${op.nom} : réponse vide`).toBeTruthy();
          if (op.resultat === "succes") expect(valeur.success, `${op.nom} : ${valeur.message}`).toBe(true);
          if (op.resultat === "nombre") expect(valeur.updatedCount, `${op.nom} : rien n'a été mis à jour`).toBeGreaterThan(0);
        });
      } else {
        test(`${op.nom} : refusé`, async ({ page }) => {
          await refusSansEffet(page, op, "editeur", ORG_SAISIE);
        });
      }
    }
  });

  test.describe(`${fonctionnalite} : une autre entreprise n'atteint rien`, () => {
    test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
    test.beforeEach(async ({ page }) => {
      await ouvrir(page, "/dashboard");
    });

    for (const l of lectures) {
      test(`Lire « ${l.nom} » des autres : refusé`, async ({ page }) => {
        await etape(page, "En visant leur organisation", async () => {
          const reponse = await appelApi(page, l.requete, l.variables(ORG), { organisation: ORG, delai: 15_000 });
          sansFuite(reponse, l.nom);
          verifierRefus(reponse, l.champ, `${l.nom} (organisation des autres)`);
        });
        await etape(page, "Depuis sa propre organisation, avec leurs identifiants", async () => {
          const reponse = await appelApi(page, l.requete, l.variables(ORG_INTRUS), { organisation: ORG_INTRUS, delai: 15_000 });
          sansFuite(reponse, l.nom);
        });
      });
    }

    for (const op of ecritures) {
      test(`${op.nom} chez les autres : refusé`, async ({ page }) => {
        await etape(page, "En visant leur organisation", () => refusSansEffet(page, op, "intrus", ORG));
        if (op.cible) {
          await etape(page, "Depuis sa propre organisation, avec leurs identifiants", () => refusSansEffet(page, op, "intrus", ORG_INTRUS));
        }
      });
    }
  });

  test.describe(`${fonctionnalite} : sans session, rien`, () => {
    // Refus attendus : le jeton est refusé (401), l'API répond « non authentifié ».
    test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });

    test("Lectures et écritures refusées", async ({ page }) => {
      await ouvrir(page, "/auth/login");
      for (const l of lectures) {
        const reponse = await appelApi(page, l.requete, l.variables(ORG), { organisation: ORG, delai: 15_000 });
        expect.soft(reponse.data?.[l.champ] ?? null, `${l.nom} : renvoyé sans session`).toBeNull();
      }
      for (const op of ecritures) {
        const temoin = op.temoin("visiteur", ORG);
        const avant = await photo(temoin);
        const reponse = await appeler(page, op, ORG, "visiteur");
        expect.soft(reponse.data?.[op.champ] ?? null, `${op.nom} : accepté sans session`).toBeNull();
        expect.soft(await photo(temoin), `${op.nom} : la base a changé sans session`).toBe(avant);
      }
    });
  });
}

/** Contexte navigateur d'un autre compte, pour écrire avec lui avant un test (texte piégé). */
export async function avecSession(browser, token, fn) {
  const contexte = await browser.newContext({ baseURL: BASE_URL, storageState: connecte(token) });
  try {
    const page = await contexte.newPage();
    await page.goto("/dashboard");
    return await fn(page);
  } finally {
    await contexte.close();
  }
}

/** Texte piégé : une balise image qui marque la page et ouvre une boîte de dialogue si elle s'exécute. */
export const PIEGE = `<img src="x-piege" onerror="window.__piege = 'execute'; alert('code exécuté')">`;

/** Rien n'a été exécuté ni créé dans la page à partir du texte piégé. */
export async function verifierPiegeInerte(page) {
  expect(await page.evaluate(() => window.__piege ?? null), "Le code du texte piégé s'est exécuté").toBeNull();
  expect(await page.locator("img[src='x-piege']").count(), "La balise du texte piégé a été créée dans la page").toBe(0);
}
