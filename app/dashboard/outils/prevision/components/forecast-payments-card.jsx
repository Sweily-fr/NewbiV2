"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Clock,
  Wallet,
  Calculator,
  PiggyBank,
  Landmark,
  Home,
  Users,
  CreditCard,
  Wrench,
  Monitor,
  Receipt,
  Megaphone,
  Car,
  Shield,
  Zap,
  Phone,
  UtensilsCrossed,
  Package,
  Cpu,
  GraduationCap,
  HardDrive,
  Plug,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  Tooltip as ShadTooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import { MonthDetailsDrawer } from "./month-details-drawer";
import { useChartColors } from "@/src/hooks/useChartColors";

// ─── Shared layout constants ───

const LABEL_COL_WIDTH = 160;
const COLUMN_WIDTH = 120;
const CHART_HEIGHT = 200;
const VISIBLE_MONTHS = 7;
const CHART_MARGIN = { top: 12, right: 0, bottom: 0, left: 0 };
const X_AXIS_HEIGHT = 32;

// ─── Badge thresholds ───

const BADGE_THRESHOLDS = {
  EXCEEDS: { min: 120, color: "text-violet-600 bg-violet-50" },
  ON_TRACK: { min: 80, color: "text-green-700 bg-green-50" },
  BEHIND: { min: 40, color: "text-amber-700 bg-amber-50" },
  CRITICAL: { min: 0, color: "text-red-600 bg-red-50" },
};

