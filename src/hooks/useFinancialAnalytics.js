import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_FINANCIAL_ANALYTICS } from "../graphql/queries/financialAnalytics";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

/**
 * Génère tous les mois "YYYY-MM" entre startDate et endDate
 */
function generateAllMonths(startDate, endDate) {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (current <= last) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

/**
 * Remplit les mois manquants dans monthlyRevenue avec des zéros
 */
function fillMissingMonths(monthlyRevenue, allMonths) {
  if (!allMonths.length) return monthlyRevenue || [];
  if (!monthlyRevenue?.length) {
    return allMonths.map((month) => ({
      month,
      revenueHT: 0,
      revenueTTC: 0,
      revenueVAT: 0,
      expenseAmount: 0,
      invoiceCount: 0,
      expenseCount: 0,
      netResult: 0,
    }));
  }
  const dataMap = {};
  for (const m of monthlyRevenue) {
    dataMap[m.month] = m;
  }
  return allMonths.map((month) =>
    dataMap[month] || {
      month,
      revenueHT: 0,
      revenueTTC: 0,
      revenueVAT: 0,
      expenseAmount: 0,
      invoiceCount: 0,
      expenseCount: 0,
      netResult: 0,
    }
  );
}

/**
 * Hook pour récupérer les données d'analytiques financières
 */
export const useFinancialAnalytics = (startDate, endDate, options = {}) => {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_FINANCIAL_ANALYTICS, {
    variables: {
      workspaceId,
      startDate,
      endDate,
      clientId: undefined,
      clientIds: options.clientIds?.length > 0 ? options.clientIds : undefined,
      status: options.status?.length > 0 ? options.status : undefined,
    },
    skip: !workspaceId || !startDate || !endDate,
    fetchPolicy: "network-only",
  });

  const analyticsData = useMemo(() => {
    const raw = data?.financialAnalytics;
    if (!raw) return null;

    const allMonths = generateAllMonths(startDate, endDate);

    return {
      ...raw,
      monthlyRevenue: fillMissingMonths(raw.monthlyRevenue, allMonths),
    };
  }, [data, startDate, endDate]);

  return {
    analyticsData,
    loading,
    error,
    refetch,
  };
};
