import { gql } from "@apollo/client";

export const GET_PURCHASE_INVOICES = gql`
  query GetPurchaseInvoices(
    $workspaceId: ID!
    $page: Int
    $limit: Int
    $search: String
    $status: PurchaseInvoiceStatus
    $category: PurchaseInvoiceCategory
    $supplierId: ID
    $startDate: String
    $endDate: String
    $dueDateStart: String
    $dueDateEnd: String
    $minAmount: Float
    $maxAmount: Float
    $hasFile: Boolean
    $sortField: PurchaseInvoiceSortField
    $sortOrder: SortOrder
  ) {
    purchaseInvoices(
      workspaceId: $workspaceId
      page: $page
      limit: $limit
      search: $search
      status: $status
      category: $category
      supplierId: $supplierId
      startDate: $startDate
      endDate: $endDate
      dueDateStart: $dueDateStart
      dueDateEnd: $dueDateEnd
      minAmount: $minAmount
      maxAmount: $maxAmount
      hasFile: $hasFile
      sortField: $sortField
      sortOrder: $sortOrder
    ) {
      items {
        id
        supplierName
        supplierId
        invoiceNumber
        issueDate
        dueDate
        amountHT
        amountTVA
        vatRate
        amountTTC
        currency
        status
        category
        tags
        notes
        internalReference
        files {
          id
          filename
          originalFilename
          mimetype
          size
          url
          ocrProcessed
        }
        ocrMetadata {
          supplierName
          supplierAddress
          supplierVatNumber
          supplierSiret
          invoiceNumber
          invoiceDate
          dueDate
          amountHT
          amountTVA
          vatRate
          amountTTC
          currency
          iban
          bic
          confidenceScore
        }
        paymentDate
        paymentMethod
        linkedTransactionIds
        isReconciled
        source
        createdAt
        updatedAt
      }
      totalCount
      currentPage
      totalPages
      hasNextPage
    }
  }
`;

export const GET_PURCHASE_INVOICE = gql`
  query GetPurchaseInvoice($id: ID!) {
    purchaseInvoice(id: $id) {
      id
      supplierName
      supplierId
      supplier {
        id
        name
        email
        phone
        siret
        vatNumber
        iban
        bic
      }
      invoiceNumber
      issueDate
      dueDate
      amountHT
      amountTVA
      vatRate
      amountTTC
      currency
      status
      category
      tags
      notes
      internalReference
      files {
        id
        filename
        originalFilename
        mimetype
        size
        url
        ocrProcessed
        ocrData
      }
      ocrMetadata {
        supplierName
        supplierAddress
        supplierVatNumber
        supplierSiret
        invoiceNumber
        invoiceDate
        dueDate
        amountHT
        amountTVA
        vatRate
        amountTTC
        currency
        iban
        bic
        confidenceScore
        rawExtractedText
      }
      paymentDate
      paymentMethod
      linkedTransactionIds
      isReconciled
      source
      createdAt
      updatedAt
    }
  }
`;

export const GET_PURCHASE_INVOICE_STATS = gql`
  query GetPurchaseInvoiceStats($workspaceId: ID!) {
    purchaseInvoiceStats(workspaceId: $workspaceId) {
      totalToPay
      totalToPayCount
      totalOverdue
      totalOverdueCount
      paidThisMonth
      paidThisMonthCount
      totalThisMonth
      totalThisMonthCount
    }
  }
`;

export const GET_PURCHASE_INVOICE_RECONCILIATION_MATCHES = gql`
  query GetPurchaseInvoiceReconciliationMatches($purchaseInvoiceId: ID!) {
    purchaseInvoiceReconciliationMatches(purchaseInvoiceId: $purchaseInvoiceId) {
      transactionId
      amount
      date
      description
      confidence
    }
  }
`;

export const GET_SUPPLIERS = gql`
  query GetSuppliers(
    $workspaceId: ID!
    $page: Int
    $limit: Int
    $search: String
  ) {
    suppliers(
      workspaceId: $workspaceId
      page: $page
      limit: $limit
      search: $search
    ) {
      items {
        id
        name
        email
        phone
        siret
        vatNumber
        iban
        bic
        defaultCategory
        notes
        invoiceCount
        totalAmount
        createdAt
      }
      totalCount
      currentPage
      totalPages
    }
  }
`;
