/**
 * Espaces : abonnement, réglages et étapes de l'espace appelés en dehors des
 * écrans, rôle par rôle. Stripe est coupé dans les tests : chaque refus doit
 * tomber avant tout appel à Stripe (sinon la route répondrait en erreur
 * serveur), et l'abonnement en base ne bouge pas.
 *
 * « Facturation » (donnees/lot-compte-espaces.mjs) : abonnement relié à
 * Stripe et un membre de chaque rôle (Administrateur, Éditeur, Membre,
 * Comptable, rôle personnalisé sans l'abonnement).
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { API_URL, connecte } from "../config.mjs";
import { COMPTES_CE, MEMBRES_FACTURATION } from "../donnees/lot-compte-espaces.mjs";
import { appelAuth, appelSite, SANS_SESSION } from "../authentification/outils-auth.mjs";

const db = () => base();
const F = COMPTES_CE.facturation.organisation._id.toHexString();
const REFUS_CONSOLE = /status of 4\d\d/;

const surLeSite = (page) => ouvrir(page, "/mentions-legales", { pret: page.getByRole("heading", { level: 1 }) });

/** Abonnement et réglages de « Facturation », pour vérifier que rien n'a bougé. */
async function photoFacturation() {
  const d = await db();
  const abonnements = await d.collection("subscription").find({ referenceId: F }).project({ _id: 0 }).toArray();
  const org = await d.collection("organization").findOne({ _id: COMPTES_CE.facturation.organisation._id }, { projection: { sessionSettings: 1, onboardingCompleted: 1 } });
  return JSON.stringify({ abonnements, org });
}

/** Refus net : 4xx (jamais une réussite, jamais une erreur serveur). */
function refuse(r, contexte) {
  expect.soft(r.statut, `${contexte} : répond ${r.statut} (${JSON.stringify(r.corps)?.slice(0, 160)})`).toBeGreaterThanOrEqual(400);
  expect.soft(r.statut, `${contexte} : erreur serveur`).toBeLessThan(500);
}

// Routes qui modifient l'abonnement (« Gérer l'abonnement », super admin pour certaines)
const GESTION = [
  ["Souscrire (espace existant)", "/api/create-org-subscription", "POST", { organizationData: { type: "existing", planName: "entreprise", isAnnual: false } }],
  ["Souscrire (billing/subscribe)", "/api/billing/subscribe", "POST", { plan: "entreprise", isAnnual: false }],
  ["Changer de plan", "/api/change-subscription-plan", "POST", { newPlan: "entreprise", isAnnual: false, organizationId: F }],
  ["Prévisualiser un changement de plan", "/api/preview-plan-change", "POST", { newPlan: "entreprise", isAnnual: false, organizationId: F }],
  ["Synchroniser les sièges", "/api/billing/sync-seats", "POST", { organizationId: F }],
  ["Portail Stripe", "/api/stripe/billing-portal", "POST", { organizationId: F }],
];
// Lectures réservées à « Voir l'abonnement »
const LECTURE = [
  ["Factures Stripe", `/api/stripe/invoices?organizationId=${F}`, "GET", undefined],
  ["Statut Stripe", "/api/sync-subscription-status", "POST", { stripeSubscriptionId: "sub_e2eFacturation", organizationId: F }],
];
// Plugin Stripe de Better Auth
const PLUGIN = [
  ["upgrade", "/subscription/upgrade", { plan: "entreprise", referenceId: F, successUrl: "/dashboard", cancelUrl: "/dashboard" }],
  ["cancel", "/subscription/cancel", { referenceId: F, returnUrl: "/dashboard" }],
  ["restore", "/subscription/restore", { referenceId: F }],
  ["billing-portal", "/subscription/billing-portal", { referenceId: F, returnUrl: "/dashboard" }],
];

