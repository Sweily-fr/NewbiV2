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
  useDeleteInvoice,
} from "@/src/graphql/invoiceQueries";
import InvoiceRowActions from "../components/invoice-row-actions";
import { toast } from "@/src/components/ui/sonner";

// Custom filter functions
const statusFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId);
  return filterValue.includes(status);
};

// Mémoize filter functions to prevent recreation on each render
const memoizedMultiColumnFilter = (row, columnId, filterValue) => {
  const invoice = row.original;
  const clientName = invoice.client?.name || "";
  const invoiceNumber = invoice.number || "";

  // Formater les dates dans différents formats pour la recherche
  const formatDate = (dateValue) => {
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
          // Supprimer les doublons
          value && self.indexOf(value) === index
      );
    } catch (error) {
      return [];
    }
  };

  // Récupérer les dates formatées
  const issueDates = invoice.issueDate ? formatDate(invoice.issueDate) : [];
  const dueDates = invoice.dueDate ? formatDate(invoice.dueDate) : [];

  // Récupérer les autres données
  const status = INVOICE_STATUS_LABELS[invoice.status] || "";
  const amount = invoice.finalTotalTTC ? invoice.finalTotalTTC.toString() : "";

  // Préparer le contenu de recherche
  const searchableContent = [
    clientName,
    invoiceNumber, // Numéro de facture exact
    ...issueDates,
    ...dueDates,
    status,
    amount.replace(/\./g, ","), // Montant avec virgule
    amount.replace(/\./g, ""), // Montant sans séparateur
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

export function useInvoiceTable({ data = [], onRefetch }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);

  // Hook pour la suppression de factures
  const { deleteInvoice, loading: isDeleting } = useDeleteInvoice();

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
      },
      // {
      //   accessorKey: "number",
      //   header: ({ column }) => (
      //     <div
      //       className="flex items-center cursor-pointer font-normal"
      //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      //     >
      //       Numéro
      //       <ArrowUpDown className="ml-2 h-4 w-4" />
      //     </div>
      //   ),
      //   cell: ({ row }) => {
      //     const invoice = row.original;
      //     return (
      //       <div className="font-medium">
      //         {invoice.number || (
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
        cell: ({ row }) => {
          const client = row.original.client;
          const invoice = row.original;
          return (
            <div>
              <div className="font-normal">
                {client?.name || (
                  <span className="text-muted-foreground italic">
                    Non défini
                  </span>
                )}
              </div>
              {invoice.number || (
                <span className="text-muted-foreground italic">Brouillon</span>
              )}
              {/* {client?.email && (
                <div className="text-sm text-muted-foreground">
                  {client.email}
                </div>
              )} */}
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: "issueDate",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date d'émission
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const dateFromGetter = row.getValue("issueDate");
          const dateFromOriginal = row.original.issueDate;
          const date = dateFromGetter || dateFromOriginal;

          if (!date) {
            return "-";
          }

          try {
            // Gérer différents formats de date
            let parsedDate;
            if (typeof date === "string") {
              // Vérifier si c'est un timestamp en millisecondes (string de chiffres)
              if (/^\d+$/.test(date)) {
                // Convertir le timestamp string en number puis en Date
                parsedDate = new Date(parseInt(date, 10));
              } else {
                // Sinon, essayer de parser comme date normale
                parsedDate = new Date(date);
              }
            } else if (typeof date === "number") {
              // Si c'est déjà un timestamp number
              parsedDate = new Date(date);
            } else if (date instanceof Date) {
              // Si c'est déjà un objet Date
              parsedDate = date;
            } else {
              return "-";
            }

            if (isNaN(parsedDate.getTime())) {
              return "-";
            }

            const formattedDate = parsedDate.toLocaleDateString("fr-FR");

            return formattedDate;
          } catch (error) {
            return "-";
          }
        },
        size: 120,
      },
      {
        accessorKey: "dueDate",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Échéance
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const dateFromGetter = row.getValue("dueDate");
          const dateFromOriginal = row.original.dueDate;
          const date = dateFromGetter || dateFromOriginal;

  

          if (!date) {
            return "-";
          }

          try {
            // Gérer différents formats de date
            let dueDate;
            if (typeof date === "string") {
              // Vérifier si c'est un timestamp en millisecondes (string de chiffres)
              if (/^\d+$/.test(date)) {
                // Convertir le timestamp string en number puis en Date
                dueDate = new Date(parseInt(date, 10));
              } else {
                // Sinon, essayer de parser comme date normale
                dueDate = new Date(date);
              }
            } else if (typeof date === "number") {
              // Si c'est déjà un timestamp number
              dueDate = new Date(date);
            } else if (date instanceof Date) {
              // Si c'est déjà un objet Date
              dueDate = date;
            } else {
           
              return "-";
            }

            if (isNaN(dueDate.getTime())) {
           
              return "-";
            }

            const today = new Date();
            const isOverdue =
              dueDate < today && row.original.status === "PENDING";

            const formattedDate = dueDate.toLocaleDateString("fr-FR");

            return (
              <div className={cn(isOverdue && "text-destructive font-medium")}>
                {formattedDate}
                {isOverdue && <div className="text-xs">En retard</div>}
              </div>
            );
          } catch (error) {
            return "-";
          }
        },
        size: 120,
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
        cell: ({ row }) => {
          const status = row.getValue("status");
          const label = INVOICE_STATUS_LABELS[status] || status;
          const colorClass = INVOICE_STATUS_COLORS[status] || "";

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
        cell: ({ row }) => {
          const amount = row.getValue("finalTotalTTC");
          if (!amount || isNaN(amount)) return "-";
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
        cell: ({ row }) => (
          <InvoiceRowActions row={row} onRefetch={onRefetch} />
        ),
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
    const draftInvoices = selectedRows.filter(
      (invoice) => invoice.status === "DRAFT"
    );

    if (draftInvoices.length === 0) {
      toast.error("Seules les factures en brouillon peuvent être supprimées");
      return;
    }

    if (draftInvoices.length < selectedRows.length) {
      toast.warning(
        `${selectedRows.length - draftInvoices.length} facture(s) ignorée(s) (non brouillon)`
      );
    }

    // Process in chunks to avoid overwhelming the browser
    const BATCH_SIZE = 5;
    for (let i = 0; i < draftInvoices.length; i += BATCH_SIZE) {
      const batch = draftInvoices.slice(i, i + BATCH_SIZE);
      try {
        await Promise.all(batch.map((invoice) => deleteInvoice(invoice.id)));
      } catch (error) {
        toast.error(
          `Erreur lors de la suppression du lot ${i / BATCH_SIZE + 1}`
        );
      }
    }

    toast.success(`${draftInvoices.length} facture(s) supprimée(s)`);
    table.resetRowSelection();

    // Actualiser la liste des factures
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
