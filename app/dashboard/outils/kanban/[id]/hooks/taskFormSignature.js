/**
 * Construit une signature compacte du form pour détecter les changements
 * pertinents pour l'auto-save. On évite de stringify les champs lourds
 * (comments, activity, images, timeTracking) car ils ne sont pas envoyés
 * via l'auto-save et changeraient inutilement la signature.
 *
 * Membres, tags et checklist n'en font pas partie : ils sont envoyés
 * élément par élément dès le clic (mutations atomiques, voir taskFieldOps
 * dans useKanbanTasks). Les inclure relançait un updateTask sans objet à
 * chaque case cochée.
 */
export function computeAutoSaveSignature(form) {
  if (!form) return "";
  return [
    form.title || "",
    form.description || "",
    form.status || "",
    form.priority || "",
    form.startDate || "",
    form.dueDate || "",
    form.columnId || "",
  ].join("");
}
