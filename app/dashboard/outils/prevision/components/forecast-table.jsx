"use client";

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Receipt,
  Banknote,
  Building2,
  Users,
  Megaphone,
  Landmark,
  BadgeDollarSign,
  Briefcase,
} from "lucide-react";

// ─── Category structure (Qonto-style grouped hierarchy) ───

const INCOME_GROUPS = [
  {
    id: "revenue",
    label: "Chiffre d'affaires",
    color: "#22c55e",
    icon: Banknote,
    items: [
      { category: "SALES", label: "Ventes", type: "INCOME", color: "#22c55e" },
    ],
  },
  {
    id: "other-income",
    label: "Autres entrées",
    color: "#4ade80",
    icon: BadgeDollarSign,
    items: [
      { category: "REFUNDS_RECEIVED", label: "Remboursements reçus", type: "INCOME", color: "#4ade80" },
      { category: "OTHER_INCOME", label: "Autres revenus", type: "INCOME", color: "#86efac" },
    ],
  },
];

const EXPENSE_GROUPS = [
  {
    id: "operations",
    label: "Dépenses opérationnelles",
    color: "#f87171",
    icon: Building2,
    items: [
      { category: "RENT", label: "Loyer", type: "EXPENSE", color: "#f87171" },
      { category: "OFFICE_SUPPLIES", label: "Fournitures", type: "EXPENSE", color: "#a78bfa" },
      { category: "TRANSPORT", label: "Transport", type: "EXPENSE", color: "#60a5fa" },
      { category: "INSURANCE", label: "Assurance", type: "EXPENSE", color: "#34d399" },
    ],
  },
  {
    id: "staff",
    label: "Frais de personnel",
    color: "#fb923c",
    icon: Users,
    items: [
      { category: "SALARIES", label: "Salaires", type: "EXPENSE", color: "#fb923c" },
    ],
  },
  {
    id: "services",
    label: "Services & logiciels",
    color: "#fbbf24",
    icon: Briefcase,
    items: [
      { category: "SUBSCRIPTIONS", label: "Abonnements", type: "EXPENSE", color: "#fbbf24" },
      { category: "SERVICES", label: "Sous-traitance", type: "EXPENSE", color: "#e2a20c" },
      { category: "SOFTWARE", label: "Logiciels", type: "EXPENSE", color: "#22d3ee" },
    ],
  },
  {
    id: "marketing",
    label: "Dépenses liées au marketing",
    color: "#f472b6",
    icon: Megaphone,
    items: [
      { category: "MARKETING", label: "Marketing", type: "EXPENSE", color: "#f472b6" },
    ],
  },
  {
    id: "taxes",
    label: "Taxes & autres",
    color: "#94a3b8",
    icon: Landmark,
    items: [
      { category: "TAXES", label: "Impôts & taxes", type: "EXPENSE", color: "#94a3b8" },
      { category: "OTHER_EXPENSE", label: "Autres dépenses", type: "EXPENSE", color: "#b0b8c4" },
    ],
  },
];

// ─── Helpers ───

const formatAmount = (value) => {
  if (!value || value === 0) return "-";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
};

