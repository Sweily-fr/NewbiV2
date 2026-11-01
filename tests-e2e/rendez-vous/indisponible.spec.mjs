/**
 * Prise de rendez-vous : pages publiques indisponibles. Espace sans
 * abonnement actif, organisateur retiré de l'espace, organisateur dont le
 * rôle n'ouvre pas la prise de rendez-vous (Comptable, rôle personnalisé),
 * page ou type désactivés, adresse inconnue ou malformée : la même 404
 * { error: "NOT_FOUND" } sur chaque route de l'API (page, type, créneaux,
 * réservation), rien d'enregistré, et côté site la même page « Page
 * indisponible », sans nom d'entreprise ni d'organisateur. Plus les limites
 * par adresse IP des routes publiques.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { PAGES_RDV, TYPES_RDV } from "../donnees/lot-rendez-vous.mjs";
import { appelPublic, brancherIp, CONSOLE_API_PUBLIQUE, invite, ipUnique, jourDeReservation } from "./outils-rdv.mjs";

test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: CONSOLE_API_PUBLIQUE });

const INCONNUE = { slug: "personne-ici-e2e", typeSlug: "decouverte", noms: [] };

/** [cas, adresse de page, adresse de type, noms qui ne doivent jamais apparaître] */
const CAS = [
  ["Espace sans abonnement actif", PAGES_RDV.echu.slug, TYPES_RDV.echu.slug, ["Rendez-vous Échu SASU", "Erwan Échu"]],
  ["Organisateur retiré de l'espace", PAGES_RDV.ancienMembre.slug, TYPES_RDV.ancienMembre.slug, ["Rendez-vous Test SASU", "Paul Parti"]],
  ["Organisateur Comptable (prise de rendez-vous fermée à ce rôle)", PAGES_RDV.comptable.slug, TYPES_RDV.comptable.slug, ["Rendez-vous Test SASU", "Colin Comptable"]],
  ["Organisateur au rôle personnalisé sans la prise de rendez-vous", PAGES_RDV.sansRdv.slug, TYPES_RDV.sansRdv.slug, ["Rendez-vous Test SASU", "Sacha Agenda"]],
  ["Page désactivée", PAGES_RDV.desactivee.slug, TYPES_RDV.desactivee.slug, ["Rendez-vous Test SASU", "Dana Désactivée"]],
  ["Adresse inconnue", INCONNUE.slug, INCONNUE.typeSlug, []],
];

/** Toutes les routes publiques d'une page et d'un type. */
async function routesPubliques(request, slug, typeSlug) {
  const ip = ipUnique();
  const debut = jourDeReservation();
  return {
    page: await appelPublic(request, `/${slug}`, { ip }),
    type: await appelPublic(request, `/${slug}/${typeSlug}`, { ip }),
    creneaux: await appelPublic(request, `/${slug}/${typeSlug}/slots`, { ip }),
    reservation: await appelPublic(request, `/${slug}/${typeSlug}/book`, {
      methode: "POST",
      corps: { start: debut.toISOString(), guest: invite({ email: `indisponible-${slug}@e2e.test` }) },
      ip,
    }),
  };
}

