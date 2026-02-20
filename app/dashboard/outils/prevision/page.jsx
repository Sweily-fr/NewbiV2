"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_BANKING_ACCOUNTS } from "@/src/graphql/queries/banking";
import { useTreasuryForecastData } from "@/src/hooks/useTreasuryForecast";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { ForecastKpiTable } from "./components/forecast-kpi-table";
import { ForecastPaymentsCard } from "./components/forecast-payments-card";
import { ForecastExportDialog } from "./components/forecast-export-dialog";
import { Button } from "@/src/components/ui/button";
import { Download, Landmark, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";

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
    start.getMonth() + 1
  ).padStart(2, "0")}`;

  const end = new Date(now);
  end.setMonth(end.getMonth() + (periodMonths - half));
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(
    2,
    "0"
  )}`;

  return { startDate: startStr, endDate: endStr };
};

export default function PrevisionPage() {
  const { workspaceId } = useRequiredWorkspace();

  const [period, setPeriod] = useState("12");
  const [accountFilter, setAccountFilter] = useState("all");
  const [exportOpen, setExportOpen] = useState(false);

  const { startDate, endDate } = useMemo(
    () => getDateRange(parseInt(period)),
    [period]
  );

  const { data: bankData } = useQuery(GET_BANKING_ACCOUNTS, {
    variables: { workspaceId },
    skip: !workspaceId,
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
    accountFilter !== "all" ? accountFilter : undefined
  );

  return (
    <div className="flex flex-col min-h-full">
      {/* ─── Header: Title + actions ─── */}
      <div className="flex items-center justify-between pt-4 sm:pt-6 mb-8 px-4 sm:px-6">
        <h1 className="text-2xl font-medium">Prévision</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setExportOpen(true)}
          >
            <Download size={14} strokeWidth={1.5} aria-hidden="true" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                <Landmark size={14} aria-hidden="true" />
                {selectedAccountLabel}
                <ChevronDown size={12} className="ml-0.5 opacity-70" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Sélectionner un compte
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setAccountFilter("all")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Landmark size={14} className="text-muted-foreground" />
                <span className="flex-1 text-xs truncate">Tous les comptes</span>
                <Check
                  className={cn(
                    "h-4 w-4 text-[#5b4fff]",
                    accountFilter === "all" ? "opacity-100" : "opacity-0"
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
                      <span className="truncate text-xs">{accountName}{lastIban}</span>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 text-[#5b4fff]",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ─── Section 1: Payments Card (Chart) ─── */}
      <div className="bg-background px-4 sm:px-6 pb-6 flex-1">
        <ForecastPaymentsCard
          months={forecastData?.months}
          kpi={forecastData?.kpi}
          loading={loading}
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

      {/* ─── Export Dialog ─── */}
      <ForecastExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        months={forecastData?.months}
      />
    </div>
  );
}
