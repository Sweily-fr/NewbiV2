import { gql } from "@apollo/client";

export const GET_FINANCIAL_ANALYTICS = gql`
  query GetFinancialAnalytics(
    $workspaceId: ID
    $startDate: String!
    $endDate: String!
    $clientId: ID
    $clientIds: [ID]
    $status: [String]
  ) {
    financialAnalytics(
      workspaceId: $workspaceId
      startDate: $startDate
      endDate: $endDate
      clientId: $clientId
      clientIds: $clientIds
      status: $status
    ) {
      kpi {
        totalRevenueHT
        totalRevenueTTC
        totalExpenses
        netResult
        invoiceCount
        expenseCount
        averageInvoiceHT
        clientCount
        quoteConversionRate
      }
      revenueByClient {
        clientId
        clientName
        clientType
        totalHT
        totalTTC
        totalVAT
        invoiceCount
        averageInvoiceHT
        totalTimeSeconds
        totalBillableAmount
        totalHours
      }
      revenueByProduct {
        description
        totalHT
        totalQuantity
        invoiceCount
        averageUnitPrice
      }
      monthlyRevenue {
        month
        revenueHT
        revenueTTC
        revenueVAT
        expenseAmount
        invoiceCount
        expenseCount
        netResult
      }
      paymentMethodStats {
        method
        count
        totalTTC
      }
      statusBreakdown {
        status
        count
        totalTTC
      }
      topClients {
        clientId
        clientName
        totalTTC
        invoiceCount
        percentage
      }
      expenseByCategory {
        category
        amount
        count
      }
      revenueByClientMonthly {
        clientId
        clientName
        month
        totalHT
        totalTTC
        totalVAT
        invoiceCount
      }
      expenseByCategoryMonthly {
        category
        month
        amount
        count
      }
    }
  }
`;
