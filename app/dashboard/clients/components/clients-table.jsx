'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAddClientToLists, useClientListsByClient, useRemoveClientFromLists } from '@/src/hooks/useClientLists';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/src/components/ui/dropdown-menu';
import { Plus, Loader2, X } from 'lucide-react';
import { toast } from '@/src/components/ui/sonner';
import TableUser from './table';
import ClientsModal from './clients-modal';

// Composant pour afficher les listes communes
function CommonListsDisplay({ workspaceId, selectedClientIds, onRemoveFromList, isRemoving }) {
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
  }, [selectedClientIds.length, selectedClientIds[0], selectedClientIds[1], selectedClientIds[2], firstClientLists, secondClientLists, thirdClientLists]);

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

export default function ClientsTable({ workspaceId, lists, onListsUpdated, clients: clientsProp, onSelectList, useProvidedClients = false, defaultListId = null }) {
  const [selectedClients, setSelectedClients] = useState(new Set());
  const { addToLists } = useAddClientToLists();
  const { removeFromLists } = useRemoveClientFromLists();
  const [assigningLists, setAssigningLists] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedClientIds = Array.from(selectedClients);

  const handleAddToList = async (listId) => {
    if (selectedClients.size === 0) {
      toast.error('Sélectionnez au moins un client');
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
      toast.error(error.message || 'Impossible d\'ajouter les clients à la liste');
    } finally {
      setAssigningLists(false);
    }
  };

  const handleRemoveFromList = async (listId) => {
    if (selectedClients.size === 0) {
      toast.error('Sélectionnez au moins un client');
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
      toast.error(error.message || 'Impossible de retirer les clients de la liste');
    } finally {
      setAssigningLists(false);
    }
  };

  return (
    <div className="space-y-4">
      {selectedClients.size > 0 && lists && lists.length > 0 && (
        <div className="flex flex-col gap-3 p-3 sm:p-4 bg-[rgba(91,80,255,0.05)] rounded-lg border border-[rgba(91,80,255,0.2)]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-normal">
              {selectedClients.size} contact{selectedClients.size !== 1 ? 's' : ''} sélectionné{selectedClients.size !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Afficher les listes communes */}
          <CommonListsDisplay
            workspaceId={workspaceId}
            selectedClientIds={selectedClientIds}
            onRemoveFromList={handleRemoveFromList}
            isRemoving={assigningLists}
          />

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={assigningLists}
                  className="gap-2 cursor-pointer font-normal"
                >
                  {assigningLists && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Plus className="w-4 h-4" />
                  Ajouter aux listes
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Ajouter à une liste</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {lists.map((list) => (
                  <DropdownMenuItem
                    key={list.id}
                    onClick={() => handleAddToList(list.id)}
                    disabled={assigningLists}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: list.color }}
                      />
                      <span>{list.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

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
            clientsToSelect.forEach(client => {
              newSelected.add(client.id);
            });
            setSelectedClients(newSelected);
          } else {
            // Désélectionner tous les clients fournis
            const newSelected = new Set(selectedClients);
            clientsToSelect.forEach(client => {
              newSelected.delete(client.id);
            });
            setSelectedClients(newSelected);
          }
        }}
        clients={clientsProp}
        useProvidedClients={useProvidedClients}
        onSelectList={onSelectList}
        workspaceId={workspaceId}
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
