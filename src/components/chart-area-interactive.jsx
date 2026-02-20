"use client";

import * as React from "react";
import { Area, ComposedChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { useIsMobile } from "@/src/hooks/use-mobile";
import {
  Card,
  CardAction,
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
import { Skeleton } from "@/src/components/ui/skeleton";
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
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { Label } from "@/src/components/ui/label";
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

export const description = "An interactive area chart";

const defaultChartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
};

const AREA_SKELETON_HEIGHTS = [65, 42, 78, 35, 90, 55, 48, 72, 38, 85, 60, 45];

export function ChartAreaInteractive({
  width,
  height = "250px",
  title = "Total Visitors",
  description = "Total for the last 3 months",
  shortDescription = "Last 3 months",
  computeDescription,
  data = [],
  config = defaultChartConfig,
  showTimeRange = true,
  showTooltip = true,
  showGradient = true,
  showDesktop = true,
  showMobile = true,
  singleCurve = false,
  hideMobileCurve = false,
  className = "",
  isLoading = false,
  ...props
}) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");
  const [customStartDate, setCustomStartDate] = React.useState("");
  const [customEndDate, setCustomEndDate] = React.useState("");

  // Obtenir le label de la période sélectionnée
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "7d": return "7 jours";
      case "30d": return "30 jours";
      case "90d": return "3 mois";
      case "365d": return "1 an";
      case "custom": return "Personnalisé";
      default: return "3 mois";
    }
  };

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("90d");
    }
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const date = new Date(item.date);

      // Si période personnalisée
      if (timeRange === "custom") {
        if (!customStartDate && !customEndDate) return true;

        const start = customStartDate ? new Date(customStartDate) : null;
        const end = customEndDate ? new Date(customEndDate) : null;

        if (start && end) {
          return date >= start && date <= end;
        } else if (start) {
          return date >= start;
        } else if (end) {
          return date <= end;
        }
        return true;
      }

      // Périodes prédéfinies
      const referenceDate = new Date();
      let daysToSubtract = 90;

      if (timeRange === "7d") {
        daysToSubtract = 7;
      } else if (timeRange === "30d") {
        daysToSubtract = 30;
      } else if (timeRange === "90d") {
        daysToSubtract = 90;
      } else if (timeRange === "365d") {
        daysToSubtract = 365;
      } else if (timeRange === "730d") {
        daysToSubtract = 730;
      }

      const startDate = new Date(referenceDate);
      startDate.setDate(startDate.getDate() - daysToSubtract);
      return date >= startDate;
    });
  }, [data, timeRange, customStartDate, customEndDate]);

  // Agréger les données par semaine ou par mois pour les longues périodes
  // Évite les courbes invisibles quand il y a peu de transactions sur beaucoup de jours
  const aggregatedData = React.useMemo(() => {
    if (timeRange === "7d") return filteredData;

    // Déterminer la granularité : jour (30d), semaine (90d), mois (365d+)
    let groupBy = "day";
    if (timeRange === "90d" || timeRange === "custom") groupBy = "week";
    if (timeRange === "365d" || timeRange === "730d") groupBy = "month";

    if (groupBy === "day") return filteredData;

    const groups = {};
    filteredData.forEach((item) => {
      const date = new Date(item.date);
      let key;

      if (groupBy === "week") {
        // Début de semaine (lundi)
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      } else {
        // Début de mois
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
      }

      if (!groups[key]) groups[key] = { date: key, desktop: 0, mobile: 0 };
      groups[key].desktop += item.desktop || 0;
      groups[key].mobile += item.mobile || 0;
    });

    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData, timeRange]);

  // Compute dynamic description from filtered data if computeDescription is provided
  // Utiliser filteredData (non agrégé) pour les totaux corrects
  const resolvedDescription = computeDescription
    ? computeDescription(filteredData)
    : description;

  const hasNonZeroData = filteredData.some((item) => item.desktop > 0);

  // Clé pour forcer le remontage de Recharts quand les données passent de vide à rempli
  // Corrige un bug où Recharts ne re-render pas les Area/YAxis après initialisation avec données vides
  const chartMountKey = hasNonZeroData ? "has-data" : "no-data";

  // Construire les enfants du ComposedChart sans fragments ni conditionnels
  // Recharts utilise React.Children pour détecter ses enfants (Area, YAxis, etc.)
  // Les fragments <></> et ternaires cassent cette détection en production
  const renderChart = () => {
    const children = [
      <CartesianGrid key="grid" vertical={false} />,
      <XAxis
        key="xaxis"
        dataKey="date"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={32}
        tickFormatter={(value) => {
          const date = new Date(value);
          return date.toLocaleDateString("fr-FR", {
            month: "short",
            year: "numeric",
          });
        }}
      />,
      <YAxis
        key="yaxis"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        tickFormatter={(value) => {
          if (Math.abs(value) >= 1000) {
            return `${(value / 1000).toFixed(0)}k`;
          }
          return `${value}`;
        }}
      />,
      <ChartTooltip
        key="tooltip"
        cursor={false}
        content={
          <ChartTooltipContent
            labelFormatter={(value) => {
              return new Date(value).toLocaleDateString("fr-FR", {
                month: "short",
                year: "numeric",
              });
            }}
            indicator="none"
            className="min-w-[200px]"
          />
        }
      />,
    ];

    // Ajouter les Area comme enfants directs (pas de fragment)
    if (showMobile && !hideMobileCurve && !singleCurve) {
      children.push(
        <Area
          key="mobile"
          dataKey="mobile"
          type="monotone"
          fill="var(--color-mobile)"
          fillOpacity={0.15}
          stroke="var(--color-mobile)"
          strokeWidth={2}
          stackId="a"
          connectNulls
        />
      );
    }

    children.push(
      <Area
        key="desktop"
        dataKey="desktop"
        type="monotone"
        fill="var(--color-desktop)"
        fillOpacity={0.15}
        stroke="var(--color-desktop)"
        strokeWidth={2}
        stackId={!singleCurve && !hideMobileCurve ? "a" : undefined}
        connectNulls
      />
    );

    return (
      <ComposedChart
        data={aggregatedData}
        margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
      >
        {children}
      </ComposedChart>
    );
  };

  if (isLoading) {
    return (
      <Card className={`@container/card ${className}`} style={{ width }} {...props}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="h-7 w-28" />
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4">
          <div className="flex items-end justify-between gap-1 md:gap-2" style={{ height }}>
            {AREA_SKELETON_HEIGHTS.map((h, i) => (
              <Skeleton
                key={i}
                className="rounded-t-sm flex-1 animate-pulse"
                style={{ height: `${h}%`, minHeight: "20px" }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`@container/card ${className}`}
      style={{ width }}
      {...props}
    >
      <CardHeader>
        <CardTitle className="text-base font-normal">{title}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block text-lg">
            {resolvedDescription}
          </span>
          <span className="@[540px]/card:hidden">{computeDescription ? resolvedDescription : shortDescription}</span>
        </CardDescription>
        {showTimeRange && (
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs border-none shadow-none">
                  {getTimeRangeLabel()}
                  <ChevronRight className="-me-1 opacity-60 rotate-90" size={14} aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-xl">
                <DropdownMenuItem 
                  className="rounded-lg text-xs"
                  onClick={() => setTimeRange("365d")}
                >
                  Dernière année
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-lg text-xs"
                  onClick={() => setTimeRange("90d")}
                >
                  Derniers 3 mois
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-lg text-xs"
                  onClick={() => setTimeRange("30d")}
                >
                  Derniers 30 jours
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-lg text-xs"
                  onClick={() => setTimeRange("7d")}
                >
                  Derniers 7 jours
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="rounded-lg text-xs">
                    Période personnalisée
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-64 p-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">
                            Date de début
                          </Label>
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
                          <Label className="text-xs font-medium">
                            Date de fin
                          </Label>
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
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4">
        <ChartContainer
          key={chartMountKey}
          config={config}
          className="aspect-auto w-full"
          style={{ height }}
        >
          {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
