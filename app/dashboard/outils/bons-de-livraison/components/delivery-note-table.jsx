"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { sortByDateDesc } from "@/src/lib/document-dates";
import { flexRender } from "@tanstack/react-table";
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
  Truck,
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
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { TableEmptyState } from "@/src/components/ui/table-empty-state";
import { AnimatePresence } from "framer-motion";
import {
  useDeliveryNotes,
  DELIVERY_NOTE_STATUS_LABELS,
  formatDeliveryNoteReference,
} from "@/src/graphql/deliveryNoteQueries";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useEmailTrackingSubscription } from "@/src/graphql/documentEmailQueries";
import { useDeliveryNoteTable } from "../hooks/use-delivery-note-table";
import DeliveryNoteSidebar from "./delivery-note-sidebar";
import DeliveryNoteFilters from "./delivery-note-filters";
import { DeliveryNoteTableSkeleton } from "./delivery-note-page-skeleton";
import { SendDocumentModal } from "../../factures/components/send-document-modal";

const TAB_CLASS =
  "relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground data-[hovered]:shadow-[inset_0_0_0_1px_#EEEFF1] dark:data-[hovered]:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]";

const TABS = [
  { value: "all", label: "Tous", statuses: null },
  { value: "draft", label: "Brouillons", statuses: ["DRAFT"] },
  { value: "pending", label: "À expédier", statuses: ["PENDING"] },
  { value: "shipped", label: "Expédiés", statuses: ["SHIPPED"] },
  { value: "delivered", label: "Livrés", statuses: ["DELIVERED"] },
];

const formatEmailDate = (value) => {
  if (!value) return null;
  try {
    const d =
      typeof value === "string" && /^\d+$/.test(value)
        ? new Date(parseInt(value, 10))
        : new Date(value);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString("fr-FR");
  } catch {
    return null;
  }
};

