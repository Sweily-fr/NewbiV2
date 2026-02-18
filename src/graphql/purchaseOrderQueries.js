import { gql } from "@apollo/client";

// ==================== FRAGMENTS ====================

export const PURCHASE_ORDER_FRAGMENT = gql`
  fragment PurchaseOrderFragment on PurchaseOrder {
    id
    number
    prefix
    purchaseOrderNumber
    status
    issueDate
    validUntil
    deliveryDate
    headerNotes
    footerNotes
    termsAndConditions
    termsAndConditionsLinkTitle
    termsAndConditionsLink
    discount
    discountType
    retenueGarantie
    escompte
    totalHT
    totalTTC
    totalVAT
    finalTotalHT
    finalTotalVAT
    finalTotalTTC
    discountAmount
    createdAt
    updatedAt
    client {
      id
      name
      email
      type
      firstName
      lastName
      siret
      vatNumber
      hasDifferentShippingAddress
      address {
        street
        city
        postalCode
        country
      }
      shippingAddress {
        fullName
        street
        city
        postalCode
        country
      }
    }
    companyInfo {
      name
      email
      phone
      website
      logo
      siret
      vatNumber
      transactionCategory
      vatPaymentCondition
      companyStatus
      capitalSocial
      rcs
      address {
        street
        city
        postalCode
        country
      }
      bankDetails {
        iban
        bic
        bankName
      }
    }
    items {
      description
      quantity
      unitPrice
      vatRate
      unit
      discount
      discountType
      details
      vatExemptionText
      progressPercentage
    }
    customFields {
      key
      value
    }
    appearance {
      textColor
      headerTextColor
      headerBgColor
    }
    shipping {
      billShipping
      shippingAddress {
        fullName
        street
        city
        postalCode
        country
      }
      shippingAmountHT
      shippingVatRate
    }
    showBankDetails
    clientPositionRight
    isReverseCharge
    createdBy {
      id
      email
      profile {
        firstName
        lastName
      }
    }
    sourceQuote {
      id
      number
      prefix
    }
    linkedInvoices {
      id
      number
      status
      finalTotalTTC
    }
  }
`;

export const PURCHASE_ORDER_LIST_FRAGMENT = gql`
  fragment PurchaseOrderListFragment on PurchaseOrder {
    id
    number
    prefix
    status
    issueDate
    validUntil
    deliveryDate
    retenueGarantie
    escompte
    totalHT
    totalVAT
    totalTTC
    finalTotalHT
    finalTotalVAT
    finalTotalTTC
    isReverseCharge
    client {
      id
      name
      email
      hasDifferentShippingAddress
      shippingAddress {
        fullName
        street
        city
        postalCode
        country
      }
    }
    appearance {
      textColor
      headerTextColor
      headerBgColor
    }
    createdAt
    updatedAt
    sourceQuote {
      id
      number
      prefix
    }
    linkedInvoices {
      id
      number
      status
      finalTotalTTC
    }
  }
`;

// ==================== QUERIES ====================

export const GET_LAST_PURCHASE_ORDER_PREFIX = gql`
  query GetLastPurchaseOrderPrefix($workspaceId: ID!) {
    purchaseOrders(workspaceId: $workspaceId, limit: 1, page: 1) {
      purchaseOrders {
        prefix
      }
    }
  }
`;

export const GET_PURCHASE_ORDERS = gql`
  query GetPurchaseOrders(
    $workspaceId: ID!
    $startDate: String
    $endDate: String
    $status: PurchaseOrderStatus
    $search: String
    $page: Int
    $limit: Int
  ) {
    purchaseOrders(
      workspaceId: $workspaceId
      startDate: $startDate
      endDate: $endDate
      status: $status
      search: $search
      page: $page
      limit: $limit
    ) {
      purchaseOrders {
        ...PurchaseOrderListFragment
      }
      totalCount
      hasNextPage
    }
  }
  ${PURCHASE_ORDER_LIST_FRAGMENT}
`;

