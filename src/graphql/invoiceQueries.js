import { gql } from "@apollo/client";

// ==================== FRAGMENTS ====================

export const INVOICE_FRAGMENT = gql`
  fragment InvoiceFragment on Invoice {
    id
    number
    prefix
    purchaseOrderNumber
    isDeposit
    status
    issueDate
    executionDate
    dueDate
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
    stripeInvoiceId
    showBankDetails
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
    createdBy {
      id
      email
      profile {
        firstName
        lastName
      }
    }
  }
`;

export const INVOICE_LIST_FRAGMENT = gql`
  fragment InvoiceListFragment on Invoice {
    id
    number
    prefix
    status
    issueDate
    dueDate
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
    createdAt
    updatedAt
  }
`;

// ==================== QUERIES ====================

export const GET_INVOICES = gql`
  query GetInvoices(
    $workspaceId: ID!
    $startDate: String
    $endDate: String
    $status: InvoiceStatus
    $search: String
    $page: Int
    $limit: Int
  ) {
    invoices(
      workspaceId: $workspaceId
      startDate: $startDate
      endDate: $endDate
      status: $status
      search: $search
      page: $page
      limit: $limit
    ) {
      invoices {
        ...InvoiceListFragment
      }
      totalCount
      hasNextPage
    }
  }
  ${INVOICE_LIST_FRAGMENT}
`;

export const GET_INVOICE = gql`
  query GetInvoice($id: ID!, $workspaceId: ID!) {
    invoice(id: $id, workspaceId: $workspaceId) {
      ...InvoiceFragment
    }
  }
  ${INVOICE_FRAGMENT}
`;

export const GET_INVOICE_STATS = gql`
  query GetInvoiceStats($workspaceId: ID!) {
    invoiceStats(workspaceId: $workspaceId) {
      totalCount
      draftCount
      pendingCount
      completedCount
      totalAmount
    }
  }
`;

export const GET_NEXT_INVOICE_NUMBER = gql`
  query GetNextInvoiceNumber(
    $workspaceId: ID!
    $prefix: String
    $isDraft: Boolean
  ) {
    nextInvoiceNumber(
      workspaceId: $workspaceId
      prefix: $prefix
      isDraft: $isDraft
    )
  }
`;

// ==================== MUTATIONS ====================

export const CREATE_INVOICE = gql`
  mutation CreateInvoice($workspaceId: ID!, $input: CreateInvoiceInput!) {
    createInvoice(workspaceId: $workspaceId, input: $input) {
      ...InvoiceFragment
    }
  }
  ${INVOICE_FRAGMENT}
`;

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice(
    $id: ID!
    $workspaceId: ID!
    $input: UpdateInvoiceInput!
  ) {
    updateInvoice(id: $id, workspaceId: $workspaceId, input: $input) {
      ...InvoiceFragment
    }
  }
  ${INVOICE_FRAGMENT}
`;

export const DELETE_INVOICE = gql`
  mutation DeleteInvoice($id: ID!, $workspaceId: ID!) {
    deleteInvoice(id: $id, workspaceId: $workspaceId)
  }
`;

export const SEND_INVOICE = gql`
  mutation SendInvoice($id: ID!, $email: String!) {
    sendInvoice(id: $id, email: $email)
  }
`;

export const MARK_INVOICE_AS_PAID = gql`
  mutation MarkInvoiceAsPaid(
    $id: ID!
    $workspaceId: ID!
    $paymentDate: String!
  ) {
    markInvoiceAsPaid(
      id: $id
      workspaceId: $workspaceId
      paymentDate: $paymentDate
    ) {
      ...InvoiceFragment
    }
  }
  ${INVOICE_FRAGMENT}
`;

export const CHANGE_INVOICE_STATUS = gql`
  mutation ChangeInvoiceStatus(
    $id: ID!
    $workspaceId: ID!
    $status: InvoiceStatus!
  ) {
    changeInvoiceStatus(id: $id, workspaceId: $workspaceId, status: $status) {
      ...InvoiceFragment
    }
  }
  ${INVOICE_FRAGMENT}
`;

export const CREATE_LINKED_INVOICE = gql`
  mutation CreateLinkedInvoice(
    $quoteId: ID!
    $workspaceId: ID!
    $amount: Float!
    $isDeposit: Boolean!
  ) {
    createLinkedInvoice(
      quoteId: $quoteId
      workspaceId: $workspaceId
      amount: $amount
      isDeposit: $isDeposit
    ) {
      invoice {
        id
        number
        status
        finalTotalTTC
        isDeposit
        companyInfo {
          name
          siret
          vatNumber
        }
      }
      quote {
        id
        linkedInvoices {
          id
          number
          status
          finalTotalTTC
          isDeposit
          companyInfo {
            siret
            vatNumber
          }
        }
      }
    }
  }
