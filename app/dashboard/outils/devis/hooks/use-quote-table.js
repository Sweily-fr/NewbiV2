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
  useDeleteQuote,
} from "@/src/graphql/quoteQueries";
import { formatDate, isDateExpired } from "../utils/date-utils";
import QuoteRowActions from "../components/quote-row-actions";
import { toast } from "@/src/components/ui/sonner";

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

// Formater les dates dans différents formats pour la recherche
const formatDateForSearch = (dateValue) => {
  if (!dateValue) return [];

  try {
    // Gérer différents types de dates (string, nombre, Date)
    let date;
    if (typeof dateValue === "string") {
      // Si c'est un timestamp en millisecondes (string de chiffres)
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

    // Formats de date pour la recherche
    return [
      // Format d'affichage dans le tableau (JJ/MM/AAAA)
      `${day}/${month}/${year}`,
      // Format ISO (AAAA-MM-JJ)
      `${year}-${month}-${day}`,
      // Format avec tirets (JJ-MM-AAAA)
      `${day}-${month}-${year}`,
      // Format partiel (JJ/MM)
      `${day}/${month}`,
      // Format partiel avec tirets (JJ-MM)
      `${day}-${month}`,
      // Format jour uniquement (JJ)
      `${day}`,
      // Format mois/année (MM/AAAA)
      `${month}/${year}`,
      // Format mois-année avec tirets (MM-AAAA)
      `${month}-${year}`,
      // Format texte en français
      date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      date.toLocaleDateString("fr-FR", { month: "2-digit", year: "numeric" }),
    ].filter(
      (value, index, self) =>
        // Supprimer les doublons et valeurs vides
        value && self.indexOf(value) === index
    );
  } catch (error) {
    console.error("Erreur de formatage de date:", error);
    return [];
  }
};

// Formater le montant pour la recherche (supprime les espaces et convertit la virgule en point)
const formatAmountForSearch = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return [];

  // Convertir en nombre si ce n'est pas déjà le cas
  const numAmount = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(numAmount)) return [];

  // Formater avec 2 décimales et sans séparateur de milliers
  const formattedWithComma = numAmount.toFixed(2).replace(/\.?0+$/, ""); // Enlève les zéros inutiles

  // Retourner différents formats pour la recherche
  return [
    formattedWithComma, // Format avec virgule (ex: "1234,56")
    formattedWithComma.replace(",", "."), // Format avec point (ex: "1234.56")
    formattedWithComma.replace(",", ""), // Format sans séparateur (ex: "123456")
    Math.floor(numAmount).toString(), // Partie entière (ex: "1234")
    numAmount.toString(), // Représentation brute
  ].filter(
    (value, index, self) => value && self.indexOf(value) === index // Supprimer les doublons
  );
};

