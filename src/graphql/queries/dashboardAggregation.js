import { gql } from "@apollo/client";

export const GET_DASHBOARD_SUMMARY = gql`
  query GetDashboardSummary($workspaceId: ID!, $accountId: String) {
    dashboardSummary(workspaceId: $workspaceId, accountId: $accountId) {
      totalIncome
      totalExpenses
      bankBalance
      transactionCount
    }
  }
`;

export const GET_TREASURY_CHART = gql`
  query GetTreasuryChart(
    $workspaceId: ID!
    $period: DashboardPeriodInput!
    $accountId: String
  ) {
    dashboardTreasuryChart(
      workspaceId: $workspaceId
      period: $period
      accountId: $accountId
    ) {
      dataPoints {
        date
        income
        expenses
        treasury
      }
      startBalance
      endBalance
      totalIncome
      totalExpenses
    }
  }
`;

export const GET_CATEGORY_AGGREGATION = gql`
  query GetCategoryAggregation(
    $workspaceId: ID!
    $type: String!
    $period: DashboardPeriodInput!
    $accountId: String
  ) {
    dashboardCategoryAggregation(
      workspaceId: $workspaceId
      type: $type
      period: $period
      accountId: $accountId
    ) {
      categories {
        name
        amount
        count
        color
      }
      total
      transactionCount
    }
  }
`;
