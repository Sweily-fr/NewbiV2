import { CampagnesEmailPageSkeleton } from "./components/campagnes-email-page-skeleton";

// Squelette affiché pendant le chargement du chunk de la page : le même que
// pendant le premier chargement des campagnes, transition invisible.
export default function CampagnesEmailLoading() {
  return <CampagnesEmailPageSkeleton />;
}
