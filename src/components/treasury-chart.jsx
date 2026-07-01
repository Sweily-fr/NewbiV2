"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { GET_TREASURY_CHART } from "@/src/graphql/queries/dashboardAggregation";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/src/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { ChevronRight, ArrowLeft, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { I18nProvider } from "react-aria-components";
import { Calendar as RangeCalendar } from "@/src/components/ui/calendar";
import { fr } from "date-fns/locale";
import { useChartColors } from "@/src/hooks/useChartColors";

const toYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const TREASURY_SKELETON_HEIGHTS = [
  45, 55, 40, 70, 50, 65, 35, 80, 48, 60, 72, 42,
];

export function TreasuryChart({
  workspaceId,
  accountId,
  className = "",
  isLoading = false,
  hideHeader = false,
  externalTimeRange,
}) {
  const router = useRouter();
  const { remap } = useChartColors();
  const chartConfig = {
    treasury: { label: "Trésorerie", color: remap("#93c5fd") },
    income: { label: "Entrées", color: remap("#5b50ff") },
    expenses: { label: "Sorties", color: remap("#000000") },
  };
  const [timeRange, setTimeRange] = useState(externalTimeRange || "cumul-year"); // 90d, 30d, 365d, 730d, custom, cumul-year
  useEffect(() => {
    if (externalTimeRange) setTimeRange(externalTimeRange);
  }, [externalTimeRange]);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomView, setShowCustomView] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Obtenir le label de la période sélectionnée
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "cumul-month":
        return "Cumul mensuel";
      case "cumul-quarter":
        return "Cumul trimestriel";
      case "cumul-year":
        return "Cumul annuel";
      case "30d":
        return "30 derniers jours";
      case "90d":
        return "3 derniers mois";
      case "365d":
        return "12 derniers mois";
      case "custom":
        if (customStartDate && customEndDate) {
          const fmt = (d) => d.split("-").reverse().join("/");
          return `${fmt(customStartDate)} - ${fmt(customEndDate)}`;
        }
        return "Période personnalisée";
      default:
        return "3 derniers mois";
    }
  };

  // Build period variable for the GraphQL query
  const period =
    timeRange === "custom"
      ? {
          startDate: customStartDate || undefined,
          endDate: customEndDate || undefined,
        }
      : { preset: timeRange };

  const { data, loading: queryLoading } = useQuery(GET_TREASURY_CHART, {
    variables: {
      workspaceId,
      period,
      accountId: accountId === "all" ? null : accountId,
    },
    fetchPolicy: "cache-and-network",
    skip: !workspaceId,
  });

  const treasuryData = data?.dashboardTreasuryChart?.dataPoints || [];
  const treasuryConsumption = data?.dashboardTreasuryChart
    ? data.dashboardTreasuryChart.endBalance -
      data.dashboardTreasuryChart.startBalance
    : 0;
  const combinedLoading = isLoading || queryLoading;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Clé pour forcer le remontage de Recharts quand les données passent de vide à rempli
  const hasNonZeroData = treasuryData.some(
    (d) => d.income > 0 || d.expenses > 0,
  );
  const chartMountKey = hasNonZeroData ? "has-data" : "no-data";

  const timeRangeDropdown = (
    <DropdownMenu
      modal={false}
      open={dropdownOpen}
      onOpenChange={(open) => {
        setDropdownOpen(open);
        if (!open) setShowCustomView(false);
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-sm font-normal text-[#7A7A7A]"
        >
          {getTimeRangeLabel()}
          <ChevronRight
            className="-me-1 opacity-60 rotate-90"
            size={14}
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="rounded-xl w-80"
        align="end"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {!showCustomView ? (
          <>
            <DropdownMenuItem
              className="rounded-lg text-sm"
              onSelect={() => {
                setTimeRange("cumul-month");
                setDropdownOpen(false);
              }}
            >
              Cumul mensuel
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-sm"
              onSelect={() => {
                setTimeRange("cumul-quarter");
                setDropdownOpen(false);
              }}
            >
              Cumul trimestriel
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-sm"
              onSelect={() => {
                setTimeRange("cumul-year");
                setDropdownOpen(false);
              }}
            >
              Cumul annuel
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-sm"
              onSelect={() => {
                setTimeRange("30d");
                setDropdownOpen(false);
              }}
            >
              30 derniers jours
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-sm"
              onSelect={() => {
                setTimeRange("90d");
                setDropdownOpen(false);
              }}
            >
              3 derniers mois
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-sm"
              onSelect={() => {
                setTimeRange("365d");
                setDropdownOpen(false);
              }}
            >
              12 derniers mois
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-sm flex items-center justify-between"
              onSelect={(e) => {
                e.preventDefault();
                setTempStartDate(customStartDate);
                setTempEndDate(customEndDate);
                setShowCustomView(true);
              }}
            >
              Période personnalisée
              <ChevronRight size={14} className="opacity-60" />
            </DropdownMenuItem>
          </>
        ) : (
          <I18nProvider locale="fr-FR">
            <div
              onKeyDown={(e) => {
                if (e.key !== "Escape") e.stopPropagation();
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center px-1 py-1 border-b">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#7A7A7A]"
                  onClick={() => setShowCustomView(false)}
                >
                  <ArrowLeft size={16} />
                </Button>
              </div>
              <div className="px-2 pt-2">
                <RangeCalendar
                  mode="range"
                  defaultMonth={
                    tempStartDate
                      ? new Date(tempStartDate + "T00:00:00")
                      : undefined
                  }
                  selected={{
                    from: tempStartDate
                      ? new Date(tempStartDate + "T00:00:00")
                      : undefined,
                    to: tempEndDate
                      ? new Date(tempEndDate + "T00:00:00")
                      : undefined,
                  }}
                  onSelect={(range) => {
                    setTempStartDate(range?.from ? toYMD(range.from) : "");
                    setTempEndDate(range?.to ? toYMD(range.to) : "");
                  }}
                  locale={fr}
                />
              </div>
              <div className="flex gap-2 mt-3 px-2 pb-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-sm font-normal"
                  onClick={() => {
                    setShowCustomView(false);
                    setDropdownOpen(false);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-sm font-normal"
                  onClick={() => {
                    setCustomStartDate(tempStartDate);
                    setCustomEndDate(tempEndDate);
                    setTimeRange("custom");
                    setShowCustomView(false);
                    setDropdownOpen(false);
                  }}
                >
                  Appliquer
                </Button>
              </div>
            </div>
          </I18nProvider>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (combinedLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-7 w-32" />
          </div>
          <Skeleton className="h-8 w-28 rounded-md" />
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4">
          <div className="h-[200px] flex items-end justify-between gap-1">
            {TREASURY_SKELETON_HEIGHTS.map((h, i) => (
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
    <Card className={className}>
      {!hideHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base font-normal">Trésorerie</CardTitle>
            <CardDescription>
              <span className="text-2xl font-medium text-foreground">
                {treasuryConsumption >= 0 ? "+" : ""}
                {formatCurrency(treasuryConsumption)}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            {timeRangeDropdown}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/dashboard/outils/prevision")}
            >
              Prévisions
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className="px-2 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4 overflow-visible">
        <ChartContainer
          key={chartMountKey}
          config={chartConfig}
          className="aspect-auto h-[200px] w-full overflow-visible"
        >
          <ComposedChart
            data={treasuryData}
            margin={{
              left: -12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <defs>
              <linearGradient id="fillTreasury" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-treasury)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-treasury)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("fr-FR", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={50}
              tickFormatter={(value) => {
                const absValue = Math.abs(value);
                if (absValue >= 1000000)
                  return `${(value / 1000000).toFixed(1)}M`;
                if (absValue >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return `${value.toFixed(0)}€`;
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[200px]"
                  nameKey="month"
                  labelFormatter={(value) => value}
                  formatter={(value, name) => (
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="text-xs text-muted-foreground">
                        {chartConfig[name]?.label || name}
                      </span>
                      <span className="text-xs font-medium">
                        {formatCurrency(value)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            {/* Barres pour les entrées (vert) */}
            <Bar
              dataKey="income"
              fill="var(--color-income)"
              radius={[4, 4, 0, 0]}
              barSize={26}
            />
            {/* Barres pour les sorties (rouge) */}
            <Bar
              dataKey="expenses"
              fill="var(--color-expenses)"
              radius={[4, 4, 0, 0]}
              barSize={26}
            />
            {/* Courbe de trésorerie (zone remplie) */}
            <Area
              dataKey="treasury"
              type="monotone"
              fill="url(#fillTreasury)"
              fillOpacity={0.4}
              stroke="var(--color-treasury)"
              strokeWidth={2}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
