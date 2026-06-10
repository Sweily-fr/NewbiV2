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
  Legend,
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

  const label = formatMonthLabel(data.month);
  const gap = (data.invoiced || 0) - (data.collected || 0);

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm min-w-[200px]">
      <p className="font-medium mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#5b50ff" }}
            />
            Facture TTC
          </span>
          <span className="font-medium">{formatCurrency(data.invoiced)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#10b981" }}
            />
            Encaissement bancaire
          </span>
          <span className="font-medium">{formatCurrency(data.collected)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-1 mt-1 text-muted-foreground">
          <span>Écart</span>
          <span style={{ color: gap >= 0 ? colors.success : colors.danger }}>
            {gap > 0 ? "+" : ""}
            {formatCurrency(gap)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Couleurs fixes pour différencier clairement les barres, sans remap thématique
const INVOICED_COLOR = "#5b50ff"; // violet — Facture TTC
const COLLECTED_COLOR = "#10b981"; // vert — Encaissement bancaire

export function AnalyticsBankFlowChart({
  monthlyRevenue,
  monthlyCollection,
  bankTransactions,
  loading,
}) {
  const chartColors = useChartColors();
  const chartConfig = useMemo(
    () => ({
      invoiced: { label: "Facture TTC", color: INVOICED_COLOR },
      collected: { label: "Encaissement bancaire", color: COLLECTED_COLOR },
    }),
    [],
  );
  const chartData = useMemo(() => {
    // Préférer monthlyCollection (qui inclut les factures importées par date d'émission)
    // sinon fallback sur monthlyRevenue
    const baseMonths =
      monthlyCollection && monthlyCollection.length > 0
        ? monthlyCollection.map((m) => ({
            month: m.month,
            invoicedTTC: m.invoicedTTC || 0,
          }))
        : (monthlyRevenue || []).map((m) => ({
            month: m.month,
            invoicedTTC: m.revenueTTC || 0,
          }));
    if (!baseMonths.length) return [];

    const validMonths = new Set(baseMonths.map((m) => m.month));

    // Agréger les encaissements bancaires par mois.
    // On EXCLUT les espèces : ce ne sont pas des encaissements bancaires.
    const bankByMonth = {};
    (bankTransactions || []).forEach((t) => {
      if (t.amount <= 0) return;
      // Garder pending et completed ; ignorer cancelled/draft.
      // Comparaison en minuscules : les statuts peuvent être stockés en
      // "COMPLETED" (majuscules) comme en "completed".
      const status = (t.status || "").toLowerCase();
      if (t.status && !["completed", "pending", "paid"].includes(status))
        return;
      // Exclure les espèces (paiement en CASH) : hors compte bancaire.
      const paymentMethod = String(
        t.metadata?.paymentMethod || t.paymentMethod || "",
      ).toUpperCase();
      if (paymentMethod === "CASH") return;
      const rawDate = t.date || t.processedAt || t.createdAt;
      if (!rawDate) return;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return;
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!validMonths.has(monthKey)) return;
      bankByMonth[monthKey] = (bankByMonth[monthKey] || 0) + t.amount;
    });

    return baseMonths.map((m) => ({
      month: m.month,
      monthLabel: formatMonthLabel(m.month),
      invoiced: m.invoicedTTC,
      collected: bankByMonth[m.month] || 0,
    }));
  }, [monthlyRevenue, monthlyCollection, bankTransactions]);

  if (loading) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Facturé vs Encaissé
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
            Facturé vs Encaissé
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
          Facturé vs Encaissé
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
            <Tooltip content={<CustomTooltip colors={chartColors} />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">
                  {chartConfig[value]?.label || value}
                </span>
              )}
            />
            <Bar
              dataKey="invoiced"
              fill={INVOICED_COLOR}
              fillOpacity={0.85}
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="collected"
              fill={COLLECTED_COLOR}
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
