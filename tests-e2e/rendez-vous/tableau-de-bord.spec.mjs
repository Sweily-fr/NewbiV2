/**
 * Prise de rendez-vous côté tableau de bord : droits vérifiés à l'API,
 * opération par opération, avec la session du navigateur (espace
 * « Rendez-vous Test », lot-rendez-vous.mjs).
 *   - chaque organisateur ne voit et n'annule que ses propres rendez-vous :
 *     celui du gérant est introuvable pour l'Éditeur ;
 *   - « Membre » : lit sa page, ne crée ni ne modifie rien ;
 *   - « Comptable » : aucun accès à la prise de rendez-vous ;
 *   - une autre entreprise : refus ;
 *   - le message d'un invité s'affiche comme du texte chez l'organisateur.
 * Un refus laisse la base identique.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_INTRUS } from "../config.mjs";
import { appelApi, id } from "../securite.mjs";
import { refusSansEffet, verifierRefusCollab, verifierReussite, sansFuite } from "../securite-collaboration.mjs";
import { COMPTES_RDV, MEMBRES_RDV, PAGES_RDV, RESERVATIONS } from "../donnees/lot-rendez-vous.mjs";

const ORG = id(COMPTES_RDV.principal.organisation);
const R = RESERVATIONS;

const MA_PAGE = `query($w: ID){ myBookingPage(workspaceId:$w){ id slug title } }`;
const UNE_RESERVATION = `query($w: ID,$id: ID!){ booking(workspaceId:$w,id:$id){ id guest{ email firstName lastName } } }`;
const LES_RESERVATIONS = `query($w: ID){ bookings(workspaceId:$w,scope:"all"){ items{ id guest{ email } } totalCount } }`;

const ECRITURES = [
  {
    nom: "Créer ou modifier sa page",
    champ: "upsertBookingPage",
    requete: `mutation($w: ID,$input: BookingPageInput!){ upsertBookingPage(workspaceId:$w,input:$input){ id title } }`,
    variables: (w, qui) => ({ w, input: { title: `Page de ${qui}` } }),
    temoin: (qui) => ["booking_pages", { title: `Page de ${qui}` }],
  },
  {
    nom: "Créer un type de rendez-vous",
    champ: "createAppointmentType",
    requete: `mutation($w: ID,$input: AppointmentTypeInput!){ createAppointmentType(workspaceId:$w,input:$input){ id } }`,
    variables: (w, qui) => ({ w, input: { name: `Type de ${qui}`, durationMinutes: 30, location: { kind: "PHONE" } } }),
    temoin: (qui) => ["appointment_types", { name: `Type de ${qui}` }],
  },
  {
    nom: "Annuler le rendez-vous du gérant",
    champ: "cancelBooking",
    requete: `mutation($w: ID,$id: ID!){ cancelBooking(workspaceId:$w,id:$id){ id status } }`,
    variables: (w) => ({ w, id: id(R.proprietaire.doc) }),
    temoin: () => ["bookings", { _id: R.proprietaire.doc._id }],
  },
];
const [UPSERT, CREER_TYPE, ANNULER] = ECRITURES;

test.describe("Rendez-vous (tableau de bord) : l'Éditeur ne voit que ses rendez-vous", () => {
  test.use({ storageState: connecte(MEMBRES_RDV.editeur.token) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Le rendez-vous du gérant : introuvable, absent de sa liste", async ({ page }) => {
    const une = await appelApi(page, UNE_RESERVATION, { w: ORG, id: id(R.proprietaire.doc) }, { organisation: ORG });
    expect(une.data?.booking ?? null, "Le rendez-vous du gérant est renvoyé à l'Éditeur").toBeNull();
    sansFuite(une, [R.proprietaire.doc.guest.email], "booking (Éditeur)");
    const liste = verifierReussite(await appelApi(page, LES_RESERVATIONS, { w: ORG }, { organisation: ORG }), "bookings", "Ses rendez-vous");
    expect(liste.items.map((b) => b.id)).not.toContain(id(R.proprietaire.doc));
  });

  test("Annuler le rendez-vous du gérant : introuvable, rien ne change", async ({ page }) => {
    await refusSansEffet(page, ANNULER, "Éditeur", ORG);
  });

  test("Crée un type de rendez-vous sur sa propre page", async ({ page }) => {
    const reponse = await appelApi(page, CREER_TYPE.requete, CREER_TYPE.variables(ORG, "l'Éditeur Élio"), { organisation: ORG, delai: 15_000 });
    // Sans page, le type est refusé avec un message ; avec, il est créé.
    if (reponse.errors.length) {
      expect(reponse.errors.map((e) => e.message).join(" | ")).toMatch(/page/i);
    } else {
      expect(verifierReussite(reponse, "createAppointmentType", "Créer un type (Éditeur)").id).toBeTruthy();
    }
  });
});

test.describe("Rendez-vous (tableau de bord) : le rôle « Membre » lit sans rien modifier", () => {
  test.use({ storageState: connecte(MEMBRES_RDV.membre.token) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Lit sa page", async ({ page }) => {
    const reponse = await appelApi(page, MA_PAGE, { w: ORG }, { organisation: ORG });
    expect(verifierReussite(reponse, "myBookingPage", "Sa page (Membre)").slug).toBe(PAGES_RDV.membre.slug);
  });

  for (const op of ECRITURES) {
    test(`${op.nom} : refusé`, async ({ page }) => {
      await refusSansEffet(page, op, "Membre", ORG);
    });
  }
});

test.describe("Rendez-vous (tableau de bord) : le rôle « Comptable » n'a aucun accès", () => {
  test.use({ storageState: connecte(MEMBRES_RDV.comptable.token) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Page, réservations et rendez-vous du gérant : refusés", async ({ page }) => {
    verifierRefusCollab(await appelApi(page, MA_PAGE, { w: ORG }, { organisation: ORG }), "myBookingPage", "Sa page (Comptable)");
    const liste = await appelApi(page, LES_RESERVATIONS, { w: ORG }, { organisation: ORG });
    verifierRefusCollab(liste, "bookings", "Réservations (Comptable)");
    sansFuite(liste, [R.proprietaire.doc.guest.email], "bookings (Comptable)");
  });

  for (const op of ECRITURES) {
    test(`${op.nom} : refusé`, async ({ page }) => {
      await refusSansEffet(page, op, "Comptable", ORG);
    });
  }
});

test.describe("Rendez-vous (tableau de bord) : une autre entreprise n'atteint rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
  test.beforeEach(async ({ page }) => ouvrir(page, "/dashboard"));

  test("Lire les rendez-vous des autres : refusé, sans fuite", async ({ page }) => {
    for (const [requete, champ, variables] of [
      [UNE_RESERVATION, "booking", { w: ORG, id: id(R.proprietaire.doc) }],
      [LES_RESERVATIONS, "bookings", { w: ORG }],
      [MA_PAGE, "myBookingPage", { w: ORG }],
    ]) {
      const reponse = await appelApi(page, requete, variables, { organisation: ORG });
      sansFuite(reponse, [R.proprietaire.doc.guest.email, PAGES_RDV.principale.slug], `${champ} (intrus)`);
      verifierRefusCollab(reponse, champ, `${champ} (intrus)`);
    }
  });

  test("Annuler le rendez-vous des autres : refusé", async ({ page }) => {
    await refusSansEffet(page, ANNULER, "intrus", ORG);
  });
});

test.describe("Rendez-vous (tableau de bord) : le message d'un invité reste du texte", () => {
  test.use({ storageState: connecte(COMPTES_RDV.principal.token), erreursConsoleAutorisees: /x-rdv-piege/ });

  test("Message piégé affiché tel quel, rien ne s'exécute", async ({ page }) => {
    await ouvrir(page, "/dashboard/outils/rendez-vous?onglet=reservations", { pret: page.getByRole("heading", { name: "Prise de rendez-vous" }) });
    const ligne = page.getByRole("button", { name: /Zoé Piège/ }).first();
    await expect(ligne).toBeVisible({ timeout: 20_000 });
    await cliquer(page, ligne);
    await etape(
      page,
      "Le message est lisible en texte",
      async () => {
        await expect(page.getByText("Message de l'invité")).toBeVisible();
        await expect(page.getByText(/<img src="x-rdv-piege"/)).toBeVisible();
      },
      { capture: "ecran" },
    );
    expect(await page.evaluate(() => window.__xssRdv ?? null), "Le message de l'invité a exécuté du code").toBeNull();
  });
});
