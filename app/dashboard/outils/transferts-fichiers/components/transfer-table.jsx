"use client";

import { useMemo, useState, useEffect } from "react";
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
  MoreHorizontal,
  Trash2,
  Copy,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Clock,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
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
import { useUser } from "@/src/lib/auth/hooks";

// Fonction pour obtenir l'extension du fichier
function getFileExtension(filename) {
  if (!filename) return "";
  return filename.split(".").pop()?.toLowerCase() || "";
}

// Fonction pour obtenir l'icône selon le type de fichier
function getFileIcon(filename) {
  const ext = getFileExtension(filename);
  if (["doc", "docx", "txt", "rtf"].includes(ext)) {
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />;
  }
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
    return <FileImage className="w-4 h-4 text-muted-foreground" />;
  }
  if (["pdf"].includes(ext)) {
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  }
  return <File className="w-4 h-4 text-muted-foreground" />;
}

// Fonction pour filtrer par type de fichier
function filterByType(transfers, filter) {
  if (filter === "all") return transfers;

  return transfers.filter((transfer) => {
    const files = transfer.files || [];
    return files.some((file) => {
      const ext = getFileExtension(file.originalName || file.fileName || "");
      switch (filter) {
        case "documents":
          return ["doc", "docx", "txt", "rtf"].includes(ext);
        case "spreadsheets":
          return ["xls", "xlsx", "csv"].includes(ext);
        case "pdfs":
          return ["pdf"].includes(ext);
        case "images":
          return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(
            ext
          );
        default:
          return true;
      }
    });
  });
}

