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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatMonthHeader = (monthStr) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase() + ` ${year.slice(2)}`;
};

function SortableHeader({ column, children }) {
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors whitespace-nowrap"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <ArrowUpDown className="h-3.5 w-3.5" />
    </button>
  );
}

export function AnalyticsCrossTabTable({
  title,
  data,
  rowKeyField,
  valueOptions,
  defaultValue,
  loading,
  rowLabelMap,
}) {
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [sorting, setSorting] = useState([]);

  const isCurrencyValue = selectedValue !== "invoiceCount" && selectedValue !== "count";

  // Extract unique sorted months
  const months = useMemo(() => {
    if (!data?.length) return [];
    const monthSet = new Set(data.map((d) => d.month));
    return [...monthSet].sort();
  }, [data]);

  // Pivot data: rows = entities, columns = months
  const { pivotedRows, totalsRow } = useMemo(() => {
    if (!data?.length || !months.length) return { pivotedRows: [], totalsRow: null };

    const rowMap = {};
    for (const item of data) {
      const rowKey = item[rowKeyField];
      if (!rowMap[rowKey]) {
        rowMap[rowKey] = { _rowLabel: rowLabelMap?.[rowKey] || rowKey, _rowKey: rowKey };
        for (const m of months) {
          rowMap[rowKey][m] = 0;
        }
        rowMap[rowKey]._total = 0;
      }
      const val = item[selectedValue] || 0;
      rowMap[rowKey][item.month] = (rowMap[rowKey][item.month] || 0) + val;
      rowMap[rowKey]._total = (rowMap[rowKey]._total || 0) + val;
    }

    const rows = Object.values(rowMap).map((r) => ({
      ...r,
      _total: Math.round(r._total * 100) / 100,
    }));

    // Totals row
    const totals = { _rowLabel: "Total", _rowKey: "__total__", _total: 0 };
    for (const m of months) {
      totals[m] = rows.reduce((sum, r) => sum + (r[m] || 0), 0);
      totals[m] = Math.round(totals[m] * 100) / 100;
    }
    totals._total = rows.reduce((sum, r) => sum + (r._total || 0), 0);
    totals._total = Math.round(totals._total * 100) / 100;

    return { pivotedRows: rows, totalsRow: totals };
  }, [data, months, rowKeyField, selectedValue, rowLabelMap]);

  // Build columns
  const columns = useMemo(() => {
    const cols = [
      {
        accessorKey: "_rowLabel",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {rowKeyField === "clientName" ? "Client" : "Catégorie"}
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="font-medium whitespace-nowrap">{row.getValue("_rowLabel")}</span>
        ),
      },
    ];

    for (const m of months) {
      cols.push({
        accessorKey: m,
        header: ({ column }) => (
          <SortableHeader column={column}>{formatMonthHeader(m)}</SortableHeader>
        ),
        cell: ({ row }) => {
          const val = row.getValue(m);
          return (
            <span className="whitespace-nowrap tabular-nums">
              {isCurrencyValue ? formatCurrency(val) : val}
            </span>
          );
        },
      });
    }

    cols.push({
      accessorKey: "_total",
      header: ({ column }) => (
        <SortableHeader column={column}>Total</SortableHeader>
      ),
      cell: ({ row }) => {
        const val = row.getValue("_total");
        return (
          <span className="font-semibold whitespace-nowrap tabular-nums">
            {isCurrencyValue ? formatCurrency(val) : val}
          </span>
        );
      },
    });

    return cols;
  }, [months, isCurrencyValue, rowKeyField]);

  const colCount = columns.length;

  const table = useReactTable({
    data: pivotedRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  if (loading) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4 px-4 sm:px-6">{title}</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!pivotedRows.length) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4 px-4 sm:px-6">{title}</h3>
        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
          Aucune donnée pour cette période
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
        <h3 className="text-base font-medium">{title}</h3>
        <Select value={selectedValue} onValueChange={setSelectedValue}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {valueOptions.map((opt) => (
              <SelectItem key={opt.key} value={opt.key}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-t">
                {headerGroup.headers.map((header, idx) => (
                  <TableHead
                    key={header.id}
                    className={
                      idx === 0
                        ? "sticky left-0 bg-background z-10 min-w-[160px] pl-4 sm:pl-6"
                        : idx === colCount - 1
                          ? "min-w-[100px] pr-4 sm:pr-6"
                          : "min-w-[100px]"
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell, idx) => (
                  <TableCell
                    key={cell.id}
                    className={
                      idx === 0
                        ? "sticky left-0 bg-background z-10 pl-4 sm:pl-6"
                        : idx === colCount - 1
                          ? "pr-4 sm:pr-6"
                          : ""
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {/* Totals row */}
            {totalsRow && (
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell className="sticky left-0 bg-muted/50 z-10 pl-4 sm:pl-6">
                  <span className="font-semibold">Total</span>
                </TableCell>
                {months.map((m, idx) => (
                  <TableCell
                    key={m}
                    className={idx === months.length - 1 && colCount === months.length + 2 ? "" : ""}
                  >
                    <span className="whitespace-nowrap tabular-nums font-semibold">
                      {isCurrencyValue ? formatCurrency(totalsRow[m]) : totalsRow[m]}
                    </span>
                  </TableCell>
                ))}
                <TableCell className="pr-4 sm:pr-6">
                  <span className="whitespace-nowrap tabular-nums font-bold">
                    {isCurrencyValue ? formatCurrency(totalsRow._total) : totalsRow._total}
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
