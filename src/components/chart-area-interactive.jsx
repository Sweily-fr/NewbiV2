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
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft, Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { parseDate } from "@internationalized/date";
import {
  Button as RACButton,
  DatePicker,
  Dialog,
  Group,
  I18nProvider,
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
  const chartId = React.useId();
  const [timeRange, setTimeRange] = React.useState("cumul-year");
  const [customStartDate, setCustomStartDate] = React.useState("");
  const [customEndDate, setCustomEndDate] = React.useState("");
  const [showCustomView, setShowCustomView] = React.useState(false);
  const [tempStartDate, setTempStartDate] = React.useState("");
  const [tempEndDate, setTempEndDate] = React.useState("");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Obtenir le label de la période sélectionnée
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "cumul-month": return "Cumul mensuel";
      case "cumul-quarter": return "Cumul trimestriel";
      case "cumul-year": return "Cumul annuel";
      case "7d": return "7 derniers jours";
      case "30d": return "30 derniers jours";
      case "90d": return "3 derniers mois";
      case "365d": return "12 derniers mois";
      case "custom": return "Période personnalisée";
      default: return "3 derniers mois";
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
      const referenceDate = new Date();

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

      // Cumul modes
      if (timeRange === "cumul-month") {
        const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        return date >= startOfMonth;
      }
      if (timeRange === "cumul-quarter") {
        const quarterMonth = Math.floor(referenceDate.getMonth() / 3) * 3;
        const startOfQuarter = new Date(referenceDate.getFullYear(), quarterMonth, 1);
        return date >= startOfQuarter;
      }
      if (timeRange === "cumul-year") {
        const startOfYear = new Date(referenceDate.getFullYear(), 0, 1);
        return date >= startOfYear;
      }

      // Périodes prédéfinies
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
      <defs key="gradients">
        <linearGradient id={`fillDesktop-${chartId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
          <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id={`fillMobile-${chartId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
          <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
        </linearGradient>
      </defs>,
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
        width={50}
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
          type="bump"
          fill={`url(#fillMobile-${chartId})`}
          fillOpacity={0.4}
          stroke="var(--color-mobile)"
          strokeWidth={1.5}
          stackId="a"
          connectNulls
        />
      );
    }

    children.push(
      <Area
        key="desktop"
        dataKey="desktop"
        type="bump"
        fill={`url(#fillDesktop-${chartId})`}
        fillOpacity={0.4}
        stroke="var(--color-desktop)"
        strokeWidth={1.5}
        stackId={!singleCurve && !hideMobileCurve ? "a" : undefined}
        connectNulls
      />
    );

    return (
      <ComposedChart
        data={aggregatedData}
        margin={{ left: -12, right: 12, top: 12, bottom: 12 }}
      >
        {children}
      </ComposedChart>
    );
  };

  const timeRangeDropdown = (
    <DropdownMenu open={dropdownOpen} onOpenChange={(open) => { setDropdownOpen(open); if (!open) setShowCustomView(false); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-sm font-normal text-[#7A7A7A]">
          {getTimeRangeLabel()}
          <ChevronRight className="-me-1 opacity-60 rotate-90" size={14} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="rounded-xl w-80" align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
        {!showCustomView ? (
          <>
            <DropdownMenuItem className="rounded-lg text-sm" onSelect={() => { setTimeRange("cumul-month"); setDropdownOpen(false); }}>Cumul mensuel</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-sm" onSelect={() => { setTimeRange("cumul-quarter"); setDropdownOpen(false); }}>Cumul trimestriel</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-sm" onSelect={() => { setTimeRange("cumul-year"); setDropdownOpen(false); }}>Cumul annuel</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-sm" onSelect={() => { setTimeRange("30d"); setDropdownOpen(false); }}>30 derniers jours</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-sm" onSelect={() => { setTimeRange("90d"); setDropdownOpen(false); }}>3 derniers mois</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-sm" onSelect={() => { setTimeRange("365d"); setDropdownOpen(false); }}>12 derniers mois</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-sm flex items-center justify-between" onSelect={(e) => { e.preventDefault(); setTempStartDate(customStartDate); setTempEndDate(customEndDate); setShowCustomView(true); }}>
              Période personnalisée
              <ChevronRight size={14} className="opacity-60" />
            </DropdownMenuItem>
          </>
        ) : (
          <I18nProvider locale="fr-FR">
          <div onKeyDown={(e) => { if (e.key !== 'Escape') e.stopPropagation(); }} onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center px-1 py-1 border-b">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-[#7A7A7A]" onClick={() => setShowCustomView(false)}>
                <ArrowLeft size={16} />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 px-2 pt-2">
              <div className="min-w-0 space-y-1.5">
                <Label className="text-sm font-medium">Début</Label>
                <DatePicker value={tempStartDate ? parseDate(tempStartDate) : null} onChange={(date) => { if (date) setTempStartDate(date.toString()); }}>
                  <div className="flex">
                    <Group className="w-full min-w-0">
                      <DateInput className="pe-9 text-sm" />
                    </Group>
                    <RACButton className="z-10 -ms-9 -me-px flex w-9 shrink-0 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50">
                      <CalendarIcon size={14} />
                    </RACButton>
                  </div>
                  <RACPopover className="z-50 rounded-lg border bg-background text-popover-foreground shadow-lg outline-hidden data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[entering]:zoom-in-95 data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95" offset={4}>
                    <Dialog className="max-h-[inherit] overflow-auto p-2">
                      <Calendar />
                    </Dialog>
                  </RACPopover>
                </DatePicker>
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label className="text-sm font-medium">Fin</Label>
                <DatePicker value={tempEndDate ? parseDate(tempEndDate) : null} onChange={(date) => { if (date) setTempEndDate(date.toString()); }}>
                  <div className="flex">
                    <Group className="w-full min-w-0">
                      <DateInput className="pe-9 text-sm" />
                    </Group>
                    <RACButton className="z-10 -ms-9 -me-px flex w-9 shrink-0 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50">
                      <CalendarIcon size={14} />
                    </RACButton>
                  </div>
                  <RACPopover className="z-50 rounded-lg border bg-background text-popover-foreground shadow-lg outline-hidden data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[entering]:zoom-in-95 data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95" offset={4}>
                    <Dialog className="max-h-[inherit] overflow-auto p-2">
                      <Calendar />
                    </Dialog>
                  </RACPopover>
                </DatePicker>
              </div>
            </div>
            <div className="flex gap-2 mt-3 px-2 pb-2 justify-end">
              <Button variant="ghost" size="sm" className="h-8 text-sm font-normal" onClick={() => { setShowCustomView(false); setDropdownOpen(false); }}>Annuler</Button>
              <Button size="sm" className="h-8 text-sm font-normal" onClick={() => { setCustomStartDate(tempStartDate); setCustomEndDate(tempEndDate); setTimeRange("custom"); setShowCustomView(false); setDropdownOpen(false); }}>Appliquer</Button>
            </div>
          </div>
          </I18nProvider>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

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
          <span className="hidden @[540px]/card:block text-2xl font-medium text-foreground">
            {resolvedDescription}
          </span>
          <span className="@[540px]/card:hidden text-2xl font-medium text-foreground">{computeDescription ? resolvedDescription : shortDescription}</span>
        </CardDescription>
        {showTimeRange && (
          <CardAction>
            {timeRangeDropdown}
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4 overflow-visible">
        <ChartContainer
          key={chartMountKey}
          config={config}
          className="aspect-auto w-full overflow-visible"
          style={{ height }}
        >
          {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
