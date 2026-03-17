import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_NEXT_INVOICE_NUMBER } from "@/src/graphql/invoiceQueries";
import { useRequiredWorkspace } from '@/src/hooks/useWorkspace';

export const useInvoiceNumber = (prefix) => {
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  const { data, loading, error } = useQuery(GET_NEXT_INVOICE_NUMBER, {
    variables: { workspaceId, prefix },
    fetchPolicy: 'cache-and-network',
    skip: !workspaceId || !prefix,
  });

  const computed = useMemo(() => {
    const nextNumberStr = data?.nextInvoiceNumber;
    if (!nextNumberStr) {
      return { lastNumber: 0, anyDocumentsExist: false, hasDocumentsForPrefix: false };
    }

    // Le backend retourne le prochain numéro formaté (ex: "0005")
    // Extraire la partie numérique
    const numericPart = nextNumberStr.replace(/\D/g, '');
    const nextNum = parseInt(numericPart, 10) || 1;
    const lastNumber = nextNum - 1;

    return {
      lastNumber,
      anyDocumentsExist: lastNumber > 0,
      hasDocumentsForPrefix: lastNumber > 0,
    };
  }, [data]);

  const isLoading = loading || workspaceLoading;
  const nextInvoiceNumber = computed.lastNumber + 1;

  const validateInvoiceNumber = (number) => {
    const num = parseInt(number, 10);
    if (isNaN(num) || num <= 0) {
      return { isValid: false, message: 'Le numéro doit être une valeur numérique positive' };
    }

    // Nouveau préfixe ou aucun document → numéro libre
    if (!computed.anyDocumentsExist || !computed.hasDocumentsForPrefix) {
      return { isValid: true };
    }

    // Doit être exactement le suivant dans la séquence
    if (num <= computed.lastNumber) {
      return { isValid: false, message: `Le numéro doit être supérieur à ${String(computed.lastNumber).padStart(4, '0')}` };
    }
    if (num > computed.lastNumber + 1) {
      return { isValid: false, message: `Le numéro doit être ${String(computed.lastNumber + 1).padStart(4, '0')} pour maintenir la séquence` };
    }

    return { isValid: true };
  };

  return {
    lastInvoiceNumber: computed.lastNumber,
    nextInvoiceNumber,
    validateInvoiceNumber,
    isLoading,
    error,
    hasExistingInvoices: () => computed.anyDocumentsExist,
    hasDocumentsForPrefix: computed.hasDocumentsForPrefix,
    getFormattedNextNumber: () => String(nextInvoiceNumber).padStart(4, '0'),
  };
};

export default useInvoiceNumber;
