"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_BANKING_ACCOUNTS } from "@/src/graphql/queries/banking";
import { useTreasuryForecastData } from "@/src/hooks/useTreasuryForecast";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { ForecastKpiTable } from "./components/forecast-kpi-table";
import { ForecastPaymentsCard } from "./components/forecast-payments-card";
import { ForecastExportDialog } from "./components/forecast-export-dialog";

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

  const { forecastData, loading } = useTreasuryForecastData(
    startDate,
    endDate,
    accountFilter !== "all" ? accountFilter : undefined
  );

  return (
    <div className="flex flex-col min-h-full">
      {/* ─── Section 1: KPIs Table ─── */}
      <div className="pt-4 sm:pt-6">
        <ForecastKpiTable
          months={forecastData?.months}
          kpi={forecastData?.kpi}
          loading={loading}
          onExport={() => setExportOpen(true)}
          period={period}
          onPeriodChange={(v) => v && setPeriod(v)}
          periodOptions={PERIOD_OPTIONS}
          bankAccounts={bankAccounts}
          accountFilter={accountFilter}
          onAccountFilterChange={setAccountFilter}
        />
      </div>

      {/* ─── Section 2: Payments Card ─── */}
      <div className="bg-[#FAFAFA] px-4 sm:px-6 pt-10 pb-6 flex-1">
        <ForecastPaymentsCard
          months={forecastData?.months}
          kpi={forecastData?.kpi}
          loading={loading}
        />
      </div>

      {/* ─── Export Dialog ─── */}
      <ForecastExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        months={forecastData?.months}
      />
    </div>
  );
}
