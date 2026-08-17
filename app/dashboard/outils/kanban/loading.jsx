import { KanbanListPageSkeleton } from "./components/kanban-list-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page liste kanban.
// Réutilise le même composant que le loadingComponent du RoleRouteGuard et
// l'état de chargement de la page pour que la transition soit invisible.
export default function KanbanLoading() {
  return <KanbanListPageSkeleton />;
}
