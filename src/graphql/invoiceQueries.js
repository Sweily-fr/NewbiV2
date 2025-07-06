import { gql } from '@apollo/client';

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
    createdBy {
      id
      email
      firstName
      lastName
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
    }
    createdAt
    updatedAt
  }
`;

// ==================== QUERIES ====================

export const GET_INVOICES = gql`
  query GetInvoices(
    $startDate: String
    $endDate: String
    $status: InvoiceStatus
    $search: String
    $page: Int
    $limit: Int
  ) {
    invoices(
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
  query GetInvoice($id: ID!) {
    invoice(id: $id) {
      ...InvoiceFragment
    }
  }
  ${INVOICE_FRAGMENT}
`;

export const GET_INVOICE_STATS = gql`
  query GetInvoiceStats {
    invoiceStats {
      totalCount
      draftCount
      pendingCount
      completedCount
      totalAmount
    }
  }
`;

export const GET_NEXT_INVOICE_NUMBER = gql`
  query GetNextInvoiceNumber($prefix: String) {
    nextInvoiceNumber(prefix: $prefix)
  }
`;

// ==================== MUTATIONS ====================

export const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      ...InvoiceFragment
    }
  }
  ${INVOICE_FRAGMENT}
`;

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($id: ID!, $input: UpdateInvoiceInput!) {
    updateInvoice(id: $id, input: $input) {
      ...InvoiceFragment
    }
  }
  ${INVOICE_FRAGMENT}
`;

export const DELETE_INVOICE = gql`
  mutation DeleteInvoice($id: ID!) {
    deleteInvoice(id: $id)
  }
`;

export const SEND_INVOICE = gql`
  mutation SendInvoice($id: ID!, $email: String!) {
    sendInvoice(id: $id, email: $email)
  }
`;

export const MARK_INVOICE_AS_PAID = gql`
  mutation MarkInvoiceAsPaid($id: ID!, $paymentDate: String!) {
    markInvoiceAsPaid(id: $id, paymentDate: $paymentDate) {
      ...InvoiceFragment
    }
  }
  ${INVOICE_FRAGMENT}
`;

export const CHANGE_INVOICE_STATUS = gql`
  mutation ChangeInvoiceStatus($id: ID!, $status: InvoiceStatus!) {
    changeInvoiceStatus(id: $id, status: $status) {
      ...InvoiceFragment
    }
  }
  ${INVOICE_FRAGMENT}
`;

// ==================== HOOKS PERSONNALISÉS ====================

import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { toast } from 'sonner';

// Hook pour récupérer la liste des factures avec pagination et filtres
export const useInvoices = (filters = {}) => {
  const { data, loading, error, refetch, fetchMore } = useQuery(GET_INVOICES, {
    variables: {
      page: 1,
      limit: 10,
      ...filters
    },
    errorPolicy: 'all'
  });

  const loadMore = () => {
    if (data?.invoices?.hasNextPage) {
      fetchMore({
        variables: {
          page: Math.floor(data.invoices.invoices.length / (filters.limit || 10)) + 1
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            invoices: {
              ...fetchMoreResult.invoices,
              invoices: [...prev.invoices.invoices, ...fetchMoreResult.invoices.invoices]
            }
          };
        }
      });
    }
  };

  return {
    invoices: data?.invoices?.invoices || [],
    totalCount: data?.invoices?.totalCount || 0,
    hasNextPage: data?.invoices?.hasNextPage || false,
    loading,
    error,
    refetch,
    loadMore
  };
};

// Hook pour récupérer une facture spécifique
export const useInvoice = (id) => {
  return useQuery(GET_INVOICE, {
    variables: { id },
    skip: !id,
    errorPolicy: 'all'
  });
};

// Hook pour les statistiques des factures
export const useInvoiceStats = () => {
  return useQuery(GET_INVOICE_STATS, {
    errorPolicy: 'all'
  });
};

// Hook pour récupérer le prochain numéro de facture
export const useNextInvoiceNumber = (prefix) => {
  return useQuery(GET_NEXT_INVOICE_NUMBER, {
    variables: { prefix },
    skip: !prefix,
    errorPolicy: 'all'
  });
};

// Hook pour créer une facture
export const useCreateInvoice = () => {
  const client = useApolloClient();
  
  const [createInvoiceMutation, { loading }] = useMutation(CREATE_INVOICE, {
    onCompleted: (data) => {
      toast.success('Facture créée avec succès');
      // Invalider le cache des factures pour forcer un refetch
      client.refetchQueries({
        include: [GET_INVOICES, GET_INVOICE_STATS]
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la création de la facture:', error);
      toast.error(error.message || 'Erreur lors de la création de la facture');
    }
  });

  const createInvoice = async (input) => {
    try {
      const result = await createInvoiceMutation({
        variables: { input }
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
  
  const [updateInvoiceMutation, { loading }] = useMutation(UPDATE_INVOICE, {
    onCompleted: (data) => {
      toast.success('Facture mise à jour avec succès');
      // Mettre à jour le cache
      client.writeQuery({
        query: GET_INVOICE,
        variables: { id: data.updateInvoice.id },
        data: { invoice: data.updateInvoice }
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour de la facture:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour de la facture');
    }
  });

  const updateInvoice = async (id, input) => {
    try {
      const result = await updateInvoiceMutation({
        variables: { id, input }
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
  
  const [deleteInvoiceMutation, { loading }] = useMutation(DELETE_INVOICE, {
    onCompleted: () => {
      toast.success('Facture supprimée avec succès');
      // Invalider le cache des factures
      client.refetchQueries({
        include: [GET_INVOICES, GET_INVOICE_STATS]
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression de la facture:', error);
      toast.error(error.message || 'Erreur lors de la suppression de la facture');
    }
  });

  const deleteInvoice = async (id) => {
    try {
      await deleteInvoiceMutation({
        variables: { id }
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
      toast.success('Facture envoyée avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de l\'envoi de la facture:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi de la facture');
    }
  });

  const sendInvoice = async (id, email) => {
    try {
      await sendInvoiceMutation({
        variables: { id, email }
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
  
  const [markAsPaidMutation, { loading }] = useMutation(MARK_INVOICE_AS_PAID, {
    onCompleted: (data) => {
      toast.success('Facture marquée comme payée');
      // Mettre à jour le cache
      client.writeQuery({
        query: GET_INVOICE,
        variables: { id: data.markInvoiceAsPaid.id },
        data: { invoice: data.markInvoiceAsPaid }
      });
      // Invalider les statistiques
      client.refetchQueries({
        include: [GET_INVOICE_STATS]
      });
    },
    onError: (error) => {
      console.error('Erreur lors du marquage comme payée:', error);
      toast.error(error.message || 'Erreur lors du marquage comme payée');
    }
  });

  const markAsPaid = async (id, paymentDate) => {
    try {
      const result = await markAsPaidMutation({
        variables: { id, paymentDate }
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
  
  const [changeStatusMutation, { loading }] = useMutation(CHANGE_INVOICE_STATUS, {
    onCompleted: (data) => {
      toast.success('Statut de la facture mis à jour');
      // Mettre à jour le cache
      client.writeQuery({
        query: GET_INVOICE,
        variables: { id: data.changeInvoiceStatus.id },
        data: { invoice: data.changeInvoiceStatus }
      });
      // Invalider les statistiques
      client.refetchQueries({
        include: [GET_INVOICE_STATS]
      });
    },
    onError: (error) => {
      console.error('Erreur lors du changement de statut:', error);
      toast.error(error.message || 'Erreur lors du changement de statut');
    }
  });

  const changeStatus = async (id, status) => {
    try {
      const result = await changeStatusMutation({
        variables: { id, status }
      });
      return result.data.changeInvoiceStatus;
    } catch (error) {
      throw error;
    }
  };

  return { changeStatus, loading };
};

// ==================== CONSTANTES ====================

export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED'
};

export const PAYMENT_METHOD = {
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHECK: 'CHECK',
  CASH: 'CASH',
  CARD: 'CARD',
  OTHER: 'OTHER'
};

export const DISCOUNT_TYPE = {
  FIXED: 'FIXED',
  PERCENTAGE: 'PERCENTAGE'
};

export const CLIENT_TYPE = {
  INDIVIDUAL: 'INDIVIDUAL',
  COMPANY: 'COMPANY'
};

// Libellés pour l'affichage
export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUS.DRAFT]: 'Brouillon',
  [INVOICE_STATUS.PENDING]: 'En attente',
  [INVOICE_STATUS.COMPLETED]: 'Terminée',
  [INVOICE_STATUS.CANCELED]: 'Annulée'
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHOD.BANK_TRANSFER]: 'Virement bancaire',
  [PAYMENT_METHOD.CHECK]: 'Chèque',
  [PAYMENT_METHOD.CASH]: 'Espèces',
  [PAYMENT_METHOD.CARD]: 'Carte bancaire',
  [PAYMENT_METHOD.OTHER]: 'Autre'
};

export const DISCOUNT_TYPE_LABELS = {
  [DISCOUNT_TYPE.FIXED]: 'Montant fixe',
  [DISCOUNT_TYPE.PERCENTAGE]: 'Pourcentage'
};

export const CLIENT_TYPE_LABELS = {
  [CLIENT_TYPE.INDIVIDUAL]: 'Particulier',
  [CLIENT_TYPE.COMPANY]: 'Entreprise'
};

// Couleurs pour les statuts
export const INVOICE_STATUS_COLORS = {
  [INVOICE_STATUS.DRAFT]: 'bg-gray-100 text-gray-800 border-gray-200',
  [INVOICE_STATUS.PENDING]: 'bg-orange-100 text-orange-800 border-orange-200',
  [INVOICE_STATUS.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
  [INVOICE_STATUS.CANCELED]: 'bg-red-100 text-red-800 border-red-200'
};
