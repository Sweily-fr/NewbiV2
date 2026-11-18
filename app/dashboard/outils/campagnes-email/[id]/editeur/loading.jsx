import { EditeurPageSkeleton } from "../../components/editeur-page-skeleton";

// Squelette pendant le chargement du chunk de l'éditeur : le même que
// pendant le chargement de la campagne, transition invisible.
export default function EditeurLoading() {
  return <EditeurPageSkeleton />;
}
