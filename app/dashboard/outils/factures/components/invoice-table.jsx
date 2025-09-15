"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function InvoiceTable() {
  const { invoices, loading, error, refetch } = useInvoices();

  const {
    table,
    globalFilter,
    setGlobalFilter,
    statusFilter,
    setStatusFilter,
    selectedRows,
    handleDeleteSelected,
    isDeleting,
  } = useInvoiceTable({
    data: invoices || [],
    onRefetch: refetch,
  });

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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Rechercher des factures..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="h-8 w-full sm:w-[150px] lg:w-[250px]"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-dashed font-normal">
                <ListFilterIcon className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Statut</span>
                {statusFilter && INVOICE_STATUS_LABELS[statusFilter] && (
                  <Badge variant="secondary" className="ml-2">
                    {INVOICE_STATUS_LABELS[statusFilter]}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("")}>
                Tous les statuts
              </DropdownMenuItem>
              {Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setStatusFilter(value)}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "mr-2",
                      INVOICE_STATUS_COLORS[value] || "bg-gray-100"
                    )}
                  >
                    {label}
                  </Badge>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Bouton de suppression à côté du filtre de statut */}
          {selectedRows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="ml-2">
                  <TrashIcon className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Supprimer</span>
                  <span className="sm:hidden">({selectedRows.length})</span>
                  <span className="hidden sm:inline">({selectedRows.length})</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer {selectedRows.length}{" "}
                    facture(s) ? Cette action est irréversible et ne peut être
                    effectuée que sur les brouillons.
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

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
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
                  Aucune facture trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm font-normal text-muted-foreground hidden sm:block">
          {table.getFilteredSelectedRowModel().rows.length} sur{" "}
          {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center gap-2">
            <p className="whitespace-nowrap text-sm font-normal hidden sm:block">
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
          <Skeleton className="h-9 w-16" />
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
