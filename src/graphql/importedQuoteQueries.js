import { gql, useQuery, useMutation } from "@apollo/client";

// Fragments
const IMPORTED_QUOTE_FRAGMENT = gql`
  fragment ImportedQuoteFields on ImportedQuote {
    id
    workspaceId
    importedBy
    status
    originalQuoteNumber
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
    client {
      name
      address
      city
      postalCode
      siret
      clientNumber
    }
    quoteDate
    validUntil
    dueDate
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
export const GET_IMPORTED_QUOTES = gql`
  ${IMPORTED_QUOTE_FRAGMENT}
  query GetImportedQuotes(
    $workspaceId: ID!
    $page: Int
    $limit: Int
    $filters: ImportedQuoteFilters
  ) {
    importedQuotes(
      workspaceId: $workspaceId
      page: $page
      limit: $limit
      filters: $filters
    ) {
      quotes {
        ...ImportedQuoteFields
      }
      total
      page
      limit
      hasMore
    }
  }
`;

export const GET_IMPORTED_QUOTE = gql`
  ${IMPORTED_QUOTE_FRAGMENT}
  query GetImportedQuote($id: ID!) {
    importedQuote(id: $id) {
      ...ImportedQuoteFields
    }
  }
`;

export const GET_IMPORTED_QUOTE_STATS = gql`
  query GetImportedQuoteStats($workspaceId: ID!) {
    importedQuoteStats(workspaceId: $workspaceId) {
      pendingReview
      validated
      rejected
      archived
      totalAmount
    }
  }
`;

// Mutations
export const IMPORT_QUOTE_DIRECT = gql`
  ${IMPORTED_QUOTE_FRAGMENT}
  mutation ImportQuoteDirect($file: Upload!, $workspaceId: ID!) {
    importQuoteDirect(file: $file, workspaceId: $workspaceId) {
      success
      quote {
        ...ImportedQuoteFields
      }
      error
      isDuplicate
    }
  }
`;

export const UPDATE_IMPORTED_QUOTE = gql`
  ${IMPORTED_QUOTE_FRAGMENT}
  mutation UpdateImportedQuote(
    $id: ID!
    $input: UpdateImportedQuoteInput!
  ) {
    updateImportedQuote(id: $id, input: $input) {
      ...ImportedQuoteFields
    }
  }
`;

export const VALIDATE_IMPORTED_QUOTE = gql`
  ${IMPORTED_QUOTE_FRAGMENT}
  mutation ValidateImportedQuote($id: ID!) {
    validateImportedQuote(id: $id) {
      ...ImportedQuoteFields
    }
  }
`;

export const REJECT_IMPORTED_QUOTE = gql`
  ${IMPORTED_QUOTE_FRAGMENT}
  mutation RejectImportedQuote($id: ID!, $reason: String) {
    rejectImportedQuote(id: $id, reason: $reason) {
      ...ImportedQuoteFields
    }
  }
`;

export const ARCHIVE_IMPORTED_QUOTE = gql`
  ${IMPORTED_QUOTE_FRAGMENT}
  mutation ArchiveImportedQuote($id: ID!) {
    archiveImportedQuote(id: $id) {
      ...ImportedQuoteFields
    }
  }
`;

export const DELETE_IMPORTED_QUOTE = gql`
  mutation DeleteImportedQuote($id: ID!) {
    deleteImportedQuote(id: $id)
  }
`;

export const DELETE_IMPORTED_QUOTES = gql`
  mutation DeleteImportedQuotes($ids: [ID!]!) {
    deleteImportedQuotes(ids: $ids)
  }
`;

// Status labels et colors
export const IMPORTED_QUOTE_STATUS_LABELS = {
  PENDING_REVIEW: "À vérifier",
  VALIDATED: "Validé",
  REJECTED: "Rejeté",
  ARCHIVED: "Archivé",
};

export const IMPORTED_QUOTE_STATUS_COLORS = {
  PENDING_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  VALIDATED: "bg-green-50 text-green-600 border-green-200",
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
export function useImportedQuotes(workspaceId, options = {}) {
  const { page = 1, limit = 1000, filters = {} } = options;

  const { data, loading, error, refetch } = useQuery(GET_IMPORTED_QUOTES, {
    variables: { workspaceId, page, limit, filters },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  return {
    importedQuotes: data?.importedQuotes?.quotes || [],
    total: data?.importedQuotes?.total || 0,
    hasMore: data?.importedQuotes?.hasMore || false,
    loading,
    error,
    refetch,
  };
}

export function useImportedQuote(id) {
  const { data, loading, error, refetch } = useQuery(GET_IMPORTED_QUOTE, {
    variables: { id },
    skip: !id,
  });

  return {
    importedQuote: data?.importedQuote,
    loading,
    error,
    refetch,
  };
}

export function useImportedQuoteStats(workspaceId) {
  const { data, loading, error, refetch } = useQuery(GET_IMPORTED_QUOTE_STATS, {
    variables: { workspaceId },
    skip: !workspaceId,
  });

  return {
    stats: data?.importedQuoteStats,
    loading,
    error,
    refetch,
  };
}

const IMPORTED_QUOTE_REFETCH = ["GetImportedQuotes", "GetImportedQuoteStats"];

export function useUpdateImportedQuote() {
  const [updateImportedQuote, { loading, error }] = useMutation(UPDATE_IMPORTED_QUOTE, {
    refetchQueries: IMPORTED_QUOTE_REFETCH,
  });
  return { updateImportedQuote, loading, error };
}

export function useValidateImportedQuote() {
  const [validateImportedQuote, { loading, error }] = useMutation(VALIDATE_IMPORTED_QUOTE, {
    refetchQueries: IMPORTED_QUOTE_REFETCH,
  });
  return { validateImportedQuote, loading, error };
}

export function useRejectImportedQuote() {
  const [rejectImportedQuote, { loading, error }] = useMutation(REJECT_IMPORTED_QUOTE, {
    refetchQueries: IMPORTED_QUOTE_REFETCH,
  });
  return { rejectImportedQuote, loading, error };
}

export function useArchiveImportedQuote() {
  const [archiveImportedQuote, { loading, error }] = useMutation(ARCHIVE_IMPORTED_QUOTE, {
    refetchQueries: IMPORTED_QUOTE_REFETCH,
  });
  return { archiveImportedQuote, loading, error };
}

export function useDeleteImportedQuote() {
  const [deleteImportedQuote, { loading, error }] = useMutation(DELETE_IMPORTED_QUOTE, {
    refetchQueries: IMPORTED_QUOTE_REFETCH,
  });
  return { deleteImportedQuote, loading, error };
}

export function useDeleteImportedQuotes() {
  const [deleteImportedQuotes, { loading, error }] = useMutation(DELETE_IMPORTED_QUOTES, {
    refetchQueries: IMPORTED_QUOTE_REFETCH,
  });
  return { deleteImportedQuotes, loading, error };
}
