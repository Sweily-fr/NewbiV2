"use client";

import { useState, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { Input } from "@/src/components/ui/input";
import {
  Plus,
  Search,
  CircleXIcon,
  Trash2,
  Loader2,
  LoaderCircle,
} from "lucide-react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  useClientLists,
  useDeleteClientLists,
} from "@/src/hooks/useClientLists";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import ClientListsView from "../components/client-lists-view";
import CreateListDialog from "../components/create-list-dialog";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { cn } from "@/src/lib/utils";

function ListesContent() {
  const { isReadOnly, isOwner } = useSubscriptionAccess();
  const readOnlyTooltip = isReadOnly
    ? isOwner
      ? "Mode lecture seule · Renouvelez votre abonnement"
      : "Mode lecture seule · Contactez l'administrateur"
    : undefined;
  const { workspaceId } = useWorkspace();
  const searchParams = useSearchParams();
  const listIdFromUrl = searchParams.get("listId");
  const {
    lists,
    loading: listsLoading,
    refetch: refetchLists,
  } = useClientLists(workspaceId);
  const { deleteLists } = useDeleteClientLists();
  const [createListDialogOpen, setCreateListDialogOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [viewingList, setViewingList] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [isDeleteMultipleOpen, setIsDeleteMultipleOpen] = useState(false);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  const inputRef = useRef(null);

  const defaultListIds = useMemo(
    () => new Set((lists || []).filter((l) => l.isDefault).map((l) => l.id)),
    [lists],
  );

  const selectedListIds = useMemo(
    () =>
      Object.keys(rowSelection).filter(
        (id) => rowSelection[id] && !defaultListIds.has(id),
      ),
    [rowSelection, defaultListIds],
  );

  // Trouver la liste initiale à partir du query param
  const initialSelectedList = useMemo(() => {
    if (listIdFromUrl && lists) {
      return lists.find((l) => l.id === listIdFromUrl) || null;
    }
    return null;
  }, [listIdFromUrl, lists]);

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
              disabled={isReadOnly}
              title={readOnlyTooltip}
            >
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              Nouvelle liste
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0">
            <div className="relative max-w-md">
              <Input
                ref={inputRef}
                className={cn(
                  "w-full sm:w-[300px] ps-9",
                  Boolean(globalFilter) && "pe-9",
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

            {selectedListIds.length > 0 && (
              <AlertDialog
                open={isDeleteMultipleOpen}
                onOpenChange={setIsDeleteMultipleOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer ({selectedListIds.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer les listes</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir supprimer{" "}
                      {selectedListIds.length} liste(s) ? Cette action est
                      irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        setIsDeletingMultiple(true);
                        try {
                          await deleteLists(workspaceId, selectedListIds);
                          setRowSelection({});
                          refetchLists?.();
                        } catch (err) {
                          console.error("Erreur suppression multiple:", err);
                        } finally {
                          setIsDeletingMultiple(false);
                          setIsDeleteMultipleOpen(false);
                        }
                      }}
                      className="bg-destructive text-white hover:bg-destructive/90"
                      disabled={isDeletingMultiple}
                    >
                      {isDeletingMultiple ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Suppression...
                        </>
                      ) : (
                        "Supprimer définitivement"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </>
      )}

      {/* Lists view */}
      <ClientListsView
        workspaceId={workspaceId}
        lists={lists}
        onListsUpdated={refetchLists}
        selectedList={initialSelectedList}
        globalFilter={globalFilter}
        onCreateList={() => setCreateListDialogOpen(true)}
        onViewingListChange={setViewingList}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
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
