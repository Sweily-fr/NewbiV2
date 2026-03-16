import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_NEXT_QUOTE_NUMBER } from "@/src/graphql/quoteQueries";
import { useRequiredWorkspace } from '@/src/hooks/useWorkspace';

export const useQuoteNumber = (prefix) => {
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  const { data, loading, error } = useQuery(GET_NEXT_QUOTE_NUMBER, {
    variables: { workspaceId, prefix },
    fetchPolicy: 'cache-and-network',
    skip: !workspaceId || !prefix,
  });

  const computed = useMemo(() => {
    const nextNumberStr = data?.nextQuoteNumber;
    if (!nextNumberStr) {
      return { lastNumber: 0, anyDocumentsExist: false, hasDocumentsForPrefix: false };
    }

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
  const nextQuoteNumber = computed.lastNumber + 1;

  const validateQuoteNumber = (number) => {
    const num = parseInt(number, 10);
    if (isNaN(num) || num <= 0) {
      return { isValid: false, message: 'Le numéro doit être une valeur numérique positive' };
    }

    if (!computed.anyDocumentsExist || !computed.hasDocumentsForPrefix) {
      return { isValid: true };
    }

    if (num <= computed.lastNumber) {
      return { isValid: false, message: `Le numéro doit être supérieur à ${String(computed.lastNumber).padStart(4, '0')}` };
    }
    if (num > computed.lastNumber + 1) {
      return { isValid: false, message: `Le numéro doit être ${String(computed.lastNumber + 1).padStart(4, '0')} pour maintenir la séquence` };
    }

    return { isValid: true };
  };

  return {
    lastQuoteNumber: computed.lastNumber,
    nextQuoteNumber,
    validateQuoteNumber,
    isLoading,
    error,
    hasExistingQuotes: () => computed.anyDocumentsExist,
    hasDocumentsForPrefix: computed.hasDocumentsForPrefix,
    getFormattedNextNumber: () => String(nextQuoteNumber).padStart(4, '0'),
  };
};

export default useQuoteNumber;