const ROLES = [
  ["Membre", MEMBRES_FACTURATION.membre, { lecture: false }],
  ["Éditeur", MEMBRES_FACTURATION.editeur, { lecture: false }],
  ["rôle personnalisé sans l'abonnement", MEMBRES_FACTURATION.perso, { lecture: false }],
  ["Comptable", MEMBRES_FACTURATION.comptable, { lecture: true }],
  ["Administrateur", MEMBRES_FACTURATION.admin, { lecture: true }],
];

for (const [libelle, membre, { lecture }] of ROLES) {
  test.describe(`Abonnement : droits du rôle « ${libelle} » de « Facturation »`, () => {
    test.use({ storageState: connecte(membre.token), erreursConsoleAutorisees: REFUS_CONSOLE });

    test("Modifier l'abonnement (routes du site) : refusé avant Stripe, rien ne change", async ({ page }) => {
      await surLeSite(page);
      const avant = await photoFacturation();
      for (const [nom, url, methode, corps] of GESTION) refuse(await appelSite(page, url, { methode, corps }), nom);
      expect(await photoFacturation()).toBe(avant);
    });

    test("Plugin Stripe (upgrade, cancel, restore, portail) : refusé, rien ne change", async ({ page }) => {
      await surLeSite(page);
      const avant = await photoFacturation();
      for (const [nom, chemin, corps] of PLUGIN) refuse(await appelAuth(page, chemin, { corps }), nom);
      expect(await photoFacturation()).toBe(avant);
    });

    if (!lecture) {
      test("Factures et statut Stripe : refusés", async ({ page }) => {
        await surLeSite(page);
        for (const [nom, url, methode, corps] of LECTURE) refuse(await appelSite(page, url, { methode, corps }), nom);
      });

      test("Abonnement de l'espace : lisible sans les identifiants Stripe", async ({ page }) => {
        await surLeSite(page);
        const liste = await appelAuth(page, `/subscription/list?referenceId=${F}`, { methode: "GET" });
        expect(liste.statut).toBe(200);
        expect(liste.corps.length).toBeGreaterThan(0);
        expect(JSON.stringify(liste.corps), "Identifiants Stripe renvoyés par /api/auth/subscription/list").not.toMatch(/cus_e2eFacturation|sub_e2eFacturation/);
        const site = await appelSite(page, `/api/organizations/${F}/subscription`);
        expect(site.statut).toBe(200);
        expect(JSON.stringify(site.corps)).not.toMatch(/cus_e2eFacturation|sub_e2eFacturation/);
      });
    } else {
      test("Abonnement de l'espace : identifiants Stripe visibles (« Voir l'abonnement »)", async ({ page }) => {
        await surLeSite(page);
        const liste = await appelAuth(page, `/subscription/list?referenceId=${F}`, { methode: "GET" });
        expect(liste.statut).toBe(200);
        expect(JSON.stringify(liste.corps)).toContain("cus_e2eFacturation");
      });
    }

    test("Réglages de session de l'espace : refusés, rien ne change", async ({ page }) => {
      test.skip(libelle === "Administrateur", "L'Administrateur modifie les informations de l'entreprise");
      await surLeSite(page);
      const avant = await photoFacturation();
      refuse(await appelSite(page, "/api/session-settings", { methode: "PUT", corps: { maxSessions: 1, sessionDuration: 7 } }), "Réglages de session");
      expect(await photoFacturation()).toBe(avant);
    });

    test("Terminer l'inscription de l'espace : refusé", async ({ page }) => {
      test.skip(libelle === "Administrateur", "L'Administrateur peut terminer l'inscription de l'espace");
      await surLeSite(page);
      refuse(await appelSite(page, `/api/organizations/${F}/complete-onboarding`, { methode: "POST" }), "complete-onboarding");
    });
  });
}

