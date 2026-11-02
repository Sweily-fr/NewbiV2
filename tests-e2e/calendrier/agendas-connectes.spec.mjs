/**
 * Calendrier : agendas externes connectés (Apple, Google, Microsoft), sans
 * jamais joindre un vrai fournisseur. Espace « Agenda » (lot-calendrier.mjs) :
 *   - Apple : l'adresse CalDAV ne mène jamais vers le réseau interne (boucle
 *     locale, adresses privées, métadonnées du serveur, fichier) ; refus
 *     avant toute requête, message qui ne dit rien de ce qui a répondu ;
 *   - la connexion d'un autre utilisateur est introuvable (déconnecter,
 *     synchroniser, régler, envoyer un événement) ;
 *   - un rôle qui voit le calendrier sans le modifier ne connecte ni ne règle
 *     rien ; un espace sans abonnement ne peut que déconnecter ;
 *   - retours OAuth : state fabriqué, expiré, rejoué ou d'un membre sans droit
 *     refusés avant tout échange avec le fournisseur ;
 *   - webhooks : une notification qui ne prouve pas venir du fournisseur ne
 *     lance aucune synchronisation.
 */
import { createServer } from "node:http";
import { test, expect, etape } from "../outils.mjs";
import { API_URL, BASE_URL, connecte, SESSION_TOKEN_INTRUS } from "../config.mjs";
import { base } from "../base.mjs";
import { appelApi, id } from "../securite.mjs";
import { photo, sansFuite, verifierReussite } from "../securite-collaboration.mjs";
import { AGENDA, AGENDA_LECTURE, MEMBRES_AGENDA, EVENEMENTS_AGENDA, CONNEXIONS } from "../donnees/lot-calendrier.mjs";
import { appelRoute, attendre, stateSigne, surLeSite } from "./outils-agenda.mjs";

const ORG = id(AGENDA.organisation);
const ORG_LECTURE = id(AGENDA_LECTURE.organisation);

const CONNECTER_APPLE = `mutation($input: ConnectAppleCalendarInput!){ connectAppleCalendar(input:$input){ success message connection{ id } } }`;
const LISTE = `query{ getCalendarConnections{ success connections{ id provider accountEmail } } }`;
const OPERATIONS_CONNEXION = [
  ["Déconnecter", "disconnectCalendar", `mutation($c: ID!){ disconnectCalendar(connectionId:$c){ success message } }`, (c) => ({ c })],
  ["Synchroniser", "syncCalendar", `mutation($c: ID!){ syncCalendar(connectionId:$c){ success message } }`, (c) => ({ c })],
  [
    "Choisir les agendas",
    "updateSelectedCalendars",
    `mutation($input: UpdateSelectedCalendarsInput!){ updateSelectedCalendars(input:$input){ success message } }`,
    (c) => ({ input: { connectionId: c, selectedCalendars: [{ calendarId: "autre", name: "Autre", enabled: true }] } }),
  ],
  ["Synchronisation automatique", "updateAutoSync", `mutation($input: UpdateAutoSyncInput!){ updateAutoSync(input:$input){ success message } }`, (c) => ({ input: { connectionId: c, enabled: true } })],
  [
    "Envoyer un événement",
    "pushEventToCalendar",
    `mutation($input: PushEventToCalendarInput!){ pushEventToCalendar(input:$input){ success message } }`,
    (c) => ({ input: { eventId: id(EVENEMENTS_AGENDA.equipeLecture), connectionId: c } }),
  ],
  ["Lister ses agendas", "getAvailableCalendars", `query($c: ID!){ getAvailableCalendars(connectionId:$c){ success message } }`, (c) => ({ c })],
];

const messageDe = (reponse, champ) =>
  [reponse.data?.[champ]?.message, ...reponse.errors.map((e) => `${e.extensions?.code || ""} ${e.message}`)].filter(Boolean).join(" | ");

/* --- Apple : adresse CalDAV ----------------------------------------------- */

