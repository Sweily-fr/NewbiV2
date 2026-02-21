import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_INVOICES, INVOICE_STATUS } from "@/src/graphql/invoiceQueries";
import { useRequiredWorkspace } from '@/src/hooks/useWorkspace';

export const useInvoiceNumber = (prefix) => {
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState(null);
  const [anyDocumentsExist, setAnyDocumentsExist] = useState(false);
  const [hasDocumentsForPrefix, setHasDocumentsForPrefix] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer le workspace actuel
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  // Fetch all invoices to determine the current sequential state
  const { data, loading, error: queryError } = useQuery(GET_INVOICES, {
    variables: {
      workspaceId,
      limit: 1000
    },
    fetchPolicy: 'network-only',
    skip: !workspaceId,
  });

  useEffect(() => {
    if (data?.invoices?.invoices) {
      // Filter invoices to only include non-draft ones (PENDING, COMPLETED, CANCELED)
      const finalizedInvoices = data.invoices.invoices
        .filter(invoice => {
          const isNotDraft = invoice.status !== INVOICE_STATUS.DRAFT;
          const hasNumber = invoice.number && invoice.number.trim() !== '';
          return isNotDraft && hasNumber;
        });

      // Check if ANY finalized documents exist (regardless of prefix)
      const allNumbers = finalizedInvoices
        .map(invoice => /^\d+$/.test(invoice.number) ? parseInt(invoice.number, 10) : null)
        .filter(num => num !== null && num > 0);
      setAnyDocumentsExist(allNumbers.length > 0);

      // Filter by prefix for next number calculation
      let filteredInvoices = finalizedInvoices;
      if (prefix) {
        filteredInvoices = finalizedInvoices.filter(invoice => invoice.prefix === prefix);
      }

      // Extract numeric invoice numbers only
      const numbers = filteredInvoices
        .map(invoice => {
          // Only consider purely numeric invoice numbers
          if (/^\d+$/.test(invoice.number)) {
            return parseInt(invoice.number, 10);
          }
          return null;
        })
        .filter(num => num !== null && num > 0);

      const highestNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      setLastInvoiceNumber(highestNumber);
      setHasDocumentsForPrefix(prefix ? numbers.length > 0 : allNumbers.length > 0);
    }

    if (queryError) {
      setError(queryError);
    }

    setIsLoading(loading || workspaceLoading);
  }, [data, loading, queryError, workspaceLoading, prefix]);

  // Generate the next sequential number
  const getNextInvoiceNumber = () => {
    if (lastInvoiceNumber === null || lastInvoiceNumber === undefined) {
      return 1;
    }

    const lastNumber = typeof lastInvoiceNumber === 'number' ? lastInvoiceNumber : parseInt(lastInvoiceNumber, 10);

    if (isNaN(lastNumber)) {
      return 1;
    }

    return lastNumber + 1;
  };

  // Validate invoice number using frontend logic that matches backend rules
  const validateInvoiceNumber = (number) => {
    // Basic validation: must be a positive number
    const num = parseInt(number, 10);
    if (isNaN(num) || num <= 0) {
      return {
        isValid: false,
        message: 'Le numéro doit être une valeur numérique positive'
      };
    }

    // Rule 1: If no existing invoices at all, or new prefix, allow any number (user can choose starting number)
    if (!hasExistingInvoices() || !hasDocumentsForPrefix) {
      return { isValid: true };
    }

    // Rule 2 & 3: Sequential validation (based on prefix-filtered last number)
    const lastNum = typeof lastInvoiceNumber === 'number' ? lastInvoiceNumber : parseInt(lastInvoiceNumber, 10);

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

  // Check if there are existing invoices (ANY prefix - for first-document check)
  const hasExistingInvoices = () => {
    return anyDocumentsExist;
  };

  return {
    lastInvoiceNumber,
    nextInvoiceNumber: getNextInvoiceNumber(),
    validateInvoiceNumber,
    isLoading,
    error,
    hasExistingInvoices,
    hasDocumentsForPrefix,
    // Helper function to get the next number as a formatted string
    getFormattedNextNumber: () => {
      const nextNum = getNextInvoiceNumber();
      return String(nextNum).padStart(4, '0');
    }
  };
};

export default useInvoiceNumber;
