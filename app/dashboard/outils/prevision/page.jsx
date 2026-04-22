"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_BANKING_ACCOUNTS } from "@/src/graphql/queries/banking";
import { useTreasuryForecastData } from "@/src/hooks/useTreasuryForecast";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { ForecastKpiTable } from "./components/forecast-kpi-table";
import { ForecastPaymentsCard } from "./components/forecast-payments-card";
import { ForecastExportDialog } from "./components/forecast-export-dialog";
import { ExportIcon } from "@/src/components/icons";
import { DetectedRecurrencesList } from "./components/detected-recurrences-list";
import { ScenarioSelector } from "./components/scenario-selector";
import { Button } from "@/src/components/ui/button";
import {
  Landmark,
  Layers,
  ChevronDown,
  Check,
  Lock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { ManualEntryDialog } from "./components/manual-entry-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { getPlanLimits } from "@/src/lib/plan-limits";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";

const PERIOD_OPTIONS = [
  { value: "6", label: "6 mois" },
  { value: "12", label: "12 mois" },
  { value: "24", label: "24 mois" },
];

const getDateRange = (periodMonths) => {
  const now = new Date();
  const half = Math.floor(periodMonths / 2);

  const start = new Date(now);
  start.setMonth(start.getMonth() - half);
  const startStr = `${start.getFullYear()}-${String(
    start.getMonth() + 1,
  ).padStart(2, "0")}`;

  const end = new Date(now);
  end.setMonth(end.getMonth() + (periodMonths - half));
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(
    2,
    "0",
  )}`;

  return { startDate: startStr, endDate: endStr };
};

export default function PrevisionPage() {
  const { workspaceId } = useRequiredWorkspace();
  const { subscription } = useSubscription();
  const planLimits = getPlanLimits(subscription?.plan);
  const forecastMonths = planLimits.forecastMonths;

  // Determine the max allowed period and default period based on plan
  const maxPeriod = forecastMonths;
  const defaultPeriod =
    forecastMonths >= 12
      ? "12"
      : forecastMonths > 0
        ? String(forecastMonths)
        : "6";

  const [period, setPeriod] = useState(defaultPeriod);
  const [accountFilter, setAccountFilter] = useState("all");
  const [exportOpen, setExportOpen] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualEntryDefaults, setManualEntryDefaults] = useState(null);
  const [activeScenarioId, setActiveScenarioId] = useState(null);

  const handleCellClick = (category, type, month) => {
    setManualEntryDefaults({ category, type, month });
    setManualEntryOpen(true);
  };

  const { startDate, endDate } = useMemo(
    () => getDateRange(parseInt(period)),
    [period],
  );

  const { data: bankData } = useQuery(GET_BANKING_ACCOUNTS, {
    variables: { workspaceId },
    skip: !workspaceId || forecastMonths === 0,
  });
  const bankAccounts = useMemo(() => {
    const accounts = bankData?.bankingAccounts || [];
    const seen = new Set();
    return accounts.filter((acc) => {
      const key = acc.iban || acc.externalId || acc.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [bankData]);

  const selectedAccountLabel = useMemo(() => {
    if (accountFilter === "all") return "Tous les comptes";
    const acc = bankAccounts.find((a) => a.id === accountFilter);
    if (!acc) return "Tous les comptes";
    const name = acc.name || acc.bankName || "Compte";
    const lastIban = acc.iban ? ` ···${acc.iban.slice(-4)}` : "";
    return `${name}${lastIban}`;
  }, [accountFilter, bankAccounts]);

  const { forecastData, loading } = useTreasuryForecastData(
    startDate,
    endDate,
    accountFilter !== "all" ? accountFilter : undefined,
    activeScenarioId,
  );

  // If plan has no forecast access, show upgrade message
  if (forecastMonths === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
          <Lock size={28} className="text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Prévisions de trésorerie</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Les prévisions de trésorerie vous permettent d&apos;anticiper vos flux
          financiers et de planifier votre activité sereinement. Cette
          fonctionnalité est disponible à partir du plan PME.
        </p>
        <Button asChild>
          <a href="/dashboard/parametres?tab=subscription">
            <TrendingUp size={14} className="mr-2" />
            Passer au plan PME
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* ─── Header: Title + actions ─── */}
      <div className="pt-4 sm:pt-6 mb-6 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-medium">Prévision</h1>
          <div className="flex items-center gap-3">
            <ScenarioSelector
              activeScenarioId={activeScenarioId}
              onScenarioChange={setActiveScenarioId}
            />
            <Button
              variant="primary"
              onClick={() => setExportOpen(true)}
              className="cursor-pointer"
            >
              <ExportIcon className="w-3.5 h-3.5" aria-hidden="true" />
              Exporter la prévision
            </Button>
          </div>
        </div>

        {/* ─── Inline filters (Qonto-style) ─── */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>De</span>

          {/* Account filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-foreground font-medium hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <Layers size={13} className="text-muted-foreground" />
                {selectedAccountLabel}
                <ChevronDown size={12} className="opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Sélectionner un compte
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setAccountFilter("all")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Landmark size={14} className="text-muted-foreground" />
                <span className="flex-1 text-xs truncate">
                  Tous les comptes
                </span>
                <Check
                  className={cn(
                    "h-4 w-4 text-[#5b4fff]",
                    accountFilter === "all" ? "opacity-100" : "opacity-0",
                  )}
                />
              </DropdownMenuItem>
              {(bankAccounts || []).map((acc) => {
                const accountName = acc.name || acc.bankName || "Compte";
                const lastIban = acc.iban ? ` ···${acc.iban.slice(-4)}` : "";
                const isSelected = accountFilter === acc.id;
                return (
                  <DropdownMenuItem
                    key={acc.id}
                    onClick={() => setAccountFilter(acc.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {acc.institutionLogo ? (
                        <img
                          src={acc.institutionLogo}
                          alt=""
                          className="h-5 w-5 rounded-sm object-contain flex-shrink-0"
                        />
                      ) : (
                        <Landmark className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="truncate text-xs">
                        {accountName}
                        {lastIban}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 text-[#5b4fff]",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <span>sur</span>

          {/* Period filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-foreground font-medium hover:bg-muted/50 transition-colors cursor-pointer"
              >
                {PERIOD_OPTIONS.find((o) => o.value === period)?.label ||
                  "12 mois"}
                <ChevronDown size={12} className="opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Horizon de prévision
              </DropdownMenuLabel>
              {PERIOD_OPTIONS.map((opt) => {
                const isDisabled = parseInt(opt.value) > maxPeriod;
                if (isDisabled) {
                  return (
                    <Tooltip key={opt.value}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground/50 cursor-not-allowed">
                          <span className="flex-1 text-xs">{opt.label}</span>
                          <Lock size={12} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        Passez au plan Entreprise pour les prévisions à{" "}
                        {opt.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setPeriod(opt.value)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="flex-1 text-xs">{opt.label}</span>
                    <Check
                      className={cn(
                        "h-4 w-4 text-[#5b4fff]",
                        period === opt.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-3 gap-4 px-4 sm:px-6 pb-6">
        <KpiCard
          label="Solde actuel"
          value={forecastData?.kpi?.currentBalance}
          loading={loading}
        />
        <KpiCard
          label="Trésorerie fin de période"
          value={
            forecastData?.months?.length > 0
              ? forecastData.months[forecastData.months.length - 1]
                  .closingBalance
              : undefined
          }
          sublabel={
            forecastData?.months?.length > 0
              ? `au ${(() => {
                  const m =
                    forecastData.months[forecastData.months.length - 1].month;
                  const [y, mo] = m.split("-");
                  return new Date(
                    parseInt(y),
                    parseInt(mo) - 1,
                  ).toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  });
                })()}`
              : undefined
          }
          warnNegative
          loading={loading}
        />
        <KpiCard
          label="Consommation de trésorerie moyenne"
          value={(() => {
            if (!forecastData?.months) return undefined;
            const now = new Date();
            const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
            const past = forecastData.months.filter(
              (m) =>
                m.month <= cm &&
                ((m.actualIncome || 0) > 0 || (m.actualExpense || 0) > 0),
            );
            const last3 = past.slice(-3);
            if (last3.length === 0) return 0;
            return Math.round(
              last3.reduce(
                (s, m) => s + (m.actualIncome || 0) - (m.actualExpense || 0),
                0,
              ) / last3.length,
            );
          })()}
          suffix="par mois"
          loading={loading}
        />
      </div>

      {/* ─── Chart + Table ─── */}
      <div className="bg-background px-4 sm:px-6 pb-6 flex-1">
        <ForecastPaymentsCard
          months={forecastData?.months}
          kpi={forecastData?.kpi}
          loading={loading}
          onCellClick={handleCellClick}
        />
      </div>

      {/* ─── Auto-detected recurrences ─── */}
      <div className="px-4 sm:px-6 pb-6">
        <DetectedRecurrencesList />
      </div>

      {/* TODO: réactiver la section KPIs Table
      <div className="pt-4 sm:pt-6">
        <ForecastKpiTable
          months={forecastData?.months}
          kpi={forecastData?.kpi}
          loading={loading}
        />
      </div>
      */}

      {/* ─── Dialogs ─── */}
      <ForecastExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        months={forecastData?.months}
      />
      <ManualEntryDialog
        open={manualEntryOpen}
        onOpenChange={(open) => {
          setManualEntryOpen(open);
          if (!open) setManualEntryDefaults(null);
        }}
        entry={null}
        defaults={manualEntryDefaults}
      />
    </div>
  );
}

// ─── KPI Card ───

const formatKpiCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

function KpiCard({
  label,
  value,
  sublabel,
  suffix,
  warnNegative,
  loading: isLoading,
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-background px-5 py-4">
        <div className="h-4 w-32 bg-muted rounded mb-3 animate-pulse" />
        <div className="h-9 w-40 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const isNegative = warnNegative && (value || 0) < 0;

  return (
    <div className="rounded-xl border border-border bg-background px-5 py-4">
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p
          className={cn(
            "text-2xl font-medium tracking-tight",
            isNegative ? "text-red-600" : "text-foreground",
          )}
        >
          {formatKpiCurrency(value)}
        </p>
        {isNegative && (
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
        )}
        {suffix && (
          <span className="text-sm text-muted-foreground">{suffix}</span>
        )}
      </div>
      {sublabel && (
        <p className="text-sm text-muted-foreground mt-1">{sublabel}</p>
      )}
    </div>
  );
}
