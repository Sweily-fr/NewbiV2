"use client";

import { useMemo, useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Button } from "@/src/components/ui/button";
import { ArrowUpDown, Mail } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import MemberRowActions from "../components/member-row-actions";
import { toast } from "sonner";

// Custom filter functions
const multiColumnFilterFn = (row, columnId, filterValue) => {
  const searchableContent = [
    row.original.name,
    row.original.email,
    row.original.role,
    row.original.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableContent.includes(searchTerm);
};

const statusFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId);
  return filterValue.includes(status);
};

// Mémoize filter functions to prevent recreation on each render
const memoizedMultiColumnFilter = (row, columnId, filterValue) => {
  const searchableContent = [
    row.original.name,
    row.original.email,
    row.original.role,
    row.original.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableContent.includes(searchTerm);
};

const memoizedStatusFilter = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId);
  return filterValue.includes(status);
};

export function useMembersTable({ data = [], onRefetch }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);

  // Hook pour les actions sur les membres
  const { removeMember, cancelInvitation } = useOrganizationInvitations();

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
          />
        ),
        size: 28,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nom
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex items-center space-x-2">
              {member.type === "invitation" && (
                <Mail className="h-4 w-4 text-blue-500" />
              )}
              <span className="font-normal">
                {member.name || "N/A"}
              </span>
            </div>
          );
        },
        size: 200,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const email = row.getValue("email");
          return (
            <div className="font-normal">
              {email || (
                <span className="text-muted-foreground italic">Non défini</span>
              )}
            </div>
          );
        },
        size: 250,
        filterFn: multiColumnFilterFn,
      },
      {
        accessorKey: "role",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-normal"
          >
            Rôle
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const role = row.getValue("role");
          const getRoleBadgeClass = (role) => {
            switch (role) {
              case "owner":
                return "bg-purple-100 text-purple-800 border-purple-200";
              case "admin":
                return "bg-blue-100 text-blue-800 border-blue-200";
              case "member":
                return "bg-gray-100 text-gray-800 border-gray-200";
              default:
                return "bg-gray-100 text-gray-800 border-gray-200";
            }
          };

          return (
            <Badge className={cn("font-normal", getRoleBadgeClass(role))}>
              {role}
            </Badge>
          );
        },
        size: 100,
        filterFn: statusFilterFn,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-normal"
          >
            Statut
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const member = row.original;
          const status = member.type === "member" ? "active" : member.status;
          
          const getStatusBadgeClass = (status) => {
            switch (status) {
              case "active":
                return "bg-green-100 text-green-800 border-green-200";
              case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
              case "accepted":
                return "bg-green-100 text-green-800 border-green-200";
              case "rejected":
                return "bg-red-100 text-red-800 border-red-200";
              default:
                return "bg-gray-100 text-gray-800 border-gray-200";
            }
          };

          const getStatusLabel = (status, type) => {
            if (type === "member") return "Actif";
            switch (status) {
              case "pending": return "En attente";
              case "accepted": return "Accepté";
              case "rejected": return "Rejeté";
              default: return status;
            }
          };

          return (
            <Badge className={cn("font-normal", getStatusBadgeClass(status))}>
              {getStatusLabel(status, member.type)}
            </Badge>
          );
        },
        size: 120,
        filterFn: statusFilterFn,
      },
      {
        id: "actions",
        header: () => (
          <div className="text-center font-normal">Actions</div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <MemberRowActions row={row} onRefetch={onRefetch} />
          </div>
        ),
        size: 60,
        enableHiding: false,
      },
    ],
    [onRefetch]
  );

  // Create table instance with optimized settings
  const table = useReactTable({
    data,
    columns,
    // Enable client-side filtering and sorting
    manualPagination: false,
    manualFiltering: false,
    manualSorting: false,

    // Core models
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    // Optimize performance
    debugTable: false,
    autoResetPageIndex: false,
    enableMultiRemove: true,

    // Filtering
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: memoizedMultiColumnFilter,
    state: {
      globalFilter,
      columnFilters:
        statusFilter.length > 0 ? [{ id: "status", value: statusFilter }] : [],
    },
    // Use the memoized filter function
    filterFns: {
      status: memoizedStatusFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Get selected rows - simplified to avoid infinite loops
  const selectedRowsModel = table.getFilteredSelectedRowModel();
  const selectedRows = selectedRowsModel.rows.map((row) => row.original);

  // Handle bulk delete - optimized with batching
  const handleDeleteSelected = async () => {
    // Filtrer les éléments qui peuvent être supprimés
    const deletableItems = selectedRows.filter(
      (item) => item.role !== "owner" // Ne pas permettre la suppression du owner
    );

    if (deletableItems.length === 0) {
      toast.error("Aucun élément sélectionné ne peut être supprimé");
      return;
    }

    if (deletableItems.length < selectedRows.length) {
      toast.warning(
        `${selectedRows.length - deletableItems.length} élément(s) ignoré(s) (propriétaire)`
      );
    }

    // Process in chunks to avoid overwhelming the browser
    const BATCH_SIZE = 5;
    let successCount = 0;
    
    for (let i = 0; i < deletableItems.length; i += BATCH_SIZE) {
      const batch = deletableItems.slice(i, i + BATCH_SIZE);
      try {
        await Promise.all(
          batch.map(async (item) => {
            if (item.type === "member") {
              const email = item.user?.email || item.email;
              const result = await removeMember(email);
              if (result.success) successCount++;
              return result;
            } else {
              // invitation
              const result = await cancelInvitation(item.id);
              if (result.success) successCount++;
              return result;
            }
          })
        );
      } catch (error) {
        console.error("Error deleting batch:", error);
        toast.error(
          `Erreur lors de la suppression du lot ${i / BATCH_SIZE + 1}`
        );
      }
    }

    toast.success(`${successCount} élément(s) supprimé(s)`);
    table.resetRowSelection();

    // Actualiser la liste
    if (onRefetch) {
      onRefetch();
    }
  };

  return {
    table,
    globalFilter,
    setGlobalFilter,
    statusFilter,
    setStatusFilter,
    selectedRows,
    handleDeleteSelected,
    isDeleting: false, // Peut être étendu si nécessaire
  };
}
