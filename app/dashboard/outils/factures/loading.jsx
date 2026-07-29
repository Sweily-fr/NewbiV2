import { InvoicePageSkeleton } from "./components/invoice-page-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page factures.
// Réutilise le même composant que le fallback du ProRouteGuard et que le
// tableau pour que la transition soit invisible (pas de doublon de loader).
export default function InvoicesLoading() {
  return <InvoicePageSkeleton />;
}
