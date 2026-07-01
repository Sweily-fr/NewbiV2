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
import { ManualEntriesList } from "./components/manual-entries-list";
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
  Plus,
} from "lucide-react";
import { ManualEntryDialog } from "./components/manual-entry-dialog";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
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
  { value: "custom", label: "Période personnalisée" },
];

const currentMonthStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// Nombre de mois inclus entre deux clés "YYYY-MM" (>= 1).
const monthSpan = (startStr, endStr) => {
  const [sy, sm] = startStr.split("-").map(Number);
  const [ey, em] = endStr.split("-").map(Number);
  return (ey - sy) * 12 + (em - sm) + 1;
};

// Ajoute n mois (n peut être négatif) à une clé "YYYY-MM".
const addMonths = (monthStr, n) => {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// Plage personnalisée : les bornes sont des dates "YYYY-MM-DD", mais le
// prévisionnel raisonne par mois — on dérive donc le mois (YYYY-MM) de chaque
// borne, puis on plafonne par l'horizon autorisé du plan (maxMonths).
const getCustomRange = (customStart, customEnd, maxMonths) => {
  let startStr = (customStart || "").slice(0, 7) || currentMonthStr();
  let endStr = (customEnd || "").slice(0, 7) || startStr;
  if (endStr < startStr) endStr = startStr;
  if (maxMonths > 0 && monthSpan(startStr, endStr) > maxMonths) {
    endStr = addMonths(startStr, maxMonths - 1);
  }
  return { startDate: startStr, endDate: endStr };
};

const getDateRange = (periodMonths) => {
  const now = new Date();

  // Démarre au mois en cours et couvre periodMonths mois inclus (mois en cours + N-1 suivants)
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const startStr = `${start.getFullYear()}-${String(
    start.getMonth() + 1,
  ).padStart(2, "0")}`;

  const end = new Date(
    now.getFullYear(),
    now.getMonth() + (periodMonths - 1),
    1,
  );
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(
    2,
    "0",
  )}`;

  return { startDate: startStr, endDate: endStr };
};

const parseYMD = (s) => (s ? new Date(s + "T00:00:00") : undefined);
const toYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

// Sélecteur de PLAGE (début + fin) en un seul calendrier (mode "range"),
// cohérent avec les autres filtres calendrier de la plateforme. Bornes
// "YYYY-MM-DD" ; la fin ≥ le début est garantie par le mode range.
function DateRangeFilterButton({ start, end, onChange }) {
  const [open, setOpen] = useState(false);
  const startD = parseYMD(start);
  const endD = parseYMD(end);
  const fmt = (d) =>
    d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const label =
    startD && endD
      ? `du ${fmt(startD)} au ${fmt(endD)}`
      : startD
        ? `à partir du ${fmt(startD)}`
        : "Choisir une période";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-foreground font-medium hover:bg-muted/50 transition-colors cursor-pointer"
        >
          {label}
          <ChevronDown size={12} className="opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          captionLayout="dropdown"
          startMonth={new Date(2015, 0)}
          endMonth={new Date(new Date().getFullYear() + 10, 11)}
          defaultMonth={startD}
          numberOfMonths={2}
          selected={{ from: startD, to: endD }}
          onSelect={(range) =>
            onChange(
              range?.from ? toYMD(range.from) : "",
              range?.to ? toYMD(range.to) : "",
            )
          }
        />
      </PopoverContent>
    </Popover>
  );
}

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
  const [customStart, setCustomStart] = useState(`${currentMonthStr()}-01`);
  const [customEnd, setCustomEnd] = useState(
    `${addMonths(
      currentMonthStr(),
      Math.max(0, parseInt(defaultPeriod) - 1) || 5,
    )}-01`,
  );
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
    () =>
      period === "custom"
        ? getCustomRange(customStart, customEnd, maxPeriod)
        : getDateRange(parseInt(period)),
    [period, customStart, customEnd, maxPeriod],
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
              onClick={() => {
                setManualEntryDefaults(null);
                setManualEntryOpen(true);
              }}
              className="cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Ajouter une prévision
            </Button>
            <Button
              variant="outline"
              onClick={() => setExportOpen(true)}
              className="cursor-pointer"
            >
              <ExportIcon className="w-3.5 h-3.5" aria-hidden="true" />
              Exporter
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

          {/* Bornes de la période personnalisée */}
          {period === "custom" && (
            <div className="flex items-center gap-1 ml-1">
              <DateRangeFilterButton
                start={customStart}
                end={customEnd}
                onChange={(s, e) => {
                  setCustomStart(s);
                  setCustomEnd(e);
                }}
              />
              {maxPeriod > 0 &&
                monthSpan(customStart.slice(0, 7), customEnd.slice(0, 7)) >
                  maxPeriod && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Lock
                        size={12}
                        className="text-muted-foreground ml-0.5"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      Horizon limité à {maxPeriod} mois sur votre plan — la fin
                      est ramenée en conséquence.
                    </TooltipContent>
                  </Tooltip>
                )}
            </div>
          )}
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

      {/* ─── Manual entries (edit / delete) ─── */}
      <div className="px-4 sm:px-6 pb-6">
        <ManualEntriesList />
      </div>

      {/* ─── Auto-detected recurrences ─── */}
      {/* T9 — chaque récurrence détectée peut être convertie en prévision récurrente */}
      <div className="px-4 sm:px-6 pb-6">
        <DetectedRecurrencesList
          onCreateForecast={(seed) => {
            setManualEntryDefaults({
              type: seed.type,
              name: seed.name,
              amount: seed.amount,
              frequency: seed.frequency,
              category: seed.category,
              hasFrequency: true,
            });
            setManualEntryOpen(true);
          }}
        />
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
        rangeStart={startDate}
        rangeEnd={endDate}
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
