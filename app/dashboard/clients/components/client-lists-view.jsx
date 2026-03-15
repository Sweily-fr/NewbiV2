'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/src/components/ui/sonner';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Edit2, Trash2, Users, MoreHorizontal, ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon, List } from 'lucide-react';
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '@/src/components/ui/empty';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';
import EditListDialog from './edit-list-dialog';
import DeleteListDialog from './delete-list-dialog';
import ListClientsView from './list-clients-view';
import { useDeleteClientList } from '@/src/hooks/useClientLists';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
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
} from '@/src/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/src/components/ui/pagination';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';

export default function ClientListsView({ workspaceId, lists, onListsUpdated, selectedList: initialSelectedList, onSelectListChange, globalFilter = '', onCreateList, onViewingListChange }) {
  const router = useRouter();
  const [selectedList, setSelectedList] = useState(initialSelectedList || null);
  const [editingList, setEditingList] = useState(null);
  const [deletingList, setDeletingList] = useState(null);
  const { deleteList } = useDeleteClientList();

  // Mettre à jour selectedList quand initialSelectedList change
  useEffect(() => {
    if (initialSelectedList) {
      setSelectedList(initialSelectedList);
    }
  }, [initialSelectedList]);

  // Notifier le parent quand on entre/sort de la vue détail
  useEffect(() => {
    onViewingListChange?.(!!selectedList);
  }, [selectedList, onViewingListChange]);

  const handleDeleteList = async (listId) => {
    try {
      await deleteList(workspaceId, listId);
      setDeletingList(null);
      onListsUpdated();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  // État pour les lignes sélectionnées
  const [rowSelection, setRowSelection] = useState({});
  const [isDeleteMultipleOpen, setIsDeleteMultipleOpen] = useState(false);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  // Colonnes du tableau - Style identique au Kanban
  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => {
          const checkboxRef = React.useRef(null);
          React.useEffect(() => {
            if (checkboxRef.current) {
              checkboxRef.current.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
            }
          }, [table.getIsSomeRowsSelected(), table.getIsAllRowsSelected()]);
          return (
            <input
              ref={checkboxRef}
              type="checkbox"
              checked={table.getIsAllRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
              className="cursor-pointer"
              role="checkbox"
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="cursor-pointer"
            role="checkbox"
          />
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: 'Nom',
        size: 300,
        cell: (info) => {
          const list = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: list.color }}
              />
              <span className="truncate">{list.name}</span>
              {list.isDefault && (
                <Badge variant="outline" className="text-xs font-normal">
                  Par défaut
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 300,
        cell: (info) => {
          const description = info.getValue();
          if (!description) return <span className="text-muted-foreground">-</span>;
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground truncate block max-w-[250px] cursor-default">
                    {description}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px]">
                  <p className="text-sm">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
      },
      {
        accessorKey: 'clientCount',
        header: 'Contacts',
        size: 150,
        cell: (info) => (
          <Badge variant="secondary" className="gap-1 font-normal w-fit">
            <Users className="w-3 h-3" />
            {info.getValue()}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 100,
        cell: (info) => {
          const list = info.row.original;
          if (list.isDefault) return null;
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setEditingList(list)}
                    className="cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeletingList(list)}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    []
  );

  // Créer la table avec React Table
  const table = useReactTable({
    data: lists,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, columnId, filterValue) => {
      const name = row.original.name?.toLowerCase() || '';
      const description = row.original.description?.toLowerCase() || '';
      return name.includes(filterValue.toLowerCase()) || description.includes(filterValue.toLowerCase());
    },
  });

  // Récupérer les lignes sélectionnées
  const selectedRowsData = table.getSelectedRowModel().rows.map(row => row.original);

  if (selectedList) {
    return (
      <ListClientsView
        workspaceId={workspaceId}
        list={selectedList}
        onBack={() => setSelectedList(null)}
        onListUpdated={onListsUpdated}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Bulk actions */}
      {selectedRowsData.length > 0 && (
        <div className="flex items-center justify-end px-4 sm:px-6 py-2 flex-shrink-0">
          <AlertDialog open={isDeleteMultipleOpen} onOpenChange={setIsDeleteMultipleOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer ({selectedRowsData.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer les listes</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer {selectedRowsData.length} liste(s) ?
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    setIsDeletingMultiple(true);
                    try {
                      for (const list of selectedRowsData) {
                        await handleDeleteList(list.id);
                      }
                      table.resetRowSelection();
                    } finally {
                      setIsDeletingMultiple(false);
                      setIsDeleteMultipleOpen(false);
                    }
                  }}
                  className="bg-destructive text-white hover:bg-destructive/90"
                  disabled={isDeletingMultiple}
                >
                  {isDeletingMultiple ? (
                    <>
                      <Trash2 className="mr-2 h-4 w-4 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    "Supprimer définitivement"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Table */}
      {lists?.length === 0 && !globalFilter ? (
        <div className="flex-1 flex items-center justify-center">
          <Empty>
            <EmptyMedia variant="icon"><List /></EmptyMedia>
            <EmptyHeader className="max-w-md">
              <EmptyTitle>Commencez votre organisation</EmptyTitle>
              <EmptyDescription>Créez votre première liste pour organiser vos contacts par catégories ou segments.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={onCreateList} className="font-normal">
                Créer votre première liste
              </Button>
            </EmptyContent>
          </Empty>
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
                        const isCheckbox = e.target.closest('[role="checkbox"]');
                        const isButton = e.target.closest('[role="button"]');
                        const isActionsCell = e.target.closest('[data-actions-cell="true"]');
                        const isInput = e.target.closest('input');
                        
                        if (isCheckbox || isButton || isActionsCell || isInput) {
                          return;
                        }
                        
                        // Afficher les clients de la liste
                        setSelectedList(row.original);
                        if (onSelectListChange) {
                          onSelectListChange(row.original);
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell, index, arr) => (
                        <td
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                          className={`p-2 align-middle text-sm ${index === 0 ? "pl-4 sm:pl-6" : ""} ${index === arr.length - 1 ? "pr-4 sm:pr-6" : ""}`}
                          data-actions-cell={cell.column.id === 'actions' ? "true" : undefined}
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
                        ? "Aucune liste trouvée."
                        : "Aucune liste créée."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 bg-background flex-shrink-0">
            <div className="flex-1 text-xs font-normal text-muted-foreground">
              {table.getFilteredRowModel().rows.length} liste(s)
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

      {editingList && (
        <EditListDialog
          open={!!editingList}
          onOpenChange={(open) => !open && setEditingList(null)}
          workspaceId={workspaceId}
          list={editingList}
          onListUpdated={onListsUpdated}
        />
      )}

      {deletingList && (
        <DeleteListDialog
          open={!!deletingList}
          onOpenChange={(open) => !open && setDeletingList(null)}
          workspaceId={workspaceId}
          list={deletingList}
          onListDeleted={() => handleDeleteList(deletingList.id)}
        />
      )}
    </div>
  );
}
