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
  INVOICE_STATUS_LABELS, 
  INVOICE_STATUS_COLORS,
  useDeleteInvoice 
} from "@/src/graphql/invoiceQueries";
import InvoiceRowActions from "../components/invoice-row-actions";
import { toast } from "sonner";

// Custom filter functions
const multiColumnFilterFn = (row, columnId, filterValue) => {
  const searchableContent = [
    row.original.number,
    row.original.client?.name,
    row.original.client?.email,
    INVOICE_STATUS_LABELS[row.original.status],
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
    INVOICE_STATUS_LABELS[row.original.status],
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

export function useInvoiceTable({ data = [], onRefetch }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  
  // Memoize deleteInvoice to prevent recreation
  const { mutate: deleteInvoice } = useDeleteInvoice({
    onSettled: () => {
      onRefetch?.();
    }
  });

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
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Numéro
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div className="font-medium">
              {invoice.number || (
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
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Client
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const client = row.original.client;
          return (
            <div>
              <div className="font-medium">
                {client?.name || (
                  <span className="text-muted-foreground italic">Non défini</span>
                )}
              </div>
              {client?.email && (
                <div className="text-sm text-muted-foreground">
                  {client.email}
                </div>
              )}
            </div>
          );
        },
        size: 200,
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
          return date ? new Date(date).toLocaleDateString("fr-FR") : "-";
        },
        size: 120,
      },
      {
        accessorKey: "dueDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Échéance
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.getValue("dueDate");
          if (!date) return "-";
          
          const dueDate = new Date(date);
          const today = new Date();
          const isOverdue = dueDate < today && row.original.status === "PENDING";
          
          return (
            <div className={cn(
              isOverdue && "text-destructive font-medium"
            )}>
              {dueDate.toLocaleDateString("fr-FR")}
              {isOverdue && (
                <div className="text-xs">En retard</div>
              )}
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => {
          const status = row.getValue("status");
          const label = INVOICE_STATUS_LABELS[status] || status;
          const colorClass = INVOICE_STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
          
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
        accessorKey: "totalAmount",
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
          const amount = row.getValue("totalAmount");
          return amount ? (
            <div className="font-medium">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(amount)}
            </div>
          ) : "-";
        },
        size: 120,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => <InvoiceRowActions row={row} />,
        size: 60,
        enableHiding: false,
      },
    ],
    [] // Pas de dépendances pour éviter les re-créations inutiles
  );

  // Create table instance with optimized settings
  const table = useReactTable({
    data,
    columns,
    // Enable manual pagination and filtering on server-side if needed
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    
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
    const draftInvoices = selectedRows.filter(invoice => invoice.status === "DRAFT");
    
    if (draftInvoices.length === 0) {
      toast.error("Seules les factures en brouillon peuvent être supprimées");
      return;
    }

    if (draftInvoices.length < selectedRows.length) {
      toast.warning(`${selectedRows.length - draftInvoices.length} facture(s) ignorée(s) (non brouillon)`);
    }

    // Process in chunks to avoid overwhelming the browser
    const BATCH_SIZE = 5;
    for (let i = 0; i < draftInvoices.length; i += BATCH_SIZE) {
      const batch = draftInvoices.slice(i, i + BATCH_SIZE);
      try {
        await Promise.all(
          batch.map(invoice => 
            deleteInvoice({ 
              variables: { id: invoice.id },
              // Optimistic update
              optimisticResponse: {
                deleteInvoice: { id: invoice.id, __typename: 'Invoice' }
              },
              update: (cache) => {
                cache.evict({ id: `Invoice:${invoice.id}` });
              }
            })
          )
        );
      } catch (error) {
        console.error("Error deleting batch:", error);
        toast.error(`Erreur lors de la suppression du lot ${i / BATCH_SIZE + 1}`);
      }
    }
    
    toast.success(`${draftInvoices.length} facture(s) supprimée(s)`);
    table.resetRowSelection();
  };

  return {
    table,
    globalFilter,
    setGlobalFilter,
    statusFilter,
    setStatusFilter,
    selectedRows,
    handleDeleteSelected,
  };
}
