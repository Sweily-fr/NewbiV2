import { Checkbox } from "@/src/components/ui/checkbox";
import { Badge } from "@/src/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  TrendingUp,
  TrendingDown,
  ArrowDownIcon,
  CreditCardIcon,
  BanknoteIcon,
  FileTextIcon,
  ImageIcon,
  Paperclip,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { formatDateToFrench } from "@/src/utils/dateFormatter";
import { RowActions } from "../components/RowActions";
import { multiColumnFilterFn } from "../filters/multiColumnFilterFn";
import { findMerchant } from "@/lib/merchants-config";
import { MerchantLogo } from "../../merchant-logo";
import { getCategoryConfig } from "@/lib/category-icons-config";

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
          <div className="font-normal truncate max-w-[200px]" title={vendor || description}>
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
    cell: ({ row }) => {
      const amount = row.getValue("amount");
      const type = row.original.type;
      return (
        <div className="font-normal text-left">
          {type === "INCOME" ? "+" : "-"}
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
    header: "Justificatif",
    accessorKey: "attachment",
    cell: ({ row }) => {
      const files = row.original.files || [];
      const attachmentCount = files.length;
      
      return (
        <div className="flex items-center gap-1.5">
          <Paperclip size={16} className="text-muted-foreground" />
          <span className="text-sm font-normal text-muted-foreground">
            {attachmentCount}
          </span>
        </div>
      );
    },
    size: 100,
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
