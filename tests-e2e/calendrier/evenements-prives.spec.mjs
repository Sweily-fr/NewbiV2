/**
 * Calendrier : ce qu'un membre ne voit pas, il ne le touche pas (espace
 * « Agenda », lot-calendrier.mjs). Appels directs à l'API avec la session :
 *   - l'événement privé d'un autre membre n'est ni modifié, ni supprimé, ni
 *     envoyé vers un agenda externe, et la réponse ne dit pas qu'il existe ;
 *   - un événement n'est assigné qu'à des membres de l'espace : jamais le
 *     nom ni l'e-mail d'un utilisateur d'une autre entreprise ;
 *   - sans « Voir » des factures, une échéance de facture n'est ni lue ni
 *     transformée en événement ordinaire.
 * Un refus laisse la base identique.
 */
import { test, expect, etape } from "../outils.mjs";
import { connecte } from "../config.mjs";
import { base } from "../base.mjs";
import { appelApi, id } from "../securite.mjs";
import { photo, sansFuite, verifierReussite } from "../securite-collaboration.mjs";
import { AGENDA, MEMBRES_AGENDA, EVENEMENTS_AGENDA, CONNEXIONS, INTRUS } from "../donnees/lot-calendrier.mjs";
import { surLeSite } from "./outils-agenda.mjs";

const ORG = id(AGENDA.organisation);
const E = EVENEMENTS_AGENDA;

const LIRE_UN = `query($w: ID,$id: ID!){ getEvent(workspaceId:$w,id:$id){ success message event{ id title description } } }`;
const LIRE_TOUS = `query($w: ID){ getEvents(workspaceId:$w,includeExternalCalendars:true){ success events{ id title type description assignedMembers assignedMembersInfo{ id name email } } } }`;
const MODIFIER = `mutation($w: ID,$input: UpdateEventInput!){ updateEvent(workspaceId:$w,input:$input){ success message event{ id title type assignedMembers assignedMembersInfo{ id name email } } } }`;
const SUPPRIMER = `mutation($w: ID,$id: ID!){ deleteEvent(workspaceId:$w,id:$id){ success message } }`;
const CREER = `mutation($w: ID,$input: CreateEventInput!){ createEvent(workspaceId:$w,input:$input){ success message event{ id assignedMembers assignedMembersInfo{ id name email } } } }`;
const ENVOYER = `mutation($input: PushEventToCalendarInput!){ pushEventToCalendar(input:$input){ success message } }`;
const SYNCHRO_FACTURES = `mutation($w: ID){ syncInvoiceEvents(workspaceId:$w){ success message totalCount } }`;

const dans = (jours) => new Date(Date.now() + jours * 86_400_000).toISOString();

/**
 * Refus qui ne confirme pas l'existence de l'événement : réponse
 * « success: false » avec le message « Événement non trouvé » (le même que
 * pour un identifiant qui n'existe pas), et base inchangée.
 */
async function refusIntrouvable(page, requete, variables, champ, temoins, contexte) {
  const avant = await Promise.all(temoins.map(([c, f]) => photo(c, f)));
  const reponse = await appelApi(page, requete, variables, { organisation: ORG, delai: 15_000 });
  expect(reponse.sansReponse, `${contexte} : l'API n'a pas répondu`).not.toBe(true);
  const valeur = reponse.data?.[champ];
  expect(valeur?.success ?? null, `${contexte} : l'opération a réussi (réponse ${JSON.stringify(reponse.data)?.slice(0, 300)})`).not.toBe(true);
  const message = [valeur?.message, ...reponse.errors.map((e) => e.message)].filter(Boolean).join(" | ");
  expect(message, `${contexte} : la réponse doit dire « introuvable », sans révéler l'événement`).toMatch(/non trouv|introuvable/i);
  const apres = await Promise.all(temoins.map(([c, f]) => photo(c, f)));
  expect(apres, `${contexte} : la base a changé malgré le refus`).toEqual(avant);
  return reponse;
}

/* --- Événements privés d'un autre membre --------------------------------- */

