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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  ArrowUpDown,
  FileText,
  Clock,
  CheckCircle,
  Send,
  XCircle,
  Archive,
  Upload,
  CircleAlert,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  INVOICE_STATUS_LABELS,
  useDeleteInvoice,
} from "@/src/graphql/invoiceQueries";
import {
  IMPORTED_INVOICE_STATUS_LABELS,
  useDeleteImportedInvoice,
} from "@/src/graphql/importedInvoiceQueries";
import InvoiceRowActions from "../components/invoice-row-actions";
import { EmailTrackingStatus } from "@/src/components/email-tracking-status";
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
  const clientName = invoice.client?.name || invoice.vendor?.name || "";
  const invoiceNumber = invoice.number || invoice.originalInvoiceNumber || "";

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
          value && self.indexOf(value) === index,
      );
    } catch {
      return [];
    }
  };

  // Récupérer les dates formatées
  const issueDates = invoice.issueDate ? formatDate(invoice.issueDate) : [];
  const dueDates = invoice.dueDate ? formatDate(invoice.dueDate) : [];

  // Récupérer les autres données (supporter factures normales et importées)
  const isImported = invoice._type === "imported";
  const status = isImported
    ? IMPORTED_INVOICE_STATUS_LABELS[invoice.status] || ""
    : INVOICE_STATUS_LABELS[invoice.status] || "";
  const amount =
    invoice.finalTotalTTC || invoice.totalTTC || invoice.total
      ? (invoice.finalTotalTTC || invoice.totalTTC || invoice.total).toString()
      : "";

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

// Custom filter function for invoice type (normal vs imported)
const typeFilterFn = (row, columnId, filterValue) => {
  if (!filterValue) return true;
  return row.original._type === filterValue;
};

