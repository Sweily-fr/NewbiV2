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
import {
  ArrowUpDown,
  FileText,
  Clock,
  CheckCircle,
  Send,
  XCircle,
  Archive,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  useDeleteInvoice,
} from "@/src/graphql/invoiceQueries";
import {
  IMPORTED_INVOICE_STATUS_LABELS,
  IMPORTED_INVOICE_STATUS_COLORS,
  useDeleteImportedInvoice,
} from "@/src/graphql/importedInvoiceQueries";
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
    } catch (_) {
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

// Custom filter function for clients (filtre par nom pour inclure tous les clients avec le même nom)
const clientFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const clientName = row.original.client?.name;
  return clientName && filterValue.includes(clientName);
};

// Custom filter function for date range
const dateFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.from && !filterValue?.to) return true;

  const issueDate = row.original.issueDate;
  if (!issueDate) return false;

  const date = new Date(
    typeof issueDate === "string" ? parseInt(issueDate) : issueDate
  );
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

export function useInvoiceTable({
  data = [],
  onRefetch,
  onRefetchImported,
  reminderEnabled = false,
  onOpenReminderSettings,
  excludedClientIds = [],
  onOpenSidebar, // Callback pour ouvrir la sidebar au niveau du tableau
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [clientFilter, setClientFilter] = useState([]);
  const [dateFilter, setDateFilter] = useState(null);

  // Hook pour la suppression de factures
  const { deleteInvoice, loading: isDeleting } = useDeleteInvoice();
  const { deleteImportedInvoice, loading: isDeletingImported } =
    useDeleteImportedInvoice();

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
          const invoice = row.original;
          const isImported = invoice._type === "imported";
          const clientName =
            client?.name || (isImported ? "Client inconnu" : "Non défini");
          return (
            <div className="min-h-[40px] flex flex-col justify-center">
              <div
                className="font-normal max-w-[100px] md:max-w-none truncate"
                title={clientName}
              >
                {client?.name || (
                  <span className="text-muted-foreground italic">
                    {isImported ? "Client inconnu" : "Non défini"}
                  </span>
                )}
              </div>
              {!isImported && (
                <div className="text-xs text-muted-foreground truncate max-w-[100px] md:max-w-none">
                  {invoice.number || <span className="italic">Brouillon</span>}
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
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date d&apos;émission
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        meta: {
          label: "Date d'émission",
        },
        filterFn: "dateRange",
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
          } catch (_) {
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
        meta: {
          label: "Échéance",
        },
        cell: ({ row }) => {
          // Ne pas afficher d'échéance pour les factures importées
          if (row.original._type === "imported") {
            return <span className="text-muted-foreground">-</span>;
          }

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
          } catch (_) {
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
        meta: {
          label: "Statut",
        },
        cell: ({ row }) => {
          const status = row.getValue("status");
          const isImported = row.original._type === "imported";

          // Utiliser les labels appropriés selon le type
          const label = isImported
            ? IMPORTED_INVOICE_STATUS_LABELS[status] || status
            : INVOICE_STATUS_LABELS[status] || status;

          // Configuration des badges par statut (style transfert de fichier)
          const getStatusConfig = () => {
            if (isImported) {
              switch (status) {
                case "PENDING_REVIEW":
                  return {
                    icon: <Clock className="w-3 h-3" />,
                    className:
                      "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
                  };
                case "VALIDATED":
                  return {
                    icon: <CheckCircle className="w-3 h-3" />,
                    className:
                      "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
                  };
                case "REJECTED":
                  return {
                    icon: <XCircle className="w-3 h-3" />,
                    className:
                      "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
                  };
                case "ARCHIVED":
                  return {
                    icon: <Archive className="w-3 h-3" />,
                    className:
                      "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400",
                  };
                default:
                  return {
                    icon: <FileText className="w-3 h-3" />,
                    className:
                      "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400",
                  };
              }
            } else {
              switch (status) {
                case "DRAFT":
                  return {
                    icon: <FileText className="w-3 h-3" />,
                    className:
                      "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400",
                  };
                case "SENT":
                  return {
                    icon: <Send className="w-3 h-3" />,
                    className:
                      "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                  };
                case "PENDING":
                  return {
                    icon: <Clock className="w-3 h-3" />,
                    className:
                      "bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#5a50ff]/20 dark:text-[#5a50ff]",
                  };
                case "PAID":
                case "COMPLETED":
                  return {
                    icon: <CheckCircle className="w-3 h-3" />,
                    className:
                      "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
                  };
                case "CANCELLED":
                  return {
                    icon: <XCircle className="w-3 h-3" />,
                    className:
                      "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
                  };
                default:
                  return {
                    icon: <FileText className="w-3 h-3" />,
                    className:
                      "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400",
                  };
              }
            }
          };

          const config = getStatusConfig();

          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                config.className
              )}
            >
              {config.icon}
              {label}
            </span>
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
          const invoice = row.original;

          // Pour les factures importées, utiliser totalTTC directement
          if (invoice._type === "imported") {
            const amount = invoice.totalTTC || invoice.total || 0;
            return (
              <div className="font-normal">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: invoice.currency || "EUR",
                }).format(amount)}
              </div>
            );
          }

          const escompteValue = parseFloat(invoice.escompte) || 0;

          // Utiliser finalTotalTTC comme base (après remise mais avant escompte)
          let amount = invoice.finalTotalTTC;

          // Afficher "-" si undefined/null
          if (amount === undefined || amount === null || isNaN(amount))
            return "-";

          // Appliquer uniquement l'escompte pour afficher le Total TTC
          if (escompteValue > 0) {
            // Utiliser finalTotalHT et finalTotalVAT (après remise)
            const totalHT =
              invoice.finalTotalHT !== undefined &&
              invoice.finalTotalHT !== null
                ? invoice.finalTotalHT
                : invoice.totalHT || 0;
            const totalVAT =
              invoice.finalTotalVAT !== undefined &&
              invoice.finalTotalVAT !== null
                ? invoice.finalTotalVAT
                : invoice.totalVAT || 0;

            console.log("Invoice Table - Escompte calculation:", {
              invoiceId: invoice.id,
              finalTotalTTC: invoice.finalTotalTTC,
              finalTotalHT: invoice.finalTotalHT,
              finalTotalVAT: invoice.finalTotalVAT,
              totalHT,
              totalVAT,
              escompteValue,
            });

            // Appliquer l'escompte sur HT
            const escompteAmount = (totalHT * escompteValue) / 100;
            const htAfterEscompte = totalHT - escompteAmount;
            const tvaAfterEscompte = invoice.isReverseCharge
              ? 0
              : (htAfterEscompte / totalHT) * totalVAT;
            amount = htAfterEscompte + tvaAfterEscompte;

            console.log("Invoice Table - Result:", {
              escompteAmount,
              htAfterEscompte,
              tvaAfterEscompte,
              finalAmount: amount,
            });
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
        cell: ({ row }) => {
          const clientId = row.original.client?.id || row.original.client?._id;
          // Comparer en string pour éviter les problèmes de type
          const isClientExcluded =
            clientId &&
            excludedClientIds.some(
              (excludedId) => String(excludedId) === String(clientId)
            );

          return (
            <InvoiceRowActions
              row={row}
              onRefetch={onRefetch}
              showReminderIcon={
                reminderEnabled && row.original.status === "PENDING"
              }
              isClientExcluded={isClientExcluded}
              onOpenReminderSettings={onOpenReminderSettings}
              onOpenSidebar={onOpenSidebar}
            />
          );
        },
        size: 80,
        enableHiding: false,
      },
    ],
    [
      onRefetch,
      reminderEnabled,
      onOpenReminderSettings,
      excludedClientIds,
      onOpenSidebar,
    ] // Inclure toutes les dépendances
  );

  // Create table instance with optimized settings
  const table = useReactTable({
    data,
    columns,
    // Pagination côté client (toutes les données sont chargées)
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
    // Use the memoized filter function
    filterFns: {
      status: memoizedStatusFilter,
      client: clientFilterFn,
      dateRange: dateFilterFn,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  // Get selected rows - simplified to avoid infinite loops
  const selectedRowsModel = table.getFilteredSelectedRowModel();
  const selectedRows = selectedRowsModel.rows.map((row) => row.original);

  // Handle bulk delete - optimized with batching
  const handleDeleteSelected = async () => {
    // Séparer les factures normales (brouillons) et les factures importées
    const draftInvoices = selectedRows.filter(
      (invoice) => invoice._type !== "imported" && invoice.status === "DRAFT"
    );
    const importedInvoices = selectedRows.filter(
      (invoice) => invoice._type === "imported"
    );

    // Factures normales non-brouillon ignorées
    const ignoredNormalInvoices = selectedRows.filter(
      (invoice) => invoice._type !== "imported" && invoice.status !== "DRAFT"
    );

    if (draftInvoices.length === 0 && importedInvoices.length === 0) {
      toast.error(
        "Seules les factures en brouillon ou importées peuvent être supprimées"
      );
      return;
    }

    if (ignoredNormalInvoices.length > 0) {
      toast.warning(
        `${ignoredNormalInvoices.length} facture(s) ignorée(s) (non brouillon)`
      );
    }

    let deletedCount = 0;

    // Supprimer les factures normales (brouillons)
    const BATCH_SIZE = 5;
    for (let i = 0; i < draftInvoices.length; i += BATCH_SIZE) {
      const batch = draftInvoices.slice(i, i + BATCH_SIZE);
      try {
        await Promise.all(batch.map((invoice) => deleteInvoice(invoice.id)));
        deletedCount += batch.length;
      } catch (_) {
        toast.error(
          `Erreur lors de la suppression du lot ${i / BATCH_SIZE + 1}`
        );
      }
    }

    // Supprimer les factures importées
    for (let i = 0; i < importedInvoices.length; i += BATCH_SIZE) {
      const batch = importedInvoices.slice(i, i + BATCH_SIZE);
      try {
        await Promise.all(
          batch.map((invoice) =>
            deleteImportedInvoice({ variables: { id: invoice.id } })
          )
        );
        deletedCount += batch.length;
      } catch (_) {
        toast.error(`Erreur lors de la suppression des factures importées`);
      }
    }

    // Une seule notification à la fin
    if (deletedCount > 0) {
      toast.success(`${deletedCount} facture(s) supprimée(s)`);
    }
    table.resetRowSelection();

    // Actualiser la liste des factures
    if (onRefetch) {
      onRefetch();
    }
    // Actualiser aussi les factures importées si nécessaire
    if (importedInvoices.length > 0 && onRefetchImported) {
      onRefetchImported();
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
    isDeleting: isDeleting || isDeletingImported,
  };
}
