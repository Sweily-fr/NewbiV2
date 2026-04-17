"use client";

import { useMemo, useState } from "react";
import { Users, FileCheck, Calendar as CalendarIcon } from "lucide-react";
import { SortIcon as ListFilterIcon } from "@/src/components/icons";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Calendar } from "@/src/components/ui/calendar";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/src/graphql/purchaseOrderQueries";

export default function PurchaseOrderFilters({
  statusFilter,
  setStatusFilter,
  clientFilter,
  setClientFilter,
  dateFilter,
  setDateFilter,
  purchaseOrders = [],
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

  // Convertir clientFilter en tableau pour gérer la sélection multiple
  const selectedClients = useMemo(() => {
    if (!clientFilter) return [];
    if (Array.isArray(clientFilter)) return clientFilter;
    return [clientFilter];
  }, [clientFilter]);

  // Extraire les clients uniques
  const uniqueClients = useMemo(() => {
    const clientNames = new Set();
    purchaseOrders.forEach((po) => {
      if (po.client?.name) {
        clientNames.add(po.client.name);
      }
    });
    return Array.from(clientNames)
      .map((name) => ({ name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [purchaseOrders]);

  // Fonction pour définir des plages de dates rapides
  const setQuickDateRange = (rangeType) => {
    const today = startOfDay(new Date());
    let from, to;

    switch (rangeType) {
      case "today":
        from = today;
        to = endOfDay(new Date());
        break;
      case "yesterday":
        from = startOfDay(subDays(today, 1));
        to = endOfDay(subDays(today, 1));
        break;
      case "last7days":
        from = startOfDay(subDays(today, 6));
        to = endOfDay(new Date());
        break;
      case "last30days":
        from = startOfDay(subDays(today, 29));
        to = endOfDay(new Date());
        break;
      default:
        from = null;
        to = null;
    }

    setDateRange({ from, to });
    setDateFilter(from && to ? { from, to } : null);
  };

  // Nombre de filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedStatuses.length > 0) count++;
    if (selectedClients.length > 0) count++;
    if (dateFilter?.from || dateFilter?.to) count++;
    return count;
  }, [selectedStatuses, selectedClients, dateFilter]);

  const statuses = Object.keys(PURCHASE_ORDER_STATUS_LABELS);

  const toggleAllStatuses = () => {
    if (selectedStatuses.length === statuses.length) {
      setStatusFilter([]);
    } else {
      setStatusFilter(statuses);
    }
  };

  const toggleStatus = (status) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];
    setStatusFilter(newStatuses);
  };

  const toggleAllClients = () => {
    if (selectedClients.length === uniqueClients.length) {
      setClientFilter([]);
    } else {
      setClientFilter(uniqueClients.map((client) => client.name));
    }
  };

  const toggleClient = (clientName) => {
    const newClients = selectedClients.includes(clientName)
      ? selectedClients.filter((c) => c !== clientName)
      : [...selectedClients, clientName];
    setClientFilter(newClients);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={activeFiltersCount > 0 ? "primary" : "filter"}
          className={cn("cursor-pointer", className)}
        >
          <ListFilterIcon className="h-3.5 w-3.5" />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0 text-[10px] font-medium">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {/* Effacer tous les filtres */}
        <DropdownMenuItem
          onClick={() => {
            setStatusFilter?.([]);
            setClientFilter?.([]);
            setDateFilter?.(null);
            setDateRange({ from: null, to: null });
          }}
          className="cursor-pointer"
        >
          Effacer tous les filtres
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Date Filter */}
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

        {/* Client Filter */}
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
                <div
                  className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                  onClick={toggleAllClients}
                >
                  <Checkbox
                    checked={selectedClients.length === uniqueClients.length}
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

        {/* Status Filter */}
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
            <div
              className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
              onClick={toggleAllStatuses}
            >
              <Checkbox
                checked={selectedStatuses.length === statuses.length}
                className="mr-2 pointer-events-none"
              />
              <span>Tout sélectionner</span>
            </div>
            <DropdownMenuSeparator />
            {statuses.map((status) => (
              <div
                key={status}
                className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
                onClick={() => toggleStatus(status)}
              >
                <Checkbox
                  checked={selectedStatuses.includes(status)}
                  className="mr-2 pointer-events-none"
                />
                <span>{PURCHASE_ORDER_STATUS_LABELS[status]}</span>
              </div>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Visible Columns */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="whitespace-nowrap">
            Colonnes visibles
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-[250px] max-h-[400px] overflow-y-auto">
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" &&
                  column.getCanHide(),
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
