/**
 * Calendrier : droits vérifiés à l'API, pas seulement à l'écran. Grille par
 * défaut (rolePermissions.js de newbi-api) :
 *   - « Membre » (viewer) : lit, ne crée ni ne modifie ni ne supprime ;
 *   - « Éditeur » (member) : crée et modifie, ne supprime pas ;
 *   - « Comptable » (accountant) : calendrier complet ;
 *   - autre entreprise et visiteur sans session : rien.
 * Un refus doit être explicite et la base rester identique.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import {
  connecte,
  SESSION_TOKEN_COLLAB_MEMBRE,
  SESSION_TOKEN_COLLAB_EDITEUR,
  SESSION_TOKEN_COLLAB_COMPTABLE,
  SESSION_TOKEN_INTRUS,
} from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { appelApi, id } from "../securite.mjs";
import { refusSansEffet, verifierReussite, photo } from "../securite-collaboration.mjs";
import { EVENEMENTS } from "../donnees/lot-collaboration.mjs";

const ORG = id(COMPTES.collab.organisation);
const ORG_INTRUS = id(COMPTES.intrus.organisation);
const dans = (jours) => new Date(Date.now() + jours * 86_400_000).toISOString();

const LIRE = `query($w: ID){ getEvents(workspaceId:$w){ success events{ id title } } }`;

const ECRITURES = [
  {
    nom: "Créer un événement",
    droit: "create",
    champ: "createEvent",
    requete: `mutation($w: ID,$input: CreateEventInput!){ createEvent(workspaceId:$w,input:$input){ success message event{ id } } }`,
    variables: (w, qui) => ({ w, input: { title: `Événement de ${qui}`, start: dans(2), end: dans(2) } }),
    temoin: (qui) => ["events", { title: `Événement de ${qui}` }],
  },
  {
    nom: "Modifier un événement",
    droit: "edit",
    cible: true,
    champ: "updateEvent",
    requete: `mutation($w: ID,$input: UpdateEventInput!){ updateEvent(workspaceId:$w,input:$input){ success message event{ id } } }`,
    variables: (w, qui) => ({ w, input: { id: id(EVENEMENTS.lecture), title: `Modifié par ${qui}` } }),
    variablesEditeur: (w) => ({ w, input: { id: id(EVENEMENTS.modifierEditeur), title: "Modifié par l'éditeur" } }),
    temoin: () => ["events", { _id: EVENEMENTS.lecture._id }],
  },
  {
    nom: "Supprimer un événement",
    droit: "delete",
    cible: true,
    champ: "deleteEvent",
    requete: `mutation($w: ID,$id: ID!){ deleteEvent(workspaceId:$w,id:$id){ success message } }`,
    variables: (w) => ({ w, id: id(EVENEMENTS.supprimer) }),
    temoin: () => ["events", { _id: EVENEMENTS.supprimer._id }],
  },
];

test.describe("Calendrier : droits du rôle « Membre » (lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_MEMBRE) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Peut lire les événements de l'espace", async ({ page }) => {
    const reponse = await appelApi(page, LIRE, { w: ORG }, { organisation: ORG });
    verifierReussite(reponse, "getEvents", "Lecture des événements (Membre)");
    expect(reponse.data.getEvents.events.map((e) => e.id)).toContain(id(EVENEMENTS.lecture));
  });
  for (const op of ECRITURES) {
    test(`${op.nom} : refusé`, async ({ page }) => {
      await refusSansEffet(page, op, "membre", ORG);
    });
  }
});

test.describe("Calendrier : droits du rôle « Éditeur »", () => {
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

test.describe("Calendrier : le rôle « Comptable » a le calendrier complet", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_COMPTABLE) });
  test("Peut lire les événements", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelApi(page, LIRE, { w: ORG }, { organisation: ORG });
    verifierReussite(reponse, "getEvents", "Lecture des événements (Comptable)");
  });
});

test.describe("Calendrier : une autre entreprise n'atteint rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Lire les événements des autres : refusé, sans fuite", async ({ page }) => {
    const chezEux = await appelApi(page, LIRE, { w: ORG }, { organisation: ORG });
    expect(chezEux.data?.getEvents ?? null, "Les événements des autres sont renvoyés").toBeNull();
    expect(JSON.stringify(chezEux.data ?? {})).not.toContain(EVENEMENTS.lecture.title);
    const chezSoi = await appelApi(page, LIRE, { w: ORG_INTRUS }, { organisation: ORG_INTRUS });
    expect(JSON.stringify(chezSoi.data ?? {}), "Un événement des autres apparaît chez l'intrus").not.toContain(EVENEMENTS.lecture.title);
  });
  for (const op of ECRITURES) {
    test(`${op.nom} chez les autres : refusé`, async ({ page }) => {
      await refusSansEffet(page, op, "intrus", ORG);
      // Depuis sa propre organisation, avec leurs identifiants : introuvable, rien ne change.
      if (op.cible) await refusSansEffet(page, op, "intrus", ORG_INTRUS);
    });
  }
});

test.describe("Calendrier : sans session, rien", () => {
  test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });
  test("Lecture et écritures refusées", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    const lecture = await appelApi(page, LIRE, { w: ORG }, { organisation: ORG });
    expect.soft(lecture.data?.getEvents ?? null, "Événements renvoyés sans session").toBeNull();
    for (const op of ECRITURES) {
      const [collection, filtre] = op.temoin("visiteur");
      const avant = await photo(collection, filtre);
      const reponse = await appelApi(page, op.requete, op.variables(ORG, "visiteur"), { organisation: ORG });
      expect.soft(reponse.data?.[op.champ]?.success ?? null, `${op.nom} : accepté sans session`).not.toBe(true);
      expect.soft(await photo(collection, filtre), `${op.nom} : la base a changé sans session`).toBe(avant);
    }
  });
});
