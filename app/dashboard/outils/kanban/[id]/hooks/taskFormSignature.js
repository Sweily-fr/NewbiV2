/**
 * Construit une signature compacte du form pour détecter les changements
 * pertinents pour l'auto-save. On évite de stringify les champs lourds
 * (comments, activity, images, timeTracking) car ils ne sont pas envoyés
 * via l'auto-save et changeraient inutilement la signature.
 */
export function computeAutoSaveSignature(form) {
  if (!form) return "";
  const tagsKey = Array.isArray(form.tags)
    ? form.tags.map((t) => t?.name || "").join("|")
    : "";
  const checklistKey = Array.isArray(form.checklist)
    ? form.checklist
        .map((i) => `${i?.id || ""}:${i?.text || ""}:${i?.completed ? 1 : 0}`)
        .join("|")
    : "";
  const membersKey = Array.isArray(form.assignedMembers)
    ? form.assignedMembers.join("|")
    : "";
  return [
    form.title || "",
    form.description || "",
    form.status || "",
    form.priority || "",
    form.startDate || "",
    form.dueDate || "",
    form.columnId || "",
    tagsKey,
    checklistKey,
    membersKey,
  ].join("");
}
