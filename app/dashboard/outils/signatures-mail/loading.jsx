import { SignaturePageSkeleton } from "./components/signature-page-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page signatures mail.
// Réutilise le même composant que le loadingComponent du RoleRouteGuard pour
// que la transition soit invisible (pas de doublon de loader).
export default function SignaturesLoading() {
  return <SignaturePageSkeleton />;
}
