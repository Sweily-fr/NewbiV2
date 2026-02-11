"use client";

import { authClient } from "@/src/lib/auth-client";
import { useUser } from "@/src/lib/auth/hooks";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook pour gérer les permissions utilisateur avec Better Auth
 *
 * @example
 * const { hasPermission, canCreate, canEdit, getUserRole, isLoading } = usePermissions();
 *
 * // Vérifier si les permissions sont prêtes
 * if (isLoading) return <Spinner />;
 *
 * // Vérifier une permission
 * const canCreateQuote = await canCreate("quotes");
 *
 * // Obtenir le rôle
 * const role = getUserRole();
 */
export function usePermissions() {
  // ✅ FIX: useUser exporte "isPending" (pas isLoading)
  const { session, isPending: isSessionLoading } = useUser();
  // ✅ FIX: useWorkspace exporte "loading" et "organization" (pas isLoading et activeOrganization)
  const { organization: activeOrganization, loading: isOrgLoading } = useWorkspace();
  const [orgWithMembers, setOrgWithMembers] = useState(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const hasLoadedRef = useRef(false);
  const permissionCacheRef = useRef(new Map()); // Cache des permissions

  // ✅ FIX: État de chargement global pour éviter les faux "permission denied"
  const isLoading = isSessionLoading || isOrgLoading || isLoadingMembers;

  // Réinitialiser le flag quand l'organisation change
  useEffect(() => {
    hasLoadedRef.current = false;
    setOrgWithMembers(null);
    setIsLoadingMembers(true); // ✅ FIX: Réinitialiser l'état de chargement
  }, [activeOrganization?.id]);

  // Charger l'organisation complète avec les membres
  useEffect(() => {
    if (!activeOrganization || hasLoadedRef.current) return;

    hasLoadedRef.current = true;

    // Si l'organisation a déjà les membres, l'utiliser directement
    if (activeOrganization.members) {
      setOrgWithMembers(activeOrganization);
      setIsLoadingMembers(false); // ✅ FIX: Marquer comme chargé
      return;
    }

    // Sinon, charger l'organisation complète
    setIsLoadingMembers(true);
    authClient.organization
      .getFullOrganization({
        organizationId: activeOrganization.id,
      })
      .then(({ data }) => {
        setOrgWithMembers(data);
      })
      .catch((error) => {
        console.error("Error loading organization members:", error);
        setOrgWithMembers({ ...activeOrganization, members: [] });
      })
      .finally(() => {
        setIsLoadingMembers(false); // ✅ FIX: Toujours marquer comme terminé
      });
  }, [activeOrganization?.id]);

  // Nettoyer le cache quand l'organisation change
  useEffect(() => {
    permissionCacheRef.current.clear();
  }, [activeOrganization?.id]);

  /**
   * Vérifier si l'utilisateur a une permission spécifique
   * @param {string} resource - Nom de la ressource (ex: "quotes", "invoices")
   * @param {string|string[]} actions - Action(s) à vérifier (ex: "create" ou ["create", "edit"])
   * @returns {Promise<boolean>}
   */
  const hasPermission = useCallback(async (resource, actions) => {
    // Attendre que l'organisation avec les membres soit chargée
    if (!session?.user || !orgWithMembers) {
      return false;
    }

    // Récupérer le membre de l'organisation active
    const member = orgWithMembers.members?.find(
      (m) => m.userId === session.user.id
    );

    if (!member) {
      return false;
    }

    // Normaliser le rôle en minuscules pour éviter les problèmes de casse
    const normalizedRole = member.role?.toLowerCase();

    // Owner et Admin ont tous les droits
    if (normalizedRole === "owner" || normalizedRole === "admin") {
      return true;
    }

    // Vérifier les permissions côté client selon le rôle
    const actionsArray = Array.isArray(actions) ? actions : [actions];
    
    // Définition des permissions par rôle (synchronisé avec /src/lib/permissions.js)
    const rolePermissions = {
      member: {
        quotes: ["view", "create", "send", "export"],
        invoices: ["view", "create", "send", "export", "import"],
        creditNotes: ["view", "create", "export"],
        expenses: ["view", "create", "ocr", "export"],
        payments: ["view", "create", "export"],
        clients: ["view", "create", "export"],
        products: ["view", "create", "export"],
        suppliers: ["view", "create"],
        fileTransfers: ["view", "create", "download"],
        sharedDocuments: ["view", "create", "edit", "download"],
        kanban: ["view", "create", "edit", "assign"],
        signatures: ["view", "create", "edit", "set-default"],
        calendar: ["view", "create", "edit"],
        reports: ["view", "export"],
        analytics: ["view", "export"],
        team: ["view"],
      },
      accountant: {
        quotes: ["view", "export"],
        invoices: ["view", "export", "mark-paid", "import"],
        creditNotes: ["view", "export"],
        expenses: ["view", "approve", "export"],
        payments: ["view", "export"],
        clients: ["view", "export"],
        products: ["view", "export"],
        suppliers: ["view"],
        sharedDocuments: ["view", "create", "edit", "delete", "download"],
        reports: ["view", "export"],
        analytics: ["view", "export"],
        team: ["view"],
        auditLog: ["view"],
      },
      viewer: {
        quotes: ["view"],
        invoices: ["view"],
        creditNotes: ["view"],
        expenses: ["view"],
        payments: ["view"],
        clients: ["view"],
        products: ["view"],
        suppliers: ["view"],
        fileTransfers: ["view", "download"],
        kanban: ["view"],
        signatures: ["view"],
        calendar: ["view"],
        reports: ["view"],
        analytics: ["view"],
        team: ["view"],
      },
    };

    // Vérifier si le rôle a les permissions pour cette ressource
    const rolePerms = rolePermissions[normalizedRole];
    if (!rolePerms || !rolePerms[resource]) {
      return false;
    }

    // Vérifier si toutes les actions demandées sont autorisées
    const hasAllActions = actionsArray.every(action => 
      rolePerms[resource].includes(action)
    );

    return hasAllActions;
  }, [session?.user, orgWithMembers]);

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
  const canView = useCallback((resource) => hasPermission(resource, "view"), [hasPermission]);
  const canCreate = useCallback((resource) => hasPermission(resource, "create"), [hasPermission]);
  const canEdit = useCallback((resource) => hasPermission(resource, "edit"), [hasPermission]);
  const canDelete = useCallback((resource) => hasPermission(resource, "delete"), [hasPermission]);
  const canApprove = useCallback((resource) => hasPermission(resource, "approve"), [hasPermission]);
  const canExport = useCallback((resource) => hasPermission(resource, "export"), [hasPermission]);
  const canManage = useCallback((resource) => hasPermission(resource, "manage"), [hasPermission]);

  /**
   * Obtenir le rôle de l'utilisateur dans l'organisation active
   * @returns {string|null} - Le rôle de l'utilisateur ou null
   */
  const getUserRole = useCallback(() => {
    if (!session?.user || !orgWithMembers) return null;

    const member = orgWithMembers.members?.find(
      (m) => m.userId === session.user.id
    );

    // Normaliser le rôle en minuscules
    return member?.role?.toLowerCase() || null;
  }, [session?.user, orgWithMembers]);

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
    // ✅ FIX: État de chargement pour éviter les faux "permission denied"
    isLoading,
    isReady: !isLoading && !!orgWithMembers,

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
