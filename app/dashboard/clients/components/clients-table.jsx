"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useAddClientToLists,
  useClientListsByClient,
  useRemoveClientFromLists,
} from "@/src/hooks/useClientLists";
import { useDeleteClient } from "@/src/hooks/useClients";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/src/components/ui/dropdown-menu";
import { Plus, Loader2, X, FileText, Download } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import TableUser from "./table";
import ClientsModal from "./clients-modal";

// Composant pour afficher les listes communes
function CommonListsDisplay({
  workspaceId,
  selectedClientIds,
  onRemoveFromList,
  isRemoving,
}) {
  // Récupérer les listes pour le premier client
  const { lists: firstClientLists } = useClientListsByClient(
    workspaceId,
    selectedClientIds[0] || null
  );

  // Récupérer les listes pour le deuxième client (si existe)
  const { lists: secondClientLists } = useClientListsByClient(
    workspaceId,
    selectedClientIds[1] || null
  );

  // Récupérer les listes pour le troisième client (si existe)
  const { lists: thirdClientLists } = useClientListsByClient(
    workspaceId,
    selectedClientIds[2] || null
  );

  // Calculer les listes communes avec useMemo
  const commonLists = useMemo(() => {
    if (selectedClientIds.length === 0) {
      return [];
    }

    if (selectedClientIds.length === 1) {
      return firstClientLists || [];
    }

    // Pour plusieurs clients, trouver les listes communes
    const allClientLists = [firstClientLists || []];
    if (selectedClientIds[1]) allClientLists.push(secondClientLists || []);
    if (selectedClientIds[2]) allClientLists.push(thirdClientLists || []);

    return (firstClientLists || []).filter((list) =>
      allClientLists.every((clientLists) =>
        clientLists.some((l) => l.id === list.id)
      )
    );
  }, [
    selectedClientIds.length,
    selectedClientIds[0],
    selectedClientIds[1],
    selectedClientIds[2],
    firstClientLists,
    secondClientLists,
    thirdClientLists,
  ]);

  if (commonLists.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {commonLists.map((list) => (
        <Badge
          key={list.id}
          variant="outline"
          className="flex items-center rounded-md gap-2 px-2 sm:px-3 py-1.5 cursor-default bg-background text-xs sm:text-sm"
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: list.color }}
          />
          <span className="font-normal">{list.name}</span>
          <button
            onClick={() => onRemoveFromList(list.id)}
            disabled={isRemoving}
            className="ml-1 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
            title="Retirer de cette liste"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

export default function ClientsTable({
  workspaceId,
  lists,
  onListsUpdated,
  clients: clientsProp,
  onSelectList,
  useProvidedClients = false,
  defaultListId = null,
  globalFilter = "",
  selectedTypes = [],
  selectedList = null,
  hideSearchBar = false,
  selectedClients: externalSelectedClients,
  onSelectedClientsChange,
}) {
  const router = useRouter();
  const [internalSelectedClients, setInternalSelectedClients] = useState(new Set());
  const selectedClients = externalSelectedClients || internalSelectedClients;
  const setSelectedClients = onSelectedClientsChange || setInternalSelectedClients;
  const { addToLists } = useAddClientToLists();
  const { removeFromLists } = useRemoveClientFromLists();
  const { deleteClient } = useDeleteClient();
  const [assigningLists, setAssigningLists] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedClientIds = Array.from(selectedClients);

  const handleAddToList = async (listId) => {
    if (selectedClients.size === 0) {
      toast.error("Sélectionnez au moins un client");
      return;
    }

    setAssigningLists(true);
    try {
      for (const clientId of selectedClients) {
        await addToLists(workspaceId, clientId, [listId]);
      }

      toast.success(`${selectedClients.size} client(s) ajouté(s) à la liste`);

      // Ne pas fermer la sélection, juste rafraîchir les données
      onListsUpdated?.();
    } catch (error) {
      toast.error(
        error.message || "Impossible d'ajouter les clients à la liste"
      );
    } finally {
      setAssigningLists(false);
    }
  };

  const handleCreateInvoice = useCallback(() => {
    if (selectedClients.size !== 1) return;
    const clientId = Array.from(selectedClients)[0];
    router.push(`/dashboard/outils/factures/new?clientId=${clientId}`);
  }, [selectedClients, router]);

  const handleExportCSV = useCallback(() => {
    if (selectedClients.size === 0 || !clientsProp) return;
    const selectedData = (clientsProp || []).filter((c) =>
      selectedClients.has(c.id)
    );
    const headers = ["Nom", "Email", "Type", "Téléphone", "Ville", "Pays", "SIRET"];
    const rows = selectedData.map((c) => [
      c.name || "",
      c.email || "",
      c.type === "COMPANY" ? "Entreprise" : "Particulier",
      c.phone || "",
      c.address?.city || "",
      c.address?.country || "",
      c.siret || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${selectedData.length} contact(s) exporté(s)`);
  }, [selectedClients, clientsProp]);

  const handleDeleteSelected = useCallback(async () => {
    try {
      await Promise.all(
        Array.from(selectedClients).map((clientId) => deleteClient(clientId))
      );
      setSelectedClients(new Set());
      onListsUpdated?.();
    } catch (error) {
      // Error handled by hook
    }
  }, [selectedClients, deleteClient, onListsUpdated]);

  const handleRemoveFromList = async (listId) => {
    if (selectedClients.size === 0) {
      toast.error("Sélectionnez au moins un client");
      return;
    }

    setAssigningLists(true);
    try {
      for (const clientId of selectedClients) {
        await removeFromLists(workspaceId, clientId, [listId]);
      }

      toast.success(`${selectedClients.size} client(s) retiré(s) de la liste`);

      // Ne pas fermer la sélection, juste rafraîchir les données
      onListsUpdated?.();
    } catch (error) {
      toast.error(
        error.message || "Impossible de retirer les clients de la liste"
      );
    } finally {
      setAssigningLists(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TableUser
        handleAddUser={() => setIsModalOpen(true)}
        selectedClients={selectedClients}
        onSelectClient={(clientId) => {
          const newSelected = new Set(selectedClients);
          if (newSelected.has(clientId)) {
            newSelected.delete(clientId);
          } else {
            newSelected.add(clientId);
          }
          setSelectedClients(newSelected);
        }}
        onSelectAll={(checked, clientsToSelect) => {
          if (checked) {
            // Sélectionner tous les clients fournis
            const newSelected = new Set(selectedClients);
            clientsToSelect.forEach((client) => {
              newSelected.add(client.id);
            });
            setSelectedClients(newSelected);
          } else {
            // Désélectionner tous les clients fournis
            const newSelected = new Set(selectedClients);
            clientsToSelect.forEach((client) => {
              newSelected.delete(client.id);
            });
            setSelectedClients(newSelected);
          }
        }}
        clients={clientsProp}
        useProvidedClients={useProvidedClients}
        onSelectList={onSelectList}
        workspaceId={workspaceId}
        externalGlobalFilter={globalFilter}
        externalSelectedTypes={selectedTypes}
        selectedList={selectedList}
        hideSearchBar={hideSearchBar}
      />

      <ClientsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={() => {
          setIsModalOpen(false);
          onListsUpdated?.();
        }}
        defaultListId={defaultListId}
        workspaceId={workspaceId}
      />
    </div>
  );
}
