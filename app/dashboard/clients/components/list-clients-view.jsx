"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  ArrowLeft,
  Users,
  Loader2,
  ListMinus,
  ListPlus,
  ArrowRightLeft,
  MoreHorizontal,
  Trash2,
  CircleAlertIcon,
  UserPlus,
} from "lucide-react";
import {
  useClientsInList,
  useClientLists,
  useAddClientsToList,
  useRemoveClientsFromList,
} from "@/src/hooks/useClientLists";
import { useDeleteClient } from "@/src/hooks/useClients";
import { useClientCustomFields } from "@/src/hooks/useClientCustomFields";
import { usePersistentColumnVisibility } from "@/src/hooks/usePersistentColumnVisibility";
import { toast } from "@/src/components/ui/sonner";
import ClientsTable from "./clients-table";
import AddClientsToListDialog from "./add-clients-to-list-dialog";

export default function ListClientsView({
  workspaceId,
  list,
  onBack,
  onListUpdated,
  globalFilter = "",
}) {
  const { clients, totalItems, loading, refetch } = useClientsInList(
    workspaceId,
    list.id,
    1,
    1000,
  );
  const { lists: allLists } = useClientLists(workspaceId);
  const { addClients } = useAddClientsToList();
  const { removeClients } = useRemoveClientsFromList();
  const { deleteClient } = useDeleteClient();
  const { fields: customFieldDefinitions } = useClientCustomFields(workspaceId);

  const [selectedClients, setSelectedClients] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddClientsDialog, setShowAddClientsDialog] = useState(false);
  const [columnVisibility, setColumnVisibility] = usePersistentColumnVisibility(
    "newbi:column-visibility:list-clients",
    {
      phone: false,
      firstName: false,
      lastName: false,
      vatNumber: false,
      isInternational: false,
    },
  );

  useEffect(() => {
    if (!customFieldDefinitions || customFieldDefinitions.length === 0) return;
    setColumnVisibility((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const f of customFieldDefinitions) {
        const key = `cf_${f.id}`;
        if (!(key in next)) {
          next[key] = false;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [customFieldDefinitions, setColumnVisibility]);

  const selectedCount = selectedClients.size;
  const selectedIds = useMemo(
    () => Array.from(selectedClients),
    [selectedClients],
  );

  const otherLists = useMemo(
    () => (allLists || []).filter((l) => l.id !== list.id),
    [allLists, list.id],
  );

  const refreshAfterBulk = useCallback(async () => {
    setSelectedClients(new Set());
    await refetch?.();
    onListUpdated?.();
  }, [refetch, onListUpdated]);

  const handleBulkRemove = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await removeClients(workspaceId, list.id, selectedIds);
      toast.success(
        `${selectedIds.length} contact${selectedIds.length > 1 ? "s" : ""} retiré${selectedIds.length > 1 ? "s" : ""} de la liste`,
      );
      await refreshAfterBulk();
    } catch (error) {
      toast.error("Impossible de retirer les contacts de la liste");
    } finally {
      setBulkLoading(false);
    }
  }, [removeClients, workspaceId, list.id, selectedIds, refreshAfterBulk]);

  const handleBulkAddTo = useCallback(
    async (targetListId) => {
      if (selectedIds.length === 0) return;
      setBulkLoading(true);
      try {
        await addClients(workspaceId, targetListId, selectedIds);
        toast.success(
          `${selectedIds.length} contact${selectedIds.length > 1 ? "s" : ""} ajouté${selectedIds.length > 1 ? "s" : ""} à la liste`,
        );
        await refreshAfterBulk();
      } catch (error) {
        toast.error("Impossible d'ajouter les contacts à la liste");
      } finally {
        setBulkLoading(false);
      }
    },
    [addClients, workspaceId, selectedIds, refreshAfterBulk],
  );

  const handleBulkMoveTo = useCallback(
    async (targetListId) => {
      if (selectedIds.length === 0) return;
      setBulkLoading(true);
      try {
        await addClients(workspaceId, targetListId, selectedIds);
        await removeClients(workspaceId, list.id, selectedIds);
        toast.success(
          `${selectedIds.length} contact${selectedIds.length > 1 ? "s" : ""} déplacé${selectedIds.length > 1 ? "s" : ""}`,
        );
        await refreshAfterBulk();
      } catch (error) {
        toast.error("Impossible de déplacer les contacts");
      } finally {
        setBulkLoading(false);
      }
    },
    [
      addClients,
      removeClients,
      workspaceId,
      list.id,
      selectedIds,
      refreshAfterBulk,
    ],
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteClient(id)));
      toast.success(
        `${selectedIds.length} contact${selectedIds.length > 1 ? "s" : ""} supprimé${selectedIds.length > 1 ? "s" : ""}`,
      );
      setShowDeleteDialog(false);
      await refreshAfterBulk();
    } catch (error) {
      // toast handled by hook
    } finally {
      setBulkLoading(false);
    }
  }, [deleteClient, selectedIds, refreshAfterBulk]);

  const handleSingleRemove = useCallback(
    async (clientId) => {
      setSelectedClients((prev) => {
        if (!prev.has(clientId)) return prev;
        const next = new Set(prev);
        next.delete(clientId);
        return next;
      });
      await refetch?.();
      onListUpdated?.();
    },
    [refetch, onListUpdated],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header avec marges alignées sur "Gestion des contacts" */}
      <div className="px-4 sm:px-6 pt-4 pb-2 space-y-3 flex-shrink-0">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour aux listes
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: list.color }}
              />
              <h2 className="text-2xl font-medium">{list.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {totalItems} contact{totalItems !== 1 ? "s" : ""}
            </p>
          </div>

          {selectedCount === 0 && clients.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddClientsDialog(true)}
              className="gap-2 cursor-pointer flex-shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter des contacts
            </Button>
          )}

          {selectedCount > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-muted-foreground">
                {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
              </span>

              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkRemove}
                disabled={bulkLoading}
                className="gap-2 cursor-pointer"
              >
                <ListMinus className="w-4 h-4" />
                Retirer de la liste
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkLoading || otherLists.length === 0}
                    className="gap-2 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Changer de liste
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {otherLists.length === 0 ? (
                    <DropdownMenuItem disabled>
                      Aucune autre liste
                    </DropdownMenuItem>
                  ) : (
                    otherLists.map((l) => (
                      <DropdownMenuItem
                        key={l.id}
                        onClick={() => handleBulkMoveTo(l.id)}
                        disabled={bulkLoading}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: l.color }}
                          />
                          <span>{l.name}</span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkLoading}
                    className="gap-2 cursor-pointer"
                  >
                    <ListPlus className="w-4 h-4" />
                    Ajouter à une liste
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {otherLists.length === 0 ? (
                    <DropdownMenuItem disabled>
                      Aucune autre liste
                    </DropdownMenuItem>
                  ) : (
                    otherLists.map((l) => (
                      <DropdownMenuItem
                        key={l.id}
                        onClick={() => handleBulkAddTo(l.id)}
                        disabled={bulkLoading}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: l.color }}
                          />
                          <span>{l.name}</span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkLoading}
                    className="gap-2 cursor-pointer"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    Plus
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => setSelectedClients(new Set())}
                    className="cursor-pointer"
                  >
                    Désélectionner tout
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setShowDeleteDialog(true);
                    }}
                    className="cursor-pointer text-red-600 focus:text-red-600 gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer définitivement
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="flex flex-col flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 px-6 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-1">
              Aucun client dans cette liste
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Ajoutez des contacts existants pour commencer à organiser cette
              liste.
            </p>
            <Button
              variant="primary"
              onClick={() => setShowAddClientsDialog(true)}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter des contacts
            </Button>
          </div>
        ) : (
          <ClientsTable
            workspaceId={workspaceId}
            clients={clients}
            useProvidedClients={true}
            lists={[list]}
            onListsUpdated={onListUpdated}
            defaultListId={list.id}
            globalFilter={globalFilter}
            selectedClients={selectedClients}
            onSelectedClientsChange={setSelectedClients}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            currentList={{ id: list.id, name: list.name }}
            onClientRemovedFromList={handleSingleRemove}
          />
        )}
      </div>

      <AddClientsToListDialog
        open={showAddClientsDialog}
        onOpenChange={setShowAddClientsDialog}
        workspaceId={workspaceId}
        list={list}
        onClientsAdded={async () => {
          await refetch?.();
          onListUpdated?.();
        }}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <CircleAlertIcon className="opacity-80" size={16} />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. {selectedCount} contact
                {selectedCount > 1 ? "s" : ""} sera
                {selectedCount > 1 ? "ont" : ""} supprimé
                {selectedCount > 1 ? "s" : ""} définitivement.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkLoading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
