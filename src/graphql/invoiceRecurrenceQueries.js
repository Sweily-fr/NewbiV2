import { gql, useMutation, useQuery } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

// Factures récurrentes : une facture de vente sert de modèle, une nouvelle
// facture en est tirée à chaque échéance puis envoyée au client par email.

export const INVOICE_RECURRENCE_FRAGMENT = gql`
  fragment InvoiceRecurrenceFields on InvoiceRecurrence {
    id
    sourceInvoiceId
    sourceInvoice {
      id
      prefix
      number
      status
      clientName
      clientEmail
      finalTotalTTC
    }
    frequency
    interval
    startDate
    endDate
    nextRunDate
    status
    emailSubject
    emailBody
    generatedCount
    lastRunDate
    lastInvoiceId
    lastError
    lastErrorAt
    createdAt
    updatedAt
  }
`;

export const GET_INVOICE_RECURRENCES = gql`
  query GetInvoiceRecurrences($workspaceId: ID!) {
    invoiceRecurrences(workspaceId: $workspaceId) {
      ...InvoiceRecurrenceFields
    }
  }
  ${INVOICE_RECURRENCE_FRAGMENT}
`;

export const SAVE_INVOICE_RECURRENCE = gql`
  mutation SaveInvoiceRecurrence(
    $workspaceId: ID!
    $invoiceId: ID!
    $input: InvoiceRecurrenceInput!
  ) {
    saveInvoiceRecurrence(
      workspaceId: $workspaceId
      invoiceId: $invoiceId
      input: $input
    ) {
      ...InvoiceRecurrenceFields
    }
  }
  ${INVOICE_RECURRENCE_FRAGMENT}
`;

export const SET_INVOICE_RECURRENCE_STATUS = gql`
  mutation SetInvoiceRecurrenceStatus(
    $workspaceId: ID!
    $id: ID!
    $status: InvoiceRecurrenceStatus!
  ) {
    setInvoiceRecurrenceStatus(
      workspaceId: $workspaceId
      id: $id
      status: $status
    ) {
      ...InvoiceRecurrenceFields
    }
  }
  ${INVOICE_RECURRENCE_FRAGMENT}
`;

export const RECURRENCE_FREQUENCY_UNITS = {
  DAILY: { one: "jour", many: "jours" },
  WEEKLY: { one: "semaine", many: "semaines" },
  MONTHLY: { one: "mois", many: "mois" },
};

/** « tous les mois », « toutes les 2 semaines », « tous les 3 jours » */
export function formatRecurrenceFrequency(frequency, interval = 1) {
  const unit = RECURRENCE_FREQUENCY_UNITS[frequency];
  if (!unit) return "";
  const feminine = frequency === "WEEKLY";
  const all = feminine ? "toutes les" : "tous les";
  if (!interval || interval <= 1) return `${all} ${unit.many}`;
  return `${all} ${interval} ${unit.many}`;
}

/** Jour AAAA-MM-JJ → « 15 novembre 2026 » (sans décalage de fuseau) */
export function formatRecurrenceDay(day, options = {}) {
  if (!day) return "";
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  });
}

const errorMessage = (error, fallback) =>
  error?.graphQLErrors?.[0]?.message || error?.message || fallback;

export const useInvoiceRecurrences = () => {
  const { workspaceId } = useRequiredWorkspace();
  const { data, loading, error, refetch } = useQuery(GET_INVOICE_RECURRENCES, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });
  return {
    recurrences: data?.invoiceRecurrences || [],
    loading,
    error,
    refetch,
  };
};

export const useSaveInvoiceRecurrence = () => {
  const { workspaceId } = useRequiredWorkspace();
  const [mutate, { loading }] = useMutation(SAVE_INVOICE_RECURRENCE, {
    refetchQueries: ["GetInvoiceRecurrences"],
    awaitRefetchQueries: true,
  });

  const saveRecurrence = async (invoiceId, input) => {
    try {
      const result = await mutate({
        variables: { workspaceId, invoiceId, input },
      });
      return { success: true, recurrence: result.data?.saveInvoiceRecurrence };
    } catch (error) {
      toast.error(
        errorMessage(error, "Impossible d'enregistrer la récurrence"),
      );
      return { success: false, error };
    }
  };

  return { saveRecurrence, loading };
};

export const useSetInvoiceRecurrenceStatus = () => {
  const { workspaceId } = useRequiredWorkspace();
  const [mutate, { loading }] = useMutation(SET_INVOICE_RECURRENCE_STATUS, {
    refetchQueries: ["GetInvoiceRecurrences"],
    awaitRefetchQueries: true,
  });

  const setStatus = async (id, status) => {
    try {
      const result = await mutate({ variables: { workspaceId, id, status } });
      return {
        success: true,
        recurrence: result.data?.setInvoiceRecurrenceStatus,
      };
    } catch (error) {
      toast.error(errorMessage(error, "Impossible de modifier la récurrence"));
      return { success: false, error };
    }
  };

  return { setStatus, loading };
};
