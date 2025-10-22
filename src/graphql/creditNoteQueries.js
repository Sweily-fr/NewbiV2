import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client';
import { useWorkspace } from '@/src/hooks/useWorkspace';

// ==================== FRAGMENTS ====================

export const CREDIT_NOTE_FRAGMENT = gql`
  fragment CreditNoteFragment on CreditNote {
    id
    number
    prefix
    originalInvoiceNumber
    creditType
    reason
    status
    issueDate
    executionDate
    refundMethod
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
    finalTotalVAT
    finalTotalTTC
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
      capitalSocial
      rcs
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
    bankDetails {
      iban
      bic
      bankName
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
    appearance {
      textColor
      headerTextColor
      headerBgColor
    }
    originalInvoice {
      id
      number
      status
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

// ==================== QUERIES ====================

export const GET_CREDIT_NOTE = gql`
  query GetCreditNote($id: ID!, $workspaceId: ID!) {
    creditNote(id: $id, workspaceId: $workspaceId) {
      ...CreditNoteFragment
    }
  }
  ${CREDIT_NOTE_FRAGMENT}
`;

export const GET_CREDIT_NOTES = gql`
  query GetCreditNotes(
    $workspaceId: ID!
    $startDate: String
    $endDate: String
    $status: CreditNoteStatus
    $search: String
    $page: Int
    $limit: Int
  ) {
    creditNotes(
      workspaceId: $workspaceId
      startDate: $startDate
      endDate: $endDate
      status: $status
      search: $search
      page: $page
      limit: $limit
    ) {
      creditNotes {
        ...CreditNoteFragment
      }
      totalCount
      hasNextPage
    }
  }
  ${CREDIT_NOTE_FRAGMENT}
`;

export const GET_CREDIT_NOTES_BY_INVOICE = gql`
  query GetCreditNotesByInvoice($invoiceId: ID!, $workspaceId: ID!) {
    creditNotesByInvoice(invoiceId: $invoiceId, workspaceId: $workspaceId) {
      ...CreditNoteFragment
    }
  }
  ${CREDIT_NOTE_FRAGMENT}
`;

export const GET_CREDIT_NOTE_STATS = gql`
  query GetCreditNoteStats($workspaceId: ID!) {
    creditNoteStats(workspaceId: $workspaceId) {
      totalCount
      createdCount
      totalAmount
    }
  }
`;

export const GET_NEXT_CREDIT_NOTE_NUMBER = gql`
  query GetNextCreditNoteNumber($workspaceId: ID!, $prefix: String, $isDraft: Boolean) {
    nextCreditNoteNumber(workspaceId: $workspaceId, prefix: $prefix, isDraft: $isDraft)
  }
`;

// ==================== MUTATIONS ====================

export const CREATE_CREDIT_NOTE = gql`
  mutation CreateCreditNote($workspaceId: ID!, $input: CreateCreditNoteInput!) {
    createCreditNote(workspaceId: $workspaceId, input: $input) {
      ...CreditNoteFragment
    }
  }
  ${CREDIT_NOTE_FRAGMENT}
`;

export const UPDATE_CREDIT_NOTE = gql`
  mutation UpdateCreditNote($id: ID!, $workspaceId: ID!, $input: UpdateCreditNoteInput!) {
    updateCreditNote(id: $id, workspaceId: $workspaceId, input: $input) {
      ...CreditNoteFragment
    }
  }
  ${CREDIT_NOTE_FRAGMENT}
`;

export const DELETE_CREDIT_NOTE = gql`
  mutation DeleteCreditNote($id: ID!, $workspaceId: ID!) {
    deleteCreditNote(id: $id, workspaceId: $workspaceId)
  }
