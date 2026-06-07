import { Checkbox } from "@/src/components/ui/checkbox";
import {
  CreditCardIcon,
  BanknoteIcon,
  FileTextIcon,
  PenLine,
  Landmark,
  CheckCircle2,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { Link2Icon as Link2, MoneyReciveIcon } from "@/src/components/icons";
import { formatDateToFrench } from "@/src/utils/dateFormatter";
import { findBank } from "@/lib/banks-config";
import { RowActions } from "../components/RowActions";
import { multiColumnFilterFn } from "../filters/multiColumnFilterFn";
import { findMerchant } from "@/lib/merchants-config";
import { MerchantLogo } from "../../merchant-logo";
import { getCategoryConfig } from "@/lib/category-icons-config";
import { CONFIDENCE_CONFIG } from "@/lib/pcg-mapping";
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
      const files = row.original.files || [];
      const receiptFiles = row.original.receiptFiles || [];
      const linkedInvoice = row.original.linkedInvoice;
      const hasLinkedInvoice = !!linkedInvoice?.id;
      const reconciliationStatus =
        row.original.reconciliationStatus?.toLowerCase();
      const hasSuggestion = reconciliationStatus === "suggested";
      const hasReceipt =
        row.original.hasReceipt || files.length > 0 || receiptFiles.length > 0;
      const filesCount =
        receiptFiles.length > 0
          ? receiptFiles.length
          : files.length > 0
            ? files.length
            : hasReceipt
              ? 1
              : 0;

      // État 4 : Rapproché à une facture (check vert)
      if (hasLinkedInvoice) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <FileTextIcon size={14} className="text-green-600" />
                    <Link2 className="w-2 h-2 text-green-600 absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <CheckCircle2 size={12} className="text-green-600" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div className="font-medium">Facture liée</div>
                  <div className="text-xs text-muted-foreground">
                    {linkedInvoice.number || "N/A"} -{" "}
                    {linkedInvoice.clientName || "Client"}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      // État 2 : Suggestion en attente (ambre pulsant)
      if (hasSuggestion) {
        return (
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
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 group-hover/suggestion:text-amber-700 dark:group-hover/suggestion:text-amber-300 transition-colors">
                    Match
                  </span>
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
        );
      }

      // État 3 : Justificatif attaché / État 1 : Vide
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {filesCount > 0 ? filesCount : "-"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {filesCount > 1
                ? `${filesCount} justificatifs attachés`
                : filesCount === 1
                  ? "1 justificatif attaché"
                  : "Aucun justificatif"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    size: 90,
  },
  {
    header: "Compte PCG",
    accessorKey: "pcgAccount",
    meta: {
      label: "Compte PCG",
    },
    cell: ({ row, table }) => {
      const pcgAccount = row.original.pcgAccount;
      const hasPCG = pcgAccount?.numero;

      if (!hasPCG) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-900/20 dark:text-gray-400 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    table.options.meta?.onEditPCG?.(row.original);
                  }}
                >
                  Non affecté
                </button>
              </TooltipTrigger>
              <TooltipContent>Affecter un compte PCG</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      const confidence =
        CONFIDENCE_CONFIG[pcgAccount.confidence?.toLowerCase()] ||
        CONFIDENCE_CONFIG.low;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  table.options.meta?.onEditPCG?.(row.original);
                }}
              >
                {pcgAccount.numero}
                {pcgAccount.isManual && <PenLine size={10} />}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div className="font-medium">
                  {pcgAccount.numero} - {pcgAccount.intitule}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {pcgAccount.isManual
                    ? "Affecté manuellement"
                    : `Auto (${confidence.label.toLowerCase()})`}
                </div>
                <div className="text-xs mt-1">Cliquer pour modifier</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    size: 130,
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
