"use client";

import { authClient } from "@/src/lib/auth-client";
import { useUser } from "@/src/lib/auth/hooks";
import { useWorkspace } from "@/src/hooks/useWorkspace";

/**
 * Hook pour gérer les permissions utilisateur avec Better Auth
 * 
 * @example
 * const { hasPermission, canCreate, canEdit, getUserRole } = usePermissions();
 * 
 * // Vérifier une permission
 * const canCreateQuote = await canCreate("quotes");
 * 
 * // Obtenir le rôle
 * const role = getUserRole();
 */
export function usePermissions() {
  const { session } = useUser();
  const { activeOrganization } = useWorkspace();

  /**
   * Vérifier si l'utilisateur a une permission spécifique
   * @param {string} resource - Nom de la ressource (ex: "quotes", "invoices")
   * @param {string|string[]} actions - Action(s) à vérifier (ex: "create" ou ["create", "edit"])
   * @returns {Promise<boolean>}
   */
  const hasPermission = async (resource, actions) => {
    if (!session?.user || !activeOrganization) return false;

    // Récupérer le membre de l'organisation active
    const member = activeOrganization.members?.find(
      (m) => m.userId === session.user.id
    );

    if (!member) return false;

    // Owner a tous les droits
    if (member.role === "owner") return true;

    const actionsArray = Array.isArray(actions) ? actions : [actions];

    try {
      const { data } = await authClient.admin.hasPermission({
        permissions: {
          [resource]: actionsArray,
        },
      });

      return data?.hasPermission || false;
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  };

  /**
   * Vérifier une permission de manière synchrone (côté client uniquement)
   * Utile pour l'affichage conditionnel sans appel serveur
   * 
   * @param {string} resource - Nom de la ressource
   * @param {string|string[]} actions - Action(s) à vérifier
   * @param {string} [role] - Rôle à vérifier (optionnel, utilise le rôle de l'utilisateur par défaut)
   * @returns {boolean}
   */
  const checkRolePermission = (resource, actions, role) => {
    // Si pas de rôle fourni, utiliser le rôle de l'utilisateur
    const roleToCheck = role || getUserRole();
    
    if (!roleToCheck) return false;
    
    // Owner a tous les droits
    if (roleToCheck === "owner") return true;

    const actionsArray = Array.isArray(actions) ? actions : [actions];

    try {
      return authClient.admin.checkRolePermission({
        permissions: {
          [resource]: actionsArray,
        },
        role: roleToCheck,
      });
    } catch (error) {
      console.error("Error checking role permission:", error);
      return false;
    }
  };

  /**
   * Raccourcis pour les actions courantes
   */
  const canView = (resource) => hasPermission(resource, "view");
  const canCreate = (resource) => hasPermission(resource, "create");
  const canEdit = (resource) => hasPermission(resource, "edit");
  const canDelete = (resource) => hasPermission(resource, "delete");
  const canApprove = (resource) => hasPermission(resource, "approve");
  const canExport = (resource) => hasPermission(resource, "export");
  const canManage = (resource) => hasPermission(resource, "manage");

  /**
   * Obtenir le rôle de l'utilisateur dans l'organisation active
   * @returns {string|null} - Le rôle de l'utilisateur ou null
   */
  const getUserRole = () => {
    if (!session?.user || !activeOrganization) return null;

    const member = activeOrganization.members?.find(
      (m) => m.userId === session.user.id
    );

    return member?.role || null;
  };

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   * @param {string|string[]} roles - Rôle(s) à vérifier
   * @returns {boolean}
   */
  const hasRole = (roles) => {
    const userRole = getUserRole();
    if (!userRole) return false;

    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(userRole);
  };

  /**
   * Vérifier si l'utilisateur est owner
   * @returns {boolean}
   */
  const isOwner = () => getUserRole() === "owner";

  /**
   * Vérifier si l'utilisateur est admin
   * @returns {boolean}
   */
  const isAdmin = () => getUserRole() === "admin";

  /**
   * Vérifier si l'utilisateur est member
   * @returns {boolean}
   */
  const isMember = () => getUserRole() === "member";

  /**
   * Vérifier si l'utilisateur est viewer
   * @returns {boolean}
   */
  const isViewer = () => getUserRole() === "viewer";

  /**
   * Vérifier si l'utilisateur est accountant
   * @returns {boolean}
   */
  const isAccountant = () => getUserRole() === "accountant";

  /**
   * Vérifier si l'utilisateur peut éditer une ressource spécifique
   * Prend en compte la propriété (own vs any)
   * 
   * @param {string} resource - Nom de la ressource
   * @param {boolean} isOwn - Si c'est la propre ressource de l'utilisateur
   * @returns {Promise<boolean>}
   */
  const canEditResource = async (resource, isOwn = false) => {
    const role = getUserRole();
    
    // Owner et Admin peuvent tout éditer
    if (role === "owner" || role === "admin") {
      return true;
    }

    // Member peut éditer ses propres ressources
    if (role === "member" && isOwn) {
      return await canEdit(resource);
    }

    // Viewer et Accountant ne peuvent rien éditer
    return false;
  };

  /**
   * Vérifier si l'utilisateur peut supprimer une ressource spécifique
   * Prend en compte la propriété (own vs any)
   * 
   * @param {string} resource - Nom de la ressource
   * @param {boolean} isOwn - Si c'est la propre ressource de l'utilisateur
   * @returns {Promise<boolean>}
   */
  const canDeleteResource = async (resource, isOwn = false) => {
    const role = getUserRole();
    
    // Seuls Owner et Admin peuvent supprimer
    if (role === "owner" || role === "admin") {
      return await canDelete(resource);
    }

    // Member, Viewer et Accountant ne peuvent pas supprimer
    return false;
  };

  return {
    // Vérifications de permissions
    hasPermission,
    checkRolePermission,
    
    // Raccourcis d'actions
    canView,
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canExport,
    canManage,
    
    // Vérifications avancées
    canEditResource,
    canDeleteResource,
    
    // Informations sur le rôle
    getUserRole,
    hasRole,
    isOwner,
    isAdmin,
    isMember,
    isViewer,
    isAccountant,
  };
}
