"use client";

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  ReferenceArea,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
} from "@/src/components/ui/card";
import {
  ChartContainer,
} from "@/src/components/ui/chart";
import { Skeleton } from "@/src/components/ui/skeleton";

// ─── Chart config ───

const chartConfig = {
  actualIncome: { label: "Entrées réelles", color: "#22c55e" },
  forecastIncome: { label: "Prév. entrées", color: "#22c55e" },
  actualExpense: { label: "Sorties réelles", color: "#fca5a5" },
  forecastExpense: { label: "Prév. sorties", color: "#f87171" },
  balance: { label: "Solde", color: "#3b82f6" },
};

// ─── Formatters ───

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatCurrencyShort = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatMonthLabel = (monthStr) => {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  const label = date
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  return `${label}. ${year.slice(2)}`;
};

// ─── Category labels ───

const CATEGORY_LABELS = {
  SALES: "Ventes",
  REFUNDS_RECEIVED: "Remboursements reçus",
  OTHER_INCOME: "Autres revenus",
  RENT: "Loyer",
  SUBSCRIPTIONS: "Abonnements",
  OFFICE_SUPPLIES: "Fournitures",
  SERVICES: "Services",
  TRANSPORT: "Transport",
  MEALS: "Repas",
  TELECOMMUNICATIONS: "Télécom",
  INSURANCE: "Assurance",
  ENERGY: "Énergie",
  SOFTWARE: "Logiciels",
  HARDWARE: "Matériel",
  MARKETING: "Marketing",
  TRAINING: "Formation",
  MAINTENANCE: "Maintenance",
  TAXES: "Impôts & taxes",
  UTILITIES: "Charges",
  SALARIES: "Salaires",
  OTHER_EXPENSE: "Autres dépenses",
};

const CATEGORY_COLORS = [
  "#3B82F6", "#2DD4BF", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316",
];

