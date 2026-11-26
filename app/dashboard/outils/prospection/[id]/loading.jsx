import { ProspectionDetailPageSkeleton } from "../components/prospection-detail-page-skeleton";

// Squelette pendant le chargement du chunk de la page : le même que pendant
// le chargement de la prospection, transition invisible.
export default function ProspectionDetailLoading() {
  return <ProspectionDetailPageSkeleton />;
}
