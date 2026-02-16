import { gql } from "@apollo/client";

export const CREATE_PURCHASE_INVOICE = gql`
  mutation CreatePurchaseInvoice($input: CreatePurchaseInvoiceInput!) {
    createPurchaseInvoice(input: $input) {
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
      source
      createdAt
    }
  }
`;

export const UPDATE_PURCHASE_INVOICE = gql`
  mutation UpdatePurchaseInvoice($id: ID!, $input: UpdatePurchaseInvoiceInput!) {
    updatePurchaseInvoice(id: $id, input: $input) {
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
      paymentDate
      paymentMethod
      updatedAt
    }
  }
`;

export const DELETE_PURCHASE_INVOICE = gql`
  mutation DeletePurchaseInvoice($id: ID!) {
    deletePurchaseInvoice(id: $id) {
      success
      message
    }
  }
`;

export const ADD_PURCHASE_INVOICE_FILE = gql`
  mutation AddPurchaseInvoiceFile($purchaseInvoiceId: ID!, $input: PurchaseInvoiceFileInput!) {
    addPurchaseInvoiceFile(purchaseInvoiceId: $purchaseInvoiceId, input: $input) {
      id
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
        invoiceNumber
        invoiceDate
        dueDate
        amountHT
        amountTVA
        vatRate
        amountTTC
        iban
        confidenceScore
      }
    }
  }
`;

export const REMOVE_PURCHASE_INVOICE_FILE = gql`
  mutation RemovePurchaseInvoiceFile($purchaseInvoiceId: ID!, $fileId: ID!) {
    removePurchaseInvoiceFile(purchaseInvoiceId: $purchaseInvoiceId, fileId: $fileId) {
      id
      files {
        id
        filename
        originalFilename
        url
      }
    }
  }
`;

export const MARK_PURCHASE_INVOICE_AS_PAID = gql`
  mutation MarkPurchaseInvoiceAsPaid(
    $id: ID!
    $paymentDate: String
    $paymentMethod: PurchaseInvoicePaymentMethod
  ) {
    markPurchaseInvoiceAsPaid(id: $id, paymentDate: $paymentDate, paymentMethod: $paymentMethod) {
      id
      status
      paymentDate
      paymentMethod
    }
  }
`;

export const BULK_UPDATE_PURCHASE_INVOICE_STATUS = gql`
  mutation BulkUpdatePurchaseInvoiceStatus($ids: [ID!]!, $status: PurchaseInvoiceStatus!) {
    bulkUpdatePurchaseInvoiceStatus(ids: $ids, status: $status) {
      success
      updatedCount
      message
    }
  }
`;

export const BULK_DELETE_PURCHASE_INVOICES = gql`
  mutation BulkDeletePurchaseInvoices($ids: [ID!]!) {
    bulkDeletePurchaseInvoices(ids: $ids) {
      success
      updatedCount
      message
    }
  }
`;

export const BULK_CATEGORIZE_PURCHASE_INVOICES = gql`
  mutation BulkCategorizePurchaseInvoices($ids: [ID!]!, $category: PurchaseInvoiceCategory!) {
    bulkCategorizePurchaseInvoices(ids: $ids, category: $category) {
      success
      updatedCount
      message
    }
  }
`;

export const RECONCILE_PURCHASE_INVOICE = gql`
  mutation ReconcilePurchaseInvoice($purchaseInvoiceId: ID!, $transactionIds: [ID!]!) {
    reconcilePurchaseInvoice(purchaseInvoiceId: $purchaseInvoiceId, transactionIds: $transactionIds) {
      id
      status
      linkedTransactionIds
      isReconciled
      paymentDate
    }
  }
`;

export const UNRECONCILE_PURCHASE_INVOICE = gql`
  mutation UnreconcilePurchaseInvoice($purchaseInvoiceId: ID!) {
    unreconcilePurchaseInvoice(purchaseInvoiceId: $purchaseInvoiceId) {
      id
      status
      linkedTransactionIds
      isReconciled
    }
  }
`;

export const CREATE_SUPPLIER = gql`
  mutation CreateSupplier($input: CreateSupplierInput!) {
    createSupplier(input: $input) {
      id
      name
      email
      phone
      siret
      vatNumber
      iban
      bic
      defaultCategory
      createdAt
    }
  }
`;

export const UPDATE_SUPPLIER = gql`
  mutation UpdateSupplier($id: ID!, $input: UpdateSupplierInput!) {
    updateSupplier(id: $id, input: $input) {
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
      updatedAt
    }
  }
`;

export const DELETE_SUPPLIER = gql`
  mutation DeleteSupplier($id: ID!) {
    deleteSupplier(id: $id) {
      success
      message
    }
  }
`;

export const MERGE_SUPPLIERS = gql`
  mutation MergeSuppliers($targetId: ID!, $sourceIds: [ID!]!) {
    mergeSuppliers(targetId: $targetId, sourceIds: $sourceIds) {
      id
      name
    }
  }
`;

// ============================================================
// Synchronisation e-invoicing (SuperPDP)
// ============================================================

export const SYNC_PURCHASE_INVOICES_FROM_SUPERPDP = gql`
  mutation SyncPurchaseInvoicesFromSuperPdp($workspaceId: ID!, $since: String) {
    syncPurchaseInvoicesFromSuperPdp(workspaceId: $workspaceId, since: $since) {
      success
      imported
      skipped
      errors
      message
    }
  }
`;

export const ACKNOWLEDGE_PURCHASE_INVOICE_EINVOICE = gql`
  mutation AcknowledgePurchaseInvoiceEInvoice($id: ID!) {
    acknowledgePurchaseInvoiceEInvoice(id: $id) {
      id
      eInvoiceStatus
      status
    }
  }
`;
