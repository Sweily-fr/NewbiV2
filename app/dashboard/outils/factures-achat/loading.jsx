import { PurchaseInvoicePageSkeleton } from "./components/purchase-invoice-page-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page factures d'achat.
// Réutilise le même composant que le fallback du ProRouteGuard pour que la
// transition soit invisible (pas de doublon de loader).
export default function PurchaseInvoicesLoading() {
  return <PurchaseInvoicePageSkeleton />;
}
