/**
 * Prise de rendez-vous : gestion d'un rendez-vous par l'invité, avec le
 * lien de son e-mail (/rdv/gerer/<jeton>, routes /manage/:token de l'API).
 *   - jeton faux, aléatoire ou mal formé : même 404, page « introuvable » ;
 *   - rendez-vous annulé : état « Annulé », plus aucune action ;
 *   - rendez-vous passé : boutons absents, annulation et déplacement 409 ;
 *   - annuler : statut en base, événement du Calendrier retiré, une seconde
 *     annulation ne change plus rien ;
 *   - déplacer vers un créneau pris : 409 « créneau pris », rien ne bouge ;
 *     vers un créneau libre : l'ancien se libère.
 * Données : RESERVATIONS de lot-rendez-vous.mjs, une par action.
 */
import { randomBytes } from "node:crypto";
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { base } from "../base.mjs";
import { visiteur } from "../pages-publiques/consentement.mjs";
import { PAGES_RDV, TYPES_RDV, RESERVATIONS, jetonDe } from "../donnees/lot-rendez-vous.mjs";
import { appelPublic, brancherIp, CONSOLE_API_PUBLIQUE, creneaux, reservationEnBase } from "./outils-rdv.mjs";

test.use({ storageState: visiteur(), erreursConsoleAutorisees: CONSOLE_API_PUBLIQUE });

const gerer = (request, jeton, suite = "", options) => appelPublic(request, `/manage/${jeton}${suite}`, options);
const enBase = (cle) => reservationEnBase({ _id: RESERVATIONS[cle].doc._id });

