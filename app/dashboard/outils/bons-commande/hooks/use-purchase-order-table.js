"use client";

import { useMemo, useState, useEffect } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Button } from "@/src/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_COLORS,
  useDeletePurchaseOrder,
} from "@/src/graphql/purchaseOrderQueries";
import { formatDate, isDateExpired } from "../utils/date-utils";
import PurchaseOrderRowActions from "../components/purchase-order-row-actions";
import { toast } from "@/src/components/ui/sonner";

// Custom filter functions
const multiColumnFilterFn = (row, columnId, filterValue) => {
  const searchableContent = [
    row.original.number,
    row.original.client?.name,
    row.original.client?.email,
    PURCHASE_ORDER_STATUS_LABELS[row.original.status],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableContent.includes(searchTerm);
};

const statusFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId);
  return filterValue.includes(status);
};

// Formater les dates dans differents formats pour la recherche
const formatDateForSearch = (dateValue) => {
  if (!dateValue) return [];

  try {
    let date;
    if (typeof dateValue === "string") {
      if (/^\d+$/.test(dateValue)) {
        date = new Date(parseInt(dateValue, 10));
      } else {
        date = new Date(dateValue);
      }
    } else if (typeof dateValue === "number") {
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return [];
    }

    if (isNaN(date.getTime())) return [];

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return [
      `${day}/${month}/${year}`,
      `${year}-${month}-${day}`,
      `${day}-${month}-${year}`,
      `${day}/${month}`,
      `${day}-${month}`,
      `${day}`,
      `${month}/${year}`,
      `${month}-${year}`,
      date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      date.toLocaleDateString("fr-FR", { month: "2-digit", year: "numeric" }),
    ].filter(
      (value, index, self) =>
        value && self.indexOf(value) === index
    );
  } catch (error) {
    return [];
  }
};

// Formater le montant pour la recherche
const formatAmountForSearch = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return [];

  const numAmount = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(numAmount)) return [];

  const formattedWithComma = numAmount.toFixed(2).replace(/\.?0+$/, "");

  return [
    formattedWithComma,
    formattedWithComma.replace(",", "."),
    formattedWithComma.replace(",", ""),
    Math.floor(numAmount).toString(),
    numAmount.toString(),
  ].filter(
    (value, index, self) => value && self.indexOf(value) === index
  );
};

// Memoized filter functions to prevent recreation on each render
const memoizedMultiColumnFilter = (row, columnId, filterValue) => {
  const purchaseOrder = row.original;
  const searchableContent = [
    purchaseOrder.number,
    purchaseOrder.client?.name,
    purchaseOrder.client?.email,
    PURCHASE_ORDER_STATUS_LABELS[purchaseOrder.status],
    ...(purchaseOrder.issueDate ? formatDateForSearch(purchaseOrder.issueDate) : []),
    ...(purchaseOrder.deliveryDate ? formatDateForSearch(purchaseOrder.deliveryDate) : []),
    ...(purchaseOrder.finalTotalTTC !== undefined && purchaseOrder.finalTotalTTC !== null
      ? formatAmountForSearch(purchaseOrder.finalTotalTTC)
      : []),
  ]
    .filter(Boolean)
    .map((s) => s.toString().toLowerCase().trim());

  const searchTerm = (filterValue ?? "").toLowerCase().trim();

  return searchableContent.some((content) => content.includes(searchTerm));
};

const memoizedStatusFilter = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId);
  return filterValue.includes(status);
};

// Client filter function
const clientFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const clientName = row.original.client?.name;
  if (!clientName) return false;
  return filterValue.includes(clientName);
};

