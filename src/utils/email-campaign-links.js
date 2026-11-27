/**
 * Bouton des campagnes, choix « Lien vers » : pages de prise de rendez-vous
 * de l'espace, leurs types de rendez-vous et leurs événements (requête
 * emailCampaignLinkTargets de l'API, vide si l'espace n'y a pas accès).
 * Choisir une destination remplit l'adresse du bouton ; l'adresse reste
 * modifiable à la main.
 */

/** Valeur du choix quand l'adresse ne correspond à aucune destination. */
export const CUSTOM_LINK = "custom";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Paris",
});

/** « 15 janv. 2027 », vide si la date est illisible. */
export function eventDateLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormat.format(date);
}

/** Libellé d'une destination dans la liste. */
export function linkTargetLabel(target) {
  if (!target) return "";
  switch (target.kind) {
    case "BOOKING_PAGE":
      return "Page de prise de rendez-vous";
    case "EVENT": {
      const date = eventDateLabel(target.startAt);
      return `Événement « ${target.label} »${date ? `, ${date}` : ""}`;
    }
    default:
      return `Rendez-vous « ${target.label} »`;
  }
}

/** Destinations groupées par page, dans l'ordre reçu de l'API. */
export function groupLinkTargets(targets) {
  const groups = [];
  for (const target of targets || []) {
    if (!target?.id || !target.url) continue;
    let group = groups.find((item) => item.pageId === target.pageId);
    if (!group) {
      group = {
        pageId: target.pageId,
        title: target.pageTitle || "Prise de rendez-vous",
        targets: [],
      };
      groups.push(group);
    }
    group.targets.push(target);
  }
  return groups;
}

const comparable = (url) =>
  String(url ?? "")
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();

/** Destination dont l'adresse est celle du bouton, sinon null. */
export function findLinkTarget(targets, url) {
  const wanted = comparable(url);
  if (!wanted) return null;
  return (
    (targets || []).find((target) => comparable(target.url) === wanted) || null
  );
}
