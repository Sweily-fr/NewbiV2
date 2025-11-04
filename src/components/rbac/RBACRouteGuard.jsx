"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/src/hooks/usePermissions";
import { Loader2 } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";

/**
 * Guard de route basé sur les permissions RBAC
 * Redirige l'utilisateur s'il n'a pas la permission requise
 *
 * @example
 * <RBACRouteGuard resource="invoices" action="create">
 *   <CreateInvoiceForm />
 * </RBACRouteGuard>
 *
 * @example
 * <RBACRouteGuard
 *   resource="invoices"
 *   action="delete"
 *   fallbackUrl="/dashboard"
 *   showToast={true}
 * >
 *   <DeleteInvoiceButton />
 * </RBACRouteGuard>
 */
export function RBACRouteGuard({
  children,
  resource,
  action,
  fallbackUrl = "/dashboard",
  loadingComponent,
  showToast = true,
  toastMessage = "Vous n'avez pas la permission d'accéder à cette page",
}) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const toastShownRef = useRef(false); // Pour éviter les toasts multiples

  useEffect(() => {
    let isMounted = true; // Pour éviter les mises à jour après démontage

    const checkAccess = async () => {
      setIsChecking(true);

      try {
        const access = await hasPermission(resource, action);

        if (!isMounted) return; // Ne rien faire si le composant est démonté

        setHasAccess(access);

        if (!access) {
          // Afficher un toast si demandé (une seule fois)
          if (showToast && !toastShownRef.current) {
            toast.error(toastMessage);
            toastShownRef.current = true; // Marquer comme affiché
          }

          // Rediriger après un court délai
          setTimeout(() => {
            if (isMounted) {
              router.push(fallbackUrl);
            }
          }, 100);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des permissions:", error);

        if (!isMounted) return;

        setHasAccess(false);

        // En cas d'erreur, rediriger par sécurité
        if (showToast && !toastShownRef.current) {
          toast.error("Erreur lors de la vérification des permissions");
          toastShownRef.current = true;
        }
        router.push(fallbackUrl);
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkAccess();

    // Cleanup pour éviter les appels multiples
    return () => {
      isMounted = false;
    };
  }, [
    resource,
    action,
    hasPermission,
    router,
    fallbackUrl,
    showToast,
    toastMessage,
  ]);

  // Afficher le loading pendant la vérification
  if (isChecking) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Vérification des permissions...
            </p>
          </div>
        </div>
      )
    );
  }

  // Ne rien afficher si pas d'accès (redirection en cours)
  if (!hasAccess) {
    return null;
  }

  // Afficher le contenu si accès autorisé
  return <>{children}</>;
}

/**
 * Guard de route basé uniquement sur le rôle
 * Plus simple que RBACRouteGuard pour les cas où on vérifie juste le rôle
 *
 * @example
 * <RoleRouteGuard roles={["owner", "admin"]}>
 *   <AdminPanel />
 * </RoleRouteGuard>
 */
export function RoleRouteGuard({
  children,
  roles,
  fallbackUrl = "/dashboard",
  loadingComponent,
  showToast = true,
  toastMessage = "Vous n'avez pas accès à cette page",
}) {
  const router = useRouter();
  const { getUserRole } = usePermissions();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const toastShownRef = useRef(false); // Pour éviter les toasts multiples

  useEffect(() => {
    const checkAccess = () => {
      const userRole = getUserRole();

      // Si le rôle n'est pas encore chargé, rester en mode "checking"
      if (userRole === null) {
        setIsChecking(true);
        return;
      }

      const rolesArray = Array.isArray(roles) ? roles : [roles];
      const access = rolesArray.includes(userRole);

      setHasAccess(access);
      setIsChecking(false);

      if (!access) {
        if (showToast && !toastShownRef.current) {
          toast.error(toastMessage);
          toastShownRef.current = true;
        }

        setTimeout(() => {
          router.push(fallbackUrl);
        }, 100);
      }
    };

    checkAccess();
  }, [roles, getUserRole, router, fallbackUrl, showToast, toastMessage]);

  if (isChecking) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Vérification du rôle...
            </p>
          </div>
        </div>
      )
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Guard pour les pages réservées aux owners
 */
export function OwnerRouteGuard({ children, ...props }) {
  return (
    <RoleRouteGuard
      roles="owner"
      toastMessage="Cette page est réservée aux propriétaires de l'organisation"
      {...props}
    >
      {children}
    </RoleRouteGuard>
  );
}

/**
 * Guard pour les pages réservées aux admins (owner + admin)
 */
export function AdminRouteGuard({ children, ...props }) {
  return (
    <RoleRouteGuard
      roles={["owner", "admin"]}
      toastMessage="Cette page est réservée aux administrateurs"
      {...props}
    >
      {children}
    </RoleRouteGuard>
  );
}
