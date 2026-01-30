import { gql, useQuery, useMutation } from "@apollo/client";

// Fragments
const IMPORTED_INVOICE_FRAGMENT = gql`
  fragment ImportedInvoiceFields on ImportedInvoice {
    id
    workspaceId
    importedBy
    status
    originalInvoiceNumber
    vendor {
      name
      address
      city
      postalCode
      country
      siret
      vatNumber
      email
      phone
    }
    invoiceDate
    dueDate
    paymentDate
    totalHT
    totalVAT
    totalTTC
    currency
    items {
      description
      quantity
      unitPrice
      totalPrice
      vatRate
      productCode
    }
    category
    paymentMethod
    file {
      url
      cloudflareKey
      originalFileName
      mimeType
      fileSize
    }
    ocrData {
      extractedText
      confidence
      processedAt
    }
    notes
    linkedExpenseId
    isDuplicate
    duplicateOf
    createdAt
    updatedAt
  }
`;

// Queries
export const GET_IMPORTED_INVOICES = gql`
  ${IMPORTED_INVOICE_FRAGMENT}
  query GetImportedInvoices(
    $workspaceId: ID!
    $page: Int
    $limit: Int
    $filters: ImportedInvoiceFilters
  ) {
    importedInvoices(
      workspaceId: $workspaceId
      page: $page
      limit: $limit
      filters: $filters
    ) {
      invoices {
        ...ImportedInvoiceFields
      }
      total
      page
      limit
      hasMore
    }
  }
`;

export const GET_IMPORTED_INVOICE = gql`
  ${IMPORTED_INVOICE_FRAGMENT}
  query GetImportedInvoice($id: ID!) {
    importedInvoice(id: $id) {
      ...ImportedInvoiceFields
    }
  }
`;

export const GET_IMPORTED_INVOICE_STATS = gql`
  query GetImportedInvoiceStats($workspaceId: ID!) {
    importedInvoiceStats(workspaceId: $workspaceId) {
      pendingReview
      validated
      rejected
      archived
      totalAmount
    }
  }
`;

export const GET_USER_OCR_QUOTA = gql`
  query GetUserOcrQuota($workspaceId: ID!) {
    userOcrQuota(workspaceId: $workspaceId) {
      plan
      monthlyQuota
      usedQuota
      remainingQuota
      extraImportsPurchased
      extraImportsUsed
      extraImportsAvailable
      extraImportPrice
      totalUsedThisMonth
      totalAvailable
      month
      resetDate
      lastImports {
        timestamp
        fileName
        provider
        success
        isExtra
      }
    }
  }
`;

export const GET_OCR_USAGE_STATS = gql`
  query GetOcrUsageStats($workspaceId: ID!) {
    ocrUsageStats(workspaceId: $workspaceId) {
      claudeVision {
        used
        limit
        available
      }
      mindee {
        used
        limit
        available
      }
      googleDocumentAi {
        used
        limit
        available
      }
      mistral {
        used
        limit
        available
      }
      currentProvider
    }
  }
`;

// Mutations
export const IMPORT_INVOICE = gql`
  ${IMPORTED_INVOICE_FRAGMENT}
  mutation ImportInvoice(
    $workspaceId: ID!
    $cloudflareUrl: String!
    $fileName: String!
    $mimeType: String!
    $fileSize: Int
    $cloudflareKey: String!
  ) {
    importInvoice(
      workspaceId: $workspaceId
      cloudflareUrl: $cloudflareUrl
      fileName: $fileName
      mimeType: $mimeType
      fileSize: $fileSize
      cloudflareKey: $cloudflareKey
    ) {
      success
      invoice {
        ...ImportedInvoiceFields
      }
      error
      isDuplicate
    }
  }
`;

export const BATCH_IMPORT_INVOICES = gql`
  ${IMPORTED_INVOICE_FRAGMENT}
  mutation BatchImportInvoices(
    $workspaceId: ID!
    $files: [BatchImportFileInput!]!
  ) {
    batchImportInvoices(workspaceId: $workspaceId, files: $files) {
      success
      totalProcessed
      successCount
      errorCount
      results {
        success
        invoice {
          ...ImportedInvoiceFields
        }
        error
        isDuplicate
      }
      errors
    }
  }
`;

export const UPDATE_IMPORTED_INVOICE = gql`
  ${IMPORTED_INVOICE_FRAGMENT}
  mutation UpdateImportedInvoice(
    $id: ID!
    $input: UpdateImportedInvoiceInput!
  ) {
    updateImportedInvoice(id: $id, input: $input) {
      ...ImportedInvoiceFields
    }
  }
`;

export const VALIDATE_IMPORTED_INVOICE = gql`
  ${IMPORTED_INVOICE_FRAGMENT}
  mutation ValidateImportedInvoice($id: ID!) {
    validateImportedInvoice(id: $id) {
      ...ImportedInvoiceFields
    }
  }
`;

export const REJECT_IMPORTED_INVOICE = gql`
  ${IMPORTED_INVOICE_FRAGMENT}
  mutation RejectImportedInvoice($id: ID!, $reason: String) {
    rejectImportedInvoice(id: $id, reason: $reason) {
      ...ImportedInvoiceFields
    }
  }
`;

export const ARCHIVE_IMPORTED_INVOICE = gql`
  ${IMPORTED_INVOICE_FRAGMENT}
  mutation ArchiveImportedInvoice($id: ID!) {
    archiveImportedInvoice(id: $id) {
      ...ImportedInvoiceFields
    }
  }
`;

export const DELETE_IMPORTED_INVOICE = gql`
  mutation DeleteImportedInvoice($id: ID!) {
    deleteImportedInvoice(id: $id)
  }
`;

