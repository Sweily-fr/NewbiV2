import { BlockedPageSkeleton } from "./components/blocked-page-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page contacts bloqués.
// Réutilise le même composant que le fallback du ProRouteGuard et l'état de
// chargement interne pour que la transition soit invisible.
export default function BlockedLoading() {
  return <BlockedPageSkeleton />;
}