export default function TransferTable({
  transfers,
  onRefresh,
  loading,
  searchQuery = "",
  activeFilter = "all",
  onSelectionChange,
  deleteButtonRef,
}) {
  const { deleteTransfer, formatFileSize } = useFileTransfer();
  const { session } = useUser();

  // Filtrer les données
  const filteredData = useMemo(() => {
    let result = transfers || [];

    // Filtrer par type
    result = filterByType(result, activeFilter);

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((transfer) => {
        const files = transfer.files || [];
        return files.some((file) =>
          (file.originalName || file.fileName || "")
            .toLowerCase()
            .includes(query)
        );
      });
    }

    return result;
  }, [transfers, activeFilter, searchQuery]);

  const data = useMemo(() => filteredData, [filteredData]);

  // Define columns - Design épuré inspiré de l'image
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
            className="border-muted-foreground/30"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Sélectionner la ligne"
            className="border-muted-foreground/30"
          />
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "files",
        header: () => (
          <span className="text-sm text-muted-foreground font-normal">
            Nom du fichier
          </span>
        ),
        cell: ({ row }) => {
          const transfer = row.original;
          const firstFile = transfer.files?.[0];
          const fileName =
            firstFile?.originalName || firstFile?.fileName || "Fichier";
          const totalSize =
            transfer.files?.reduce((acc, file) => acc + (file.size || 0), 0) ||
            0;
          const ext = getFileExtension(fileName);
          const fileCount = transfer.files?.length || 0;

          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-background">
                {getFileIcon(fileName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {fileName}
                  {fileCount > 1 && (
                    <span className="text-muted-foreground ml-1">
                      (+{fileCount - 1})
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(totalSize)} · {ext || "fichier"}
                </p>
              </div>
            </div>
          );
        },
        size: 300,
      },
      {
        accessorKey: "status",
        header: () => (
          <span className="text-sm text-muted-foreground font-normal">
            Statut
          </span>
        ),
        cell: ({ row }) => {
          const transfer = row.original;
          const isDownloaded = transfer.downloadCount > 0;
          const isExpired = transfer.status === "expired";

          return (
            <div className="flex items-center gap-2">
              {isExpired ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 text-red-600 text-xs font-medium dark:bg-red-900/20 dark:text-red-400">
                  <Clock className="w-3 h-3" />
                  Expiré
                </span>
              ) : isDownloaded ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 text-green-600 text-xs font-medium dark:bg-green-900/20 dark:text-green-400">
                  <Download className="w-3 h-3" />
                  Téléchargé
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-xs font-medium dark:bg-amber-900/20 dark:text-amber-400">
                  <Clock className="w-3 h-3" />
                  En attente
                </span>
              )}
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: "expiryDate",
        header: () => (
          <span className="text-sm text-muted-foreground font-normal">
            Expiration
          </span>
        ),
        cell: ({ row }) => {
          const transfer = row.original;
          if (!transfer.expiryDate)
            return <span className="text-muted-foreground">-</span>;

          const expirationDate = new Date(transfer.expiryDate);
          const now = new Date();
          const isExpired = expirationDate < now;
          const daysLeft = Math.ceil(
            (expirationDate - now) / (1000 * 60 * 60 * 24)
          );

          return (
            <div>
              <p
                className={cn(
                  "text-sm font-medium",
                  isExpired
                    ? "text-red-600 dark:text-red-400"
                    : "text-foreground"
                )}
              >
                {format(expirationDate, "dd MMM yyyy", { locale: fr })}
              </p>
              <p className="text-xs text-muted-foreground">
                {isExpired
                  ? "Expiré"
                  : daysLeft === 0
                    ? "Expire aujourd'hui"
                    : daysLeft === 1
                      ? "Expire demain"
                      : `Dans ${daysLeft} jours`}
              </p>
            </div>
          );
        },
        size: 130,
      },
      {
        accessorKey: "uploadedBy",
        header: () => (
          <span className="text-sm text-muted-foreground font-normal">
            Créé par
          </span>
        ),
        cell: ({ row }) => {
          const userName =
            session?.user?.name || session?.user?.email?.split("@")[0] || "Moi";
          const userEmail = session?.user?.email || "";

          return (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-normal text-foreground truncate">
                  {userName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>
            </div>
          );
        },
        size: 180,
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => {
          const transfer = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-muted"
                  >
                    <span className="sr-only">Ouvrir le menu</span>
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/transfer/${transfer.shareLink}?key=${transfer.accessKey}`
                      );
                      toast.success("Lien copié dans le presse-papiers");
                    }}
                    className="cursor-pointer"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copier le lien
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteTransfer(transfer.id)}
                    className="text-destructive cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 50,
        enableHiding: false,
      },
    ],
    [session, formatFileSize]
  );

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Get selected rows
  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);
  const [isDeleting, setIsDeleting] = useState(false);
  const [transferToDelete, setTransferToDelete] = useState(null);

  // Notifier le parent du changement de sélection
  useEffect(() => {
    onSelectionChange?.({
      count: selectedRows.length,
      isDeleting,
      onDelete: handleDeleteSelected,
      onResetSelection: () => table.resetRowSelection(),
    });
  }, [selectedRows.length, isDeleting]);

  const viewTransfer = (shareLink) => {
    window.open(`/dashboard/outils/transferts-fichiers/${shareLink}`, "_blank");
  };

  const handleDeleteTransfer = async (transferId) => {
    setTransferToDelete(transferId);
  };

  const confirmDeleteTransfer = async () => {
    if (!transferToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTransfer(transferToDelete);
      onRefresh?.();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression du transfert");
    } finally {
      setIsDeleting(false);
      setTransferToDelete(null);
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

  return (
    <div className="space-y-4">
      {/* AlertDialog pour suppression individuelle */}
      <AlertDialog
        open={!!transferToDelete}
        onOpenChange={() => setTransferToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce transfert ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTransfer}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Table épurée */}
      <div className="w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="h-10 px-3"
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
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-3">
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
                  className="h-32 text-center text-muted-foreground"
                >
                  {loading ? "Chargement..." : "Aucun transfert trouvé."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination simple avec numéros */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4">
          {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
            const pageIndex = table.getState().pagination.pageIndex;
            const totalPages = table.getPageCount();

            // Calculer les pages à afficher
            let startPage = Math.max(0, pageIndex - 2);
            let endPage = Math.min(totalPages - 1, startPage + 4);

            if (endPage - startPage < 4) {
              startPage = Math.max(0, endPage - 4);
            }

            const pageNum = startPage + i;
            if (pageNum > endPage) return null;

            return (
              <button
                key={pageNum}
                onClick={() => table.setPageIndex(pageNum)}
                className={cn(
                  "w-8 h-8 text-sm rounded-lg transition-colors cursor-pointer",
                  pageIndex === pageNum
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {pageNum + 1}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
