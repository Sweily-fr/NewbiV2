import { SignatureListV2Skeleton } from "./_v2/components/signature-v2-skeleton";

// Squelette affiché pendant le chargement du chunk de la page. Le même
// composant sert de loadingComponent au RoleRouteGuard : transition invisible.
export default function SignaturesLoading() {
  return <SignatureListV2Skeleton />;
}
