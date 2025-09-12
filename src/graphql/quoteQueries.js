import { gql } from "@apollo/client";

// ==================== FRAGMENTS ====================

export const QUOTE_FRAGMENT = gql`
  fragment QuoteFragment on Quote {
    id
    number
    prefix
    status
    issueDate
    validUntil
    headerNotes
    footerNotes
    termsAndConditions
    termsAndConditionsLinkTitle
    termsAndConditionsLink
    discount
    discountType
    totalHT
    totalTTC
    totalVAT
    finalTotalHT
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
    showBankDetails
    createdBy {
      id
      email
      profile {
        firstName
        lastName
      }
    }
    convertedToInvoice {
      id
      number
    }
    linkedInvoices {
      id
      number
      status
      finalTotalTTC
      isDeposit
    }
  }
`;

export const QUOTE_LIST_FRAGMENT = gql`
  fragment QuoteListFragment on Quote {
    id
    number
    prefix
    status
    issueDate
    validUntil
    finalTotalTTC
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
    convertedToInvoice {
      id
      number
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

export const GET_QUOTES = gql`
  query GetQuotes(
    $workspaceId: ID!
    $startDate: String
    $endDate: String
    $status: QuoteStatus
    $search: String
    $page: Int
    $limit: Int
  ) {
    quotes(
      workspaceId: $workspaceId
      startDate: $startDate
      endDate: $endDate
      status: $status
      search: $search
      page: $page
      limit: $limit
    ) {
      quotes {
        ...QuoteListFragment
      }
      totalCount
      hasNextPage
    }
  }
  ${QUOTE_LIST_FRAGMENT}
`;

export const GET_QUOTE = gql`
  query GetQuote($workspaceId: ID!, $id: ID!) {
    quote(workspaceId: $workspaceId, id: $id) {
      ...QuoteFragment
    }
  }
  ${QUOTE_FRAGMENT}
`;

export const GET_QUOTE_STATS = gql`
  query GetQuoteStats($workspaceId: ID!) {
    quoteStats(workspaceId: $workspaceId) {
      totalCount
      draftCount
      pendingCount
      acceptedCount
      rejectedCount
      expiredCount
      totalAmount
    }
  }
`;

export const GET_NEXT_QUOTE_NUMBER = gql`
  query GetNextQuoteNumber($workspaceId: ID!, $prefix: String) {
    nextQuoteNumber(workspaceId: $workspaceId, prefix: $prefix)
  }
`;

// ==================== MUTATIONS ====================

export const CREATE_QUOTE = gql`
  mutation CreateQuote($workspaceId: ID!, $input: CreateQuoteInput!) {
    createQuote(workspaceId: $workspaceId, input: $input) {
      ...QuoteFragment
    }
  }
  ${QUOTE_FRAGMENT}
`;

export const UPDATE_QUOTE = gql`
  mutation UpdateQuote($id: ID!, $input: UpdateQuoteInput!) {
    updateQuote(id: $id, input: $input) {
      ...QuoteFragment
    }
  }
  ${QUOTE_FRAGMENT}
`;

export const DELETE_QUOTE = gql`
  mutation DeleteQuote($id: ID!) {
    deleteQuote(id: $id)
  }
`;

export const SEND_QUOTE = gql`
  mutation SendQuote($id: ID!, $email: String!) {
    sendQuote(id: $id, email: $email)
  }
`;

export const CHANGE_QUOTE_STATUS = gql`
  mutation ChangeQuoteStatus($id: ID!, $status: QuoteStatus!) {
    changeQuoteStatus(id: $id, status: $status) {
      ...QuoteFragment
    }
  }
  ${QUOTE_FRAGMENT}
`;

export const CONVERT_QUOTE_TO_INVOICE = gql`
  mutation ConvertQuoteToInvoice(
    $id: ID!
    $distribution: [Float]
    $isDeposit: Boolean
    $skipValidation: Boolean
  ) {
    convertQuoteToInvoice(
      id: $id
      distribution: $distribution
      isDeposit: $isDeposit
      skipValidation: $skipValidation
    ) {
      id
      number
      purchaseOrderNumber
      status
      finalTotalTTC
    }
  }