test.describe("Calendrier : l'événement privé d'un autre membre reste le sien", () => {
  test.describe("Éditeur", () => {
    test.use({ storageState: connecte(MEMBRES_AGENDA.editeur.token) });
    test.beforeEach(async ({ page }) => surLeSite(page));

    test("Ne lit pas l'événement privé du gérant", async ({ page }) => {
      const reponse = await appelApi(page, LIRE_UN, { w: ORG, id: id(E.priveLecture) }, { organisation: ORG });
      expect(reponse.data?.getEvent?.success, "L'événement privé du gérant est renvoyé à l'Éditeur").toBe(false);
      sansFuite(reponse, [E.priveLecture.title, E.priveLecture.description], "getEvent (Éditeur)");
    });

    test("Ne voit pas les événements privés du gérant dans la liste", async ({ page }) => {
      const reponse = await appelApi(page, LIRE_TOUS, { w: ORG }, { organisation: ORG });
      verifierReussite(reponse, "getEvents", "Liste des événements (Éditeur)");
      sansFuite(reponse, [E.priveLecture.title, E.priveLecture.description], "getEvents (Éditeur)");
    });

    test("Ne modifie pas l'événement privé du gérant", async ({ page }) => {
      await refusIntrouvable(
        page,
        MODIFIER,
        { w: ORG, input: { id: id(E.priveModifier), title: "Modifié par l'Éditeur" } },
        "updateEvent",
        [["events", { _id: E.priveModifier._id }]],
        "Modifier l'événement privé du gérant",
      );
    });

    test("N'envoie pas l'événement privé du gérant vers son propre agenda", async ({ page }) => {
      await refusIntrouvable(
        page,
        ENVOYER,
        { input: { eventId: id(E.priveEnvoyer), connectionId: id(CONNEXIONS.editeurPrive) } },
        "pushEventToCalendar",
        [
          ["events", { _id: E.priveEnvoyer._id }],
          ["calendarconnections", { _id: CONNEXIONS.editeurPrive._id }],
        ],
        "Envoyer l'événement privé du gérant",
      );
    });

    test("Modifie son propre événement privé", async ({ page }) => {
      const titre = "Note privée de l'Éditeur, relue";
      const reponse = await appelApi(page, MODIFIER, { w: ORG, input: { id: id(E.priveEditeur), title: titre } }, { organisation: ORG, delai: 15_000 });
      verifierReussite(reponse, "updateEvent", "Modifier son propre événement privé");
      const doc = await (await base()).collection("events").findOne({ _id: E.priveEditeur._id });
      expect(doc.title).toBe(titre);
      expect(doc.visibility, "L'événement doit rester privé").toBe("private");
    });
  });

  test.describe("Administrateur", () => {
    test.use({ storageState: connecte(MEMBRES_AGENDA.admin.token) });
    test.beforeEach(async ({ page }) => surLeSite(page));

    test("Ne supprime pas l'événement privé du gérant", async ({ page }) => {
      await refusIntrouvable(
        page,
        SUPPRIMER,
        { w: ORG, id: id(E.priveSupprimer) },
        "deleteEvent",
        [["events", { _id: E.priveSupprimer._id }]],
        "Supprimer l'événement privé du gérant",
      );
      expect(await (await base()).collection("events").countDocuments({ _id: E.priveSupprimer._id }), "L'événement privé a été supprimé").toBe(1);
    });

  });
});

/* --- Membres assignés ----------------------------------------------------- */

const INTRUS_ID = id(INTRUS.utilisateur);
const FUITE_INTRUS = [INTRUS.utilisateur.email, INTRUS.utilisateur.name];
const EDITEUR_ID = id(MEMBRES_AGENDA.editeur.utilisateur);
const MEMBRE_ID = id(MEMBRES_AGENDA.membre.utilisateur);

test.describe("Calendrier : seuls des membres de l'espace sont assignés à un événement", () => {
  test.use({ storageState: connecte(AGENDA.token) });
  test.beforeEach(async ({ page }) => surLeSite(page));

  test("À la création, l'utilisateur d'une autre entreprise est écarté", async ({ page }) => {
    const titre = "Atelier avec une personne extérieure";
    const reponse = await appelApi(
      page,
      CREER,
      { w: ORG, input: { title: titre, start: dans(4), end: dans(4), assignedMembers: [INTRUS_ID, EDITEUR_ID] } },
      { organisation: ORG, delai: 15_000 },
    );
    verifierReussite(reponse, "createEvent", "Créer un événement");
    sansFuite(reponse, FUITE_INTRUS, "Réponse de createEvent");
    const doc = await (await base()).collection("events").findOne({ workspaceId: AGENDA.organisation._id, title: titre });
    expect(doc, "L'événement n'a pas été enregistré").toBeTruthy();
    expect(doc.assignedMembers, "Seul le membre de l'espace doit rester assigné").toEqual([EDITEUR_ID]);
    await etape(page, "La liste des événements ne donne ni le nom ni l'e-mail de l'utilisateur extérieur", async () => {
      const liste = await appelApi(page, LIRE_TOUS, { w: ORG }, { organisation: ORG });
      sansFuite(liste, FUITE_INTRUS, "getEvents après création");
    });
  });

  test("À la modification, l'utilisateur d'une autre entreprise est écarté", async ({ page }) => {
    const reponse = await appelApi(
      page,
      MODIFIER,
      { w: ORG, input: { id: id(E.equipeAssigner), assignedMembers: [INTRUS_ID] } },
      { organisation: ORG, delai: 15_000 },
    );
    sansFuite(reponse, FUITE_INTRUS, "Réponse de updateEvent");
    const doc = await (await base()).collection("events").findOne({ _id: E.equipeAssigner._id });
    expect(doc.assignedMembers || [], "L'utilisateur d'une autre entreprise a été assigné").not.toContain(INTRUS_ID);
    const liste = await appelApi(page, LIRE_TOUS, { w: ORG }, { organisation: ORG });
    sansFuite(liste, FUITE_INTRUS, "getEvents après modification");
  });

  test("Les membres de l'espace sont assignés, avec leur nom", async ({ page }) => {
    const titre = "Revue trimestrielle de l'équipe";
    const reponse = await appelApi(
      page,
      CREER,
      { w: ORG, input: { title: titre, start: dans(5), end: dans(5), assignedMembers: [EDITEUR_ID, MEMBRE_ID] } },
      { organisation: ORG, delai: 15_000 },
    );
    const cree = verifierReussite(reponse, "createEvent", "Créer un événement avec deux membres");
    expect(cree.event.assignedMembers).toEqual([EDITEUR_ID, MEMBRE_ID]);
    expect(cree.event.assignedMembersInfo.map((m) => m.name)).toEqual([MEMBRES_AGENDA.editeur.utilisateur.name, MEMBRES_AGENDA.membre.utilisateur.name]);
    const doc = await (await base()).collection("events").findOne({ workspaceId: AGENDA.organisation._id, title: titre });
    expect(doc.assignedMembers).toEqual([EDITEUR_ID, MEMBRE_ID]);
  });
});

