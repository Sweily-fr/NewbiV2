/**
 * Libellés des rôles prédéfinis des espaces. Les clés techniques n'ont pas
 * changé (aucun membre migré) : member = Éditeur, viewer = Membre,
 * owner = Super admin. Les rôles personnalisés (role_xxx) portent leur nom,
 * fourni par l'API (requête organizationRoles).
 */
export const PREDEFINED_ROLE_LABELS = {
  owner: "Super admin",
  admin: "Administrateur",
  member: "Éditeur",
  viewer: "Membre",
  accountant: "Comptable",
};

/** Rôle proposé par défaut à l'invitation (lecture seule). */
export const DEFAULT_INVITE_ROLE = "viewer";

export function predefinedRoleLabel(role, fallback = "Rôle personnalisé") {
  const key = String(role || "").toLowerCase();
  return PREDEFINED_ROLE_LABELS[key] || fallback;
}
