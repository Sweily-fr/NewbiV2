"use client";

import { TrendingUp, ChevronRight, CalendarIcon } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
import { useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/src/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { Label as FormLabel } from "@/src/components/ui/label";
import { parseDate } from "@internationalized/date";
import {
  Button as RACButton,
  DatePicker,
  Dialog,
  Group,
  Popover as RACPopover,
} from "react-aria-components";
import { Calendar } from "@/src/components/ui/calendar-rac";
import { DateInput } from "@/src/components/ui/datefield-rac";

// Configuration des couleurs pour les catégories de revenus
const chartConfig = {
  amount: {
    label: "Montant",
  },
  INVOICE: {
    label: "Factures",
    color: "#10b981",
  },
  BANK_TRANSFER: {
    label: "Virements",
    color: "#3b82f6",
  },
  OTHER: {
    label: "Autres",
    color: "#8b5cf6",
  },
};

export function IncomeCategoryChart({ invoices = [], className }) {
  const [timeRange, setTimeRange] = useState("30d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Obtenir le label de la période sélectionnée
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "30d": return "Dernier mois";
      case "90d": return "Derniers 3 mois";
      case "365d": return "Dernière année";
      case "custom": return "Période personnalisée";
      default: return "Dernier mois";
    }
  };

  // Calculer les dates de début et fin selon le filtre
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate, endDate;

    if (timeRange === "custom") {
      startDate = customStartDate
        ? new Date(customStartDate)
        : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = customEndDate ? new Date(customEndDate) : now;
    } else {
      startDate = new Date();
      switch (timeRange) {
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(now.getDate() - 90);
          break;
        case "365d":
          startDate.setDate(now.getDate() - 365);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }
      endDate = now;
    }

    return {
      start: startDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      end: endDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
  }, [timeRange, customStartDate, customEndDate]);

  // Filtrer les factures selon la période
  const filteredInvoices = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];

    const now = new Date();
    let startDate, endDate;

    if (timeRange === "custom") {
      startDate = customStartDate
        ? new Date(customStartDate)
        : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = customEndDate ? new Date(customEndDate) : now;
    } else {
      startDate = new Date();
      switch (timeRange) {
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(now.getDate() - 90);
          break;
        case "365d":
          startDate.setDate(now.getDate() - 365);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }
      endDate = now;
    }

    return invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.issueDate || invoice.createdAt);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
  }, [invoices, timeRange, customStartDate, customEndDate]);

  // Calculer les données du graphique
  const chartData = useMemo(() => {
    // Pour l'instant, retourner un tableau vide car pas de données
    // Plus tard, on pourra ajouter les factures et virements bancaires
    return [];
  }, [filteredInvoices]);

  // Calculer le total
  const totalAmount = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.amount, 0);
  }, [chartData]);

  // Formater le montant en euros
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Afficher un message si pas de données
  return (
    <Card className={`@container/card flex flex-col ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="font-normal text-base">
            Entrées par catégorie
          </CardTitle>
          <CardDescription className="text-xs">
            {dateRange.start} - {dateRange.end}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs border-none shadow-none">
              {getTimeRangeLabel()}
              <ChevronRight className="-me-1 opacity-60 rotate-90" size={14} aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="rounded-xl">
            <DropdownMenuItem 
              className="rounded-lg text-xs"
              onClick={() => setTimeRange("30d")}
            >
              Dernier mois
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="rounded-lg text-xs"
              onClick={() => setTimeRange("90d")}
            >
              Derniers 3 mois
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="rounded-lg text-xs"
              onClick={() => setTimeRange("365d")}
            >
              Dernière année
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="rounded-lg text-xs">
                Période personnalisée
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-64 p-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <FormLabel className="text-xs font-medium">
                        Date de début
                      </FormLabel>
                      <DatePicker
                        value={customStartDate ? parseDate(customStartDate) : null}
                        onChange={(date) => {
                          if (date) {
                            setCustomStartDate(date.toString());
                            setTimeRange("custom");
                          }
                        }}
                      >
                        <div className="flex">
                          <Group className="w-full">
                            <DateInput className="pe-9" />
                          </Group>
                          <RACButton className="z-10 -ms-9 -me-px flex w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50">
                            <CalendarIcon size={16} />
                          </RACButton>
                        </div>
                        <RACPopover
                          className="z-50 rounded-lg border bg-background text-popover-foreground shadow-lg outline-hidden data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[entering]:zoom-in-95 data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95"
                          offset={4}
                        >
                          <Dialog className="max-h-[inherit] overflow-auto p-2">
                            <Calendar />
                          </Dialog>
                        </RACPopover>
                      </DatePicker>
                    </div>
                    <div className="space-y-2">
                      <FormLabel className="text-xs font-medium">
                        Date de fin
                      </FormLabel>
                      <DatePicker
                        value={customEndDate ? parseDate(customEndDate) : null}
                        onChange={(date) => {
                          if (date) {
                            setCustomEndDate(date.toString());
                            setTimeRange("custom");
                          }
                        }}
                      >
                        <div className="flex">
                          <Group className="w-full">
                            <DateInput className="pe-9" />
                          </Group>
                          <RACButton className="z-10 -ms-9 -me-px flex w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50">
                            <CalendarIcon size={16} />
                          </RACButton>
                        </div>
                        <RACPopover
                          className="z-50 rounded-lg border bg-background text-popover-foreground shadow-lg outline-hidden data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[entering]:zoom-in-95 data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95"
                          offset={4}
                        >
                          <Dialog className="max-h-[inherit] overflow-auto p-2">
                            <Calendar />
                          </Dialog>
                        </RACPopover>
                      </DatePicker>
                    </div>
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[250px]">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Aucune donnée disponible
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-[250px]">
            Les entrées d'argent seront affichées après la connexion bancaire
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