// ─── Custom Tooltip (Qonto style) ───

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const [year, month] = (data.rawMonth || "").split("-");
  const monthDate = new Date(parseInt(year), parseInt(month) - 1);
  const monthLabel = monthDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const capitalizedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const forecastIncome = data.rawForecastIncome || 0;
  const actualIncome = data.actualIncome || 0;
  const forecastExpense = data.rawForecastExpense || 0;
  const actualExpense = data.actualExpense || 0;

  const incomePct = forecastIncome > 0 ? Math.round((actualIncome / forecastIncome) * 100) : null;
  const expensePct = forecastExpense > 0 ? Math.round((actualExpense / forecastExpense) * 100) : null;

  return (
    <div className="bg-background rounded-xl shadow-lg border border-border p-4 min-w-[240px]">
      <div className="text-sm font-medium text-foreground border-b border-border pb-2 mb-3">
        {capitalizedLabel}
      </div>

      {/* Entrées */}
      {(forecastIncome > 0 || actualIncome > 0) && (
        <div className="mb-3">
          <div className="text-xs font-medium text-foreground mb-1.5">Entrées</div>
          {forecastIncome > 0 && (
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{
                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(34,197,94,0.5) 2px, rgba(34,197,94,0.5) 4px)",
                    backgroundColor: "rgba(34,197,94,0.15)",
                  }}
                />
                <span className="text-xs text-muted-foreground">Prévision</span>
              </div>
              <span className="text-xs font-medium text-foreground">{formatCurrency(forecastIncome)}</span>
            </div>
          )}
          {actualIncome > 0 && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
                <span className="text-xs text-muted-foreground">Réelles</span>
              </div>
              <div className="flex items-center gap-2">
                {incomePct !== null && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded tabular-nums">
                    {incomePct}%
                  </span>
                )}
                <span className="text-xs font-medium text-foreground">{formatCurrency(actualIncome)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sorties */}
      {(forecastExpense > 0 || actualExpense > 0) && (
        <div>
          <div className="text-xs font-medium text-foreground mb-1.5">Sorties</div>
          {forecastExpense > 0 && (
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{
                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(248,113,113,0.5) 2px, rgba(248,113,113,0.5) 4px)",
                    backgroundColor: "rgba(248,113,113,0.15)",
                  }}
                />
                <span className="text-xs text-muted-foreground">Prévision</span>
              </div>
              <span className="text-xs font-medium text-foreground">{formatCurrency(forecastExpense)}</span>
            </div>
          )}
          {actualExpense > 0 && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-red-400" />
                <span className="text-xs text-muted-foreground">Réelles</span>
              </div>
              <div className="flex items-center gap-2">
                {expensePct !== null && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded tabular-nums">
                    {expensePct}%
                  </span>
                )}
                <span className="text-xs font-medium text-foreground">{formatCurrency(actualExpense)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Hatched Icon ───

function HatchedIcon() {
  return (
    <svg width="48" height="56" viewBox="0 0 48 56" fill="none" className="shrink-0">
      <defs>
        <pattern id="hatch-icon-1" patternUnits="userSpaceOnUse" width="3" height="3">
          <line x1="0" y1="0" x2="0" y2="3" stroke="#0D9488" strokeWidth="1.5" opacity="0.7" />
        </pattern>
        <pattern id="hatch-icon-2" patternUnits="userSpaceOnUse" width="3" height="3">
          <line x1="0" y1="0" x2="0" y2="3" stroke="#0D9488" strokeWidth="1.5" opacity="0.5" />
        </pattern>
        <pattern id="hatch-icon-3" patternUnits="userSpaceOnUse" width="3" height="3">
          <line x1="0" y1="0" x2="0" y2="3" stroke="#0D9488" strokeWidth="1.5" opacity="0.35" />
        </pattern>
      </defs>
      <rect x="2" y="8" width="10" height="48" rx="2" fill="url(#hatch-icon-1)" />
      <rect x="14" y="18" width="10" height="38" rx="2" fill="url(#hatch-icon-2)" />
      <rect x="26" y="26" width="10" height="30" rx="2" fill="url(#hatch-icon-3)" />
      <rect x="38" y="34" width="8" height="22" rx="2" fill="url(#hatch-icon-3)" />
    </svg>
  );
}

// ─── Component ───

export function ForecastPaymentsCard({ months, kpi, loading }) {
  const safeMonths = months || [];

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Build chart data with stacked actual + forecast remainder
  const chartData = useMemo(() => {
    if (!safeMonths.length) return [];
    return safeMonths.map((m) => ({
      label: formatMonthLabel(m.month),
      rawMonth: m.month,
      isCurrent: m.month === currentMonth,
      // Actual (solid bars)
      actualIncome: m.actualIncome || 0,
      actualExpense: m.actualExpense || 0,
      // Forecast remainder (hatched bars) — portion above actual
      forecastIncome: Math.max(0, (m.forecastIncome || 0) - (m.actualIncome || 0)),
      forecastExpense: Math.max(0, (m.forecastExpense || 0) - (m.actualExpense || 0)),
      // Raw forecast for tooltip
      rawForecastIncome: m.forecastIncome || 0,
      rawForecastExpense: m.forecastExpense || 0,
      // Balance line
      balance: m.closingBalance || 0,
    }));
  }, [safeMonths, currentMonth]);

  // Top categories split by income / expense
  const buildCategoryList = (type, limit) => {
    const catMap = {};
    safeMonths.forEach((m) => {
      (m.categoryBreakdown || []).forEach((cb) => {
        if (cb.type !== type) return;
        const key = cb.category;
        if (!catMap[key]) catMap[key] = { category: key, type: cb.type, amount: 0 };
        const isPast = m.month <= currentMonth;
        catMap[key].amount += isPast ? (cb.actualAmount || 0) : (cb.forecastAmount || 0);
      });
    });
    const sorted = Object.values(catMap)
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
    const total = sorted.reduce((s, c) => s + c.amount, 0);
    return { categories: sorted.map((c, i) => ({
      ...c,
      label: CATEGORY_LABELS[c.category] || c.category,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      pct: total > 0 ? ((c.amount / total) * 100).toFixed(1) : "0",
    })), total };
  };

  const { categories: topIncome, total: totalIncome } = useMemo(
    () => safeMonths.length ? buildCategoryList("INCOME", 3) : { categories: [], total: 0 },
    [safeMonths, currentMonth]
  );
  const { categories: topExpense, total: totalExpense } = useMemo(
    () => safeMonths.length ? buildCategoryList("EXPENSE", 3) : { categories: [], total: 0 },
    [safeMonths, currentMonth]
  );

  const today = new Date();
  const todayDate = today.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = today.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const totalAmount = (kpi?.pendingPayables || 0) + (kpi?.pendingReceivables || 0);

  // Current month index for highlight
  const currentIdx = chartData.findIndex((d) => d.isCurrent);

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-40" />
            </div>
          </div>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-background shadow-none">
      <CardContent className="p-0">
        {/* ─── Top row ─── */}
        <div className="flex items-center justify-between px-8 pt-3 pb-6">
          <div className="flex items-center gap-4">
            <HatchedIcon />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Paiements en attente</p>
              <p className="text-[32px] font-medium text-foreground leading-tight tracking-tight">
                {formatCurrencyShort(totalAmount)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-12">
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-normal mb-1.5">Encaissements</p>
              <p className="text-xl font-medium text-foreground">{formatCurrencyShort(kpi?.pendingReceivables || 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-normal mb-1.5">Décaissements</p>
              <p className="text-xl font-medium text-foreground">{formatCurrencyShort(kpi?.pendingPayables || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs">
                <span className="text-muted-foreground">Aujourd&apos;hui </span>
                <span className="text-foreground font-medium">{todayDate}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{timeStr}</p>
            </div>
          </div>
        </div>

        {/* ─── Bottom: legend + chart ─── */}
        <div className="border-t border-border">
          <div className="flex">
            {/* Left: legend split by income / expense */}
            <div className="w-[280px] shrink-0 border-r border-border px-8 pt-6 pb-8">
              {/* ── Entrées ── */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-medium text-emerald-600">Entrées</p>
                  <p className="text-[13px] font-medium text-foreground">{formatCurrencyShort(totalIncome)}</p>
                </div>
                {topIncome.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {topIncome.map((cat) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                          <span className="text-sm text-foreground">{cat.label}</span>
                        </div>
                        <span className="text-sm tabular-nums text-foreground">{formatCurrencyShort(cat.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune entrée</p>
                )}
              </div>

              {/* ── Sorties ── */}
              <div className="pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-medium text-red-400">Sorties</p>
                  <p className="text-[13px] font-medium text-foreground">{formatCurrencyShort(totalExpense)}</p>
                </div>
                {topExpense.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {topExpense.map((cat) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0 bg-red-400" />
                          <span className="text-sm text-foreground">{cat.label}</span>
                        </div>
                        <span className="text-sm tabular-nums text-foreground">{formatCurrencyShort(cat.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune sortie</p>
                )}
              </div>
            </div>

            {/* Right: chart */}
            <div className="flex-1 min-w-0 px-8 pt-6 pb-8">
              <p className="text-sm font-medium text-foreground mb-4">Flux mensuels</p>

              {chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 12, right: 12, bottom: 12, left: 0 }}
                  >
                    <defs>
                      {/* Hatched pattern for forecast income (green) */}
                      <pattern
                        id="hatchIncomePayments"
                        patternUnits="userSpaceOnUse"
                        width="6"
                        height="6"
                        patternTransform="rotate(45)"
                      >
                        <rect width="6" height="6" fill="#dcfce7" />
                        <line x1="0" y1="0" x2="0" y2="6" stroke="#22c55e" strokeWidth="2.5" strokeOpacity="0.5" />
                      </pattern>
                      {/* Hatched pattern for forecast expense (red) */}
                      <pattern
                        id="hatchExpensePayments"
                        patternUnits="userSpaceOnUse"
                        width="6"
                        height="6"
                        patternTransform="rotate(45)"
                      >
                        <rect width="6" height="6" fill="#fee2e2" />
                        <line x1="0" y1="0" x2="0" y2="6" stroke="#f87171" strokeWidth="2.5" strokeOpacity="0.5" />
                      </pattern>
                      {/* Gradient under balance line for forecast zone */}
                      <linearGradient id="balanceGradientPayments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid vertical={false} strokeDasharray="0" className="stroke-border" />

                    {/* Current month highlight */}
                    {currentIdx >= 0 && (
                      <ReferenceArea
                        x1={chartData[currentIdx]?.label}
                        x2={chartData[currentIdx]?.label}
                        className="fill-muted"
                        fillOpacity={0.5}
                        ifOverflow="extendDomain"
                      />
                    )}

                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      interval={0}
                      tick={({ x, y, payload }) => {
                        const dataItem = chartData.find((d) => d.label === payload.value);
                        const isCurrent = dataItem?.isCurrent;
                        return (
                          <text
                            x={x}
                            y={y + 4}
                            textAnchor="middle"
                            fontSize={10}
                            fill={isCurrent ? "#3b82f6" : "#9ca3af"}
                            fontWeight={isCurrent ? 600 : 400}
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                    />
                    <YAxis
                      yAxisId="bars"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      domain={[0, "auto"]}
                      tickFormatter={(v) => {
                        if (v === 0) return "0";
                        if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                        return String(v);
                      }}
                      width={50}
                    />
                    <YAxis
                      yAxisId="balance"
                      orientation="right"
                      hide={true}
                    />

                    <Tooltip content={<CustomTooltip />} cursor={false} />

                    {/* Income: actual (solid green) + forecast remainder (hatched green) */}
                    <Bar yAxisId="bars" dataKey="actualIncome" stackId="income" fill="#22c55e" barSize={20} radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="bars" dataKey="forecastIncome" stackId="income" fill="url(#hatchIncomePayments)" barSize={20} radius={[4, 4, 0, 0]} />

                    {/* Expense: actual (solid red) + forecast remainder (hatched red) */}
                    <Bar yAxisId="bars" dataKey="actualExpense" stackId="expense" fill="#fca5a5" barSize={20} radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="bars" dataKey="forecastExpense" stackId="expense" fill="url(#hatchExpensePayments)" barSize={20} radius={[4, 4, 0, 0]} />

                    {/* Balance line (separate right axis) */}
                    <Line
                      yAxisId="balance"
                      dataKey="balance"
                      type="monotone"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#ffffff", stroke: "#3b82f6", strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: "#ffffff", stroke: "#3b82f6", strokeWidth: 2 }}
                      connectNulls
                    />
                  </ComposedChart>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
