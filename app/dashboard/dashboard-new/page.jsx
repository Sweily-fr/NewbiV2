"use client";

import { useState, useMemo, useRef } from "react";
import { useQuery } from "@apollo/client";
import { useInvoices } from "@/src/graphql/invoiceQueries";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { GET_TREASURY_CHART } from "@/src/graphql/queries/dashboardAggregation";
import BankBalanceCard from "@/src/components/banking/BankBalanceCard";
import { TreasuryChart } from "@/src/components/treasury-chart";
import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import {
  getIncomeChartConfig,
  getExpenseChartConfig,
} from "@/src/utils/chartDataProcessors";
import {
  MoreVertical,
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Calendar,
  Settings2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (amount) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value) => {
  if (!value) return "—";
  const num = Number(value);
  const d =
    !isNaN(num) && num > 0
      ? new Date(num < 1e12 ? num * 1000 : num)
      : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

function getInitials(name) {
  if (!name) return "??";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Couleurs d'avatar déterministes basées sur le nom
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
];

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Catégorisation des factures selon l'image
// Paid = COMPLETED, Relancée = PENDING + email envoyé, Unpaid = PENDING sans email + DRAFT
function categorizeInvoice(invoice) {
  if (invoice.status === "COMPLETED") return "paid";
  if (invoice.status === "PENDING" && invoice.emailTracking?.emailSentAt)
    return "resent";
  if (invoice.status === "PENDING" || invoice.status === "DRAFT")
    return "unpaid";
  return "other";
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "all", label: "Tout" },
  { key: "unpaid", label: "Impayées" },
  { key: "resent", label: "Relancées" },
  { key: "paid", label: "Payées" },
];

// ─── Mini Sparkline SVG ──────────────────────────────────────────────────────

function MiniBarChart({ data, color = "#22c55e", height = 40, width = 120 }) {
  if (!data || data.length === 0) return <div style={{ width, height }} />;
  const max = Math.max(...data, 1);
  const barWidth = Math.max(2, (width - data.length) / data.length);
  const gap = 1;

  return (
    <svg width={width} height={height} className="block">
      {data.map((val, i) => {
        const barH = (val / max) * height;
        return (
          <rect
            key={i}
            x={i * (barWidth + gap)}
            y={height - barH}
            width={barWidth}
            height={barH}
            fill={color}
            opacity={0.8}
          />
        );
      })}
    </svg>
  );
}

function MiniLineChart({ data, color = "#22c55e", height = 40, width = 120 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data
    .map((val, i) => {
      const x = i * step;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Dot on last point */}
      {data.length > 0 &&
        (() => {
          const lastX = (data.length - 1) * step;
          const lastY =
            height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
          return <circle cx={lastX} cy={lastY} r="2.5" fill={color} />;
        })()}
    </svg>
  );
}

function GradientBar({ value, max, height = 8, width = 120 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div
      style={{ width, height }}
      className="relative rounded-full overflow-hidden bg-muted"
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background:
            "linear-gradient(to right, #f97316, #eab308, #84cc16, #22c55e)",
        }}
      />
      <div
        className="absolute top-0 size-0 border-4 border-transparent"
        style={{
          left: `${pct}%`,
          borderTopColor: "#333",
          transform: "translateX(-50%)",
          top: "-2px",
        }}
      />
    </div>
  );
}

// ─── KPIs Widget ─────────────────────────────────────────────────────────────

