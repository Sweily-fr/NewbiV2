import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_NEXT_QUOTE_NUMBER } from "@/src/graphql/quoteQueries";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

export const useQuoteNumber = (prefix, { autoNumbering = false } = {}) => {
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  const { data, loading, error } = useQuery(GET_NEXT_QUOTE_NUMBER, {
    variables: { workspaceId, prefix, autoNumbering },
    fetchPolicy: "network-only",
    skip: !workspaceId || !prefix,
    notifyOnNetworkStatusChange: true,
  });

  const computed = useMemo(() => {
    const nextNumberStr = data?.nextQuoteNumber;
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
  const nextQuoteNumber =
    computed.hasData && !isLoading ? computed.lastNumber + 1 : null;

  const validateQuoteNumber = (number) => {
    const num = parseInt(number, 10);
    if (isNaN(num) || num <= 0) {
      return {
        isValid: false,
        message: "Le numéro doit être une valeur numérique positive",
      };
    }

    if (autoNumbering) {
      if (nextQuoteNumber && num !== nextQuoteNumber) {
        return {
          isValid: false,
          message: `Le numéro doit être ${String(nextQuoteNumber).padStart(4, "0")} (numérotation automatique)`,
        };
      }
      return { isValid: true };
    }

    if (!computed.hasDocumentsForPrefix) {
      return { isValid: true };
    }

    // Messages alignés sur ceux de l'API (validateNumberSequence) : on rappelle
    // le dernier numéro utilisé pour ce préfixe et le numéro attendu.
    const last = `Le dernier devis avec le préfixe "${prefix}" est le ${String(computed.lastNumber).padStart(4, "0")}`;
    const expected = String(computed.lastNumber + 1).padStart(4, "0");

    if (num <= computed.lastNumber) {
      return {
        isValid: false,
        message: `${last}. Le numéro ${String(num).padStart(4, "0")} est déjà passé : le prochain numéro doit être ${expected}.`,
      };
    }
    if (num > computed.lastNumber + 1) {
      return {
        isValid: false,
        message: `${last}. Il y a un trou dans la séquence : le prochain numéro doit être ${expected}.`,
      };
    }

    return { isValid: true };
  };

  return {
    lastQuoteNumber: computed.lastNumber,
    nextQuoteNumber,
    validateQuoteNumber,
    isLoading,
    error,
    hasExistingQuotes: () => computed.hasDocumentsForPrefix,
    hasDocumentsForPrefix: !isLoading && computed.hasDocumentsForPrefix,
    getFormattedNextNumber: () =>
      nextQuoteNumber ? String(nextQuoteNumber).padStart(4, "0") : null,
  };
};

export default useQuoteNumber;
