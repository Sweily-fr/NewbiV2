"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { usePermissions } from "@/src/hooks/usePermissions";
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
  CircleXIcon,
  ListFilterIcon,
  Search,
  TrashIcon,
} from "lucide-react";

import { cn } from "@/src/lib/utils";
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
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Label } from "@/src/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/src/components/ui/pagination";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";

import { usePurchaseOrders } from "@/src/graphql/purchaseOrderQueries";
import {
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_COLORS,
} from "@/src/graphql/purchaseOrderQueries";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { usePurchaseOrderTable } from "../hooks/use-purchase-order-table";
import PurchaseOrderRowActions from "./purchase-order-row-actions";
import PurchaseOrderSidebar from "./purchase-order-sidebar";
import { ImportPurchaseOrderModal } from "./import-purchase-order-modal";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";

export default function PurchaseOrderTable({ handleNewPurchaseOrder, poIdToOpen, triggerImport, onImportTriggered }) {
  const inputRef = useRef(null);
  const { purchaseOrders, loading, error, refetch } = usePurchaseOrders();
  const { workspaceId } = useRequiredWorkspace();
  const { canCreate } = usePermissions();
  const [canCreatePo, setCanCreatePo] = useState(false);
  const [poToOpen, setPoToOpen] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const {
    table,
    globalFilter,
    setGlobalFilter,
    statusFilter,
    setStatusFilter,
    selectedRows,
    handleDeleteSelected,
    isDeleting,
  } = usePurchaseOrderTable({
    data: purchaseOrders || [],
    onRefetch: refetch,
  });

  // État pour les tabs de filtre rapide
  const [activeTab, setActiveTab] = useState("all");

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "all") {
      setStatusFilter([]);
    } else if (value === "draft") {
      setStatusFilter(["DRAFT"]);
    } else if (value === "confirmed") {
      setStatusFilter(["CONFIRMED"]);
    } else if (value === "inProgress") {
      setStatusFilter(["IN_PROGRESS"]);
    } else if (value === "delivered") {
      setStatusFilter(["DELIVERED"]);
    }
  };

  // Compter les BC par statut
  const poCounts = useMemo(() => {
    const counts = {
      all: (purchaseOrders || []).length,
      draft: 0,
      confirmed: 0,
      inProgress: 0,
      delivered: 0,
    };
    (purchaseOrders || []).forEach((po) => {
      if (po.status === "DRAFT") counts.draft++;
      else if (po.status === "CONFIRMED") counts.confirmed++;
      else if (po.status === "IN_PROGRESS") counts.inProgress++;
      else if (po.status === "DELIVERED") counts.delivered++;
    });
    return counts;
  }, [purchaseOrders]);

  // Vérifier les permissions
  useEffect(() => {
    const checkPermissions = async () => {
      const allowedCreate = await canCreate("purchaseOrders");
      setCanCreatePo(allowedCreate);
    };
    checkPermissions();
  }, [canCreate]);

  // Ouvrir automatiquement la sidebar si un ID est fourni
  useEffect(() => {
    if (poIdToOpen && purchaseOrders && purchaseOrders.length > 0) {
      const po = purchaseOrders.find((p) => p.id === poIdToOpen);
      if (po) {
        setPoToOpen(po);
      }
    }
  }, [poIdToOpen, purchaseOrders]);

  // Gérer le déclenchement de l'import depuis le parent
  useEffect(() => {
    if (triggerImport) {
      setIsImportModalOpen(true);
      onImportTriggered?.();
    }
  }, [triggerImport, onImportTriggered]);

  if (loading) {
    return <PurchaseOrderTableSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CircleAlertIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">
            Impossible de charger les bons de commande
          </p>
          <Button onClick={refetch}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filters - Desktop */}
      <div className="flex items-center justify-between gap-3 hidden md:flex px-4 sm:px-6 py-4 flex-shrink-0">
        {/* Search + Filtres à gauche */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 h-8 w-full sm:w-[400px] rounded-[9px] border border-[#E6E7EA] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
            <Search size={16} className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
            <Input
              variant="ghost"
              ref={inputRef}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Recherchez par numéro, client ou montant..."
            />
            {Boolean(globalFilter) && (
              <button
                onClick={() => {
                  setGlobalFilter("");
                  inputRef.current?.focus();
                }}
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex items-center justify-center rounded focus-visible:ring-[3px] focus-visible:outline-none cursor-pointer"
                aria-label="Effacer la recherche"
              >
                <CircleXIcon size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Actions à droite */}
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isDeleting}
                  data-mobile-delete-trigger-po
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Supprimer ({selectedRows.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer {selectedRows.length}{" "}
                    bon(s) de commande sélectionné(s) ? Cette action ne peut pas être
                    annulée.
                    <br />
                    <br />
                    <strong>Note :</strong> Seuls les brouillons peuvent
                    être supprimés.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelected}
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

      {/* Tabs de filtre rapide - Desktop */}
      <div className="hidden md:block flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="h-auto rounded-none bg-transparent p-0 pb-2 w-full justify-start px-4 sm:px-6">
            <TabsTrigger
              value="all"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              <span>Tous</span>
              <span className="text-xs text-muted-foreground">
                {poCounts.all}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              <span>Brouillons</span>
              <span className="text-xs text-muted-foreground">
                {poCounts.draft}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="confirmed"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              <span>Confirmés</span>
              <span className="text-xs text-muted-foreground">
                {poCounts.confirmed}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="inProgress"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              <span>En cours</span>
              <span className="text-xs text-muted-foreground">
                {poCounts.inProgress}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="delivered"
              className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
            >
              <span>Livrés</span>
              <span className="text-xs text-muted-foreground">
                {poCounts.delivered}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mobile Toolbar */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Rechercher..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="h-9 pl-3 pr-3 bg-gray-50 dark:bg-gray-900 border-none rounded-md text-sm"
            />
          </div>

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
                  {Object.entries(PURCHASE_ORDER_STATUS_LABELS).map(
                    ([status, label]) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mobile-po-${status}`}
                          checked={statusFilter.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setStatusFilter([...statusFilter, status]);
                            } else {
                              setStatusFilter(
                                statusFilter.filter((s) => s !== status)
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={`mobile-po-${status}`}
                          className="text-sm font-normal"
                        >
                          {label}
                        </Label>
                      </div>
                    )
                  )}
                </div>
                {statusFilter.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setStatusFilter([])}
                    className="w-full mt-3 h-8 px-2 lg:px-3"
                  >
                    Effacer les filtres
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {selectedRows.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="h-9 px-3"
              onClick={() => {
                const deleteButton = document.querySelector(
                  "[data-mobile-delete-trigger-po]"
                );
                if (deleteButton) deleteButton.click();
              }}
            >
              <TrashIcon className="h-4 w-4 mr-1" />({selectedRows.length})
            </Button>
          )}
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:flex md:flex-col flex-1 min-h-0 overflow-hidden">
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
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed">
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b">
                    <td className="p-2 pl-4 sm:pl-6"><div className="h-4 w-4 rounded bg-muted animate-pulse" /></td>
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
                        <div className="h-4 w-[140px] rounded bg-muted animate-pulse" />
                      </div>
                    </td>
                    <td className="p-2"><div className="h-4 w-[70px] rounded bg-muted animate-pulse" /></td>
                    <td className="p-2"><div className="h-4 w-[70px] rounded bg-muted animate-pulse" /></td>
                    <td className="p-2"><div className="h-5 w-[70px] rounded-full bg-muted animate-pulse" /></td>
                    <td className="p-2"><div className="h-4 w-[80px] rounded bg-muted animate-pulse" /></td>
                    <td className="p-2 pr-4 sm:pr-6"><div className="h-7 w-7 rounded bg-muted animate-pulse" /></td>
                  </tr>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer transition-colors"
                    onClick={(e) => {
                      if (
                        e.target.closest('[role="checkbox"]') ||
                        e.target.closest("[data-actions-cell]") ||
                        e.target.closest('button[role="combobox"]') ||
                        e.target.closest('[role="menu"]')
                      ) {
                        return;
                      }
                      const actionsButton =
                        e.currentTarget.querySelector("[data-view-purchase-order]");
                      if (actionsButton) {
                        actionsButton.click();
                      }
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
                    Aucun bon de commande trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table - Mobile */}
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
                      header.column.id === "client" ||
                      header.column.id === "finalTotalTTC" ||
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
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-b border-gray-50 dark:border-gray-800">
                  <TableCell className="py-3 px-4"><div className="h-4 w-4 rounded bg-muted animate-pulse" /></TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
                      <div className="h-4 w-[100px] rounded bg-muted animate-pulse" />
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4"><div className="h-4 w-[60px] rounded bg-muted animate-pulse" /></TableCell>
                  <TableCell className="py-3 px-4"><div className="h-7 w-7 rounded bg-muted animate-pulse" /></TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
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
                        cell.column.id === "client" ||
                        cell.column.id === "finalTotalTTC" ||
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
                  Aucun bon de commande trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - Desktop */}
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

      {/* Sidebar pour ouverture automatique */}
      {poToOpen && (
        <PurchaseOrderSidebar
          purchaseOrder={poToOpen}
          isOpen={!!poToOpen}
          onClose={() => setPoToOpen(null)}
          onRefetch={refetch}
        />
      )}

      {/* Modal d'import de bons de commande */}
      <ImportPurchaseOrderModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
      />
    </div>
  );
}

function PurchaseOrderTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-60" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="bg-background overflow-hidden rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 w-7">
                <Skeleton className="h-4 w-4 rounded" />
              </TableHead>
              <TableHead className="h-11 w-[200px]">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="h-11 w-[120px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="h-11 w-[120px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="h-11 w-[100px]">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead className="h-11 w-[120px]">
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
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
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
