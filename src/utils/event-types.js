import { DECLARATION_PRESETS } from "@/src/utils/declaration-events";

/**
 * Choix d'un type dans la fenêtre d'un événement : « Événement »
 * (ordinaire), une déclaration Newbi ou un type créé par l'espace. Fonctions
 * pures, sans rendu.
 */

/** Identifiant d'un nouveau type d'événement. */
export function newEventTypeId(now = Date.now(), random = Math.random()) {
  return `type_${now.toString(36)}${random.toString(36).slice(2, 7)}`;
}

/**
 * Champs à changer quand on choisit un type. Le titre et la description ne
 * sont remplacés que s'ils sont vides ou encore ceux d'un type : ce que
 * l'utilisateur a écrit est gardé.
 * - selection : { declarationKind } ou { eventType } (ou rien : ordinaire)
 * - current : { title, description }
 * - customTypes : types de l'espace (leurs noms sont des titres par défaut)
 */
export function typeSelectionPatch({
  selection = {},
  current = {},
  customTypes = [],
}) {
  const presets = Object.values(DECLARATION_PRESETS);
  const defaultTitles = new Set([
    ...presets.map((preset) => preset.title),
    ...customTypes.map((type) => type.name),
  ]);
  const defaultDescriptions = new Set(
    presets.map((preset) => preset.description),
  );
  const title = String(current.title ?? "").trim();
  const description = String(current.description ?? "").trim();
  const titleUntouched = !title || defaultTitles.has(title);
  const descriptionUntouched =
    !description || defaultDescriptions.has(description);

  const preset = selection.declarationKind
    ? DECLARATION_PRESETS[selection.declarationKind]
    : null;
  const type = selection.eventType || null;

  const patch = {
    declarationKind: preset ? preset.kind : null,
    eventTypeId: type ? type.id : null,
  };
  if (titleUntouched) patch.title = preset?.title || type?.name || "";
  if (descriptionUntouched) patch.description = preset?.description || "";
  if (preset) {
    patch.allDay = true;
    patch.color = preset.color;
  } else if (type) {
    patch.allDay = Boolean(type.allDay);
    patch.color = type.color;
  }
  return patch;
}
