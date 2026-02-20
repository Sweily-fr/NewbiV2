"use client";

import { useMemo, useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/src/lib/utils";

// ─── Formatters ───

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "NA";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatCompact = (value) => {
  if (value === null || value === undefined || value === 0) return "-";
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
};

const formatMonthHeader = (monthStr) => {
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
  SALES: "Chiffre d'affaires",
  REFUNDS_RECEIVED: "Remboursements",
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

// ─── Cell renderer ───

function MonthCell({ m, actualKey, forecastKey, currentMonth }) {
  const actual = m[actualKey] || 0;
  const forecast = m[forecastKey] || 0;
  const isPast = m.month < currentMonth;
  const isCurrent = m.month === currentMonth;

  if (isPast) {
    const pct = forecast > 0 ? Math.round((actual / forecast) * 100) : null;
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="font-medium text-foreground">{formatCompact(actual)}</span>
        {pct !== null && (
          <span className={cn(
            "text-[11px] tabular-nums",
            pct >= 100 ? "text-emerald-600" : "text-muted-foreground"
          )}>
            {pct}%
          </span>
        )}
      </span>
    );
  }

  if (isCurrent) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="font-medium text-foreground">{formatCompact(actual)}</span>
        {forecast > 0 && (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0" />
            <span className="text-muted-foreground">{formatCompact(forecast)}</span>
          </>
        )}
      </span>
    );
  }

  // Future
  return (
    <span className="text-muted-foreground">{forecast > 0 ? formatCompact(forecast) : "-"}</span>
  );
}

function CategoryCell({ m, category, type, currentMonth }) {
  const breakdown = m.categoryBreakdown || [];
  const entry = breakdown.find((cb) => cb.category === category && cb.type === type);
  const actual = entry?.actualAmount || 0;
  const forecast = entry?.forecastAmount || 0;
  const isPast = m.month < currentMonth;
  const isCurrent = m.month === currentMonth;

  if (isPast) {
    const pct = forecast > 0 ? Math.round((actual / forecast) * 100) : null;
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-foreground">{formatCompact(actual)}</span>
        {pct !== null && (
          <span className="text-[11px] text-muted-foreground tabular-nums">{pct}%</span>
        )}
      </span>
    );
  }

  if (isCurrent) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-foreground">{formatCompact(actual)}</span>
        {forecast > 0 && (
          <>
            <span className="w-1 h-1 rounded-full bg-[#9CA3AF] shrink-0" />
            <span className="text-muted-foreground">{formatCompact(forecast)}</span>
          </>
        )}
      </span>
    );
  }

  return (
    <span className="text-muted-foreground">{forecast > 0 ? formatCompact(forecast) : "-"}</span>
  );
}

// ─── Component ───