`;

// ==================== HOOKS PERSONNALISÉS ====================

import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import { useState, useMemo, useCallback } from "react";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

// Hook optimisé pour récupérer la liste des devis
export const useQuotes = (filters = {}) => {
  const {
    workspaceId,
    loading: workspaceLoading,
    error: workspaceError,
  } = useRequiredWorkspace();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, loading, error, fetchMore, refetch } = useQuery(GET_QUOTES, {
    variables: {
      workspaceId,
      ...filters,
      page,
      limit,
    },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  const quotes = useMemo(() => data?.quotes?.quotes || [], [data]);
  const totalCount = data?.quotes?.totalCount || 0;
  const hasNextPage = data?.quotes?.hasNextPage || false;

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
            quotes: {
              ...fetchMoreResult.quotes,
              quotes: [...prev.quotes.quotes, ...fetchMoreResult.quotes.quotes],
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
    quotes,
    totalCount,
    hasNextPage,
    loading: loading || workspaceLoading,
    error: error || workspaceError,
    loadMore,
    refetch,
    resetPage,
  };
};

// Hook pour récupérer un devis spécifique
export const useQuote = (id) => {
  const {
    workspaceId,
    loading: workspaceLoading,
    error: workspaceError,
  } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_QUOTE, {
    variables: { workspaceId, id },
    skip: !id || !workspaceId,
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  return {
    quote: data?.quote,
    loading: loading || workspaceLoading,
    error: error || workspaceError,
    refetch,
  };
};

// Hook pour les statistiques des devis
export const useQuoteStats = () => {
  const {
    workspaceId,
    loading: workspaceLoading,
    error: workspaceError,
  } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_QUOTE_STATS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  return {
    stats: data?.quoteStats,
    loading: loading || workspaceLoading,
    error: error || workspaceError,
    refetch,
  };
};

// Hook pour récupérer le prochain numéro de devis
export function useNextQuoteNumber(prefix, options = {}) {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error } = useQuery(GET_NEXT_QUOTE_NUMBER, {
    variables: { workspaceId, prefix },
    skip: !workspaceId,
    ...options,
  });

  return {
    nextNumber: data?.nextQuoteNumber,
    loading,
    error,
  };
}

// Hook pour créer un devis
export const useCreateQuote = () => {
  const client = useApolloClient();
  const { workspaceId } = useRequiredWorkspace();

  const [createQuoteMutation, { loading }] = useMutation(CREATE_QUOTE, {
    onCompleted: () => {
      // toast.success("Devis créé avec succès");
      // Invalider le cache des listes
      client.refetchQueries({
        include: [GET_QUOTES, GET_QUOTE_STATS],
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la création du devis:", error);
      toast.error(error.message || "Erreur lors de la création du devis");
    },
  });

  const createQuote = async (input) => {
    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }

    try {
      const result = await createQuoteMutation({
        variables: { workspaceId, input },
      });
      return result.data.createQuote;
    } catch (error) {
      throw error;
    }
  };

  return { createQuote, loading };
};

// Hook pour mettre à jour un devis
export const useUpdateQuote = () => {
  const client = useApolloClient();

  const [updateQuoteMutation, { loading }] = useMutation(UPDATE_QUOTE, {
    onCompleted: (data) => {
      toast.success("Devis mis à jour avec succès");
      // Mettre à jour le cache
      client.writeQuery({
        query: GET_QUOTE,
        variables: { id: data.updateQuote.id },
        data: { quote: data.updateQuote },
      });
      // Invalider les statistiques
      client.refetchQueries({
        include: [GET_QUOTE_STATS],
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour du devis:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du devis");
    },
  });

  const updateQuote = async (id, input) => {
    try {
      const result = await updateQuoteMutation({
        variables: { id, input },
      });
      return result.data.updateQuote;
    } catch (error) {
      throw error;
    }
  };

  return { updateQuote, loading };
};

// Hook pour supprimer un devis
export const useDeleteQuote = () => {
  const client = useApolloClient();

  const [deleteQuoteMutation, { loading }] = useMutation(DELETE_QUOTE, {
    onCompleted: () => {
      toast.success("Devis supprimé avec succès");
      // Invalider le cache
      client.refetchQueries({
        include: [GET_QUOTES, GET_QUOTE_STATS],
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression du devis:", error);
      toast.error(error.message || "Erreur lors de la suppression du devis");
    },
  });

  const deleteQuote = async (id) => {
    try {
      await deleteQuoteMutation({
        variables: { id },
      });
      return true;
    } catch (error) {
      throw error;
    }
  };

  return { deleteQuote, loading };
};

// Hook pour envoyer un devis par email
export const useSendQuote = () => {
  const [sendQuoteMutation, { loading }] = useMutation(SEND_QUOTE, {
    onCompleted: () => {
      toast.success("Devis envoyé avec succès");
    },
    onError: (error) => {
      console.error("Erreur lors de l'envoi du devis:", error);
      toast.error(error.message || "Erreur lors de l'envoi du devis");
    },
  });

  const sendQuote = async (id, email) => {
    try {
      await sendQuoteMutation({
        variables: { id, email },
      });
      return true;
    } catch (error) {
      throw error;
    }
  };

  return { sendQuote, loading };
};

// Hook pour changer le statut d'un devis
export const useChangeQuoteStatus = () => {
  const client = useApolloClient();

  const [changeStatusMutation, { loading }] = useMutation(CHANGE_QUOTE_STATUS, {
    onCompleted: (data) => {
      toast.success("Statut du devis mis à jour");
      // Mettre à jour le cache
      client.writeQuery({
        query: GET_QUOTE,
        variables: { id: data.changeQuoteStatus.id },
        data: { quote: data.changeQuoteStatus },
      });
      // Invalider les statistiques
      client.refetchQueries({
        include: [GET_QUOTE_STATS],
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
        variables: { id, status },
      });
      return result.data.changeQuoteStatus;
    } catch (error) {
      throw error;
    }
  };

  return { changeStatus, loading };
};

// Hook pour convertir un devis en facture
export const useConvertQuoteToInvoice = () => {
  const client = useApolloClient();

  const [convertMutation, { loading }] = useMutation(CONVERT_QUOTE_TO_INVOICE, {
    onCompleted: (data) => {
      toast.success(
        `Devis converti en facture ${data.convertQuoteToInvoice.number}`
      );
      // Invalider les caches
      client.refetchQueries({
        include: [
          GET_QUOTES,
          GET_QUOTE_STATS,
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

  const convertToInvoice = async (id, options = {}) => {
    try {
      const result = await convertMutation({
        variables: {
          id,
          distribution: options.distribution,
          isDeposit: options.isDeposit || false,
          skipValidation: options.skipValidation || false,
        },
      });
      return result.data.convertQuoteToInvoice;
    } catch (error) {
      throw error;
    }
  };

  return { convertToInvoice, loading };
};

// ==================== CONSTANTES ====================

export const QUOTE_STATUS = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
};

export const DISCOUNT_TYPE = {
  FIXED: "FIXED",
  PERCENTAGE: "PERCENTAGE",
};

export const CLIENT_TYPE = {
  INDIVIDUAL: "INDIVIDUAL",
  COMPANY: "COMPANY",
};

// Libellés pour l'affichage
export const QUOTE_STATUS_LABELS = {
  [QUOTE_STATUS.DRAFT]: "Brouillon",
  [QUOTE_STATUS.PENDING]: "En attente",
  [QUOTE_STATUS.COMPLETED]: "Accepté",
  [QUOTE_STATUS.CANCELED]: "Annulé",
};

export const DISCOUNT_TYPE_LABELS = {
  [DISCOUNT_TYPE.FIXED]: "Montant fixe",
  [DISCOUNT_TYPE.PERCENTAGE]: "Pourcentage",
};

export const CLIENT_TYPE_LABELS = {
  [CLIENT_TYPE.INDIVIDUAL]: "Particulier",
  [CLIENT_TYPE.COMPANY]: "Entreprise",
};

// Couleurs pour les statuts
export const QUOTE_STATUS_COLORS = {
  [QUOTE_STATUS.DRAFT]: "bg-gray-100 text-gray-800 border-gray-200",
  [QUOTE_STATUS.PENDING]: "bg-blue-100 text-blue-800 border-blue-200",
  [QUOTE_STATUS.COMPLETED]: "bg-green-100 text-green-800 border-green-200",
  [QUOTE_STATUS.CANCELED]: "bg-red-100 text-red-800 border-red-200",
};
