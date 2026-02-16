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
import { Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

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
      {/* ─── Header: Title + actions ─── */}
      <div className="flex items-center justify-between pt-4 sm:pt-6 mb-8 px-4 sm:px-6">
        <h1 className="text-2xl font-medium">Prévision</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-gray-200"
            onClick={() => setExportOpen(true)}
          >
            <Download className="h-4 w-4 text-gray-500" />
          </Button>

          {bankAccounts?.length > 1 && (
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Tous les comptes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les comptes</SelectItem>
                {bankAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name || acc.bankName || "Compte"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* ─── Section 1: Payments Card (Chart) ─── */}
      <div className="bg-white px-4 sm:px-6 pb-6 flex-1">
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
