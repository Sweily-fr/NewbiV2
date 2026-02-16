import { gql, useQuery, useMutation } from "@apollo/client";

// Fragments
const IMPORTED_PURCHASE_ORDER_FRAGMENT = gql`
  fragment ImportedPurchaseOrderFields on ImportedPurchaseOrder {
    id
    workspaceId
    importedBy
    status
    originalPurchaseOrderNumber
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
    purchaseOrderDate
    deliveryDate
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
export const GET_IMPORTED_PURCHASE_ORDERS = gql`
  ${IMPORTED_PURCHASE_ORDER_FRAGMENT}
  query GetImportedPurchaseOrders(
    $workspaceId: ID!
    $page: Int
    $limit: Int
    $filters: ImportedPurchaseOrderFilters
  ) {
    importedPurchaseOrders(
      workspaceId: $workspaceId
      page: $page
      limit: $limit
      filters: $filters
    ) {
      purchaseOrders {
        ...ImportedPurchaseOrderFields
      }
      total
      page
      limit
      hasMore
    }
  }
`;

export const GET_IMPORTED_PURCHASE_ORDER = gql`
  ${IMPORTED_PURCHASE_ORDER_FRAGMENT}
  query GetImportedPurchaseOrder($id: ID!) {
    importedPurchaseOrder(id: $id) {
      ...ImportedPurchaseOrderFields
    }
  }
`;

export const GET_IMPORTED_PURCHASE_ORDER_STATS = gql`
  query GetImportedPurchaseOrderStats($workspaceId: ID!) {
    importedPurchaseOrderStats(workspaceId: $workspaceId) {
      pendingReview
      validated
      rejected
      archived
      totalAmount
    }
  }
`;

// Mutations
export const IMPORT_PURCHASE_ORDER_DIRECT = gql`
  ${IMPORTED_PURCHASE_ORDER_FRAGMENT}
  mutation ImportPurchaseOrderDirect($file: Upload!, $workspaceId: ID!) {
    importPurchaseOrderDirect(file: $file, workspaceId: $workspaceId) {
      success
      purchaseOrder {
        ...ImportedPurchaseOrderFields
      }
      error
      isDuplicate
    }
  }
`;

export const UPDATE_IMPORTED_PURCHASE_ORDER = gql`
  ${IMPORTED_PURCHASE_ORDER_FRAGMENT}
  mutation UpdateImportedPurchaseOrder(
    $id: ID!
    $input: UpdateImportedPurchaseOrderInput!
  ) {
    updateImportedPurchaseOrder(id: $id, input: $input) {
      ...ImportedPurchaseOrderFields
    }
  }
`;

export const VALIDATE_IMPORTED_PURCHASE_ORDER = gql`
  ${IMPORTED_PURCHASE_ORDER_FRAGMENT}
  mutation ValidateImportedPurchaseOrder($id: ID!) {
    validateImportedPurchaseOrder(id: $id) {
      ...ImportedPurchaseOrderFields
    }
  }
`;

export const REJECT_IMPORTED_PURCHASE_ORDER = gql`
  ${IMPORTED_PURCHASE_ORDER_FRAGMENT}
  mutation RejectImportedPurchaseOrder($id: ID!, $reason: String) {
    rejectImportedPurchaseOrder(id: $id, reason: $reason) {
      ...ImportedPurchaseOrderFields
    }
  }
`;

export const ARCHIVE_IMPORTED_PURCHASE_ORDER = gql`
  ${IMPORTED_PURCHASE_ORDER_FRAGMENT}
  mutation ArchiveImportedPurchaseOrder($id: ID!) {
    archiveImportedPurchaseOrder(id: $id) {
      ...ImportedPurchaseOrderFields
    }
  }
`;

export const DELETE_IMPORTED_PURCHASE_ORDER = gql`
  mutation DeleteImportedPurchaseOrder($id: ID!) {
    deleteImportedPurchaseOrder(id: $id)
  }
`;

export const DELETE_IMPORTED_PURCHASE_ORDERS = gql`
  mutation DeleteImportedPurchaseOrders($ids: [ID!]!) {
    deleteImportedPurchaseOrders(ids: $ids)
  }
