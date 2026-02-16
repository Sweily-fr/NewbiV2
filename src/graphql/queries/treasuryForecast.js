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
