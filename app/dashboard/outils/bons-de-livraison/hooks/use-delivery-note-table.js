"use client";

import { useMemo, useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  ArrowUpDown,
  Clock,
  CheckCircle,
  FileText,
  XCircle,
  Truck,
} from "lucide-react";
import { dateSortingFn } from "@/src/lib/document-dates";
import { cn } from "@/src/lib/utils";
import {
  DELIVERY_NOTE_STATUS_LABELS,
  useDeleteDeliveryNote,
} from "@/src/graphql/deliveryNoteQueries";
import { formatDate } from "@/app/dashboard/outils/bons-commande/utils/date-utils";
import DeliveryNoteRowActions from "../components/delivery-note-row-actions";
import { EmailTrackingStatus } from "@/src/components/email-tracking-status";
import { toast } from "@/src/components/ui/sonner";
import { usePersistentColumnVisibility } from "@/src/hooks/usePersistentColumnVisibility";

const statusFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId);
  return filterValue.includes(status);
};

// Formater les dates dans différents formats pour la recherche
const formatDateForSearch = (dateValue) => {
  if (!dateValue) return [];
  try {
    let date;
    if (typeof dateValue === "string") {
      date = /^\d+$/.test(dateValue)
        ? new Date(parseInt(dateValue, 10))
        : new Date(dateValue);
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
      `${day}/${month}`,
      `${month}/${year}`,
    ];
  } catch {
    return [];
  }
};

const multiColumnFilter = (row, columnId, filterValue) => {
  const dn = row.original;
  const searchableContent = [
    dn.number,
    dn.prefix && dn.number ? `${dn.prefix}-${dn.number}` : null,
    dn.client?.name,
    dn.client?.email,
    dn.carrier,
    dn.trackingNumber,
    dn.receivedBy,
    DELIVERY_NOTE_STATUS_LABELS[dn.status],
    ...(dn.issueDate ? formatDateForSearch(dn.issueDate) : []),
    ...(dn.deliveryDate ? formatDateForSearch(dn.deliveryDate) : []),
  ]
    .filter(Boolean)
    .map((s) => s.toString().toLowerCase().trim());

  const searchTerm = (filterValue ?? "").toLowerCase().trim();
  return searchableContent.some((content) => content.includes(searchTerm));
};

const clientFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const clientName = row.original.client?.name;
  if (!clientName) return false;
  return filterValue.includes(clientName);
};

const dateFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.from && !filterValue?.to) return true;
  const issueDate = row.original.issueDate;
  if (!issueDate) return false;
  const date = new Date(
    typeof issueDate === "string" && /^\d+$/.test(issueDate)
      ? parseInt(issueDate, 10)
      : issueDate,
  );
  date.setHours(0, 0, 0, 0);
  if (filterValue.from) {
    const from = new Date(filterValue.from);
    from.setHours(0, 0, 0, 0);
    if (date < from) return false;
  }
  if (filterValue.to) {
    const to = new Date(filterValue.to);
    to.setHours(23, 59, 59, 999);
    if (date > to) return false;
  }
  return true;
};

const STATUS_BADGES = {
  DRAFT: {
    icon: <FileText className="w-3 h-3" />,
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
  },
  PENDING: {
    icon: <Clock className="w-3 h-3" />,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  },
  SHIPPED: {
    icon: <Truck className="w-3 h-3" />,
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  },
  DELIVERED: {
    icon: <CheckCircle className="w-3 h-3" />,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  },
  CANCELED: {
    icon: <XCircle className="w-3 h-3" />,
    className: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  },
};

// Badge de statut partagé (tableau, sidebar)
export function DeliveryNoteStatusBadge({ status, className }) {
  const config = STATUS_BADGES[status] || {
    icon: <FileText className="w-3 h-3" />,
    className:
      "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
        config.className,
        className,
      )}
    >
      {config.icon}
      {DELIVERY_NOTE_STATUS_LABELS[status] || status}
    </span>
  );
}