`;

// Status labels et colors
export const IMPORTED_PURCHASE_ORDER_STATUS_LABELS = {
  PENDING_REVIEW: "À vérifier",
  VALIDATED: "Validé",
  REJECTED: "Rejeté",
  ARCHIVED: "Archivé",
};

export const IMPORTED_PURCHASE_ORDER_STATUS_COLORS = {
  PENDING_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  VALIDATED: "bg-green-50 text-green-600 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  ARCHIVED: "bg-gray-100 text-gray-800 border-gray-200",
};

// Hooks
export function useImportedPurchaseOrders(workspaceId, options = {}) {
  const { page = 1, limit = 1000, filters = {} } = options;

  const { data, loading, error, refetch } = useQuery(GET_IMPORTED_PURCHASE_ORDERS, {
    variables: { workspaceId, page, limit, filters },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  return {
    importedPurchaseOrders: data?.importedPurchaseOrders?.purchaseOrders || [],
    total: data?.importedPurchaseOrders?.total || 0,
    hasMore: data?.importedPurchaseOrders?.hasMore || false,
    loading,
    error,
    refetch,
  };
}

export function useImportedPurchaseOrder(id) {
  const { data, loading, error, refetch } = useQuery(GET_IMPORTED_PURCHASE_ORDER, {
    variables: { id },
    skip: !id,
  });

  return {
    importedPurchaseOrder: data?.importedPurchaseOrder,
    loading,
    error,
    refetch,
  };
}

export function useImportedPurchaseOrderStats(workspaceId) {
  const { data, loading, error, refetch } = useQuery(GET_IMPORTED_PURCHASE_ORDER_STATS, {
    variables: { workspaceId },
    skip: !workspaceId,
  });

  return {
    stats: data?.importedPurchaseOrderStats,
    loading,
    error,
    refetch,
  };
}

const IMPORTED_PO_REFETCH = ["GetImportedPurchaseOrders", "GetImportedPurchaseOrderStats"];

export function useUpdateImportedPurchaseOrder() {
  const [updateImportedPurchaseOrder, { loading, error }] = useMutation(UPDATE_IMPORTED_PURCHASE_ORDER, {
    refetchQueries: IMPORTED_PO_REFETCH,
  });
  return { updateImportedPurchaseOrder, loading, error };
}

export function useValidateImportedPurchaseOrder() {
  const [validateImportedPurchaseOrder, { loading, error }] = useMutation(VALIDATE_IMPORTED_PURCHASE_ORDER, {
    refetchQueries: IMPORTED_PO_REFETCH,
  });
  return { validateImportedPurchaseOrder, loading, error };
}

export function useRejectImportedPurchaseOrder() {
  const [rejectImportedPurchaseOrder, { loading, error }] = useMutation(REJECT_IMPORTED_PURCHASE_ORDER, {
    refetchQueries: IMPORTED_PO_REFETCH,
  });
  return { rejectImportedPurchaseOrder, loading, error };
}

export function useArchiveImportedPurchaseOrder() {
  const [archiveImportedPurchaseOrder, { loading, error }] = useMutation(ARCHIVE_IMPORTED_PURCHASE_ORDER, {
    refetchQueries: IMPORTED_PO_REFETCH,
  });
  return { archiveImportedPurchaseOrder, loading, error };
}

export function useDeleteImportedPurchaseOrder() {
  const [deleteImportedPurchaseOrder, { loading, error }] = useMutation(DELETE_IMPORTED_PURCHASE_ORDER, {
    refetchQueries: IMPORTED_PO_REFETCH,
  });
  return { deleteImportedPurchaseOrder, loading, error };
}

export function useDeleteImportedPurchaseOrders() {
  const [deleteImportedPurchaseOrders, { loading, error }] = useMutation(DELETE_IMPORTED_PURCHASE_ORDERS, {
    refetchQueries: IMPORTED_PO_REFETCH,
  });
  return { deleteImportedPurchaseOrders, loading, error };
}
