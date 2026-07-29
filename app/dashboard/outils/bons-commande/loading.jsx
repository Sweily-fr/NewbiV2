import { PurchaseOrderPageSkeleton } from "./components/purchase-order-page-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page bons de commande.
// Réutilise le même composant que le fallback du ProRouteGuard pour que la
// transition soit invisible (pas de doublon de loader).
export default function PurchaseOrdersLoading() {
  return <PurchaseOrderPageSkeleton />;
}
