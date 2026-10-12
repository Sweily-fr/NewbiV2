import { GestionnairePageSkeleton } from "@/src/components/gestionnaire/gestionnaire-page-skeleton";

// Chargement des pages de l'espace gestionnaire (au lieu du squelette de
// l'Accueil, hérité de /dashboard/loading.jsx)
export default function GestionnaireLoading() {
  return <GestionnairePageSkeleton />;
}