const getBadgeStyle = (pct) => {
  if (pct >= BADGE_THRESHOLDS.EXCEEDS.min)
    return BADGE_THRESHOLDS.EXCEEDS.color;
  if (pct >= BADGE_THRESHOLDS.ON_TRACK.min)
    return BADGE_THRESHOLDS.ON_TRACK.color;
  if (pct >= BADGE_THRESHOLDS.BEHIND.min) return BADGE_THRESHOLDS.BEHIND.color;
  return BADGE_THRESHOLDS.CRITICAL.color;
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

const FR_MONTHS_3 = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

const formatMonthLabel = (monthStr) => {
  const [year, month] = monthStr.split("-");
  return `${FR_MONTHS_3[parseInt(month) - 1]}.${year.slice(2)}`;
};

// ─── Y-axis tick calculation (nice numbers) ───

function niceNum(range, round) {
  if (range <= 0) return 1;
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let nice;
  if (round) {
    if (fraction < 1.5) nice = 1;
    else if (fraction < 3) nice = 2;
    else if (fraction < 7) nice = 5;
    else nice = 10;
  } else {
    if (fraction <= 1) nice = 1;
    else if (fraction <= 2) nice = 2;
    else if (fraction <= 5) nice = 5;
    else nice = 10;
  }
  return nice * Math.pow(10, exponent);
}

function computeYTicks(maxValue, desiredTicks = 5) {
  if (maxValue <= 0) return { ticks: [0], max: 100 };
  const range = niceNum(maxValue, false);
  const spacing = niceNum(range / (desiredTicks - 1), true);
  const niceMax = Math.ceil(maxValue / spacing) * spacing;
  const ticks = [];
  for (let v = 0; v <= niceMax; v += spacing) {
    ticks.push(Math.round(v));
  }
  return { ticks, max: niceMax };
}

function formatTickLabel(v) {
  if (v === 0) return "0";
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return String(v);
}

// ─── Custom Tooltip ───

function CustomTooltip({ active, payload, remap, incomeColor, expenseColor }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const [year, month] = (data.rawMonth || "").split("-");
  const monthDate = new Date(parseInt(year), parseInt(month) - 1);
  const monthLabel = monthDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const capitalizedLabel =
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const forecastIncome = data.rawForecastIncome || 0;
  const actualIncome = data.actualIncome || 0;
  const forecastExpense = data.rawForecastExpense || 0;
  const actualExpense = data.actualExpense || 0;
  const incomePct =
    forecastIncome > 0
      ? Math.round((actualIncome / forecastIncome) * 100)
      : null;
  const expensePct =
    forecastExpense > 0
      ? Math.round((actualExpense / forecastExpense) * 100)
      : null;

  return (
    <div className="bg-background rounded-xl shadow-lg border border-border p-4 min-w-[240px]">
      <div className="text-sm font-medium text-foreground border-b border-border pb-2 mb-3">
        {capitalizedLabel}
      </div>
      {(forecastIncome > 0 || actualIncome > 0) && (
        <div className="mb-3">
          <div className="text-xs font-medium text-foreground mb-1.5">
            Entrées
          </div>
          {forecastIncome > 0 && (
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: `${incomeColor}40`,
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, ${incomeColor}80 2px, ${incomeColor}80 4px)`,
                  }}
                />
                <span className="text-xs text-muted-foreground">Prévision</span>
              </div>
              <span className="text-xs font-medium text-foreground">
                {formatCurrency(forecastIncome)}
              </span>
            </div>
          )}
          {actualIncome > 0 && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: incomeColor }}
                />
                <span className="text-xs text-muted-foreground">Réelles</span>
              </div>
              <div className="flex items-center gap-2">
                {incomePct !== null && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded tabular-nums">
                    {incomePct}%
                  </span>
                )}
                <span className="text-xs font-medium text-foreground">
                  {formatCurrency(actualIncome)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      {(forecastExpense > 0 || actualExpense > 0) && (
        <div>
          <div className="text-xs font-medium text-foreground mb-1.5">
            Sorties
          </div>
          {forecastExpense > 0 && (
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: `${expenseColor}40`,
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, ${expenseColor}80 2px, ${expenseColor}80 4px)`,
                  }}
                />
                <span className="text-xs text-muted-foreground">Prévision</span>
              </div>
              <span className="text-xs font-medium text-foreground">
                {formatCurrency(forecastExpense)}
              </span>
            </div>
          )}
          {actualExpense > 0 && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: expenseColor }}
                />
                <span className="text-xs text-muted-foreground">Réelles</span>
              </div>
              <div className="flex items-center gap-2">
                {expensePct !== null && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded tabular-nums">
                    {expensePct}%
                  </span>
                )}
                <span className="text-xs font-medium text-foreground">
                  {formatCurrency(actualExpense)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Category configs for table ───

const INCOME_CATEGORIES = [
  {
    key: "SALES",
    label: "Chiffre d'affaires",
    bg: "bg-violet-100",
    text: "text-violet-600",
    icon: Wallet,
  },
  {
    key: "OTHER_INCOME",
    label: "Autres revenus fi...",
    bg: "bg-emerald-100",
    text: "text-emerald-600",
    icon: Calculator,
  },
  {
    key: "REFUNDS_RECEIVED",
    label: "Subventions et ai...",
    bg: "bg-amber-100",
    text: "text-amber-600",
    icon: PiggyBank,
  },
];

const EXPENSE_CATEGORIES = [
  {
    key: "RENT",
    label: "Loyer",
    bg: "bg-rose-100",
    text: "text-rose-600",
    icon: Home,
  },
  {
    key: "SALARIES",
    label: "Salaires",
    bg: "bg-blue-100",
    text: "text-blue-600",
    icon: Users,
  },
  {
    key: "SUBSCRIPTIONS",
    label: "Abonnements",
    bg: "bg-violet-100",
    text: "text-violet-500",
    icon: CreditCard,
  },
  {
    key: "SERVICES",
    label: "Services",
    bg: "bg-cyan-100",
    text: "text-cyan-600",
    icon: Wrench,
  },
  {
    key: "SOFTWARE",
    label: "Logiciels",
    bg: "bg-indigo-100",
    text: "text-indigo-500",
    icon: Monitor,
  },
  {
    key: "TAXES",
    label: "Impôts & taxes",
    bg: "bg-amber-100",
    text: "text-amber-600",
    icon: Receipt,
  },
  {
    key: "MARKETING",
    label: "Marketing",
    bg: "bg-pink-100",
    text: "text-pink-600",
    icon: Megaphone,
  },
  {
    key: "TRANSPORT",
    label: "Transport",
    bg: "bg-emerald-100",
    text: "text-emerald-500",
    icon: Car,
  },
  {
    key: "INSURANCE",
    label: "Assurance",
    bg: "bg-sky-100",
    text: "text-sky-600",
    icon: Shield,
  },
  {
    key: "ENERGY",
    label: "Énergie",
    bg: "bg-yellow-100",
    text: "text-yellow-600",
    icon: Zap,
  },
  {
    key: "TELECOMMUNICATIONS",
    label: "Télécom",
    bg: "bg-teal-100",
    text: "text-teal-600",
    icon: Phone,
  },
  {
    key: "MEALS",
    label: "Repas",
    bg: "bg-orange-100",
    text: "text-orange-500",
    icon: UtensilsCrossed,
  },
  {
    key: "OFFICE_SUPPLIES",
    label: "Fournitures",
    bg: "bg-gray-100",
    text: "text-gray-500",
    icon: Package,
  },
  {
    key: "HARDWARE",
    label: "Matériel",
    bg: "bg-slate-100",
    text: "text-slate-500",
    icon: Cpu,
  },
  {
    key: "TRAINING",
    label: "Formation",
    bg: "bg-lime-100",
    text: "text-lime-600",
    icon: GraduationCap,
  },
  {
    key: "MAINTENANCE",
    label: "Maintenance",
    bg: "bg-stone-100",
    text: "text-stone-500",
    icon: HardDrive,
  },
  {
    key: "UTILITIES",
    label: "Charges",
    bg: "bg-neutral-100",
    text: "text-neutral-500",
    icon: Plug,
  },
  {
    key: "OTHER_EXPENSE",
    label: "Autres dépenses",
    bg: "bg-gray-100",
    text: "text-gray-400",
    icon: MoreHorizontal,
  },
];

// ═══════════════════════════════════════════════════════════
// ─── Main Component ───
// ═══════════════════════════════════════════════════════════

export function ForecastPaymentsCard({ months, kpi, loading, onCellClick }) {
  const { remap } = useChartColors();
  const incomeColor = remap("#5b50ff");
  const expenseColor = remap("#000000");

  const safeMonths = months || [];
  const [selectedMonth, setSelectedMonth] = useState(null);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const N = safeMonths.length;

  // Pagination
  const currentMonthIdx = safeMonths.findIndex((m) => m.month === currentMonth);
  const defaultStart = Math.max(
    0,
    Math.min(
      currentMonthIdx - Math.floor(VISIBLE_MONTHS / 2),
      N - VISIBLE_MONTHS,
    ),
  );
  const [visibleStart, setVisibleStart] = useState(Math.max(0, defaultStart));
  const canGoBack = visibleStart > 0;
  const canGoForward = visibleStart + VISIBLE_MONTHS < N;
  const visibleMonths = useMemo(
    () => safeMonths.slice(visibleStart, visibleStart + VISIBLE_MONTHS),
    [safeMonths, visibleStart],
  );

  // Chart data (visible months only)
  const chartData = useMemo(() => {
    if (!visibleMonths.length) return [];
    return visibleMonths.map((m) => ({
      label: formatMonthLabel(m.month),
      rawMonth: m.month,
      isCurrent: m.month === currentMonth,
      actualIncome: m.actualIncome || 0,
      actualExpense: m.actualExpense || 0,
      forecastIncome: Math.max(
        0,
        (m.forecastIncome || 0) - (m.actualIncome || 0),
      ),
      forecastExpense: Math.max(
        0,
        (m.forecastExpense || 0) - (m.actualExpense || 0),
      ),
      rawForecastIncome: m.forecastIncome || 0,
      rawForecastExpense: m.forecastExpense || 0,
      balance: m.closingBalance || 0,
    }));
  }, [visibleMonths, currentMonth]);

  // Y-axis ticks (computed from ALL months for consistent scale)
  const { yTicks, yMax } = useMemo(() => {
    if (!chartData.length) return { yTicks: [0], yMax: 100 };
    let max = 0;
    for (const d of chartData) {
      max = Math.max(
        max,
        d.actualIncome + d.forecastIncome,
        d.actualExpense + d.forecastExpense,
      );
    }
    const { ticks, max: niceMax } = computeYTicks(max);
    return { yTicks: ticks, yMax: niceMax };
  }, [chartData]);

  // Table data
  const [incomeExpanded, setIncomeExpanded] = useState(true);
  const [expenseExpanded, setExpenseExpanded] = useState(true);

  const catLookup = useMemo(() => {
    const lookup = {};
    for (const m of safeMonths) {
      const map = {};
      for (const cb of m.categoryBreakdown || []) {
        map[cb.category] = {
          actual: cb.actualAmount || 0,
          forecast: cb.forecastAmount || 0,
        };
      }
      lookup[m.month] = map;
    }
    return lookup;
  }, [safeMonths]);

  const activeIncomeCategories = useMemo(
    () =>
      INCOME_CATEGORIES.filter((cat) =>
        safeMonths.some((m) => {
          const d = catLookup[m.month]?.[cat.key];
          return d && (d.actual > 0 || d.forecast > 0);
        }),
      ),
    [safeMonths, catLookup],
  );

  const activeExpenseCategories = useMemo(
    () =>
      EXPENSE_CATEGORIES.filter((cat) =>
        safeMonths.some((m) => {
          const d = catLookup[m.month]?.[cat.key];
          return d && (d.actual > 0 || d.forecast > 0);
        }),
      ),
    [safeMonths, catLookup],
  );

  // ─── Loading state ───

  if (loading) {
    return (
      <div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-6">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-9 w-40" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border p-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  // ─── Render ───

  return (
    <div>
      {/* ─── Chart ─── */}
      <div className="relative">
        {/* Navigation arrows */}
        {N > VISIBLE_MONTHS && (
          <div className="flex items-center gap-1 absolute bottom-1 left-0 z-10">
            <button
              type="button"
              onClick={() => setVisibleStart((s) => Math.max(0, s - 1))}
              disabled={!canGoBack}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-default"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() =>
                setVisibleStart((s) => Math.min(N - VISIBLE_MONTHS, s + 1))
              }
              disabled={!canGoForward}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-default"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="w-full" style={{ height: CHART_HEIGHT }}>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <ComposedChart
                data={chartData}
                margin={{ top: 12, right: 24, bottom: 0, left: 24 }}
                onClick={(state) => {
                  const payload = state?.activePayload?.[0]?.payload;
                  if (payload?.rawMonth) setSelectedMonth(payload.rawMonth);
                }}
                style={{ cursor: "pointer" }}
              >
                <defs>
                  <pattern
                    id="hatchIncomePayments"
                    patternUnits="userSpaceOnUse"
                    width="6"
                    height="6"
                    patternTransform="rotate(45)"
                  >
                    <rect width="6" height="6" fill={remap("#e8e6ff")} />
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="6"
                      stroke={remap("#5b50ff")}
                      strokeWidth="2.5"
                      strokeOpacity="0.5"
                    />
                  </pattern>
                  <pattern
                    id="hatchExpensePayments"
                    patternUnits="userSpaceOnUse"
                    width="6"
                    height="6"
                    patternTransform="rotate(45)"
                  >
                    <rect width="6" height="6" fill={remap("#e5e5e5")} />
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="6"
                      stroke={remap("#000000")}
                      strokeWidth="2.5"
                      strokeOpacity="0.5"
                    />
                  </pattern>
                </defs>

                <CartesianGrid
                  vertical={false}
                  strokeDasharray="0"
                  className="stroke-border"
                />

                {/* Current month highlight */}
                {(() => {
                  const cur = chartData.find((d) => d.isCurrent);
                  return cur ? (
                    <ReferenceArea
                      x1={cur.label}
                      x2={cur.label}
                      fill="#000000"
                      fillOpacity={0.04}
                      ifOverflow="extendDomain"
                    />
                  ) : null;
                })()}

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  height={X_AXIS_HEIGHT}
                  tick={({ x, y, payload }) => {
                    const dataItem = chartData.find(
                      (d) => d.label === payload.value,
                    );
                    const isCurrent = dataItem?.isCurrent;
                    return (
                      <text
                        x={x}
                        y={y + 4}
                        textAnchor="middle"
                        fontSize={11}
                        fill={isCurrent ? remap("#3b82f6") : "#9ca3af"}
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
                  tickMargin={4}
                  domain={[0, yMax]}
                  ticks={yTicks}
                  tickFormatter={formatTickLabel}
                  width={40}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis yAxisId="balance" orientation="right" hide width={0} />

                <Tooltip
                  content={
                    <CustomTooltip
                      remap={remap}
                      incomeColor={incomeColor}
                      expenseColor={expenseColor}
                    />
                  }
                  cursor={false}
                />

                <Bar
                  yAxisId="bars"
                  dataKey="actualIncome"
                  stackId="income"
                  fill={remap("#5b50ff")}
                  barSize={20}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="bars"
                  dataKey="forecastIncome"
                  stackId="income"
                  fill="url(#hatchIncomePayments)"
                  barSize={20}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="bars"
                  dataKey="actualExpense"
                  stackId="expense"
                  fill={remap("#333333")}
                  barSize={20}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="bars"
                  dataKey="forecastExpense"
                  stackId="expense"
                  fill="url(#hatchExpensePayments)"
                  barSize={20}
                  radius={[4, 4, 0, 0]}
                />

                <Line
                  yAxisId="balance"
                  dataKey="balance"
                  type="monotone"
                  stroke={remap("#3b82f6")}
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: "#ffffff",
                    stroke: remap("#3b82f6"),
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 5,
                    fill: "#ffffff",
                    stroke: remap("#3b82f6"),
                    strokeWidth: 2,
                  }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ─── Forecast Table ─── */}
      {chartData.length > 0 && (
        <ForecastTable
          months={visibleMonths}
          currentMonth={currentMonth}
          catLookup={catLookup}
          activeIncomeCategories={activeIncomeCategories}
          activeExpenseCategories={activeExpenseCategories}
          incomeExpanded={incomeExpanded}
          setIncomeExpanded={setIncomeExpanded}
          expenseExpanded={expenseExpanded}
          setExpenseExpanded={setExpenseExpanded}
          onCellClick={onCellClick}
        />
      )}

      <MonthDetailsDrawer
        month={selectedMonth}
        open={!!selectedMonth}
        onOpenChange={(open) => {
          if (!open) setSelectedMonth(null);
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ─── Forecast Table ───
// ═══════════════════════════════════════════════════════════

const formatNumber = (value) => {
  if (!value || value === 0) return "–";
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
};

function ForecastTable({
  months,
  currentMonth,
  catLookup,
  activeIncomeCategories,
  activeExpenseCategories,
  incomeExpanded,
  setIncomeExpanded,
  expenseExpanded,
  setExpenseExpanded,
  onCellClick,
}) {
  const N = months.length;

  const Row = ({ label, labelClass, onClick, borderClass, children }) => (
    <div className={cn("flex items-center", borderClass)} onClick={onClick}>
      <div
        className={cn("shrink-0 px-4 py-3.5 overflow-hidden", labelClass)}
        style={{ width: 160 }}
      >
        {label}
      </div>
      <div
        className="flex-1 grid pr-6"
        style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}
      >
        {children}
      </div>
    </div>
  );

  const Cell = ({
    value,
    isPast,
    isCurrent,
    badge,
    muted: isMuted,
    onClick: cellClick,
  }) => {
    const isFutureClickable = !isPast && cellClick;
    return (
      <div
        className={cn(
          "py-3.5 text-center text-[13px] tabular-nums group/cell relative",
          isCurrent && "bg-black/[0.04]",
          isFutureClickable &&
            "cursor-pointer hover:bg-muted/40 transition-colors rounded",
        )}
        onClick={isFutureClickable ? cellClick : undefined}
        title={
          isFutureClickable ? "Cliquer pour ajouter une prévision" : undefined
        }
      >
        <span
          className={cn(
            isMuted && "text-muted-foreground",
            !isMuted && isPast && "font-semibold text-foreground",
            !isMuted && !isPast && "text-muted-foreground",
            isFutureClickable &&
              "group-hover/cell:opacity-0 transition-opacity",
          )}
        >
          {value}
        </span>
        {badge}
        {isFutureClickable && (
          <span className="absolute inset-0 flex items-center justify-center text-muted-foreground/50 text-lg opacity-0 group-hover/cell:opacity-100 transition-opacity">
            +
          </span>
        )}
      </div>
    );
  };

  const Badge = ({ pct }) => (
    <span
      className={cn(
        "ml-2 text-[11px] px-1.5 py-0.5 rounded tabular-nums",
        getBadgeStyle(pct),
      )}
    >
      {pct} %
    </span>
  );

  const EstBadge = ({ pct }) => (
    <span className="ml-2 text-[11px] text-muted-foreground/50 tabular-nums">
      {pct} %
    </span>
  );

  return (
    <div>
      {/* ── Début du mois (header séparé) ── */}
      <Row
        label={
          <span className="text-[13px] font-medium text-foreground">
            Début du mois
          </span>
        }
        borderClass="bg-muted/40 border border-border rounded-lg mt-6"
      >
        {months.map((m) => (
          <div
            key={m.month}
            className={cn(
              "py-3.5 text-center text-[13px] tabular-nums font-semibold text-foreground",
              m.month === currentMonth && "bg-black/[0.06]",
            )}
          >
            {formatNumber(m.openingBalance)}
          </div>
        ))}
      </Row>

      <div className="h-4" />

      <div className="border border-border rounded-lg overflow-hidden">
        {/* ── Entrées ── */}
        <Row
          label={
            <div className="flex items-center gap-2">
              <ChevronDown
                size={14}
                className={cn(
                  "text-muted-foreground transition-transform",
                  !incomeExpanded && "-rotate-90",
                )}
              />
              <span className="text-[13px] font-semibold text-foreground">
                Entrées
              </span>
            </div>
          }
          onClick={() => setIncomeExpanded((v) => !v)}
          borderClass="border-b border-border cursor-pointer bg-muted/40 hover:bg-muted/60 transition-colors"
        >
          {months.map((m) => {
            const isPast = m.month <= currentMonth;
            const val = isPast ? m.actualIncome || 0 : m.forecastIncome || 0;
            const forecast = m.forecastIncome || 0;
            const pct =
              isPast && forecast > 0
                ? Math.round(((m.actualIncome || 0) / forecast) * 100)
                : null;
            return (
              <Cell
                key={m.month}
                value={formatNumber(val)}
                isPast={isPast}
                isCurrent={m.month === currentMonth}
                badge={pct !== null ? <Badge pct={pct} /> : null}
              />
            );
          })}
        </Row>

        {incomeExpanded && (
          <>
            {/* Estimation */}
            <Row
              label={
                <div className="flex items-center gap-2 pl-6">
                  <Clock
                    size={14}
                    className="text-muted-foreground/40 shrink-0"
                  />
                  <span className="text-[13px] text-muted-foreground">
                    Estimation
                  </span>
                </div>
              }
              borderClass="border-b border-border/30"
            >
              {months.map((m) => {
                const isPast = m.month <= currentMonth;
                const forecast = m.forecastIncome || 0;
                const pct =
                  isPast && forecast > 0
                    ? Math.round(((m.actualIncome || 0) / forecast) * 100)
                    : null;
                return (
                  <Cell
                    key={m.month}
                    value={forecast > 0 ? formatNumber(forecast) : "–"}
                    isPast={false}
                    isCurrent={m.month === currentMonth}
                    muted
                    badge={pct !== null ? <EstBadge pct={pct} /> : null}
                  />
                );
              })}
            </Row>

            {activeIncomeCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Row
                  key={cat.key}
                  label={
                    <div className="flex items-center gap-2 pl-6">
                      <span
                        className={cn(
                          "flex items-center justify-center w-7 h-7 rounded-lg shrink-0",
                          cat.bg,
                        )}
                      >
                        <Icon size={14} className={cat.text} />
                      </span>
                      <ShadTooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[13px] text-foreground/80 truncate">
                            {cat.label}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">{cat.label}</TooltipContent>
                      </ShadTooltip>
                    </div>
                  }
                  borderClass={
                    idx < activeIncomeCategories.length - 1
                      ? "border-b border-border/20"
                      : ""
                  }
                >
                  {months.map((m) => {
                    const d = catLookup[m.month]?.[cat.key];
                    const isPast = m.month <= currentMonth;
                    const actual = d?.actual || 0;
                    const forecast = d?.forecast || 0;
                    const val = isPast ? actual : forecast;
                    const pct =
                      isPast && forecast > 0
                        ? Math.round((actual / forecast) * 100)
                        : null;
                    return (
                      <Cell
                        key={m.month}
                        value={formatNumber(val)}
                        isPast={isPast}
                        isCurrent={m.month === currentMonth}
                        badge={pct !== null ? <Badge pct={pct} /> : null}
                        onClick={
                          onCellClick
                            ? () => onCellClick(cat.key, "INCOME", m.month)
                            : undefined
                        }
                      />
                    );
                  })}
                </Row>
              );
            })}
          </>
        )}

        {/* ── Sorties ── */}
        <Row
          label={
            <div className="flex items-center gap-2">
              <ChevronDown
                size={14}
                className={cn(
                  "text-muted-foreground transition-transform",
                  !expenseExpanded && "-rotate-90",
                )}
              />
              <span className="text-[13px] font-semibold text-foreground">
                Sorties
              </span>
            </div>
          }
          onClick={() => setExpenseExpanded((v) => !v)}
          borderClass="border-y border-border cursor-pointer bg-muted/40 hover:bg-muted/60 transition-colors"
        >
          {months.map((m) => {
            const isPast = m.month <= currentMonth;
            const val = isPast ? m.actualExpense || 0 : m.forecastExpense || 0;
            const forecast = m.forecastExpense || 0;
            const pct =
              isPast && forecast > 0
                ? Math.round(((m.actualExpense || 0) / forecast) * 100)
                : null;
            return (
              <Cell
                key={m.month}
                value={formatNumber(val)}
                isPast={isPast}
                isCurrent={m.month === currentMonth}
                badge={pct !== null ? <Badge pct={pct} /> : null}
              />
            );
          })}
        </Row>

        {expenseExpanded && (
          <>
            <Row
              label={
                <div className="flex items-center gap-2 pl-6">
                  <Clock
                    size={14}
                    className="text-muted-foreground/40 shrink-0"
                  />
                  <span className="text-[13px] text-muted-foreground">
                    Estimation
                  </span>
                </div>
              }
              borderClass="border-b border-border/30"
            >
              {months.map((m) => {
                const isPast = m.month <= currentMonth;
                const forecast = m.forecastExpense || 0;
                const pct =
                  isPast && forecast > 0
                    ? Math.round(((m.actualExpense || 0) / forecast) * 100)
                    : null;
                return (
                  <Cell
                    key={m.month}
                    value={forecast > 0 ? formatNumber(forecast) : "–"}
                    isPast={false}
                    isCurrent={m.month === currentMonth}
                    muted
                    badge={pct !== null ? <EstBadge pct={pct} /> : null}
                  />
                );
              })}
            </Row>

            {activeExpenseCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Row
                  key={cat.key}
                  label={
                    <div className="flex items-center gap-2 pl-6">
                      <span
                        className={cn(
                          "flex items-center justify-center w-7 h-7 rounded-lg shrink-0",
                          cat.bg,
                        )}
                      >
                        <Icon size={14} className={cat.text} />
                      </span>
                      <ShadTooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[13px] text-foreground/80 truncate">
                            {cat.label}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">{cat.label}</TooltipContent>
                      </ShadTooltip>
                    </div>
                  }
                  borderClass={
                    idx < activeExpenseCategories.length - 1
                      ? "border-b border-border/20"
                      : ""
                  }
                >
                  {months.map((m) => {
                    const d = catLookup[m.month]?.[cat.key];
                    const isPast = m.month <= currentMonth;
                    const actual = d?.actual || 0;
                    const forecast = d?.forecast || 0;
                    const val = isPast ? actual : forecast;
                    const pct =
                      isPast && forecast > 0
                        ? Math.round((actual / forecast) * 100)
                        : null;
                    return (
                      <Cell
                        key={m.month}
                        value={formatNumber(val)}
                        isPast={isPast}
                        isCurrent={m.month === currentMonth}
                        badge={pct !== null ? <Badge pct={pct} /> : null}
                        onClick={
                          onCellClick
                            ? () => onCellClick(cat.key, "EXPENSE", m.month)
                            : undefined
                        }
                      />
                    );
                  })}
                </Row>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
