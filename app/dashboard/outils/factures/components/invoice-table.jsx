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

import { useInvoices } from "@/src/graphql/invoiceQueries";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from "@/src/graphql/invoiceQueries";
import { useInvoiceTable } from "../hooks/use-invoice-table";
import InvoiceRowActions from "./invoice-row-actions";
import { Skeleton } from "@/src/components/ui/skeleton";
import InvoiceExportButton from "./invoice-export-button";
import InvoiceFilters from "./invoice-filters";

export default function InvoiceTable({ handleNewInvoice }) {
  const router = useRouter();
  const { invoices, loading, error, refetch } = useInvoices();
  const { canCreate } = usePermissions();
  const [canCreateInvoice, setCanCreateInvoice] = useState(false);

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
    data: invoices || [],
    onRefetch: refetch,
  });

  // Vérifier les permissions de création
  useEffect(() => {
    const checkPermission = async () => {
      const allowed = await canCreate("invoices");
      setCanCreateInvoice(allowed);
    };
    checkPermission();
  }, [canCreate]);

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
    <div className="space-y-4">
      {/* Filters and Add Invoice Button */}
      <div className="flex items-center justify-between gap-3 hidden md:flex">
        <div className="flex items-center gap-3">
          {/* First Button Group: Search, Status, Columns */}
          <ButtonGroup>
            {/* Search */}
            <div className="relative flex-1">
              <Input
                placeholder="Rechercher des factures..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="w-full sm:w-[150px] lg:w-[250px] ps-9 rounded-r-none"
              />
              <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                <Search size={16} aria-hidden="true" />
              </div>
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
          </ButtonGroup>

          {/* Export button */}
          <InvoiceExportButton 
            invoices={invoices || []} 
            selectedRows={selectedRows}
          />
        </div>

        {/* Add Invoice Button Group - Visible uniquement si permission */}
        {canCreateInvoice && (
          <ButtonGroup>
            <Button 
              onClick={handleNewInvoice} 
              className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-popover dark:text-popover-foreground dark:hover:bg-popover/90"
            >
              Nouvelle facture
            </Button>
            <ButtonGroupSeparator />
            <Button 
              onClick={handleNewInvoice} 
              size="icon"
              className="cursor-pointer bg-black text-white hover:bg-black/90 dark:bg-popover dark:text-popover-foreground dark:hover:bg-popover/90"
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
                  <strong>Note :</strong> Seules les factures en brouillon peuvent
                  être supprimées.
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
                  {loading ? "Chargement..." : "Aucune facture trouvée."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
                <h4 className="font-medium leading-none mb-3">Filtrer par statut</h4>
                <div className="space-y-2">
                  {Object.entries(INVOICE_STATUS_LABELS).map(([status, label]) => (
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
                      <Label htmlFor={`mobile-invoice-${status}`} className="text-sm font-normal">
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
                const deleteButton = document.querySelector('[data-mobile-delete-trigger-invoice]');
                if (deleteButton) deleteButton.click();
              }}
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              ({selectedRows.length})
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
                  {loading ? "Chargement..." : "Aucune facture trouvée."}
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
