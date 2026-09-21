import { DeliveryNotePageSkeleton } from "./components/delivery-note-page-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page bons de livraison.
// Même composant que le fallback du ProRouteGuard : transition invisible.
export default function DeliveryNotesLoading() {
  return <DeliveryNotePageSkeleton />;
}
