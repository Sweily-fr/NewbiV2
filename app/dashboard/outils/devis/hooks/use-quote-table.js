"use client";

import { useMemo, useState, useEffect } from "react";
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
  XCircle,
  CircleAlert,
  Upload,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  QUOTE_STATUS_LABELS,
  useDeleteQuote,
} from "@/src/graphql/quoteQueries";
import { useDeleteImportedQuotes } from "@/src/graphql/importedQuoteQueries";
import { formatDate, isDateExpired } from "../utils/date-utils";
import QuoteRowActions from "../components/quote-row-actions";
import { EmailTrackingStatus } from "@/src/components/email-tracking-status";
import { toast } from "@/src/components/ui/sonner";
import { usePersistentColumnVisibility } from "@/src/hooks/usePersistentColumnVisibility";

// Custom filter functions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        value && self.indexOf(value) === index,
    );
  } catch {
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
    (value, index, self) => value && self.indexOf(value) === index, // Supprimer les doublons
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

  const date = new Date(
    typeof issueDate === "string" ? parseInt(issueDate) : issueDate,
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

export function useQuoteTable({
  data = [],
  onRefetch,
  onSendEmail,
  onSaveAsTemplate,
  onRequestSignature,
  onOpenSidebar,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [clientFilter, setClientFilter] = useState([]);
  const [dateFilter, setDateFilter] = useState(null);
  const [columnVisibility, setColumnVisibility] = usePersistentColumnVisibility(
    "newbi:column-visibility:quotes",
    { finalTotalHT: false, finalTotalVAT: false },
  );

  // Hook pour la suppression de devis
  const { deleteQuote, loading: isDeleting } = useDeleteQuote();
  const { deleteImportedQuotes } = useDeleteImportedQuotes();

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
        size: 40,
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
      //         <ArrowUpDown className="ml-2 h-3 w-3" />
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
          const quote = row.original;
          const isImported = quote._type === "imported";
          // Les vrais devis issus d'un import gardent un préfixe vide après
          // conversion : on garde l'indicateur « importé » même une fois le
          // devis accepté ou refusé (le statut change, l'origine reste).
          const isImportedOrigin =
            isImported || (!quote.prefix && Boolean(quote.number));
          const clientName = client?.name || "Non défini";
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
                <div className="text-xs text-muted-foreground truncate max-w-[100px] md:max-w-none">
                  {isImported
                    ? quote.originalQuoteNumber || (
                        <span className="italic">Devis importé</span>
                      )
                    : (quote.prefix
                        ? `${quote.prefix.replace(/-$/, "")}-${quote.number}`
                        : quote.number) || (
                        <span className="italic">Brouillon</span>
                      )}
                </div>
              </div>
              {isImportedOrigin && (
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
                    Devis importé
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: "projectReference",
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
          const reference = row.original.projectReference;
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
        accessorKey: "issueDate",
        header: ({ column }) => (
          <div className="flex items-center font-normal px-0 py-2">
            <div
              className="flex items-center cursor-pointer"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Date d&apos;émission
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </div>
          </div>
        ),
        meta: {
          label: "Date d'émission",
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
              <ArrowUpDown className="ml-2 h-3 w-3" />
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
                `Format de date non supporté: ${dateValue} (${typeof dateValue})`,
              );
            }

            // Vérifier si la date est expirée
            const isExpired = isDateExpired(dateValue);

            return (
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  isExpired && "text-destructive font-medium",
                )}
              >
                {formattedDate}
                {isExpired && (
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
                      Expiré
                    </TooltipContent>
                  </Tooltip>
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
              },
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
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </div>
        ),
        meta: {
          label: "Statut",
        },
        cell: ({ row }) => {
          const status = row.getValue("status");
          const isImported = row.original._type === "imported";

          // Statuts spécifiques aux devis importés
          if (isImported) {
            const importedLabel =
              status === "VALIDATED" ? "Terminé" : "À vérifier";
            const importedClassName =
              status === "VALIDATED"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
            const importedIcon =
              status === "VALIDATED" ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              );
            return (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                  importedClassName,
                )}
              >
                {importedIcon}
                {importedLabel}
              </span>
            );
          }

          const label = QUOTE_STATUS_LABELS[status] || status;

          const getStatusConfig = () => {
            switch (status) {
              case "DRAFT":
                return {
                  icon: <FileText className="w-3 h-3" />,
                  className:
                    "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
                };
              case "PENDING":
                return {
                  icon: <Clock className="w-3 h-3" />,
                  className:
                    "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                };
              case "COMPLETED":
                return {
                  icon: <CheckCircle className="w-3 h-3" />,
                  className:
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
                };
              case "CANCELED":
                return {
                  icon: <XCircle className="w-3 h-3" />,
                  className:
                    "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                };
              case "IMPORTED":
                return {
                  icon: <Upload className="w-3 h-3" />,
                  className:
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                };
              default:
                return {
                  icon: <FileText className="w-3 h-3" />,
                  className:
                    "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400",
                };
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
        size: 100,
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
          const quote = row.original;
          const amount = quote.finalTotalHT ?? quote.totalHT;
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
          const quote = row.original;
          const amount = quote.finalTotalVAT ?? quote.totalVAT;
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
          const quote = row.original;
          const escompteValue = parseFloat(quote.escompte) || 0;

          // Utiliser finalTotalTTC comme base (après remise mais avant escompte)
          let amount = quote.finalTotalTTC;

          // Afficher "-" si undefined/null
          if (amount === undefined || amount === null || isNaN(amount))
            return "-";

          // Appliquer uniquement l'escompte pour afficher le Total TTC
          if (escompteValue > 0) {
            // Utiliser finalTotalHT et finalTotalVAT (après remise)
            const totalHT = quote.finalTotalHT || quote.totalHT || 0;
            const totalVAT = quote.finalTotalVAT || quote.totalVAT || 0;

            // Appliquer l'escompte sur HT
            const escompteAmount = (totalHT * escompteValue) / 100;
            const htAfterEscompte = totalHT - escompteAmount;
            const tvaAfterEscompte = quote.isReverseCharge
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
        id: "actions",
        header: () => <div className="text-right font-normal">Actions</div>,
        cell: ({ row }) => {
          // Les devis importés s'ouvrent au clic sur la ligne (sidebar dédiée)
          if (row.original._type === "imported") {
            return <div className="h-8" />;
          }
          return (
            <QuoteRowActions
              row={row}
              onRefetch={onRefetch}
              onSendEmail={onSendEmail}
              onSaveAsTemplate={onSaveAsTemplate}
              onRequestSignature={onRequestSignature}
              onOpenSidebar={onOpenSidebar}
            />
          );
        },
        size: 60,
        enableHiding: false,
      },
    ],
    [
      onRefetch,
      onSendEmail,
      onSaveAsTemplate,
      onRequestSignature,
      onOpenSidebar,
    ],
  );

  // Log des données pour débogage
  useEffect(() => {
    if (data && data.length > 0) {
      // Afficher les 3 premiers devis pour inspection
      const sampleQuotes = data.slice(0, 3);

      sampleQuotes.forEach((quote) => {
        // Tester la conversion de la date
        if (quote.validUntil) {
          try {
            // Gérer les différents formats de date
            if (
              typeof quote.validUntil === "number" ||
              /^\d+$/.test(quote.validUntil)
            ) {
              new Date(parseInt(quote.validUntil, 10));
            } else {
              new Date(quote.validUntil);
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
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: memoizedMultiColumnFilter,
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
    // Use the memoized filter function
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

  // Get selected rows - simplified to avoid infinite loops
  const selectedRowsModel = table.getFilteredSelectedRowModel();
  const selectedRows = selectedRowsModel.rows.map((row) => row.original);

  // Handle bulk delete - optimized with batching
  const handleDeleteSelected = async () => {
    // Lignes de devis importés (OCR, ImportedQuote) : suppression via la
    // mutation dédiée deleteImportedQuotes, quel que soit leur statut.
    const importedRows = selectedRows.filter((q) => q._type === "imported");

    // Devis réels supprimables : brouillons, et devis issus d'un import
    // (préfixe vide → logo « importé ») quel que soit leur statut, même une
    // fois acceptés (COMPLETED) ou refusés (CANCELED).
    const deletableQuotes = selectedRows.filter(
      (q) =>
        q._type !== "imported" &&
        (q.status === "DRAFT" ||
          q.status === "IMPORTED" ||
          (!q.prefix && Boolean(q.number))),
    );

    const totalDeletable = importedRows.length + deletableQuotes.length;

    if (totalDeletable === 0) {
      toast.error(
        "Seuls les devis en brouillon ou importés peuvent être supprimés",
      );
      return;
    }

    if (totalDeletable < selectedRows.length) {
      toast.warning(
        `${selectedRows.length - totalDeletable} devis ignoré(s) (non supprimable)`,
      );
    }

    // Suppression groupée des devis importés (OCR) en une seule mutation.
    if (importedRows.length > 0) {
      try {
        await deleteImportedQuotes({
          variables: { ids: importedRows.map((q) => q.id) },
        });
      } catch {
        toast.error("Erreur lors de la suppression des devis importés");
      }
    }

    // Suppression des devis réels par lots pour ne pas saturer le navigateur.
    const BATCH_SIZE = 5;
    for (let i = 0; i < deletableQuotes.length; i += BATCH_SIZE) {
      const batch = deletableQuotes.slice(i, i + BATCH_SIZE);
      try {
        // Les notifications individuelles sont désactivées dans le hook GraphQL
        await Promise.all(batch.map((quote) => deleteQuote(quote.id)));
      } catch {
        toast.error(
          `Erreur lors de la suppression du lot ${i / BATCH_SIZE + 1}`,
        );
      }
    }

    // Une seule notification à la fin
    toast.success(`${totalDeletable} devis supprimé(s)`);
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
    clientFilter,
    setClientFilter,
    dateFilter,
    setDateFilter,
    selectedRows,
    handleDeleteSelected,
    isDeleting,
  };
}
