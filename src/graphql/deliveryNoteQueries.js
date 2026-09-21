import { gql } from "@apollo/client";

// ==================== FRAGMENTS ====================

// Un bon de livraison ne porte AUCUN montant : pas de prix, pas de TVA.
export const DELIVERY_NOTE_FRAGMENT = gql`
  fragment DeliveryNoteFragment on DeliveryNote {
    id
    number
    prefix
    status
    issueDate
    deliveryDate
    carrier
    trackingNumber
    notes
    receivedBy
    receivedAt
    signatureDataUrl
    headerNotes
    footerNotes
    termsAndConditions
    termsAndConditionsLinkTitle
    termsAndConditionsLink
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
      isInternational
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
    deliveryAddress {
      fullName
      street
      city
      postalCode
      country
    }
    companyInfo {
      name
      commercialName
      professionalTitle
      regulatoryBody
      professionalNumber
      decennialInsurance
      professionalLiabilityInsurance
      email
      phone
      website
      logo
      siren
      siret
      vatNumber
      transactionCategory
      vatPaymentCondition
      vatFranchise
      companyStatus
      capitalSocial
      rcs
      address {
        street
        city
        postalCode
        country
      }
    }
    items {
      description
      details
      reference
      productId
      quantity
      orderedQuantity
      deliveredQuantity
      unit
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
    clientPositionRight
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
      status
      finalTotalTTC
    }
    sourceInvoice {
      id
      number
      prefix
      status
      finalTotalTTC
    }
    linkedInvoices {
      id
      prefix
      number
      status
      finalTotalTTC
    }
    emailTracking {
      emailSentAt
      emailOpenedAt
      emailOpenCount
      emailClickedAt
      emailClickCount
    }
  }
`;

export const DELIVERY_NOTE_LIST_FRAGMENT = gql`
  fragment DeliveryNoteListFragment on DeliveryNote {
    id
    number
    prefix
    status
    issueDate
    deliveryDate
    carrier
    trackingNumber
    receivedBy
    receivedAt
    items {
      description
      details
      reference
      productId
      quantity
      orderedQuantity
      deliveredQuantity
      unit
    }
    client {
      id
      name
      email
      type
      firstName
      lastName
      address {
        street
        city
        postalCode
        country
      }
      hasDifferentShippingAddress
      shippingAddress {
        fullName
        street
        city
        postalCode
        country
      }
    }
    deliveryAddress {
      fullName
      street
      city
      postalCode
      country
    }
    createdAt
    updatedAt
    sourceQuote {
      id
      number
      prefix
      status
      finalTotalTTC
    }
    sourceInvoice {
      id
      number
      prefix
      status
      finalTotalTTC
    }
    linkedInvoices {
      id
      prefix
      number
      status
      finalTotalTTC
    }
    emailTracking {
      emailSentAt
      emailOpenedAt
      emailOpenCount
      emailClickedAt
      emailClickCount
    }
  }
`;

// ==================== QUERIES ====================

export const GET_DELIVERY_NOTES = gql`
  query GetDeliveryNotes(
    $workspaceId: ID!
    $startDate: String
    $endDate: String
    $status: DeliveryNoteStatus
    $search: String
    $page: Int
    $limit: Int
  ) {
    deliveryNotes(
      workspaceId: $workspaceId
      startDate: $startDate
      endDate: $endDate
      status: $status
      search: $search
      page: $page
      limit: $limit
    ) {
      deliveryNotes {
        ...DeliveryNoteListFragment
      }
      totalCount
      hasNextPage
    }
  }
  ${DELIVERY_NOTE_LIST_FRAGMENT}
`;

export const GET_DELIVERY_NOTE = gql`
  query GetDeliveryNote($workspaceId: ID!, $id: ID!) {
    deliveryNote(workspaceId: $workspaceId, id: $id) {
      ...DeliveryNoteFragment
    }
  }
  ${DELIVERY_NOTE_FRAGMENT}
`;