const formatMonthHeader = (monthStr) => {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  const label = date
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "");
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}. ${year.slice(2)}`;
};

function AchievementBadge({ actual, forecast }) {
  if (!forecast || forecast === 0 || !actual) return null;
  const pct = Math.round((actual / forecast) * 100);
  return (
    <span className="ml-1 inline-flex items-center text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full tabular-nums font-medium">
      {pct}%
    </span>
  );
}

function EditableCell({ value, isPast, month, category, type, onCellEdit, forecast }) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(String(value || ""));

  const handleBlur = useCallback(() => {
    setEditing(false);
    const numVal = parseFloat(localValue) || 0;
    if (numVal !== (value || 0)) {
      onCellEdit(month, category, type, numVal);
    }
  }, [localValue, value, month, category, type, onCellEdit]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") e.target.blur();
      if (e.key === "Escape") {
        setLocalValue(String(value || ""));
        setEditing(false);
      }
    },
    [value]
  );

  if (isPast) {
    return (
      <div className="flex items-center justify-center gap-0.5">
        <span className="text-[13px] tabular-nums text-foreground">
          {formatAmount(value)}
        </span>
        {forecast > 0 && value > 0 && (
          <AchievementBadge actual={value} forecast={forecast} />
        )}
      </div>
    );
  }

  if (editing) {
    return (
      <input
        type="number"
        className="w-20 h-7 px-2 text-[13px] text-center border rounded-md bg-background tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        min="0"
        step="100"
      />
    );
  }

  return (
    <button
      className="group/cell inline-flex items-center justify-center gap-1 text-[13px] tabular-nums text-foreground/60 hover:text-foreground transition-colors rounded px-2 py-1"
      onClick={() => {
        setLocalValue(String(value || ""));
        setEditing(true);
      }}
    >
      <span>{formatAmount(value)}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover/cell:opacity-40 transition-opacity shrink-0" />
    </button>
  );
}

// ─── Sticky helpers ───

const stickyLeft = "sticky left-0 bg-background relative after:content-[''] after:absolute after:top-0 after:-right-3 after:bottom-0 after:w-3 after:pointer-events-none after:bg-gradient-to-r after:from-black/[0.06] after:to-transparent";

function findScrollParent(el) {
  let node = el?.parentElement;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}

// ─── Main component ───

export function ForecastTable({ months, loading, onCellEdit }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [incomeExpanded, setIncomeExpanded] = useState(true);
  const [expenseExpanded, setExpenseExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [showFooter, setShowFooter] = useState(false);

  const sentinelRef = useRef(null);
  const wrapperRef = useRef(null);

  const toggleGroup = useCallback((groupId) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  const isGroupExpanded = useCallback(
    (groupId) => expandedGroups[groupId] !== false, // default expanded
    [expandedGroups]
  );

  // Footer appears when the sentinel (top of table) scrolls out of view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const wrapper = wrapperRef.current;
    if (!sentinel || !wrapper) return;

    const scrollParent = findScrollParent(wrapper);
    const observer = new IntersectionObserver(
      ([entry]) => setShowFooter(!entry.isIntersecting),
      { root: scrollParent || null, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [months, incomeExpanded, expenseExpanded, expandedGroups]);

  const monthCategoryMap = useMemo(() => {
    const map = {};
    if (!months) return map;
    for (const m of months) {
      map[m.month] = {};
      for (const cb of m.categoryBreakdown || []) {
        map[m.month][`${cb.type}_${cb.category}`] = {
          actual: cb.actualAmount,
          forecast: cb.forecastAmount,
        };
      }
    }
    return map;
  }, [months]);

  if (loading) {
    return (
      <div className="w-full">
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!months?.length) return null;

  const getCellData = (month, type, category) => {
    const key = `${type}_${category}`;
    return monthCategoryMap[month]?.[key] || { actual: 0, forecast: 0 };
  };

  // Compute group subtotal for a given month
  const getGroupTotal = (group, month, isPast) => {
    return group.items.reduce((sum, item) => {
      const data = getCellData(month, item.type, item.category);
      return sum + (isPast ? (data.actual || 0) : (data.forecast || 0));
    }, 0);
  };

  const colCount = months.length + 1;

  // ─── Render a group (parent category + sub-items) ───
  const renderGroup = (group, sectionExpanded) => {
    if (!sectionExpanded) return null;
    const expanded = isGroupExpanded(group.id);
    const Icon = group.icon;

    return (
      <React.Fragment key={group.id}>
        {/* Parent category row */}
        <tr
          className="h-[44px] cursor-pointer select-none hover:bg-muted/20 transition-colors"
          onClick={() => toggleGroup(group.id)}
        >
          <td className={cn(stickyLeft, "z-30 px-5 pl-8")}>
            <div className="flex items-center gap-2.5">
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              )}
              <span
                className="flex items-center justify-center w-6 h-6 rounded-full shrink-0"
                style={{ backgroundColor: `${group.color}18` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: group.color }} />
              </span>
              <span className="text-[13px] font-normal text-foreground">
                {group.label}
              </span>
            </div>
          </td>
          {months.map((m) => {
            const isPast = m.month < currentMonth;
            const total = getGroupTotal(group, m.month, isPast);
            return (
              <td
                key={m.month}
                className={cn(
                  "text-center text-[13px] font-normal tabular-nums text-foreground whitespace-nowrap",
                  m.month === currentMonth && "bg-primary/[0.04]"
                )}
              >
                {formatAmount(total)}
              </td>
            );
          })}
        </tr>

        {/* Sub-items */}
        {expanded &&
          group.items.map((item) => (
            <tr
              key={item.category}
              className="h-[40px] hover:bg-muted/20 transition-colors"
            >
              <td className={cn(stickyLeft, "z-30 px-5 pl-16")}>
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[13px] text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              </td>
              {months.map((m) => {
                const isPast = m.month < currentMonth;
                const data = getCellData(m.month, item.type, item.category);
                return (
                  <td
                    key={m.month}
                    className={cn(
                      "text-center px-1",
                      m.month === currentMonth && "bg-primary/[0.04]"
                    )}
                  >
                    <EditableCell
                      value={isPast ? data.actual || 0 : data.forecast || 0}
                      isPast={isPast}
                      month={m.month}
                      category={item.category}
                      type={item.type}
                      onCellEdit={onCellEdit}
                      forecast={data.forecast}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
      </React.Fragment>
    );
  };

  return (
    <div ref={wrapperRef} className="w-full pb-6">
      <div ref={sentinelRef} className="h-px" />
      <table className="w-full border-collapse">

        {/* ═══ THEAD ═══ */}
        <thead className="sticky top-0 z-40">
          <tr className="h-11 bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <th
              className={cn(
                stickyLeft,
                "z-50 min-w-[280px] px-5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
              )}
            />
            {months.map((m) => (
              <th
                key={m.month}
                className={cn(
                  "min-w-[150px] px-4 text-center text-[11px] font-medium uppercase tracking-wider bg-background whitespace-nowrap",
                  m.month === currentMonth
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {formatMonthHeader(m.month)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* ═══ DÉBUT DU MOIS ═══ */}
          <tr className="h-[46px]">
            <td className={cn(stickyLeft, "z-30 px-5")}>
              <span className="text-[13px] font-semibold text-foreground">
                Début du mois
              </span>
            </td>
            {months.map((m) => (
              <td
                key={m.month}
                className={cn(
                  "text-center text-[13px] font-semibold tabular-nums whitespace-nowrap",
                  m.month === currentMonth && "bg-primary/[0.04]",
                  (m.openingBalance || 0) >= 0 ? "text-foreground" : "text-red-600"
                )}
              >
                {formatAmount(m.openingBalance)}
              </td>
            ))}
          </tr>

          <tr><td colSpan={colCount} className="h-2 bg-muted/40" /></tr>

          {/* ═══ ENTRÉES — section header ═══ */}
          <tr
            className="h-[48px] sticky top-11 z-[35] cursor-pointer select-none bg-background shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            onClick={() => setIncomeExpanded(!incomeExpanded)}
          >
            <td className={cn(stickyLeft, "z-[36] px-5")}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 rounded-full bg-emerald-500 shrink-0" />
                {incomeExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-[13px] font-semibold text-foreground">
                  Entrées
                </span>
              </div>
            </td>
            {months.map((m) => {
              const isPast = m.month < currentMonth;
              const total = isPast ? m.actualIncome || 0 : m.forecastIncome || 0;
              return (
                <td
                  key={m.month}
                  className={cn(
                    "text-center text-[13px] font-semibold tabular-nums text-emerald-700 bg-background whitespace-nowrap",
                    m.month === currentMonth && "!bg-primary/[0.04]"
                  )}
                >
                  {formatAmount(total)}
                </td>
              );
            })}
          </tr>

          {/* Income groups */}
          {INCOME_GROUPS.map((group) => renderGroup(group, incomeExpanded))}

          <tr><td colSpan={colCount} className="h-2 bg-muted/40" /></tr>

          {/* ═══ SORTIES — section header ═══ */}
          <tr
            className="h-[48px] sticky top-11 z-[35] cursor-pointer select-none bg-background shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            onClick={() => setExpenseExpanded(!expenseExpanded)}
          >
            <td className={cn(stickyLeft, "z-[36] px-5")}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 rounded-full bg-red-500 shrink-0" />
                {expenseExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-[13px] font-semibold text-foreground">
                  Sorties
                </span>
              </div>
            </td>
            {months.map((m) => {
              const isPast = m.month < currentMonth;
              const total = isPast ? m.actualExpense || 0 : m.forecastExpense || 0;
              return (
                <td
                  key={m.month}
                  className={cn(
                    "text-center text-[13px] font-semibold tabular-nums text-red-600 bg-background whitespace-nowrap",
                    m.month === currentMonth && "!bg-primary/[0.04]"
                  )}
                >
                  {formatAmount(total)}
                </td>
              );
            })}
          </tr>

          {/* Expense groups */}
          {EXPENSE_GROUPS.map((group) => renderGroup(group, expenseExpanded))}

          {/* Sentinel for footer observer */}
          <tr><td colSpan={colCount} className="h-px" /></tr>
        </tbody>

        {/* ═══ TFOOT ═══ */}
        <tfoot
          className={cn(
            "sticky bottom-0 z-40 transition-all duration-200",
            showFooter
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 pointer-events-none"
          )}
        >
          <tr className="h-[46px] bg-background shadow-[0_-1px_3px_rgba(0,0,0,0.08)]">
            <td className={cn(stickyLeft, "z-50 px-5")}>
              <span className="text-[13px] font-medium text-muted-foreground">
                Variation du mois
              </span>
            </td>
            {months.map((m) => {
              const isPast = m.month < currentMonth;
              const income = isPast ? m.actualIncome || 0 : m.forecastIncome || 0;
              const expense = isPast ? m.actualExpense || 0 : m.forecastExpense || 0;
              const variation = income - expense;
              return (
                <td
                  key={m.month}
                  className={cn(
                    "text-center text-[13px] font-medium tabular-nums bg-background whitespace-nowrap",
                    m.month === currentMonth && "!bg-primary/[0.04]",
                    variation >= 0 ? "text-emerald-700" : "text-red-600"
                  )}
                >
                  {variation > 0 && "+"}
                  {formatAmount(variation)}
                </td>
              );
            })}
          </tr>

          <tr className="h-[46px] bg-background">
            <td className={cn(stickyLeft, "z-50 px-5")}>
              <span className="text-[13px] font-semibold text-foreground">
                Fin du mois
              </span>
            </td>
            {months.map((m) => (
              <td
                key={m.month}
                className={cn(
                  "text-center text-[13px] font-semibold tabular-nums bg-background whitespace-nowrap",
                  m.month === currentMonth && "!bg-primary/[0.04]",
                  (m.closingBalance || 0) >= 0 ? "text-foreground" : "text-red-600"
                )}
              >
                {formatAmount(m.closingBalance)}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