export function ForecastKpiTable({ months, kpi, loading }) {
  const [expandedIncome, setExpandedIncome] = useState(false);
  const [expandedExpense, setExpandedExpense] = useState(false);

  const safeMonths = months || [];

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Flux net du mois courant
  const currentMonthNet = useMemo(() => {
    const m = safeMonths.find((m) => m.month === currentMonth);
    if (!m) return null;
    return (m.actualIncome || 0) - (m.actualExpense || 0);
  }, [safeMonths, currentMonth]);

  // Tendance solde projeté vs actuel
  const balanceTrend = useMemo(() => {
    const current = kpi?.currentBalance || 0;
    const projected = kpi?.projectedBalance3Months || 0;
    if (current === 0) return null;
    return ((projected - current) / Math.abs(current)) * 100;
  }, [kpi]);

  // Collect unique categories from all months
  const incomeCategories = useMemo(() => {
    const cats = new Set();
    safeMonths.forEach((m) => {
      (m.categoryBreakdown || []).forEach((cb) => {
        if (cb.type === "INCOME" && (cb.actualAmount > 0 || cb.forecastAmount > 0)) {
          cats.add(cb.category);
        }
      });
    });
    return Array.from(cats);
  }, [safeMonths]);

  const expenseCategories = useMemo(() => {
    const cats = new Set();
    safeMonths.forEach((m) => {
      (m.categoryBreakdown || []).forEach((cb) => {
        if (cb.type === "EXPENSE" && (cb.actualAmount > 0 || cb.forecastAmount > 0)) {
          cats.add(cb.category);
        }
      });
    });
    return Array.from(cats);
  }, [safeMonths]);

  if (loading) {
    return (
      <div className="pt-2">
        <Skeleton className="h-7 w-56 mb-8" />
        <div className="flex gap-8">
          <Skeleton className="h-64 w-72 shrink-0" />
          <Skeleton className="h-64 flex-1" />
        </div>
      </div>
    );
  }

  if (!safeMonths.length) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        Aucune donnée disponible pour cette période.
      </div>
    );
  }

  const cellBase = "py-3 px-3 text-right text-sm whitespace-nowrap tabular-nums";
  const headerCell = "py-2.5 px-3 text-right text-xs font-normal text-muted-foreground whitespace-nowrap";

  return (
    <div>
      {/* Two-column layout: hero KPIs left, monthly table right */}
      <div className="flex border-t border-b border-border pl-4 sm:pl-6">
        {/* ─ Left column: Hero KPIs ─ */}
        <div className="w-[240px] shrink-0 pr-6 pt-6 pb-8 border-r border-border flex flex-col">
          {/* Solde actuel */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground font-normal mb-1.5">Solde actuel</p>
            <p className="text-[28px] font-medium text-foreground leading-tight tracking-tight tabular-nums">
              {formatCurrency(kpi?.currentBalance)}
            </p>
          </div>

          {/* Solde projeté 3 mois */}
          <div className="mb-6 pb-6 border-b border-border">
            <p className="text-xs text-muted-foreground font-normal mb-1.5">Solde projeté (3 mois)</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-medium text-foreground tabular-nums">
                {formatCurrency(kpi?.projectedBalance3Months)}
              </p>
              {balanceTrend !== null && (
                <span className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full",
                  balanceTrend >= 0
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-red-700 bg-red-50"
                )}>
                  {balanceTrend >= 0
                    ? <TrendingUp className="h-3 w-3" />
                    : <TrendingDown className="h-3 w-3" />
                  }
                  {balanceTrend >= 0 ? "+" : ""}{balanceTrend.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Flux net du mois */}
          <div>
            <p className="text-xs text-muted-foreground font-normal mb-1.5">Flux net ce mois</p>
            <p className={cn(
              "text-xl font-medium tabular-nums",
              currentMonthNet !== null && currentMonthNet >= 0 ? "text-emerald-600" : "text-red-500"
            )}>
              {currentMonthNet !== null
                ? `${currentMonthNet >= 0 ? "+" : ""}${formatCurrency(currentMonthNet)}`
                : "NA"
              }
            </p>
          </div>
        </div>

        {/* ─ Right column: Monthly breakdown table ─ */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          <table className="w-full">
            {/* Month headers */}
            <thead>
              <tr>
                <th className="sticky left-0 bg-muted z-10 py-2.5 pl-4 pr-3 text-left text-xs font-normal text-muted-foreground whitespace-nowrap min-w-[140px]" />
                {safeMonths.map((m) => (
                  <th
                    key={m.month}
                    className={cn(
                      headerCell,
                      m.month === currentMonth && "bg-blue-500/10 font-medium text-blue-500"
                    )}
                  >
                    {formatMonthHeader(m.month)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* ── Début du mois ── */}
              <tr className="border-t border-border">
                <td className="sticky left-0 bg-background z-10 py-3 pl-4 pr-3 text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Début du mois
                </td>
                {safeMonths.map((m) => (
                  <td
                    key={m.month}
                    className={cn(cellBase, "font-medium text-foreground", m.month === currentMonth && "bg-blue-500/10")}
                  >
                    {formatCompact(m.openingBalance)}
                  </td>
                ))}
              </tr>

              {/* ── Entrées (expandable) ── */}
              <tr
                className="border-t border-border cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedIncome(!expandedIncome)}
              >
                <td className="sticky left-0 bg-background z-10 py-3 pl-4 pr-3 text-sm font-medium text-foreground whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5">
                    {expandedIncome
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    }
                    Entrées
                  </span>
                </td>
                {safeMonths.map((m) => (
                  <td
                    key={m.month}
                    className={cn(cellBase, "text-emerald-600", m.month === currentMonth && "bg-blue-500/10")}
                  >
                    <MonthCell
                      m={m}
                      actualKey="actualIncome"
                      forecastKey="forecastIncome"
                      currentMonth={currentMonth}
                    />
                  </td>
                ))}
              </tr>

              {/* Income category sub-rows */}
              {expandedIncome && incomeCategories.map((cat) => (
                <tr key={cat} className="border-t border-border">
                  <td className="sticky left-0 bg-background z-10 py-2.5 pl-10 pr-3 text-[13px] text-muted-foreground whitespace-nowrap">
                    {CATEGORY_LABELS[cat] || cat}
                  </td>
                  {safeMonths.map((m) => (
                    <td
                      key={m.month}
                      className={cn("py-2.5 px-3 text-right text-[13px] whitespace-nowrap tabular-nums", m.month === currentMonth && "bg-blue-500/10")}
                    >
                      <CategoryCell m={m} category={cat} type="INCOME" currentMonth={currentMonth} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* ── Sorties (expandable) ── */}
              <tr
                className="border-t border-border cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedExpense(!expandedExpense)}
              >
                <td className="sticky left-0 bg-background z-10 py-3 pl-4 pr-3 text-sm font-medium text-foreground whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5">
                    {expandedExpense
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    }
                    Sorties
                  </span>
                </td>
                {safeMonths.map((m) => (
                  <td
                    key={m.month}
                    className={cn(cellBase, "text-red-500", m.month === currentMonth && "bg-blue-500/10")}
                  >
                    <MonthCell
                      m={m}
                      actualKey="actualExpense"
                      forecastKey="forecastExpense"
                      currentMonth={currentMonth}
                    />
                  </td>
                ))}
              </tr>

              {/* Expense category sub-rows */}
              {expandedExpense && expenseCategories.map((cat) => (
                <tr key={cat} className="border-t border-border">
                  <td className="sticky left-0 bg-background z-10 py-2.5 pl-10 pr-3 text-[13px] text-muted-foreground whitespace-nowrap">
                    {CATEGORY_LABELS[cat] || cat}
                  </td>
                  {safeMonths.map((m) => (
                    <td
                      key={m.month}
                      className={cn("py-2.5 px-3 text-right text-[13px] whitespace-nowrap tabular-nums", m.month === currentMonth && "bg-blue-500/10")}
                    >
                      <CategoryCell m={m} category={cat} type="EXPENSE" currentMonth={currentMonth} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* ── Fin du mois ── */}
              <tr className="border-t border-border">
                <td className="sticky left-0 bg-background z-10 py-3 pl-4 pr-3 text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Fin du mois
                </td>
                {safeMonths.map((m) => (
                  <td
                    key={m.month}
                    className={cn(cellBase, "font-medium text-foreground", m.month === currentMonth && "bg-blue-500/10")}
                  >
                    {formatCompact(m.closingBalance)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