// Date filter function
const dateFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.from && !filterValue?.to) return true;

  const issueDate = row.original.issueDate;
  if (!issueDate) return false;

  const date = new Date(typeof issueDate === 'string' ? parseInt(issueDate) : issueDate);
  date.setHours(0, 0, 0, 0);

  if (filterValue.from && filterValue.to) {
    const from = new Date(filterValue.from);
    from.setHours(0, 0, 0, 0);
    const to = new Date(filterValue.to);
    to.setHours(23, 59, 59, 999);
    return date >= from && date <= to;
  } else if (filterValue.from) {
    const from = new Date(filterValue.from);
    from.setHours(0, 0, 0, 0);
    return date >= from;
  } else if (filterValue.to) {
    const to = new Date(filterValue.to);
    to.setHours(23, 59, 59, 999);
    return date <= to;
  }
  return true;
};

export function usePurchaseOrderTable({ data = [], onRefetch }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [clientFilter, setClientFilter] = useState([]);
  const [dateFilter, setDateFilter] = useState(null);

  // Hook pour la suppression de bons de commande
  const { deletePurchaseOrder, loading: isDeleting } = useDeletePurchaseOrder();

  // Define columns
  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Selectionner tout"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Selectionner la ligne"
          />
        ),
        size: 28,
        enableSorting: false,
        enableHiding: false,
        meta: {
          label: "Selection",
        },
      },
      {
        id: "client",
        accessorKey: "client.name",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Client
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        meta: {
          label: "Client",
        },
        filterFn: "client",
        enableHiding: false,
        cell: ({ row }) => {
          const client = row.original.client;
          const purchaseOrder = row.original;
          const clientName = client?.name || "Non defini";
          return (
            <div>
              <div
                className="font-normal max-w-[100px] md:max-w-none truncate"
                title={clientName}
              >
                {client?.name || (
                  <span className="text-muted-foreground italic">
                    Non defini
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate max-w-[100px] md:max-w-none">
                {purchaseOrder.number || (
                  <span className="italic">Brouillon</span>
                )}
              </div>
            </div>
          );
        },
        size: 200,
        filterFn: multiColumnFilterFn,
      },
      {
        accessorKey: "issueDate",
        header: ({ column }) => (
          <div className="flex items-center font-normal px-0 py-2">
            <div
              className="flex items-center cursor-pointer"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Date d'emission
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </div>
          </div>
        ),
        meta: {
          label: "Date d'emission",
        },
        filterFn: "dateRange",
        cell: ({ row }) => {
          const dateString = row.getValue("issueDate");
          return formatDate(dateString);
        },
        size: 120,
      },
      {
        accessorKey: "validUntil",
        header: ({ column }) => (
          <div className="flex items-center font-normal px-0 py-2">
            <div
              className="flex items-center cursor-pointer"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Date de validité
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </div>
          </div>
        ),
        meta: {
          label: "Date de validité",
        },
        cell: ({ row }) => {
          const dateValue = row.original.validUntil;

          if (
            dateValue === null ||
            dateValue === undefined ||
            dateValue === ""
          ) {
            return (
              <div className="text-muted-foreground text-sm">Non définie</div>
            );
          }

          const formattedDate = formatDate(dateValue);
          const isExpired = isDateExpired(dateValue);

          return (
            <div className={cn("text-sm", isExpired && "text-red-600")}>
              {formattedDate}
              {isExpired && (
                <div className="text-xs text-red-500">Expirée</div>
              )}
            </div>
          );
        },
        size: 130,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Statut
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        meta: {
          label: "Statut",
        },
        cell: ({ row }) => {
          const status = row.getValue("status");
          const label = PURCHASE_ORDER_STATUS_LABELS[status] || status;
          const colorClass = PURCHASE_ORDER_STATUS_COLORS[status] || "";

          return (
            <Badge className={cn("font-normal", colorClass)}>{label}</Badge>
          );
        },
        size: 100,
        filterFn: statusFilterFn,
      },
      {
        accessorKey: "finalTotalTTC",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-normal"
          >
            Montant TTC
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        meta: {
          label: "Montant TTC",
        },
        cell: ({ row }) => {
          const purchaseOrder = row.original;
          const escompteValue = parseFloat(purchaseOrder.escompte) || 0;

          let amount = purchaseOrder.finalTotalTTC;

          if (amount === undefined || amount === null || isNaN(amount)) return "-";

          if (escompteValue > 0) {
            const totalHT = purchaseOrder.finalTotalHT || (purchaseOrder.totalHT || 0);
            const totalVAT = purchaseOrder.finalTotalVAT || (purchaseOrder.totalVAT || 0);

            const escompteAmount = (totalHT * escompteValue) / 100;
            const htAfterEscompte = totalHT - escompteAmount;
            const tvaAfterEscompte = purchaseOrder.isReverseCharge ? 0 : (htAfterEscompte / totalHT) * totalVAT;
            amount = htAfterEscompte + tvaAfterEscompte;
          }

          return (
            <div className="font-normal">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(amount)}
            </div>
          );
        },
        size: 120,
      },
      {
        id: "actions",
        header: () => <div className="text-right font-normal">Actions</div>,
        cell: ({ row }) => <PurchaseOrderRowActions row={row} onRefetch={onRefetch} />,
        size: 60,
        enableHiding: false,
      },
    ],
    [onRefetch]
  );

  // Log des donnees pour debogage
  useEffect(() => {
    if (data && data.length > 0) {
      const samplePurchaseOrders = data.slice(0, 3);

      samplePurchaseOrders.forEach((purchaseOrder, index) => {
        if (purchaseOrder.deliveryDate) {
          try {
            let date;

            if (
              typeof purchaseOrder.deliveryDate === "number" ||
              /^\d+$/.test(purchaseOrder.deliveryDate)
            ) {
              date = new Date(parseInt(purchaseOrder.deliveryDate, 10));
            } else {
              date = new Date(purchaseOrder.deliveryDate);
            }
          } catch {
            // Date conversion error - silently handled
          }
        }
      });
    }
  }, [data]);

  // Create table instance with optimized settings
  const table = useReactTable({
    data,
    columns,
    manualPagination: false,
    manualFiltering: false,
    manualSorting: false,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    debugTable: false,
    autoResetPageIndex: false,
    enableMultiRemove: true,

    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: memoizedMultiColumnFilter,
    state: {
      globalFilter,
      columnFilters: [
        ...(statusFilter.length > 0 ? [{ id: "status", value: statusFilter }] : []),
        ...(clientFilter.length > 0 ? [{ id: "client", value: clientFilter }] : []),
        ...(dateFilter ? [{ id: "issueDate", value: dateFilter }] : []),
      ],
    },
    filterFns: {
      status: memoizedStatusFilter,
      client: clientFilterFn,
      dateRange: dateFilterFn,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Get selected rows
  const selectedRowsModel = table.getFilteredSelectedRowModel();
  const selectedRows = selectedRowsModel.rows.map((row) => row.original);

  // Handle bulk delete - only DRAFT purchase orders can be deleted
  const handleDeleteSelected = async () => {
    const draftPurchaseOrders = selectedRows.filter(
      (purchaseOrder) => purchaseOrder.status === "DRAFT"
    );

    if (draftPurchaseOrders.length === 0) {
      toast.error("Seuls les bons de commande en brouillon peuvent etre supprimes");
      return;
    }

    if (draftPurchaseOrders.length < selectedRows.length) {
      toast.warning(
        `${selectedRows.length - draftPurchaseOrders.length} bon(s) de commande ignore(s) (non brouillon)`
      );
    }

    // Process in chunks to avoid overwhelming the browser
    const BATCH_SIZE = 5;
    for (let i = 0; i < draftPurchaseOrders.length; i += BATCH_SIZE) {
      const batch = draftPurchaseOrders.slice(i, i + BATCH_SIZE);
      try {
        await Promise.all(batch.map((purchaseOrder) => deletePurchaseOrder(purchaseOrder.id)));
      } catch (error) {
        toast.error(
          `Erreur lors de la suppression du lot ${i / BATCH_SIZE + 1}`
        );
      }
    }

    toast.success(`${draftPurchaseOrders.length} bon(s) de commande supprime(s)`);
    table.resetRowSelection();

    if (onRefetch) {
      onRefetch();
    }
  };

  return {
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
  };
}
