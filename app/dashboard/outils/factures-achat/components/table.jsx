"use client";

import { useId, useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
import { usePersistentColumnVisibility } from "@/src/hooks/usePersistentColumnVisibility";
import {
  useDeletePurchaseInvoice,
  useBulkDelete,
  useBulkUpdateStatus,
  useBulkCategorize,
} from "@/src/hooks/usePurchaseInvoices";
import { getColumns } from "./columns";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { TableEmptyState } from "@/src/components/ui/table-empty-state";
import { ShopIcon } from "@/src/components/icons";
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
  CircleXIcon,
  ListFilterIcon,
  CheckCircle2,
  Archive,
  Tag,
  Mail,
  XCircle,
  Loader2,
  EllipsisVertical,
} from "lucide-react";
import {
  useConvertImportedInvoice,
  useConvertImportedInvoices,
  useRejectImportedInvoice,
} from "@/src/graphql/importedInvoiceQueries";
import { GoogleIcon } from "./google-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Badge } from "@/src/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";

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
  refetchStats,
  onRowClick,
  importedInvoices = [],
  importedLoading,
  onImportedConverted,
}) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "issueDate", desc: true }]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = usePersistentColumnVisibility(
    "newbi:column-visibility:purchase-invoices",
    {
      invoiceNumber: false,
      amountHT: false,
      amountTVA: false,
    },
  );
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilters, setStatusFilters] = useState([]);
  const [categoryFilters, setCategoryFilters] = useState([]);

  // Pré-filtrage depuis l'URL (ex: ?status=TO_PAY depuis le dashboard)
  const searchParams = useSearchParams();
  const initialStatusRef = useRef(null);
  useEffect(() => {
    const status = searchParams.get("status");
    if (!status || initialStatusRef.current === status) return;
    initialStatusRef.current = status;
    if (["all", "TO_PAY", "OVERDUE", "PAID", "imported"].includes(status)) {
      setActiveTab(status);
    }
  }, [searchParams]);

  const { deleteInvoice } = useDeletePurchaseInvoice();
  const { bulkDelete } = useBulkDelete();
  const { bulkUpdateStatus } = useBulkUpdateStatus();
  const { bulkCategorize } = useBulkCategorize();

  // Imported invoices conversion
  const { convertImportedInvoice, loading: convertingOne } =
    useConvertImportedInvoice();
  const { convertImportedInvoices, loading: convertingBulk } =
    useConvertImportedInvoices();
  const { rejectImportedInvoice, loading: rejecting } =
    useRejectImportedInvoice();
  const [importedSelection, setImportedSelection] = useState(new Set());

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

  const activeFiltersCount = statusFilters.length + categoryFilters.length;

  const toggleStatusFilter = (status) => {
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const toggleCategoryFilter = (category) => {
    setCategoryFilters((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const clearAllFilters = () => {
    setStatusFilters([]);
    setCategoryFilters([]);
  };

  // Filter by tab + advanced filters, then sort by issueDate desc
  // (most recent first). We sort here rather than relying solely on TanStack
  // because the mobile list iterates filteredInvoices directly and bypasses
  // the table's sorted row model.
  const filteredInvoices = useMemo(() => {
    let result = invoices;
    if (activeTab !== "all") {
      result = result.filter((inv) => inv.status === activeTab);
    }
    if (statusFilters.length > 0) {
      result = result.filter((inv) => statusFilters.includes(inv.status));
    }
    if (categoryFilters.length > 0) {
      result = result.filter((inv) => categoryFilters.includes(inv.category));
    }

    const toTime = (val) => {
      if (!val) return 0;
      let d;
      if (typeof val === "string") {
        d = /^\d+$/.test(val) ? new Date(parseInt(val, 10)) : new Date(val);
      } else if (typeof val === "number") {
        d = new Date(val);
      } else if (val instanceof Date) {
        d = val;
      }
      return d && !isNaN(d.getTime()) ? d.getTime() : 0;
    };

    return [...result].sort(
      (a, b) => toTime(b.issueDate) - toTime(a.issueDate),
    );
  }, [invoices, activeTab, statusFilters, categoryFilters]);

  const handleDeleteInvoice = async (id) => {
    const result = await deleteInvoice(id);
    if (result?.success) {
      refetch?.();
      refetchStats?.();
    }
  };

  // Actions sur une seule facture (menu "⋮" de la row) — réutilisent les
  // mutations bulk avec un seul id. Définies avant le useMemo des colonnes.
  const handleRowStatus = async (id, status) => {
    await bulkUpdateStatus([id], status);
    refetch?.();
    refetchStats?.();
  };

  const handleRowCategorize = async (id, category) => {
    await bulkCategorize([id], category);
    refetch?.();
  };

  const columns = useMemo(
    () =>
      getColumns({
        onViewInvoice: onRowClick,
        onDeleteInvoice: handleDeleteInvoice,
        onMarkStatus: handleRowStatus,
        onCategorize: handleRowCategorize,
        categoryLabels: CATEGORY_LABELS,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onRowClick],
  );

  const table = useReactTable({
    data: filteredInvoices,
    columns,
    state: {
      columnFilters,
      globalFilter,
      sorting,
      rowSelection,
      columnVisibility,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: multiColumnFilterFn,
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
    refetchStats?.();
  };

  const handleBulkStatus = async (status) => {
    const ids = selectedRows.map((r) => r.original.id);
    await bulkUpdateStatus(ids, status);
    setRowSelection({});
    refetch?.();
    refetchStats?.();
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
      <div className="hidden md:flex md:flex-col flex-1 min-h-0 min-w-0">
        {/* Toolbar: Search + Bulk Actions */}
        <div className="flex items-center justify-between gap-3 hidden md:flex px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 h-8 w-full sm:w-[400px] rounded-[9px] border border-[#E6E7EA] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] focus-within:ring-ring/50 focus-within:ring-[3px] transition-[border,box-shadow] duration-200 px-2.5">
              <Search
                size={16}
                className="text-muted-foreground/80 shrink-0"
                aria-hidden="true"
              />
              <Input
                variant="ghost"
                placeholder="Recherchez par fournisseur, n° facture ou montant..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
              {Boolean(globalFilter) && (
                <button
                  onClick={() => setGlobalFilter("")}
                  className="text-muted-foreground/80 hover:text-foreground shrink-0"
                >
                  <CircleXIcon size={16} strokeWidth={2} />
                </button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={activeFiltersCount > 0 ? "primary" : "filter"}
                  className="cursor-pointer"
                >
                  <ListFilterIcon size={14} />
                  Filtres
                  {activeFiltersCount > 0 && (
                    <span className="ml-0.5 rounded-full bg-white/20 px-1.5 py-0 text-[10px]">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[240px]">
                {/* Effacer tous les filtres */}
                <DropdownMenuItem
                  onClick={clearAllFilters}
                  className="cursor-pointer"
                >
                  Effacer tous les filtres
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Statut - sous-menu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="whitespace-nowrap">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Statut
                    {statusFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {statusFilters.length}
                      </Badge>
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-[220px] max-h-[min(400px,var(--radix-dropdown-menu-content-available-height))] overflow-y-auto">
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <div
                        key={key}
                        className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                        onClick={() => toggleStatusFilter(key)}
                      >
                        <Checkbox
                          checked={statusFilters.includes(key)}
                          className="mr-2 pointer-events-none"
                        />
                        <span>{label}</span>
                      </div>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Catégorie - sous-menu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="whitespace-nowrap">
                    <Tag className="h-4 w-4 mr-2" />
                    Catégorie
                    {categoryFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {categoryFilters.length}
                      </Badge>
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-[220px] max-h-[min(20.5rem,var(--radix-dropdown-menu-content-available-height))] overflow-y-auto">
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <div
                        key={key}
                        className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                        onClick={() => toggleCategoryFilter(key)}
                      >
                        <Checkbox
                          checked={categoryFilters.includes(key)}
                          className="mr-2 pointer-events-none"
                        />
                        <span>{label}</span>
                      </div>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                {/* Colonnes visibles - sous-menu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="whitespace-nowrap">
                    Colonnes visibles
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-[220px] max-h-[min(400px,var(--radix-dropdown-menu-content-available-height))] overflow-y-auto">
                    {table
                      .getAllColumns()
                      .filter((col) => col.getCanHide())
                      .map((col) => (
                        <div
                          key={col.id}
                          className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                          onClick={() =>
                            col.toggleVisibility(!col.getIsVisible())
                          }
                        >
                          <Checkbox
                            checked={col.getIsVisible()}
                            className="mr-2 pointer-events-none"
                          />
                          <span>{col.columnDef.meta?.label || col.id}</span>
                        </div>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk actions — toujours visibles, désactivées sans sélection */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="danger" disabled={!hasSelection}>
                  <TrashIcon size={14} />
                  Supprimer{hasSelection ? ` (${selectedRows.length})` : ""}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer {selectedRows.length}{" "}
                    facture{selectedRows.length > 1 ? "s" : ""} sélectionnée
                    {selectedRows.length > 1 ? "s" : ""} ? Cette action ne peut
                    pas être annulée.
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
            {/* Autres actions groupées regroupées dans un menu "⋮" */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!hasSelection}
                  aria-label="Actions groupées"
                >
                  <EllipsisVertical size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkStatus("PAID")}>
                  <CheckCircle2 size={14} />
                  Marquer payées
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatus("ARCHIVED")}>
                  <Archive size={14} />
                  Archiver
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2">
                    <Tag size={14} />
                    Catégoriser
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52">
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => handleBulkCategorize(key)}
                      >
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs */}
        <div className="hidden md:block flex-shrink-0 border-b border-[#eeeff1] dark:border-[#232323] pt-2 pb-[9px] purchase-tabs">
          <style>{`
            .purchase-tabs [data-slot="tabs-trigger"][data-state="active"] {
              text-shadow: 0.015em 0 currentColor, -0.015em 0 currentColor;
            }
          `}</style>
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <TabsList className="h-auto rounded-none bg-transparent p-0 w-full justify-start px-4 sm:px-6 gap-1.5">
              {[
                { key: "all", label: "Toutes", count: statusCounts.all },
                { key: "TO_PAY", label: "À payer", count: statusCounts.TO_PAY },
                {
                  key: "OVERDUE",
                  label: "En retard",
                  count: statusCounts.OVERDUE,
                },
                { key: "PAID", label: "Payées", count: statusCounts.PAID },
                ...(importedInvoices.length > 0
                  ? [
                      {
                        key: "imported",
                        label: "Importées Gmail",
                        count: importedInvoices.length,
                        highlight: true,
                      },
                    ]
                  : []),
              ].map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className={`relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground data-[hovered]:shadow-[inset_0_0_0_1px_#EEEFF1] dark:data-[hovered]:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]`}
                >
                  {tab.highlight && <GoogleIcon className="size-3.5" />}
                  {tab.label}
                  <span
                    className={`text-[10px] leading-none rounded px-1 py-0.5 ${tab.highlight ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-gray-100 dark:bg-gray-800 text-muted-foreground"}`}
                  >
                    {tab.count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Table — normal tabs */}
        {activeTab !== "imported" && (
          <>
            <div className="hidden md:block min-w-0">
              <div className="flex flex-col">
                {/* Header sticky */}
                <div className="sticky top-0 z-10 bg-background border-b border-[#eeeff1] dark:border-[#232323]">
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
                                    header.getContext(),
                                  )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                  </table>
                </div>
                {/* Body */}
                <div className="flex flex-col">
                  {loading ? (
                    <div className="p-0">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center border-b border-[#eeeff1] dark:border-[#232323] px-4 sm:px-6 py-3 gap-3"
                        >
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
                            className="border-b border-[#eeeff1] dark:border-[#232323] hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer transition-colors"
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
                                  cell.getContext(),
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <TableEmptyState
                      icon={ShopIcon}
                      title="Aucune facture d'achat"
                      description="Importez vos factures fournisseurs ou créez-en une manuellement pour commencer."
                      className="flex-1"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="hidden md:flex items-center justify-between px-4 sm:px-6 py-2 border-t border-[#eeeff1] dark:border-[#232323] bg-background sticky bottom-0 z-10">
              <div className="flex-1 text-xs font-normal text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} sur{" "}
                {table.getFilteredRowModel().rows.length} ligne(s)
                sélectionnée(s).
              </div>
              <div className="flex items-center space-x-4 lg:space-x-6">
                <div className="flex items-center gap-1.5">
                  <p className="whitespace-nowrap text-xs font-normal">
                    Lignes par page
                  </p>
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
                        onClick={() =>
                          table.setPageIndex(table.getPageCount() - 1)
                        }
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
          </>
        )}

        {/* Imported invoices tab */}
        {activeTab === "imported" && (
          <ImportedInvoicesPanel
            importedInvoices={importedInvoices}
            importedLoading={importedLoading}
            importedSelection={importedSelection}
            setImportedSelection={setImportedSelection}
            convertImportedInvoice={convertImportedInvoice}
            convertImportedInvoices={convertImportedInvoices}
            rejectImportedInvoice={rejectImportedInvoice}
            convertingOne={convertingOne}
            convertingBulk={convertingBulk}
            rejecting={rejecting}
            onImportedConverted={onImportedConverted}
          />
        )}
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex-1 overflow-hidden flex flex-col">
        {/* Mobile Search */}
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 h-9 rounded-[9px] border border-[#E6E7EA] dark:border-[#2E2E32] px-2.5">
            <Search
              size={16}
              className="text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
            <Input
              variant="ghost"
              placeholder="Rechercher..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
            {Boolean(globalFilter) && (
              <button
                onClick={() => setGlobalFilter("")}
                className="text-muted-foreground/80 hover:text-foreground shrink-0"
              >
                <CircleXIcon size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto flex-shrink-0">
          {[
            { key: "all", label: "Toutes", count: statusCounts.all },
            { key: "TO_PAY", label: "À payer", count: statusCounts.TO_PAY },
            { key: "OVERDUE", label: "En retard", count: statusCounts.OVERDUE },
            { key: "PAID", label: "Payées", count: statusCounts.PAID },
            ...(importedInvoices.length > 0
              ? [
                  {
                    key: "imported",
                    label: "Gmail",
                    count: importedInvoices.length,
                  },
                ]
              : []),
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-foreground text-background"
                  : tab.key === "imported"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>

        {/* Mobile List */}
        {activeTab !== "imported" ? (
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="px-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-[#eeeff1] dark:border-[#232323] py-3 gap-3"
                  >
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
              <TableEmptyState
                icon={ShopIcon}
                title="Aucune facture"
                description="Importez vos factures fournisseurs pour commencer."
                size="compact"
              />
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
                    className="border-b border-[#eeeff1] dark:border-[#232323] px-4 py-3 cursor-pointer hover:bg-muted/50 active:bg-muted"
                    onClick={() => handleRowClick(inv)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm truncate">
                            {inv.supplierName}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {inv.invoiceNumber && `${inv.invoiceNumber} · `}
                          {(() => {
                            try {
                              const d = new Date(inv.issueDate);
                              return isNaN(d.getTime())
                                ? "—"
                                : d.toLocaleDateString("fr-FR");
                            } catch {
                              return "—";
                            }
                          })()}
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
        ) : (
          <ImportedInvoicesPanel
            importedInvoices={importedInvoices}
            importedLoading={importedLoading}
            importedSelection={importedSelection}
            setImportedSelection={setImportedSelection}
            convertImportedInvoice={convertImportedInvoice}
            convertImportedInvoices={convertImportedInvoices}
            rejectImportedInvoice={rejectImportedInvoice}
            convertingOne={convertingOne}
            convertingBulk={convertingBulk}
            rejecting={rejecting}
            onImportedConverted={onImportedConverted}
          />
        )}
      </div>
    </>
  );
}

function ImportedInvoicesPanel({
  importedInvoices,
  importedLoading,
  importedSelection,
  setImportedSelection,
  convertImportedInvoice,
  convertImportedInvoices,
  rejectImportedInvoice,
  convertingOne,
  convertingBulk,
  rejecting,
  onImportedConverted,
}) {
  const allSelected =
    importedInvoices.length > 0 &&
    importedSelection.size === importedInvoices.length;

  const toggleAll = () => {
    if (allSelected) {
      setImportedSelection(new Set());
    } else {
      setImportedSelection(new Set(importedInvoices.map((inv) => inv.id)));
    }
  };

  const toggleOne = (id) => {
    setImportedSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConvertOne = async (id) => {
    try {
      await convertImportedInvoice({ variables: { id } });
      setImportedSelection((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Facture convertie en facture d'achat");
      onImportedConverted?.();
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    }
  };

  const handleRejectOne = async (id) => {
    try {
      await rejectImportedInvoice({ variables: { id } });
      setImportedSelection((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Facture rejetée");
      onImportedConverted?.();
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    }
  };

  const handleBulkConvert = async () => {
    const ids = Array.from(importedSelection);
    if (ids.length === 0) return;
    try {
      const { data } = await convertImportedInvoices({ variables: { ids } });
      const result = data?.convertImportedInvoicesToPurchaseInvoices;
      setImportedSelection(new Set());
      toast.success(result?.message || `${ids.length} facture(s) convertie(s)`);
      onImportedConverted?.();
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
    } catch {
      return "—";
    }
  };

  const formatAmount = (amount) => {
    if (amount == null) return "—";
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (importedLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (importedInvoices.length === 0) {
    return (
      <TableEmptyState
        icon={ShopIcon}
        title="Aucune facture importée en attente"
        description="Les factures détectées par Gmail apparaîtront ici pour validation."
        className="flex-1"
      />
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Bulk action bar */}
      {importedSelection.size > 0 && (
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2 border-b bg-amber-50 dark:bg-amber-900/10 flex-shrink-0">
          <span className="text-xs text-amber-700 dark:text-amber-400">
            {importedSelection.size} sélectionnée
            {importedSelection.size > 1 ? "s" : ""}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
            onClick={handleBulkConvert}
            disabled={convertingBulk}
          >
            {convertingBulk ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <CheckCircle2 size={13} />
            )}
            Tout valider ({importedSelection.size})
          </Button>
        </div>
      )}

      {/* Table header */}
      <div className="hidden md:block flex-shrink-0 border-b border-[#eeeff1] dark:border-[#232323]">
        <div className="grid grid-cols-[40px_1fr_140px_100px_100px_100px] gap-2 px-4 sm:px-6 h-10 items-center">
          <div>
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
          </div>
          <div className="text-xs text-muted-foreground font-normal">
            Fournisseur
          </div>
          <div className="text-xs text-muted-foreground font-normal">
            N° facture
          </div>
          <div className="text-xs text-muted-foreground font-normal text-right">
            Montant TTC
          </div>
          <div className="text-xs text-muted-foreground font-normal">Date</div>
          <div className="text-xs text-muted-foreground font-normal text-right">
            Actions
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-auto">
        {importedInvoices.map((inv) => (
          <div
            key={inv.id}
            className={`border-b border-[#eeeff1] dark:border-[#232323] transition-colors ${
              importedSelection.has(inv.id)
                ? "bg-amber-50/50 dark:bg-amber-900/5"
                : "hover:bg-muted/50"
            }`}
          >
            {/* Desktop row */}
            <div className="hidden md:grid grid-cols-[40px_1fr_140px_100px_100px_100px] gap-2 px-4 sm:px-6 py-2.5 items-center">
              <div>
                <Checkbox
                  checked={importedSelection.has(inv.id)}
                  onCheckedChange={() => toggleOne(inv.id)}
                />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Mail size={14} className="text-amber-500 shrink-0" />
                <span className="text-sm font-medium truncate">
                  {inv.vendor?.name || "Fournisseur inconnu"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {inv.originalInvoiceNumber || "—"}
              </div>
              <div className="text-sm font-medium text-right">
                {formatAmount(inv.totalTTC)} €
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(inv.invoiceDate)}
              </div>
              <div className="flex items-center justify-end gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => handleConvertOne(inv.id)}
                  disabled={convertingOne || rejecting}
                  title="Valider"
                >
                  <CheckCircle2 size={15} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleRejectOne(inv.id)}
                  disabled={convertingOne || rejecting}
                  title="Rejeter"
                >
                  <XCircle size={15} />
                </Button>
              </div>
            </div>

            {/* Mobile row */}
            <div className="md:hidden px-4 py-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={importedSelection.has(inv.id)}
                  onCheckedChange={() => toggleOne(inv.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Mail size={13} className="text-amber-500 shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {inv.vendor?.name || "Fournisseur inconnu"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {inv.originalInvoiceNumber &&
                      `${inv.originalInvoiceNumber} · `}
                    {formatDate(inv.invoiceDate)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatAmount(inv.totalTTC)} €
                  </div>
                  <div className="flex gap-1 mt-1 justify-end">
                    <button
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      onClick={() => handleConvertOne(inv.id)}
                      disabled={convertingOne || rejecting}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                      onClick={() => handleRejectOne(inv.id)}
                      disabled={convertingOne || rejecting}
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status, small }) {
  const config = {
    TO_PROCESS: {
      label: "À traiter",
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    },
    TO_PAY: {
      label: "À payer",
      className:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    },
    PENDING: {
      label: "En attente",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    PAID: {
      label: "Payée",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    OVERDUE: {
      label: "En retard",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    ARCHIVED: {
      label: "Archivée",
      className: "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-500",
    },
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
