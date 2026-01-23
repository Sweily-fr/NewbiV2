"use client";

import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  EllipsisVertical,
  Users,
  FileCheck,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from "@/src/graphql/invoiceQueries";
import {
  IMPORTED_INVOICE_STATUS_LABELS,
  IMPORTED_INVOICE_STATUS_COLORS,
} from "@/src/graphql/importedInvoiceQueries";

export default function InvoiceFilters({
  statusFilter,
  setStatusFilter,
  clientFilter,
  setClientFilter,
  dateFilter,
  setDateFilter,
  invoices = [],
  table,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  // Convertir statusFilter en tableau pour gérer la sélection multiple
  const selectedStatuses = useMemo(() => {
    if (!statusFilter) return [];
    if (Array.isArray(statusFilter)) return statusFilter;
    return [statusFilter];
  }, [statusFilter]);

  // Extraire les clients uniques des factures (par nom pour éviter les doublons visuels)
  const uniqueClients = useMemo(() => {
    const clientNames = new Set();
    invoices.forEach((invoice) => {
      if (invoice.client?.name) {
        clientNames.add(invoice.client.name);
      }
    });
    return Array.from(clientNames)
      .map((name) => ({ name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [invoices]);

  // Convertir clientFilter en tableau pour gérer la sélection multiple
  const selectedClients = useMemo(() => {
    if (!clientFilter) return [];
    if (Array.isArray(clientFilter)) return clientFilter;
    return [clientFilter];
  }, [clientFilter]);

  // Calculer le nombre de filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = selectedStatuses.length + selectedClients.length;
    if (dateFilter?.from || dateFilter?.to) count++;
    return count;
  }, [selectedStatuses.length, selectedClients.length, dateFilter]);

  // Fonctions pour les plages de dates rapides
  const setQuickDateRange = (range) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let from, to;

    switch (range) {
      case "today":
        from = new Date(today);
        to = new Date(today);
        break;
      case "yesterday":
        from = new Date(today);
        from.setDate(from.getDate() - 1);
        to = new Date(from);
        break;
      case "last7days":
        from = new Date(today);
        from.setDate(from.getDate() - 6);
        to = new Date(today);
        break;
      case "last30days":
        from = new Date(today);
        from.setDate(from.getDate() - 29);
        to = new Date(today);
        break;
      default:
        from = null;
        to = null;
    }

    setDateRange({ from, to });
    setDateFilter({ from, to });
  };

  // Gérer le toggle d'un statut
  const toggleStatus = (status) => {
    if (selectedStatuses.includes(status)) {
      // Retirer le statut
      const newStatuses = selectedStatuses.filter((s) => s !== status);
      setStatusFilter(newStatuses.length === 0 ? "" : newStatuses);
    } else {
      // Ajouter le statut
      const newStatuses = [...selectedStatuses, status];
      setStatusFilter(newStatuses);
    }
  };

  // Tout sélectionner / tout désélectionner les statuts
  const allStatusesSelected =
    selectedStatuses.length === Object.keys(INVOICE_STATUS_LABELS).length;

  const toggleAllStatuses = () => {
    if (allStatusesSelected) {
      setStatusFilter("");
    } else {
      setStatusFilter(Object.keys(INVOICE_STATUS_LABELS));
    }
  };

  // Gérer le toggle d'un client (par nom)
  const toggleClient = (clientName) => {
    if (selectedClients.includes(clientName)) {
      // Retirer le client
      const newClients = selectedClients.filter((c) => c !== clientName);
      setClientFilter(newClients.length === 0 ? "" : newClients);
    } else {
      // Ajouter le client
      const newClients = [...selectedClients, clientName];
      setClientFilter(newClients);
    }
  };

  // Tout sélectionner / tout désélectionner les clients
  const allClientsSelected =
    selectedClients.length === uniqueClients.length && uniqueClients.length > 0;

  const toggleAllClients = () => {
    if (allClientsSelected) {
      setClientFilter("");
    } else {
      setClientFilter(uniqueClients.map((c) => c.name));
    }
  };

  // Obtenir les colonnes cachables
  const hideableColumns = useMemo(() => {
    return table
      .getAllColumns()
      .filter(
        (column) =>
          typeof column.accessorFn !== "undefined" && column.getCanHide()
      );
  }, [table]);

  // Calculer le nombre de colonnes visibles
  const visibleColumnsCount = hideableColumns.filter((column) =>
    column.getIsVisible()
  ).length;

  // Vérifier si toutes les colonnes sont visibles
  const allColumnsVisible =
    hideableColumns.length > 0 &&
    hideableColumns.every((column) => column.getIsVisible());

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9 relative", className)}
        >
          <EllipsisVertical className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        {/* Effacer tous les filtres */}
        <DropdownMenuItem
          onClick={() => {
            setStatusFilter("");
            setClientFilter("");
            setDateFilter(null);
            setDateRange({ from: null, to: null });
          }}
          className="cursor-pointer"
        >
          Effacer tous les filtres
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Date Filter - Nested Dropdown */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="whitespace-nowrap">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Date d&apos;émission
            {(dateFilter?.from || dateFilter?.to) && (
              <Badge variant="secondary" className="ml-auto">
                1
              </Badge>
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-auto p-0">
            <div className="space-y-0">
              {/* Plages rapides */}
              <div className="p-3 pb-4">
                <p className="text-sm font-normal pb-3">Plages rapides</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs justify-start bg-popover hover:bg-accent"
                    onClick={() => setQuickDateRange("today")}
                  >
                    Aujourd'hui
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs justify-start bg-popover hover:bg-accent"
                    onClick={() => setQuickDateRange("yesterday")}
                  >
                    Hier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs justify-start bg-popover hover:bg-accent"
                    onClick={() => setQuickDateRange("last7days")}
                  >
                    7 derniers jours
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs justify-start bg-popover hover:bg-accent"
                    onClick={() => setQuickDateRange("last30days")}
                  >
                    30 derniers jours
                  </Button>
                </div>
              </div>

              {/* Calendrier */}
              <div className="border-t pt-3 pb-5 flex justify-center">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range || { from: null, to: null });
                    setDateFilter(range || null);
                  }}
                  locale={fr}
                  numberOfMonths={1}
                  className="p-0"
                />
              </div>

              {/* Affichage de la plage sélectionnée */}
              {(dateRange?.from || dateRange?.to) && (
                <div className="border-t pt-3 px-3 pb-3">
                  <p className="text-xs text-muted-foreground px-2">
                    {dateRange.from &&
                      format(dateRange.from, "dd MMM yyyy", { locale: fr })}
                    {dateRange.to &&
                      dateRange.from !== dateRange.to &&
                      ` - ${format(dateRange.to, "dd MMM yyyy", { locale: fr })}`}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs mt-2 w-full"
                    onClick={() => {
                      setDateRange({ from: null, to: null });
                      setDateFilter(null);
                    }}
                  >
                    Effacer
                  </Button>
                </div>
              )}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Client Filter - Nested Dropdown */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="whitespace-nowrap">
            <Users className="h-4 w-4 mr-2" />
            Filtrer par client
            {selectedClients.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {selectedClients.length}
              </Badge>
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-[250px] max-h-[400px] overflow-y-auto">
            {uniqueClients.length > 0 ? (
              <>
                {/* Checkbox Tout sélectionner */}
                <div
                  className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                  onClick={toggleAllClients}
                >
                  <Checkbox
                    checked={allClientsSelected}
                    className="mr-2 pointer-events-none"
                  />
                  <span>Tout sélectionner</span>
                </div>
                <DropdownMenuSeparator />
                {uniqueClients.map((client) => (
                  <div
                    key={client.name}
                    className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                    onClick={() => toggleClient(client.name)}
                  >
                    <Checkbox
                      checked={selectedClients.includes(client.name)}
                      className="mr-2 pointer-events-none"
                    />
                    <span>{client.name}</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                Aucun client trouvé
              </div>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Status Filter - Nested Dropdown */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="whitespace-nowrap">
            <FileCheck className="h-4 w-4 mr-2" />
            Filtrer par statut
            {selectedStatuses.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {selectedStatuses.length}
              </Badge>
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-[250px]">
            {/* Checkbox Tout sélectionner */}
            <div
              className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
              onClick={toggleAllStatuses}
            >
              <Checkbox
                checked={allStatusesSelected}
                className="mr-2 pointer-events-none"
              />
              <span>Tout sélectionner</span>
            </div>
            <DropdownMenuSeparator />
            {Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => (
              <div
                key={value}
                className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                onClick={() => toggleStatus(value)}
              >
                <Checkbox
                  checked={selectedStatuses.includes(value)}
                  className="mr-2 pointer-events-none"
                />
                <Badge
                  variant="outline"
                  className={cn(INVOICE_STATUS_COLORS[value] || "bg-gray-100")}
                >
                  {label}
                </Badge>
              </div>
            ))}
            <DropdownMenuSeparator />
            <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
              Factures importées
            </div>
            {Object.entries(IMPORTED_INVOICE_STATUS_LABELS).map(
              ([value, label]) => (
                <div
                  key={`imported-${value}`}
                  className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                  onClick={() => toggleStatus(value)}
                >
                  <Checkbox
                    checked={selectedStatuses.includes(value)}
                    className="mr-2 pointer-events-none"
                  />
                  <Badge
                    variant="outline"
                    className={cn(
                      IMPORTED_INVOICE_STATUS_COLORS[value] || "bg-gray-100"
                    )}
                  >
                    {label}
                  </Badge>
                </div>
              )
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Column Visibility - Nested Dropdown */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="whitespace-nowrap">
            Colonnes visibles
            <Badge variant="secondary" className="ml-auto">
              {visibleColumnsCount}
            </Badge>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-[250px] max-h-[400px] overflow-y-auto">
            {/* Checkbox Tout sélectionner */}
            <div
              className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
              onClick={() => {
                table.toggleAllColumnsVisible(!allColumnsVisible);
              }}
            >
              <Checkbox
                checked={allColumnsVisible}
                className="mr-2 pointer-events-none"
              />
              <span>Tout sélectionner</span>
            </div>
            <DropdownMenuSeparator />

            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" &&
                  column.getCanHide()
              )
              .map((column) => {
                const getColumnLabel = () => {
                  if (column.columnDef.meta?.label) {
                    return column.columnDef.meta.label;
                  }
                  return column.id
                    .split(".")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");
                };

                return (
                  <div
                    key={column.id}
                    className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                    onClick={() => column.toggleVisibility()}
                  >
                    <Checkbox
                      checked={column.getIsVisible()}
                      className="mr-2 pointer-events-none"
                    />
                    <span>{getColumnLabel()}</span>
                  </div>
                );
              })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
