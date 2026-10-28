/**
 * Routes publiques de la prise de rendez-vous (sans compte), servies par
 * l'API sous /api/public/booking. Appelées depuis le navigateur de
 * l'invité : la limitation par IP de l'API doit voir son adresse, pas
 * celle d'un serveur Vercel.
 */

// NEXT_PUBLIC_API_URL finit par un slash
const apiUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/";
const base = () => `${apiUrl()}api/public/booking`;

export class BookingApiError extends Error {
  constructor(code, status, fields = null) {
    super(code);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

async function request(path, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${base()}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new BookingApiError("NETWORK", 0);
  }
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Réponse vide ou non JSON
  }
  if (!response.ok) {
    throw new BookingApiError(
      data?.error || (response.status === 404 ? "NOT_FOUND" : "SERVER"),
      response.status,
      data?.fields || null,
    );
  }
  return data;
}

const segment = (value) => encodeURIComponent(String(value || ""));

/** { page, types } */
export function fetchBookingPage(slug, options) {
  return request(`/${segment(slug)}`, options);
}

/** { page, type } */
export function fetchAppointmentType(slug, typeSlug, options) {
  return request(`/${segment(slug)}/${segment(typeSlug)}`, options);
}

/** { timezone, slots: [{ start, end }] } */
export function fetchSlots(
  slug,
  typeSlug,
  { from, to, excludeToken, signal } = {},
) {
  const params = new URLSearchParams({ from, to });
  if (excludeToken) params.set("excludeToken", excludeToken);
  return request(`/${segment(slug)}/${segment(typeSlug)}/slots?${params}`, {
    signal,
  });
}

/** 201 { booking, manageUrl, icsUrl } ; 409 SLOT_TAKEN ; 400 VALIDATION */
export function bookAppointment(slug, typeSlug, payload) {
  return request(`/${segment(slug)}/${segment(typeSlug)}/book`, {
    method: "POST",
    body: payload,
  });
}

export function fetchManagedBooking(token, options) {
  return request(`/manage/${segment(token)}`, options);
}

export function cancelManagedBooking(token, reason) {
  return request(`/manage/${segment(token)}/cancel`, {
    method: "POST",
    body: { reason: reason?.trim() || null },
  });
}

export function rescheduleManagedBooking(token, { start, turnstileToken }) {
  return request(`/manage/${segment(token)}/reschedule`, {
    method: "POST",
    body: { start, turnstileToken },
  });
}

/** Adresse du fichier .ics : chemin renvoyé par l'API (« /api/public/… »). */
export function apiFileUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${apiUrl()}${String(path).replace(/^\//, "")}`;
}

export function manageIcsUrl(token) {
  return `${base()}/manage/${segment(token)}/ics`;
}

/** Message pour l'invité selon le code d'erreur de l'API. */
export function bookingErrorText(error) {
  switch (error?.code) {
    case "SLOT_TAKEN":
      return "Ce créneau vient d'être réservé, choisissez-en un autre.";
    case "RATE_LIMITED":
      return "Trop de demandes en peu de temps. Patientez une minute, puis réessayez.";
    case "VALIDATION":
      return "Certaines informations sont à corriger.";
    case "NOT_FOUND":
      return "Cette page de réservation n'est pas disponible.";
    case "UNAVAILABLE":
      return "La réservation n'a pas pu aboutir. Contactez directement votre interlocuteur.";
    case "NETWORK":
      return "Connexion impossible. Vérifiez votre réseau, puis réessayez.";
    default:
      return "Une erreur est survenue. Réessayez dans un instant.";
  }
}
