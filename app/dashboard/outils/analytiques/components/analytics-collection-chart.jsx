"use client";

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
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
    .toUpperCase();
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
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLLECTED_TABLE_COLOR }}
            />
            Encaissé TTC
          </span>
          <span className="font-medium">
            {formatCurrency(data.collectedTTC)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: INVOICED_TABLE_COLOR }}
            />
            Impayé TTC
          </span>
          <span className="font-medium">{formatCurrency(data.unpaidTTC)}</span>
        </div>
        <div className="flex items-center justify-between gap-6 text-muted-foreground border-t pt-1 mt-1">
          <span>Taux recouvrement</span>
          <span>
            {data.recoveryRate != null
              ? `${data.recoveryRate.toFixed(0)}%`
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

// Couleurs fixes pour bien différencier les séries (T15)
const INVOICED_TABLE_COLOR = "#5b50ff"; // violet
const COLLECTED_TABLE_COLOR = "#10b981"; // vert

export function AnalyticsCollectionChart({ monthlyCollection, loading }) {
  // Pas de remap : on veut des couleurs distinctes coûte que coûte
  const chartConfig = {
    invoicedTTC: {
      label: "Facture TTC encaissée",
      color: COLLECTED_TABLE_COLOR,
    },
    collectedTTC: {
      label: "Facture TTC impayée",
      color: INVOICED_TABLE_COLOR,
    },
  };
  const chartData = useMemo(() => {
    if (!monthlyCollection?.length) return [];
    return monthlyCollection.map((m) => {
      const collected = m.collectedTTC || 0;
      // unpaidTTC = factures émises non encore encaissées sur le mois
      const unpaid = Math.max(0, (m.invoicedTTC || 0) - collected);
      return {
        ...m,
        monthLabel: formatMonthLabel(m.month),
        // T15.3 : Taux de recouvrement = encaissé / impayé × 100
        // (Si impayé == 0, on retourne null pour éviter division par zéro)
        recoveryRate: unpaid > 0 ? (collected / unpaid) * 100 : null,
        unpaidTTC: unpaid,
      };
    });
  }, [monthlyCollection]);

  if (loading) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Recouvrement mensuel
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
          <Skeleton className="min-h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Recouvrement mensuel
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 flex items-center justify-center flex-1 min-h-[200px] text-muted-foreground">
          Aucune donnée pour cette période
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs flex flex-col min-h-0 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Recouvrement mensuel
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              tick={({ y, payload }) => (
                <text
                  x={0}
                  y={y}
                  textAnchor="start"
                  dominantBaseline="middle"
                  fontSize={11}
                  className="fill-muted-foreground"
                >
                  {`${(payload.value / 1000).toFixed(0)}k`}
                </text>
              )}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="collectedTTC"
              name="Facture TTC encaissée"
              fill={COLLECTED_TABLE_COLOR}
              fillOpacity={0.85}
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="unpaidTTC"
              name="Facture TTC impayée"
              fill={INVOICED_TABLE_COLOR}
              fillOpacity={0.85}
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
