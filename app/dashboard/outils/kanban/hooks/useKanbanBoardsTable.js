"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Button } from "@/src/components/ui/button";
import { ArrowUpDown, Eye, Edit, Trash2, Euro } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/src/components/ui/tooltip";

function TruncatedText({ children, className }) {
  const ref = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = () => {
    const el = ref.current;
    if (el && el.scrollWidth > el.clientWidth) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <Tooltip open={showTooltip}>
      <TooltipTrigger asChild>
        <div
          ref={ref}
          className={`truncate ${className || ""}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs break-words">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

// Custom filter function for multi-column search
const multiColumnFilterFn = (row, columnId, filterValue) => {
  const board = row.original;
  const title = board.title || "";
  const description = board.description || "";

  const searchTerm = (filterValue ?? "").toLowerCase().trim();

  const searchableContent = [title, description]
    .filter(Boolean)
    .map((s) => s.toString().toLowerCase().trim());

  return searchableContent.some((content) => content.includes(searchTerm));
};

export function useKanbanBoardsTable({
  data = [],
  onEdit,
  onDelete,
  onPreview,
  formatDate,
}) {
  const [globalFilter, setGlobalFilter] = useState("");

  // Vérifier si au moins un board a un montant facturable
  const hasBillableAmount = useMemo(
    () => data.some((board) => board.totalBillableAmount),
    [data]
  );

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
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 28,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nom de la liste
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const board = row.original;
          return (
            <div className="min-h-[40px] flex flex-col justify-center min-w-0">
              <TruncatedText className="font-medium">{board.title}</TruncatedText>
              {board.description && (
                <div className="text-xs text-muted-foreground truncate">
                  {board.description}
                </div>
              )}
            </div>
          );
        },
        size: 300,
        enableHiding: false,
      },
      ...(hasBillableAmount
        ? [
            {
              accessorKey: "totalBillableAmount",
              header: ({ column }) => (
                <div
                  className="flex items-center cursor-pointer font-normal"
                  onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                  }
                >
                  Montant du dossier
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              ),
              cell: ({ row }) => {
                const amount = row.getValue("totalBillableAmount");
                if (!amount)
                  return <span className="text-muted-foreground">-</span>;
                return (
                  <span className="inline-flex items-center gap-1 font-medium text-[#5b50ff]">
                    <Euro className="h-3.5 w-3.5" />
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(amount)}
                  </span>
                );
              },
              size: 160,
            },
          ]
        : []),
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date de création
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const date = row.getValue("createdAt");
          if (!date) return "-";
          return formatDate(date);
        },
        size: 150,
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Dernière modification
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const date = row.getValue("updatedAt");
          if (!date) return "-";
          return formatDate(date);
        },
        size: 150,
      },
      {
        id: "actions",
        header: () => <div className="text-right font-normal">Actions</div>,
        cell: ({ row }) => {
          const board = row.original;
          return (
            <div
              className="flex items-center justify-end gap-1"
              data-actions-cell
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPreview?.(board);
                }}
                title="Aperçu"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit?.(board, e);
                }}
                title="Modifier"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete?.(board);
                }}
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        size: 120,
        enableHiding: false,
      },
    ],
    [onEdit, onDelete, onPreview, formatDate, hasBillableAmount]
  );

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    manualPagination: false,
    manualFiltering: false,
    manualSorting: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    debugTable: false,
    autoResetPageIndex: false,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: multiColumnFilterFn,
    state: {
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
      sorting: [
        {
          id: "createdAt",
          desc: true,
        },
      ],
    },
  });

  // Get selected rows
  const selectedRowsModel = table.getFilteredSelectedRowModel();
  const selectedRows = selectedRowsModel.rows.map((row) => row.original);

  return {
    table,
    globalFilter,
    setGlobalFilter,
    selectedRows,
  };
}
