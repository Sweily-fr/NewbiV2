"use client";

import { useState } from "react";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Paperclip,
  MoreHorizontal,
  Eye,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { Button } from "@/src/components/ui/button";
import { getCategoryConfig } from "@/lib/category-icons-config";
import { findMerchant } from "@/lib/merchants-config";
import { MerchantLogo } from "@/app/dashboard/outils/transactions/components/merchant-logo";

const STATUS_CONFIG = {
  TO_PROCESS: {
    label: "À traiter",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  TO_PAY: {
    label: "À payer",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  PENDING: {
    label: "En attente",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  PAID: {
    label: "Payée",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  OVERDUE: {
    label: "En retard",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  ARCHIVED: {
    label: "Archivée",
    className: "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-500",
  },
};

function parseDate(value) {
  if (!value) return null;
  try {
    let d;
    if (typeof value === "string") {
      if (/^\d+$/.test(value)) {
        d = new Date(parseInt(value, 10));
      } else {
        d = new Date(value);
      }
    } else if (typeof value === "number") {
      d = new Date(value);
    } else if (value instanceof Date) {
      d = value;
    }
    if (!d || isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

// TanStack sortingFn that handles all the shapes parseDate accepts.
// Missing/invalid dates are treated as epoch (0) so they end up at the
// bottom in desc order (most-recent-first) without fighting TanStack's
// direction inversion.
const dateSortingFn = (rowA, rowB, columnId) => {
  const a = parseDate(rowA.getValue(columnId));
  const b = parseDate(rowB.getValue(columnId));
  return (a ? a.getTime() : 0) - (b ? b.getTime() : 0);
};

function SortableHeader({ column, children }) {
  const sorted = column.getIsSorted();
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp className="h-3 w-3" />
      ) : sorted === "desc" ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  );
}

function RowActions({ invoice, onViewInvoice, onDeleteInvoice }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <div data-no-row-click>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onViewInvoice?.(invoice)}>
            <Eye className="h-4 w-4 mr-2" />
            Voir
          </DropdownMenuItem>
          {invoice.files?.[0]?.url && (
            <DropdownMenuItem
              onClick={() => window.open(invoice.files[0].url, "_blank")}
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Voir le justificatif
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault();
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette facture d&apos;achat ?
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDeleteInvoice?.(invoice.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const getColumns = ({ onViewInvoice, onDeleteInvoice } = {}) => [
  {
    id: "select",
    size: 28,
    header: ({ table }) => (
      <div data-no-row-click>
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Tout sélectionner"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div data-no-row-click>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Sélectionner"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "supplierName",
    size: 140,
    header: ({ column }) => (
      <SortableHeader column={column}>Fournisseur</SortableHeader>
    ),
    cell: ({ row }) => {
      const name = row.getValue("supplierName");
      const merchant = findMerchant(name || "");
      return (
        <div className="flex items-center gap-3">
          <MerchantLogo merchant={merchant} fallbackText={name} size="sm" />
          <div className="font-normal truncate max-w-[200px]" title={name}>
            {merchant?.name || name || "Fournisseur"}
          </div>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "invoiceNumber",
    size: 130,
    header: ({ column }) => (
      <SortableHeader column={column}>Référence</SortableHeader>
    ),
    meta: { label: "Référence" },
    cell: ({ row }) => (
      <div className="font-normal text-muted-foreground">
        {row.getValue("invoiceNumber") || "—"}
      </div>
    ),
  },
  {
    accessorKey: "amountHT",
    size: 110,
    meta: { label: "Montant HT" },
    header: ({ column }) => (
      <SortableHeader column={column}>Montant HT</SortableHeader>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("amountHT");
      if (amount === undefined || amount === null)
        return <div className="font-normal text-muted-foreground">—</div>;
      return (
        <div className="font-normal">
          {new Intl.NumberFormat("fr-FR", {
            minimumFractionDigits: 2,
          }).format(amount)}{" "}
          €
        </div>
      );
    },
  },
  {
    accessorKey: "amountTVA",
    size: 100,
    meta: { label: "TVA" },
    header: ({ column }) => (
      <SortableHeader column={column}>TVA</SortableHeader>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("amountTVA");
      if (amount === undefined || amount === null)
        return <div className="font-normal text-muted-foreground">—</div>;
      return (
        <div className="font-normal">
          {new Intl.NumberFormat("fr-FR", {
            minimumFractionDigits: 2,
          }).format(amount)}{" "}
          €
        </div>
      );
    },
  },
  {
    accessorKey: "amountTTC",
    size: 110,
    meta: { label: "Montant TTC" },
    header: ({ column }) => (
      <SortableHeader column={column}>Montant TTC</SortableHeader>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("amountTTC");
      return (
        <div className="font-normal">
          {new Intl.NumberFormat("fr-FR", {
            minimumFractionDigits: 2,
          }).format(amount)}{" "}
          €
        </div>
      );
    },
  },
  {
    accessorKey: "issueDate",
    size: 100,
    meta: { label: "Date d'émission" },
    header: ({ column }) => (
      <SortableHeader column={column}>Date d&apos;émission</SortableHeader>
    ),
    cell: ({ row }) => {
      const date = row.getValue("issueDate");
      const parsed = parseDate(date);
      return (
        <div className="font-normal">
          {parsed ? parsed.toLocaleDateString("fr-FR") : "—"}
        </div>
      );
    },
    sortingFn: dateSortingFn,
    enableHiding: false,
  },
  {
    accessorKey: "dueDate",
    size: 100,
    meta: { label: "Date d'échéance" },
    header: ({ column }) => (
      <SortableHeader column={column}>Date d&apos;échéance</SortableHeader>
    ),
    cell: ({ row }) => {
      const date = row.original.dueDate;
      const parsed = parseDate(date);
      if (!parsed)
        return <div className="font-normal text-muted-foreground">—</div>;

      const isOverdue = parsed < new Date() && row.original.status !== "PAID";
      return (
        <div className={`font-normal ${isOverdue ? "text-red-600" : ""}`}>
          {parsed.toLocaleDateString("fr-FR")}
        </div>
      );
    },
    sortingFn: dateSortingFn,
  },
  {
    accessorKey: "category",
    size: 130,
    meta: { label: "Catégorie" },
    header: "Catégorie",
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
  },
  {
    accessorKey: "status",
    size: 110,
    meta: { label: "Statut" },
    header: "Statut",
    cell: ({ row }) => {
      const status = row.getValue("status");
      const config = STATUS_CONFIG[status] || STATUS_CONFIG.TO_PROCESS;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
        >
          {config.label}
        </span>
      );
    },
  },
  {
    id: "files",
    size: 60,
    header: "",
    cell: ({ row }) => {
      const files = row.original.files || [];
      if (files.length === 0) return null;
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Paperclip size={14} />
          <span className="text-xs">{files.length}</span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    size: 50,
    cell: ({ row }) => (
      <RowActions
        invoice={row.original}
        onViewInvoice={onViewInvoice}
        onDeleteInvoice={onDeleteInvoice}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
