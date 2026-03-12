import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_QUOTE_NUMBERS, QUOTE_STATUS } from "@/src/graphql/quoteQueries";
import { useRequiredWorkspace } from '@/src/hooks/useWorkspace';

export const useQuoteNumber = (prefix) => {
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  const { data, loading, error } = useQuery(GET_QUOTE_NUMBERS, {
    variables: { workspaceId },
    fetchPolicy: 'cache-and-network',
    skip: !workspaceId,
  });

  const computed = useMemo(() => {
    const quotes = data?.quotes?.quotes;
    if (!quotes) {
      return { lastNumber: 0, anyDocumentsExist: false, hasDocumentsForPrefix: false };
    }

    const finalizedQuotes = quotes.filter(quote => {
      return quote.status !== QUOTE_STATUS.DRAFT
        && quote.number
        && quote.number.trim() !== '';
    });

    const anyDocumentsExist = finalizedQuotes.some(quote =>
      /^\d+$/.test(quote.number) && parseInt(quote.number, 10) > 0
    );

    if (!prefix) {
      return { lastNumber: 0, anyDocumentsExist, hasDocumentsForPrefix: false };
    }

    const numbers = finalizedQuotes
      .filter(quote => quote.prefix === prefix)
      .map(quote => /^\d+$/.test(quote.number) ? parseInt(quote.number, 10) : null)
      .filter(num => num !== null && num > 0);

    const lastNumber = numbers.length > 0 ? Math.max(...numbers) : 0;

    return {
      lastNumber,
      anyDocumentsExist,
      hasDocumentsForPrefix: numbers.length > 0,
    };
  }, [data, prefix]);

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