// Custom filter function for date range
const dateFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.from && !filterValue?.to) return true;

  const issueDate = row.original.issueDate;
  if (!issueDate) return false;

  let date;
  if (typeof issueDate === "string") {
    // Timestamp numérique en string (factures normales)
    if (/^\d+$/.test(issueDate)) {
      date = new Date(parseInt(issueDate, 10));
    } else {
      // Date ISO ou autre format string (factures importées)
      date = new Date(issueDate);
    }
  } else if (typeof issueDate === "number") {
    date = new Date(issueDate);
  } else {
    date = new Date(issueDate);
  }

  if (isNaN(date.getTime())) return false;
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
  onBalancesRefetch,
  reminderEnabled = false,
  onOpenReminderSettings,
  excludedClientIds = [],
  onOpenSidebar,
  onOpenImportedSidebar,
  onSendEmail,
  onSaveAsTemplate,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [clientFilter, setClientFilter] = useState([]);
  const [dateFilter, setDateFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState("");

  // Hook pour la suppression de factures
  const { deleteInvoice, loading: isDeleting } = useDeleteInvoice();
  const { deleteImportedInvoice, loading: isDeletingImported } =
    useDeleteImportedInvoice();

  // Define columns
  const columns = useMemo(
    () => [
      {
        id: "_type",
        accessorKey: "_type",
        filterFn: "invoiceType",
        enableColumnFilter: true,
        enableHiding: false,
        enableSorting: false,
        header: () => null,
        cell: () => null,
        size: 0,
      },
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
      },
      // {
      //   accessorKey: "number",
      //   header: ({ column }) => (
      //     <div
      //       className="flex items-center cursor-pointer font-normal"
      //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      //     >
      //       Numéro
      //       <ArrowUpDown className="ml-2 h-3 w-3" />
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
            <ArrowUpDown className="ml-2 h-3 w-3" />
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
            <div className="min-h-[40px] flex items-center gap-2">
              <div className="flex flex-col justify-center min-w-0">
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
                    {(invoice.prefix
                      ? `${invoice.prefix}${invoice.number}`
                      : invoice.number) || (
                      <span className="italic">Brouillon</span>
                    )}
                  </div>
                )}
              </div>
              {isImported && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 cursor-default">
                      <Upload className="w-3 h-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-[#202020] text-white border-none text-xs"
                  >
                    Facture importée
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: "purchaseOrderNumber",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Référence
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </div>
        ),
        meta: {
          label: "Référence",
        },
        cell: ({ row }) => {
          const reference = row.original.purchaseOrderNumber;
          if (!reference) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <div
              className="font-normal truncate max-w-[160px]"
              title={reference}
            >
              {reference}
            </div>
          );
        },
        size: 140,
      },
      {
        accessorKey: "finalTotalHT",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Montant HT
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </div>
        ),
        meta: {
          label: "Montant HT",
        },
        cell: ({ row }) => {
          const invoice = row.original;
          if (invoice._type === "imported") {
            const amount = invoice.totalHT || 0;
            return (
              <div className="font-normal">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: invoice.currency || "EUR",
                }).format(amount)}
              </div>
            );
          }
          const amount = invoice.finalTotalHT ?? invoice.totalHT;
          if (amount === undefined || amount === null || isNaN(amount))
            return "—";
          return (
            <div className="font-normal">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(amount)}
            </div>
          );
        },
        size: 110,
      },
      {
        accessorKey: "finalTotalVAT",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            TVA
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </div>
        ),
        meta: {
          label: "TVA",
        },
        cell: ({ row }) => {
          const invoice = row.original;
          if (invoice._type === "imported") {
            const amount = invoice.totalVAT || 0;
            return (
              <div className="font-normal">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: invoice.currency || "EUR",
                }).format(amount)}
              </div>
            );
          }
          const amount = invoice.finalTotalVAT ?? invoice.totalVAT;
          if (amount === undefined || amount === null || isNaN(amount))
            return "—";
          return (
            <div className="font-normal">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(amount)}
            </div>
          );
        },
        size: 100,
      },
      {
        accessorKey: "finalTotalTTC",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Montant TTC
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </div>
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

            // Appliquer l'escompte sur HT
            const escompteAmount = (totalHT * escompteValue) / 100;
            const htAfterEscompte = totalHT - escompteAmount;
            const tvaAfterEscompte = invoice.isReverseCharge
              ? 0
              : (htAfterEscompte / totalHT) * totalVAT;
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
        accessorKey: "issueDate",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date d&apos;émission
            <ArrowUpDown className="ml-2 h-3 w-3" />
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
          } catch {
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
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </div>
        ),
        meta: {
          label: "Échéance",
        },
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
            today.setHours(0, 0, 0, 0);
            const dueDateMidnight = new Date(dueDate);
            dueDateMidnight.setHours(0, 0, 0, 0);
            const status = row.original.status;
            const isImportedRow = row.original._type === "imported";
            // Les factures importées ne peuvent pas être en retard :
            // le statut VALIDATED indique qu'elles ont déjà été payées.
            const isOverdue =
              !isImportedRow && dueDateMidnight < today && status === "PENDING";

            const formattedDate = dueDate.toLocaleDateString("fr-FR");

            return (
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  isOverdue && "text-destructive font-medium",
                )}
              >
                {formattedDate}
                {isOverdue && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center justify-center flex-shrink-0">
                        <CircleAlert className="w-3.5 h-3.5 text-destructive" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-[#202020] text-white border-none text-xs"
                    >
                      En retard
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            );
          } catch {
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
            <ArrowUpDown className="ml-2 h-3 w-3" />
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
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                  };
                case "VALIDATED":
                  return {
                    icon: <CheckCircle className="w-3 h-3" />,
                    className:
                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
                  };
                case "REJECTED":
                  return {
                    icon: <XCircle className="w-3 h-3" />,
                    className:
                      "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                  };
                case "ARCHIVED":
                  return {
                    icon: <Archive className="w-3 h-3" />,
                    className:
                      "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
                  };
                default:
                  return {
                    icon: <FileText className="w-3 h-3" />,
                    className:
                      "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
                  };
              }
            } else {
              switch (status) {
                case "DRAFT":
                  return {
                    icon: <FileText className="w-3 h-3" />,
                    className:
                      "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
                  };
                case "SENT":
                  return {
                    icon: <Send className="w-3 h-3" />,
                    className:
                      "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                  };
                case "PENDING":
                  return {
                    icon: <Clock className="w-3 h-3" />,
                    className:
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                  };
                case "PAID":
                case "COMPLETED":
                  return {
                    icon: <CheckCircle className="w-3 h-3" />,
                    className:
                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
                  };
                case "CANCELLED":
                  return {
                    icon: <XCircle className="w-3 h-3" />,
                    className:
                      "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
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
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
                config.className,
              )}
            >
              {config.icon}
              {label}
            </span>
          );
        },
        size: 120,
        filterFn: statusFilterFn,
      },
      {
        id: "emailTracking",
        header: () => (
          <div className="flex items-center font-normal">Suivi</div>
        ),
        meta: {
          label: "Suivi",
        },
        cell: ({ row }) => {
          const emailTracking = row.original.emailTracking;
          return (
            <div className="flex items-center">
              <EmailTrackingStatus emailTracking={emailTracking} />
            </div>
          );
        },
        size: 100,
        enableSorting: false,
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
              (excludedId) => String(excludedId) === String(clientId),
            );

          return (
            <InvoiceRowActions
              row={row}
              onRefetch={() => {
                onRefetch?.();
                onBalancesRefetch?.();
              }}
              onRefetchImported={() => {
                onRefetchImported?.();
                onBalancesRefetch?.();
              }}
              showReminderIcon={
                reminderEnabled && row.original.status === "PENDING"
              }
              isClientExcluded={isClientExcluded}
              onOpenReminderSettings={onOpenReminderSettings}
              onOpenSidebar={onOpenSidebar}
              onOpenImportedSidebar={onOpenImportedSidebar}
              onSendEmail={onSendEmail}
              onSaveAsTemplate={onSaveAsTemplate}
            />
          );
        },
        size: 80,
        enableHiding: false,
      },
    ],
    [
      onRefetch,
      onRefetchImported,
      onBalancesRefetch,
      reminderEnabled,
      onOpenReminderSettings,
      excludedClientIds,
      onOpenSidebar,
      onOpenImportedSidebar,
      onSendEmail,
      onSaveAsTemplate,
    ],
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
        ...(typeFilter ? [{ id: "_type", value: typeFilter }] : []),
      ],
    },
    // Use the memoized filter function
    filterFns: {
      status: memoizedStatusFilter,
      client: clientFilterFn,
      dateRange: dateFilterFn,
      invoiceType: typeFilterFn,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
      columnVisibility: {
        finalTotalHT: false,
        finalTotalVAT: false,
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
      (invoice) => invoice._type !== "imported" && invoice.status === "DRAFT",
    );
    const importedInvoices = selectedRows.filter(
      (invoice) => invoice._type === "imported",
    );

    // Factures normales non-brouillon ignorées
    const ignoredNormalInvoices = selectedRows.filter(
      (invoice) => invoice._type !== "imported" && invoice.status !== "DRAFT",
    );

    if (draftInvoices.length === 0 && importedInvoices.length === 0) {
      toast.error(
        "Seules les factures en brouillon ou importées peuvent être supprimées",
      );
      return;
    }

    if (ignoredNormalInvoices.length > 0) {
      toast.warning(
        `${ignoredNormalInvoices.length} facture(s) ignorée(s) (non brouillon)`,
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
      } catch {
        toast.error(
          `Erreur lors de la suppression du lot ${i / BATCH_SIZE + 1}`,
        );
      }
    }

    // Supprimer les factures importées
    for (let i = 0; i < importedInvoices.length; i += BATCH_SIZE) {
      const batch = importedInvoices.slice(i, i + BATCH_SIZE);
      try {
        await Promise.all(
          batch.map((invoice) =>
            deleteImportedInvoice({ variables: { id: invoice.id } }),
          ),
        );
        deletedCount += batch.length;
      } catch {
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
    // Actualiser les soldes
    onBalancesRefetch?.();
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
    typeFilter,
    setTypeFilter,
    selectedRows,
    handleDeleteSelected,
    isDeleting: isDeleting || isDeletingImported,
  };
}
