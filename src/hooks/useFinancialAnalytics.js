import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_FINANCIAL_ANALYTICS } from "../graphql/queries/financialAnalytics";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

/**
 * Generates all months "YYYY-MM" between startDate and endDate
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

const EMPTY_MONTH = {
  revenueHT: 0,
  revenueTTC: 0,
  revenueVAT: 0,
  expenseAmount: 0,
  expenseAmountHT: 0,
  expenseVAT: 0,
  invoiceCount: 0,
  expenseCount: 0,
  netResult: 0,
  creditNoteHT: 0,
  netRevenueHT: 0,
  grossMargin: 0,
  grossMarginRate: 0,
};

const EMPTY_COLLECTION_MONTH = {
  invoicedTTC: 0,
  collectedTTC: 0,
  invoicedCount: 0,
  collectedCount: 0,
};

/**
 * Fills missing months in monthlyRevenue with zeros
 */
function fillMissingMonths(monthlyRevenue, allMonths) {
  if (!allMonths.length) return monthlyRevenue || [];
  if (!monthlyRevenue?.length) {
    return allMonths.map((month) => ({ month, ...EMPTY_MONTH }));
  }
  const dataMap = {};
  for (const m of monthlyRevenue) {
    dataMap[m.month] = m;
  }
  return allMonths.map((month) =>
    dataMap[month] || { month, ...EMPTY_MONTH }
  );
}

/**
 * Fills missing months in monthlyCollection with zeros,
 * and filters out months outside the date range.
 */
function fillMissingCollectionMonths(monthlyCollection, allMonths) {
  if (!allMonths.length) return monthlyCollection || [];
  if (!monthlyCollection?.length) {
    return allMonths.map((month) => ({ month, ...EMPTY_COLLECTION_MONTH }));
  }
  const dataMap = {};
  for (const m of monthlyCollection) {
    dataMap[m.month] = m;
  }
  return allMonths.map((month) =>
    dataMap[month] || { month, ...EMPTY_COLLECTION_MONTH }
  );
}

/**
 * Hook to fetch financial analytics data
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
      collection: raw.collection
        ? {
            ...raw.collection,
            monthlyCollection: fillMissingCollectionMonths(
              raw.collection.monthlyCollection,
              allMonths
            ),
          }
        : raw.collection,
    };
  }, [data, startDate, endDate]);

  return {
    analyticsData,
    loading,
    error,
    refetch,
  };
};