`;

export const DELETE_LINKED_INVOICE = gql`
  mutation DeleteLinkedInvoice($id: ID!) {
    deleteLinkedInvoice(id: $id)
  }
`;

// ==================== HOOKS PERSONNALISÉS ====================

import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import { useState, useMemo, useCallback } from "react";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

// Hook optimisé pour récupérer la liste des factures
export const useInvoices = () => {
  // Récupérer le workspace actuel
  const {
    workspaceId,
    loading: workspaceLoading,
    error: workspaceError,
  } = useRequiredWorkspace();

  // Configuration de la pagination
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20, // Réduit la taille de la page initiale
  });

  // Configuration du tri et des filtres
  const [sorting, setSorting] = useState([{ id: "issueDate", desc: true }]);
  const [filters, setFilters] = useState([]);

  // Options de requête optimisées
  const {
    data: invoicesData,
    loading: queryLoading,
    error: queryError,
    refetch,
    fetchMore,
  } = useQuery(GET_INVOICES, {
    variables: {
      workspaceId,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      sortField: sorting[0]?.id,
      sortOrder: sorting[0]?.desc ? "desc" : "asc",
      filters: filters.reduce(
        (acc, { id, value }) => ({
          ...acc,
          [id]: value,
        }),
        {}
      ),
    },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    skip: !workspaceId, // Ne pas exécuter la query sans workspaceId
  });

  // Fonction pour charger plus de données
  const loadMore = useCallback(() => {
    if (!queryLoading && workspaceId) {
      fetchMore({
        variables: {
          workspaceId,
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          sortField: sorting[0]?.id || "issueDate",
          sortOrder: sorting[0]?.desc ? "desc" : "asc",
          filters: filters.reduce(
            (acc, { id, value }) => ({
              ...acc,
              [id]: value,
            }),
            {}
          ),
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult?.invoices?.invoices?.length) return prev;
          return {
            ...fetchMoreResult,
            invoices: {
              ...fetchMoreResult.invoices,
              invoices: [
                ...(prev.invoices?.invoices || []),
                ...(fetchMoreResult.invoices?.invoices || []),
              ],
            },
          };
        },
      }).then(() => {
        setPagination((prev) => ({
          ...prev,
          pageIndex: prev.pageIndex + 1,
        }));
      });
    }
  }, [
    fetchMore,
    filters,
    queryLoading,
    workspaceId,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
  ]);

  // Fonction de refetch optimisée
  const optimizedRefetch = useCallback(
    (variables) => {
      if (!workspaceId) return Promise.resolve();
      return refetch({
        workspaceId,
        ...variables,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
    },
    [workspaceId, pagination.pageIndex, pagination.pageSize, refetch]
  );

  // Valeurs de retour optimisées
  return useMemo(
    () => ({
      invoices: invoicesData?.invoices?.invoices || [],
      totalCount: invoicesData?.invoices?.totalCount || 0,
      hasNextPage: invoicesData?.invoices?.hasNextPage || false,
      loading: workspaceLoading || queryLoading,
      error: workspaceError || queryError,
      pagination: {
        ...pagination,
        pageCount: invoicesData?.invoices?.pagination?.totalPages || 1,
        total: invoicesData?.invoices?.totalCount || 0,
      },
      sorting,
      filters,
      onSortingChange: setSorting,
      onPaginationChange: setPagination,
      onFiltersChange: setFilters,
      loadMore,
      refetch: optimizedRefetch,
    }),
    [
      invoicesData?.invoices?.invoices,
      invoicesData?.invoices?.totalCount,
      invoicesData?.invoices?.hasNextPage,
      invoicesData?.invoices?.pagination?.totalPages,
      workspaceLoading,
      queryLoading,
      workspaceError,
      queryError,
      pagination,
      sorting,
      filters,
      loadMore,
      optimizedRefetch,
    ]
  );
};

// Hook pour récupérer une facture spécifique
export const useInvoice = (id) => {
  const {
    workspaceId,
    loading: workspaceLoading,
    error: workspaceError,
  } = useRequiredWorkspace();

  const {
    data: invoiceData,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery(GET_INVOICE, {
    variables: { id, workspaceId },
    skip: !id || !workspaceId,
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });

  return useMemo(
    () => ({
      invoice: invoiceData?.invoice || null,
      loading: workspaceLoading || queryLoading,
      error: workspaceError || queryError,
      refetch,
    }),
    [
      invoiceData?.invoice,
      workspaceLoading,
      queryLoading,
      workspaceError,
      queryError,
      refetch,
    ]
  );
};

// Hook pour les statistiques des factures
export const useInvoiceStats = () => {
  const {
    workspaceId,
    loading: workspaceLoading,
    error: workspaceError,
  } = useRequiredWorkspace();

  const {
    data: statsData,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery(GET_INVOICE_STATS, {
    variables: { workspaceId },
    skip: !workspaceId,
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });

  return useMemo(
    () => ({
      stats: statsData?.invoiceStats || {},
      loading: workspaceLoading || queryLoading,
      error: workspaceError || queryError,
      refetch,
    }),
    [
      statsData?.invoiceStats,
      workspaceLoading,
      queryLoading,
      workspaceError,
      queryError,
      refetch,
    ]
  );
};

// Hook pour récupérer le prochain numéro de facture
export const useNextInvoiceNumber = (prefix, options = {}) => {
  const { isDraft = false, skip = false } = options;
  const { workspaceId } = useRequiredWorkspace();

  return useQuery(GET_NEXT_INVOICE_NUMBER, {
    variables: {
      workspaceId,
      prefix,
      isDraft,
    },
    skip: skip || !workspaceId,
    errorPolicy: "all",
  });
};

// Hook pour créer une facture
export const useCreateInvoice = () => {
  const client = useApolloClient();
  const { workspaceId } = useRequiredWorkspace();

  const [createInvoiceMutation, { loading }] = useMutation(CREATE_INVOICE, {
    onCompleted: () => {
      toast.success("Facture créée avec succès");
      // Invalider le cache des factures pour forcer un refetch
      client.refetchQueries({
        include: [GET_INVOICES, GET_INVOICE_STATS],
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la création de la facture:", error);
      toast.error(error.message || "Erreur lors de la création de la facture");
    },
  });

  const createInvoice = async (input) => {
    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }

    try {
      const result = await createInvoiceMutation({
        variables: { workspaceId, input },
      });
      return result.data.createInvoice;
    } catch (error) {
      throw error;
    }
  };

  return { createInvoice, loading };
};

// Hook pour mettre à jour une facture
export const useUpdateInvoice = () => {
  const client = useApolloClient();
  const { workspaceId } = useRequiredWorkspace();

  const [updateInvoiceMutation, { loading }] = useMutation(UPDATE_INVOICE, {
    onCompleted: (data) => {
      toast.success("Facture mise à jour avec succès");
      // Mettre à jour le cache
      client.writeQuery({
        query: GET_INVOICE,
        variables: { id: data.updateInvoice.id, workspaceId },
        data: { invoice: data.updateInvoice },
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour de la facture:", error);
      toast.error(
        error.message || "Erreur lors de la mise à jour de la facture"
      );
    },
  });

  const updateInvoice = async (id, input) => {
    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }

    try {
      const result = await updateInvoiceMutation({
        variables: { id, workspaceId, input },
      });
      return result.data.updateInvoice;
    } catch (error) {
      throw error;
    }
  };

  return { updateInvoice, loading };
};

// Hook pour supprimer une facture
export const useDeleteInvoice = () => {
  const client = useApolloClient();
  const { workspaceId } = useRequiredWorkspace();

  const [deleteInvoiceMutation, { loading }] = useMutation(DELETE_INVOICE, {
    onCompleted: () => {
      toast.success("Facture supprimée avec succès");
      // Invalider le cache des factures
      client.refetchQueries({
        include: [GET_INVOICES, GET_INVOICE_STATS],
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression de la facture:", error);
      toast.error(
        error.message || "Erreur lors de la suppression de la facture"
      );
    },
  });

  const deleteInvoice = async (id) => {
    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }

    try {
      await deleteInvoiceMutation({
        variables: { id, workspaceId },
      });
      return true;
    } catch (error) {
      throw error;
    }
  };

  return { deleteInvoice, loading };
};

// Hook pour envoyer une facture par email
export const useSendInvoice = () => {
  const [sendInvoiceMutation, { loading }] = useMutation(SEND_INVOICE, {
    onCompleted: () => {
      toast.success("Facture envoyée avec succès");
    },
    onError: (error) => {
      console.error("Erreur lors de l'envoi de la facture:", error);
      toast.error(error.message || "Erreur lors de l'envoi de la facture");
    },
  });

  const sendInvoice = async (id, email) => {
    try {
      await sendInvoiceMutation({
        variables: { id, email },
      });
      return true;
    } catch (error) {
      throw error;
    }
  };

  return { sendInvoice, loading };
};

// Hook pour marquer une facture comme payée
export const useMarkInvoiceAsPaid = () => {
  const client = useApolloClient();
  const { workspaceId } = useRequiredWorkspace();

  const [markAsPaidMutation, { loading }] = useMutation(MARK_INVOICE_AS_PAID, {
    onCompleted: (data) => {
      toast.success("Facture marquée comme payée");
      // Mettre à jour le cache
      client.writeQuery({
        query: GET_INVOICE,
        variables: { id: data.markInvoiceAsPaid.id, workspaceId },
        data: { invoice: data.markInvoiceAsPaid },
      });
      // Invalider les statistiques
      client.refetchQueries({
        include: [GET_INVOICE_STATS],
      });
    },
    onError: (error) => {
      console.error("Erreur lors du marquage comme payée:", error);
      toast.error(error.message || "Erreur lors du marquage comme payée");
    },
  });

  const markAsPaid = async (id, paymentDate) => {
    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }

    try {
      const result = await markAsPaidMutation({
        variables: { id, workspaceId, paymentDate },
      });
      return result.data.markInvoiceAsPaid;
    } catch (error) {
      throw error;
    }
  };

  return { markAsPaid, loading };
};

// Hook pour changer le statut d'une facture
export const useChangeInvoiceStatus = () => {
  const client = useApolloClient();
  const { workspaceId } = useRequiredWorkspace();

  const [changeStatusMutation, { loading }] = useMutation(
    CHANGE_INVOICE_STATUS,
    {
      onCompleted: (data) => {
        toast.success("Statut de la facture mis à jour");
        // Mettre à jour le cache
        client.writeQuery({
          query: GET_INVOICE,
          variables: { id: data.changeInvoiceStatus.id, workspaceId },
          data: { invoice: data.changeInvoiceStatus },
        });
        // Invalider les statistiques
        client.refetchQueries({
          include: [GET_INVOICE_STATS],
        });
      },
      onError: (error) => {
        console.error("Erreur lors du changement de statut:", error);
        toast.error(error.message || "Erreur lors du changement de statut");
      },
    }
  );

  const changeStatus = async (id, status) => {
    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }

    try {
      const result = await changeStatusMutation({
        variables: { id, workspaceId, status },
      });
      return result.data.changeInvoiceStatus;
    } catch (error) {
      throw error;
    }
  };

  return { changeStatus, loading };
};

// Hook pour créer une facture liée à un devis
export const useCreateLinkedInvoice = () => {
  const client = useApolloClient();
  const { workspaceId } = useRequiredWorkspace();

  const [createLinkedInvoiceMutation, { loading }] = useMutation(
    CREATE_LINKED_INVOICE
  );

  const createLinkedInvoice = async (quoteId, amount, isDeposit) => {
    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }

    console.log("Hook createLinkedInvoice appelé avec:", {
      quoteId,
      amount,
      isDeposit,
      workspaceId,
    });
    
    try {
      console.log("Exécution de la mutation GraphQL...");
      const result = await createLinkedInvoiceMutation({
        variables: {
          quoteId,
          workspaceId,
          amount,
          isDeposit,
        },
      });
      console.log("Résultat de la mutation GraphQL:", result);

      // Afficher la notification de succès
      const invoice = result.data?.createLinkedInvoice?.invoice;
      if (invoice) {
        const invoiceNumber = invoice.number;
        const isDeposit = invoice.isDeposit;
        const message = isDeposit
          ? `Facture d'acompte ${invoiceNumber} créée avec succès`
          : `Facture ${invoiceNumber} créée avec succès`;
        toast.success(message);

        // Vérifier que les informations SIRET et TVA sont bien présentes dans la réponse
        const siret = invoice.companyInfo?.siret;
        const vatNumber = invoice.companyInfo?.vatNumber;

        console.log("Informations légales dans la facture créée:", {
          siret: siret || "Non renseigné",
          vatNumber: vatNumber || "Non renseigné",
        });

        // Si les informations légales sont manquantes, afficher un avertissement
        if (!siret || !vatNumber) {
          toast.warning("Informations légales incomplètes", {
            description:
              "Certaines informations légales (SIRET ou TVA) sont manquantes dans la facture. Vérifiez vos paramètres d'entreprise.",
          });
        }

        // Invalider les caches pour rafraîchir les données
        try {
          await client.refetchQueries({
            include: [GET_INVOICES, GET_INVOICE_STATS],
          });

          // Invalider aussi les requêtes de devis
          await client.refetchQueries({
            include: ["GetQuotes", "GetQuote"],
          });
        } catch (refetchError) {
          console.warn("Erreur lors du rafraîchissement des données:", refetchError);
          // Ne pas faire échouer toute l'opération pour une erreur de refetch
        }
      }

      return result.data.createLinkedInvoice;
    } catch (error) {
      console.error("Erreur dans la mutation GraphQL:", error);

      // Gestion spécifique des erreurs d'informations d'entreprise
      if (
        error.graphQLErrors &&
        error.graphQLErrors.some(
          (e) => e.extensions?.exception?.code === "COMPANY_INFO_INCOMPLETE"
        )
      ) {
        toast.error("Informations d'entreprise incomplètes", {
          description:
            "Veuillez compléter les informations légales de votre entreprise (SIRET, TVA) dans les paramètres avant de créer une facture.",
        });
      } else {
        toast.error("Erreur lors de la création de la facture liée", {
          description: error.message || "Une erreur inattendue s'est produite",
        });
      }

      throw error;
    }
  };

  return { createLinkedInvoice, loading };
};

