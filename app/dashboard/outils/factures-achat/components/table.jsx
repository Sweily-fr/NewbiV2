"use client";

import {
  useId,
  useMemo,
  useState,
} from "react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "@/src/components/ui/sonner";
import {
  useDeletePurchaseInvoice,
  useBulkDelete,
  useBulkUpdateStatus,
  useBulkCategorize,
} from "@/src/hooks/usePurchaseInvoices";
import { columns } from "./columns";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/src/components/ui/empty";
// Native <table> elements used to match Transactions page layout
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/src/components/ui/pagination";
import {
  Search,
  TrashIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  X,
  CheckCircle2,
  Archive,
  Tag,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

const STATUS_LABELS = {
  TO_PROCESS: "À traiter",
  TO_PAY: "À payer",
  PENDING: "En attente",
  PAID: "Payée",
  OVERDUE: "En retard",
  ARCHIVED: "Archivée",
};

const CATEGORY_LABELS = {
  RENT: "Loyer",
  SUBSCRIPTIONS: "Abonnements",
  OFFICE_SUPPLIES: "Fournitures",
  SERVICES: "Sous-traitance",
  TRANSPORT: "Transport",
  MEALS: "Repas",
  TELECOMMUNICATIONS: "Télécommunications",
  INSURANCE: "Assurance",
  ENERGY: "Énergie",
  SOFTWARE: "Logiciels",
  HARDWARE: "Matériel",
  MARKETING: "Marketing",
  TRAINING: "Formation",
  MAINTENANCE: "Maintenance",
  TAXES: "Impôts & taxes",
  UTILITIES: "Services publics",
  OTHER: "Autre",
};

const multiColumnFilterFn = (row, columnId, filterValue) => {
  const search = filterValue.toLowerCase();
  const supplierName = (row.getValue("supplierName") || "").toLowerCase();
  const invoiceNumber = (row.original.invoiceNumber || "").toLowerCase();
  const amount = String(row.original.amountTTC || "");
  return (
    supplierName.includes(search) ||
    invoiceNumber.includes(search) ||
    amount.includes(search)
  );
};

export default function PurchaseInvoiceTable({
  invoices = [],
  loading,
  refetch,
  onRowClick,
}) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "issueDate", desc: true }]);
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [activeTab, setActiveTab] = useState("all");

  const { deleteInvoice } = useDeletePurchaseInvoice();
  const { bulkDelete } = useBulkDelete();
  const { bulkUpdateStatus } = useBulkUpdateStatus();
  const { bulkCategorize } = useBulkCategorize();

  // Count by status for tabs
  const statusCounts = useMemo(() => {
    const counts = { all: 0, TO_PAY: 0, OVERDUE: 0, PAID: 0 };
    (invoices || []).forEach((inv) => {
      counts.all++;
      if (inv.status === "TO_PAY") counts.TO_PAY++;
      if (inv.status === "OVERDUE") counts.OVERDUE++;
      if (inv.status === "PAID") counts.PAID++;
    });
    return counts;
  }, [invoices]);

  // Filter by tab
  const filteredInvoices = useMemo(() => {
    if (activeTab === "all") return invoices;
    return invoices.filter((inv) => inv.status === activeTab);
  }, [invoices, activeTab]);

  const table = useReactTable({
    data: filteredInvoices,
    columns,
    state: {
      columnFilters,
      globalFilter,
      sorting,
      rowSelection,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: multiColumnFilterFn,
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  const handleRowClick = (invoice) => {
    onRowClick?.(invoice);
  };

  const handleBulkDelete = async () => {
    const ids = selectedRows.map((r) => r.original.id);
    await bulkDelete(ids);
    setRowSelection({});
    refetch?.();
  };

  const handleBulkStatus = async (status) => {
    const ids = selectedRows.map((r) => r.original.id);
    await bulkUpdateStatus(ids, status);
    setRowSelection({});
    refetch?.();
  };

  const handleBulkCategorize = async (category) => {
    const ids = selectedRows.map((r) => r.original.id);
    await bulkCategorize(ids, category);
    setRowSelection({});
    refetch?.();
  };

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:flex md:flex-col flex-1 min-h-0">
        {/* Toolbar: Search + Bulk Actions */}
        <div className="flex items-center justify-between gap-3 hidden md:flex px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="relative max-w-md">
            <Input
              placeholder="Recherchez par fournisseur, n° facture ou montant..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full sm:w-[490px] lg:w-[490px] ps-9"
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
              <Search size={16} aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk actions */}
            {hasSelection && (
              <>
                <span className="text-xs text-muted-foreground">
                  {selectedRows.length} sélectionnée{selectedRows.length > 1 ? "s" : ""}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleBulkStatus("PAID")}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Payées
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleBulkStatus("ARCHIVED")}
                >
                  <Archive className="h-3.5 w-3.5 mr-1" />
                  Archiver
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <Tag className="h-3.5 w-3.5 mr-1" />
                      Catégoriser
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => handleBulkCategorize(key)}
                      >
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                    >
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Supprimer ({selectedRows.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer {selectedRows.length} facture{selectedRows.length > 1 ? "s" : ""} sélectionnée{selectedRows.length > 1 ? "s" : ""} ? Cette action ne peut pas être annulée.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDelete}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="hidden md:block flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center px-4 sm:px-6">
            {[
              { key: "all", label: "Toutes", count: statusCounts.all },
              { key: "TO_PAY", label: "À payer", count: statusCounts.TO_PAY },
              { key: "OVERDUE", label: "En retard", count: statusCounts.OVERDUE },
              { key: "PAID", label: "Payées", count: statusCounts.PAID },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
                className={`relative rounded-none py-2 px-4 text-sm font-normal after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 transition-colors ${
                  activeTab === tab.key
                    ? "after:bg-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs text-muted-foreground">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
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
          <div className="flex-1 overflow-auto flex flex-col">
            {loading ? (
              <div className="p-0">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center border-b px-4 sm:px-6 py-3 gap-3">
                    <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                    <div className="h-7 w-7 rounded-full bg-muted animate-pulse flex-shrink-0" />
                    <div className="h-4 w-[140px] rounded bg-muted animate-pulse" />
                    <div className="h-4 w-[90px] rounded bg-muted animate-pulse" />
                    <div className="h-4 w-[70px] rounded bg-muted animate-pulse" />
                    <div className="h-4 w-[70px] rounded bg-muted animate-pulse" />
                    <div className="h-4 w-[70px] rounded bg-muted animate-pulse" />
                    <div className="h-7 w-7 rounded-full bg-muted animate-pulse flex-shrink-0" />
                    <div className="h-5 w-[60px] rounded-full bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            ) : table.getRowModel().rows?.length ? (
              <table className="w-full table-fixed">
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="border-b hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer transition-colors"
                      onClick={(e) => {
                        if (
                          e.target.closest('[role="checkbox"]') ||
                          e.target.closest("[data-no-row-click]") ||
                          e.target.closest('[role="menu"]')
                        ) {
                          return;
                        }
                        handleRowClick(row.original);
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
                  ))}
                </tbody>
              </table>
            ) : (
              <Empty className="flex-1">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileText />
                  </EmptyMedia>
                  <EmptyTitle>Aucune facture d&apos;achat</EmptyTitle>
                  <EmptyDescription>
                    Importez vos factures fournisseurs ou créez-en une manuellement pour commencer.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="hidden md:flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 bg-background flex-shrink-0">
          <div className="flex-1 text-xs font-normal text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} sur{" "}
            {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
          </div>
          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="flex items-center gap-1.5">
              <p className="whitespace-nowrap text-xs font-normal">Lignes par page</p>
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) =>
                  setPagination({ pageIndex: 0, pageSize: Number(value) })
                }
              >
                <SelectTrigger className="h-7 w-[70px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
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
                    aria-label="Première page"
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
                    aria-label="Page précédente"
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
                    aria-label="Page suivante"
                  >
                    <ChevronRightIcon size={14} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                    aria-label="Dernière page"
                  >
                    <ChevronLastIcon size={14} aria-hidden="true" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex-1 overflow-hidden flex flex-col">
        {/* Mobile Search */}
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto flex-shrink-0">
          {[
            { key: "all", label: "Toutes", count: statusCounts.all },
            { key: "TO_PAY", label: "À payer", count: statusCounts.TO_PAY },
            { key: "OVERDUE", label: "En retard", count: statusCounts.OVERDUE },
            { key: "PAID", label: "Payées", count: statusCounts.PAID },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>

        {/* Mobile List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b py-3 gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 w-[120px] rounded bg-muted animate-pulse" />
                    <div className="h-3 w-[80px] rounded bg-muted animate-pulse" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-4 w-[60px] rounded bg-muted animate-pulse ml-auto" />
                    <div className="h-4 w-[50px] rounded-full bg-muted animate-pulse ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>Aucune facture</EmptyTitle>
                <EmptyDescription>
                  Importez vos factures fournisseurs pour commencer.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            filteredInvoices
              .filter((inv) => {
                if (!globalFilter) return true;
                const s = globalFilter.toLowerCase();
                return (
                  (inv.supplierName || "").toLowerCase().includes(s) ||
                  (inv.invoiceNumber || "").toLowerCase().includes(s) ||
                  String(inv.amountTTC).includes(s)
                );
              })
              .map((inv) => (
                <div
                  key={inv.id}
                  className="border-b px-4 py-3 cursor-pointer hover:bg-muted/50 active:bg-muted"
                  onClick={() => handleRowClick(inv)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {inv.supplierName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {inv.invoiceNumber && `${inv.invoiceNumber} · `}
                        {new Date(inv.issueDate).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="font-medium text-sm">
                        {new Intl.NumberFormat("fr-FR", {
                          minimumFractionDigits: 2,
                        }).format(inv.amountTTC)}{" "}
                        €
                      </div>
                      <StatusBadge status={inv.status} small />
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

    </>
  );
}

function StatusBadge({ status, small }) {
  const config = {
    TO_PROCESS: { label: "À traiter", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    TO_PAY: { label: "À payer", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    PENDING: { label: "En attente", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    PAID: { label: "Payée", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    OVERDUE: { label: "En retard", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    ARCHIVED: { label: "Archivée", className: "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-500" },
  };
  const c = config[status] || config.TO_PROCESS;
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${c.className} ${
        small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      }`}
    >
      {c.label}
    </span>
  );
}

export { StatusBadge, STATUS_LABELS, CATEGORY_LABELS };
