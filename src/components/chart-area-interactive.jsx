"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
  ChartConfig,
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

const chartData = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-02", desktop: 97, mobile: 180 },
  { date: "2024-04-03", desktop: 167, mobile: 120 },
  { date: "2024-04-04", desktop: 242, mobile: 260 },
  { date: "2024-04-05", desktop: 373, mobile: 290 },
  { date: "2024-04-06", desktop: 301, mobile: 340 },
  { date: "2024-04-07", desktop: 245, mobile: 180 },
  { date: "2024-04-08", desktop: 409, mobile: 320 },
  { date: "2024-04-09", desktop: 59, mobile: 110 },
  { date: "2024-04-10", desktop: 261, mobile: 190 },
  { date: "2024-04-11", desktop: 327, mobile: 350 },
  { date: "2024-04-12", desktop: 292, mobile: 210 },
  { date: "2024-04-13", desktop: 342, mobile: 380 },
  { date: "2024-04-14", desktop: 137, mobile: 220 },
  { date: "2024-04-15", desktop: 120, mobile: 170 },
  { date: "2024-04-16", desktop: 138, mobile: 190 },
  { date: "2024-04-17", desktop: 446, mobile: 360 },
  { date: "2024-04-18", desktop: 364, mobile: 410 },
  { date: "2024-04-19", desktop: 243, mobile: 180 },
  { date: "2024-04-20", desktop: 89, mobile: 150 },
  { date: "2024-04-21", desktop: 137, mobile: 200 },
  { date: "2024-04-22", desktop: 224, mobile: 170 },
  { date: "2024-04-23", desktop: 138, mobile: 230 },
  { date: "2024-04-24", desktop: 387, mobile: 290 },
  { date: "2024-04-25", desktop: 215, mobile: 250 },
  { date: "2024-04-26", desktop: 75, mobile: 130 },
  { date: "2024-04-27", desktop: 383, mobile: 420 },
  { date: "2024-04-28", desktop: 122, mobile: 180 },
  { date: "2024-04-29", desktop: 315, mobile: 240 },
  { date: "2024-04-30", desktop: 454, mobile: 380 },
  { date: "2024-05-01", desktop: 165, mobile: 220 },
  { date: "2024-05-02", desktop: 293, mobile: 310 },
  { date: "2024-05-03", desktop: 247, mobile: 190 },
  { date: "2024-05-04", desktop: 385, mobile: 420 },
  { date: "2024-05-05", desktop: 481, mobile: 390 },
  { date: "2024-05-06", desktop: 498, mobile: 520 },
  { date: "2024-05-07", desktop: 388, mobile: 300 },
  { date: "2024-05-08", desktop: 149, mobile: 210 },
  { date: "2024-05-09", desktop: 227, mobile: 180 },
  { date: "2024-05-10", desktop: 293, mobile: 330 },
  { date: "2024-05-11", desktop: 335, mobile: 270 },
  { date: "2024-05-12", desktop: 197, mobile: 240 },
  { date: "2024-05-13", desktop: 197, mobile: 160 },
  { date: "2024-05-14", desktop: 448, mobile: 490 },
  { date: "2024-05-15", desktop: 473, mobile: 380 },
  { date: "2024-05-16", desktop: 338, mobile: 400 },
  { date: "2024-05-17", desktop: 499, mobile: 420 },
  { date: "2024-05-18", desktop: 315, mobile: 350 },
  { date: "2024-05-19", desktop: 235, mobile: 180 },
  { date: "2024-05-20", desktop: 177, mobile: 230 },
  { date: "2024-05-21", desktop: 82, mobile: 140 },
  { date: "2024-05-22", desktop: 81, mobile: 120 },
  { date: "2024-05-23", desktop: 252, mobile: 290 },
  { date: "2024-05-24", desktop: 294, mobile: 220 },
  { date: "2024-05-25", desktop: 201, mobile: 250 },
  { date: "2024-05-26", desktop: 213, mobile: 170 },
  { date: "2024-05-27", desktop: 420, mobile: 460 },
  { date: "2024-05-28", desktop: 233, mobile: 190 },
  { date: "2024-05-29", desktop: 78, mobile: 130 },
  { date: "2024-05-30", desktop: 340, mobile: 280 },
  { date: "2024-05-31", desktop: 178, mobile: 230 },
  { date: "2024-06-01", desktop: 178, mobile: 200 },
  { date: "2024-06-02", desktop: 470, mobile: 410 },
  { date: "2024-06-03", desktop: 103, mobile: 160 },
  { date: "2024-06-04", desktop: 439, mobile: 380 },
  { date: "2024-06-05", desktop: 88, mobile: 140 },
  { date: "2024-06-06", desktop: 294, mobile: 250 },
  { date: "2024-06-07", desktop: 323, mobile: 370 },
  { date: "2024-06-08", desktop: 385, mobile: 320 },
  { date: "2024-06-09", desktop: 438, mobile: 480 },
  { date: "2024-06-10", desktop: 155, mobile: 200 },
  { date: "2024-06-11", desktop: 92, mobile: 150 },
  { date: "2024-06-12", desktop: 492, mobile: 420 },
  { date: "2024-06-13", desktop: 81, mobile: 130 },
  { date: "2024-06-14", desktop: 426, mobile: 380 },
  { date: "2024-06-15", desktop: 307, mobile: 350 },
  { date: "2024-06-16", desktop: 371, mobile: 310 },
  { date: "2024-06-17", desktop: 475, mobile: 520 },
  { date: "2024-06-18", desktop: 107, mobile: 170 },
  { date: "2024-06-19", desktop: 341, mobile: 290 },
  { date: "2024-06-20", desktop: 408, mobile: 450 },
  { date: "2024-06-21", desktop: 169, mobile: 210 },
  { date: "2024-06-22", desktop: 317, mobile: 270 },
  { date: "2024-06-23", desktop: 480, mobile: 530 },
  { date: "2024-06-24", desktop: 132, mobile: 180 },
  { date: "2024-06-25", desktop: 141, mobile: 190 },
  { date: "2024-06-26", desktop: 434, mobile: 380 },
  { date: "2024-06-27", desktop: 448, mobile: 490 },
  { date: "2024-06-28", desktop: 149, mobile: 200 },
  { date: "2024-06-29", desktop: 103, mobile: 160 },
  { date: "2024-06-30", desktop: 446, mobile: 400 },
];

