import { TransferUploadSkeleton } from "../components/transfer-upload-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page nouveau
// transfert. Même composant que le fallback du ProRouteGuard : la route
// n'hérite plus du skeleton de la LISTE des transferts.
export default function NewTransferLoading() {
  return <TransferUploadSkeleton />;
}
