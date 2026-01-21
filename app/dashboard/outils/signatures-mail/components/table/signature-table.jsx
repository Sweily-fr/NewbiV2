"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  Search,
  TrashIcon,
  ArrowUpDown,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/src/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  useSignatures,
  useSignatureActions,
} from "../../hooks/use-signature-table";
import SignatureRowActions from "./signature-row-actions";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useRouter } from "next/navigation";

const SIGNATURE_STATUS_LABELS = {
  DEFAULT: "Par défaut",
  ACTIVE: "Active",
};

const SIGNATURE_STATUS_COLORS = {
  DEFAULT: "bg-green-100 font-normal text-green-800 border-green-200",
  ACTIVE: "bg-blue-100 font-normal text-blue-800 border-blue-200",
};

export default function SignatureTable() {
  const router = useRouter();
  const { signatures, loading, error, refetch } = useSignatures();
  const signatureActions = useSignatureActions();

  const {
    table,
    globalFilter,
    setGlobalFilter,
    statusFilter,
    setStatusFilter,
    selectedRows,
    handleDeleteSelected,
    isDeleting,
  } = useSignatureTable({
    data: signatures || [],
    onRefetch: refetch,
    actions: signatureActions,
  });

  if (loading) {
    return <SignatureTableSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CircleAlertIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">
            Impossible de charger les signatures
          </p>
          <Button onClick={() => refetch()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filters and Search - Fixe en haut */}
      <div className="flex items-center justify-between gap-3 hidden md:flex px-4 sm:px-6 py-4 flex-shrink-0">
        {/* Search */}
        <div className="relative max-w-md">
          <Input
            placeholder="Recherchez par nom de signature, nom complet ou email..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full sm:w-[490px] lg:w-[490px] ps-9"
          />
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
            <Search size={16} aria-hidden="true" />
          </div>
        </div>

        {/* Actions à droite */}
        <div className="flex items-center gap-2">
          {/* Bulk delete */}
          {table.getSelectedRowModel().rows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="text-white">
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Supprimer ({table.getSelectedRowModel().rows.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer{" "}
                    {table.getSelectedRowModel().rows.length} signature(s) ?
                    Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteSelected()}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Table - Desktop style avec header fixe et body scrollable */}
      <div className="hidden md:flex md:flex-col flex-1 min-h-0 overflow-hidden">
        {/* Table Header */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
          <table className="w-full table-fixed">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, index, arr) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={`h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground ${index === 0 ? "pl-4 sm:pl-6" : ""} ${index === arr.length - 1 ? "pr-4 sm:pr-6" : ""}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
          </table>
        </div>

        {/* Table Body - Scrollable */}
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed">
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer transition-colors"
                    onClick={(e) => {
                      // Ne pas naviguer si on clique sur la checkbox ou les actions
                      if (
                        e.target.closest('[role="checkbox"]') ||
                        e.target.closest("[data-actions-cell]")
                      ) {
                        return;
                      }
                      router.push(
                        `/dashboard/outils/signatures-mail/${row.original.id}`,
                      );
                    }}
                  >
                    {row.getVisibleCells().map((cell, index, arr) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className={`p-2 align-middle text-sm ${index === 0 ? "pl-4 sm:pl-6" : ""} ${index === arr.length - 1 ? "pr-4 sm:pr-6" : ""}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center p-2"
                  >
                    {globalFilter
                      ? "Aucune signature trouvée."
                      : "Aucune signature créée."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Pagination - Fixe en bas sur desktop */}
      <div className="hidden md:flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 bg-background flex-shrink-0">
        <div className="flex-1 text-xs font-normal text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} sur{" "}
          {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
        </div>
        <div className="flex items-center space-x-4 lg:space-x-6">
          <div className="flex items-center gap-1.5">
            <p className="whitespace-nowrap text-xs font-normal">
              Lignes par page
            </p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-7 w-[60px] text-xs">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center whitespace-nowrap text-xs font-normal">
            Page {table.getState().pagination.pageIndex + 1} sur{" "}
            {table.getPageCount()}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to first page"
                >
                  <ChevronFirstIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to last page"
                >
                  <ChevronLastIcon size={14} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}

// Hook personnalisé pour la table des signatures
function useSignatureTable({ data, onRefetch, actions }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
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
        enableSorting: false,
        enableHiding: false,
        size: 28,
      },
      {
        accessorKey: "signatureName",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nom de la signature
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const signature = row.original;
          return (
            <div className="min-h-[40px] flex flex-col justify-center">
              <div className="font-medium">{signature.signatureName}</div>
              {signature.companyName && (
                <div className="text-xs font-normal text-muted-foreground truncate max-w-[200px]">
                  {signature.companyName}
                </div>
              )}
            </div>
          );
        },
        size: 250,
        enableHiding: false,
      },
      {
        accessorKey: "fullName",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nom complet
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const firstName = row.original.firstName || "";
          const lastName = row.original.lastName || "";
          const fullName = `${firstName} ${lastName}`.trim() || "Non défini";
          return (
            <div
              className={!firstName && !lastName ? "text-muted-foreground" : ""}
            >
              {fullName}
            </div>
          );
        },
        size: 180,
      },
      {
        accessorKey: "position",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Poste
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const position = row.getValue("position");
          return (
            <div className={!position ? "text-muted-foreground" : ""}>
              {position || "Non défini"}
            </div>
          );
        },
        size: 150,
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
            <div
              className={
                !email ? "text-muted-foreground" : "truncate max-w-[200px]"
              }
            >
              {email || "Non défini"}
            </div>
          );
        },
        size: 200,
      },
      {
        id: "actions",
        header: () => <div className="text-right font-normal">Actions</div>,
        cell: ({ row }) => (
          <div data-actions-cell>
            <SignatureRowActions
              signature={row.original}
              onEdit={actions.handleEdit}
              onDelete={actions.handleDelete}
              onDuplicate={actions.handleDuplicate}
              onToggleFavorite={actions.handleToggleFavorite}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 80,
      },
    ],
    [actions],
  );

  const filteredData = useMemo(() => {
    let filtered = data;

    if (statusFilter) {
      filtered = filtered.filter((signature) => {
        if (statusFilter === "DEFAULT") return signature.isDefault;
        if (statusFilter === "ACTIVE") return !signature.isDefault;
        return true;
      });
    }

    return filtered;
  }, [data, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleDeleteSelected = async () => {
    if (!table.getSelectedRowModel().rows.length) return;

    setIsDeleting(true);
    try {
      const selectedIds = table
        .getSelectedRowModel()
        .rows.map((row) => row.original.id);
      await actions.handleDeleteMultiple(selectedIds);
      table.resetRowSelection();
      // Ne pas faire de refetch - le cache Apollo est mis à jour directement
      // onRefetch?.();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    } finally {
      setIsDeleting(false);
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
    isDeleting,
  };
}

// Ce hook est maintenant défini dans use-signature-table.js

function SignatureTableSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-200px)] overflow-hidden">
      {/* Search Bar Skeleton */}
      <div className="flex items-center justify-between gap-3 py-4 flex-shrink-0">
        <Skeleton className="h-9 w-[400px]" />
      </div>

      {/* Table Skeleton */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Table Header Skeleton */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 py-3">
          <div className="flex items-center gap-4 px-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[180px]" />
            <Skeleton className="h-4 w-[140px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[160px]" />
            <Skeleton className="h-4 w-[60px]" />
          </div>
        </div>

        {/* Table Body Skeleton */}
        <div className="flex-1 overflow-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-4 px-4 border-b border-gray-100 dark:border-gray-800"
            >
              <Skeleton className="h-4 w-4" />
              <div className="flex-1">
                <Skeleton className="h-4 w-[200px] mb-2" />
                <Skeleton className="h-3 w-[140px]" />
              </div>
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[140px]" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
          <Skeleton className="h-4 w-[150px]" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-7 w-[100px]" />
            <Skeleton className="h-4 w-[80px]" />
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