export const GET_PURCHASE_ORDER = gql`
  query GetPurchaseOrder($workspaceId: ID!, $id: ID!) {
    purchaseOrder(workspaceId: $workspaceId, id: $id) {
      ...PurchaseOrderFragment
    }
  }
  ${PURCHASE_ORDER_FRAGMENT}
`;

export const GET_PURCHASE_ORDER_STATS = gql`
  query GetPurchaseOrderStats($workspaceId: ID!) {
    purchaseOrderStats(workspaceId: $workspaceId) {
      totalCount
      draftCount
      confirmedCount
      inProgressCount
      deliveredCount
      canceledCount
      totalAmount
    }
  }
`;

export const GET_NEXT_PURCHASE_ORDER_NUMBER = gql`
  query GetNextPurchaseOrderNumber($workspaceId: ID!, $prefix: String) {
    nextPurchaseOrderNumber(workspaceId: $workspaceId, prefix: $prefix)
  }
`;

// ==================== MUTATIONS ====================

export const CREATE_PURCHASE_ORDER = gql`
  mutation CreatePurchaseOrder($workspaceId: ID!, $input: CreatePurchaseOrderInput!) {
    createPurchaseOrder(workspaceId: $workspaceId, input: $input) {
      ...PurchaseOrderFragment
    }
  }
  ${PURCHASE_ORDER_FRAGMENT}
`;

export const UPDATE_PURCHASE_ORDER = gql`
  mutation UpdatePurchaseOrder($id: ID!, $workspaceId: ID!, $input: UpdatePurchaseOrderInput!) {
    updatePurchaseOrder(id: $id, workspaceId: $workspaceId, input: $input) {
      ...PurchaseOrderFragment
    }
  }
  ${PURCHASE_ORDER_FRAGMENT}
`;

export const DELETE_PURCHASE_ORDER = gql`
  mutation DeletePurchaseOrder($id: ID!, $workspaceId: ID!) {
    deletePurchaseOrder(id: $id, workspaceId: $workspaceId)
  }
`;

export const CHANGE_PURCHASE_ORDER_STATUS = gql`
  mutation ChangePurchaseOrderStatus($id: ID!, $workspaceId: ID!, $status: PurchaseOrderStatus!) {
    changePurchaseOrderStatus(id: $id, workspaceId: $workspaceId, status: $status) {
      ...PurchaseOrderFragment
    }
  }
  ${PURCHASE_ORDER_FRAGMENT}
`;

export const CONVERT_QUOTE_TO_PURCHASE_ORDER = gql`
  mutation ConvertQuoteToPurchaseOrder($quoteId: ID!, $workspaceId: ID!) {
    convertQuoteToPurchaseOrder(quoteId: $quoteId, workspaceId: $workspaceId) {
      ...PurchaseOrderFragment
    }
  }
  ${PURCHASE_ORDER_FRAGMENT}
`;

export const CONVERT_PURCHASE_ORDER_TO_INVOICE = gql`
  mutation ConvertPurchaseOrderToInvoice($id: ID!, $workspaceId: ID!) {
    convertPurchaseOrderToInvoice(id: $id, workspaceId: $workspaceId) {
      id
      number
      prefix
      purchaseOrderNumber
      status
      finalTotalTTC
    }
  }
`;

export const SEND_PURCHASE_ORDER = gql`
  mutation SendPurchaseOrder($id: ID!, $workspaceId: ID!, $email: String!) {
    sendPurchaseOrder(id: $id, workspaceId: $workspaceId, email: $email)
  }
`;

// ==================== HOOKS PERSONNALISÉS ====================

import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import { useState, useMemo, useCallback } from "react";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useErrorHandler } from "@/src/hooks/useErrorHandler";