export const DELETE_IMPORTED_INVOICES = gql`
  mutation DeleteImportedInvoices($ids: [ID!]!) {
    deleteImportedInvoices(ids: $ids)
  }
`;

export const PURCHASE_EXTRA_OCR_IMPORTS = gql`
  mutation PurchaseExtraOcrImports(
    $workspaceId: ID!
    $quantity: Int!
    $paymentId: String
  ) {
    purchaseExtraOcrImports(
      workspaceId: $workspaceId
      quantity: $quantity
      paymentId: $paymentId
    ) {
      success
      quantity
      extraImportsAvailable
      totalSpent
      message
    }
  }
`;

// Status labels et colors
export const IMPORTED_INVOICE_STATUS_LABELS = {
  PENDING_REVIEW: "À vérifier",
  VALIDATED: "Validée",
  REJECTED: "Rejetée",
  ARCHIVED: "Archivée",
};

export const IMPORTED_INVOICE_STATUS_COLORS = {
  PENDING_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  VALIDATED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  ARCHIVED: "bg-gray-100 text-gray-800 border-gray-200",
};

export const EXPENSE_CATEGORY_LABELS = {
  OFFICE_SUPPLIES: "Fournitures de bureau",
  TRAVEL: "Déplacements",
  MEALS: "Repas",
  EQUIPMENT: "Équipement",
  MARKETING: "Marketing",
  TRAINING: "Formation",
  SERVICES: "Services",
  RENT: "Loyer",
  SALARIES: "Salaires",
  UTILITIES: "Charges",
  INSURANCE: "Assurance",
  SUBSCRIPTIONS: "Abonnements",
  OTHER: "Autre",
};

export const PAYMENT_METHOD_LABELS = {
  CARD: "Carte bancaire",
  CASH: "Espèces",
  CHECK: "Chèque",
  TRANSFER: "Virement",
  DIRECT_DEBIT: "Prélèvement",
  OTHER: "Autre",
  UNKNOWN: "Non spécifié",
};

// Hooks
export function useImportedInvoices(workspaceId, options = {}) {
  // Limite élevée pour charger toutes les factures (pagination côté client)
  const { page = 1, limit = 1000, filters = {} } = options;
  
  const { data, loading, error, refetch } = useQuery(GET_IMPORTED_INVOICES, {
    variables: { workspaceId, page, limit, filters },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  return {
    importedInvoices: data?.importedInvoices?.invoices || [],
    total: data?.importedInvoices?.total || 0,
    hasMore: data?.importedInvoices?.hasMore || false,
    loading,
    error,
    refetch,
  };
}

export function useImportedInvoice(id) {
  const { data, loading, error, refetch } = useQuery(GET_IMPORTED_INVOICE, {
    variables: { id },
    skip: !id,
  });

  return {
    importedInvoice: data?.importedInvoice,
    loading,
    error,
    refetch,
  };
}

export function useImportedInvoiceStats(workspaceId) {
  const { data, loading, error, refetch } = useQuery(GET_IMPORTED_INVOICE_STATS, {
    variables: { workspaceId },
    skip: !workspaceId,
  });

  return {
    stats: data?.importedInvoiceStats,
    loading,
    error,
    refetch,
  };
}

export function useImportInvoice() {
  const [importInvoice, { loading, error }] = useMutation(IMPORT_INVOICE);
  return { importInvoice, loading, error };
}

export function useBatchImportInvoices() {
  const [batchImportInvoices, { loading, error }] = useMutation(BATCH_IMPORT_INVOICES);
  return { batchImportInvoices, loading, error };
}

export function useUpdateImportedInvoice() {
  const [updateImportedInvoice, { loading, error }] = useMutation(UPDATE_IMPORTED_INVOICE);
  return { updateImportedInvoice, loading, error };
}

export function useValidateImportedInvoice() {
  const [validateImportedInvoice, { loading, error }] = useMutation(VALIDATE_IMPORTED_INVOICE);
  return { validateImportedInvoice, loading, error };
}

export function useRejectImportedInvoice() {
  const [rejectImportedInvoice, { loading, error }] = useMutation(REJECT_IMPORTED_INVOICE);
  return { rejectImportedInvoice, loading, error };
}

export function useArchiveImportedInvoice() {
  const [archiveImportedInvoice, { loading, error }] = useMutation(ARCHIVE_IMPORTED_INVOICE);
  return { archiveImportedInvoice, loading, error };
}

export function useDeleteImportedInvoice() {
  const [deleteImportedInvoice, { loading, error }] = useMutation(DELETE_IMPORTED_INVOICE);
  return { deleteImportedInvoice, loading, error };
}

export function useDeleteImportedInvoices() {
  const [deleteImportedInvoices, { loading, error }] = useMutation(DELETE_IMPORTED_INVOICES);
  return { deleteImportedInvoices, loading, error };
}

export function useUserOcrQuota(workspaceId) {
  const { data, loading, error, refetch } = useQuery(GET_USER_OCR_QUOTA, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  return {
    quota: data?.userOcrQuota,
    loading,
    error,
    refetch,
  };
}

export function useOcrUsageStats(workspaceId) {
  const { data, loading, error, refetch } = useQuery(GET_OCR_USAGE_STATS, {
    variables: { workspaceId },
    skip: !workspaceId,
  });

  return {
    stats: data?.ocrUsageStats,
    loading,
    error,
    refetch,
  };
}

export function usePurchaseExtraOcrImports() {
  const [purchaseExtraOcrImports, { loading, error }] = useMutation(PURCHASE_EXTRA_OCR_IMPORTS);
  return { purchaseExtraOcrImports, loading, error };
}