`;

// CHANGE_CREDIT_NOTE_STATUS mutation removed - credit notes only have CREATED status

// ==================== CONSTANTS ====================

export const CREDIT_TYPE = {
  CORRECTION: 'CORRECTION',
  COMMERCIAL_GESTURE: 'COMMERCIAL_GESTURE',
  REFUND: 'REFUND',
  STOCK_SHORTAGE: 'STOCK_SHORTAGE',
};

export const CREDIT_TYPE_LABELS = {
  [CREDIT_TYPE.CORRECTION]: 'Correction de facture',
  [CREDIT_TYPE.COMMERCIAL_GESTURE]: 'Geste commercial',
  [CREDIT_TYPE.REFUND]: 'Remboursement',
  [CREDIT_TYPE.STOCK_SHORTAGE]: 'Rupture de stock',
};

export const REFUND_METHOD = {
  NEXT_INVOICE: 'NEXT_INVOICE',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHECK: 'CHECK',
  VOUCHER: 'VOUCHER',
  CASH: 'CASH',
};

export const REFUND_METHOD_LABELS = {
  [REFUND_METHOD.NEXT_INVOICE]: 'Déduction sur prochaine facture',
  [REFUND_METHOD.BANK_TRANSFER]: 'Virement bancaire',
  [REFUND_METHOD.CHECK]: 'Chèque',
  [REFUND_METHOD.VOUCHER]: 'Bon d\'achat',
  [REFUND_METHOD.CASH]: 'Espèces',
};

// ==================== HOOKS ====================

export function useCreditNote(id) {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();

  const { data, loading: queryLoading, error, refetch } = useQuery(GET_CREDIT_NOTE, {
    variables: { id, workspaceId },
    skip: !id || !workspaceId,
  });

  return {
    creditNote: data?.creditNote,
    loading: (workspaceLoading && !workspaceId) || (queryLoading && !data?.creditNote),
    error,
    refetch,
  };
}

export function useCreditNotes(filters = {}) {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();

  const { data, loading: queryLoading, error, refetch, fetchMore } = useQuery(GET_CREDIT_NOTES, {
    variables: {
      workspaceId,
      ...filters,
    },
    skip: !workspaceId,
  });

  return {
    creditNotes: data?.creditNotes?.creditNotes || [],
    totalCount: data?.creditNotes?.totalCount || 0,
    hasNextPage: data?.creditNotes?.hasNextPage || false,
    loading: (workspaceLoading && !workspaceId) || (queryLoading && !data?.creditNotes),
    error,
    refetch,
    fetchMore,
  };
}

export function useCreditNotesByInvoice(invoiceId) {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();

  const { data, loading: queryLoading, error, refetch } = useQuery(GET_CREDIT_NOTES_BY_INVOICE, {
    variables: { invoiceId, workspaceId },
    skip: !invoiceId || !workspaceId,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  return {
    creditNotes: data?.creditNotesByInvoice || [],
    loading: (workspaceLoading && !workspaceId) || (queryLoading && !data?.creditNotesByInvoice),
    error,
    refetch,
  };
}

export function useCreateCreditNote() {
  const { workspaceId } = useWorkspace();

  const [createCreditNoteMutation, { loading, error }] = useMutation(CREATE_CREDIT_NOTE, {
    refetchQueries: [
      'GetCreditNotesByInvoice', // Rafraîchir la liste des avoirs de la facture
      'GetCreditNoteStats', // Rafraîchir les statistiques
    ],
    awaitRefetchQueries: true,
  });

  const createCreditNote = async (input) => {
    if (!workspaceId) {
      throw new Error('WorkspaceId is required but not found in session');
    }

    const { data } = await createCreditNoteMutation({
      variables: {
        workspaceId,
        input,
      },
    });
    return data.createCreditNote;
  };

  return {
    createCreditNote,
    loading,
    error,
    workspaceId, // Export for debugging
  };
}

export function useUpdateCreditNote() {
  const { workspaceId } = useWorkspace();

  const [updateCreditNoteMutation, { loading, error }] = useMutation(UPDATE_CREDIT_NOTE, {
    refetchQueries: [
      'GetCreditNotesByInvoice', // Rafraîchir la liste des avoirs de la facture
      'GetCreditNoteStats', // Rafraîchir les statistiques
    ],
    awaitRefetchQueries: true,
  });

  const updateCreditNote = async (id, input) => {
    const { data } = await updateCreditNoteMutation({
      variables: {
        id,
        workspaceId,
        input,
      },
    });
    return data.updateCreditNote;
  };

  return {
    updateCreditNote,
    loading,
    error,
  };
}

export function useDeleteCreditNote() {
  const { workspaceId } = useWorkspace();

  const [deleteCreditNoteMutation, { loading, error }] = useMutation(DELETE_CREDIT_NOTE, {
    refetchQueries: [
      'GetCreditNotesByInvoice', // Rafraîchir la liste des avoirs de la facture
      'GetCreditNoteStats', // Rafraîchir les statistiques
    ],
    awaitRefetchQueries: true,
  });

  const deleteCreditNote = async (id) => {
    await deleteCreditNoteMutation({
      variables: {
        id,
        workspaceId,
      },
    });
  };

  return {
    deleteCreditNote,
    loading,
    error,
  };
}

// useChangeCreditNoteStatus hook removed - credit notes only have CREATED status