export const GET_DELIVERY_NOTE_STATS = gql`
  query GetDeliveryNoteStats($workspaceId: ID!) {
    deliveryNoteStats(workspaceId: $workspaceId) {
      totalCount
      draftCount
      pendingCount
      shippedCount
      deliveredCount
      canceledCount
    }
  }
`;

export const GET_LAST_DELIVERY_NOTE_PREFIX = gql`
  query GetLastDeliveryNotePrefix($workspaceId: ID!) {
    deliveryNotes(workspaceId: $workspaceId, limit: 1, page: 1) {
      deliveryNotes {
        prefix
      }
    }
  }
`;

export const NEXT_DELIVERY_NUMBER = gql`
  query NextDeliveryNumber(
    $workspaceId: ID!
    $prefix: String
    $autoNumbering: Boolean
  ) {
    nextDeliveryNumber(
      workspaceId: $workspaceId
      prefix: $prefix
      autoNumbering: $autoNumbering
    )
  }
`;

export const CHECK_DELIVERY_NUMBER_EXISTS = gql`
  query CheckDeliveryNumberExists(
    $workspaceId: ID!
    $number: String!
    $prefix: String!
    $excludeId: ID
  ) {
    checkDeliveryNumberExists(
      workspaceId: $workspaceId
      number: $number
      prefix: $prefix
      excludeId: $excludeId
    )
  }
`;

// Aperçu : URL de la route backend qui streame le PDF archivé
export const DELIVERY_NOTE_DOCUMENT_URL = gql`
  query DeliveryNoteDocumentUrl($workspaceId: ID!, $deliveryNoteId: ID!) {
    deliveryNoteDocumentUrl(
      workspaceId: $workspaceId
      deliveryNoteId: $deliveryNoteId
    )
  }
`;

// ==================== MUTATIONS ====================

export const CREATE_DELIVERY_NOTE = gql`
  mutation CreateDeliveryNote(
    $workspaceId: ID!
    $input: CreateDeliveryNoteInput!
  ) {
    createDeliveryNote(workspaceId: $workspaceId, input: $input) {
      ...DeliveryNoteFragment
    }
  }
  ${DELIVERY_NOTE_FRAGMENT}
`;

export const UPDATE_DELIVERY_NOTE = gql`
  mutation UpdateDeliveryNote(
    $id: ID!
    $workspaceId: ID!
    $input: UpdateDeliveryNoteInput!
  ) {
    updateDeliveryNote(id: $id, workspaceId: $workspaceId, input: $input) {
      ...DeliveryNoteFragment
    }
  }
  ${DELIVERY_NOTE_FRAGMENT}
`;

export const DELETE_DELIVERY_NOTE = gql`
  mutation DeleteDeliveryNote($id: ID!, $workspaceId: ID!) {
    deleteDeliveryNote(id: $id, workspaceId: $workspaceId)
  }
`;

export const CHANGE_DELIVERY_NOTE_STATUS = gql`
  mutation ChangeDeliveryNoteStatus(
    $id: ID!
    $workspaceId: ID!
    $status: DeliveryNoteStatus!
  ) {
    changeDeliveryNoteStatus(
      id: $id
      workspaceId: $workspaceId
      status: $status
    ) {
      ...DeliveryNoteFragment
    }
  }
  ${DELIVERY_NOTE_FRAGMENT}
`;

export const RECORD_DELIVERY_NOTE_RECEPTION = gql`
  mutation RecordDeliveryNoteReception(
    $id: ID!
    $workspaceId: ID!
    $input: DeliveryNoteReceptionInput!
  ) {
    recordDeliveryNoteReception(
      id: $id
      workspaceId: $workspaceId
      input: $input
    ) {
      ...DeliveryNoteFragment
    }
  }
  ${DELIVERY_NOTE_FRAGMENT}
`;