/* --- Échéances de facture cachées selon le rôle --------------------------- */

test.describe("Calendrier : sans « Voir » des factures, les échéances de facture restent cachées", () => {
  test.use({ storageState: connecte(MEMBRES_AGENDA.sansFactures.token) });
  test.beforeEach(async ({ page }) => surLeSite(page));

  test("La liste des événements ne contient aucune échéance de facture", async ({ page }) => {
    const reponse = await appelApi(page, LIRE_TOUS, { w: ORG }, { organisation: ORG });
    const liste = verifierReussite(reponse, "getEvents", "Liste des événements (rôle sans factures)");
    expect(liste.events.map((e) => e.type), "Une échéance de facture est renvoyée").not.toContain("INVOICE_DUE");
    expect(liste.events.map((e) => e.title), "Contrôle : l'événement de l'espace est bien listé").toContain(E.equipeLecture.title);
    sansFuite(reponse, [E.echeanceFacture.title], "getEvents (rôle sans factures)");
  });

  test("L'échéance de facture lue par son identifiant : introuvable", async ({ page }) => {
    const reponse = await appelApi(page, LIRE_UN, { w: ORG, id: id(E.echeanceFacture) }, { organisation: ORG });
    expect(reponse.data?.getEvent?.success).toBe(false);
    sansFuite(reponse, [E.echeanceFacture.title], "getEvent (rôle sans factures)");
  });

  test("Une échéance de facture n'est pas transformée en événement ordinaire", async ({ page }) => {
    await refusIntrouvable(
      page,
      MODIFIER,
      { w: ORG, input: { id: id(E.echeanceFacture), type: "MANUAL", title: "Réunion ordinaire" } },
      "updateEvent",
      [["events", { _id: E.echeanceFacture._id }]],
      "Transformer une échéance de facture",
    );
  });

  test("La synchronisation des échéances de factures est refusée", async ({ page }) => {
    const filtre = { workspaceId: AGENDA.organisation._id, type: "INVOICE_DUE" };
    const avant = await photo("events", filtre);
    const reponse = await appelApi(page, SYNCHRO_FACTURES, { w: ORG }, { organisation: ORG, delai: 15_000 });
    expect(reponse.data?.syncInvoiceEvents?.success ?? null, "La synchronisation a été acceptée").not.toBe(true);
    expect(reponse.errors.map((e) => e.message).join(" | "), "Le refus doit être expliqué").toMatch(/permission|droit|autoris/i);
    expect(await photo("events", filtre), "Les échéances ont changé malgré le refus").toBe(avant);
  });
});

test.describe("Calendrier : avec « Voir » des factures, le gérant lit l'échéance", () => {
  test.use({ storageState: connecte(AGENDA.token) });
  test("L'échéance de facture est listée pour le gérant", async ({ page }) => {
    await surLeSite(page);
    const reponse = await appelApi(page, LIRE_TOUS, { w: ORG }, { organisation: ORG });
    const liste = verifierReussite(reponse, "getEvents", "Liste des événements (gérant)");
    expect(liste.events.map((e) => e.id)).toContain(id(E.echeanceFacture));
    expect(liste.events.map((e) => e.id), "Le gérant voit ses propres événements privés").toContain(id(E.priveLecture));
  });
});
