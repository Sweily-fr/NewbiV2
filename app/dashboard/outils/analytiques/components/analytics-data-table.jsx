"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const CLIENT_TYPE_LABELS = {
  COMPANY: "Entreprise",
  INDIVIDUAL: "Particulier",
};

const CLIENT_COLUMNS = [
  {
    accessorKey: "clientName",
    header: "Client",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("clientName")}</span>
    ),
  },
  {
    accessorKey: "clientType",
    header: "Type",
    cell: ({ row }) =>
      CLIENT_TYPE_LABELS[row.getValue("clientType")] || row.getValue("clientType"),
  },
  {
    accessorKey: "totalHT",
    header: "CA HT",
    cell: ({ row }) => formatCurrency(row.getValue("totalHT")),
  },
  {
    accessorKey: "totalTTC",
    header: "CA TTC",
    cell: ({ row }) => formatCurrency(row.getValue("totalTTC")),
  },
  {
    accessorKey: "totalVAT",
    header: "TVA",
    cell: ({ row }) => formatCurrency(row.getValue("totalVAT")),
  },
  {
    accessorKey: "invoiceCount",
    header: "Factures",
  },
  {
    accessorKey: "averageInvoiceHT",
    header: "Panier moyen",
    cell: ({ row }) => formatCurrency(row.getValue("averageInvoiceHT")),
  },
  {
    accessorKey: "totalHours",
    header: "Temps passé",
    cell: ({ row }) => {
      const hours = row.getValue("totalHours");
      if (!hours) return "\u2014";
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return `${h}h${m.toString().padStart(2, "0")}`;
    },
  },
  {
    accessorKey: "totalBillableAmount",
    header: "Temps facturable",
    cell: ({ row }) => {
      const amount = row.getValue("totalBillableAmount");
      return amount > 0 ? formatCurrency(amount) : "\u2014";
    },
  },
];

const PRODUCT_COLUMNS = [
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("description")}</span>
    ),
  },
  {
    accessorKey: "totalHT",
    header: "CA HT",
    cell: ({ row }) => formatCurrency(row.getValue("totalHT")),
  },
  {
    accessorKey: "totalQuantity",
    header: "Quantité vendue",
  },
  {
    accessorKey: "invoiceCount",
    header: "Factures",
  },
  {
    accessorKey: "averageUnitPrice",
    header: "Prix moyen",
    cell: ({ row }) => formatCurrency(row.getValue("averageUnitPrice")),
  },
];

function SortableHeader({ column, children }) {
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <ArrowUpDown className="h-3.5 w-3.5" />
    </button>
  );
}

function makeColumnsWithSorting(columns) {
  return columns.map((col) => ({
    ...col,
    header: ({ column }) => (
      <SortableHeader column={column}>
        {typeof col.header === "string" ? col.header : col.header}
      </SortableHeader>
    ),
  }));
}

function DataTableInner({ columns, data, title }) {
  const [sorting, setSorting] = useState([]);

  const sortableColumns = useMemo(
    () => makeColumnsWithSorting(columns),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: sortableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  const colCount = columns.length;

  return (
    <div className="w-full">
      {title && <h3 className="text-base font-medium mb-4 px-4 sm:px-6">{title}</h3>}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b border-t">
              {headerGroup.headers.map((header, idx) => (
                <TableHead
                  key={header.id}
                  className={
                    idx === 0
                      ? "pl-4 sm:pl-6"
                      : idx === colCount - 1
                        ? "pr-4 sm:pr-6"
                        : ""
                  }
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell, idx) => (
                  <TableCell
                    key={cell.id}
                    className={
                      idx === 0
                        ? "pl-4 sm:pl-6"
                        : idx === colCount - 1
                          ? "pr-4 sm:pr-6"
                          : ""
                    }
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                Aucune donnée
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function AnalyticsClientTable({ revenueByClient, loading }) {
  if (loading) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4 px-4 sm:px-6">Détail par client</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <DataTableInner
      columns={CLIENT_COLUMNS}
      data={revenueByClient || []}
      title="Détail par client"
    />
  );
}

export function AnalyticsProductTable({ revenueByProduct, loading }) {
  if (loading) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4 px-4 sm:px-6">Détail par produit / service</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <DataTableInner
      columns={PRODUCT_COLUMNS}
      data={revenueByProduct || []}
      title="Détail par produit / service"
    />
  );
}
