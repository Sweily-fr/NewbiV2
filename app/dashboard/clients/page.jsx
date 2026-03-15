"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
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
import { Plus, Search, CircleXIcon, ListPlus, MoreHorizontal, Pencil, ShieldOff, UserCheck, Trash2, CircleAlertIcon, Upload, Settings2 } from "lucide-react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useClientLists } from "@/src/hooks/useClientLists";
import { useAddClientToLists } from "@/src/hooks/useClientLists";
import { useDeleteClient, useBlockClient } from "@/src/hooks/useClients";
import { useClientCustomFields } from "@/src/hooks/useClientCustomFields";
import { toast } from "@/src/components/ui/sonner";
import ClientsTable from "./components/clients-table";
import ClientsModal from "./components/clients-modal";
import ClientFilters from "./components/client-filters";
import CustomFieldsManager from "./components/custom-fields-manager";
import AutomationsPopover from "./components/automations-popover";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import ClientImportDialog from "./components/client-import-dialog";

const STANDARD_COLUMNS = [
  { id: "email", label: "Email" },
  { id: "type", label: "Type" },
  { id: "invoiceCount", label: "Factures" },
  { id: "address", label: "Adresse" },
  { id: "phone", label: "Téléphone" },
  { id: "firstName", label: "Prénom" },
  { id: "lastName", label: "Nom de famille" },
  { id: "siret", label: "SIRET" },
  { id: "vatNumber", label: "N° TVA" },
  { id: "isInternational", label: "International" },
];

function ClientsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [editClientId, setEditClientId] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [customFieldsOpen, setCustomFieldsOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    phone: false,
    firstName: false,
    lastName: false,
    vatNumber: false,
    isInternational: false,
  });
  const inputRef = useRef(null);

  const { workspaceId } = useWorkspace();
  const { fields: customFieldDefinitions } = useClientCustomFields(workspaceId);

  // Ouvrir automatiquement le modal si ?new=true dans l'URL
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setDialogOpen(true);
      router.replace("/dashboard/clients", { scroll: false });
    }
  }, [searchParams, router]);

  const allToggleableColumns = useMemo(() => {
    const cfCols = (customFieldDefinitions || []).map((f) => ({
      id: `cf_${f.id}`,
      label: f.name,
    }));
    return [...STANDARD_COLUMNS, ...cfCols];
  }, [customFieldDefinitions]);

  // Hide custom fields by default (unless user already toggled them on)
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
  }, [customFieldDefinitions]);
  const { lists, refetch: refetchLists } = useClientLists(workspaceId);
  const { addToLists } = useAddClientToLists();
  const { deleteClient } = useDeleteClient();
  const { blockClient } = useBlockClient();
  const [assigningList, setAssigningList] = useState(false);
  const [hovered, setHovered] = useState(false);

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

  const handleBlock = useCallback(async () => {
    if (selectedClients.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedClients).map((clientId) => blockClient(clientId))
      );
      setSelectedClients(new Set());
    } catch {
      // Error handled by hook
    }
  }, [selectedClients, blockClient]);

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
            {/* <p className="text-muted-foreground text-sm mt-1">
              Votre base de données clients. Consultez, organisez et gérez vos contacts.
            </p> */}
          </div>
          <div className="flex gap-2">
            <AutomationsPopover />
            <Button
              variant="outline"
              onClick={() => setCustomFieldsOpen(true)}
              className="self-start"
            >
              <Settings2 size={14} strokeWidth={2} aria-hidden="true" />
              Champs
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              className="self-start"
            >
              <Upload size={14} strokeWidth={2} aria-hidden="true" />
              Importer
            </Button>
            <Button
              variant="primary"
              onClick={handleOpenInviteDialog}
              className="self-start"
            >
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              Nouveau contact
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 h-8 w-full sm:w-[300px] rounded-[9px] border border-[#E6E7EA] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
              <Search size={16} className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
              <Input
                variant="ghost"
                ref={inputRef}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Recherchez par nom, email ou SIRET..."
                aria-label="Filter by name or email"
              />
              {Boolean(globalFilter) && (
                <button
                  className="text-muted-foreground/80 hover:text-foreground cursor-pointer shrink-0 transition-colors outline-none"
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
            <ClientFilters
              selectedTypes={selectedTypes}
              setSelectedTypes={setSelectedTypes}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
              allColumns={allToggleableColumns}
              customFieldNames={Object.fromEntries(
                (customFieldDefinitions || []).map((f) => [`cf_${f.id}`, f.name])
              )}
            />
          </div>
          {selectedClients.size > 0 && (
            <div className="flex items-center gap-2">
              {/* Ajouter à une liste */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={assigningList}
                    className="gap-2 cursor-pointer"
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
                    className="gap-2 cursor-pointer"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    Plus d&apos;actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  {selectedClients.size === 1 && (
                    <>
                      <DropdownMenuItem
                        className="cursor-pointer gap-2 text-sm"
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="cursor-pointer gap-2 text-sm"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <ShieldOff className="w-3.5 h-3.5" />
                        Bloquer {selectedClients.size > 1 ? "les contacts" : "le contact"}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                        <div
                          className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                          aria-hidden="true"
                        >
                          <ShieldOff className="opacity-80" size={16} />
                        </div>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Bloquer {selectedClients.size > 1 ? "les contacts" : "le contact"} ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {selectedClients.size > 1
                              ? `${selectedClients.size} contacts seront bloqués. Ils seront exclus de la création de documents et des communications.`
                              : "Ce contact sera bloqué. Il sera exclu de la création de documents et des communications."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleBlock}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Bloquer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 text-sm"
                    onClick={handleAssign}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Assigner
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="cursor-pointer gap-2 text-sm text-red-600 focus:text-red-600"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
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
            </div>
          )}
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
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
        />
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium mb-1">Contacts</h1>
            </div>
            <div className="flex gap-2">
              <PermissionButton
                resource="clients"
                action="create"
                onClick={handleOpenInviteDialog}
                size="icon"
                className="cursor-pointer rounded-full bg-[#0A0A0A] text-white hover:bg-[#0A0A0A]/90"
                hideIfNoAccess={true}
                tooltipNoAccess="Vous n'avez pas la permission de créer des contacts"
              >
                <Plus className="h-5 w-5" />
              </PermissionButton>
            </div>
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
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
        />
      </div>

      <ClientsModal open={dialogOpen} onOpenChange={setDialogOpen} />
      <ClientImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      <CustomFieldsManager open={customFieldsOpen} onOpenChange={setCustomFieldsOpen} />
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
