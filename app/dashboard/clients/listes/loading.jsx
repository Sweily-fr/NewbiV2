import { ListesPageSkeleton } from "./components/listes-page-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page listes.
// Réutilise le même composant que le fallback du ProRouteGuard et l'état de
// chargement interne pour que la transition soit invisible.
export default function ListesLoading() {
  return <ListesPageSkeleton />;
}
