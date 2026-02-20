import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_QUOTES, QUOTE_STATUS } from "@/src/graphql/quoteQueries";
import { useRequiredWorkspace } from '@/src/hooks/useWorkspace';

export const useQuoteNumber = (prefix) => {
  const [lastQuoteNumber, setLastQuoteNumber] = useState(null);
  const [anyDocumentsExist, setAnyDocumentsExist] = useState(false);
  const [hasDocumentsForPrefix, setHasDocumentsForPrefix] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer le workspace actuel
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  // Fetch all quotes to determine the current sequential state
  const { data, loading, error: queryError } = useQuery(GET_QUOTES, {
    variables: {
      workspaceId,
      limit: 1000
    },
    fetchPolicy: 'network-only',
    skip: !workspaceId,
  });

  useEffect(() => {
    if (data?.quotes?.quotes) {
      // Filter quotes to only include non-draft ones (PENDING, COMPLETED, CANCELED)
      const finalizedQuotes = data.quotes.quotes
        .filter(quote => {
          const isNotDraft = quote.status !== QUOTE_STATUS.DRAFT;
          const hasNumber = quote.number && quote.number.trim() !== '';
          return isNotDraft && hasNumber;
        });

      // Check if ANY finalized documents exist (regardless of prefix)
      const allNumbers = finalizedQuotes
        .map(quote => /^\d+$/.test(quote.number) ? parseInt(quote.number, 10) : null)
        .filter(num => num !== null && num > 0);
      setAnyDocumentsExist(allNumbers.length > 0);

      // Filter by prefix for next number calculation
      let filteredQuotes = finalizedQuotes;
      if (prefix) {
        filteredQuotes = finalizedQuotes.filter(quote => quote.prefix === prefix);
      }

      // Extract numeric quote numbers only
      const numbers = filteredQuotes
        .map(quote => {
          // Only consider purely numeric quote numbers
          if (/^\d+$/.test(quote.number)) {
            return parseInt(quote.number, 10);
          }
          return null;
        })
        .filter(num => num !== null && num > 0);

      const highestNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      setLastQuoteNumber(highestNumber);
      setHasDocumentsForPrefix(prefix ? numbers.length > 0 : allNumbers.length > 0);
    }

    if (queryError) {
      setError(queryError);
    }

    setIsLoading(loading || workspaceLoading);
  }, [data, loading, queryError, workspaceLoading, prefix]);

  // Generate the next sequential number
  const getNextQuoteNumber = () => {
    if (lastQuoteNumber === null || lastQuoteNumber === undefined) {
      return 1;
    }

    const lastNumber = typeof lastQuoteNumber === 'number' ? lastQuoteNumber : parseInt(lastQuoteNumber, 10);

    if (isNaN(lastNumber)) {
      return 1;
    }

    return lastNumber + 1;
  };

  // Validate quote number using frontend logic that matches backend rules
  const validateQuoteNumber = (number) => {
    // Basic validation: must be a positive number
    const num = parseInt(number, 10);
    if (isNaN(num) || num <= 0) {
      return {
        isValid: false,
        message: 'Le numéro doit être une valeur numérique positive'
      };
    }

    // Rule 1: If no existing quotes at all, or new prefix, allow any number (user can choose starting number)
    if (!hasExistingQuotes() || !hasDocumentsForPrefix) {
      return { isValid: true };
    }

    // Rule 2 & 3: Sequential validation (based on prefix-filtered last number)
    const lastNum = typeof lastQuoteNumber === 'number' ? lastQuoteNumber : parseInt(lastQuoteNumber, 10);

    if (isNaN(lastNum)) {
      return { isValid: true };
    }

    // Number must be greater than the last one
    if (num <= lastNum) {
      return {
        isValid: false,
        message: `Le numéro doit être supérieur à ${String(lastNum).padStart(4, '0')}`
      };
    }

    // Number must be exactly the next in sequence (no gaps allowed)
    if (num > lastNum + 1) {
      return {
        isValid: false,
        message: `Le numéro doit être ${String(lastNum + 1).padStart(4, '0')} pour maintenir la séquence`
      };
    }

    return { isValid: true };
  };

  // Check if there are existing quotes (ANY prefix - for first-document check)
  const hasExistingQuotes = () => {
    return anyDocumentsExist;
  };

  return {
    lastQuoteNumber,
    nextQuoteNumber: getNextQuoteNumber(),
    validateQuoteNumber,
    isLoading,
    error,
    hasExistingQuotes,
    hasDocumentsForPrefix,
    // Helper function to get the next number as a formatted string
    getFormattedNextNumber: () => {
      const nextNum = getNextQuoteNumber();
      return String(nextNum).padStart(4, '0');
    }
  };
};

export default useQuoteNumber;
