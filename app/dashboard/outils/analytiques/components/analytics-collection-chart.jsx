"use client";

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
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
import { useChartColors } from "@/src/hooks/useChartColors";

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

function CustomTooltip({ active, payload, colors }) {
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
              style={{ backgroundColor: colors.success }}
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
              style={{ backgroundColor: colors.danger }}
            />
            Impayé TTC
          </span>
          <span className="font-medium">{formatCurrency(data.unpaidTTC)}</span>
        </div>
        <div className="flex items-center justify-between gap-6 text-muted-foreground border-t pt-1 mt-1">
          <span>Taux recouvrement</span>
          <span>
            {data.recoveryRate != null
              ? `${data.recoveryRate.toFixed(2)}%`
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsCollectionChart({ monthlyCollection, loading }) {
  const colors = useChartColors();
  // Encaissé = couleur "succès", Impayé = couleur "danger".
  // Ces deux couleurs restent distinctes en mode standard (vert / rouge)
  // ET en mode daltonien (bleu brand / noir) — cf. useChartColors.
  const COLLECTED_COLOR = colors.success;
  const UNPAID_COLOR = colors.danger;

  const chartConfig = useMemo(
    () => ({
      collectedTTC: { label: "Facture TTC encaissée", color: COLLECTED_COLOR },
      unpaidTTC: { label: "Facture TTC impayée", color: UNPAID_COLOR },
    }),
    [COLLECTED_COLOR, UNPAID_COLOR],
  );

  const chartData = useMemo(() => {
    if (!monthlyCollection?.length) return [];
    return monthlyCollection.map((m) => {
      const collected = m.collectedTTC || 0;
      // unpaidTTC vient du backend : factures échues (échéance dépassée),
      // sans avoir, Newbi + importées, regroupées par mois d'échéance.
      const unpaid = m.unpaidTTC || 0;
      return {
        ...m,
        monthLabel: formatMonthLabel(m.month),
        collectedTTC: collected,
        unpaidTTC: unpaid,
        // Taux de recouvrement = encaissé / impayé × 100
        // (si impayé == 0, null pour éviter la division par zéro)
        recoveryRate: unpaid > 0 ? (collected / unpaid) * 100 : null,
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
            <Tooltip content={<CustomTooltip colors={colors} />} />
            <Bar
              dataKey="collectedTTC"
              name="Facture TTC encaissée"
              fill={COLLECTED_COLOR}
              fillOpacity={0.85}
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="unpaidTTC"
              name="Facture TTC impayée"
              fill={UNPAID_COLOR}
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