export const SEND_DELIVERY_NOTE = gql`
  mutation SendDeliveryNote($id: ID!, $workspaceId: ID!, $email: String!) {
    sendDeliveryNote(id: $id, workspaceId: $workspaceId, email: $email)
  }
`;

// Archive le PDF du bon de livraison (généré côté frontend) sur R2
export const ARCHIVE_DELIVERY_NOTE_PDF = gql`
  mutation ArchiveDeliveryNotePdf(
    $workspaceId: ID!
    $deliveryNoteId: ID!
    $file: Upload!
  ) {
    archiveDeliveryNotePdf(
      workspaceId: $workspaceId
      deliveryNoteId: $deliveryNoteId
      file: $file
    ) {
      id
      archivedPdfKey
      archivedPdfStoredAt
    }
  }
`;

export const CREATE_DELIVERY_NOTE_FROM_QUOTE = gql`
  mutation CreateDeliveryNoteFromQuote($quoteId: ID!, $workspaceId: ID!) {
    createDeliveryNoteFromQuote(quoteId: $quoteId, workspaceId: $workspaceId) {
      ...DeliveryNoteFragment
    }
  }
  ${DELIVERY_NOTE_FRAGMENT}
`;

export const CREATE_DELIVERY_NOTE_FROM_INVOICE = gql`
  mutation CreateDeliveryNoteFromInvoice($invoiceId: ID!, $workspaceId: ID!) {
    createDeliveryNoteFromInvoice(
      invoiceId: $invoiceId
      workspaceId: $workspaceId
    ) {
      ...DeliveryNoteFragment
    }
  }
  ${DELIVERY_NOTE_FRAGMENT}
`;

