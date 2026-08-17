import { DocumentsPageSkeleton } from "./components/documents-page-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page documents
// partagés. Réutilise le même composant que les états de chargement internes
// de la page pour que la transition soit invisible (pas de doublon de loader).
export default function DocumentsPartagesLoading() {
  return <DocumentsPageSkeleton />;
}
