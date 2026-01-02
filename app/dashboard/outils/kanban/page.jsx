"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { RoleRouteGuard } from "@/src/components/rbac/RBACRouteGuard";
import {
  Plus,
  Trash2,
  LoaderCircle,
  Search,
  Calendar,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { flexRender } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
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
import { Skeleton } from "@/src/components/ui/skeleton";
import { useKanbanBoards } from "./hooks/useKanbanBoards";
import { useKanbanBoardsTable } from "./hooks/useKanbanBoardsTable";

function KanbanPageContent() {
  const router = useRouter();
  const [boardPreview, setBoardPreview] = React.useState(null);

  const {
    // State
    boardToDelete,
    setBoardToDelete,
    boardToEdit,
    setBoardToEdit,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    formData,
    setFormData,

    // Data & Loading States
    boards,
    loading,
    queryLoading,
    isInitialLoading,
    creating,
    updating,
    deleting,

    // Handlers
    handleCreateBoard,
    handleUpdateBoard,
    handleDeleteClick,
    handleEditClick,
    handleConfirmDelete,
    formatDate,
  } = useKanbanBoards();

  // Hook pour le tableau
  const { table, globalFilter, setGlobalFilter, selectedRows } =
    useKanbanBoardsTable({
      data: boards,
      onEdit: handleEditClick,
      onDelete: (board) => setBoardToDelete(board),
      onPreview: (board) => setBoardPreview(board),
      formatDate,
    });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-medium mb-2">Tableaux Kanban</h1>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              className="font-normal bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau tableau
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] p-6">
            <form onSubmit={handleCreateBoard}>
              <DialogHeader>
                <DialogTitle>Créer un nouveau tableau</DialogTitle>
                <DialogDescription>
                  Créez un nouveau tableau Kanban pour organiser vos tâches.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-foreground">
                    Titre *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Nom du tableau"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-foreground">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Description du tableau (optionnel)"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="relative max-w-md">
          <Input
            placeholder="Rechercher un tableau..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full sm:w-[400px] ps-9"
          />
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
            <Search size={16} aria-hidden="true" />
          </div>
        </div>

        {/* Bulk delete */}
        {selectedRows.length > 0 && (
          <AlertDialog>
            <Button
              variant="destructive"
              onClick={() => {
                selectedRows.forEach((board) => setBoardToDelete(board));
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer ({selectedRows.length})
            </Button>
          </AlertDialog>
        )}
      </div>

      {/* Table */}
      {isInitialLoading ? (
        <KanbanTableSkeleton />
      ) : boards?.length === 0 && !globalFilter ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-foreground mb-6 text-center">
              <h3 className="text-xl font-medium mb-2">
                Commencez votre organisation
              </h3>
              <p className="text-sm text-muted-foreground">
                Créez votre premier tableau Kanban pour organiser vos tâches et
                projets
              </p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              variant="default"
              className="flex items-center gap-2 font-normal"
            >
              Créer votre premier tableau
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
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
                              header.getContext()
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
                          `/dashboard/outils/kanban/${row.original.id}`
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
                      {globalFilter
                        ? "Aucun tableau trouvé."
                        : "Aucun tableau créé."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 bg-background flex-shrink-0">
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
                {table.getPageCount() || 1}
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
                      aria-label="Première page"
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
                      aria-label="Page précédente"
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
                      aria-label="Page suivante"
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
                      aria-label="Dernière page"
                    >
                      <ChevronLastIcon size={14} aria-hidden="true" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <form onSubmit={handleUpdateBoard}>
            <DialogHeader className="border-b pb-6 mb-6">
              <DialogTitle className="text-2xl font-bold text-foreground">
                Modifier le tableau
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Modifiez les informations de votre tableau Kanban.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-sm font-semibold text-foreground">
                  Titre *
                </Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Nom du tableau"
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-sm font-semibold text-foreground">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Description du tableau (optionnel)"
                  rows={4}
                  className="rounded-lg resize-none"
                />
              </div>
            </div>
            <DialogFooter className="mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="px-6"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={updating} className="px-6">
                {updating ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Modification...
                  </>
                ) : (
                  "Modifier"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!boardToDelete}
        onOpenChange={(open) => !open && setBoardToDelete(null)}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader className="border-b pb-4">
            <AlertDialogTitle className="text-foreground">
              Supprimer le tableau
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer ce tableau ? Cette action est
              irréversible et supprimera également toutes les colonnes et tâches
              associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer définitivement"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={!!boardPreview} onOpenChange={(open) => !open && setBoardPreview(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader className="border-b pb-6 mb-6 pr-8">
            <DialogTitle className="text-foreground text-2xl font-bold break-words" style={{ wordBreak: 'break-word' }}>
              {boardPreview?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Description Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Description
              </h3>
              <p className="text-base text-foreground break-words whitespace-pre-wrap leading-relaxed" style={{ wordBreak: 'break-word' }}>
                {boardPreview?.description || "Aucune description"}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t flex items-center justify-between">
            {/* Date en bas à gauche */}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">
                Créé le <span className="font-medium">{boardPreview && formatDate(boardPreview.createdAt)}</span>
              </span>
            </div>
            
            {/* Bouton en bas à droite */}
            <Button
              variant="outline"
              onClick={() => setBoardPreview(null)}
              className="px-6"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function KanbanPage() {
  return (
    <RoleRouteGuard 
      roles={["owner", "admin", "member", "viewer"]}
      fallbackUrl="/dashboard"
      toastMessage="Vous n'avez pas accès aux tableaux Kanban. Cette fonctionnalité est réservée aux membres de l'équipe."
    >
      <KanbanPageContent />
    </RoleRouteGuard>
  );
}

function KanbanTableSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 sm:px-6">
      {/* Table Header Skeleton */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 py-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>

      {/* Table Body Skeleton */}
      <div className="flex-1 overflow-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-gray-800"
          >
            <Skeleton className="h-4 w-4" />
            <div className="flex-1">
              <Skeleton className="h-4 w-[250px] mb-2" />
              <Skeleton className="h-3 w-[180px]" />
            </div>
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[100px]" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
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
  );
}
