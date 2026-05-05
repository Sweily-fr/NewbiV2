"use client";

import { usePermissions } from "@/src/hooks/usePermissions";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { Button } from "@/src/components/ui/button";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Composant PermissionButton
 * Bouton qui se désactive automatiquement si l'utilisateur n'a pas les permissions
 * OU si l'abonnement est en lecture seule (requiresActiveSubscription).
 *
 * @example
 * <PermissionButton
 *   resource="invoices"
 *   action="create"
 *   requiresActiveSubscription
 *   onClick={handleCreate}
 * >
 *   Créer une facture
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
  requiresActiveSubscription = false,
  tooltipNoAccess = "Vous n'avez pas la permission d'effectuer cette action",
  ...buttonProps
}) {
  const {
    hasPermission,
    hasRole,
    isLoading: isPermissionLoading,
    isReady,
  } = usePermissions();
  const { isReadOnly, isOwner, loading: subLoading } = useSubscriptionAccess();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Subscription blocks write actions
  const isSubscriptionBlocked = requiresActiveSubscription && isReadOnly;

  useEffect(() => {
    let isMounted = true;

    const checkPermission = async () => {
      if (!isMounted) return;

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

  const isDisabled =
    disabled || isChecking || !hasAccess || isSubscriptionBlocked;

  // Determine tooltip
  let tooltip = buttonProps.title;
  if (isSubscriptionBlocked) {
    tooltip = isOwner
      ? "Votre abonnement est en lecture seule. Renouvelez pour effectuer cette action."
      : "Cet espace est en lecture seule. Contactez l'administrateur.";
  } else if (!hasAccess && !isChecking) {
    tooltip = tooltipNoAccess;
  }

  return (
    <Button
      {...buttonProps}
      disabled={isDisabled}
      onClick={hasAccess && !isSubscriptionBlocked ? onClick : undefined}
      title={tooltip}
    >
      {isChecking && !isSubscriptionBlocked ? (
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
 */
export function PermissionMenuItem({
  children,
  resource,
  action,
  roles,
  onClick,
  disabled = false,
  hideIfNoAccess = false,
  requiresActiveSubscription = false,
  className = "",
  ...props
}) {
  const {
    hasPermission,
    hasRole,
    isLoading: isPermissionLoading,
    isReady,
  } = usePermissions();
  const { isReadOnly } = useSubscriptionAccess();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const isSubscriptionBlocked = requiresActiveSubscription && isReadOnly;

  useEffect(() => {
    const checkPermission = async () => {
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
  }, [
    resource,
    action,
    roles,
    hasPermission,
    hasRole,
    isPermissionLoading,
    isReady,
  ]);

  if (!isChecking && !hasAccess && hideIfNoAccess) {
    return null;
  }

  const isDisabled =
    disabled || isChecking || !hasAccess || isSubscriptionBlocked;

  return (
    <div
      className={`${className} ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      onClick={
        hasAccess && !disabled && !isSubscriptionBlocked ? onClick : undefined
      }
      {...props}
    >
      {children}
    </div>
  );
}
