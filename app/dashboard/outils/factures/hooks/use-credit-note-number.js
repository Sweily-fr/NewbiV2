import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CREDIT_NOTES } from "@/src/graphql/creditNoteQueries";
import { useRequiredWorkspace } from '@/src/hooks/useWorkspace';

export const useCreditNoteNumber = () => {
  const [lastCreditNoteNumber, setLastCreditNoteNumber] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Récupérer le workspace actuel
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  // Fetch all credit notes to determine the current sequential state
  const { data, loading, error: queryError } = useQuery(GET_CREDIT_NOTES, {
    variables: { 
      workspaceId,
      limit: 1000
    },
    fetchPolicy: 'network-only',
    skip: !workspaceId,
  });

  useEffect(() => {
    if (data?.creditNotes?.creditNotes) {
      // Filter credit notes to only include finalized ones (CREATED status)
      const finalizedCreditNotes = data.creditNotes.creditNotes
        .filter(creditNote => {
          const isFinalized = creditNote.status === 'CREATED';
          const hasNumber = creditNote.number && creditNote.number.trim() !== '';
          return isFinalized && hasNumber;
        });
      
      // Extract numeric credit note numbers only
      const numbers = finalizedCreditNotes
        .map(creditNote => {
          // Only consider purely numeric credit note numbers
          if (/^\d+$/.test(creditNote.number)) {
            return parseInt(creditNote.number, 10);
          }
          return null;
        })
        .filter(num => num !== null && num > 0);
      
      const highestNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      setLastCreditNoteNumber(highestNumber);
    }
    
    if (queryError) {
      setError(queryError);
    }
    
    setIsLoading(loading || workspaceLoading);
  }, [data, loading, queryError, workspaceLoading]);

  // Generate the next sequential number
  const getNextCreditNoteNumber = () => {
    if (lastCreditNoteNumber === null || lastCreditNoteNumber === undefined) {
      return 1;
    }
    
    const lastNumber = typeof lastCreditNoteNumber === 'number' ? lastCreditNoteNumber : parseInt(lastCreditNoteNumber, 10);
    
    if (isNaN(lastNumber)) {
      return 1;
    }
    
    return lastNumber + 1;
  };

  // Validate credit note number using frontend logic that matches backend rules
  const validateCreditNoteNumber = (number) => {
    // Basic validation: must be a positive number
    const num = parseInt(number, 10);
    if (isNaN(num) || num <= 0) {
      return { 
        isValid: false, 
        message: 'Le numéro doit être une valeur numérique positive' 
      };
    }
    
    // Rule 1: If no existing credit notes, allow any number (user can choose starting number)
    if (!hasExistingCreditNotes()) {
      return { isValid: true };
    }
    
    // Rule 2 & 3: Sequential validation
    const lastNum = typeof lastCreditNoteNumber === 'number' ? lastCreditNoteNumber : parseInt(lastCreditNoteNumber, 10);
    
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

  // Check if there are existing credit notes
  const hasExistingCreditNotes = () => {
    return lastCreditNoteNumber !== null && lastCreditNoteNumber !== undefined && lastCreditNoteNumber > 0;
  };

  return {
    lastCreditNoteNumber,
    nextCreditNoteNumber: getNextCreditNoteNumber(),
    validateCreditNoteNumber,
    isLoading,
    error,
    hasExistingCreditNotes,
    // Helper function to get the next number as a formatted string
    getFormattedNextNumber: () => {
      const nextNum = getNextCreditNoteNumber();
      return String(nextNum).padStart(4, '0');
    }
  };
};

export default useCreditNoteNumber;
