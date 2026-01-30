"use client";

import { usePermissions } from "@/src/hooks/usePermissions";
import { Button } from "@/src/components/ui/button";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Composant PermissionButton
 * Bouton qui se désactive automatiquement si l'utilisateur n'a pas les permissions
 * 
 * @example
 * <PermissionButton 
 *   resource="invoices" 
 *   action="create"
 *   onClick={handleCreate}
 * >
 *   Créer une facture
 * </PermissionButton>
 * 
 * @example
 * <PermissionButton 
 *   roles={["owner", "admin"]}
 *   onClick={handleDelete}
 *   variant="destructive"
 * >
 *   Supprimer
 * </PermissionButton>
 */
export function PermissionButton({
  children,
  resource,
  action,
  roles,
  onClick,
  disabled = false,
  hideIfNoAccess = false,
  tooltipNoAccess = "Vous n'avez pas la permission d'effectuer cette action",
  ...buttonProps
}) {
  const { hasPermission, hasRole, isLoading: isPermissionLoading, isReady } = usePermissions();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkPermission = async () => {
      if (!isMounted) return;

      // ✅ FIX: Attendre que les permissions soient prêtes avant de vérifier
      // Cela évite les faux "permission denied" pendant le chargement
      if (isPermissionLoading || !isReady) {
        setIsChecking(true);
        return; // Ne pas encore vérifier, attendre que isReady soit true
      }

      setIsChecking(true);

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
        // Si aucun critère, autoriser par défaut
        else {
          access = true;
        }

        if (isMounted) {
          setHasAccess(access);
        }
      } catch (error) {
        console.error("Error checking permission:", error);
        if (isMounted) {
          setHasAccess(false);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkPermission();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, action, JSON.stringify(roles), isPermissionLoading, isReady]);

  // Masquer le bouton si pas d'accès et hideIfNoAccess = true
  if (!isChecking && !hasAccess && hideIfNoAccess) {
    return null;
  }

  // Désactiver le bouton si pas d'accès ou en cours de vérification
  const isDisabled = disabled || isChecking || !hasAccess;

  return (
    <Button
      {...buttonProps}
      disabled={isDisabled}
      onClick={hasAccess ? onClick : undefined}
      title={!hasAccess && !isChecking ? tooltipNoAccess : buttonProps.title}
    >
      {isChecking ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Vérification...
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/**
 * Composant PermissionMenuItem
 * Item de menu qui se désactive automatiquement si l'utilisateur n'a pas les permissions
 * 
 * @example
 * <PermissionMenuItem 
 *   resource="invoices" 
 *   action="delete"
 *   onClick={handleDelete}
 * >
 *   <Trash className="mr-2 h-4 w-4" />
 *   Supprimer
 * </PermissionMenuItem>
 */
export function PermissionMenuItem({
  children,
  resource,
  action,
  roles,
  onClick,
  disabled = false,
  hideIfNoAccess = false,
  className = "",
  ...props
}) {
  const { hasPermission, hasRole, isLoading: isPermissionLoading, isReady } = usePermissions();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      // ✅ FIX: Attendre que les permissions soient prêtes
      if (isPermissionLoading || !isReady) {
        setIsChecking(true);
        return;
      }

      setIsChecking(true);

      try {
        let access = false;

        if (roles) {
          access = hasRole(roles);
        } else if (resource && action) {
          access = await hasPermission(resource, action);
        } else {
          access = true;
        }

        setHasAccess(access);
      } catch (error) {
        console.error("Error checking permission:", error);
        setHasAccess(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkPermission();
  }, [resource, action, roles, hasPermission, hasRole, isPermissionLoading, isReady]);

  // Masquer l'item si pas d'accès et hideIfNoAccess = true
  if (!isChecking && !hasAccess && hideIfNoAccess) {
    return null;
  }

  const isDisabled = disabled || isChecking || !hasAccess;

  return (
    <div
      className={`${className} ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      onClick={hasAccess && !disabled ? onClick : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
