import { gql } from "@apollo/client";

export const GET_TREASURY_FORECAST_DATA = gql`
  query GetTreasuryForecastData(
    $workspaceId: ID
    $startDate: String!
    $endDate: String!
    $accountId: ID
  ) {
    treasuryForecastData(
      workspaceId: $workspaceId
      startDate: $startDate
      endDate: $endDate
      accountId: $accountId
    ) {
      kpi {
        currentBalance
        projectedBalance3Months
        pendingReceivables
        pendingPayables
        signedQuotes
      }
      months {
        month
        actualIncome
        actualExpense
        forecastIncome
        forecastExpense
        openingBalance
        closingBalance
        categoryBreakdown {
          category
          type
          actualAmount
          forecastAmount
        }
      }
    }
  }
`;

export const GET_DETECTED_RECURRENCES = gql`
  query GetDetectedRecurrences($workspaceId: ID) {
    detectedRecurrences(workspaceId: $workspaceId) {
      id
      workspaceId
      source
      type
      partyName
      category
      averageAmount
      lastSeenMonth
      consecutiveMonths
      isActive
      isMuted
      lastDetectedAt
    }
  }
`;

export const GET_MANUAL_CASHFLOW_ENTRIES = gql`
  query GetManualCashflowEntries($workspaceId: ID) {
    manualCashflowEntries(workspaceId: $workspaceId) {
      id
      workspaceId
      name
      type
      category
      amount
      startDate
      endDate
      frequency
      notes
      createdAt
      updatedAt
    }
  }
`;

export const GET_TREASURY_FORECASTS = gql`
  query GetTreasuryForecasts(
    $workspaceId: ID
    $startMonth: String!
    $endMonth: String!
  ) {
    treasuryForecasts(
      workspaceId: $workspaceId
      startMonth: $startMonth
      endMonth: $endMonth
    ) {
      id
      workspaceId
      month
      category
      type
      forecastAmount
      notes
      createdAt
      updatedAt
    }
  }
`;