export default function DeliveryNoteTable({ dnIdToOpen }) {
  const inputRef = useRef(null);
  const { deliveryNotes, loading, error, refetch } = useDeliveryNotes();
  const { workspaceId } = useRequiredWorkspace();

  useEmailTrackingSubscription({
    workspaceId,
    onUpdate: (update) => {
      if (update.documentType === "deliveryNote") refetch();
    },
  });

  // Sidebar et modal d'envoi gérées au niveau du tableau (évite les re-renders par ligne)
  const [sidebarDeliveryNote, setSidebarDeliveryNote] = useState(null);
  const [sendEmailDN, setSendEmailDN] = useState(null);

  const sortedDeliveryNotes = useMemo(
    () => sortByDateDesc(deliveryNotes || []),
    [deliveryNotes],
  );

  const {
    table,
    globalFilter,
    setGlobalFilter,
    statusFilter,
    setStatusFilter,
    clientFilter,
    setClientFilter,
    dateFilter,
    setDateFilter,
    selectedRows,
    handleDeleteSelected,
    isDeleting,
  } = useDeliveryNoteTable({
    data: sortedDeliveryNotes,
    onRefetch: refetch,
    onSendEmail: setSendEmailDN,
    onOpenSidebar: setSidebarDeliveryNote,
  });

  const [activeTab, setActiveTab] = useState("all");
  const handleTabChange = (value) => {
    setActiveTab(value);
    const tab = TABS.find((t) => t.value === value);
    setStatusFilter(tab?.statuses || []);
  };

  const counts = useMemo(() => {
    const result = { all: sortedDeliveryNotes.length };
    TABS.forEach((tab) => {
      if (tab.statuses) {
        result[tab.value] = sortedDeliveryNotes.filter((dn) =>
          tab.statuses.includes(dn.status),
        ).length;
      }
    });
    return result;
  }, [sortedDeliveryNotes]);

  // Ouverture automatique (palette ⌘K, documents liés) via ?id=
  useEffect(() => {
    if (dnIdToOpen && deliveryNotes && deliveryNotes.length > 0) {
      const dn = deliveryNotes.find((d) => d.id === dnIdToOpen);
      if (dn) setSidebarDeliveryNote(dn);
    }
  }, [dnIdToOpen, deliveryNotes]);

  if (loading && (!deliveryNotes || deliveryNotes.length === 0)) {
    return <DeliveryNoteTableSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CircleAlertIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">
            Impossible de charger les bons de livraison
          </p>
          <Button onClick={() => refetch()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  const openRowSidebar = (e, row) => {
    if (!e.currentTarget.contains(e.target)) return;
    if (
      e.target.closest('[role="checkbox"]') ||
      e.target.closest("[data-actions-cell]") ||
      e.target.closest('button[role="combobox"]') ||
      e.target.closest('[role="menu"]') ||
      e.target.closest('[role="dialog"]')
    ) {
      return;
    }
    setSidebarDeliveryNote(row.original);
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Zone sticky : recherche + onglets + en-tête du tableau */}
      <div className="hidden md:block sticky top-0 z-10 bg-background">
        <div className="flex items-center justify-between gap-3 md:flex px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 h-8 w-full sm:w-[400px] rounded-[9px] border border-[#E6E7EA] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
              <Search
                size={16}
                className="text-muted-foreground/80 shrink-0"
                aria-hidden="true"
              />
              <Input
                variant="ghost"
                ref={inputRef}
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder="Recherchez par numéro, client, transporteur ou suivi..."
              />
              {Boolean(globalFilter) && (
                <button
                  onClick={() => {
                    setGlobalFilter("");
                    inputRef.current?.focus();
                  }}
                  className="text-muted-foreground/80 hover:text-foreground flex items-center justify-center rounded cursor-pointer"
                  aria-label="Effacer la recherche"
                >
                  <CircleXIcon size={16} strokeWidth={2} aria-hidden="true" />
                </button>
              )}
            </div>

            <DeliveryNoteFilters
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              clientFilter={clientFilter}
              setClientFilter={setClientFilter}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              deliveryNotes={deliveryNotes || []}
              table={table}
            />
          </div>

          <div className="flex items-center gap-2">
            {selectedRows.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={isDeleting}
                    data-mobile-delete-trigger-dn
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Supprimer ({selectedRows.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Confirmer la suppression
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir supprimer {selectedRows.length}{" "}
                      bon(s) de livraison sélectionné(s) ? Cette action ne peut
                      pas être annulée.
                      <br />
                      <br />
                      <strong>Note :</strong> Seuls les brouillons peuvent être
                      supprimés.
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

        <div className="border-b border-gray-200 dark:border-gray-800">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="h-auto rounded-none bg-transparent p-0 pb-2 w-full justify-start px-4 sm:px-6">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={TAB_CLASS}
                >
                  <span>{tab.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {counts[tab.value] ?? 0}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-800">
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
      </div>

      {/* Barre d'outils mobile */}
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
                  {Object.entries(DELIVERY_NOTE_STATUS_LABELS).map(
                    ([status, label]) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mobile-dn-${status}`}
                          checked={statusFilter.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setStatusFilter([...statusFilter, status]);
                            } else {
                              setStatusFilter(
                                statusFilter.filter((s) => s !== status),
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={`mobile-dn-${status}`}
                          className="text-sm font-normal"
                        >
                          {label}
                        </Label>
                      </div>
                    ),
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
                  "[data-mobile-delete-trigger-dn]",
                );
                if (deleteButton) deleteButton.click();
              }}
            >
              <TrashIcon className="h-4 w-4 mr-1" />({selectedRows.length})
            </Button>
          )}
        </div>
      </div>

      {/* Corps du tableau (desktop) */}
      <div className="hidden md:flex md:flex-col flex-1">
        <table className="w-full table-fixed">
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer transition-colors"
                  onClick={(e) => openRowSidebar(e, row)}
                >
                  {row.getVisibleCells().map((cell, index, arr) => (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={`p-2 align-middle text-[13px] ${index === 0 ? "pl-4 sm:pl-6" : ""} ${index === arr.length - 1 ? "pr-4 sm:pr-6" : ""}`}
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
                <td colSpan={table.getAllColumns().length} className="p-0">
                  <TableEmptyState
                    icon={Truck}
                    title="Aucun bon de livraison trouvé"
                    description="Créez votre premier bon de livraison, ou générez-en un depuis un devis ou une facture."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tableau mobile */}
      <div className="md:hidden overflow-x-auto pb-20">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-gray-100 dark:border-gray-400"
              >
                {headerGroup.headers
                  .filter((header) =>
                    ["select", "client", "status", "actions"].includes(
                      header.column.id,
                    ),
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
                            header.getContext(),
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
                  className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-25 dark:hover:bg-gray-900 cursor-pointer"
                  onClick={(e) => openRowSidebar(e, row)}
                >
                  {row
                    .getVisibleCells()
                    .filter((cell) =>
                      ["select", "client", "status", "actions"].includes(
                        cell.column.id,
                      ),
                    )
                    .map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-4 text-sm">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="p-0">
                  <TableEmptyState
                    icon={Truck}
                    title="Aucun bon de livraison trouvé"
                    description="Créez votre premier bon de livraison."
                    size="compact"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination (desktop) */}
      <div className="hidden md:flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 bg-background sticky bottom-0 z-10">
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
              onValueChange={(value) => table.setPageSize(Number(value))}
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
            {Math.max(table.getPageCount(), 1)}
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

      {/* Sidebar (unique, au niveau du tableau) */}
      <AnimatePresence>
        {sidebarDeliveryNote && (
          <DeliveryNoteSidebar
            deliveryNote={sidebarDeliveryNote}
            isOpen={!!sidebarDeliveryNote}
            onClose={() => setSidebarDeliveryNote(null)}
            onRefetch={refetch}
            onSendEmail={(dn) => setSendEmailDN(dn)}
          />
        )}
      </AnimatePresence>

      {/* Modal d'envoi par email */}
      {sendEmailDN && (
        <SendDocumentModal
          open={!!sendEmailDN}
          onOpenChange={(open) => !open && setSendEmailDN(null)}
          documentId={sendEmailDN.id}
          documentType="deliveryNote"
          documentNumber={formatDeliveryNoteReference(sendEmailDN)}
          clientName={sendEmailDN.client?.name}
          clientEmail={sendEmailDN.client?.email}
          totalAmount=""
          companyName={sendEmailDN.companyInfo?.name}
          issueDate={formatEmailDate(sendEmailDN.issueDate)}
          onSent={() => {
            setSendEmailDN(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