test.describe("Agendas connectés : l'adresse d'un agenda Apple ne vise jamais le réseau interne", () => {
  test.use({ storageState: connecte(AGENDA.token) });

  /** Serveur local qui note chaque requête reçue : aucune ne doit lui parvenir. */
  let serveur;
  let port;
  const recues = [];
  test.beforeAll(async () => {
    serveur = createServer((req, res) => {
      recues.push(`${req.method} ${req.url}`);
      res.writeHead(207, { "Content-Type": "application/xml" });
      res.end("<multistatus>reponse-interne-e2e</multistatus>");
    });
    await new Promise((resolve) => serveur.listen(0, "127.0.0.1", resolve));
    port = serveur.address().port;
  });
  test.afterAll(async () => {
    await new Promise((resolve) => serveur.close(resolve));
  });
  test.beforeEach(async ({ page }) => {
    recues.length = 0;
    await surLeSite(page);
  });

  const ADRESSES = [
    ["boucle locale", () => `http://127.0.0.1:${port}/`],
    ["nom local", () => `http://localhost:${port}/caldav/`],
    ["métadonnées du serveur", () => "http://169.254.169.254/latest/meta-data/"],
    ["fichier du serveur", () => "file:///etc/passwd"],
  ];

  for (const [nom, adresse] of ADRESSES) {
    test(`Adresse vers ${nom} : refusée avant toute requête`, async ({ page }) => {
      const filtre = { userId: AGENDA.utilisateur._id, provider: "apple" };
      const avant = await photo("calendarconnections", filtre);
      const reponse = await appelApi(
        page,
        CONNECTER_APPLE,
        { input: { username: "gerant@icloud.test", appPassword: "abcd-efgh-ijkl-mnop", calDavUrl: adresse() } },
        { organisation: ORG, delai: 20_000 },
      );
      expect(reponse.sansReponse, "L'API n'a pas répondu (elle attend sans doute l'adresse interne)").not.toBe(true);
      expect(reponse.data?.connectAppleCalendar?.success ?? null, "La connexion a été acceptée").not.toBe(true);
      expect(recues, "Le serveur local a reçu une requête de l'API").toEqual([]);
      const message = messageDe(reponse, "connectAppleCalendar");
      expect(message, "Le refus doit être expliqué").not.toBe("");
      // Rien de ce qui a (ou n'a pas) répondu ne transparaît.
      for (const indice of ["reponse-interne-e2e", "ECONNREFUSED", "127.0.0.1", String(port), "passwd", "169.254"]) {
        expect(message, `Le message révèle « ${indice} »`).not.toContain(indice);
      }
      expect(await photo("calendarconnections", filtre), "Une connexion Apple a été enregistrée").toBe(avant);
    });
  }
});

/* --- Connexion d'un autre utilisateur ------------------------------------- */

test.describe("Agendas connectés : la connexion d'un autre utilisateur est introuvable", () => {
  test.use({ storageState: connecte(MEMBRES_AGENDA.editeur.token) });
  test.beforeEach(async ({ page }) => surLeSite(page));

  for (const [nom, champ, requete, variables] of OPERATIONS_CONNEXION) {
    test(`${nom} avec l'agenda du gérant : introuvable`, async ({ page }) => {
      const temoin = ["calendarconnections", { _id: CONNEXIONS.proprietaire._id }];
      const avant = await photo(...temoin);
      const reponse = await appelApi(page, requete, variables(id(CONNEXIONS.proprietaire)), { organisation: ORG, delai: 15_000 });
      expect(reponse.data?.[champ]?.success ?? null, `${nom} : accepté sur la connexion d'un autre`).not.toBe(true);
      expect(messageDe(reponse, champ)).toMatch(/non trouv|introuvable/i);
      sansFuite(reponse, [CONNEXIONS.proprietaire.accountEmail], nom);
      expect(await photo(...temoin), `${nom} : la connexion du gérant a changé`).toBe(avant);
    });
  }

  test("La liste des connexions ne contient que les siennes", async ({ page }) => {
    const reponse = await appelApi(page, LISTE, {}, { organisation: ORG });
    const liste = verifierReussite(reponse, "getCalendarConnections", "Liste des connexions (Éditeur)");
    expect(liste.connections.map((c) => c.id)).toEqual(expect.arrayContaining([id(CONNEXIONS.editeurPrive)]));
    sansFuite(reponse, [id(CONNEXIONS.proprietaire), CONNEXIONS.proprietaire.accountEmail], "getCalendarConnections (Éditeur)");
  });
});

/* --- Rôle qui voit le calendrier sans le modifier -------------------------- */