export function useDeliveryNoteTable({
  data = [],
  onRefetch,
  onSendEmail,
  onOpenSidebar,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [clientFilter, setClientFilter] = useState([]);
  const [dateFilter, setDateFilter] = useState(null);
  const [columnVisibility, setColumnVisibility] = usePersistentColumnVisibility(
    "newbi:column-visibility:delivery-notes",
    { trackingNumber: false },
  );

  const { deleteDeliveryNote, loading: isDeleting } = useDeleteDeliveryNote();

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
            aria-label="Sélectionner tout"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Sélectionner la ligne"
          />
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
        meta: { label: "Sélection" },
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
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </div>
        ),
        meta: { label: "Client" },
        filterFn: "client",
        enableHiding: false,
        cell: ({ row }) => {
          const dn = row.original;
          const clientName = dn.client?.name || "Non défini";
          const reference =
            dn.status !== "DRAFT" && dn.number
              ? dn.prefix
                ? `${dn.prefix.replace(/-$/, "")}-${dn.number}`
                : dn.number
              : null;
          return (
            <div className="min-h-[40px] flex items-center gap-2">
              <div className="flex flex-col justify-center min-w-0">
                <div
                  className="font-normal max-w-[100px] md:max-w-none truncate"
                  title={clientName}
                >
                  {dn.client?.name || (
                    <span className="text-muted-foreground italic">
                      Non défini
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate max-w-[100px] md:max-w-none">
                  {reference || <span className="italic">Brouillon</span>}
                </div>
              </div>
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: "issueDate",
        sortingFn: dateSortingFn,
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date d&apos;émission
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </div>
        ),
        meta: { label: "Date d'émission" },
        filterFn: "dateRange",
        cell: ({ row }) => formatDate(row.getValue("issueDate")),
        size: 120,
      },
      {
        accessorKey: "deliveryDate",
        sortingFn: dateSortingFn,
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date de livraison
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </div>
        ),
        meta: { label: "Date de livraison" },
        cell: ({ row }) => {
          const value = row.original.deliveryDate;
          if (!value) {
            return (
              <div className="text-muted-foreground text-sm">Non définie</div>
            );
          }
          return formatDate(value);
        },
        size: 130,
      },
      {
        accessorKey: "carrier",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Transporteur
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </div>
        ),
        meta: { label: "Transporteur" },
        cell: ({ row }) =>
          row.original.carrier ? (
            <div className="truncate max-w-[140px]" title={row.original.carrier}>
              {row.original.carrier}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        size: 130,
      },
      {
        accessorKey: "trackingNumber",
        header: () => <div className="font-normal">N° de suivi</div>,
        meta: { label: "N° de suivi" },
        enableSorting: false,
        cell: ({ row }) =>
          row.original.trackingNumber ? (
            <div
              className="truncate max-w-[140px] font-mono text-xs"
              title={row.original.trackingNumber}
            >
              {row.original.trackingNumber}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        size: 130,
      },
      {
        id: "itemsCount",
        accessorFn: (row) => row.items?.length || 0,
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Articles
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </div>
        ),
        meta: { label: "Articles" },
        cell: ({ row }) => {
          const items = row.original.items || [];
          const totalQty = items.reduce(
            (sum, item) =>
              sum +
              (parseFloat(
                item.deliveredQuantity != null
                  ? item.deliveredQuantity
                  : item.quantity,
              ) || 0),
            0,
          );
          return (
            <div className="text-sm">
              {items.length} ligne{items.length > 1 ? "s" : ""}
              <span className="text-xs text-muted-foreground">
                {" "}
                · {new Intl.NumberFormat("fr-FR").format(totalQty)} unité
                {totalQty > 1 ? "s" : ""}
              </span>
            </div>
          );
        },
        size: 140,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Statut
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </div>
        ),
        meta: { label: "Statut" },
        cell: ({ row }) => (
          <DeliveryNoteStatusBadge status={row.getValue("status")} />
        ),
        size: 110,
        filterFn: statusFilterFn,
      },
      {
        id: "emailTracking",
        header: () => (
          <div className="flex items-center font-normal">Suivi</div>
        ),
        meta: { label: "Suivi" },
        cell: ({ row }) => (
          <div className="flex items-center">
            <EmailTrackingStatus emailTracking={row.original.emailTracking} />
          </div>
        ),
        size: 90,
        enableSorting: false,
      },
      {
        id: "actions",
        header: () => <div className="text-right font-normal">Actions</div>,
        cell: ({ row }) => (
          <DeliveryNoteRowActions
            row={row}
            onRefetch={onRefetch}
            onSendEmail={onSendEmail}
            onOpenSidebar={onOpenSidebar}
          />
        ),
        size: 60,
        enableHiding: false,
      },
    ],
    [onRefetch, onSendEmail, onOpenSidebar],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    autoResetPageIndex: false,
    enableMultiRemove: true,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: multiColumnFilter,
    state: {
      globalFilter,
      columnVisibility,
      columnFilters: [
        ...(statusFilter.length > 0
          ? [{ id: "status", value: statusFilter }]
          : []),
        ...(clientFilter.length > 0
          ? [{ id: "client", value: clientFilter }]
          : []),
        ...(dateFilter ? [{ id: "issueDate", value: dateFilter }] : []),
      ],
    },
    filterFns: {
      status: statusFilterFn,
      client: clientFilterFn,
      dateRange: dateFilterFn,
    },
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);

  // Suppression groupée : seuls les brouillons peuvent être supprimés
  const handleDeleteSelected = async () => {
    const drafts = selectedRows.filter((dn) => dn.status === "DRAFT");

    if (drafts.length === 0) {
      toast.error(
        "Seuls les bons de livraison en brouillon peuvent être supprimés",
      );
      return;
    }

    if (drafts.length < selectedRows.length) {
      toast.warning(
        `${selectedRows.length - drafts.length} bon(s) de livraison ignoré(s) (non brouillon)`,
      );
    }

    const BATCH_SIZE = 5;
    for (let i = 0; i < drafts.length; i += BATCH_SIZE) {
      const batch = drafts.slice(i, i + BATCH_SIZE);
      try {
        await Promise.all(batch.map((dn) => deleteDeliveryNote(dn.id)));
      } catch {
        toast.error(
          `Erreur lors de la suppression du lot ${i / BATCH_SIZE + 1}`,
        );
      }
    }

    toast.success(`${drafts.length} bon(s) de livraison supprimé(s)`);
    table.resetRowSelection();
    onRefetch?.();
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
