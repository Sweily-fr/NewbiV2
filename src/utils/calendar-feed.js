import { differenceInSeconds, format, formatDistanceStrict } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Lien d'abonnement au calendrier (fenêtre « Recevoir le calendrier
 * ailleurs ») : textes affichés autour de l'adresse. Fonctions pures.
 */

/**
 * Dernière lecture du lien par une application d'agenda : « Jamais lu par
 * un agenda pour l'instant », « Lu par un agenda à l'instant », « Lu par
 * un agenda il y a 2 heures ».
 */
export function lastReadLabel(lastAccessedAt, now = new Date()) {
  if (!lastAccessedAt) return "Jamais lu par un agenda pour l'instant";
  const date = new Date(lastAccessedAt);
  if (Number.isNaN(date.getTime())) {
    return "Jamais lu par un agenda pour l'instant";
  }
  if (differenceInSeconds(now, date) < 60) {
    return "Lu par un agenda à l'instant";
  }
  return `Lu par un agenda ${formatDistanceStrict(date, now, {
    locale: fr,
    addSuffix: true,
  })}`;
}

/** « Lien créé le 28 octobre 2026 », ou null sans date. */
export function createdLabel(createdAt) {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return `Lien créé le ${format(date, "d MMMM yyyy", { locale: fr })}`;
}

/**
 * Où coller le lien dans chaque application (texte court, sans jargon).
 */
export const FEED_HELP = [
  {
    app: "Google Agenda",
    steps:
      "Sur ordinateur, à côté de « Autres agendas », cliquez sur +, puis « À partir de l'URL » et collez le lien.",
  },
  {
    app: "Apple Calendrier",
    steps:
      "Sur Mac : menu Fichier, « Nouvel abonnement à un calendrier ». Sur iPhone : Réglages, Calendrier, Comptes, Ajouter un compte, Autre, « Ajouter un calendrier avec abonnement ».",
  },
  {
    app: "Outlook",
    steps:
      "Dans le calendrier, « Ajouter un calendrier », puis « S'abonner à partir du web » et collez le lien.",
  },
];
