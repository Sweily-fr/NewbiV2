"use client";

import { authClient } from "@/src/lib/auth-client";
import { useUser } from "@/src/lib/auth/hooks";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  getFullOrganizationCached,
  peekFullOrganization,
} from "@/src/lib/full-organization-cache";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { canAction } from "@/src/lib/role-levels";

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
  const { organization: activeOrganization, loading: isOrgLoading } =
    useWorkspace();
  // Cache partagé (full-organization-cache) : les ~25 sites qui montent
  // usePermissions partagent la même entrée et la même promesse réseau que
  // useWorkspace. Sans lui, chaque montage repartait de null (spinner plein
  // écran des gardes) et relançait getFullOrganization.
  const cachedEntry = peekFullOrganization(activeOrganization?.id);
  const [orgWithMembers, setOrgWithMembers] = useState(
    cachedEntry?.org || null,
  );
  const [isLoadingMembers, setIsLoadingMembers] = useState(!cachedEntry);
  // Échec du chargement des membres (réseau/session) sans cache exploitable :
  // à distinguer d'un vrai refus de permission par les gardes de page
  const [membersLoadFailed, setMembersLoadFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const hasLoadedRef = useRef(false);
  const permissionCacheRef = useRef(new Map()); // Cache des permissions

  const {
    levels: permissionLevels,
    loading: isPermissionsLoading,
    error: permissionsError,
  } = useMyPermissions();

  // ✅ FIX: État de chargement global pour éviter les faux "permission denied"
  const isLoading =
    isSessionLoading ||
    isOrgLoading ||
    isLoadingMembers ||
    (isPermissionsLoading && !permissionsError);

  // Réinitialiser le flag quand l'organisation change
  useEffect(() => {
    hasLoadedRef.current = false;
    const cached = peekFullOrganization(activeOrganization?.id);
    setOrgWithMembers(cached?.org || null);
    setIsLoadingMembers(!cached);
    setMembersLoadFailed(false);
  }, [activeOrganization?.id]);

  // Charger l'organisation complète avec les membres
  useEffect(() => {
    if (!activeOrganization || hasLoadedRef.current) return;

    hasLoadedRef.current = true;

    const cached = peekFullOrganization(activeOrganization.id);
    if (cached) {
      setOrgWithMembers(cached.org);
      setIsLoadingMembers(false);
      // Entrée encore fraîche : pas d'appel réseau
      if (cached.isFresh) return;
    }

    // Si l'organisation a déjà les membres, l'utiliser directement
    if (!cached && activeOrganization.members) {
      setOrgWithMembers(activeOrganization);
      setIsLoadingMembers(false); // ✅ FIX: Marquer comme chargé
      return;
    }

    // Sinon, charger l'organisation complète via le cache partagé (dédupliqué,
    // en arrière-plan si un cache périmé est déjà affiché)
    if (!cached) setIsLoadingMembers(true);
    getFullOrganizationCached(activeOrganization.id)
      .then((data) => {
        if (data) {
          setOrgWithMembers(data);
          setMembersLoadFailed(false);
        } else if (!cached) {
          // Ne PAS retomber sur une org avec members: [] — l'utilisateur
          // n'y serait jamais trouvé et un simple échec réseau se
          // transformerait en "Permission refusée" permanent, même pour
          // un owner/admin. On signale l'échec pour laisser les gardes
          // proposer un retry.
          setMembersLoadFailed(true);
        }
      })
      .finally(() => {
        setIsLoadingMembers(false); // ✅ FIX: Toujours marquer comme terminé
      });
  }, [activeOrganization?.id, retryNonce]);

  // Nettoyer le cache quand l'organisation change
  useEffect(() => {
    permissionCacheRef.current.clear();
  }, [activeOrganization?.id]);

  // Relancer le chargement des membres après un échec (membersLoadFailed)
  const retryLoadMembers = useCallback(() => {
    hasLoadedRef.current = false;
    setMembersLoadFailed(false);
    setIsLoadingMembers(true);
    setRetryNonce((n) => n + 1);
  }, []);

  /**
   * Vérifier si l'utilisateur a une permission spécifique
   * @param {string} resource - Nom de la ressource (ex: "quotes", "invoices")
   * @param {string|string[]} actions - Action(s) à vérifier (ex: "create" ou ["create", "edit"])
   * @returns {Promise<boolean>}
   */
  const hasPermission = useCallback(
    async (resource, actions) => {
      // Attendre que l'organisation avec les membres soit chargée
      if (!session?.user || !orgWithMembers) {
        return false;
      }

      // Récupérer le membre de l'organisation active
      const member = orgWithMembers.members?.find(
        (m) => m.userId === session.user.id,
      );

      if (!member) {
        return false;
      }

      // Grille calculée par l'API (rôle prédéfini, ajusté ou personnalisé)
      if (!permissionLevels) {
        return false;
      }
      const actionsArray = Array.isArray(actions) ? actions : [actions];
      const hasAllActions = actionsArray.every((action) =>
        canAction(permissionLevels, resource, action),
      );

      return hasAllActions;
    },
    [session?.user, orgWithMembers, permissionLevels],
  );

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
  const canView = useCallback(
    (resource) => hasPermission(resource, "view"),
    [hasPermission],
  );
  const canCreate = useCallback(
    (resource) => hasPermission(resource, "create"),
    [hasPermission],
  );
  const canEdit = useCallback(
    (resource) => hasPermission(resource, "edit"),
    [hasPermission],
  );
  const canDelete = useCallback(
    (resource) => hasPermission(resource, "delete"),
    [hasPermission],
  );
  const canApprove = useCallback(
    (resource) => hasPermission(resource, "approve"),
    [hasPermission],
  );
  const canExport = useCallback(
    (resource) => hasPermission(resource, "export"),
    [hasPermission],
  );
  const canManage = useCallback(
    (resource) => hasPermission(resource, "manage"),
    [hasPermission],
  );

  /**
   * Obtenir le rôle de l'utilisateur dans l'organisation active
   * @returns {string|null} - Le rôle de l'utilisateur ou null
   */
  const getUserRole = useCallback(() => {
    if (!session?.user || !orgWithMembers) return null;

    const member = orgWithMembers.members?.find(
      (m) => m.userId === session.user.id,
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
   *
   * @param {string} resource - Nom de la ressource
   * @returns {Promise<boolean>}
   */
  const canEditResource = async (resource) => await canEdit(resource);

  /**
   * Vérifier si l'utilisateur peut supprimer une ressource spécifique.
   * Les suppressions limitées à l'auteur (signatures de mail) sont filtrées
   * par l'API.
   *
   * @param {string} resource - Nom de la ressource
   * @returns {Promise<boolean>}
   */
  const canDeleteResource = async (resource) => await canDelete(resource);

  return {
    // ✅ FIX: État de chargement pour éviter les faux "permission denied"
    isLoading,
    isReady: !isLoading && !!orgWithMembers,
    // Grille de droits de l'API indisponible : à traiter comme un échec de
    // chargement (retry), pas comme un refus
    membersLoadFailed: membersLoadFailed || Boolean(permissionsError),
    permissionLevels,
    retryLoadMembers,

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
