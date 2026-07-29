import { LegalNoticePageSkeleton } from "./components/legal-notice-page-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page mentions
// légales. Reproduit le formulaire et la preview (au lieu du skeleton de
// tableau générique des outils) pour que la transition soit invisible.
export default function MentionsLegalesLoading() {
  return <LegalNoticePageSkeleton />;
}