export const CREATE_INVOICE_FROM_DELIVERY_NOTE = gql`
  mutation CreateInvoiceFromDeliveryNote(
    $deliveryNoteId: ID!
    $workspaceId: ID!
  ) {
    createInvoiceFromDeliveryNote(
      deliveryNoteId: $deliveryNoteId
      workspaceId: $workspaceId
    ) {
      id
      number
      prefix
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

// Hook pour récupérer le dernier préfixe de bon de livraison
export const useLastDeliveryNotePrefix = () => {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error } = useQuery(GET_LAST_DELIVERY_NOTE_PREFIX, {
    variables: { workspaceId },
    skip: !workspaceId,
    errorPolicy: "all",
  });

  return useMemo(
    () => ({
      prefix: data?.deliveryNotes?.deliveryNotes?.[0]?.prefix || null,
      loading,
      error,
    }),
    [data, loading, error],
  );
};

// Hook pour récupérer la liste des bons de livraison
export const useDeliveryNotes = (filters = {}) => {
  const {
    workspaceId,
    loading: workspaceLoading,
    error: workspaceError,
  } = useRequiredWorkspace();
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, loading, error, fetchMore, refetch } = useQuery(
    GET_DELIVERY_NOTES,
    {
      variables: {
        workspaceId,
        ...filters,
        page,
        limit,
      },
      skip: !workspaceId,
      errorPolicy: "all",
      fetchPolicy: "cache-and-network",
    },
  );

  const deliveryNotes = useMemo(
    () => data?.deliveryNotes?.deliveryNotes || [],
    [data],
  );
  const totalCount = data?.deliveryNotes?.totalCount || 0;
  const hasNextPage = data?.deliveryNotes?.hasNextPage || false;

  const loadMore = useCallback(() => {
    if (hasNextPage && !loading) {
      fetchMore({
        variables: { page: page + 1 },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          setPage(page + 1);
          return {
            deliveryNotes: {
              ...fetchMoreResult.deliveryNotes,
              deliveryNotes: [
                ...prev.deliveryNotes.deliveryNotes,
                ...fetchMoreResult.deliveryNotes.deliveryNotes,
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
    deliveryNotes,
    totalCount,
    hasNextPage,
    loading:
      (workspaceLoading && !workspaceId) || (loading && !deliveryNotes.length),
    error: error || workspaceError,
    loadMore,
    refetch,
    resetPage,
  };
};

// Hook pour récupérer un bon de livraison spécifique
export const useDeliveryNote = (id) => {
  const {
    workspaceId,
    loading: workspaceLoading,
    error: workspaceError,
  } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_DELIVERY_NOTE, {
    variables: { workspaceId, id },
    skip: !id || !workspaceId,
    errorPolicy: "all",
    fetchPolicy: "network-only",
  });

  return {
    deliveryNote: data?.deliveryNote,
    loading:
      (workspaceLoading && !workspaceId) || (loading && !data?.deliveryNote),
    error: error || workspaceError,
    refetch,
  };
};

// Hook pour les statistiques des bons de livraison
export const useDeliveryNoteStats = () => {
  const {
    workspaceId,
    loading: workspaceLoading,
    error: workspaceError,
  } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_DELIVERY_NOTE_STATS, {
    variables: { workspaceId },
    skip: !workspaceId,
    errorPolicy: "all",
  });

  return {
    stats: data?.deliveryNoteStats,
    loading:
      (workspaceLoading && !workspaceId) ||
      (loading && !data?.deliveryNoteStats),
    error: error || workspaceError,
    refetch,
  };
};

// Hook pour récupérer le prochain numéro de bon de livraison
export function useNextDeliveryNumber(prefix, options = {}) {
  const { workspaceId } = useRequiredWorkspace();

  const { skip: skipOption, ...queryOptions } = options;
  const { data, loading, error } = useQuery(NEXT_DELIVERY_NUMBER, {
    variables: { workspaceId, prefix },
    fetchPolicy: "network-only",
    ...queryOptions,
    skip: !workspaceId || !!skipOption,
  });

  return {
    nextNumber: data?.nextDeliveryNumber,
    loading,
    error,
  };
}

// Hook pour vérifier si un numéro de bon de livraison existe déjà
export const useCheckDeliveryNumber = () => {
  const { workspaceId } = useRequiredWorkspace();
  const client = useApolloClient();

  const checkDeliveryNumber = useCallback(
    async (number, prefix, excludeId = null) => {
      if (!number || !workspaceId) {
        return { exists: false, deliveryNote: null };
      }
      try {
        const { data } = await client.query({
          query: CHECK_DELIVERY_NUMBER_EXISTS,
          variables: {
            workspaceId,
            number: String(number),
            prefix: prefix || "",
            excludeId: excludeId || undefined,
          },
          fetchPolicy: "network-only",
        });
        return {
          exists: !!data?.checkDeliveryNumberExists,
          deliveryNote: null,
        };
      } catch (error) {
        console.error(
          "Erreur lors de la vérification du numéro de bon de livraison:",
          error,
        );
        return { exists: false, deliveryNote: null };
      }
    },
    [workspaceId, client],
  );

  return { checkDeliveryNumber };
};

// Hook pour créer un bon de livraison
export const useCreateDeliveryNote = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [createMutation, { loading }] = useMutation(CREATE_DELIVERY_NOTE, {
    refetchQueries: [
      { query: GET_DELIVERY_NOTES, variables: { workspaceId } },
      { query: GET_DELIVERY_NOTE_STATS, variables: { workspaceId } },
    ],
    awaitRefetchQueries: true,
    // onError désactivé : les erreurs sont gérées par les composants appelants
    // (sinon Apollo résout la promesse et une création échouée passe pour un succès).
  });

  const createDeliveryNote = async (input) => {
    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }
    const result = await createMutation({ variables: { workspaceId, input } });
    return result.data?.createDeliveryNote;
  };

  return { createDeliveryNote, loading };
};

// Hook pour mettre à jour un bon de livraison
export const useUpdateDeliveryNote = () => {
  const { workspaceId } = useRequiredWorkspace();
  const client = useApolloClient();

  const [updateMutation, { loading }] = useMutation(UPDATE_DELIVERY_NOTE, {
    onCompleted: (data) => {
      client.writeQuery({
        query: GET_DELIVERY_NOTE,
        variables: { workspaceId, id: data.updateDeliveryNote.id },
        data: { deliveryNote: data.updateDeliveryNote },
      });
    },
  });

  const updateDeliveryNote = async (id, input) => {
    const result = await updateMutation({
      variables: { id, workspaceId, input },
    });
    return result.data?.updateDeliveryNote;
  };

  return { updateDeliveryNote, loading };
};

// Hook pour supprimer un bon de livraison
export const useDeleteDeliveryNote = () => {
  const { workspaceId } = useRequiredWorkspace();
  const client = useApolloClient();

  const [deleteMutation, { loading }] = useMutation(DELETE_DELIVERY_NOTE, {
    onError: (error) => {
      console.error("Erreur lors de la suppression du bon de livraison:", error);
      toast.error(
        error.message || "Erreur lors de la suppression du bon de livraison",
      );
    },
  });

  const deleteDeliveryNote = async (id) => {
    await deleteMutation({ variables: { id, workspaceId } });
    client.refetchQueries({
      include: [GET_DELIVERY_NOTES, GET_DELIVERY_NOTE_STATS],
    });
    return true;
  };

  return { deleteDeliveryNote, loading };
};

// Hook pour changer le statut d'un bon de livraison
export const useChangeDeliveryNoteStatus = () => {
  const { workspaceId } = useRequiredWorkspace();
  const client = useApolloClient();

  const [changeStatusMutation, { loading }] = useMutation(
    CHANGE_DELIVERY_NOTE_STATUS,
    {
      onCompleted: (data) => {
        client.writeQuery({
          query: GET_DELIVERY_NOTE,
          variables: { workspaceId, id: data.changeDeliveryNoteStatus.id },
          data: { deliveryNote: data.changeDeliveryNoteStatus },
        });
      },
      onError: (error) => {
        console.error("Erreur lors du changement de statut:", error);
      },
    },
  );

  const changeStatus = async (id, status) => {
    const result = await changeStatusMutation({
      variables: { id, workspaceId, status },
    });
    // Avec onError, Apollo résout la promesse au lieu de la rejeter :
    // re-lancer pour que l'appelant ne prenne pas un échec pour un succès.
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }
    if (!result.data?.changeDeliveryNoteStatus) {
      throw new Error("Le changement de statut a échoué");
    }
    return result.data.changeDeliveryNoteStatus;
  };

  return { changeStatus, loading };
};

// Hook pour enregistrer la réception (réceptionnaire, date, signature) → DELIVERED
export const useRecordDeliveryNoteReception = () => {
  const { workspaceId } = useRequiredWorkspace();
  const client = useApolloClient();

  const [recordMutation, { loading }] = useMutation(
    RECORD_DELIVERY_NOTE_RECEPTION,
    {
      onCompleted: (data) => {
        client.writeQuery({
          query: GET_DELIVERY_NOTE,
          variables: { workspaceId, id: data.recordDeliveryNoteReception.id },
          data: { deliveryNote: data.recordDeliveryNoteReception },
        });
        client.refetchQueries({
          include: [GET_DELIVERY_NOTES, GET_DELIVERY_NOTE_STATS],
        });
      },
    },
  );

  const recordReception = async (id, input) => {
    const result = await recordMutation({
      variables: { id, workspaceId, input },
    });
    return result.data?.recordDeliveryNoteReception;
  };

  return { recordReception, loading };
};

// Hook pour créer un bon de livraison depuis un devis
export const useCreateDeliveryNoteFromQuote = () => {
  const { workspaceId } = useRequiredWorkspace();
  const client = useApolloClient();

  const [convertMutation, { loading }] = useMutation(
    CREATE_DELIVERY_NOTE_FROM_QUOTE,
    {
      onCompleted: () => {
        client.refetchQueries({
          include: [
            GET_DELIVERY_NOTES,
            GET_DELIVERY_NOTE_STATS,
            "GetQuotes",
            "GetQuote",
          ],
        });
      },
    },
  );

  const createFromQuote = async (quoteId) => {
    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }
    const result = await convertMutation({
      variables: { quoteId, workspaceId },
    });
    return result.data?.createDeliveryNoteFromQuote;
  };

  return { createFromQuote, loading };
};

// Hook pour créer un bon de livraison depuis une facture
export const useCreateDeliveryNoteFromInvoice = () => {
  const { workspaceId } = useRequiredWorkspace();
  const client = useApolloClient();

  const [convertMutation, { loading }] = useMutation(
    CREATE_DELIVERY_NOTE_FROM_INVOICE,
    {
      onCompleted: () => {
        client.refetchQueries({
          include: [
            GET_DELIVERY_NOTES,
            GET_DELIVERY_NOTE_STATS,
            "GetInvoices",
            "GetInvoice",
          ],
        });
      },
    },
  );

  const createFromInvoice = async (invoiceId) => {
    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }
    const result = await convertMutation({
      variables: { invoiceId, workspaceId },
    });
    return result.data?.createDeliveryNoteFromInvoice;
  };

  return { createFromInvoice, loading };
};

// Hook pour générer une facture (brouillon pré-rempli) depuis un bon de livraison
export const useCreateInvoiceFromDeliveryNote = () => {
  const { workspaceId } = useRequiredWorkspace();
  const client = useApolloClient();

  const [convertMutation, { loading }] = useMutation(
    CREATE_INVOICE_FROM_DELIVERY_NOTE,
    {
      onCompleted: () => {
        client.refetchQueries({
          include: [
            GET_DELIVERY_NOTES,
            GET_DELIVERY_NOTE_STATS,
            "GetInvoices",
            "GetInvoiceStats",
          ],
        });
      },
    },
  );

  const createInvoice = async (deliveryNoteId) => {
    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }
    const result = await convertMutation({
      variables: { deliveryNoteId, workspaceId },
    });
    return result.data?.createInvoiceFromDeliveryNote;
  };

  return { createInvoice, loading };
};

// ==================== CONSTANTES ====================

export const DELIVERY_NOTE_STATUS = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELED: "CANCELED",
};

// Libellés pour l'affichage (statuts orientés logistique)
export const DELIVERY_NOTE_STATUS_LABELS = {
  [DELIVERY_NOTE_STATUS.DRAFT]: "Brouillon",
  [DELIVERY_NOTE_STATUS.PENDING]: "À expédier",
  [DELIVERY_NOTE_STATUS.SHIPPED]: "Expédié",
  [DELIVERY_NOTE_STATUS.DELIVERED]: "Livré",
  [DELIVERY_NOTE_STATUS.CANCELED]: "Annulé",
};

// Couleurs pour les statuts (mêmes classes que les badges existants)
export const DELIVERY_NOTE_STATUS_COLORS = {
  [DELIVERY_NOTE_STATUS.DRAFT]: "bg-gray-100 text-gray-700 border-gray-200",
  [DELIVERY_NOTE_STATUS.PENDING]:
    "bg-amber-100 text-amber-700 border-amber-200",
  [DELIVERY_NOTE_STATUS.SHIPPED]: "bg-blue-100 text-blue-700 border-blue-200",
  [DELIVERY_NOTE_STATUS.DELIVERED]:
    "bg-emerald-100 text-emerald-700 border-emerald-200",
  [DELIVERY_NOTE_STATUS.CANCELED]: "bg-red-100 text-red-700 border-red-200",
};

// Référence affichée d'un bon de livraison (BL-202609-0001, ou « Brouillon »)
export const formatDeliveryNoteReference = (dn) => {
  if (!dn) return "";
  if (dn.status === DELIVERY_NOTE_STATUS.DRAFT || !dn.number) return "Brouillon";
  return dn.prefix
    ? `${dn.prefix.replace(/-$/, "")}-${dn.number}`
    : dn.number;
};
