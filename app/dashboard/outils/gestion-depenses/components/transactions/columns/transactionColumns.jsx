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
import { typeFilterFn } from "../filters/typeFilterFn";

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
    header: "Type",
    accessorKey: "type",
    cell: ({ row }) => {
      const type = row.getValue("type");
      const source = row.original.source;
      const expenseType = row.original.expenseType;
      const assignedMember = row.original.assignedMember;

      // Configuration des badges selon le type et la source
      const getBadgeConfig = () => {
        // Factures - Entrées d'argent (vert)
        if (type === "INCOME" && source === "invoice") {
          return {
            className: "bg-transparent bg-green-50 text-green-800 font-normal",
            icon: <TrendingUp size={12} />,
            label: "Facture",
            showAvatar: false,
          };
        }

        // Entrées manuelles - Entrées d'argent (vert) basées sur les notes
        if (source === "expense") {
          const notes = row.original.notes;
          const isVatDeductible = row.original.isVatDeductible;
          const isIncome =
            (notes && notes.includes("[INCOME]")) || isVatDeductible === false;

          if (isIncome) {
            return {
              className:
                "bg-transparent bg-green-50 text-green-800 font-normal",
              icon: <TrendingUp size={12} />,
              label: "Entrée",
              showAvatar: false,
            };
          } else {
            // Dépenses manuelles - Afficher selon expenseType
            if (expenseType === "EXPENSE_REPORT") {
              return {
                className:
                  "bg-transparent bg-orange-50 text-orange-800 font-normal",
                icon: <TrendingDown size={12} />,
                label: "Note de frais",
                showAvatar: true,
              };
            } else {
              return {
                className:
                  "bg-transparent font-normal text-[#5A50FF] bg-[#5A50FF]/10 border-[#5A50FF]/30 border",
                icon: <TrendingDown size={12} />,
                label: "Dépense",
                showAvatar: false,
              };
            }
          }
        }

        // Fallback
        return {
          className: "bg-transparent border-gray-300 text-gray-800 font-normal",
          icon: <ArrowDownIcon size={12} />,
          label: "Inconnu",
          showAvatar: false,
        };
      };

      const config = getBadgeConfig();

      return (
        <div className="flex items-center gap-2">
          <Badge
            className={cn("flex items-center gap-1 w-fit", config.className)}
            style={config.style}
          >
            {config.icon} {config.label}
          </Badge>
          {config.showAvatar && assignedMember && (
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={assignedMember.image}
                alt={assignedMember.name}
              />
              <AvatarFallback className="text-xs">
                {assignedMember.name?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      );
    },
    size: 200,
    filterFn: typeFilterFn,
  },
  {
    header: "Catégorie",
    accessorKey: "category",
    cell: ({ row }) => {
      const category = row.getValue("category");

      // Fonction pour traduire les catégories en français
      const translateCategory = (cat) => {
        const categoryMap = {
          OFFICE_SUPPLIES: "Fournitures de bureau",
          TRAVEL: "Transport",
          MEALS: "Repas",
          EQUIPMENT: "Matériel",
          MARKETING: "Marketing",
          TRAINING: "Formation",
          SERVICES: "Services",
          RENT: "Loyer",
          SALARIES: "Salaires",
          OTHER: "Autre",
        };
        return categoryMap[cat] || cat;
      };

      return <div className="font-normal">{translateCategory(category)}</div>;
    },
    size: 140,
  },
  {
    header: "Montant",
    accessorKey: "amount",
    cell: ({ row }) => {
      const amount = row.getValue("amount");
      const type = row.getValue("type");
      return (
        <div
          className={cn(
            "font-normal text-left",
            type === "INCOME" ? "text-green-600" : "text-red-600"
          )}
        >
          {type === "INCOME" ? "+" : "-"}
          {amount.toFixed(2)} €
        </div>
      );
    },
    size: 120,
  },
  {
    header: "Description",
    accessorKey: "description",
    cell: ({ row }) => (
      <div
        className="max-w-[200px] truncate"
        title={row.getValue("description")}
      >
        {row.getValue("description")}
      </div>
    ),
    size: 200,
    filterFn: multiColumnFilterFn,
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
      const attachment = row.getValue("attachment");
      return attachment ? (
        <div className="flex items-center justify-center">
          <Paperclip size={16} className="text-muted-foreground" />
        </div>
      ) : null;
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
