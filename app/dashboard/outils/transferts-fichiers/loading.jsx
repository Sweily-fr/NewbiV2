import { TransferPageSkeleton } from "./components/transfer-page-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page transferts.
// Réutilise le même composant que le loadingComponent du RoleRouteGuard pour
// que la transition soit invisible (pas de doublon de loader).
export default function TransfertsLoading() {
  return <TransferPageSkeleton />;
}