// Hook pour supprimer une facture liée
export const useDeleteLinkedInvoice = () => {
  const [deleteLinkedInvoiceMutation, { loading }] = useMutation(
    DELETE_LINKED_INVOICE,
    {
      onCompleted: () => {
        toast.success("Facture liée supprimée avec succès");
      },
      onError: (error) => {
        console.error(
          "Erreur lors de la suppression de la facture liée:",
          error
        );
        toast.error("Erreur lors de la suppression de la facture liée", {
          description: error.message || "Une erreur inattendue s'est produite",
        });
      },
      // Mettre à jour le cache Apollo
      update: (cache, { data }) => {
        if (data?.deleteLinkedInvoice) {
          // Invalider les caches liés aux factures et devis
          cache.evict({ fieldName: "invoices" });
          cache.evict({ fieldName: "quotes" });
          cache.gc();
        }
      },
    }
  );

  const deleteLinkedInvoice = async (invoiceId) => {
    console.log("Hook deleteLinkedInvoice appelé avec:", { invoiceId });
    try {
      console.log("Exécution de la mutation GraphQL...");
      const result = await deleteLinkedInvoiceMutation({
        variables: { id: invoiceId },
      });
      console.log("Résultat de la mutation GraphQL:", result);
      return result.data.deleteLinkedInvoice;
    } catch (error) {
      console.error("Erreur dans la mutation GraphQL:", error);
      throw error;
    }
  };

  return { deleteLinkedInvoice, loading };
};

