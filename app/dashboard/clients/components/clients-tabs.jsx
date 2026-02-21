"use client";

import { useState, useMemo, useRef } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { useClientLists } from "@/src/hooks/useClientLists";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useClients } from "@/src/hooks/useClients";
import ClientsTable from "./clients-table";
import ClientListsView from "./client-lists-view";
import ListClientsView from "./list-clients-view";
import CreateListDialog from "./create-list-dialog";
import ClientFilters from "./client-filters";
import CustomFieldsPopover from "./custom-fields-popover";
import { Loader2, Search, CircleXIcon } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";

export default function ClientsTabs({ activeTab, onTabChange, createListDialogOpen, onCreateListDialogChange }) {
  const { workspaceId } = useWorkspace();
  const {
    lists,
    loading: listsLoading,
    refetch: refetchLists,
  } = useClientLists(workspaceId);
  const { clients, loading: clientsLoading } = useClients(1, 1000);
  const [selectedList, setSelectedList] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const inputRef = useRef(null);

  // Compter les clients par type
  const clientCounts = useMemo(() => {
    const counts = {
      all: (clients || []).length,
      lists: (lists || []).length,
    };
    return counts;
  }, [clients, lists]);

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-96">Chargement...</div>
    );
  }

  const handleSelectList = (list) => {
    setSelectedList(list);
    // Rester sur l'onglet "lists" pour afficher la vue de détail de la liste
    onTabChange("lists");
  };

  // Réinitialiser selectedList quand on clique sur "Mes listes"
  const handleTabChange = (value) => {
    if (value === "lists") {
      setSelectedList(null);
    }
    setGlobalFilter("");
    onTabChange(value);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="flex flex-col flex-1 min-h-0"
    >
      {/* Search and Filters - Au dessus des tabs */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0">
        {/* Search */}
        <div className="relative max-w-md">
          <Input
            ref={inputRef}
            className={cn(
              "w-full sm:w-[300px] ps-9",
              Boolean(globalFilter) && "pe-9"
            )}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={activeTab === "lists" ? (selectedList ? "Rechercher un contact..." : "Rechercher une liste...") : "Recherchez par nom, email ou SIRET..."}
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

        {/* Actions à droite */}
        {activeTab === "all" && (
          <div className="flex items-center gap-2">
            <CustomFieldsPopover />
            <ClientFilters
              selectedTypes={selectedTypes}
              setSelectedTypes={setSelectedTypes}
            />
          </div>
        )}
      </div>

      {/* Tabs de filtre rapide - Style factures */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
        <TabsList className="h-auto rounded-none bg-transparent p-0 w-full justify-start px-4 sm:px-6">
          <TabsTrigger
            value="all"
            className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-normal cursor-pointer"
          >
            Tous les contacts
            <span className="ml-2 text-xs text-muted-foreground">
              {clientCounts.all}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="lists"
            className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-normal cursor-pointer"
          >
            Mes listes
            <span className="ml-2 text-xs text-muted-foreground">
              {clientCounts.lists}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="all"
        className="flex flex-col flex-1 min-h-0 mt-0 data-[state=inactive]:hidden"
      >
        <ClientsTable
          workspaceId={workspaceId}
          lists={lists}
          onListsUpdated={refetchLists}
          onSelectList={handleSelectList}
          globalFilter={globalFilter}
          selectedTypes={selectedTypes}
          hideSearchBar={true}
        />
      </TabsContent>

      <TabsContent
        value="lists"
        className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden"
      >
        {listsLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : selectedList ? (
          <ListClientsView
            workspaceId={workspaceId}
            list={selectedList}
            onBack={() => setSelectedList(null)}
            onListUpdated={refetchLists}
            globalFilter={globalFilter}
          />
        ) : (
          <ClientListsView
            workspaceId={workspaceId}
            lists={lists}
            onListsUpdated={refetchLists}
            selectedList={selectedList}
            onSelectListChange={handleSelectList}
            globalFilter={globalFilter}
            onCreateList={() => onCreateListDialogChange(true)}
          />
        )}
      </TabsContent>

      <CreateListDialog
        open={createListDialogOpen}
        onOpenChange={onCreateListDialogChange}
        workspaceId={workspaceId}
        onListCreated={refetchLists}
      />
    </Tabs>
  );
}
