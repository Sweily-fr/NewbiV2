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
  Search,
  ListFilterIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/src/components/ui/pagination";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import { useFileTransfer } from "../hooks/useFileTransfer";
import { useUser } from "@/src/lib/auth/hooks";
import { TransferDetailDrawer } from "./transfer-detail-drawer";
import { Skeleton } from "@/src/components/ui/skeleton";

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

export default function TransferTable({
  transfers,
  onRefresh,
  loading,
  searchQuery = "",
  setSearchQuery,
  activeTab = "all",
  onTabChange,
  transferCounts = {},
  onSelectionChange,
  selectionState,
  onShowDeleteDialog,
  isMobile = false,
}) {
  const { deleteTransfer, formatFileSize } = useFileTransfer();
  const { session } = useUser();

  // Filtrer les données par statut (tab)
  const filteredData = useMemo(() => {
    let result = transfers || [];

    // Filtrer par statut (tab)
    if (activeTab === "active") {
      result = result.filter(
        (t) => t.status !== "expired" && t.downloadCount === 0
      );
    } else if (activeTab === "downloaded") {
      result = result.filter(
        (t) => t.downloadCount > 0 && t.status !== "expired"
      );
    } else if (activeTab === "expired") {
      result = result.filter((t) => t.status === "expired");
    }

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
  }, [transfers, activeTab, searchQuery]);

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
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#5a50ff]/10 text-[#5a50ff]/600 text-xs font-medium dark:bg-[#5a50ff]/20 dark:text-[#5a50ff]/400">
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
                  "text-xs font-normal",
                  isExpired ? "dark:text-white-400" : "text-foreground"
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
                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                    <span className="text-red-500">Supprimer</span>
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
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // Ouvrir le drawer de détail
  const openTransferDetail = (transfer) => {
    setSelectedTransfer(transfer);
    setDrawerOpen(true);
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

  if (loading) {
    return <TransferTableSkeleton />;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
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

      {/* Filters and Search - Desktop */}
      <div className="flex items-center justify-between gap-3 hidden md:flex px-4 sm:px-6 py-4 flex-shrink-0">
        {/* Search */}
        <div className="relative max-w-md">
          <Input
            placeholder="Recherchez par nom de fichier..."
            value={searchQuery ?? ""}
            onChange={(event) => setSearchQuery?.(event.target.value)}
            className="w-full sm:w-[490px] lg:w-[490px] ps-9"
          />
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
            <Search size={16} aria-hidden="true" />
          </div>
        </div>

        {/* Actions à droite */}
        <div className="flex items-center gap-2">
          {/* Bulk delete - visible quand des rows sont sélectionnées */}
          {selectedRows.length > 0 && (
            <Button
              variant="destructive"
              onClick={onShowDeleteDialog}
              disabled={isDeleting}
              data-mobile-delete-trigger-transfer
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Supprimer ({selectedRows.length})
            </Button>
          )}
        </div>
      </div>

      {/* Tabs de filtre rapide - Desktop */}
      <div className="hidden md:block flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="h-auto rounded-none bg-transparent p-0 w-full justify-start px-4 sm:px-6">
            <TabsTrigger
              value="all"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-normal"
            >
              Tous les transferts
              <span className="ml-2 text-xs text-muted-foreground">
                {transferCounts.all}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-normal"
            >
              En attente
              <span className="ml-2 text-xs text-muted-foreground">
                {transferCounts.active}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="downloaded"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-normal"
            >
              Téléchargés
              <span className="ml-2 text-xs text-muted-foreground">
                {transferCounts.downloaded}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="expired"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-normal"
            >
              Expirés
              <span className="ml-2 text-xs text-muted-foreground">
                {transferCounts.expired}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table - Desktop style avec header fixe et body scrollable */}
      <div className="hidden md:flex md:flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header fixe */}
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
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
          </table>
        </div>
        {/* Body scrollable */}
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
                      // Ne pas ouvrir le drawer si on clique sur la checkbox ou les actions
                      if (
                        e.target.closest('[role="checkbox"]') ||
                        e.target.closest("[data-actions-cell]") ||
                        e.target.closest('button[role="combobox"]') ||
                        e.target.closest('[role="menu"]') ||
                        e.target.closest("button")
                      ) {
                        return;
                      }
                      openTransferDetail(row.original);
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
                          cell.getContext()
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
                    Aucun transfert trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Toolbar */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Input
              placeholder="Rechercher des transferts..."
              value={searchQuery ?? ""}
              onChange={(event) => setSearchQuery?.(event.target.value)}
              className="h-9 pl-3 pr-3 bg-gray-50 dark:bg-gray-900 border-none rounded-md text-sm"
            />
          </div>

          {/* Filter Button - Icon only */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <ListFilterIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end">
              <div className="p-4">
                <h4 className="font-medium leading-none mb-3">
                  Filtrer par statut
                </h4>
                <div className="space-y-2">
                  {[
                    { id: "all", label: "Tous" },
                    { id: "active", label: "En attente" },
                    { id: "downloaded", label: "Téléchargés" },
                    { id: "expired", label: "Expirés" },
                  ].map((status) => (
                    <div
                      key={status.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`mobile-transfer-${status.id}`}
                        checked={activeTab === status.id}
                        onCheckedChange={() => onTabChange?.(status.id)}
                      />
                      <Label
                        htmlFor={`mobile-transfer-${status.id}`}
                        className="text-sm font-normal"
                      >
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Delete button for mobile */}
          {selectedRows.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="h-9 px-3"
              onClick={onShowDeleteDialog}
            >
              <TrashIcon className="h-4 w-4 mr-1" />({selectedRows.length})
            </Button>
          )}
        </div>
      </div>

      {/* Table - Mobile style */}
      <div className="md:hidden overflow-x-auto pb-20">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-gray-100 dark:border-gray-400"
              >
                {headerGroup.headers
                  .filter(
                    (header) =>
                      header.column.id === "select" ||
                      header.column.id === "files" ||
                      header.column.id === "status" ||
                      header.column.id === "actions"
                  )
                  .map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-400"
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
                  className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-25 dark:hover:bg-gray-900"
                >
                  {row
                    .getVisibleCells()
                    .filter(
                      (cell) =>
                        cell.column.id === "select" ||
                        cell.column.id === "files" ||
                        cell.column.id === "status" ||
                        cell.column.id === "actions"
                    )
                    .map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-4 text-sm">
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
                  colSpan={4}
                  className="h-24 text-center text-gray-500 dark:text-gray-400"
                >
                  Aucun transfert trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
              <SelectTrigger className="h-7 w-[70px] text-xs">
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

      {/* Drawer de détail du transfert */}
      <TransferDetailDrawer
        transfer={selectedTransfer}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onDelete={(transfer) => {
          setDrawerOpen(false);
          handleDeleteTransfer(transfer.id);
        }}
      />
    </div>
  );
}

function TransferTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filters skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-60" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-background overflow-hidden rounded-md border mx-4 sm:mx-6">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 w-7">
                <Skeleton className="h-4 w-4 rounded" />
              </TableHead>
              <TableHead className="h-11 w-[200px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="h-11 w-[100px]">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead className="h-11 w-[120px]">
                <Skeleton className="h-4 w-14" />
              </TableHead>
              <TableHead className="h-11 w-[150px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="h-11 w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell>
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
