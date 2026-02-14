"use client";

import { useEffect, useMemo, useState } from "react";
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

import { useQuotes } from "@/src/graphql/quoteQueries";
import {
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
} from "@/src/graphql/quoteQueries";
import { useImportedQuotes } from "@/src/graphql/importedQuoteQueries";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useQuoteTable } from "../hooks/use-quote-table";
import QuoteRowActions from "./quote-row-actions";
import QuoteFilters from "./quote-filters";
import QuoteSidebar from "./quote-sidebar";
import { ImportQuoteModal } from "./import-quote-modal";
import { ImportedQuoteSidebar } from "./imported-quote-sidebar";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";

export default function QuoteTable({ handleNewQuote, quoteIdToOpen, triggerImport, onImportTriggered }) {
  const { quotes, loading, error, refetch } = useQuotes();
  const { workspaceId } = useRequiredWorkspace();
  const { importedQuotes, refetch: refetchImported } = useImportedQuotes(workspaceId);
  const { canCreate, canExport } = usePermissions();
  const [canCreateQuote, setCanCreateQuote] = useState(false);
  const [canExportQuote, setCanExportQuote] = useState(false);
  const [quoteToOpen, setQuoteToOpen] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportedQuote, setSelectedImportedQuote] = useState(null);

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
  } = useQuoteTable({
    data: quotes || [],
    onRefetch: refetch,
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
    } else if (value === "sent") {
      setStatusFilter(["SENT"]);
    } else if (value === "accepted") {
      setStatusFilter(["ACCEPTED"]);
    }
  };

  // Compter les devis par statut
  const quoteCounts = useMemo(() => {
    const counts = {
      all: (quotes || []).length,
      draft: 0,
      sent: 0,
      accepted: 0,
    };
    (quotes || []).forEach((quote) => {
      if (quote.status === "DRAFT") counts.draft++;
      else if (quote.status === "SENT") counts.sent++;
      else if (quote.status === "ACCEPTED") counts.accepted++;
    });
    return counts;
  }, [quotes]);

  // Vérifier les permissions
  useEffect(() => {
    const checkPermissions = async () => {
      const allowedCreate = await canCreate("quotes");
      const allowedExport = await canExport("quotes");
      setCanCreateQuote(allowedCreate);
      setCanExportQuote(allowedExport);
    };
    checkPermissions();
  }, [canCreate, canExport]);

  // Ouvrir automatiquement la sidebar si un ID est fourni
  useEffect(() => {
    if (quoteIdToOpen && quotes && quotes.length > 0) {
      const quote = quotes.find((q) => q.id === quoteIdToOpen);
      if (quote) {
        setQuoteToOpen(quote);
      }
    }
  }, [quoteIdToOpen, quotes]);

  // Gérer le déclenchement de l'import depuis le parent
  useEffect(() => {
    if (triggerImport) {
      setIsImportModalOpen(true);
      onImportTriggered?.();
    }
  }, [triggerImport, onImportTriggered]);

  if (loading) {
    return <QuoteTableSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CircleAlertIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">
            Impossible de charger les devis
          </p>
          <Button onClick={refetch}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filters and Add Quote Button - Fixe en haut */}
      <div className="flex items-center justify-between gap-3 hidden md:flex px-4 sm:px-6 py-4 flex-shrink-0">
        {/* Search */}
        <div className="relative max-w-md">
          <Input
            placeholder="Recherchez par numéro de devis, par client ou par montant..."
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
                  data-mobile-delete-trigger-quote
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
                    devis sélectionné(s) ? Cette action ne peut pas être
                    annulée.
                    <br />
                    <br />
                    <strong>Note :</strong> Seuls les devis en brouillon peuvent
                    être supprimés.
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
          <QuoteFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            clientFilter={clientFilter}
            setClientFilter={setClientFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            quotes={quotes || []}
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
              Tous les devis
              <span className="ml-2 text-xs text-muted-foreground">
                {quoteCounts.all}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-normal"
            >
              Brouillons
              <span className="ml-2 text-xs text-muted-foreground">
                {quoteCounts.draft}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="sent"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-normal"
            >
              Envoyés
              <span className="ml-2 text-xs text-muted-foreground">
                {quoteCounts.sent}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="accepted"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-normal"
            >
              Acceptés
              <span className="ml-2 text-xs text-muted-foreground">
                {quoteCounts.accepted}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mobile Toolbar - Style Notion */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Input
              placeholder="Rechercher des devis..."
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
                  {Object.entries(QUOTE_STATUS_LABELS).map(
                    ([status, label]) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mobile-${status}`}
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
                          htmlFor={`mobile-${status}`}
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
                  "[data-mobile-delete-trigger-quote]"
                );
                if (deleteButton) deleteButton.click();
              }}
            >
              <TrashIcon className="h-4 w-4 mr-1" />({selectedRows.length})
            </Button>
          )}
        </div>
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
                      // Déclencher l'ouverture de la sidebar via le bouton d'actions
                      const actionsButton =
                        e.currentTarget.querySelector("[data-view-quote]");
                      if (actionsButton) {
                        actionsButton.click();
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
                    Aucun devis trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-b border-gray-50 dark:border-gray-800">
                  <TableCell className="py-3 px-4"><div className="h-4 w-4 rounded bg-muted animate-pulse" /></TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
                      <div className="h-4 w-[100px] rounded bg-muted animate-pulse" />
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4"><div className="h-4 w-[60px] rounded bg-muted animate-pulse" /></TableCell>
                  <TableCell className="py-3 px-4"><div className="h-7 w-7 rounded bg-muted animate-pulse" /></TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
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
                  Aucun devis trouvé.
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
      {quoteToOpen && (
        <QuoteSidebar
          quote={quoteToOpen}
          isOpen={!!quoteToOpen}
          onClose={() => setQuoteToOpen(null)}
          onRefetch={refetch}
        />
      )}

      {/* Modal d'import de devis */}
      <ImportQuoteModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
      />

      {/* Sidebar pour les devis importés */}
      <ImportedQuoteSidebar
        quote={selectedImportedQuote}
        open={!!selectedImportedQuote}
        onOpenChange={(open) => {
          if (!open) setSelectedImportedQuote(null);
        }}
        onUpdate={() => refetchImported()}
      />
    </div>
  );
}

function QuoteTableSkeleton() {
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