// ==================== CONSTANTES ====================

export const INVOICE_STATUS = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
};

export const PAYMENT_METHOD = {
  BANK_TRANSFER: "BANK_TRANSFER",
  CHECK: "CHECK",
  CASH: "CASH",
  CARD: "CARD",
  OTHER: "OTHER",
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
export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUS.DRAFT]: "Brouillon",
  [INVOICE_STATUS.PENDING]: "En attente",
  [INVOICE_STATUS.COMPLETED]: "Terminée",
  [INVOICE_STATUS.CANCELED]: "Annulée",
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHOD.BANK_TRANSFER]: "Virement bancaire",
  [PAYMENT_METHOD.CHECK]: "Chèque",
  [PAYMENT_METHOD.CASH]: "Espèces",
  [PAYMENT_METHOD.CARD]: "Carte bancaire",
  [PAYMENT_METHOD.OTHER]: "Autre",
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
export const INVOICE_STATUS_COLORS = {
  [INVOICE_STATUS.DRAFT]: "bg-gray-100 text-gray-800 border-gray-200",
  [INVOICE_STATUS.PENDING]: "bg-orange-100 text-orange-800 border-orange-200",
  [INVOICE_STATUS.COMPLETED]: "bg-green-100 text-green-800 border-green-200",
  [INVOICE_STATUS.CANCELED]: "bg-red-100 text-red-800 border-red-200",
};