// Hook pour récupérer le dernier préfixe de bon de commande
export const useLastPurchaseOrderPrefix = () => {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error } = useQuery(GET_LAST_PURCHASE_ORDER_PREFIX, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "network-only",
    errorPolicy: "all",
  });

  return useMemo(
    () => ({
      prefix: data?.purchaseOrders?.purchaseOrders?.[0]?.prefix || null,
      loading,
      error,
    }),
    [data, loading, error]
  );
};

// Hook pour récupérer la liste des bons de commande
export const usePurchaseOrders = (filters = {}) => {
  const {
    workspaceId,
    loading: workspaceLoading,
    error: workspaceError,
  } = useRequiredWorkspace();
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, loading, error, fetchMore, refetch } = useQuery(GET_PURCHASE_ORDERS, {
    variables: {
      workspaceId,
      ...filters,
      page,
      limit,
    },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
  });

  const purchaseOrders = useMemo(() => data?.purchaseOrders?.purchaseOrders || [], [data]);
  const totalCount = data?.purchaseOrders?.totalCount || 0;
  const hasNextPage = data?.purchaseOrders?.hasNextPage || false;

  const loadMore = useCallback(() => {
    if (hasNextPage && !loading) {
      fetchMore({
        variables: {
          page: page + 1,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          setPage(page + 1);
          return {
            purchaseOrders: {
              ...fetchMoreResult.purchaseOrders,
              purchaseOrders: [
                ...prev.purchaseOrders.purchaseOrders,
                ...fetchMoreResult.purchaseOrders.purchaseOrders,
              ],
            },
          };
        },
      });
    }
  }, [hasNextPage, loading, fetchMore, page]);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    purchaseOrders,
    totalCount,
    hasNextPage,
    loading: (workspaceLoading && !workspaceId) || (loading && !purchaseOrders.length),
    error: error || workspaceError,
    loadMore,
    refetch,
    resetPage,
  };
};

// Hook pour récupérer un bon de commande spécifique
export const usePurchaseOrder = (id) => {
  const {
    workspaceId,
    loading: workspaceLoading,
    error: workspaceError,
  } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_PURCHASE_ORDER, {
    variables: { workspaceId, id },
    skip: !id || !workspaceId,
    fetchPolicy: "network-only",
    errorPolicy: "all",
  });

  return {
    purchaseOrder: data?.purchaseOrder,
    loading: (workspaceLoading && !workspaceId) || (loading && !data?.purchaseOrder),
    error: error || workspaceError,
    refetch,
  };
};

// Hook pour les statistiques des bons de commande
export const usePurchaseOrderStats = () => {
  const {
    workspaceId,
    loading: workspaceLoading,
    error: workspaceError,
  } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_PURCHASE_ORDER_STATS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "network-only",
    errorPolicy: "all",
  });

  return {
    stats: data?.purchaseOrderStats,
    loading:
      (workspaceLoading && !workspaceId) || (loading && !data?.purchaseOrderStats),
    error: error || workspaceError,
    refetch,
  };
};

// Hook pour récupérer le prochain numéro de bon de commande
export function useNextPurchaseOrderNumber(prefix, options = {}) {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error } = useQuery(GET_NEXT_PURCHASE_ORDER_NUMBER, {
    variables: { workspaceId, prefix },
    skip: !workspaceId,
    ...options,
  });

  return {
    nextNumber: data?.nextPurchaseOrderNumber,
    loading,
    error,
  };
}

// Hook pour créer un bon de commande
export const useCreatePurchaseOrder = () => {
  const { workspaceId } = useRequiredWorkspace();
  const { handleMutationError } = useErrorHandler();

  const [createMutation, { loading }] = useMutation(CREATE_PURCHASE_ORDER, {
    refetchQueries: [
      { query: GET_PURCHASE_ORDERS, variables: { workspaceId } },
      { query: GET_PURCHASE_ORDER_STATS, variables: { workspaceId } },
    ],
    awaitRefetchQueries: true,
    onError: (error) => {
      handleMutationError(error, "create", "purchaseOrder");
    },
  });

  const createPurchaseOrder = async (input) => {
    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }

    try {
      const result = await createMutation({
        variables: { workspaceId, input },
      });
      return result.data.createPurchaseOrder;
    } catch (error) {
      throw error;
    }
  };

  return { createPurchaseOrder, loading };
};

