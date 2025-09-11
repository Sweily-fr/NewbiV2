"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontal,
  Download,
  Eye,
  Trash2,
  Copy,
  ExternalLink,
  FileText,
  User as IconUser,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
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
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import { useFileTransfer } from "../hooks/useFileTransfer";

export default function TransferTable({ transfers, onRefresh, loading }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const { deleteTransfer, copyShareLink, formatFileSize } = useFileTransfer();

  const data = useMemo(() => transfers || [], [transfers]);

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
        accessorKey: "files",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Fichiers
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const transfer = row.original;
          const totalSize = transfer.files.reduce(
            (acc, file) => acc + (file.size || 0),
            0
          );
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <FileText size={16} className="text-muted-foreground" />
                <span className="font-normal">
                  {transfer.files.length} fichier
                  {transfer.files.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(totalSize)}
              </div>
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: "recipientEmail",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Destinataire
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const transfer = row.original;
          return transfer.recipientEmail ? (
            <div className="flex items-center gap-1">
              <IconUser size={14} className="text-muted-foreground" />
              <span className="text-sm font-normal">
                {transfer.recipientEmail}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground font-normal">-</span>
          );
        },
        size: 200,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Statut
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const transfer = row.original;
          return (
            <Badge
              className={cn(
                "font-normal",
                transfer.status === "active"
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : transfer.status === "expired"
                    ? "bg-red-100 text-red-800 hover:bg-red-100"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
              )}
            >
              {transfer.status === "active"
                ? "Actif"
                : transfer.status === "expired"
                  ? "Expiré"
                  : "Inactif"}
            </Badge>
          );
        },
        size: 100,
      },
      {
        accessorKey: "expiresAt",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Expiration
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const transfer = row.original;
          if (!transfer.expiresAt) return "-";
          const expirationDate = new Date(transfer.expiresAt);
          const isExpired = expirationDate < new Date();
          return (
            <div className={cn(isExpired && "text-destructive font-normal")}>
              <div className="font-normal">
                {format(expirationDate, "dd/MM/yyyy", { locale: fr })}
              </div>
              {isExpired && <div className="text-xs">Expiré</div>}
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: "downloadCount",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Téléchargements
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const transfer = row.original;
          return (
            <span className="font-normal">{transfer.downloadCount || 0}</span>
          );
        },
        size: 120,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer font-normal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Créé le
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => {
          const transfer = row.original;
          return (
            <div className="font-normal">
              {format(new Date(transfer.createdAt), "dd/MM/yyyy", {
                locale: fr,
              })}
            </div>
          );
        },
        size: 120,
      },
      {
        id: "actions",
        header: () => <div className="text-right font-normal">Actions</div>,
        cell: ({ row }) => {
          const transfer = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Ouvrir le menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/transfer/${transfer.shareLink}?key=${transfer.accessKey}`
                      );
                      toast.success("Lien copié dans le presse-papiers");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copier le lien
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem
                    onClick={() => {
                      window.open(
                        `/transfer/${transfer.shareLink}?key=${transfer.accessKey}`,
                        "_blank"
                      );
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ouvrir
                  </DropdownMenuItem> */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteTransfer(transfer.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 60,
        enableHiding: false,
      },
    ],
    []
  );

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  // Get selected rows
  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);
  const [isDeleting, setIsDeleting] = useState(false);

  const viewTransfer = (shareLink) => {
    window.open(`/dashboard/outils/transferts-fichiers/${shareLink}`, "_blank");
  };

  const handleDeleteTransfer = async (transferId) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce transfert ?")) {
      setIsDeleting(true);
      try {
        await deleteTransfer(transferId);
        toast.success("Transfert supprimé avec succès");
        onRefresh?.();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error("Erreur lors de la suppression du transfert");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteSelected = async () => {
    const selectedTransferIds = selectedRows.map((row) => row.id);
    if (selectedTransferIds.length === 0) return;

    setIsDeleting(true);
    try {
      const deletePromises = selectedTransferIds.map((transferId) =>
        deleteTransfer(transferId)
      );

      await Promise.all(deletePromises);

      toast.success(
        `${selectedTransferIds.length} transfert(s) supprimé(s) avec succès`
      );
      table.resetRowSelection();
      onRefresh?.();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression des transferts");
    } finally {
      setIsDeleting(false);
    }
  };

  // ...

  return (
    <div className="space-y-4">
      {/* Actions en haut */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {selectedRows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer ({selectedRows.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer {selectedRows.length}{" "}
                    transfert(s) ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelected}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  Aucun transfert trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm font-normal text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} sur{" "}
          {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center gap-2">
            <p className="whitespace-nowrap text-sm font-normal">
              Lignes par page
            </p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
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
          <div className="flex items-center whitespace-nowrap text-sm font-normal">
            Page {table.getState().pagination.pageIndex + 1} sur{" "}
            {table.getPageCount()}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to first page"
                >
                  <ChevronFirstIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to last page"
                >
                  <ChevronLastIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