test.describe("Abonnement : un autre compte n'atteint pas « Facturation »", () => {
  test.use({ storageState: connecte(COMPTES_CE.reglages.token), erreursConsoleAutorisees: REFUS_CONSOLE });

  test("Routes de l'abonnement visant « Facturation » : refusées, rien ne change", async ({ page }) => {
    await surLeSite(page);
    const avant = await photoFacturation();
    for (const [nom, url, methode, corps] of [...GESTION.filter(([, url]) => !/create-org-subscription|billing\/subscribe/.test(url)), ...LECTURE]) {
      refuse(await appelSite(page, url, { methode, corps }), nom);
    }
    refuse(await appelSite(page, `/api/organizations/${F}/sync-subscription`, { methode: "POST" }), "sync-subscription");
    refuse(await appelSite(page, `/api/organizations/${F}/subscription`), "Lire l'abonnement");
    refuse(await appelSite(page, `/api/organizations/${F}/seats-info`), "Lire les sièges");
    refuse(await appelSite(page, `/api/organizations/${F}/complete-onboarding`, { methode: "POST" }), "complete-onboarding");
    for (const [nom, chemin, corps] of PLUGIN) refuse(await appelAuth(page, chemin, { corps }), `plugin ${nom}`);
    refuse(await appelAuth(page, `/subscription/list?referenceId=${F}`, { methode: "GET" }), "plugin list");
    expect(await photoFacturation()).toBe(avant);
  });

  test("Réordonner les espaces avec ceux des autres : leurs adhésions ne changent pas", async ({ page }) => {
    await surLeSite(page);
    const adhesions = async () => JSON.stringify(await (await db()).collection("member").find({ organizationId: COMPTES_CE.facturation.organisation._id }).sort({ _id: 1 }).toArray());
    const avant = await adhesions();
    const r = await appelSite(page, "/api/organization/reorder", { methode: "POST", corps: { organizationIds: [F, COMPTES_CE.reglages.organisation._id.toHexString()] } });
    expect(r.statut).toBeLessThan(500);
    expect(await adhesions()).toBe(avant);
  });

  test("Réordonner avec des identifiants mal formés : 400, pas d'erreur serveur", async ({ page }) => {
    await surLeSite(page);
    for (const organizationIds of [["pas-un-id"], [{ $ne: null }]]) {
      const r = await appelSite(page, "/api/organization/reorder", { methode: "POST", corps: { organizationIds } });
      expect.soft(r.statut, JSON.stringify(organizationIds)).toBe(400);
    }
  });
});

test.describe("Abonnement : identifiant d'espace mal formé", () => {
  test.use({ storageState: connecte(COMPTES_CE.facturation.token), erreursConsoleAutorisees: REFUS_CONSOLE });
  test("Chaque route répond 400 ou 403, jamais une erreur serveur", async ({ page }) => {
    await surLeSite(page);
    for (const [nom, url, methode, corps] of [
      ["Changer de plan", "/api/change-subscription-plan", "POST", { newPlan: "entreprise", isAnnual: false, organizationId: "pas-un-id" }],
      ["Prévisualiser", "/api/preview-plan-change", "POST", { newPlan: "entreprise", isAnnual: false, organizationId: "pas-un-id" }],
      ["Sièges (écriture)", "/api/billing/sync-seats", "POST", { organizationId: "pas-un-id" }],
      ["Sièges (lecture)", "/api/billing/sync-seats?organizationId=pas-un-id", "GET", undefined],
      ["Factures Stripe", "/api/stripe/invoices?organizationId=pas-un-id", "GET", undefined],
      ["Portail Stripe", "/api/stripe/billing-portal", "POST", { organizationId: "pas-un-id" }],
      ["Synchroniser", "/api/organizations/pas-un-id/sync-subscription", "POST", undefined],
      ["Lire l'abonnement", "/api/organizations/pas-un-id/subscription", "GET", undefined],
    ]) {
      refuse(await appelSite(page, url, { methode, corps }), nom);
    }
  });
});

