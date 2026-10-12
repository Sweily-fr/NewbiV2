"use client";

import { usePathname } from "next/navigation";
import { KanbanListPageSkeleton } from "./components/kanban-list-skeleton";
import {
  KanbanPageSkeleton,
  getBoardIdFromPathname,
} from "./[id]/components/KanbanPageSkeleton";

// Skeleton affiché pendant le chargement du chunk de la page liste kanban.
// Réutilise le même composant que le loadingComponent du RoleRouteGuard et
// l'état de chargement de la page pour que la transition soit invisible.
//
// Cette boundary englobe aussi /kanban/[id] : quand on arrive sur un tableau
// depuis une autre section, c'est elle qui s'affiche en premier. On y rend
// alors le skeleton du tableau, pas celui de la liste des tableaux.
export default function KanbanLoading() {
  const pathname = usePathname();
  if (getBoardIdFromPathname(pathname)) return <KanbanPageSkeleton />;
  return <KanbanListPageSkeleton />;
}
