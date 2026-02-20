"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/src/hooks/usePermissions";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  CircleXIcon,
  Columns3Icon,
  EllipsisIcon,
  FilterIcon,
  ListFilterIcon,
  PlusIcon,
  Search,
  TrashIcon,
  Upload,
  FileUp,
} from "lucide-react";

import { cn } from "@/src/lib/utils";
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
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Label } from "@/src/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/src/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";

import { useInvoices } from "@/src/graphql/invoiceQueries";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from "@/src/graphql/invoiceQueries";
import { useInvoiceReminderSettings } from "@/src/graphql/invoiceReminderQueries";
import { useInvoiceTable } from "../hooks/use-invoice-table";
import InvoiceRowActions from "./invoice-row-actions";
import { Skeleton } from "@/src/components/ui/skeleton";
import InvoiceFilters from "./invoice-filters";
import InvoiceSidebar from "./invoice-sidebar";
import { ImportInvoiceModal } from "./import-invoice-modal";
import { ImportedInvoiceSidebar } from "./imported-invoice-sidebar";
import {
  useImportedInvoices,
  IMPORTED_INVOICE_STATUS_LABELS,
  IMPORTED_INVOICE_STATUS_COLORS,
} from "@/src/graphql/importedInvoiceQueries";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";

export default function InvoiceTable({
  handleNewInvoice,
  invoiceIdToOpen,
  onOpenReminderSettings,
  triggerImport,
  onImportTriggered,
}) {
  const router = useRouter();
  const inputRef = useRef(null);
  const { invoices, loading, error, refetch } = useInvoices();
  const { canCreate } = usePermissions();
  const [canCreateInvoice, setCanCreateInvoice] = useState(false);
  const [invoiceToOpen, setInvoiceToOpen] = useState(null);

  // États pour les factures importées
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportedInvoice, setSelectedImportedInvoice] = useState(null);
  const { workspaceId } = useRequiredWorkspace();

  // Hook pour les factures importées
  const {
    importedInvoices,
    loading: importedLoading,
    refetch: refetchImported,
  } = useImportedInvoices(workspaceId);

  // Récupérer les paramètres de relance automatique
  const { data: reminderSettingsData } = useInvoiceReminderSettings();
  const reminderEnabled =
    reminderSettingsData?.getInvoiceReminderSettings?.enabled || false;
  const excludedClientIds =
    reminderSettingsData?.getInvoiceReminderSettings?.excludedClientIds || [];


  // Réagir aux triggers depuis le header
  useEffect(() => {
    if (triggerImport) {
      setIsImportModalOpen(true);
      onImportTriggered?.();
    }
  }, [triggerImport, onImportTriggered]);

  // Combiner les factures normales et importées
  const combinedInvoices = useMemo(() => {
    const normalInvoices = (invoices || []).map((inv) => ({
      ...inv,
      _type: "normal",
    }));

    const imported = (importedInvoices || []).map((inv) => ({
      ...inv,
      _type: "imported",
      // Mapper les champs pour compatibilité avec le tableau
      client: { name: inv.client?.name || inv.vendor?.name || "Client inconnu" },
      issueDate: inv.invoiceDate,
      dueDate: null,
      total: inv.totalTTC,
    }));

    // Combiner et trier par date (plus récent en premier)
    return [...normalInvoices, ...imported].sort((a, b) => {
      const dateA = new Date(a.issueDate || a.createdAt || 0);
      const dateB = new Date(b.issueDate || b.createdAt || 0);
      return dateB - dateA;
    });
  }, [invoices, importedInvoices]);

  const {
    table,
    globalFilter,
    setGlobalFilter,
    statusFilter,
    setStatusFilter,
    clientFilter,
    setClientFilter,
    dateFilter,
    setDateFilter,
    selectedRows,
    handleDeleteSelected,
    isDeleting,
  } = useInvoiceTable({
    data: combinedInvoices,
    onRefetch: refetch,
    onRefetchImported: refetchImported,
    reminderEnabled,
    onOpenReminderSettings,
    excludedClientIds,
    onOpenSidebar: setInvoiceToOpen, // Passer la fonction pour ouvrir la sidebar au niveau du tableau
  });

  // État pour les tabs de filtre rapide
  const [activeTab, setActiveTab] = useState("all");

  // Gérer le changement de tab
  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "all") {
      setStatusFilter([]);
    } else if (value === "draft") {
      setStatusFilter(["DRAFT"]);
    } else if (value === "pending") {
      setStatusFilter(["PENDING"]);
    } else if (value === "completed") {
      setStatusFilter(["COMPLETED"]);
    }
  };

  // Compter les factures par statut
  const invoiceCounts = useMemo(() => {
    const counts = {
      all: combinedInvoices.length,
      draft: 0,
      pending: 0,
      completed: 0,
    };
    combinedInvoices.forEach((inv) => {
      if (inv.status === "DRAFT") counts.draft++;
      else if (inv.status === "PENDING") counts.pending++;
      else if (inv.status === "COMPLETED") counts.completed++;
    });
    return counts;
  }, [combinedInvoices]);

  // --- Mobile responsive state ---
  const [isMobileScrolled, setIsMobileScrolled] = useState(false);
  const [visibleMobileCount, setVisibleMobileCount] = useState(20);
  const [isLoadingMoreMobile, setIsLoadingMoreMobile] = useState(false);
  const [isMobileTransitioning, setIsMobileTransitioning] = useState(false);
  const mobileScrollRef = useRef(null);
  const mobileSentinelRef = useRef(null);
  const prevMobileTabRef = useRef(activeTab);

  const mobileTabs = [
    { id: "all", label: "Toutes" },
    { id: "draft", label: "Brouillons" },
    { id: "pending", label: "À encaisser" },
    { id: "completed", label: "Terminées" },
  ];

  // All rows for mobile infinite scroll (bypasses pagination)
  const allMobileRows = table.getPrePaginationRowModel().rows;
  const visibleMobileRows = allMobileRows.slice(0, visibleMobileCount);
  const hasMoreMobile = visibleMobileCount < allMobileRows.length;

  // Reset visible count when filtered data changes
  useEffect(() => {
    setVisibleMobileCount(20);
  }, [allMobileRows.length]);

  // Tab change: scroll to top + fade transition
  useEffect(() => {
    if (prevMobileTabRef.current !== activeTab) {
      prevMobileTabRef.current = activeTab;
      setIsMobileTransitioning(true);
      if (mobileScrollRef.current) {
        mobileScrollRef.current.scrollTop = 0;
        setIsMobileScrolled(false);
      }
      const timer = setTimeout(() => setIsMobileTransitioning(false), 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Infinite scroll: load more rows
  const loadMoreMobile = useCallback(() => {
    if (!hasMoreMobile || isLoadingMoreMobile) return;
    setIsLoadingMoreMobile(true);
    setTimeout(() => {
      setVisibleMobileCount((prev) => Math.min(prev + 20, allMobileRows.length));
      setIsLoadingMoreMobile(false);
    }, 300);
  }, [hasMoreMobile, isLoadingMoreMobile, allMobileRows.length]);

  // IntersectionObserver for infinite scroll sentinel
  useEffect(() => {
    const sentinel = mobileSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreMobile(); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreMobile]);

  // Scroll detection for toolbar shadow
  const handleMobileScroll = useCallback((e) => {
    setIsMobileScrolled(e.target.scrollTop > 0);
  }, []);

  // Vérifier les permissions de création
  useEffect(() => {
    const checkPermission = async () => {
      const allowed = await canCreate("invoices");
      setCanCreateInvoice(allowed);
    };
    checkPermission();
  }, [canCreate]);

  // Ouvrir automatiquement la sidebar si un ID est fourni
  useEffect(() => {
    if (invoiceIdToOpen && invoices && invoices.length > 0) {
      const invoice = invoices.find((inv) => inv.id === invoiceIdToOpen);
      if (invoice) {
        setInvoiceToOpen(invoice);
      }
    }
  }, [invoiceIdToOpen, invoices]);

  if (loading) {
    return <InvoiceTableSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CircleAlertIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">
            Impossible de charger les factures
          </p>
          <Button onClick={refetch}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filters and Add Invoice Button - Fixe en haut */}
      <div className="flex items-center justify-between gap-3 hidden md:flex px-4 sm:px-6 py-4 flex-shrink-0">
        {/* Search + Filtres à gauche */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 h-8 w-full sm:w-[400px] rounded-[9px] border border-[#E6E7EA] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
            <Search size={16} className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
            <Input
              variant="ghost"
              ref={inputRef}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Recherchez par numéro, client ou montant..."
            />
            {Boolean(globalFilter) && (
              <button
                onClick={() => {
                  setGlobalFilter("");
                  inputRef.current?.focus();
                }}
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex items-center justify-center rounded focus-visible:ring-[3px] focus-visible:outline-none cursor-pointer"
                aria-label="Effacer la recherche"
              >
                <CircleXIcon size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Filters Button */}
          <InvoiceFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            clientFilter={clientFilter}
            setClientFilter={setClientFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            invoices={invoices || []}
            table={table}
          />
        </div>

        {/* Actions à droite */}
        <div className="flex items-center gap-2">
          {/* Bulk delete - visible quand des rows sont sélectionnées */}
          {selectedRows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isDeleting}
                  data-mobile-delete-trigger-invoice
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Supprimer ({selectedRows.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer {selectedRows.length}{" "}
                    facture(s) sélectionnée(s) ? Cette action ne peut pas être
                    annulée.
                    <br />
                    <br />
                    <strong>Note :</strong> Seules les factures en brouillon et
                    les factures importées peuvent être supprimées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelected}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Tabs de filtre rapide - Desktop */}
      <div className="hidden md:block flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="h-auto rounded-none bg-transparent p-0 pb-2 w-full justify-start px-4 sm:px-6">
            <TabsTrigger
              value="all"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              <span className="data-[state=active]:text-shadow-[0_0_0.01px_currentColor]">Toutes les factures</span>
              <span className="text-xs text-muted-foreground">
                {invoiceCounts.all}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              <span>Brouillons</span>
              <span className="text-xs text-muted-foreground">
                {invoiceCounts.draft}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              <span>À encaisser</span>
              <span className="text-xs text-muted-foreground">
                {invoiceCounts.pending}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              <span>Terminées</span>
              <span className="text-xs text-muted-foreground">
                {invoiceCounts.completed}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table - Desktop style avec header fixe et body scrollable */}
      <div className="hidden md:flex md:flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header fixe */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
          <table className="w-full table-fixed">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, index, arr) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={`h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground ${index === 0 ? "pl-4 sm:pl-6" : ""} ${index === arr.length - 1 ? "pr-4 sm:pr-6" : ""}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
          </table>
        </div>
        {/* Table Body - Scrollable */}
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed">
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b">
                    <td className="p-2 pl-4 sm:pl-6"><div className="h-4 w-4 rounded bg-muted animate-pulse" /></td>
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
                        <div className="h-4 w-[140px] rounded bg-muted animate-pulse" />
                      </div>
                    </td>
                    <td className="p-2"><div className="h-4 w-[70px] rounded bg-muted animate-pulse" /></td>
                    <td className="p-2"><div className="h-4 w-[70px] rounded bg-muted animate-pulse" /></td>
                    <td className="p-2"><div className="h-5 w-[70px] rounded-full bg-muted animate-pulse" /></td>
                    <td className="p-2"><div className="h-4 w-[80px] rounded bg-muted animate-pulse" /></td>
                    <td className="p-2 pr-4 sm:pr-6"><div className="h-7 w-7 rounded bg-muted animate-pulse" /></td>
                  </tr>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer transition-colors"
                    onClick={(e) => {
                      // Ne pas ouvrir la sidebar si on clique sur la checkbox ou les actions
                      if (
                        e.target.closest('[role="checkbox"]') ||
                        e.target.closest("[data-actions-cell]") ||
                        e.target.closest('button[role="combobox"]') ||
                        e.target.closest('[role="menu"]')
                      ) {
                        return;
                      }
                      const invoice = row.original;
                      // Ouvrir la sidebar appropriée selon le type
                      if (invoice._type === "imported") {
                        setSelectedImportedInvoice(invoice);
                      } else {
                        // Déclencher l'ouverture de la sidebar via le bouton d'actions
                        const actionsButton = e.currentTarget.querySelector(
                          "[data-view-invoice]"
                        );
                        if (actionsButton) {
                          actionsButton.click();
                        }
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell, index, arr) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className={`p-2 align-middle text-sm ${index === 0 ? "pl-4 sm:pl-6" : ""} ${index === arr.length - 1 ? "pr-4 sm:pr-6" : ""}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center p-2"
                  >
                    Aucune facture trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Toolbar */}
      <div className={cn("md:hidden flex-shrink-0 transition-shadow", isMobileScrolled && "shadow-xs")}>
        {/* Search + Filter */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                className={cn("peer w-full ps-9", Boolean(globalFilter) && "pe-9")}
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Rechercher..."
                type="text"
                aria-label="Rechercher des factures"
              />
              <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                <Search size={16} aria-hidden="true" />
              </div>
              {Boolean(globalFilter) && (
                <button
                  className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Effacer la recherche"
                  onClick={() => {
                    setGlobalFilter("");
                    inputRef.current?.focus();
                  }}
                >
                  <CircleXIcon size={16} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="filter"
                  aria-label="Filtrer"
                  className="relative"
                >
                  <FilterIcon size={16} />
                  {statusFilter.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-background text-muted-foreground/70 inline-flex h-4 w-4 items-center justify-center rounded border text-[0.5rem] font-medium">
                      {statusFilter.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end">
                <div className="p-4">
                  <h4 className="font-medium leading-none mb-3">Filtrer par statut</h4>
                  <div className="space-y-2">
                    {Object.entries(INVOICE_STATUS_LABELS).map(
                      ([status, label]) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`mobile-invoice-${status}`}
                            checked={statusFilter.includes(status)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setStatusFilter([...statusFilter, status]);
                              } else {
                                setStatusFilter(statusFilter.filter((s) => s !== status));
                              }
                            }}
                          />
                          <Label htmlFor={`mobile-invoice-${status}`} className="text-sm font-normal">
                            {label}
                          </Label>
                        </div>
                      )
                    )}
                  </div>
                  {statusFilter.length > 0 && (
                    <Button
                      variant="ghost"
                      onClick={() => setStatusFilter([])}
                      className="w-full mt-3 h-8 px-2 lg:px-3"
                    >
                      Effacer les filtres
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto scrollbar-hide px-4 pb-3">
          <div className="flex gap-2 w-max">
            {mobileTabs.map((tab) => {
              const count = invoiceCounts[tab.id];
              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "whitespace-nowrap text-xs h-8 px-3 transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-gray-100 text-foreground dark:bg-gray-800"
                      : "bg-gray-50 text-muted-foreground dark:bg-gray-900"
                  )}
                >
                  {tab.label}
                  {count != null && count > 0 && (
                    <span className={cn(
                      "ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium transition-colors duration-200",
                      activeTab === tab.id
                        ? "bg-foreground/10 text-foreground"
                        : "bg-foreground/5 text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Table - Infinite scroll */}
      <div
        ref={mobileScrollRef}
        onScroll={handleMobileScroll}
        className="md:hidden overflow-y-auto overflow-x-auto flex-1 min-h-0 pb-20"
      >
        <div className={`transition-opacity duration-150 ${isMobileTransitioning ? "opacity-0" : "opacity-100"}`}>
          <Table className="w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-gray-100 dark:border-gray-400"
                >
                  {headerGroup.headers
                    .filter(
                      (header) =>
                        header.column.id === "select" ||
                        header.column.id === "client" ||
                        header.column.id === "finalTotalTTC" ||
                        header.column.id === "actions"
                    )
                    .map((header) => (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-400"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {visibleMobileRows.length > 0 ? (
                <>
                  {visibleMobileRows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-25 dark:hover:bg-gray-900 cursor-pointer"
                      onClick={(e) => {
                        if (
                          e.target.closest('[role="checkbox"]') ||
                          e.target.closest("[data-actions-cell]") ||
                          e.target.closest('[role="menu"]')
                        ) return;
                        const invoice = row.original;
                        if (invoice._type === "imported") {
                          setSelectedImportedInvoice(invoice);
                        } else {
                          setInvoiceToOpen(invoice);
                        }
                      }}
                    >
                      {row
                        .getVisibleCells()
                        .filter(
                          (cell) =>
                            cell.column.id === "select" ||
                            cell.column.id === "client" ||
                            cell.column.id === "finalTotalTTC" ||
                            cell.column.id === "actions"
                        )
                        .map((cell) => (
                          <TableCell key={cell.id} className="py-3 px-4 text-sm">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
                  {isLoadingMoreMobile && (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={`mobile-skeleton-${i}`} className="border-b border-gray-50 dark:border-gray-800">
                        <TableCell className="py-3 px-4"><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-[100px]" />
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4"><Skeleton className="h-4 w-[60px]" /></TableCell>
                        <TableCell className="py-3 px-4"><Skeleton className="h-7 w-7" /></TableCell>
                      </TableRow>
                    ))
                  )}
                  {hasMoreMobile && (
                    <TableRow>
                      <TableCell colSpan={4} className="p-0">
                        <div ref={mobileSentinelRef} className="h-1" />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ) : loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`} className="border-b border-gray-50 dark:border-gray-800">
                    <TableCell className="py-3 px-4"><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4"><Skeleton className="h-4 w-[60px]" /></TableCell>
                    <TableCell className="py-3 px-4"><Skeleton className="h-7 w-7" /></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Aucune facture trouvée.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination - Fixe en bas sur desktop */}
      <div className="hidden md:flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 bg-background flex-shrink-0">
        <div className="flex-1 text-xs font-normal text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} sur{" "}
          {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
        </div>
        <div className="flex items-center space-x-4 lg:space-x-6">
          <div className="flex items-center gap-1.5">
            <p className="whitespace-nowrap text-xs font-normal">
              Lignes par page
            </p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-7 w-[70px] text-xs">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center whitespace-nowrap text-xs font-normal">
            Page {table.getState().pagination.pageIndex + 1} sur{" "}
            {table.getPageCount()}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to first page"
                >
                  <ChevronFirstIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to last page"
                >
                  <ChevronLastIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* Sidebar pour ouverture automatique */}
      {invoiceToOpen && (
        <InvoiceSidebar
          invoice={invoiceToOpen}
          isOpen={!!invoiceToOpen}
          onClose={() => setInvoiceToOpen(null)}
          onRefetch={refetch}
        />
      )}

      {/* Modal d'import de factures */}
      <ImportInvoiceModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportSuccess={() => {
          refetchImported();
          refetch();
        }}
      />

      {/* Sidebar pour les factures importées */}
      <ImportedInvoiceSidebar
        invoice={selectedImportedInvoice}
        open={!!selectedImportedInvoice}
        onOpenChange={(open) => !open && setSelectedImportedInvoice(null)}
        onUpdate={() => {
          refetchImported();
          setSelectedImportedInvoice(null);
        }}
      />
    </div>
  );
}

function InvoiceTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filters skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-60" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-background overflow-hidden rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 w-7">
                <Skeleton className="h-4 w-4 rounded" />
              </TableHead>
              <TableHead className="h-11 w-[150px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="h-11 w-[200px]">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="h-11 w-[100px]">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead className="h-11 w-[80px]">
                <Skeleton className="h-4 w-14" />
              </TableHead>
              <TableHead className="h-11 w-[120px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="h-11 w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell>
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-16" />
        </div>
        <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}
