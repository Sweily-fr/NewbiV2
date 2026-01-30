import { Checkbox } from "@/src/components/ui/checkbox";
import {
  CreditCardIcon,
  BanknoteIcon,
  FileTextIcon,
  Paperclip,
  PenLine,
  Landmark,
  Link2,
  CheckCircle2,
} from "lucide-react";
import { formatDateToFrench } from "@/src/utils/dateFormatter";
import { findBank } from "@/lib/banks-config";
import { RowActions } from "../components/RowActions";
import { multiColumnFilterFn } from "../filters/multiColumnFilterFn";
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
          style={{ color: isIncome && "#0E7A3E" }}
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
            return <CreditCardIcon size={14} />;
          case "CASH":
            return <BanknoteIcon size={14} />;
          case "TRANSFER":
            return <FileTextIcon size={14} />;
          default:
            return <CreditCardIcon size={14} />;
        }
      };

      const getLabel = () => {
        switch (method) {
          case "CARD":
            return "Carte";
          case "CASH":
            return "Espèces";
          case "TRANSFER":
            return "Virement";
          case "CHECK":
            return "Chèque";
          default:
            return method;
        }
      };

      return (
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm">{getLabel()}</span>
        </div>
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
    cell: ({ row }) => {
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

      if (isBank) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  {bank?.logo ? (
                    <img
                      src={bank.logo}
                      alt={bank.name}
                      className="h-5 w-5 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="h-5 w-5 rounded-full bg-muted items-center justify-center"
                    style={{ display: bank?.logo ? "none" : "flex" }}
                  >
                    <Landmark size={12} className="text-muted-foreground" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {bank?.name || "Transaction bancaire"}
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
    cell: ({ row }) => {
      const files = row.original.files || [];
      const receiptFile = row.original.receiptFile;
      const linkedInvoice = row.original.linkedInvoice;
      const hasLinkedInvoice = !!linkedInvoice?.id;
      const hasReceipt =
        row.original.hasReceipt || files.length > 0 || !!receiptFile?.url;
      const filesCount =
        files.length > 0
          ? files.length
          : receiptFile?.url
            ? 1
            : hasReceipt
              ? 1
              : 0;

      // Si une facture est liée, afficher un indicateur spécial
      if (hasLinkedInvoice) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <FileTextIcon size={14} className="text-green-600" />
                    <Link2 size={8} className="text-green-600 absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <CheckCircle2 size={12} className="text-green-600" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div className="font-medium">Facture liée</div>
                  <div className="text-xs text-muted-foreground">
                    {linkedInvoice.number || "N/A"} - {linkedInvoice.clientName || "Client"}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      // Sinon, afficher le compteur de fichiers classique
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Paperclip size={14} className="text-muted-foreground" />
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