test.describe("Abonnement : sans session, rien", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: REFUS_CONSOLE });
  test("Toutes les routes refusent (401), rien ne change", async ({ page }) => {
    await surLeSite(page);
    const avant = await photoFacturation();
    for (const [nom, url, methode, corps] of [...GESTION, ...LECTURE, ["sync-subscription", `/api/organizations/${F}/sync-subscription`, "POST", undefined], ["session-settings", "/api/session-settings", "PUT", { maxSessions: 1 }]]) {
      const r = await appelSite(page, url, { methode, corps });
      expect.soft(r.statut, `${nom} sans session : ${r.statut}`).toBe(401);
    }
    for (const [nom, chemin, corps] of PLUGIN) refuse(await appelAuth(page, chemin, { corps }), `plugin ${nom}`);
    expect(await photoFacturation()).toBe(avant);
  });
});

test.describe("Webhook Stripe : signature exigée", () => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: REFUS_CONSOLE });
  test("Sans signature ou signé avec un autre secret : 400, aucune écriture", async ({ page }) => {
    await surLeSite(page);
    const avant = await photoFacturation();
    const evenement = {
      id: "evt_e2e_pirate",
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_e2eFacturation", customer: "cus_e2eFacturation", status: "canceled", metadata: { referenceId: F } } },
    };
    for (const signature of [null, "t=1700000000,v1=0000000000000000000000000000000000000000000000000000000000000000"]) {
      const r = await page.request.post("/api/auth/stripe/webhook", {
        headers: { "content-type": "application/json", ...(signature ? { "stripe-signature": signature } : {}) },
        data: JSON.stringify(evenement),
      });
      expect.soft(r.status(), `Webhook ${signature ? "mal signé" : "sans signature"} : ${r.status()}`).toBe(400);
    }
    expect(await photoFacturation()).toBe(avant);
    expect(await (await db()).collection("stripeWebhookEvents").countDocuments({ eventId: "evt_e2e_pirate" })).toBe(0);
  });
});

test.describe("Réglages de session : valeurs hors liste", () => {
  test.use({ storageState: connecte(COMPTES_CE.reglages.token), erreursConsoleAutorisees: REFUS_CONSOLE });
  const org = () => COMPTES_CE.reglages.organisation._id;
  for (const [cas, corps] of [
    ["sessions illimitées (0)", { maxSessions: 0 }],
    ["99 sessions", { maxSessions: 99 }],
    ["« 1e9 » sessions", { maxSessions: "1e9" }],
    ["délai d'inactivité négatif", { inactivityTimeout: -1 }],
    ["durée de 365 jours", { sessionDuration: 365 }],
  ]) {
    test(`${cas} : refusé avec un message, rien en base`, async ({ page }) => {
      await surLeSite(page);
      const avant = (await (await db()).collection("organization").findOne({ _id: org() })).sessionSettings;
      const r = await appelSite(page, "/api/session-settings", { methode: "PUT", corps });
      expect(r.statut).toBe(400);
      expect(r.corps?.error).toBeTruthy();
      expect((await (await db()).collection("organization").findOne({ _id: org() })).sessionSettings).toEqual(avant);
    });
  }
});

