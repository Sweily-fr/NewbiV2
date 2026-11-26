/**
 * Outils des tests de la prise de rendez-vous (pages publiques /rdv et
 * routes /api/public/booking de l'API).
 *
 * L'API limite les routes publiques par adresse IP (lectures 60/min,
 * réservations 5/min et 20/h, gestion 10/min) et fait confiance au premier
 * proxy (X-Forwarded-For). Tous les tests partent de 127.0.0.1 : chaque test
 * prend donc sa propre adresse, comme autant d'invités différents, sauf ceux
 * qui éprouvent justement la limite.
 */
import { randomInt } from "node:crypto";
import { expect } from "@playwright/test";
import { API_URL } from "../config.mjs";
import { base } from "../base.mjs";

export const API_RDV = `${API_URL}/api/public/booking`;

/** Adresse IP propre à un test (plage réservée aux essais, RFC 2544). */
export const ipUnique = () => `198.18.${randomInt(0, 256)}.${randomInt(1, 255)}`;

/**
 * Route publique de l'API appelée comme un invité (sans session), depuis
 * l'adresse `ip`. Renvoie { statut, corps, entetes, texte }.
 */
export async function appelPublic(request, chemin, { methode = "GET", corps, ip = ipUnique() } = {}) {
  const reponse = await request.fetch(`${API_RDV}${chemin}`, {
    method: methode,
    headers: { "x-forwarded-for": ip, ...(corps ? { "content-type": "application/json" } : {}) },
    data: corps ? JSON.stringify(corps) : undefined,
    failOnStatusCode: false,
  });
  const texte = await reponse.text();
  let json = null;
  try {
    json = JSON.parse(texte);
  } catch {
    // Réponse non JSON (.ics)
  }
  return { statut: reponse.status(), corps: json, entetes: reponse.headers(), texte };
}

/** Les appels du navigateur vers l'API publique partent de l'adresse `ip`. */
export async function brancherIp(page, ip = ipUnique()) {
  await page.route(`${API_RDV}/**`, (route) =>
    route.continue({ headers: { ...route.request().headers(), "x-forwarded-for": ip } }),
  );
  return ip;
}

/** Erreurs de console attendues : réponses 404 ou 409 voulues de l'API publique. */
export const CONSOLE_API_PUBLIQUE = /(404|409|429) \S*\/api\/public\/booking\//;

/** Un instant dans trois jours, à heure pleine (UTC) : un créneau des pages de test. */
export function jourDeReservation() {
  const jour = new Date();
  jour.setUTCHours(10, 0, 0, 0);
  return new Date(jour.getTime() + 3 * 86_400_000);
}

/** Coordonnées d'invité valides. */
export const invite = (champs = {}) => ({
  firstName: "Inès",
  lastName: "Invitée",
  email: `invitee-${randomInt(1e9)}@e2e.test`,
  phone: "+33 6 12 34 56 78",
  message: null,
  ...champs,
});

/** Réserve un créneau par l'API publique (201 attendu par l'appelant). */
export const reserver = (request, slug, type, start, guest = invite(), { ip } = {}) =>
  appelPublic(request, `/${slug}/${type}/book`, {
    methode: "POST",
    corps: { start: new Date(start).toISOString(), guest, timezone: "Europe/Paris" },
    ip,
  });

/** Créneaux libres d'un type (42 jours à partir d'aujourd'hui). */
export async function creneaux(request, slug, type, { excludeToken = null, ip } = {}) {
  const params = excludeToken ? `?excludeToken=${encodeURIComponent(excludeToken)}` : "";
  const reponse = await appelPublic(request, `/${slug}/${type}/slots${params}`, { ip });
  expect(reponse.statut, `Créneaux de ${slug}/${type}`).toBe(200);
  return reponse.corps.slots;
}

/** Réservation telle qu'en base. */
export async function reservationEnBase(filtre) {
  return (await base()).collection("bookings").findOne(filtre);
}

/** Heure « HH:MM » d'un instant à Paris (fuseau du navigateur des tests). */
export const heureParis = (instant) =>
  new Date(instant).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });

/**
 * Heure choisie dans une liste de la prise de rendez-vous (TimeSelect) :
 * libellé du champ, valeur « HH:mm » (affichée « 9:00 » avant 10 h).
 */
export async function choisirHeure(page, libelle, heure) {
  const [h, m] = heure.split(":");
  await page.getByRole("combobox", { name: libelle, exact: true }).click();
  await page.getByRole("option", { name: `${Number(h)}:${m}`, exact: true }).click();
}

/** Valeur affichée d'une liste d'heures (« 12:00 »). */
export const champHeure = (page, libelle) => page.getByRole("combobox", { name: libelle, exact: true });

/**
 * Date et heure d'un champ DateTimeField (« Début », « Fin »…) : jour
 * « AAAA-MM-JJ » dans le calendrier (mois suivants parcourus jusqu'au bon
 * mois, repéré par son titre « décembre 2026 »), puis l'heure.
 */
export async function choisirDateHeure(page, libelle, jour, heure) {
  const [annee, mois, quantieme] = jour.split("-").map(Number);
  const titre = new Date(annee, mois - 1, 15).toLocaleString("fr-FR", { month: "long", year: "numeric" });
  await page.getByRole("button", { name: `${libelle}, date`, exact: true }).click();
  const fenetre = page.locator("[data-slot=popover-content]");
  for (let i = 0; i < 24 && !(await fenetre.getByText(titre, { exact: true }).count()); i += 1) {
    await fenetre.locator(".rdp-button_next").click();
  }
  await fenetre.locator("button[data-day]", { hasText: new RegExp(`^${quantieme}$`) }).click();
  await choisirHeure(page, `${libelle}, heure`, heure);
}
