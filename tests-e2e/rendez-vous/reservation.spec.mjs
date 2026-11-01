/**
 * Prise de rendez-vous : réservation par un invité, sans compte, de bout en
 * bout. /rdv/<adresse> → type → créneau → coordonnées → confirmation, puis
 * ce qui est réellement enregistré : réservation confirmée, événement privé
 * dans le Calendrier de l'organisateur, client créé dans le CRM (une fiche
 * existante n'est jamais modifiée), fichier .ics téléchargeable.
 *
 * Les e-mails (invité et organisateur) partent par Resend, coupé ici : leur
 * contenu est vérifié par les tests unitaires de l'API
 * (__tests__/services/appointmentBooking.test.js, appointmentEmails.test.js).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES_RDV, PAGES_RDV, TYPES_RDV, CLIENT_FIDELE } from "../donnees/lot-rendez-vous.mjs";
import { appelPublic, brancherIp, creneaux, heureParis, invite, reserver, ipUnique } from "./outils-rdv.mjs";

const PAGE = PAGES_RDV.principale;
const TYPE = TYPES_RDV.decouverte;
const ORG = COMPTES_RDV.principal.organisation._id;
const HOTE = COMPTES_RDV.principal.utilisateur._id;

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Rendez-vous : réservation par un invité", () => {
  test("Un invité réserve un créneau de bout en bout et tout est enregistré", async ({ page, request }) => {
    await brancherIp(page);
    const saisie = {
      firstName: "Zoé",
      lastName: "O’Brien",
      email: "zoe.obrien@e2e.test",
      phone: "+33 6 12 34 56 78",
      message: "Bât. n° 12, 2e étage : l’accès se fait par la cour. À bientôt !",
    };

    await etape(
      page,
      "La page de l'organisateur liste ses rendez-vous actifs",
      async () => {
        await ouvrir(page, `/rdv/${PAGE.slug}`, { pret: page.getByRole("heading", { name: PAGE.title }) });
        await expect(page.getByText("Rendez-vous Test SASU")).toBeVisible();
        await expect(page.getByRole("link", { name: /Rendez-vous découverte/ })).toBeVisible();
        await expect(page.getByRole("link", { name: /Appel de suivi/ })).toBeVisible();
        await expect(page.getByText(TYPES_RDV.inactif.name), "Un type désactivé ne doit pas être proposé").toHaveCount(0);
      },
      { capture: "ecran" },
    );

    await etape(page, "Choisir le type puis le premier créneau proposé", async () => {
      await cliquer(page, page.getByRole("link", { name: /Rendez-vous découverte/ }));
      await expect(page).toHaveURL(new RegExp(`/rdv/${PAGE.slug}/${TYPE.slug}$`));
      await expect(page.getByRole("heading", { name: "Choisissez un créneau" })).toBeVisible({ timeout: 30_000 });
      const premier = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
      await expect(premier).toBeVisible({ timeout: 30_000 });
      await premier.click();
      await expect(page.getByRole("heading", { name: "Vos coordonnées" })).toBeVisible();
    });

    const envoi = page.waitForRequest((req) => req.url().endsWith(`/${PAGE.slug}/${TYPE.slug}/book`) && req.method() === "POST");
    await etape(
      page,
      "Saisir ses coordonnées (accents, apostrophe typographique, « n° ») et confirmer",
      async () => {
        await page.getByLabel("Prénom").fill(saisie.firstName);
        await page.getByLabel("Nom", { exact: true }).fill(saisie.lastName);
        await page.getByLabel("Adresse e-mail").fill(saisie.email);
        await page.getByLabel(/Téléphone/).fill(saisie.phone);
        await page.getByLabel(/Message/).fill(saisie.message);
        await page.getByRole("button", { name: "Confirmer le rendez-vous" }).click();
        await expect(page.getByRole("heading", { name: "Rendez-vous confirmé" })).toBeVisible({ timeout: 30_000 });
        await expect(page.getByText(saisie.email)).toBeVisible();
      },
      { capture: "ecran" },
    );
    const { start } = JSON.parse((await envoi).postData());
    const debut = new Date(start);

    const reservation = await etape(page, "La réservation est enregistrée, confirmée, avec la saisie exacte", async () => {
      const doc = await (await base()).collection("bookings").findOne({ "guest.email": saisie.email });
      expect(doc, "Aucune réservation en base").toBeTruthy();
      expect(doc.status).toBe("CONFIRMED");
      expect(String(doc.hostUserId)).toBe(String(HOTE));
      expect(String(doc.appointmentTypeId)).toBe(String(TYPE._id));
      expect(doc.startAt.toISOString()).toBe(debut.toISOString());
      expect(doc.endAt.getTime() - doc.startAt.getTime()).toBe(30 * 60_000);
      expect(doc.typeName).toBe(TYPE.name);
      expect(doc.location).toMatchObject({ kind: "IN_PERSON", value: TYPE.location.value });
      expect(doc.guest).toMatchObject({
        firstName: saisie.firstName,
        lastName: saisie.lastName,
        email: saisie.email,
        phone: saisie.phone,
        message: saisie.message,
        timezone: "Europe/Paris",
      });
      // Le jeton de gestion n'est jamais stocké en clair.
      expect(doc.manageTokenHash).toMatch(/^[0-9a-f]{64}$/);
      return doc;
    });

    await etape(page, "Un événement privé de l'organisateur est ajouté au Calendrier", async () => {
      const evenement = await (await base()).collection("events").findOne({ bookingId: reservation._id });
      expect(evenement, "Aucun événement APPOINTMENT créé").toBeTruthy();
      expect(String(reservation.eventId)).toBe(String(evenement._id));
      expect(evenement).toMatchObject({ type: "APPOINTMENT", visibility: "private", allDay: false });
      expect(String(evenement.userId)).toBe(String(HOTE));
      expect(String(evenement.workspaceId)).toBe(String(ORG));
      expect(evenement.start.toISOString()).toBe(debut.toISOString());
      expect(evenement.title).toBe(`${TYPE.name} avec Zoé O’Brien`);
      expect(evenement.description).toContain(saisie.email);
      expect(evenement.description).toContain(saisie.message);
    });

    await etape(page, "L'invité devient un client du CRM, rattaché à la réservation", async () => {
      const client = await (await base()).collection("clients").findOne({ workspaceId: ORG, email: saisie.email });
      expect(client, "Aucun client créé pour l'invité").toBeTruthy();
      expect(String(reservation.clientId)).toBe(String(client._id));
      expect(client.type).toBe("INDIVIDUAL");
      expect(client.firstName).toBe("Zoé");
      expect(client.phone).toBe("+33612345678");
    });

    await etape(page, "La confirmation affiche le créneau choisi et propose le fichier .ics", async () => {
      await expect(page.getByText(heureParis(debut), { exact: false }).first()).toBeVisible();
      const lien = page.getByRole("link", { name: "Télécharger (.ics)" });
      await expect(lien).toBeVisible();
      const href = await lien.getAttribute("href");
      const ics = await request.get(href, { headers: { "x-forwarded-for": ipUnique() } });
      expect(ics.status()).toBe(200);
      expect(ics.headers()["content-type"]).toContain("text/calendar");
      expect(ics.headers()["content-disposition"]).toContain("attachment");
      const texte = await ics.text();
      expect(texte).toContain("BEGIN:VCALENDAR");
      expect(texte).toContain(`DTSTART:${debut.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`);
      expect(texte).toContain(TYPE.name);
    });

    await etape(
      page,
      "Le lien « Reprogrammer ou annuler » ouvre la gestion du rendez-vous",
      async () => {
        await page.getByRole("link", { name: "Reprogrammer ou annuler" }).click();
        await expect(page).toHaveURL(/\/rdv\/gerer\/[A-Za-z0-9_-]{43}$/);
        await expect(page.getByRole("heading", { name: "Votre rendez-vous" })).toBeVisible({ timeout: 30_000 });
        await expect(page.getByText("Confirmé", { exact: true })).toBeVisible();
      },
      { capture: "ecran" },
    );

    await etape(page, "Le créneau réservé n'est plus proposé", async () => {
      const libres = await creneaux(request, PAGE.slug, TYPE.slug);
      expect(libres.map((s) => s.start)).not.toContain(debut.toISOString());
    });
  });

  test("Le client créé garde le nom saisi par l'invité (apostrophe typographique, lettres accentuées)", async ({ request }) => {
    const [creneau] = await creneaux(request, PAGE.slug, TYPES_RDV.appel.slug);
    const guest = invite({ firstName: "Anaïs", lastName: "D’Arcy-Lecœur", email: "anais.darcy@e2e.test" });
    const reponse = await reserver(request, PAGE.slug, TYPES_RDV.appel.slug, creneau.start, guest);
    expect(reponse.statut, JSON.stringify(reponse.corps)).toBe(201);
    const client = await (await base()).collection("clients").findOne({ workspaceId: ORG, email: guest.email });
    expect(client, "Aucun client créé pour l'invité").toBeTruthy();
    expect(client.firstName).toBe("Anaïs");
    expect(client.lastName, "Le nom de famille du client doit être celui saisi, sans caractère remplacé par une espace").toBe("D’Arcy-Lecœur");
    expect(client.name).toBe("Anaïs D’Arcy-Lecœur");
  });

  test("Une réservation à l'adresse d'un client existant ne modifie pas sa fiche", async ({ request }) => {
    const avant = await (await base()).collection("clients").findOne({ _id: CLIENT_FIDELE._id });
    const [creneau] = await creneaux(request, PAGE.slug, TYPE.slug);
    const reponse = await reserver(
      request,
      PAGE.slug,
      TYPE.slug,
      creneau.start,
      invite({ firstName: "Félix", lastName: "Autre-Nom", email: "Client.Fidele@E2E.test", phone: "06 99 99 99 99" }),
    );
    expect(reponse.statut, JSON.stringify(reponse.corps)).toBe(201);

    const reservation = await (await base()).collection("bookings").findOne({ "guest.email": "client.fidele@e2e.test" });
    expect(String(reservation.clientId), "La réservation doit être rattachée à la fiche existante").toBe(String(CLIENT_FIDELE._id));
    expect(await (await base()).collection("clients").countDocuments({ workspaceId: ORG, email: /^client\.fidele@e2e\.test$/i })).toBe(1);

    const apres = await (await base()).collection("clients").findOne({ _id: CLIENT_FIDELE._id });
    const { activity: activiteAvant, ...ficheAvant } = avant;
    const { activity: activiteApres, ...ficheApres } = apres;
    expect(ficheApres, "La fiche du client (nom, téléphone, adresse, date de modification) ne doit pas changer").toEqual(ficheAvant);
    expect(activiteApres).toHaveLength(activiteAvant.length + 1);
    expect(activiteApres.at(-1).description).toContain(TYPE.name);
  });

  test("Un créneau déjà pris est refusé (409) et rien n'est enregistré en double", async ({ request }) => {
    const [creneau] = await creneaux(request, PAGE.slug, TYPE.slug);
    const premiere = await reserver(request, PAGE.slug, TYPE.slug, creneau.start, invite({ email: "premier.arrive@e2e.test" }));
    expect(premiere.statut).toBe(201);
    const seconde = await reserver(request, PAGE.slug, TYPE.slug, creneau.start, invite({ email: "second.arrive@e2e.test" }));
    expect(seconde.statut).toBe(409);
    expect(seconde.corps).toEqual({ error: "SLOT_TAKEN" });
    expect(await (await base()).collection("bookings").countDocuments({ "guest.email": "second.arrive@e2e.test" })).toBe(0);
  });

  test("Deux réservations simultanées qui se chevauchent : une seule passe", async ({ request }) => {
    // Séance d'une heure à X et rendez-vous de 30 min à X + 30 min, envoyés en même temps.
    const [creneau] = await creneaux(request, PAGE.slug, TYPES_RDV.seanceLongue.slug);
    const decale = new Date(new Date(creneau.start).getTime() + 30 * 60_000);
    const [longue, courte] = await Promise.all([
      reserver(request, PAGE.slug, TYPES_RDV.seanceLongue.slug, creneau.start, invite({ email: "simultane-longue@e2e.test" })),
      reserver(request, PAGE.slug, TYPE.slug, decale, invite({ email: "simultane-courte@e2e.test" })),
    ]);
    const statuts = [longue.statut, courte.statut].sort();
    expect(statuts, "Une réservation acceptée (201), l'autre refusée (409 créneau pris)").toEqual([201, 409]);
    const enregistrees = await (await base())
      .collection("bookings")
      .countDocuments({ "guest.email": { $in: ["simultane-longue@e2e.test", "simultane-courte@e2e.test"] }, status: "CONFIRMED" });
    expect(enregistrees, "Deux rendez-vous se chevauchent chez le même organisateur").toBe(1);
  });

  test("Coordonnées invalides : 400 avec le champ en cause, rien n'est enregistré", async ({ request }) => {
    const [creneau] = await creneaux(request, PAGE.slug, TYPES_RDV.appel.slug);
    const cas = [
      [{ email: "pas-une-adresse" }, "email"],
      [{ firstName: "   " }, "firstName"],
      [{ lastName: "" }, "lastName"],
      [{ phone: "appelez-moi" }, "phone"],
      // Type « Appel de suivi » : l'organisateur appelle, le téléphone est obligatoire.
      [{ phone: null }, "phone"],
      [{ message: "a".repeat(2001) }, "message"],
    ];
    for (const [champs, champ] of cas) {
      const guest = invite({ email: `invalide-${champ}@e2e.test`, ...champs });
      const reponse = await reserver(request, PAGE.slug, TYPES_RDV.appel.slug, creneau.start, guest);
      expect.soft(reponse.statut, `${champ} : ${JSON.stringify(champs).slice(0, 60)}`).toBe(400);
      expect.soft(reponse.corps?.error).toBe("VALIDATION");
      expect.soft(Object.keys(reponse.corps?.fields || {}), `Champ signalé pour ${JSON.stringify(champs).slice(0, 60)}`).toContain(champ);
    }
    expect(await (await base()).collection("bookings").countDocuments({ "guest.email": /^invalide-/ })).toBe(0);
  });

  test("Le formulaire signale chaque champ à corriger sans rien envoyer", async ({ page }) => {
    await brancherIp(page);
    await ouvrir(page, `/rdv/${PAGE.slug}/${TYPES_RDV.appel.slug}`, { pret: page.getByRole("heading", { name: "Choisissez un créneau" }) });
    await page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first().click();
    let envois = 0;
    page.on("request", (req) => {
      if (req.url().endsWith("/book")) envois += 1;
    });
    await page.getByLabel("Adresse e-mail").fill("zoe@");
    await page.getByRole("button", { name: "Confirmer le rendez-vous" }).click();
    await expect(page.getByText("Indiquez votre prénom")).toBeVisible();
    await expect(page.getByText("Indiquez votre nom")).toBeVisible();
    await expect(page.getByText("Adresse e-mail invalide")).toBeVisible();
    await expect(page.getByText("Indiquez votre numéro de téléphone")).toBeVisible();
    await expect(page.getByLabel("Prénom"), "Le champ en erreur doit être signalé aux lecteurs d'écran").toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Prénom")).toBeFocused();
    expect(envois, "Aucune réservation ne doit partir avec un formulaire incomplet").toBe(0);
  });

  test("Un robot qui remplit le champ caché reçoit une confirmation factice, rien n'est enregistré", async ({ request }) => {
    const [creneau] = await creneaux(request, PAGE.slug, TYPE.slug);
    const reponse = await appelPublic(request, `/${PAGE.slug}/${TYPE.slug}/book`, {
      methode: "POST",
      corps: { start: creneau.start, guest: invite({ email: "robot@e2e.test" }), website: "https://spam.example" },
    });
    expect(reponse.statut).toBe(201);
    expect(await (await base()).collection("bookings").countDocuments({ "guest.email": "robot@e2e.test" })).toBe(0);
    const libres = await creneaux(request, PAGE.slug, TYPE.slug);
    expect(libres.map((s) => s.start), "Le créneau doit rester libre").toContain(creneau.start);
  });
});
