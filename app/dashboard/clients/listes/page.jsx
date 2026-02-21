"use client";

import { useState, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Plus, Search, CircleXIcon } from "lucide-react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useClientLists } from "@/src/hooks/useClientLists";
import { Loader2 } from "lucide-react";
import ClientListsView from "../components/client-lists-view";
import CreateListDialog from "../components/create-list-dialog";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { cn } from "@/src/lib/utils";

function ListesContent() {
  const { workspaceId } = useWorkspace();
  const {
    lists,
    loading: listsLoading,
    refetch: refetchLists,
  } = useClientLists(workspaceId);
  const [createListDialogOpen, setCreateListDialogOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [viewingList, setViewingList] = useState(false);
  const inputRef = useRef(null);

  if (!workspaceId || listsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header + Search - cachés quand on consulte les clients d'une liste */}
      {!viewingList && (
        <>
          <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
            <div>
              <h1 className="text-2xl font-medium mb-0">Gestion des listes</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Organisez vos contacts par catégories ou segments.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setCreateListDialogOpen(true)}
              className="self-start"
            >
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              Nouvelle liste
            </Button>
          </div>

          <div className="flex items-center gap-3 px-4 sm:px-6 py-4 flex-shrink-0">
            <div className="relative max-w-md">
              <Input
                ref={inputRef}
                className={cn(
                  "w-full sm:w-[300px] ps-9",
                  Boolean(globalFilter) && "pe-9"
                )}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Rechercher une liste..."
                type="text"
                aria-label="Rechercher une liste"
              />
              <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                <Search size={16} aria-hidden="true" />
              </div>
              {Boolean(globalFilter) && (
                <button
                  className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Effacer le filtre"
                  onClick={() => {
                    setGlobalFilter("");
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                >
                  <CircleXIcon size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Lists view */}
      <ClientListsView
        workspaceId={workspaceId}
        lists={lists}
        onListsUpdated={refetchLists}
        globalFilter={globalFilter}
        onCreateList={() => setCreateListDialogOpen(true)}
        onViewingListChange={setViewingList}
      />

      <CreateListDialog
        open={createListDialogOpen}
        onOpenChange={setCreateListDialogOpen}
        workspaceId={workspaceId}
        onListCreated={refetchLists}
      />
    </div>
  );
}

export default function ListesPage() {
  return (
    <ProRouteGuard pageName="Clients">
      <ListesContent />
    </ProRouteGuard>
  );
}