// Mémoize filter functions to prevent recreation on each render
const memoizedMultiColumnFilter = (row, columnId, filterValue) => {
  const quote = row.original;
  const searchableContent = [
    quote.number, // Numéro de devis
    quote.client?.name, // Nom du client
    quote.client?.email, // Email du client
    QUOTE_STATUS_LABELS[quote.status], // Statut traduit
    ...(quote.issueDate ? formatDateForSearch(quote.issueDate) : []), // Dates d'émission
    ...(quote.validUntil ? formatDateForSearch(quote.validUntil) : []), // Dates de validité
    ...(quote.finalTotalTTC !== undefined && quote.finalTotalTTC !== null
      ? formatAmountForSearch(quote.finalTotalTTC)
      : []), // Montant TTC
  ]
    .filter(Boolean)
    .map((s) => s.toString().toLowerCase().trim());

  const searchTerm = (filterValue ?? "").toLowerCase().trim();

  // Vérifier si le terme de recherche correspond à l'un des éléments
  return searchableContent.some((content) => content.includes(searchTerm));
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
        size: 28,
        enableSorting: false,
        enableHiding: false,
        meta: {
          label: "Sélection",
        },
      },
      // {
      //   accessorKey: "number",
      //   header: ({ column }) => (
      //     <div className="flex items-center font-normal px-0 py-2">
      //       <div
      //         className="flex items-center cursor-pointer"
      //         onClick={() =>
      //           column.toggleSorting(column.getIsSorted() === "asc")
      //         }
      //       >
      //         Numéro
      //         <ArrowUpDown className="ml-2 h-4 w-4" />
      //       </div>
      //     </div>
      //   ),
      //   meta: {
      //     label: "Numéro de devis"
      //   },
      //   cell: ({ row }) => {
      //     const quote = row.original;
      //     return (
      //       <div className="text-sm">
      //         {quote.number || (
      //           <span className="text-muted-foreground italic">Brouillon</span>
      //         )}
      //       </div>
      //     );
      //   },
      //   size: 120,
      //   filterFn: multiColumnFilterFn,
      //   enableHiding: false,
      // },
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
        enableHiding: false,
        cell: ({ row }) => {
          const client = row.original.client;
          const quote = row.original;
          const clientName = client?.name || "Non défini";
          return (
            <div>
              <div 
                className="font-normal max-w-[100px] md:max-w-none truncate" 
                title={clientName}
              >
                {client?.name || (
                  <span className="text-muted-foreground italic">
                    Non défini
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate max-w-[100px] md:max-w-none">
                {quote.number || (
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
              Date d'émission
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </div>
          </div>
        ),
        meta: {
          label: "Date d'émission",
        },
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
          const dateValue = row.original.validUntil; // Accéder directement à la valeur originale
          const quoteId = row.original.id;
          const quoteNumber = row.original.number;

          // Si la valeur est manquante, retourner un indicateur visuel
          if (
            dateValue === null ||
            dateValue === undefined ||
            dateValue === ""
          ) {
            return (
              <div className="text-muted-foreground text-sm">Non définie</div>
            );
          }

          try {
            // Utiliser la fonction formatDate pour gérer tous les formats de date
            const formattedDate = formatDate(dateValue);

            // Si formatDate retourne "-", la date est invalide
            if (formattedDate === "-") {
              throw new Error(
                `Format de date non supporté: ${dateValue} (${typeof dateValue})`
              );
            }

            // Vérifier si la date est expirée
            const isExpired = isDateExpired(dateValue);

            return (
              <div className={cn("text-sm", isExpired && "text-red-600")}>
                {formattedDate}
                {isExpired && (
                  <div className="text-xs text-red-500">Expiré</div>
                )}
              </div>
            );
          } catch (error) {
            console.error(
              `[QUOTE ${quoteNumber || quoteId}] Erreur lors du formatage de la date:`,
              {
                error: error.message,
                value: dateValue,
                type: typeof dateValue,
                isString: typeof dateValue === "string",
                isNumber: typeof dateValue === "number",
                isDate: dateValue instanceof Date,
                timestamp:
                  typeof dateValue === "number" || /^\d+$/.test(dateValue)
                    ? parseInt(dateValue, 10)
                    : "N/A",
              }
            );

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
          const label = QUOTE_STATUS_LABELS[status] || status;
          const colorClass = QUOTE_STATUS_COLORS[status] || "";

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
          const amount = row.getValue("finalTotalTTC");
          // Afficher 0€ si le montant est 0, et "-" seulement si undefined/null
          if (amount === undefined || amount === null || isNaN(amount)) return "-";
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
      // Afficher les 3 premiers devis pour inspection
      const sampleQuotes = data.slice(0, 3);

      sampleQuotes.forEach((quote, index) => {
        // Tester la conversion de la date
        if (quote.validUntil) {
          try {
            let date;

            // Gérer les différents formats de date
            if (
              typeof quote.validUntil === "number" ||
              /^\d+$/.test(quote.validUntil)
            ) {
              date = new Date(parseInt(quote.validUntil, 10));
            } else {
              date = new Date(quote.validUntil);
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
      columnFilters:
        statusFilter.length > 0 ? [{ id: "status", value: statusFilter }] : [],
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
  const selectedRows = selectedRowsModel.rows.map((row) => row.original);

  // Handle bulk delete - optimized with batching
  const handleDeleteSelected = async () => {
    const draftQuotes = selectedRows.filter(
      (quote) => quote.status === "DRAFT"
    );

    if (draftQuotes.length === 0) {
      toast.error("Seuls les devis en brouillon peuvent être supprimés");
      return;
    }

    if (draftQuotes.length < selectedRows.length) {
      toast.warning(
        `${selectedRows.length - draftQuotes.length} devis ignoré(s) (non brouillon)`
      );
    }

    // Process in chunks to avoid overwhelming the browser
    const BATCH_SIZE = 5;
    for (let i = 0; i < draftQuotes.length; i += BATCH_SIZE) {
      const batch = draftQuotes.slice(i, i + BATCH_SIZE);
      try {
        // Les notifications individuelles sont désactivées dans le hook GraphQL
        await Promise.all(batch.map((quote) => deleteQuote(quote.id)));
      } catch (error) {
        console.error("Error deleting batch:", error);
        toast.error(
          `Erreur lors de la suppression du lot ${i / BATCH_SIZE + 1}`
        );
      }
    }

    // Une seule notification à la fin
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
