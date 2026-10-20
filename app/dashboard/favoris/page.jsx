"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { Star } from "lucide-react";
import { GET_BOARDS_NAV } from "@/src/graphql/kanbanQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";

// Favoris : les tableaux Kanban marqués d'une étoile (même liste que le menu)
export default function Favoris() {
  const { workspaceId } = useWorkspace();
  const { can, isReady } = useMyPermissions();
  const canReadKanban = !isReady || can("kanban", "read");
  const { data, loading } = useQuery(GET_BOARDS_NAV, {
    variables: { workspaceId },
    skip: !workspaceId || !canReadKanban,
    fetchPolicy: "cache-and-network",
  });
  const favoris = (data?.boards || []).filter((board) => board.isFavorite);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <h1 className="text-2xl font-semibold mb-6">Favoris</h1>
      <p className="text-sm text-muted-foreground">
        Les tableaux Kanban marqués d&apos;une étoile apparaissent ici.
      </p>
      {favoris.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {favoris.map((board) => (
            <li key={board.id}>
              <Link
                href={`/dashboard/outils/kanban/${board.id}`}
                className="inline-flex items-center gap-2 text-sm hover:underline"
              >
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                {board.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        !loading && (
          <p className="text-sm text-muted-foreground">
            Aucun favori pour l&apos;instant : ouvrez un tableau Kanban et
            cliquez sur l&apos;étoile à côté de son nom.
          </p>
        )
      )}
    </div>
  );
}
