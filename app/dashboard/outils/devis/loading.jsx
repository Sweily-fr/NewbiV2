import { QuotePageSkeleton } from "./components/quote-page-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page devis.
// Réutilise le même composant que le fallback du ProRouteGuard pour que la
// transition soit invisible (pas de doublon de loader).
export default function QuotesLoading() {
  return <QuotePageSkeleton />;
}
