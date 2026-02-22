"use client";

import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import {
  AreaChartIcon,
  BarChart2,
  LineChart as LineChartIcon,
} from "lucide-react";

const chartConfig = {
  revenueVAT: { label: "TVA collectée", color: "#5b50ff" },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatMonthLabel = (monthStr) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase() + ` ${year.slice(2)}`;
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const [year, month] = (data.month || "").split("-");
  const monthDate = new Date(parseInt(year), parseInt(month) - 1);
  const label = monthDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm">
      <p className="font-medium mb-2 capitalize">{label}</p>
      <div className="flex items-center justify-between gap-6">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#5b50ff" }} />
          TVA collectée
        </span>
        <span className="font-medium">{formatCurrency(data.revenueVAT)}</span>
      </div>
    </div>
  );
}

export function AnalyticsVatChart({ monthlyRevenue, loading }) {
  const [chartType, setChartType] = useState("bar");

  const chartData = useMemo(() => {
    if (!monthlyRevenue?.length) return [];
    return monthlyRevenue.map((m) => ({
      ...m,
      monthLabel: formatMonthLabel(m.month),
    }));
  }, [monthlyRevenue]);

  if (loading) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Évolution TVA</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Évolution TVA</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Aucune donnée pour cette période
        </div>
      </div>
    );
  }

  const chartMargin = { top: 5, right: 10, left: 0, bottom: 5 };
  const vatTick = ({ y, payload }) => (
    <text x={0} y={y} textAnchor="start" dominantBaseline="middle" fontSize={11} className="fill-muted-foreground">
      {payload.value >= 1000 ? `${(payload.value / 1000).toFixed(1)}k €` : `${Math.round(payload.value)} €`}
    </text>
  );

  const renderChart = () => {
    if (chartType === "bar") {
      return (
        <BarChart data={chartData} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={vatTick} tickLine={false} axisLine={false} width={55} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="revenueVAT" fill="#5b50ff" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      );
    }
    if (chartType === "line") {
      return (
        <LineChart data={chartData} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={vatTick} tickLine={false} axisLine={false} width={55} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="revenueVAT" stroke="#5b50ff" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
        </LineChart>
      );
    }
    return (
      <AreaChart data={chartData} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={vatTick} tickLine={false} axisLine={false} width={55} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="revenueVAT" stroke="#5b50ff" fill="#5b50ff" fillOpacity={0.15} strokeWidth={2} />
      </AreaChart>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium">Évolution TVA</h3>
        <ToggleGroup type="single" value={chartType} onValueChange={(v) => v && setChartType(v)} size="sm">
          <ToggleGroupItem value="bar" aria-label="Bar chart">
            <BarChart2 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="line" aria-label="Line chart">
            <LineChartIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="area" aria-label="Area chart">
            <AreaChartIcon className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        {renderChart()}
      </ChartContainer>
    </div>
  );
}
