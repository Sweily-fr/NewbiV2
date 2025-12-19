"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/src/components/ui/button-group";
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
import { Input } from "@/src/components/ui/input";
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
      client: { name: inv.vendor?.name || "Fournisseur inconnu" },
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
        {/* Search */}
        <div className="relative max-w-md">
          <Input
            placeholder="Recherchez par numéro de facture, par client ou par montant..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full sm:w-[490px] lg:w-[490px] ps-9"
          />
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
            <Search size={16} aria-hidden="true" />
          </div>
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

          {/* Filters Button - Icône 3 points */}
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
      </div>

      {/* Tabs de filtre rapide - Desktop */}
      <div className="hidden md:block flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="h-auto rounded-none bg-transparent p-0 w-full justify-start px-4 sm:px-6">
            <TabsTrigger
              value="all"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-normal"
            >
              Toutes les factures
              <span className="ml-2 text-xs text-muted-foreground">
                {invoiceCounts.all}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-normal"
            >
              Brouillons
              <span className="ml-2 text-xs text-muted-foreground">
                {invoiceCounts.draft}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-normal"
            >
              À encaisser
              <span className="ml-2 text-xs text-muted-foreground">
                {invoiceCounts.pending}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-normal"
            >
              Terminées
              <span className="ml-2 text-xs text-muted-foreground">
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
        {/* Body scrollable */}
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed">
            <tbody>
              {table.getRowModel().rows?.length ? (
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
                    {loading ? "Chargement..." : "Aucune facture trouvée."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Toolbar - Style Notion */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Input
              placeholder="Rechercher des factures..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="h-9 pl-3 pr-3 bg-gray-50 dark:bg-gray-900 border-none rounded-md text-sm"
            />
          </div>

          {/* Filter Button - Icon only */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <ListFilterIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end">
              <div className="p-4">
                <h4 className="font-medium leading-none mb-3">
                  Filtrer par statut
                </h4>
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
                              setStatusFilter(
                                statusFilter.filter((s) => s !== status)
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={`mobile-invoice-${status}`}
                          className="text-sm font-normal"
                        >
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

          {/* Delete button for mobile - shown when rows are selected */}
          {selectedRows.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="h-9 px-3"
              onClick={() => {
                // Trigger the delete dialog
                const deleteButton = document.querySelector(
                  "[data-mobile-delete-trigger-invoice]"
                );
                if (deleteButton) deleteButton.click();
              }}
            >
              <TrashIcon className="h-4 w-4 mr-1" />({selectedRows.length})
            </Button>
          )}

          {/* Add Invoice Button - Icon only */}
          {/* <Button
            variant="default"
            size="sm"
            className="h-7 w-7 p-0 bg-[#5A50FF] hover:bg-[#5A50FF] text-white rounded-sm"
            onClick={() => router.push("/dashboard/outils/factures/new")}
          >
            <PlusIcon className="h-4 w-4" />
          </Button> */}
        </div>
      </div>

      {/* Table - Mobile style (Notion-like) */}
      <div className="md:hidden overflow-x-auto pb-20">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-25 dark:hover:bg-gray-900"
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-gray-500 dark:text-gray-400"
                >
                  {loading ? "Chargement..." : "Aucune facture trouvée."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
              <SelectTrigger className="h-7 w-[60px] text-xs">
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
