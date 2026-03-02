"use client";

import { useState, useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
  Treemap,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { BarChart2, Grid3X3, TableIcon } from "lucide-react";

const chartConfig = {
  totalHT: { label: "CA HT", color: "#5b50ff" },
};

const BAR_COLORS = [
  "#5b50ff", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm">
      <p className="font-medium mb-1">{data.description || data.name}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span>CA HT</span>
          <span className="font-medium">{formatCurrency(data.totalHT || data.size)}</span>
        </div>
        {data.totalQuantity != null && (
          <div className="flex items-center justify-between gap-4">
            <span>Quantité</span>
            <span className="font-medium">{data.totalQuantity}</span>
          </div>
        )}
        {data.averageUnitPrice != null && (
          <div className="flex items-center justify-between gap-4">
            <span>Prix moyen</span>
            <span className="font-medium">{formatCurrency(data.averageUnitPrice)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function BarLabel({ x, y, width, height, value }) {
  const isInside = width > value.length * 7 + 16;
  return (
    <text
      x={isInside ? x + 8 : x + width + 6}
      y={y + height / 2}
      fill={isInside ? "#fff" : "hsl(var(--foreground))"}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={500}
    >
      {value}
    </text>
  );
}

function TreemapContent({ x, y, width, height, name, fill }) {
  if (width < 40 || height < 25) return null;
  const displayName = name?.length > Math.floor(width / 7)
    ? name.substring(0, Math.floor(width / 7) - 2) + "..."
    : name;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} stroke="#fff" strokeWidth={2} />
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={500}
      >
        {displayName}
      </text>
    </g>
  );
}

export function AnalyticsProductChart({ revenueByProduct, loading }) {
  const [viewType, setViewType] = useState("bar");

  const chartData = useMemo(() => {
    if (!revenueByProduct?.length) return [];
    return revenueByProduct.slice(0, 10).map((p, i) => ({
      ...p,
      shortDesc:
        p.description.length > 25
          ? p.description.substring(0, 23) + "..."
          : p.description,
      name: p.description,
      size: p.totalHT,
      fill: BAR_COLORS[i % BAR_COLORS.length],
    }));
  }, [revenueByProduct]);

  if (loading) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Top produits / services</h3>
        <Skeleton className="h-[350px] w-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Top produits / services</h3>
        <div className="flex items-center justify-center h-[350px] text-muted-foreground">
          Aucune donnée pour cette période
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium">Top produits / services</h3>
        <ToggleGroup type="single" value={viewType} onValueChange={(v) => v && setViewType(v)} size="sm">
          <ToggleGroupItem value="bar" aria-label="Bar chart">
            <BarChart2 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="treemap" aria-label="Treemap">
            <Grid3X3 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Tableau">
            <TableIcon className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {viewType === "bar" ? (
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            barCategoryGap="15%"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="shortDesc"
              hide
              width={0}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="totalHT"
              radius={[0, 4, 4, 0]}
              barSize={18}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList dataKey="shortDesc" content={<BarLabel />} />
            </Bar>
          </BarChart>
        </ChartContainer>
      ) : viewType === "treemap" ? (
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={chartData}
              dataKey="size"
              nameKey="name"
              content={<TreemapContent />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">CA HT</TableHead>
                <TableHead className="text-right">Quantité vendue</TableHead>
                <TableHead className="text-right">Factures</TableHead>
                <TableHead className="text-right">Prix moyen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chartData.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{p.description}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.totalHT)}</TableCell>
                  <TableCell className="text-right">{p.totalQuantity}</TableCell>
                  <TableCell className="text-right">{p.invoiceCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.averageUnitPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
