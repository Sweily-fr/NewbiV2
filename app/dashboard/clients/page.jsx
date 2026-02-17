"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/src/components/ui/button-group";
import { Input } from "@/src/components/ui/input";
import { PermissionButton } from "@/src/components/rbac";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { Plus, Search, CircleXIcon, ListPlus, MoreHorizontal, Pencil, ShieldOff, UserCheck, MessageCircle, Trash2, CircleAlertIcon } from "lucide-react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useClientLists } from "@/src/hooks/useClientLists";
import { useAddClientToLists } from "@/src/hooks/useClientLists";
import { useDeleteClient } from "@/src/hooks/useClients";
import { toast } from "@/src/components/ui/sonner";
import ClientsTable from "./components/clients-table";
import ClientsModal from "./components/clients-modal";
import ClientFilters from "./components/client-filters";
import CustomFieldsPopover from "./components/custom-fields-popover";
import AutomationsPopover from "./components/automations-popover";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { cn } from "@/src/lib/utils";

function ClientsContent() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [editClientId, setEditClientId] = useState(null);
  const inputRef = useRef(null);

  const { workspaceId } = useWorkspace();
  const { lists, refetch: refetchLists } = useClientLists(workspaceId);
  const { addToLists } = useAddClientToLists();
  const { deleteClient } = useDeleteClient();
  const [assigningList, setAssigningList] = useState(false);

  const selectedClientIds = Array.from(selectedClients);

  const handleAddToList = useCallback(async (listId) => {
    if (selectedClients.size === 0) return;
    setAssigningList(true);
    try {
      for (const clientId of selectedClients) {
        await addToLists(workspaceId, clientId, [listId]);
      }
      toast.success(`${selectedClients.size} contact(s) ajouté(s) à la liste`);
      refetchLists?.();
    } catch (error) {
      toast.error("Impossible d'ajouter les contacts à la liste");
    } finally {
      setAssigningList(false);
    }
  }, [selectedClients, workspaceId, addToLists, refetchLists]);

  const handleDeleteSelected = useCallback(async () => {
    try {
      await Promise.all(
        Array.from(selectedClients).map((clientId) => deleteClient(clientId))
      );
      setSelectedClients(new Set());
      refetchLists?.();
    } catch (error) {
      // Error handled by hook
    }
  }, [selectedClients, deleteClient, refetchLists]);

  const handleCopyWhatsApp = useCallback(() => {
    // On récupère le premier client sélectionné pour copier le numéro
    toast.info("Fonctionnalité bientôt disponible");
  }, []);

  const handleBlock = useCallback(() => {
    toast.info("Fonctionnalité bientôt disponible");
  }, []);

  const handleAssign = useCallback(() => {
    toast.info("Fonctionnalité bientôt disponible");
  }, []);

  const handleOpenInviteDialog = () => {
    setDialogOpen(true);
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
          <div>
            <h1 className="text-2xl font-medium mb-0">Gestion des contacts</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Votre base de données clients. Consultez, organisez et gérez vos contacts.
            </p>
          </div>
          <div className="flex gap-2">
            <AutomationsPopover />
            <ButtonGroup>
              <Button
                onClick={handleOpenInviteDialog}
                className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Nouveau contact
              </Button>
              <ButtonGroupSeparator />
              <Button
                onClick={handleOpenInviteDialog}
                size="icon"
                className="cursor-pointer bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                <Plus size={16} aria-hidden="true" />
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="relative max-w-md">
            <Input
              ref={inputRef}
              className={cn(
                "w-full sm:w-[300px] ps-9",
                Boolean(globalFilter) && "pe-9"
              )}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Recherchez par nom, email ou SIRET..."
              type="text"
              aria-label="Filter by name or email"
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <Search size={16} aria-hidden="true" />
            </div>
            {Boolean(globalFilter) && (
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
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
          <div className="flex items-center gap-2">
            {selectedClients.size > 0 && (
              <>
                {/* Ajouter à une liste */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={assigningList}
                      className="gap-2 cursor-pointer font-normal"
                    >
                      <ListPlus className="w-4 h-4" />
                      Ajouter à une liste
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {lists && lists.length > 0 ? (
                      lists.map((list) => (
                        <DropdownMenuItem
                          key={list.id}
                          onClick={() => handleAddToList(list.id)}
                          disabled={assigningList}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: list.color }}
                            />
                            <span>{list.name}</span>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>Aucune liste</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Plus d'actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 cursor-pointer font-normal"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                      Plus d&apos;actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {selectedClients.size === 1 && (
                      <>
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 text-xs"
                          onClick={() => {
                            const clientId = Array.from(selectedClients)[0];
                            router.push(`/dashboard/clients/${clientId}`);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className="cursor-pointer gap-2 text-xs"
                      onClick={handleBlock}
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                      Bloquer le contact
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer gap-2 text-xs"
                      onClick={handleAssign}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Assigner
                    </DropdownMenuItem>
                    {selectedClients.size === 1 && (
                      <DropdownMenuItem
                        className="cursor-pointer gap-2 text-xs"
                        onClick={handleCopyWhatsApp}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Copier le numéro sur WhatsApp
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 text-xs text-red-600 focus:text-red-600"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer définitivement
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
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
                              Cette action est irréversible. {selectedClients.size}{" "}
                              contact{selectedClients.size > 1 ? "s" : ""} sera{selectedClients.size > 1 ? "ont" : ""} supprimé{selectedClients.size > 1 ? "s" : ""} définitivement.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteSelected}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <CustomFieldsPopover />
            <ClientFilters
              selectedTypes={selectedTypes}
              setSelectedTypes={setSelectedTypes}
            />
          </div>
        </div>

        {/* Table */}
        <ClientsTable
          workspaceId={workspaceId}
          lists={lists}
          onListsUpdated={refetchLists}
          globalFilter={globalFilter}
          selectedTypes={selectedTypes}
          hideSearchBar={true}
          selectedClients={selectedClients}
          onSelectedClientsChange={setSelectedClients}
        />
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="px-4 py-6">
          <div>
            <h1 className="text-2xl font-medium mb-2">Contacts</h1>
            <p className="text-muted-foreground text-sm">
              Gérez vos contacts et suivez vos interactions
            </p>
          </div>
        </div>

        <ClientsTable
          workspaceId={workspaceId}
          lists={lists}
          onListsUpdated={refetchLists}
          globalFilter={globalFilter}
          selectedTypes={selectedTypes}
          hideSearchBar={false}
          selectedClients={selectedClients}
          onSelectedClientsChange={setSelectedClients}
        />

        <PermissionButton
          resource="clients"
          action="create"
          onClick={handleOpenInviteDialog}
          className="fixed bottom-6 bg-[#5a50ff] right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
          size="icon"
          hideIfNoAccess={true}
          tooltipNoAccess="Vous n'avez pas la permission de créer des contacts"
        >
          <Plus className="h-6 w-6" />
        </PermissionButton>
      </div>

      <ClientsModal open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

export default function Clients() {
  return (
    <ProRouteGuard pageName="Clients">
      <ClientsContent />
    </ProRouteGuard>
  );
}
