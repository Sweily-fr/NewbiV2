"use client";

import { usePermissions } from "@/src/hooks/usePermissions";
import { useEffect, useState } from "react";

/**
 * Composant PermissionGate
 * Affiche son contenu uniquement si l'utilisateur a les permissions requises
 * 
 * @example
 * <PermissionGate resource="invoices" action="create">
 *   <Button>Créer une facture</Button>
 * </PermissionGate>
 * 
 * @example
 * <PermissionGate resource="invoices" action={["create", "edit"]}>
 *   <Button>Gérer les factures</Button>
 * </PermissionGate>
 * 
 * @example
 * <PermissionGate roles={["owner", "admin"]}>
 *   <Button>Paramètres avancés</Button>
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  resource,
  action,
  roles,
  fallback = null,
  loading = null,
}) {
  const { hasPermission, hasRole } = usePermissions();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      setIsLoading(true);

      try {
        let access = false;

        // Vérification par rôle
        if (roles) {
          access = hasRole(roles);
        }
        // Vérification par permission
        else if (resource && action) {
          access = await hasPermission(resource, action);
        }
        // Si aucun critère, afficher par défaut
        else {
          access = true;
        }

        setHasAccess(access);
      } catch (error) {
        console.error("Error checking permission:", error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [resource, action, roles, hasPermission, hasRole]);

  // Afficher le loading si fourni
  if (isLoading && loading) {
    return loading;
  }

  // Afficher le fallback si pas d'accès
  if (!isLoading && !hasAccess) {
    return fallback;
  }

  // Afficher le contenu si accès autorisé
  return hasAccess ? children : null;
}

/**
 * Composant RoleGate
 * Affiche son contenu uniquement si l'utilisateur a un des rôles spécifiés
 * 
 * @example
 * <RoleGate roles={["owner", "admin"]}>
 *   <Button>Supprimer</Button>
 * </RoleGate>
 */
export function RoleGate({ children, roles, fallback = null }) {
  return (
    <PermissionGate roles={roles} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Composant OwnerOnly
 * Affiche son contenu uniquement pour les owners
 */
export function OwnerOnly({ children, fallback = null }) {
  return <RoleGate roles="owner" fallback={fallback}>{children}</RoleGate>;
}

/**
 * Composant AdminOnly
 * Affiche son contenu uniquement pour les owners et admins
 */
export function AdminOnly({ children, fallback = null }) {
  return <RoleGate roles={["owner", "admin"]} fallback={fallback}>{children}</RoleGate>;
}

/**
 * Composant MemberOnly
 * Affiche son contenu uniquement pour les members
 */
export function MemberOnly({ children, fallback = null }) {
  return <RoleGate roles="member" fallback={fallback}>{children}</RoleGate>;
}

/**
 * Composant AccountantOnly
 * Affiche son contenu uniquement pour les accountants
 */
export function AccountantOnly({ children, fallback = null }) {
  return <RoleGate roles="accountant" fallback={fallback}>{children}</RoleGate>;
}