// Hook pour mettre à jour un bon de commande
export const useUpdatePurchaseOrder = () => {
  const { workspaceId } = useRequiredWorkspace();
  const client = useApolloClient();

  const [updateMutation, { loading }] = useMutation(UPDATE_PURCHASE_ORDER, {
    onCompleted: (data) => {
      client.writeQuery({
        query: GET_PURCHASE_ORDER,
        variables: { workspaceId, id: data.updatePurchaseOrder.id },
        data: { purchaseOrder: data.updatePurchaseOrder },
      });
      client.refetchQueries({
        include: [GET_PURCHASE_ORDER_STATS],
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour du bon de commande:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du bon de commande");
    },
  });

  const updatePurchaseOrder = async (id, input) => {
    try {
      const result = await updateMutation({
        variables: { id, workspaceId, input },
      });
      return result.data.updatePurchaseOrder;
    } catch (error) {
      throw error;
    }
  };

  return { updatePurchaseOrder, loading };
};

// Hook pour supprimer un bon de commande
export const useDeletePurchaseOrder = () => {
  const { workspaceId } = useRequiredWorkspace();
  const client = useApolloClient();

  const [deleteMutation, { loading }] = useMutation(DELETE_PURCHASE_ORDER, {
    onError: (error) => {
      console.error("Erreur lors de la suppression du bon de commande:", error);
      toast.error(error.message || "Erreur lors de la suppression du bon de commande");
    },
  });

  const deletePurchaseOrder = async (id) => {
    try {
      await deleteMutation({
        variables: { id, workspaceId },
      });
      client.refetchQueries({
        include: [GET_PURCHASE_ORDERS, GET_PURCHASE_ORDER_STATS],
      });
      return true;
    } catch (error) {
      throw error;
    }
  };

  return { deletePurchaseOrder, loading };
};

// Hook pour changer le statut d'un bon de commande
export const useChangePurchaseOrderStatus = () => {
  const { workspaceId } = useRequiredWorkspace();
  const client = useApolloClient();

  const [changeStatusMutation, { loading }] = useMutation(CHANGE_PURCHASE_ORDER_STATUS, {
    onCompleted: (data) => {
      client.writeQuery({
        query: GET_PURCHASE_ORDER,
        variables: { workspaceId, id: data.changePurchaseOrderStatus.id },
        data: { purchaseOrder: data.changePurchaseOrderStatus },
      });
      client.refetchQueries({
        include: [GET_PURCHASE_ORDER_STATS],
      });
    },
    onError: (error) => {
      console.error("Erreur lors du changement de statut:", error);
      toast.error(error.message || "Erreur lors du changement de statut");
    },
  });

  const changeStatus = async (id, status) => {
    try {
      const result = await changeStatusMutation({
        variables: { id, workspaceId, status },
      });
      return result.data.changePurchaseOrderStatus;
    } catch (error) {
      throw error;
    }
  };

  return { changeStatus, loading };
};

// Hook pour convertir un devis en bon de commande
export const useConvertQuoteToPurchaseOrder = () => {
  const { workspaceId } = useRequiredWorkspace();
  const client = useApolloClient();

  const [convertMutation, { loading }] = useMutation(CONVERT_QUOTE_TO_PURCHASE_ORDER, {
    onCompleted: () => {
      client.refetchQueries({
        include: [
          GET_PURCHASE_ORDERS,
          GET_PURCHASE_ORDER_STATS,
          "GetQuotes",
          "GetQuoteStats",
        ],
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la conversion:", error);
      console.error("Détails networkError:", error.networkError?.result);
      console.error("Détails graphQLErrors:", error.graphQLErrors);
      toast.error(error.message || "Erreur lors de la conversion en bon de commande");
    },
  });

  const convertToPurchaseOrder = async (quoteId) => {
    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }
    console.log("DEBUG convertToPurchaseOrder - quoteId:", quoteId, "workspaceId:", workspaceId);
    try {
      const result = await convertMutation({
        variables: { quoteId, workspaceId },
      });
      return result.data.convertQuoteToPurchaseOrder;
    } catch (error) {
      throw error;
    }
  };

  return { convertToPurchaseOrder, loading };
};

// Hook pour convertir un bon de commande en facture
export const useConvertPurchaseOrderToInvoice = () => {
  const { workspaceId } = useRequiredWorkspace();
  const client = useApolloClient();

  const [convertMutation, { loading }] = useMutation(CONVERT_PURCHASE_ORDER_TO_INVOICE, {
    onCompleted: () => {
      client.refetchQueries({
        include: [
          GET_PURCHASE_ORDERS,
          GET_PURCHASE_ORDER_STATS,
          "GetInvoices",
          "GetInvoiceStats",
        ],
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la conversion:", error);
      toast.error(error.message || "Erreur lors de la conversion en facture");
    },
  });

  const convertToInvoice = async (id) => {
    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }
    try {
      const result = await convertMutation({
        variables: { id, workspaceId },
      });
      return result.data.convertPurchaseOrderToInvoice;
    } catch (error) {
      throw error;
    }
  };

  return { convertToInvoice, loading };
};

// Hook pour envoyer un bon de commande par email
export const useSendPurchaseOrder = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [sendMutation, { loading }] = useMutation(SEND_PURCHASE_ORDER, {
    onCompleted: () => {
      toast.success("Bon de commande envoyé avec succès");
    },
    onError: (error) => {
      console.error("Erreur lors de l'envoi du bon de commande:", error);
      toast.error(error.message || "Erreur lors de l'envoi du bon de commande");
    },
  });

  const sendPurchaseOrder = async (id, email) => {
    try {
      await sendMutation({
        variables: { id, workspaceId, email },
      });
      return true;
    } catch (error) {
      throw error;
    }
  };

  return { sendPurchaseOrder, loading };
};

// ==================== CONSTANTES ====================

export const PURCHASE_ORDER_STATUS = {
  DRAFT: "DRAFT",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  DELIVERED: "DELIVERED",
  CANCELED: "CANCELED",
};

// Libellés pour l'affichage
export const PURCHASE_ORDER_STATUS_LABELS = {
  [PURCHASE_ORDER_STATUS.DRAFT]: "Brouillon",
  [PURCHASE_ORDER_STATUS.CONFIRMED]: "Confirmé",
  [PURCHASE_ORDER_STATUS.IN_PROGRESS]: "En cours",
  [PURCHASE_ORDER_STATUS.DELIVERED]: "Livré",
  [PURCHASE_ORDER_STATUS.CANCELED]: "Annulé",
};

// Couleurs pour les statuts
export const PURCHASE_ORDER_STATUS_COLORS = {
  [PURCHASE_ORDER_STATUS.DRAFT]: "bg-gray-100 text-gray-800 border-gray-200",
  [PURCHASE_ORDER_STATUS.CONFIRMED]: "bg-blue-100 text-blue-800 border-blue-200",
  [PURCHASE_ORDER_STATUS.IN_PROGRESS]: "bg-orange-100 text-orange-800 border-orange-200",
  [PURCHASE_ORDER_STATUS.DELIVERED]: "bg-green-50 text-green-600 border-green-200",
  [PURCHASE_ORDER_STATUS.CANCELED]: "bg-red-100 text-red-800 border-red-200",
};
