import { CampagnePageSkeleton } from "../components/campagne-page-skeleton";

// Squelette pendant le chargement du chunk de la page : le même que pendant
// le chargement de la campagne, transition invisible.
export default function CampagneLoading() {
  return <CampagnePageSkeleton />;
}