test.describe("Rendez-vous : pages publiques indisponibles", () => {
  test("Témoin : la page active d'un organisateur s'ouvre avec son entreprise", async ({ request }) => {
    const reponse = await appelPublic(request, `/${PAGES_RDV.principale.slug}`);
    expect(reponse.statut).toBe(200);
    expect(reponse.corps.page.organizationName).toBe("Rendez-vous Test SASU");
    expect(reponse.corps.types.map((t) => t.slug)).not.toContain(TYPES_RDV.inactif.slug);
    // Données internes jamais renvoyées à l'invité.
    expect(reponse.texte).not.toMatch(/workspaceId|userId|"_id"|rdv@e2e\.test/);
    expect(reponse.entetes["cache-control"]).toContain("no-store");
    expect(reponse.entetes["x-robots-tag"]).toContain("noindex");
  });

  for (const [cas, slug, typeSlug, noms] of CAS) {
    test(`${cas} : même 404 sur chaque route, rien d'enregistré`, async ({ request }) => {
      const reponses = await routesPubliques(request, slug, typeSlug);
      for (const [route, reponse] of Object.entries(reponses)) {
        expect.soft(reponse.statut, `${route} : statut`).toBe(404);
        expect.soft(reponse.corps, `${route} : réponse`).toEqual({ error: "NOT_FOUND" });
        for (const nom of noms) expect.soft(reponse.texte, `${route} : « ${nom} » révélé`).not.toContain(nom);
      }
      expect(await (await base()).collection("bookings").countDocuments({ "guest.email": `indisponible-${slug}@e2e.test` })).toBe(0);
    });

    test(`${cas} : le site affiche « Page indisponible » sans rien révéler`, async ({ page }) => {
      await brancherIp(page);
      await ouvrir(page, `/rdv/${slug}`, { pret: page.getByRole("heading", { name: "Page indisponible" }) });
      await expect(page.getByText("Cette page de réservation n'existe pas ou n'accepte plus de rendez-vous.")).toBeVisible();
      const texte = await page.locator("body").innerText();
      for (const nom of noms) expect.soft(texte, `« ${nom} » affiché`).not.toContain(nom);
      await etape(
        page,
        "Même page sur l'adresse du type",
        async () => {
          await ouvrir(page, `/rdv/${slug}/${typeSlug}`, { pret: page.getByRole("heading", { name: "Page indisponible" }) });
          const texteType = await page.locator("body").innerText();
          for (const nom of noms) expect.soft(texteType, `« ${nom} » affiché`).not.toContain(nom);
        },
        { capture: "ecran" },
      );
    });
  }

  test("Type désactivé d'une page active : même 404, il n'est jamais réservable", async ({ request, page }) => {
    const { page: pageActive, ...routesType } = await routesPubliques(request, PAGES_RDV.principale.slug, TYPES_RDV.inactif.slug);
    expect(pageActive.statut, "La page elle-même reste ouverte").toBe(200);
    for (const [route, reponse] of Object.entries(routesType)) {
      expect.soft(reponse.statut, `${route} : statut`).toBe(404);
      expect.soft(reponse.corps, `${route} : réponse`).toEqual({ error: "NOT_FOUND" });
    }
    await brancherIp(page);
    await ouvrir(page, `/rdv/${PAGES_RDV.principale.slug}/${TYPES_RDV.inactif.slug}`, {
      pret: page.getByRole("heading", { name: "Page indisponible" }),
    });
  });

  test("Adresses malformées ou piégées : 404, jamais d'erreur serveur", async ({ request }) => {
    for (const chemin of [
      "/ab",
      "/-debut-tiret",
      "/MAJUSCULES-INTERDITES-AVEC-UNE-ADRESSE-BEAUCOUP-TROP-LONGUE",
      `/${encodeURIComponent("cabinet-romane-e2e' OR '1'='1")}`,
      `/${encodeURIComponent('{"$ne":null}')}`,
      `/${PAGES_RDV.principale.slug}/${encodeURIComponent("../manage")}`,
      `/${PAGES_RDV.principale.slug}/${encodeURIComponent('{"$gt":""}')}/slots`,
    ]) {
      const reponse = await appelPublic(request, chemin);
      expect.soft(reponse.statut, chemin).toBe(404);
    }
  });

  test("Lectures : au-delà de 60 par minute depuis une même adresse, 429 avec Retry-After", async ({ request }) => {
    const ip = ipUnique();
    const statuts = [];
    for (let i = 0; i < 60; i += 1) statuts.push((await appelPublic(request, `/${PAGES_RDV.principale.slug}`, { ip })).statut);
    expect(statuts.every((s) => s === 200), "Les 60 premières lectures passent").toBe(true);
    const bloquee = await appelPublic(request, `/${PAGES_RDV.principale.slug}`, { ip });
    expect(bloquee.statut).toBe(429);
    expect(bloquee.corps).toEqual({ error: "RATE_LIMITED" });
    expect(bloquee.entetes["retry-after"]).toBe("60");
    // Une autre adresse n'est pas touchée.
    expect((await appelPublic(request, `/${PAGES_RDV.principale.slug}`)).statut).toBe(200);
  });

  test("Réservations : au-delà de 5 par minute depuis une même adresse, 429 et rien d'enregistré", async ({ request }) => {
    const ip = ipUnique();
    const chemin = `/${PAGES_RDV.principale.slug}/${TYPES_RDV.decouverte.slug}/book`;
    // Requêtes invalides (400) : la limite compte toutes les tentatives, avant le contrôle de la saisie.
    for (let i = 0; i < 5; i += 1) {
      const reponse = await appelPublic(request, chemin, { methode: "POST", corps: { start: "pas-une-date" }, ip });
      expect(reponse.statut).toBe(400);
    }
    const [creneau] = (await appelPublic(request, `/${PAGES_RDV.principale.slug}/${TYPES_RDV.decouverte.slug}/slots`)).corps.slots;
    const sixieme = await appelPublic(request, chemin, {
      methode: "POST",
      corps: { start: creneau.start, guest: invite({ email: "sixieme-essai@e2e.test" }) },
      ip,
    });
    expect(sixieme.statut).toBe(429);
    expect(sixieme.corps).toEqual({ error: "RATE_LIMITED" });
    expect(await (await base()).collection("bookings").countDocuments({ "guest.email": "sixieme-essai@e2e.test" })).toBe(0);
  });

  test("Gestion d'un rendez-vous : au-delà de 10 essais par minute, 429 (jetons devinés en série)", async ({ request }) => {
    const ip = ipUnique();
    for (let i = 0; i < 10; i += 1) {
      const reponse = await appelPublic(request, `/manage/${"x".repeat(42)}${i}`, { ip });
      expect(reponse.statut).toBe(404);
    }
    const onzieme = await appelPublic(request, `/manage/${"y".repeat(43)}`, { ip });
    expect(onzieme.statut).toBe(429);
    expect(onzieme.corps).toEqual({ error: "RATE_LIMITED" });
  });
});