test.describe("Agendas connectés : un rôle en lecture seule ne connecte ni ne règle rien", () => {
  test.use({ storageState: connecte(MEMBRES_AGENDA.lecture.token) });
  test.beforeEach(async ({ page }) => surLeSite(page));

  test("Connecter un agenda Apple : refusé", async ({ page }) => {
    const filtre = { userId: MEMBRES_AGENDA.lecture.utilisateur._id, provider: "apple" };
    const avant = await photo("calendarconnections", filtre);
    const reponse = await appelApi(
      page,
      CONNECTER_APPLE,
      { input: { username: "lecture@icloud.test", appPassword: "abcd-efgh-ijkl-mnop" } },
      { organisation: ORG, delai: 15_000 },
    );
    expect(reponse.data?.connectAppleCalendar ?? null).toBeNull();
    expect(messageDe(reponse, "connectAppleCalendar")).toMatch(/permission|droit|autoris/i);
    expect(await photo("calendarconnections", filtre)).toBe(avant);
  });

  for (const [nom, champ, requete, variables] of OPERATIONS_CONNEXION.filter(([, c]) => ["syncCalendar", "updateAutoSync", "pushEventToCalendar", "updateSelectedCalendars"].includes(c))) {
    test(`${nom} avec sa propre connexion : refusé`, async ({ page }) => {
      const temoin = ["calendarconnections", { _id: CONNEXIONS.lecture._id }];
      const avant = await photo(...temoin);
      const reponse = await appelApi(page, requete, variables(id(CONNEXIONS.lecture)), { organisation: ORG, delai: 15_000 });
      expect(reponse.data?.[champ] ?? null, `${nom} : accepté sans le droit de modifier le calendrier`).toBeNull();
      expect(messageDe(reponse, champ)).toMatch(/permission|droit|autoris/i);
      expect(await photo(...temoin)).toBe(avant);
    });
  }

  test("Connecter Google ou Microsoft depuis le site : refusé", async ({ page }) => {
    for (const fournisseur of ["google", "microsoft"]) {
      const reponse = await appelRoute(page, `${BASE_URL}/api/calendar-connect/${fournisseur}/authorize`, { entetes: { "x-workspace-id": ORG } });
      expect(reponse.statut, `${fournisseur} : autorisation accordée sans le droit`).toBe(403);
      expect(reponse.texte, `${fournisseur} : une adresse d'autorisation est renvoyée`).not.toMatch(/authUrl/);
    }
  });
});

test.describe("Agendas connectés : autorisation Google ou Microsoft depuis un autre espace ou sans session", () => {
  test.describe("Intrus", () => {
    test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
    test("En visant l'espace « Agenda » : refusé", async ({ page }) => {
      await surLeSite(page);
      for (const fournisseur of ["google", "microsoft"]) {
        const reponse = await appelRoute(page, `${BASE_URL}/api/calendar-connect/${fournisseur}/authorize`, { entetes: { "x-workspace-id": ORG } });
        expect(reponse.statut, `${fournisseur} : autorisation accordée hors de son espace`).toBe(403);
        expect(reponse.texte).not.toMatch(/authUrl/);
      }
    });
  });
  test.describe("Sans session", () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test("Refusé", async ({ page }) => {
      await surLeSite(page);
      for (const fournisseur of ["google", "microsoft"]) {
        const reponse = await appelRoute(page, `${BASE_URL}/api/calendar-connect/${fournisseur}/authorize`, { entetes: { "x-workspace-id": ORG } });
        expect(reponse.statut, `${fournisseur} : accessible sans session`).toBe(401);
        expect(reponse.texte).not.toMatch(/authUrl/);
      }
    });
  });
});

/* --- Espace en lecture seule ---------------------------------------------- */

