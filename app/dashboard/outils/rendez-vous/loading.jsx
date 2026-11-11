import { RendezVousPageSkeleton } from "./components/rendez-vous-page-skeleton";

// Squelette affiché pendant le chargement du chunk de la page. Le même
// composant sert de loadingComponent au RoleRouteGuard : transition invisible.
export default function RendezVousLoading() {
  return <RendezVousPageSkeleton />;
}