const chartConfig = {
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
  data = chartData,
  config = chartConfig,
  showTimeRange = true,
  showTooltip = true,
  showGradient = true,
  showDesktop = true,
  showMobile = true,
  singleCurve = false,
  hideMobileCurve = false,
  className = "",
  aspectRatio = "auto",
  isLoading = false,
  ...props
}) {
  const chartId = React.useId();
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

  const filteredData = data.filter((item) => {
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
            {description}
          </span>
          <span className="@[540px]/card:hidden">{shortDescription}</span>
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
          config={config}
          className={`aspect-${aspectRatio} w-full`}
          style={{ height }}
        >
          <AreaChart data={filteredData}>
            {showGradient && (
              <defs>
                <linearGradient
                  id={`fillDesktop-${chartId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={config.desktop?.color || "#5B4FFF"}
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor={config.desktop?.color || "#5B4FFF"}
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient
                  id={`fillMobile-${chartId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={config.mobile?.color || "#a44fff"}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={config.mobile?.color || "#a44fff"}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
            )}
            <CartesianGrid vertical={false} />
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
                  year: "numeric",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={35}
              tickFormatter={(value) => {
                // Formater les valeurs en milliers (k) si > 1000
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}k`;
                }
                return value.toString();
              }}
            />
            {showTooltip && (
              <ChartTooltip
                cursor={false}
                defaultIndex={isMobile ? -1 : 10}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("fr-FR", {
                        month: "short",
                        year: "numeric",
                      });
                    }}
                    indicator="none"
                    className={isMobile ? "hidden" : "min-w-[200px]"}
                  />
                }
              />
            )}
            {singleCurve ? (
              <Area
                dataKey="desktop"
                type="monotone"
                fill={
                  showGradient
                    ? `url(#fillDesktop-${chartId})`
                    : config.desktop?.color || "#5B4FFF"
                }
                stroke={config.desktop?.color || "#5B4FFF"}
                stackId="a"
              />
            ) : (
              <>
                {showMobile && (
                  <Area
                    dataKey="mobile"
                    type="monotone"
                    fill={
                      hideMobileCurve
                        ? "transparent"
                        : showGradient
                          ? `url(#fillMobile-${chartId})`
                          : config.mobile?.color || "#a44fff"
                    }
                    stroke={
                      hideMobileCurve
                        ? "transparent"
                        : config.mobile?.color || "#a44fff"
                    }
                    strokeWidth={hideMobileCurve ? 0 : undefined}
                    stackId="a"
                  />
                )}
                {showDesktop && (
                  <Area
                    dataKey="desktop"
                    type="monotone"
                    fill={
                      showGradient
                        ? `url(#fillDesktop-${chartId})`
                        : config.desktop?.color || "#5B4FFF"
                    }
                    stroke={config.desktop?.color || "#5B4FFF"}
                    stackId="a"
                  />
                )}
              </>
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