test.describe("Inscription : étapes contrôlées par le serveur", () => {
  test.use({ erreursConsoleAutorisees: REFUS_CONSOLE });

  test.describe(() => {
    test.use({ storageState: SANS_SESSION });
    test("Sans session : 401", async ({ page }) => {
      await surLeSite(page);
      const r = await appelSite(page, "/api/onboarding/step", { methode: "PATCH", corps: { step: "recap" } });
      expect(r.statut).toBe(401);
    });
  });

  test.describe(() => {
    test.use({ storageState: connecte(COMPTES_CE.onboarding.token) });
    test("Étape inconnue ou saut d'étape : 400, l'étape enregistrée ne change pas", async ({ page }) => {
      const compte = COMPTES_CE.onboarding;
      await surLeSite(page);
      for (const corps of [{ step: "inconnue" }, { step: "completed", data: { companyName: "Saut SAS" } }, { step: { $ne: null } }]) {
        const r = await appelSite(page, "/api/onboarding/step", { methode: "PATCH", corps });
        expect.soft(r.statut, JSON.stringify(corps)).toBe(400);
      }
      const u = await (await db()).collection("user").findOne({ _id: compte.utilisateur._id });
      expect(u.onboardingStep).toBe("workspace");
    });
  });

  test.describe(() => {
    test.use({ storageState: connecte(COMPTES_CE.reglages.token) });
    test("Inscription déjà terminée : toute nouvelle étape est refusée", async ({ page }) => {
      await surLeSite(page);
      const r = await appelSite(page, "/api/onboarding/step", { methode: "PATCH", corps: { step: "workspace", data: { companyName: "Autre SAS" } } });
      expect(r.statut).toBe(400);
    });
  });

  test.describe(() => {
    test.use({ storageState: connecte(COMPTES_CE.expire.token) });
    test("Terminer l'inscription d'un espace sans abonnement ni essai : 400", async ({ page }) => {
      await surLeSite(page);
      const r = await appelSite(page, `/api/organizations/${COMPTES_CE.expire.organisation._id.toHexString()}/complete-onboarding`, { methode: "POST" });
      expect(r.statut).toBe(400);
    });
  });
});

/** Mutation GraphQL avec les en-têtes choisis (jeton de la session de la page). */
async function graphqlAvecEntetes(page, query, variables, entetes) {
  return page.evaluate(
    async ({ api, query, variables, entetes }) => {
      const jeton = await fetch("/api/auth/token", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => d.token);
      const res = await fetch(`${api}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-app-client": "web", authorization: `Bearer ${jeton}`, ...entetes },
        body: JSON.stringify({ query, variables }),
      });
      const corps = await res.json().catch(() => ({}));
      return { data: corps.data ?? null, errors: corps.errors ?? [] };
    },
    { api: API_URL, query, variables, entetes },
  );
}

test.describe("Lecture seule après l'essai : tenue par l'API", () => {
  test.use({ storageState: connecte(COMPTES_CE.expire.token), erreursConsoleAutorisees: REFUS_CONSOLE });
  const propre = COMPTES_CE.expire.organisation._id.toHexString();
  const CAS = [
    ["en-tête de son espace", { "x-organization-id": propre }],
    ["sans en-tête (espace passé en argument)", {}],
    ["son espace et l'espace payé d'un autre compte en x-workspace-id", { "x-organization-id": propre, "x-workspace-id": F }],
  ];

  for (const [cas, entetes] of CAS) {
    test(`${cas} : créer un contact et un tableau est refusé, rien en base`, async ({ page }) => {
      await surLeSite(page);
      const nom = `Lecture seule ${cas}`;
      const contact = await graphqlAvecEntetes(
        page,
        `mutation($w: String, $input: ClientInput!) { createClient(workspaceId: $w, input: $input) { id } }`,
        { w: propre, input: { type: "COMPANY", name: nom, email: "lecture-seule@e2e.test", siret: "12345678900011", address: { street: "1 rue du Contrôle", city: "Paris", postalCode: "75001", country: "France" } } },
        entetes,
      );
      expect.soft(contact.data?.createClient ?? null, "Contact créé dans un espace en lecture seule").toBeNull();
      expect.soft(contact.errors.map((e) => `${e.extensions?.code} ${e.message}`).join(" | ")).toMatch(/SUBSCRIPTION_READ_ONLY|abonnement est inactif|FORBIDDEN/);
      const tableau = await graphqlAvecEntetes(page, `mutation($w: ID, $input: CreateBoardInput!) { createBoard(workspaceId: $w, input: $input) { id } }`, { w: propre, input: { title: nom } }, entetes);
      expect.soft(tableau.data?.createBoard ?? null, "Tableau créé dans un espace en lecture seule").toBeNull();
      const d = await db();
      expect(await d.collection("clients").countDocuments({ name: nom })).toBe(0);
      expect(await d.collection("boards").countDocuments({ title: nom })).toBe(0);
    });
  }
});