test.describe("Rendez-vous : lien de gestion invalide", () => {
  const JETONS = [
    ["aléatoire de 43 caractères", () => randomBytes(32).toString("base64url")],
    ["trop court", () => "abc"],
    ["avec des caractères interdits", () => `${"a".repeat(40)}%24ne`],
    ["d'un format piégé", () => encodeURIComponent('{"$ne":null}')],
  ];

  for (const [nom, jeton] of JETONS) {
    test(`Jeton ${nom} : 404 sur chaque route, rien de révélé`, async ({ request }) => {
      const j = jeton();
      for (const [route, reponse] of [
        ["lecture", await gerer(request, j)],
        ["annulation", await gerer(request, j, "/cancel", { methode: "POST", corps: {} })],
        ["déplacement", await gerer(request, j, "/reschedule", { methode: "POST", corps: { start: new Date().toISOString() } })],
        ["fichier .ics", await gerer(request, j, "/ics")],
      ]) {
        expect.soft(reponse.statut, `${route} : statut`).toBe(404);
        expect.soft(reponse.corps, `${route} : réponse`).toEqual({ error: "NOT_FOUND" });
      }
    });
  }

  test("La page affiche « Rendez-vous introuvable »", async ({ page }) => {
    await brancherIp(page);
    await ouvrir(page, `/rdv/gerer/${randomBytes(32).toString("base64url")}`, {
      pret: page.getByRole("heading", { name: "Rendez-vous introuvable" }),
    });
    await expect(page.getByText("Ce lien de gestion n'est pas valide.", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Annuler le rendez-vous" })).toHaveCount(0);
  });
});

test.describe("Rendez-vous : états qui n'acceptent plus d'action", () => {
  test("Rendez-vous déjà annulé : « Annulé », plus d'annulation ni de déplacement", async ({ page, request }) => {
    const jeton = jetonDe("dejaAnnulee");
    const lecture = await gerer(request, jeton);
    expect(lecture.statut).toBe(200);
    expect(lecture.corps).toMatchObject({ status: "CANCELLED", canCancel: false, canReschedule: false });
    // Aucune donnée interne de la réservation.
    expect(lecture.texte).not.toMatch(/manageTokenHash|workspaceId|hostUserId|"_id"/);
    const avant = await enBase("dejaAnnulee");
    const annulation = await gerer(request, jeton, "/cancel", { methode: "POST", corps: {} });
    expect(annulation.corps).toEqual({ status: "CANCELLED" });
    const [libre] = await creneaux(request, PAGES_RDV.principale.slug, TYPES_RDV.decouverte.slug);
    const deplacement = await gerer(request, jeton, "/reschedule", { methode: "POST", corps: { start: libre.start } });
    expect(deplacement.statut).toBe(409);
    expect(await enBase("dejaAnnulee"), "La réservation annulée a changé").toEqual(avant);

    await etape(
      page,
      "La page affiche l'état, sans bouton",
      async () => {
        await brancherIp(page);
        await ouvrir(page, `/rdv/gerer/${jeton}`, { pret: page.getByRole("heading", { name: "Votre rendez-vous" }) });
        await expect(page.getByText(/^Annulé( le .+)?$/).first()).toBeVisible();
        await expect(page.getByRole("button", { name: "Annuler le rendez-vous" })).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Reprogrammer" })).toHaveCount(0);
      },
      { capture: "ecran" },
    );
  });

  test("Rendez-vous passé : boutons absents, annulation et déplacement refusés (409)", async ({ page, request }) => {
    const jeton = jetonDe("passee");
    const lecture = await gerer(request, jeton);
    expect(lecture.corps).toMatchObject({ status: "CONFIRMED", canCancel: false, canReschedule: false });
    const avant = await enBase("passee");
    expect((await gerer(request, jeton, "/cancel", { methode: "POST", corps: {} })).statut).toBe(409);
    const [libre] = await creneaux(request, PAGES_RDV.principale.slug, TYPES_RDV.decouverte.slug);
    expect((await gerer(request, jeton, "/reschedule", { methode: "POST", corps: { start: libre.start } })).statut).toBe(409);
    expect(await enBase("passee"), "Le rendez-vous passé a changé").toEqual(avant);

    await brancherIp(page);
    await ouvrir(page, `/rdv/gerer/${jeton}`, { pret: page.getByRole("heading", { name: "Votre rendez-vous" }) });
    await expect(page.getByText("Passé", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Annuler le rendez-vous" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reprogrammer" })).toHaveCount(0);
  });
});

test.describe("Rendez-vous : annulation par l'invité", () => {
  test("Annuler depuis la page : statut, motif, événement du Calendrier retiré", async ({ page }) => {
    const r = RESERVATIONS.aAnnuler.doc;
    await brancherIp(page);
    await ouvrir(page, `/rdv/gerer/${jetonDe("aAnnuler")}`, { pret: page.getByRole("heading", { name: "Votre rendez-vous" }) });
    await expect(page.getByText("Confirmé", { exact: true })).toBeVisible();
    await cliquer(page, page.getByRole("button", { name: "Annuler le rendez-vous" }));
    await page.getByLabel(/Motif/).fill("Empêchement de dernière minute, désolée !");
    await cliquer(page, page.getByRole("button", { name: "Confirmer l'annulation" }));
    await expect(page.getByText(/^Annulé( le .+)?$/).first()).toBeVisible({ timeout: 20_000 });

    await etape(page, "En base : annulée par l'invité, motif gardé, événement retiré", async () => {
      const doc = await enBase("aAnnuler");
      expect(doc.status).toBe("CANCELLED");
      expect(doc.cancelledBy).toBe("GUEST");
      expect(doc.cancelReason).toBe("Empêchement de dernière minute, désolée !");
      expect(doc.cancelledAt).toBeTruthy();
      expect(await (await base()).collection("events").countDocuments({ _id: r.eventId }), "L'événement du Calendrier reste affiché").toBe(0);
    });

    await etape(page, "Le créneau redevient libre", async () => {
      const libres = await creneaux(page.request, PAGES_RDV.principale.slug, TYPES_RDV.decouverte.slug);
      expect(libres.map((s) => s.start)).toContain(r.startAt.toISOString());
    });
  });

  test("Deux annulations de suite : la seconde ne change plus rien", async ({ request }) => {
    const jeton = jetonDe("annulerDeuxFois");
    const premiere = await gerer(request, jeton, "/cancel", { methode: "POST", corps: { reason: "Premier motif" } });
    expect(premiere.corps).toEqual({ status: "CANCELLED" });
    const apresPremiere = await enBase("annulerDeuxFois");
    const seconde = await gerer(request, jeton, "/cancel", { methode: "POST", corps: { reason: "Second motif" } });
    expect(seconde.corps).toEqual({ status: "CANCELLED" });
    const apresSeconde = await enBase("annulerDeuxFois");
    expect(apresSeconde.cancelReason).toBe("Premier motif");
    expect(apresSeconde.cancelledAt.toISOString()).toBe(apresPremiere.cancelledAt.toISOString());
  });
});

test.describe("Rendez-vous : déplacement par l'invité", () => {
  test("Vers le créneau d'un autre rendez-vous : 409 « créneau pris », rien ne bouge", async ({ request }) => {
    const avant = await enBase("aDeplacer");
    const reponse = await gerer(request, jetonDe("aDeplacer"), "/reschedule", {
      methode: "POST",
      corps: { start: RESERVATIONS.occupante.doc.startAt.toISOString() },
    });
    expect(reponse.statut).toBe(409);
    expect(reponse.corps).toEqual({ error: "SLOT_TAKEN" });
    expect(await enBase("aDeplacer")).toEqual(avant);
  });

  test("Vers une heure qui n'est pas un créneau : refusé, rien ne bouge", async ({ request }) => {
    const avant = await enBase("aDeplacer");
    const horsCreneau = new Date(RESERVATIONS.aDeplacer.doc.startAt.getTime() + 7 * 60_000).toISOString();
    const reponse = await gerer(request, jetonDe("aDeplacer"), "/reschedule", { methode: "POST", corps: { start: horsCreneau } });
    expect(reponse.statut).toBeGreaterThanOrEqual(400);
    expect(reponse.statut).toBeLessThan(500);
    expect(await enBase("aDeplacer")).toEqual(avant);
  });

  test("Vers un créneau libre : déplacé, historique gardé, l'ancien créneau se libère", async ({ request }) => {
    const r = RESERVATIONS.deplacable.doc;
    const jeton = jetonDe("deplacable");
    const libres = await creneaux(request, PAGES_RDV.principale.slug, TYPES_RDV.decouverte.slug, { excludeToken: jeton });
    const cible = libres.find((s) => new Date(s.start) > new Date(r.startAt.getTime() + 86_400_000));
    expect(cible, "Aucun créneau libre le lendemain").toBeTruthy();
    const reponse = await gerer(request, jeton, "/reschedule", { methode: "POST", corps: { start: cible.start } });
    expect(reponse.statut, JSON.stringify(reponse.corps)).toBe(200);
    expect(reponse.corps.status).toBe("CONFIRMED");
    const doc = await enBase("deplacable");
    expect(doc.startAt.toISOString()).toBe(new Date(cible.start).toISOString());
    expect(doc.rescheduleHistory).toHaveLength(1);
    expect(doc.rescheduleHistory[0].fromStartAt.toISOString()).toBe(r.startAt.toISOString());
    const apres = await creneaux(request, PAGES_RDV.principale.slug, TYPES_RDV.decouverte.slug);
    expect(apres.map((s) => s.start), "L'ancien créneau doit redevenir libre").toContain(r.startAt.toISOString());
    expect(apres.map((s) => s.start), "Le nouveau créneau doit être pris").not.toContain(new Date(cible.start).toISOString());
  });

  test("Fichier .ics du rendez-vous téléchargeable avec le jeton", async ({ request }) => {
    const reponse = await gerer(request, jetonDe("occupante"), "/ics");
    expect(reponse.statut).toBe(200);
    expect(reponse.entetes["content-type"]).toContain("text/calendar");
    expect(reponse.texte).toContain("BEGIN:VEVENT");
    expect(reponse.texte).toContain(TYPES_RDV.decouverte.name);
  });
});
