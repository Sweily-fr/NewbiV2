import { Checkbox } from "@/src/components/ui/checkbox";
import {
  CreditCardIcon,
  BanknoteIcon,
  FileTextIcon,
  PenLine,
  Landmark,
  Sparkles,
  Paperclip,
  ShoppingBasket,
} from "lucide-react";
import { MoneyReciveIcon } from "@/src/components/icons";
import { formatDateToFrench } from "@/src/utils/dateFormatter";
import { formatInvoiceReference } from "@/src/utils/invoiceUtils";
import { findBank } from "@/lib/banks-config";
import { RowActions } from "../components/RowActions";
import { multiColumnFilterFn } from "../filters/multiColumnFilterFn";
import { getStandaloneReceipts } from "../utils/receiptFiles";
import {
  LinkedPiecesCell,
  PIECE_COLORS,
} from "@/src/components/reconciliation/LinkedPiecesCell";
import { findMerchant } from "@/lib/merchants-config";
import { MerchantLogo } from "../../merchant-logo";
import { getCategoryConfig } from "@/lib/category-icons-config";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

export const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    size: 28,
    enableSorting: false,
    enableHiding: false,
  },
  {
    header: "Transaction",
    accessorKey: "description",
    cell: ({ row }) => {
      const description = row.getValue("description");
      const vendor = row.original.vendor;
      const merchant = findMerchant(vendor || description || "");

      return (
        <div className="flex items-center gap-3">
          <MerchantLogo
            merchant={merchant}
            fallbackText={vendor || description}
            size="sm"
          />
          <div
            className="font-normal truncate max-w-[200px]"
            title={vendor || description}
          >
            {merchant?.name || vendor || description || "Transaction"}
          </div>
        </div>
      );
    },
    size: 250,
    enableHiding: false,
    filterFn: multiColumnFilterFn,
  },
  {
    header: "Montant",
    accessorKey: "amount",
    meta: {
      label: "Montant",
    },
    cell: ({ row }) => {
      const amount = row.getValue("amount");
      // Déterminer si c'est une entrée basé sur le montant (positif = entrée, négatif = sortie)
      const isIncome = amount > 0;
      return (
        <div
          className="font-normal text-left"
          style={{
            color: isIncome ? "var(--color-income)" : "var(--color-expense)",
          }}
        >
          {isIncome ? "+" : ""}
          {amount.toFixed(2)} €
        </div>
      );
    },
    size: 120,
  },
  {
    header: "Date",
    accessorKey: "date",
    cell: ({ row }) => {
      const dateValue = row.getValue("date");
      const formattedDate = formatDateToFrench(dateValue);
      return <div className="font-normal">{formattedDate}</div>;
    },
    size: 120,
    enableHiding: false,
  },
  {
    header: "Catégorie",
    accessorKey: "category",
    meta: {
      label: "Catégorie",
    },
    cell: ({ row }) => {
      const category = row.getValue("category");
      const config = getCategoryConfig(category);
      const Icon = config.icon;

      return (
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: config.bgColor }}
          >
            <Icon size={14} style={{ color: config.color }} />
          </div>
          <span className="font-normal truncate">{config.label}</span>
        </div>
      );
    },
    size: 180,
  },
  {
    header: "Moyen de paiement",
    accessorKey: "paymentMethod",
    meta: {
      label: "Moyen de paiement",
    },
    enableHiding: true,
    cell: ({ row }) => {
      const method = row.getValue("paymentMethod");
      const getIcon = () => {
        switch (method) {
          case "CARD":
          case "CREDIT_CARD":
            return <CreditCardIcon size={14} />;
          case "CASH":
            return <BanknoteIcon size={14} />;
          case "TRANSFER":
          case "BANK_TRANSFER":
          case "DIRECT_DEBIT":
          case "SEPA_DEBIT":
            return <FileTextIcon size={14} />;
          case "CHECK":
            return <FileTextIcon size={14} />;
          default:
            return <CreditCardIcon size={14} />;
        }
      };

      const getLabel = () => {
        switch (method) {
          case "CARD":
          case "CREDIT_CARD":
            return "Carte";
          case "CASH":
            return "Espèces";
          case "TRANSFER":
          case "BANK_TRANSFER":
            return "Virement";
          case "CHECK":
            return "Chèque";
          case "DIRECT_DEBIT":
          case "SEPA_DEBIT":
            return "Prélèvement";
          default:
            return method || "—";
        }
      };

      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400">
          <MoneyReciveIcon className="w-3 h-3" />
          {getLabel()}
        </span>
      );
    },
    size: 150,
  },
  {
    header: "Source",
    accessorKey: "source",
    meta: {
      label: "Source",
    },
    cell: ({ row, table }) => {
      const source = row.original.source || row.original.type;
      const isBank = source === "BANK" || source === "BANK_TRANSACTION";
      const isManual = source === "MANUAL" || source === "MANUAL_EXPENSE";
      const isOcr = source === "OCR";

      // Récupérer le nom de la banque depuis les données de la transaction
      const bankName =
        row.original.originalTransaction?.fromAccount?.bankName ||
        row.original.originalTransaction?.provider ||
        row.original.bankName ||
        "";
      const bank = findBank(bankName);

      // Chercher le logo de l'institution via bankAccounts du meta
      const bankAccounts = table.options.meta?.bankAccounts || [];
      const fromAccountId = row.original.originalTransaction?.fromAccount;
      const matchedAccount = bankAccounts.find(
        (acc) => acc.id === fromAccountId || acc.externalId === fromAccountId,
      );
      const institutionLogo = matchedAccount?.institutionLogo || bank?.logo;
      const institutionName =
        matchedAccount?.institutionName ||
        matchedAccount?.bankName ||
        bank?.name;

      if (isBank) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  {institutionLogo ? (
                    <img
                      src={institutionLogo}
                      alt={institutionName || "Banque"}
                      className="h-6 w-6 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-sm bg-muted flex items-center justify-center">
                      <Landmark size={14} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {institutionName || "Transaction bancaire"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      if (isOcr) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <FileTextIcon size={14} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">OCR</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Dépense créée par scan OCR</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      // Manuel
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <PenLine size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Manuel</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Dépense saisie manuellement</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    size: 80,
  },
  {
    header: "Justificatif",
    accessorKey: "hasReceipt",
    meta: {
      label: "Justificatif",
    },
    cell: ({ row, table }) => {
      const linkedInvoices = row.original.linkedInvoices || [];
      const linkedImportedInvoices = row.original.linkedImportedInvoices || [];
      const linkedPurchaseInvoices = row.original.linkedPurchaseInvoices || [];
      const reconciliationStatus =
        row.original.reconciliationStatus?.toLowerCase();
      const hasSuggestion = reconciliationStatus === "suggested";

      // Un compteur par nature de pièce, jamais additionnés entre eux :
      // - trombone : fichiers déposés sur la transaction (legacy `files[]`
      //   en repli), sans ceux devenus facture d'achat liée, comptés dans
      //   le panier (même règle que la liste du tiroir) ;
      // - facture : factures de vente liées (Newbi + importées) ;
      // - panier : factures d'achat liées.
      const receipts = getStandaloneReceipts(row.original);
      const salesInvoices = [
        ...linkedInvoices.map((inv) => ({
          id: `inv-${inv.id}`,
          label: `${formatInvoiceReference(inv)} - ${inv.clientName || "Client"}`,
        })),
        ...linkedImportedInvoices.map((inv) => ({
          id: `imp-${inv.id}`,
          label: `${inv.number || "Facture importée"} - ${inv.clientName || "Client"}`,
        })),
      ];
      const counters = [
        receipts.length > 0 && {
          key: "receipts",
          Icon: Paperclip,
          count: receipts.length,
          className: PIECE_COLORS.receipt,
          title:
            receipts.length > 1
              ? `${receipts.length} justificatifs`
              : "1 justificatif",
          lines: receipts.map(
            (f) => f.filename || f.originalFilename || "Justificatif",
          ),
        },
        salesInvoices.length > 0 && {
          key: "sales",
          Icon: FileTextIcon,
          count: salesInvoices.length,
          className: PIECE_COLORS.invoice,
          title:
            salesInvoices.length > 1
              ? `${salesInvoices.length} factures liées`
              : "Facture liée",
          lines: salesInvoices.map((inv) => inv.label),
        },
        linkedPurchaseInvoices.length > 0 && {
          key: "purchase",
          Icon: ShoppingBasket,
          count: linkedPurchaseInvoices.length,
          className: PIECE_COLORS.purchaseInvoice,
          title:
            linkedPurchaseInvoices.length > 1
              ? `${linkedPurchaseInvoices.length} factures d'achat liées`
              : "Facture d'achat liée",
          lines: linkedPurchaseInvoices.map(
            (pi) =>
              `${pi.invoiceNumber || "Facture d'achat"} - ${pi.supplierName || "Fournisseur"}`,
          ),
        },
      ].filter(Boolean);

      // Suggestion en attente (ambre pulsant) : affichée tant qu'aucune
      // facture de vente n'est liée, avec le libellé « Match » seulement
      // quand la cellule est vide (place disponible).
      const showSuggestion = hasSuggestion && salesInvoices.length === 0;
      const suggestion = showSuggestion ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center gap-1.5 cursor-pointer group/suggestion"
                onClick={(e) => {
                  e.stopPropagation();
                  const onOpenReconciliation =
                    table.options.meta?.onOpenReconciliation;
                  if (onOpenReconciliation) {
                    onOpenReconciliation(row.original);
                  }
                }}
              >
                <div className="relative">
                  <Sparkles
                    size={14}
                    className="text-amber-500 group-hover/suggestion:text-amber-600 transition-colors"
                  />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                </div>
                {counters.length === 0 && (
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 group-hover/suggestion:text-amber-700 dark:group-hover/suggestion:text-amber-300 transition-colors">
                    Match
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div className="font-medium">Suggestion de rapprochement</div>
                <div className="text-xs text-muted-foreground">
                  Cliquez pour voir la facture correspondante
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null;

      return <LinkedPiecesCell counters={counters} extra={suggestion} />;
    },
    size: 120,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <RowActions
            row={row}
            onEdit={table.options.meta?.onEdit}
            onRefresh={table.options.meta?.onRefresh}
            onDownloadAttachment={table.options.meta?.onDownloadAttachment}
          />
        </div>
      );
    },
    size: 60,
    enableHiding: false,
  },
];
