"use client";

import { useMemo, useState } from "react";
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
  QUOTE_STATUS_LABELS, 
  QUOTE_STATUS_COLORS,
  useDeleteQuote 
} from "@/src/graphql/quoteQueries";
import QuoteRowActions from "../components/quote-row-actions";
import { toast } from "sonner";

// Custom filter functions
const multiColumnFilterFn = (row, columnId, filterValue) => {
  const searchableContent = [
    row.original.number,
    row.original.client?.name,
    row.original.client?.email,
    QUOTE_STATUS_LABELS[row.original.status],
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

// Mémoize filter functions to prevent recreation on each render
const memoizedMultiColumnFilter = (row, columnId, filterValue) => {
  const searchableContent = [
    row.original.number,
    row.original.client?.name,
    row.original.client?.email,
    QUOTE_STATUS_LABELS[row.original.status],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableContent.includes(searchTerm);
};

const memoizedStatusFilter = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId);
  return filterValue.includes(status);
};

export function useQuoteTable({ data = [], onRefetch }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  
  // Hook pour la suppression de devis
  const { deleteQuote, loading: isDeleting } = useDeleteQuote();

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
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
        size: 28,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "number",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Numéro
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const quote = row.original;
          return (
            <div className="font-medium">
              {quote.number || (
                <span className="text-muted-foreground italic">Brouillon</span>
              )}
            </div>
          );
        },
        size: 120,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
      },
      {
        accessorKey: "client.name",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Client
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const client = row.original.client;
          if (!client) return <span className="text-muted-foreground">-</span>;
          
          return (
            <div>
              <div className="font-medium">{client.name}</div>
              {client.email && (
                <div className="text-sm text-muted-foreground">{client.email}</div>
              )}
            </div>
          );
        },
        size: 200,
        filterFn: multiColumnFilterFn,
      },
      {
        accessorKey: "issueDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Date d'émission
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.getValue("issueDate");
          if (!date) return "-";
          return new Date(date).toLocaleDateString("fr-FR");
        },
        size: 120,
      },
      {
        accessorKey: "validUntil",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Valide jusqu'au
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.getValue("validUntil");
          if (!date) return "-";
          
          const validDate = new Date(date);
          const today = new Date();
          const isExpired = validDate < today;
          
          return (
            <div className={cn(
              "font-medium",
              isExpired && "text-red-600"
            )}>
              {validDate.toLocaleDateString("fr-FR")}
              {isExpired && (
                <div className="text-xs text-red-500">Expiré</div>
              )}
            </div>
          );
        },
        size: 130,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Statut
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const status = row.getValue("status");
          const label = QUOTE_STATUS_LABELS[status] || status;
          const colorClass = QUOTE_STATUS_COLORS[status] || "";
          
          return (
            <Badge className={cn("font-medium", colorClass)}>
              {label}
            </Badge>
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
            className="h-auto p-0 font-semibold"
          >
            Montant TTC
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const amount = row.getValue("finalTotalTTC");
          if (!amount || isNaN(amount)) return "-";
          return (
            <div className="font-medium">
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
        header: () => (
          <div className="text-right">Actions</div>
        ),
        cell: ({ row }) => <QuoteRowActions row={row} onRefetch={onRefetch} />,
        size: 60,
        enableHiding: false,
      },
    ],
    [onRefetch] // Inclure onRefetch dans les dépendances
  );

  // Create table instance with optimized settings
  const table = useReactTable({
    data,
    columns,
    // Enable client-side filtering and sorting
    manualPagination: false,
    manualFiltering: false,
    manualSorting: false,
    
    // Core models
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    
    // Optimize performance
    debugTable: false,
    autoResetPageIndex: false,
    enableMultiRemove: true,
    
    // Filtering
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: memoizedMultiColumnFilter,
    state: {
      globalFilter,
      columnFilters: statusFilter.length > 0 ? [
        { id: "status", value: statusFilter }
      ] : [],
    },
    // Use the memoized filter function
    filterFns: {
      status: memoizedStatusFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Get selected rows - simplified to avoid infinite loops
  const selectedRowsModel = table.getFilteredSelectedRowModel();
  const selectedRows = selectedRowsModel.rows.map(row => row.original);

  // Handle bulk delete - optimized with batching
  const handleDeleteSelected = async () => {
    const draftQuotes = selectedRows.filter(quote => quote.status === "DRAFT");
    
    if (draftQuotes.length === 0) {
      toast.error("Seuls les devis en brouillon peuvent être supprimés");
      return;
    }

    if (draftQuotes.length < selectedRows.length) {
      toast.warning(`${selectedRows.length - draftQuotes.length} devis ignoré(s) (non brouillon)`);
    }

    // Process in chunks to avoid overwhelming the browser
    const BATCH_SIZE = 5;
    for (let i = 0; i < draftQuotes.length; i += BATCH_SIZE) {
      const batch = draftQuotes.slice(i, i + BATCH_SIZE);
      try {
        await Promise.all(
          batch.map(quote => deleteQuote(quote.id))
        );
      } catch (error) {
        console.error("Error deleting batch:", error);
        toast.error(`Erreur lors de la suppression du lot ${i / BATCH_SIZE + 1}`);
      }
    }
    
    toast.success(`${draftQuotes.length} devis supprimé(s)`);
    table.resetRowSelection();
    
    // Actualiser la liste des devis
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
    selectedRows,
    handleDeleteSelected,
    isDeleting,
  };
}
