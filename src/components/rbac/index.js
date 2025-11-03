/**
 * ========================================
 * COMPOSANTS RBAC (Role-Based Access Control)
 * ========================================
 * 
 * Composants React pour gérer l'affichage conditionnel
 * basé sur les permissions et rôles utilisateur
 */

// Composants de gate (affichage conditionnel)
export {
  PermissionGate,
  RoleGate,
  OwnerOnly,
  AdminOnly,
  MemberOnly,
  AccountantOnly,
} from "./PermissionGate";

// Composants de boutons avec permissions
export {
  PermissionButton,
  PermissionMenuItem,
} from "./PermissionButton";

// Guards de routes (protection des pages)
export {
  RBACRouteGuard,
  RoleRouteGuard,
  OwnerRouteGuard,
  AdminRouteGuard,
} from "./RBACRouteGuard";