test.describe("Agendas connectés : un espace sans abonnement ne peut que déconnecter", () => {
  test.use({ storageState: connecte(AGENDA_LECTURE.token) });
  test.beforeEach(async ({ page }) => surLeSite(page));

  const REFUSEES = [
    ["Synchroniser", "syncCalendar", OPERATIONS_CONNEXION[1][2], () => ({ c: id(CONNEXIONS.lectureSeule) })],
    ["Synchronisation automatique", "updateAutoSync", OPERATIONS_CONNEXION[3][2], () => ({ input: { connectionId: id(CONNEXIONS.lectureSeule), enabled: true } })],
    [
      "Envoyer un événement",
      "pushEventToCalendar",
      OPERATIONS_CONNEXION[4][2],
      () => ({ input: { eventId: id(EVENEMENTS_AGENDA.lectureSeule), connectionId: id(CONNEXIONS.lectureSeule) } }),
    ],
    ["Connecter un agenda Apple", "connectAppleCalendar", CONNECTER_APPLE, () => ({ input: { username: "lecture@icloud.test", appPassword: "abcd-efgh-ijkl-mnop" } })],
  ];

  for (const [nom, champ, requete, variables] of REFUSEES) {
    test(`${nom} : refusé (abonnement inactif)`, async ({ page }) => {
      const temoins = [
        ["calendarconnections", { userId: AGENDA_LECTURE.utilisateur._id }],
        ["events", { _id: EVENEMENTS_AGENDA.lectureSeule._id }],
      ];
      const avant = await Promise.all(temoins.map((t) => photo(...t)));
      const reponse = await appelApi(page, requete, variables(), { organisation: ORG_LECTURE, delai: 15_000 });
      expect(reponse.data?.[champ]?.success ?? null, `${nom} : accepté sans abonnement`).not.toBe(true);
      expect(messageDe(reponse, champ)).toMatch(/abonnement/i);
      expect(await Promise.all(temoins.map((t) => photo(...t)))).toEqual(avant);
    });
  }

  test("Déconnecter son agenda reste permis", async ({ page }) => {
    const reponse = await appelApi(
      page,
      OPERATIONS_CONNEXION[0][2],
      { c: id(CONNEXIONS.lectureSeuleDeconnecter) },
      { organisation: ORG_LECTURE, delai: 15_000 },
    );
    verifierReussite(reponse, "disconnectCalendar", "Déconnecter (espace sans abonnement)");
    const doc = await (await base()).collection("calendarconnections").findOne({ _id: CONNEXIONS.lectureSeuleDeconnecter._id });
    expect(doc.status).toBe("disconnected");
  });
});

/* --- Retours OAuth -------------------------------------------------------- */

/** Code d'erreur transmis au site par la redirection du retour OAuth. */
function codeErreur(reponse, parametre) {
  expect(reponse.statut, `Le retour doit rediriger vers le site (reçu ${reponse.statut} ${reponse.texte.slice(0, 120)})`).toBe(302);
  const cible = new URL(reponse.entetes.location);
  expect(cible.origin, "Redirection hors du site").toBe(new URL(BASE_URL).origin);
  return cible.searchParams.get(parametre);
}

test.describe("Agendas connectés : retours OAuth refusés avant tout échange avec le fournisseur", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.beforeEach(async ({ page }) => surLeSite(page));

  const connexionsDe = (userId) => photo("calendarconnections", { userId });

  for (const fournisseur of ["google", "microsoft"]) {
    const retour = (state) => `${API_URL}/calendar-connect/${fournisseur}/callback?code=code-e2e&state=${encodeURIComponent(state)}`;
    const purpose = `calendar-connect:${fournisseur}`;

    test(`${fournisseur} : state fabriqué (signature fausse) refusé`, async ({ page }) => {
      const avant = await connexionsDe(AGENDA.utilisateur._id);
      const faux = Buffer.from(JSON.stringify({ userId: id(AGENDA.utilisateur), workspaceId: ORG, purpose })).toString("base64url") + ".signature-fausse";
      expect(codeErreur(await appelRoute(page, retour(faux)), "calendar_error")).toBe("invalid_state");
      expect(await connexionsDe(AGENDA.utilisateur._id)).toBe(avant);
    });

    test(`${fournisseur} : state expiré refusé`, async ({ page }) => {
      const avant = await connexionsDe(AGENDA.utilisateur._id);
      const expire = stateSigne(purpose, { userId: id(AGENDA.utilisateur), workspaceId: ORG, emisIlYaMs: 20 * 60_000 });
      expect(codeErreur(await appelRoute(page, retour(expire)), "calendar_error")).toBe("state_expired");
      expect(await connexionsDe(AGENDA.utilisateur._id)).toBe(avant);
    });

    // Usage unique du state : Redis exigé en production, absent de l'environnement de
    // test, d'où un refus « momentanément indisponible » avant le contrôle du droit.
    // Droit et rejeu sont vérifiés par les tests de l'API (calendar-connect-rights,
    // oauth-state-single-use) ; ici, le refus et l'absence de connexion.
    test(`${fournisseur} : state d'un membre sans droit de modifier le calendrier refusé, rien de connecté`, async ({ page }) => {
      const membre = MEMBRES_AGENDA.membre.utilisateur;
      const avant = await connexionsDe(membre._id);
      const state = stateSigne(purpose, { userId: id(membre), workspaceId: ORG });
      for (const essai of ["Premier retour", "Même state rejoué"]) {
        await etape(page, essai, async () => {
          expect(codeErreur(await appelRoute(page, retour(state)), "calendar_error")).toMatch(/^(forbidden|invalid_state|other_browser|Service momentanément indisponible, veuillez réessayer)$/);
        });
      }
      expect(await connexionsDe(membre._id)).toBe(avant);
    });

    // Adresse d'autorisation transmise à quelqu'un d'autre : son navigateur
    // n'a pas le cookie posé par /authorize chez celui qui a lancé la connexion
    test(`${fournisseur} : state valide terminé dans un autre navigateur refusé, rien de connecté`, async ({ page }) => {
      const avant = await connexionsDe(AGENDA.utilisateur._id);
      const state = stateSigne(purpose, { userId: id(AGENDA.utilisateur), workspaceId: ORG });
      expect(codeErreur(await appelRoute(page, retour(state)), "calendar_error")).toBe("other_browser");
      expect(await connexionsDe(AGENDA.utilisateur._id)).toBe(avant);
    });

    test(`${fournisseur} : state émis pour un autre parcours (Gmail) refusé`, async ({ page }) => {
      const autre = stateSigne("gmail-connect", { userId: id(AGENDA.utilisateur), workspaceId: ORG });
      expect(codeErreur(await appelRoute(page, retour(autre)), "calendar_error")).toBe("invalid_state");
    });
  }
});

