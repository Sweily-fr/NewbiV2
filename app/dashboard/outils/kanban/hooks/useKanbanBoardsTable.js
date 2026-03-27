"use client";

import { useMemo, useRef, useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Button } from "@/src/components/ui/button";
import {
  Eye,
  Edit,
  Trash2,
  Euro,
  ListChecks,
  Star,
  MoreHorizontal,
  Tag,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";

function TruncatedText({ children, className }) {
  const ref = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = () => {
    const el = ref.current;
    if (el && el.scrollWidth > el.clientWidth) {
      setShowTooltip(true);
    }
  };

  return (
    <Tooltip open={showTooltip}>
      <TooltipTrigger asChild>
        <div
          ref={ref}
          className={`truncate ${className || ""}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setShowTooltip(false)}
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

// Formatage date relative
function formatRelativeDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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
  clientFilter = null,
  categoryFilter = null,
  onToggleFavorite,
}) {
  const [globalFilter, setGlobalFilter] = useState("");

  // Vérifier si au moins un board a un montant facturable
  const hasBillableAmount = useMemo(
    () => data.some((board) => board.totalBillableAmount),
    [data],
  );

  // Filtrer par client et catégorie
  const filteredData = useMemo(() => {
    let result = data;
    if (clientFilter) {
      result = result.filter((board) => board.clientId === clientFilter);
    }
    if (categoryFilter) {
      result = result.filter((board) => board.category === categoryFilter);
    }
    return result;
  }, [data, clientFilter, categoryFilter]);

  // Extraire les clients uniques pour le filtre
  const uniqueClients = useMemo(() => {
    const clientMap = new Map();
    data.forEach((board) => {
      if (board.client && board.clientId) {
        const name =
          board.client.type === "INDIVIDUAL"
            ? `${board.client.firstName || ""} ${board.client.lastName || ""}`.trim()
            : board.client.name;
        clientMap.set(board.clientId, { id: board.clientId, name });
      }
    });
    return Array.from(clientMap.values());
  }, [data]);

  // Extraire les catégories uniques
  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    data.forEach((board) => {
      if (board.category) cats.add(board.category);
    });
    return Array.from(cats).sort();
  }, [data]);

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
        size: 44,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        header: () => <span className="font-normal">Nom de la liste</span>,
        cell: ({ row }) => {
          const board = row.original;
          const clientName = board.client
            ? board.client.type === "INDIVIDUAL"
              ? `${board.client.firstName || ""} ${board.client.lastName || ""}`.trim()
              : board.client.name
            : null;
          return (
            <div className="min-h-[40px] flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                {board.emoji && (
                  <span className="text-base flex-shrink-0">{board.emoji}</span>
                )}
                <TruncatedText className="font-normal">
                  {board.title}
                </TruncatedText>
                {clientName && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-normal bg-muted text-muted-foreground flex-shrink-0">
                    {clientName}
                  </span>
                )}
              </div>
              {board.description && (
                <div className="font-normal text-xs text-muted-foreground truncate">
                  {board.description}
                </div>
              )}
            </div>
          );
        },
        size: 300,
        enableSorting: true,
        enableHiding: false,
      },
      {
        id: "favorite",
        header: () => <span className="font-normal">Favori</span>,
        cell: ({ row }) => (
          <button
            className="text-muted-foreground/30 hover:text-yellow-400 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(row.original.id);
            }}
            title={
              row.original.isFavorite
                ? "Retirer des favoris"
                : "Ajouter aux favoris"
            }
          >
            <Star
              className={`h-3.5 w-3.5 ${
                row.original.isFavorite ? "text-yellow-400 fill-yellow-400" : ""
              }`}
            />
          </button>
        ),
        size: 60,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "category",
        header: () => <span className="font-normal">Catégorie</span>,
        cell: ({ row }) => {
          const category = row.getValue("category");
          const color = row.original.color;
          if (!category)
            return <span className="text-muted-foreground/40">-</span>;
          return (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-normal"
              style={
                color
                  ? {
                      backgroundColor: `${color}15`,
                      color: color,
                      border: `1px solid ${color}30`,
                    }
                  : {
                      backgroundColor: "hsl(var(--muted))",
                      color: "hsl(var(--muted-foreground))",
                    }
              }
            >
              <Tag className="h-3 w-3" />
              {category}
            </span>
          );
        },
        size: 130,
      },
      {
        accessorKey: "taskCount",
        header: () => <span className="font-normal">Tâches</span>,
        cell: ({ row }) => {
          const count = row.getValue("taskCount");
          return (
            <span className="inline-flex items-center gap-1.5 font-normal">
              <ListChecks className="h-3.5 w-3.5" />
              {count || 0}
            </span>
          );
        },
        size: 90,
      },
      {
        id: "members",
        header: () => <span className="font-normal">Membres</span>,
        cell: ({ row }) => {
          const members = row.original.members || [];
          if (members.length === 0)
            return <span className="text-muted-foreground">-</span>;
          return (
            <div className="flex items-center -space-x-1.5">
              {members.slice(0, 3).map((member) => (
                <UserAvatar
                  key={member.userId || member.id}
                  src={member.image}
                  name={member.name || member.email}
                  size="xs"
                  className="h-6 w-6 ring-2 ring-background"
                />
              ))}
              {members.length > 3 && (
                <span className="h-6 w-6 rounded-full bg-muted text-[10px] font-normal flex items-center justify-center text-muted-foreground ring-2 ring-background">
                  +{members.length - 3}
                </span>
              )}
            </div>
          );
        },
        size: 110,
        enableSorting: false,
      },
      ...(hasBillableAmount
        ? [
            {
              accessorKey: "totalBillableAmount",
              header: () => <span className="font-normal">Montant</span>,
              cell: ({ row }) => {
                const amount = row.getValue("totalBillableAmount");
                if (!amount)
                  return <span className="text-muted-foreground">-</span>;
                return (
                  <span className="inline-flex items-center gap-1 font-normal text-[#5b50ff]">
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
              size: 140,
            },
          ]
        : []),
      {
        accessorKey: "updatedAt",
        header: () => <span className="font-normal">Dernière activité</span>,
        cell: ({ row }) => {
          const date = row.getValue("updatedAt");
          if (!date) return "-";
          return (
            <span className="font-normal">{formatRelativeDate(date)}</span>
          );
        },
        size: 140,
      },
      {
        accessorKey: "createdAt",
        header: () => <span className="font-normal">Créée le</span>,
        cell: ({ row }) => {
          const date = row.getValue("createdAt");
          if (!date) return "-";
          return <span className="font-normal">{formatDate(date)}</span>;
        },
        size: 120,
      },
      {
        id: "actions",
        header: () => <span className="font-normal">Actions</span>,
        cell: ({ row }) => {
          const board = row.original;
          return (
            <div data-actions-cell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview?.(board);
                    }}
                    className="gap-2 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Aperçu
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(board, e);
                    }}
                    className="gap-2 cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(board);
                    }}
                    className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 70,
        enableHiding: false,
      },
    ],
    [
      onEdit,
      onDelete,
      onPreview,
      formatDate,
      hasBillableAmount,
      onToggleFavorite,
    ],
  );

  // Create table instance
  const table = useReactTable({
    data: filteredData,
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
          id: "updatedAt",
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
    uniqueClients,
    uniqueCategories,
  };
}
