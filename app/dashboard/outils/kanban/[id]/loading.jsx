import { KanbanPageSkeleton } from "./components/KanbanPageSkeleton";

// Affiché pendant le chargement du chunk du board : même skeleton que celui
// que la page rend ensuite pendant ses requêtes, la transition est invisible.
export default function KanbanBoardLoading() {
  return <KanbanPageSkeleton />;
}