function KpisWidget({ onConnectBank }) {
  const { workspaceId } = useRequiredWorkspace();
  const {
    bankBalance,
    bankAccounts,
    invoices,
    totalIncome,
    totalExpenses,
    isLoading,
  } = useDashboardData({ skipTransactions: true });

  const { caMonth, caMonthCount } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const completed = (invoices || []).filter((i) => {
      if (i.status !== "COMPLETED") return false;
      const d = i.issueDate
        ? new Date(
            Number(i.issueDate) < 1e12
              ? Number(i.issueDate) * 1000
              : Number(i.issueDate),
          )
        : null;
      if (!d || isNaN(d.getTime())) return false;
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    return {
      caMonth: completed.reduce((s, i) => s + (i.finalTotalTTC || 0), 0),
      caMonthCount: completed.length,
    };
  }, [invoices]);

  const { data: chartData, loading: chartLoading } = useQuery(
    GET_TREASURY_CHART,
    {
      variables: {
        workspaceId,
        period: { preset: "90d" },
      },
      fetchPolicy: "cache-and-network",
      skip: !workspaceId,
    },
  );

  const dataPoints = chartData?.dashboardTreasuryChart?.dataPoints || [];

  // Mini chart data
  const treasuryValues = useMemo(
    () => dataPoints.map((d) => d.treasury || 0),
    [dataPoints],
  );
  const incomeValues = useMemo(
    () => dataPoints.map((d) => d.income || 0),
    [dataPoints],
  );
  const expenseValues = useMemo(
    () => dataPoints.map((d) => d.expenses || 0),
    [dataPoints],
  );

  // Trend calculation (compare last 30 vs previous 30)
  const expenseTrend = useMemo(() => {
    if (expenseValues.length < 10) return null;
    const mid = Math.floor(expenseValues.length / 2);
    const first = expenseValues.slice(0, mid).reduce((a, b) => a + b, 0);
    const second = expenseValues.slice(mid).reduce((a, b) => a + b, 0);
    if (first === 0) return null;
    return (((second - first) / first) * 100).toFixed(1);
  }, [expenseValues]);

  const loading = isLoading || chartLoading;

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const maxIncome = Math.max(totalIncome, totalExpenses, 1);

  return (
    <div>
      <div className="flex items-center justify-between pb-5">
        <h2 className="text-xl font-medium">Vue d&apos;ensemble</h2>
        <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent">
          <MoreVertical className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-[1.3fr_1fr] divide-x">
        {/* Solde bancaire */}
        <div className="pl-3 pr-4 pt-1.5 pb-3 flex flex-col min-h-[140px]">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Solde bancaire
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-3xl font-semibold">
                {formatCurrency(bankBalance || 0)}
              </p>
              {/* Avatars banques superposés */}
              <div className="flex -space-x-2">
                {(bankAccounts || []).slice(0, 4).map((account) => {
                  const logo = account.institutionLogo;
                  const name =
                    account.institutionName ||
                    account.bankName ||
                    account.name ||
                    "Banque";
                  return (
                    <Avatar
                      key={account.id}
                      className="size-6 ring-2 ring-background bg-muted"
                    >
                      {logo ? (
                        <AvatarImage
                          src={logo}
                          alt={name}
                          className="object-contain p-0.5"
                        />
                      ) : null}
                      <AvatarFallback className="text-[10px] bg-muted">
                        {name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
                {(bankAccounts || []).length > 4 && (
                  <div
                    className="size-6 ring-2 ring-background rounded-full flex items-center justify-center text-[9px] font-medium text-white"
                    style={{ backgroundColor: "#212121" }}
                  >
                    +{(bankAccounts || []).length - 4}
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="default"
            size="sm"
            className="w-full mt-auto gap-2 text-xs font-medium"
            onClick={onConnectBank}
          >
            <Landmark className="size-3.5" />
            Connecter un compte
          </Button>
        </div>

        {/* CA du mois */}
        <div className="pl-3 pr-4 pt-1.5 pb-3 flex flex-col justify-between min-h-[140px]">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              CA du mois
            </p>
            <p className="text-3xl font-semibold mt-1">
              {formatCurrency(caMonth)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {caMonthCount} facture{caMonthCount > 1 ? "s" : ""} encaissée
            {caMonthCount > 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice Table Widget ────────────────────────────────────────────────────

function InvoicesWidget() {
  const { invoices, loading } = useInvoices();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Categorize all invoices
  const categorized = useMemo(() => {
    const all = invoices || [];
    const paid = [];
    const resent = [];
    const unpaid = [];

    all.forEach((inv) => {
      const cat = categorizeInvoice(inv);
      if (cat === "paid") paid.push(inv);
      else if (cat === "resent") resent.push(inv);
      else if (cat === "unpaid") unpaid.push(inv);
    });

    return { all, paid, resent, unpaid };
  }, [invoices]);

  // Stats
  const stats = useMemo(() => {
    const paidTotal = categorized.paid.reduce(
      (s, i) => s + (i.finalTotalTTC || 0),
      0,
    );
    const resentTotal = categorized.resent.reduce(
      (s, i) => s + (i.finalTotalTTC || 0),
      0,
    );
    const unpaidTotal = categorized.unpaid.reduce(
      (s, i) => s + (i.finalTotalTTC || 0),
      0,
    );
    const grandTotal = paidTotal + resentTotal + unpaidTotal;

    return {
      paid: {
        amount: paidTotal,
        pct: grandTotal > 0 ? ((paidTotal / grandTotal) * 100).toFixed(1) : 0,
      },
      resent: {
        amount: resentTotal,
        pct: grandTotal > 0 ? ((resentTotal / grandTotal) * 100).toFixed(1) : 0,
      },
      unpaid: {
        amount: unpaidTotal,
        pct: grandTotal > 0 ? ((unpaidTotal / grandTotal) * 100).toFixed(1) : 0,
      },
    };
  }, [categorized]);

  // Filter by active tab + search
  const filtered = useMemo(() => {
    let list =
      activeTab === "all" ? categorized.all : categorized[activeTab] || [];
    // Exclude CANCELED from "all"
    if (activeTab === "all") {
      list = list.filter((inv) => inv.status !== "CANCELED");
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (inv) =>
          inv.client?.name?.toLowerCase().includes(q) ||
          inv.client?.email?.toLowerCase().includes(q) ||
          inv.number?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeTab, categorized, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageInvoices = filtered.slice(page * pageSize, (page + 1) * pageSize);

  // Reset page when tab/search changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(0);
  };
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 h-full">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-full" />
        <div className="flex-1 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-5">
        <h2 className="text-xl font-medium">Factures</h2>
        <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent">
          <MoreVertical className="size-4" />
        </button>
      </div>

      {/* Stats bar */}
      <div className="pb-8">
        <div>
          <div className="grid grid-cols-3 divide-x">
            <div className="pl-3 pr-4 pt-1.5 pb-2 flex flex-col justify-between min-h-[140px]">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Payées
                </p>
                <p className="text-lg font-semibold mt-1">
                  {formatCurrency(stats.paid.amount)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{stats.paid.pct}%</p>
            </div>
            <div className="pl-3 pr-4 pt-1.5 pb-2 flex flex-col justify-between min-h-[140px]">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Relancées
                </p>
                <p className="text-lg font-semibold mt-1">
                  {formatCurrency(stats.resent.amount)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.resent.pct}%
              </p>
            </div>
            <div className="pl-3 pr-4 pt-1.5 pb-2 flex flex-col justify-between min-h-[140px]">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Impayées
                </p>
                <p className="text-lg font-semibold mt-1">
                  {formatCurrency(stats.unpaid.amount)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.unpaid.pct}%
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-0.5 h-1.5">
            <div className="bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${stats.paid.pct}%` }}
              />
            </div>
            <div className="bg-muted overflow-hidden">
              <div
                className="h-full bg-amber-400"
                style={{ width: `${stats.resent.pct}%` }}
              />
            </div>
            <div className="bg-muted overflow-hidden">
              <div
                className="h-full bg-red-400"
                style={{ width: `${stats.unpaid.pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between pb-3 gap-3">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                activeTab === tab.key
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={handleSearchChange}
            className="pl-8 h-8 w-40 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table
          className="w-full font-medium"
          style={{ color: "#525254", fontSize: "13px" }}
        >
          <thead>
            <tr className="border-b" style={{ color: "#333333" }}>
              <th className="py-2 pr-2 text-left w-8">
                <Checkbox className="size-4" />
              </th>
              <th className="py-2 pr-3 text-left font-medium">Client</th>
              <th className="py-2 pr-3 text-left font-medium">Date</th>
              <th className="py-2 pr-3 text-left font-medium">Contact</th>
              <th className="py-2 text-right font-medium">Montant</th>
              <th className="py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {pageInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center">
                  Aucune facture trouvée
                </td>
              </tr>
            ) : (
              pageInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b last:border-0 hover:bg-accent/50 transition-colors"
                >
                  <td className="py-2 pr-2">
                    <Checkbox className="size-4" />
                  </td>
                  <td className="py-2 pr-3">
                    <span className="truncate max-w-[160px] block">
                      {inv.client?.name || "—"}
                    </span>
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {formatDate(inv.issueDate)}
                  </td>
                  <td className="py-2 pr-3 truncate max-w-[180px]">
                    {inv.client?.email || "—"}
                  </td>
                  <td className="py-2 text-right whitespace-nowrap">
                    {formatCurrency(inv.finalTotalTTC || 0)}
                  </td>
                  <td className="py-2 pl-2">
                    <button className="hover:text-foreground p-1 rounded-md hover:bg-accent">
                      <MoreVertical className="size-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-3 border-t text-sm text-muted-foreground">
        <span>
          {filtered.length} facture{filtered.length > 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Income / Expense Charts ─────────────────────────────────────────────────

function IncomeExpenseCharts({ workspaceId }) {
  const { data: flowChartData, loading } = useQuery(GET_TREASURY_CHART, {
    variables: {
      workspaceId,
      period: { preset: "365d" },
    },
    fetchPolicy: "cache-and-network",
    skip: !workspaceId,
  });

  const incomeChartData = useMemo(() => {
    const points = flowChartData?.dashboardTreasuryChart?.dataPoints || [];
    return points.map((d) => ({ date: d.date, desktop: d.income, mobile: 0 }));
  }, [flowChartData]);

  const expenseChartData = useMemo(() => {
    const points = flowChartData?.dashboardTreasuryChart?.dataPoints || [];
    return points.map((d) => ({
      date: d.date,
      desktop: d.expenses,
      mobile: 0,
    }));
  }, [flowChartData]);

  const incomeChartConfig = getIncomeChartConfig();
  const expenseChartConfig = getExpenseChartConfig();

  const formatCurrencyShort = (amount) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1px_1fr] gap-4 md:gap-5">
      {/* Entrées */}
      <ChartAreaInteractive
        title="Entrées"
        computeDescription={(filtered) =>
          formatCurrencyShort(
            filtered.reduce((sum, d) => sum + (d.desktop || 0), 0),
          )
        }
        height="200px"
        className="w-full h-full !border-0 !shadow-none !rounded-none"
        config={incomeChartConfig}
        data={incomeChartData}
        hideMobileCurve={true}
        isLoading={loading}
      />

      {/* Séparateur vertical */}
      <div className="hidden sm:block bg-border/60" />

      {/* Sorties */}
      <ChartAreaInteractive
        title="Sorties"
        computeDescription={(filtered) =>
          formatCurrencyShort(
            filtered.reduce((sum, d) => sum + (d.desktop || 0), 0),
          )
        }
        height="200px"
        className="w-full h-full !border-0 !shadow-none !rounded-none"
        config={expenseChartConfig}
        data={expenseChartData}
        hideMobileCurve={true}
        isLoading={loading}
      />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardNew() {
  const bankBalanceRef = useRef(null);
  const { workspaceId } = useRequiredWorkspace();

  return (
    <div className="flex flex-col">
      {/* BankBalanceCard caché — sert uniquement pour le dialog de connexion */}
      <div className="hidden">
        <BankBalanceCard ref={bankBalanceRef} />
      </div>

      {/* ─── Bandeau supérieur ─────────────────────────────────── */}
      <div
        className="flex items-center justify-between w-full bg-muted/50 px-4 md:px-6 py-2"
        style={{ color: "#787878" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px]">
            <Calendar className="size-2.5" />
            <span className="font-medium">Ce mois-ci</span>
          </div>
          <span className="text-[11px]">
            Dernière mise à jour : il y a quelques instants
          </span>
        </div>
        <button className="flex items-center gap-1 text-[11px] hover:text-foreground transition-colors">
          <Settings2 className="size-2.5" />
          <span className="font-medium">Gérer le layout</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr] gap-4 md:gap-5 p-4 md:p-6">
        {/* ━━━ Colonne gauche ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex flex-col gap-4 md:gap-5">
          {/* Container 1 — KPIs */}
          <KpisWidget
            onConnectBank={() => bankBalanceRef.current?.openConnectModal()}
          />

          <hr className="border-border/60" />

          {/* Container 2 — Trésorerie */}
          <TreasuryChart
            workspaceId={workspaceId}
            className="w-full !border-0 !shadow-none !rounded-none !p-0 [&>*]:!px-2"
          />

          <hr className="border-border/60" />

          {/* Container 3 + Container 4 — Entrées / Sorties */}
          <IncomeExpenseCharts workspaceId={workspaceId} />
        </div>

        {/* Séparateur vertical */}
        <div className="hidden lg:block bg-border/60" />

        {/* ━━━ Colonne droite ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <InvoicesWidget />
      </div>
    </div>
  );
}
