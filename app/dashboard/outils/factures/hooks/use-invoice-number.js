import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_NEXT_INVOICE_NUMBER } from "@/src/graphql/invoiceQueries";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

export const useInvoiceNumber = (prefix, { autoNumbering = false } = {}) => {
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  const { data, loading, error } = useQuery(GET_NEXT_INVOICE_NUMBER, {
    variables: { workspaceId, prefix, autoNumbering },
    fetchPolicy: "network-only",
    skip: !workspaceId || !prefix,
    notifyOnNetworkStatusChange: true,
  });

  const computed = useMemo(() => {
    const nextNumberStr = data?.nextInvoiceNumber;
    if (!nextNumberStr) {
      return { lastNumber: 0, hasDocumentsForPrefix: false, hasData: false };
    }

    const numericPart = nextNumberStr.replace(/\D/g, "");
    const nextNum = parseInt(numericPart, 10) || 1;
    const lastNumber = nextNum - 1;

    return {
      lastNumber,
      hasDocumentsForPrefix: lastNumber > 0,
      hasData: true,
    };
  }, [data]);

  const isLoading = loading || workspaceLoading;
  // Ne retourner la valeur que quand les données sont fraîches (pas en loading)
  const nextInvoiceNumber =
    computed.hasData && !isLoading ? computed.lastNumber + 1 : null;

  const validateInvoiceNumber = (number) => {
    const num = parseInt(number, 10);
    if (isNaN(num) || num <= 0) {
      return {
        isValid: false,
        message: "Le numéro doit être une valeur numérique positive",
      };
    }

    if (autoNumbering) {
      if (nextInvoiceNumber && num !== nextInvoiceNumber) {
        return {
          isValid: false,
          message: `Le numéro doit être ${String(nextInvoiceNumber).padStart(4, "0")} (numérotation automatique)`,
        };
      }
      return { isValid: true };
    }

    if (!computed.hasDocumentsForPrefix) {
      return { isValid: true };
    }

    if (num <= computed.lastNumber) {
      return {
        isValid: false,
        message: `Le numéro doit être supérieur à ${String(computed.lastNumber).padStart(4, "0")}`,
      };
    }
    if (num > computed.lastNumber + 1) {
      return {
        isValid: false,
        message: `Le numéro doit être ${String(computed.lastNumber + 1).padStart(4, "0")} pour maintenir la séquence`,
      };
    }

    return { isValid: true };
  };

  return {
    lastInvoiceNumber: computed.lastNumber,
    nextInvoiceNumber,
    validateInvoiceNumber,
    isLoading,
    error,
    hasExistingInvoices: () => computed.hasDocumentsForPrefix,
    hasDocumentsForPrefix: !isLoading && computed.hasDocumentsForPrefix,
    getFormattedNextNumber: () =>
      nextInvoiceNumber ? String(nextInvoiceNumber).padStart(4, "0") : null,
  };
};

export default useInvoiceNumber;
