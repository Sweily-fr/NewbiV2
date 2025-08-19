import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_INVOICES, INVOICE_STATUS } from "@/src/graphql/invoiceQueries";
import { useRequiredWorkspace } from '@/src/hooks/useWorkspace';

export const useInvoiceNumber = () => {
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Récupérer le workspace actuel
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  // Fetch all finalized invoices (PENDING and COMPLETED) to find the highest sequential number
  // We exclude DRAFT invoices as they don't have final invoice numbers
  const { data, loading, error: queryError } = useQuery(GET_INVOICES, {
    variables: { 
      workspaceId, // AJOUTÉ : workspaceId requis
      limit: 1000 // Adjust limit as needed
      // No status filter - we'll filter out DRAFT invoices in the processing logic
    },
    fetchPolicy: 'cache-and-network',
    skip: !workspaceId, // Ne pas exécuter sans workspaceId
  });

  useEffect(() => {
    console.log('=== useInvoiceNumber useEffect triggered ===');
    console.log('data:', data);
    console.log('data?.invoices:', data?.invoices);
    console.log('data?.invoices?.invoices:', data?.invoices?.invoices);
    
    if (data?.invoices?.invoices) {
      console.log('Fetched invoices count:', data.invoices.invoices.length);
      console.log('Fetched invoices:', data.invoices.invoices);
      
      // Log each invoice status and number
      data.invoices.invoices.forEach((invoice, index) => {
        console.log(`Invoice ${index}:`, {
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          isDraft: invoice.status === INVOICE_STATUS.DRAFT
        });
      });
      
      // Filter out DRAFT invoices and extract all invoice numbers to find the highest sequential number
      const finalizedInvoices = data.invoices.invoices
        .filter(invoice => {
          const isNotDraft = invoice.status !== INVOICE_STATUS.DRAFT;
          const hasNumber = invoice.number && invoice.number.trim() !== '';
          console.log(`Filtering invoice ${invoice.id}:`, {
            status: invoice.status,
            isNotDraft,
            number: invoice.number,
            hasNumber,
            willInclude: isNotDraft && hasNumber
          });
          return isNotDraft && hasNumber;
        });
      
      console.log('Finalized invoices count:', finalizedInvoices.length);
      console.log('Finalized invoices (PENDING + COMPLETED):', finalizedInvoices);
      
      const numbers = finalizedInvoices
        .map(invoice => {
          console.log('Processing invoice:', invoice.number, 'with status:', invoice.status);
          // Extract numeric part from the invoice number (handle different formats)
          const match = invoice.number.match(/(\d+)$/);
          const num = match ? parseInt(match[1], 10) : 0;
          console.log('Extracted number:', num);
          return num;
        })
        .filter(num => !isNaN(num) && num > 0); // Filter out invalid numbers
      
      console.log('All valid invoice numbers:', numbers);
      const highestNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      console.log('Highest sequential number found:', highestNumber);
      setLastInvoiceNumber(highestNumber);
    }
    
    if (queryError) {
      console.error('Error fetching invoices:', queryError);
      setError(queryError);
    }
    
    setIsLoading(loading || workspaceLoading);
  }, [data, loading, queryError, workspaceLoading]);

  // Generate the next sequential number
  const getNextInvoiceNumber = () => {
    console.log('Getting next invoice number. Current lastInvoiceNumber:', lastInvoiceNumber);
    
    if (lastInvoiceNumber === null || lastInvoiceNumber === undefined) {
      console.log('No last invoice number, returning 1');
      return 1;
    }
    
    try {
      const lastNumber = typeof lastInvoiceNumber === 'number' ? lastInvoiceNumber : parseInt(lastInvoiceNumber, 10);
      console.log('Parsed last number:', lastNumber);
      
      if (isNaN(lastNumber)) {
        console.log('Failed to parse last number, returning 1');
        return 1;
      }
      
      // Calculate next sequential number
      const nextNumber = lastNumber + 1;
      console.log('Next sequential number will be:', nextNumber);
      return nextNumber;
    } catch (err) {
      console.error('Error generating next invoice number:', err);
      return 1;
    }
  };

  // Validate if a number is within the allowed sequential range
  const validateInvoiceNumber = (number) => {
    console.log('Validating invoice number:', number, 'against lastInvoiceNumber:', lastInvoiceNumber);
    console.log('hasExistingInvoices():', hasExistingInvoices());
    
    // Basic validation: must be a positive number
    const num = parseInt(number, 10);
    if (isNaN(num) || num <= 0) {
      return { 
        isValid: false, 
        message: 'Le numéro doit être une valeur numérique positive' 
      };
    }
    
    // If no existing invoices, allow free choice of starting number
    if (!hasExistingInvoices()) {
      console.log('No existing invoices - allowing free choice of starting number');
      return { isValid: true };
    }
    
    try {
      const currentNum = parseInt(number, 10);
      const lastNum = typeof lastInvoiceNumber === 'number' ? lastInvoiceNumber : parseInt(lastInvoiceNumber, 10);
      
      console.log('Comparing currentNum:', currentNum, 'with lastNum:', lastNum);
      
      if (isNaN(currentNum) || currentNum <= 0) {
        return { 
          isValid: false, 
          message: 'Le numéro doit être une valeur numérique positive' 
        };
      }
      
      // Sequential validation: number must be greater than the last one
      if (currentNum <= lastNum) {
        return { 
          isValid: false, 
          message: `Le numéro doit être supérieur à ${lastNum} (numéro séquentiel)` 
        };
      }
      
      // Sequential validation: number cannot be more than 2 higher than the last one
      if (currentNum > lastNum + 2) {
        return { 
          isValid: false, 
          message: `Le numéro ne peut pas dépasser ${lastNum + 2} (numérotation séquentielle)` 
        };
      }
      
      console.log('Validation passed for number:', currentNum);
      return { isValid: true };
    } catch (err) {
      console.error('Error validating invoice number:', err);
      return { 
        isValid: false, 
        message: 'Erreur de validation du numéro' 
      };
    }
  };

  // Check if there are existing invoices
  const hasExistingInvoices = () => {
    return lastInvoiceNumber !== null && lastInvoiceNumber !== undefined && lastInvoiceNumber > 0;
  };

  return {
    lastInvoiceNumber,
    nextInvoiceNumber: getNextInvoiceNumber(),
    validateInvoiceNumber,
    isLoading,
    error,
    hasExistingInvoices,
    // Helper function to get the next number as a formatted string if needed
    getFormattedNextNumber: () => {
      const nextNum = getNextInvoiceNumber();
      return String(nextNum).padStart(6, '0');
    }
  };
};

export default useInvoiceNumber;
