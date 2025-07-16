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
  QUOTE_STATUS_LABELS, 
  QUOTE_STATUS_COLORS,
  useDeleteQuote 
} from "@/src/graphql/quoteQueries";
import { formatDate, isDateExpired } from "../utils/date-utils";
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
          <div className="flex items-center font-semibold px-0 py-2">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Numéro
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </div>
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
          <div className="flex items-center font-semibold px-0 py-2">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Client
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </div>
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
          <div className="flex items-center font-semibold px-0 py-2">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Date d&apos;émission
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </div>
          </div>
        ),
        cell: ({ row }) => {
          const dateString = row.getValue("issueDate");
          return formatDate(dateString);
        },
        size: 120,
      },
      {
        accessorKey: "validUntil",
        header: ({ column }) => (
          <div className="flex items-center font-semibold px-0 py-2">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Valide jusqu&apos;au
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </div>
          </div>
        ),
        cell: ({ row }) => {
          const dateValue = row.original.validUntil; // Accéder directement à la valeur originale
          const quoteId = row.original.id;
          const quoteNumber = row.original.number;
          
          // Si la valeur est manquante, retourner un indicateur visuel
          if (dateValue === null || dateValue === undefined || dateValue === '') {
            console.log(`[QUOTE ${quoteNumber || quoteId}] Champ validUntil manquant ou vide`);
            return (
              <div className="text-muted-foreground text-sm">
                Non définie
              </div>
            );
          }
          
          try {
            // Utiliser la fonction formatDate pour gérer tous les formats de date
            const formattedDate = formatDate(dateValue);
            
            // Si formatDate retourne "-", la date est invalide
            if (formattedDate === "-") {
              throw new Error(`Format de date non supporté: ${dateValue} (${typeof dateValue})`);
            }
            
            // Vérifier si la date est expirée
            const isExpired = isDateExpired(dateValue);
            
            return (
              <div className={cn(
                "font-medium",
                isExpired && "text-red-600"
              )}>
                {formattedDate}
                {isExpired && (
                  <div className="text-xs text-red-500">Expiré</div>
                )}
              </div>
            );
          } catch (error) {
            console.error(`[QUOTE ${quoteNumber || quoteId}] Erreur lors du formatage de la date:`, {
              error: error.message,
              value: dateValue,
              type: typeof dateValue,
              isString: typeof dateValue === 'string',
              isNumber: typeof dateValue === 'number',
              isDate: dateValue instanceof Date,
              timestamp: typeof dateValue === 'number' || /^\d+$/.test(dateValue) 
                ? parseInt(dateValue, 10) 
                : 'N/A'
            });
            
            return (
              <div className="text-amber-600 text-sm">
                Format invalide
                <div className="text-xs">ID: {quoteNumber || quoteId}</div>
              </div>
            );
          }
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

  // Log des données pour débogage
  useEffect(() => {
    if (data && data.length > 0) {
      console.log('=== DÉBOGAGE DONNÉES DEVIS ===');
      console.log('Nombre de devis:', data.length);
      
      // Afficher les 3 premiers devis pour inspection
      const sampleQuotes = data.slice(0, 3);
      
      sampleQuotes.forEach((quote, index) => {
        console.log(`\n=== Devis #${index + 1} ===`);
        console.log('ID:', quote.id);
        console.log('Numéro:', quote.number);
        console.log('Date émission:', quote.issueDate, 'Type:', typeof quote.issueDate);
        console.log('Valid until:', quote.validUntil, 'Type:', typeof quote.validUntil);
        
        // Tester la conversion de la date
        if (quote.validUntil) {
          try {
            let date;
            
            // Gérer les différents formats de date
            if (typeof quote.validUntil === 'number' || /^\d+$/.test(quote.validUntil)) {
              date = new Date(parseInt(quote.validUntil, 10));
            } else {
              date = new Date(quote.validUntil);
            }
            
            const isValid = !isNaN(date.getTime());
            
            console.log('Conversion date:', {
              isValid: isValid,
              timestamp: isValid ? date.getTime() : 'Invalid',
              localString: isValid ? date.toLocaleString('fr-FR') : 'Invalid',
              isoString: isValid ? date.toISOString() : 'Invalid'
            });
          } catch (error) {
            console.log('Erreur lors de la conversion de date:', error.message, 'Valeur:', quote.validUntil);
          }
        }
      });
      
      // Vérifier si validUntil existe dans les clés
      const firstQuote = data[0];
      if (firstQuote) {
        console.log('\n=== STRUCTURE DU PREMIER DEVIS ===');
        console.log('Clés disponibles:', Object.keys(firstQuote));
        console.log('validUntil existe:', 'validUntil' in firstQuote);
        console.log('validUntil valeur:', firstQuote.validUntil);
      }
    }
  }, [data]);

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