/* --- Webhooks ------------------------------------------------------------- */

/** Une notification refusée ne lance aucune synchronisation : la connexion reste identique. */
async function sansSynchronisation(connexion, envoyer) {
  const temoin = ["calendarconnections", { _id: connexion._id }];
  const avant = await photo(...temoin);
  await envoyer();
  // La synchronisation part après la réponse : on lui laisse le temps d'écrire.
  await attendre(5_000);
  expect(await photo(...temoin), "Une synchronisation a été lancée par une notification non authentifiée").toBe(avant);
}

test.describe("Agendas connectés : une notification d'agenda non authentifiée ne lance rien", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.beforeEach(async ({ page }) => surLeSite(page));

  test("Google : identifiant de canal connu sans identifiant de ressource", async ({ page }) => {
    const c = CONNEXIONS.webhookGoogleSansRessource;
    await sansSynchronisation(c, async () => {
      const reponse = await appelRoute(page, `${API_URL}/calendar-webhooks/google`, {
        methode: "POST",
        entetes: { "x-goog-channel-id": c.webhookChannelId, "x-goog-resource-state": "exists" },
      });
      expect(reponse.statut).toBeLessThan(500);
    });
  });

  test("Google : identifiant de canal connu avec une autre ressource", async ({ page }) => {
    const c = CONNEXIONS.webhookGoogleMauvaiseRessource;
    await sansSynchronisation(c, async () => {
      const reponse = await appelRoute(page, `${API_URL}/calendar-webhooks/google`, {
        methode: "POST",
        entetes: { "x-goog-channel-id": c.webhookChannelId, "x-goog-resource-id": "ressource-inventee", "x-goog-resource-state": "exists" },
      });
      expect(reponse.statut).toBeLessThan(500);
    });
  });

  test("Microsoft : abonnement connu, clientState faux", async ({ page }) => {
    const c = CONNEXIONS.webhookMicrosoft;
    await sansSynchronisation(c, async () => {
      const reponse = await appelRoute(page, `${API_URL}/calendar-webhooks/microsoft`, {
        methode: "POST",
        entetes: { "content-type": "application/json" },
        corps: { value: [{ subscriptionId: c.graphSubscriptionId, clientState: "etat-invente", changeType: "updated" }] },
      });
      expect(reponse.statut).toBeLessThan(500);
    });
  });

  test("Microsoft : le jeton de validation est renvoyé en texte brut, jamais interprété", async ({ page }) => {
    const jeton = "<script>window.__xss=1</script>validation-e2e";
    const reponse = await appelRoute(page, `${API_URL}/calendar-webhooks/microsoft?validationToken=${encodeURIComponent(jeton)}`, { methode: "POST" });
    expect(reponse.statut).toBe(200);
    expect(reponse.entetes["content-type"]).toMatch(/^text\/plain/);
    expect(reponse.entetes["x-content-type-options"], "Le navigateur pourrait deviner un autre type").toBe("nosniff");
    expect(reponse.texte).toBe(jeton);
  });
});
