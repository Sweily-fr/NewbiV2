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
import { ButtonGroup, ButtonGroupSeparator } from "@/src/components/ui/button-group";
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
import { useQuoteTable } from "../hooks/use-quote-table";
import QuoteRowActions from "./quote-row-actions";
import QuoteFilters from "./quote-filters";

export default function QuoteTable({ handleNewQuote }) {
  const { quotes, loading, error, refetch } = useQuotes();
  const { canCreate, canExport } = usePermissions();
  const [canCreateQuote, setCanCreateQuote] = useState(false);
  const [canExportQuote, setCanExportQuote] = useState(false);

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
    <div className="space-y-4">
      {/* Filters and Add Quote Button */}
      <div className="flex items-center justify-between gap-3 hidden md:flex">
        {/* First Button Group: Search, Status, Columns */}
        <ButtonGroup>
          {/* Search */}
          <div className="relative flex-1">
            <Input
              placeholder="Rechercher des devis..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="w-full sm:w-[150px] lg:w-[250px] ps-9 rounded-r-none"
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
              <Search size={16} aria-hidden="true" />
            </div>
          </div>

          {/* Filters Button */}
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
        </ButtonGroup>

        {/* Add Quote Button Group - Visible uniquement si permission */}
        {canCreateQuote && (
          <ButtonGroup>
            <Button 
              onClick={handleNewQuote} 
              className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              Nouveau devis
            </Button>
            <ButtonGroupSeparator />
            <Button 
              onClick={handleNewQuote} 
              size="icon"
              className="cursor-pointer bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              <PlusIcon size={16} aria-hidden="true" />
            </Button>
          </ButtonGroup>
        )}

        {/* Bulk actions */}
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
                <h4 className="font-medium leading-none mb-3">Filtrer par statut</h4>
                <div className="space-y-2">
                  {Object.entries(QUOTE_STATUS_LABELS).map(([status, label]) => (
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
                      <Label htmlFor={`mobile-${status}`} className="text-sm font-normal">
                        {label}
                      </Label>
                    </div>
                  ))}
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
                const deleteButton = document.querySelector('[data-mobile-delete-trigger-quote]');
                if (deleteButton) deleteButton.click();
              }}
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              ({selectedRows.length})
            </Button>
          )}
        </div>
      </div>

      {/* Table - Desktop style (original) */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="font-normal"
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  {loading ? "Chargement..." : "Aucun devis trouvé."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
                  .filter((header) => header.column.id === "select" || header.column.id === "client" || header.column.id === "finalTotalTTC" || header.column.id === "actions")
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
                  {row.getVisibleCells()
                    .filter((cell) => cell.column.id === "select" || cell.column.id === "client" || cell.column.id === "finalTotalTTC" || cell.column.id === "actions")
                    .map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3 px-4 text-sm"
                    >
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
                  {loading ? "Chargement..." : "Aucun devis trouvé."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - Visible sur desktop seulement */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex-1 text-sm font-normal text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} sur{" "}
          {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center gap-2">
            <p className="whitespace-nowrap text-sm font-normal">
              Lignes par page
            </p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
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
          <div className="flex items-center whitespace-nowrap text-sm font-normal">
            Page {table.getState().pagination.pageIndex + 1} sur{" "}
            {table.getPageCount()}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to first page"
                >
                  <ChevronFirstIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to last page"
                >
                  <ChevronLastIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
