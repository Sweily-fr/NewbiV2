import { ClientDetailSkeleton } from "./components/client-detail-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page détail client.
// Réutilise le même composant que le fallback du ProRouteGuard et les états
// de chargement internes pour que la transition soit invisible.
export default function ClientDetailLoading() {
  return <ClientDetailSkeleton />;
}
