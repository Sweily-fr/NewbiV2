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

    // Numérotation manuelle (autoNumbering désactivé) : séquence par préfixe.
    // Nouveau préfixe (aucune facture finalisée) → numéro de départ libre.
    if (!computed.hasDocumentsForPrefix) {
      return { isValid: true };
    }

    // Préfixe existant : le numéro doit suivre la séquence (pas de recul, pas de trou).
    // Messages alignés sur ceux de l'API (validateNumberSequence) : on rappelle
    // le dernier numéro utilisé pour ce préfixe et le numéro attendu.
    const last = `La dernière facture avec le préfixe "${prefix}" est la ${String(computed.lastNumber).padStart(4, "0")}`;
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
