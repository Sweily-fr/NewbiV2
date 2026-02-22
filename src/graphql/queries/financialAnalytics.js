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
        totalExpensesHT
        totalExpensesTTC
        grossMargin
        grossMarginRate
        chargeRate
        creditNoteCount
        creditNoteTotalHT
        netRevenueHT
        outstandingReceivables
        overdueAmount
        overdueCount
        dso
        collectionRate
        activeClientCount
        newClientCount
        retainedClientCount
        topClientConcentration
        quoteCount
        quoteConvertedCount
      }
      previousPeriod {
        totalRevenueHT
        totalExpensesHT
        grossMargin
        grossMarginRate
        invoiceCount
        averageInvoiceHT
        collectionRate
        dso
        activeClientCount
        newClientCount
        quoteConversionRate
        netRevenueHT
        creditNoteTotalHT
        overdueAmount
        overdueCount
        outstandingReceivables
        topClientConcentration
        chargeRate
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
        expenseAmountHT
        expenseVAT
        invoiceCount
        expenseCount
        netResult
        creditNoteHT
        netRevenueHT
        grossMargin
        grossMarginRate
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
      collection {
        overdueInvoices {
          invoiceId
          invoiceNumber
          clientName
          totalTTC
          dueDate
          daysOverdue
        }
        agingBuckets {
          label
          min
          max
          count
          totalTTC
        }
        monthlyCollection {
          month
          invoicedTTC
          collectedTTC
          invoicedCount
          collectedCount
        }
      }
      alerts {
        type
        severity
        message
        value
        threshold
      }
    }
  }
`;
