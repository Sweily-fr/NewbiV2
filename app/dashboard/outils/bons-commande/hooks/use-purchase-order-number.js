import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_PURCHASE_ORDERS, PURCHASE_ORDER_STATUS } from "@/src/graphql/purchaseOrderQueries";
import { useRequiredWorkspace } from '@/src/hooks/useWorkspace';

export const usePurchaseOrderNumber = () => {
  const [lastNumber, setLastNumber] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  const { data, loading, error: queryError } = useQuery(GET_PURCHASE_ORDERS, {
    variables: {
      workspaceId,
      limit: 1000
    },
    fetchPolicy: 'network-only',
    skip: !workspaceId,
  });

  useEffect(() => {
    if (data?.purchaseOrders?.purchaseOrders) {
      // Filter to only include non-draft ones
      const finalizedOrders = data.purchaseOrders.purchaseOrders
        .filter(po => {
          const isNotDraft = po.status !== PURCHASE_ORDER_STATUS.DRAFT;
          const hasNumber = po.number && po.number.trim() !== '';
          return isNotDraft && hasNumber;
        });

      // Extract numeric numbers only
      const numbers = finalizedOrders
        .map(po => {
          if (/^\d+$/.test(po.number)) {
            return parseInt(po.number, 10);
          }
          return null;
        })
        .filter(num => num !== null && num > 0);

      const highestNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      setLastNumber(highestNumber);
    }

    if (queryError) {
      setError(queryError);
    }

    setIsLoading(loading || workspaceLoading);
  }, [data, loading, queryError, workspaceLoading]);

  const getNextNumber = () => {
    if (lastNumber === null || lastNumber === undefined) {
      return 1;
    }

    const num = typeof lastNumber === 'number' ? lastNumber : parseInt(lastNumber, 10);

    if (isNaN(num)) {
      return 1;
    }

    return num + 1;
  };

  const validateNumber = (number) => {
    const num = parseInt(number, 10);
    if (isNaN(num) || num <= 0) {
      return {
        isValid: false,
        message: 'Le numéro doit être une valeur numérique positive'
      };
    }

    if (!hasExistingOrders()) {
      return { isValid: true };
    }

    const lastNum = typeof lastNumber === 'number' ? lastNumber : parseInt(lastNumber, 10);

    if (isNaN(lastNum)) {
      return { isValid: true };
    }

    if (num <= lastNum) {
      return {
        isValid: false,
        message: `Le numéro doit être supérieur à ${String(lastNum).padStart(4, '0')}`
      };
    }

    if (num > lastNum + 1) {
      return {
        isValid: false,
        message: `Le numéro doit être ${String(lastNum + 1).padStart(4, '0')} pour maintenir la séquence`
      };
    }

    return { isValid: true };
  };

  const hasExistingOrders = () => {
    return lastNumber !== null && lastNumber !== undefined && lastNumber > 0;
  };

  return {
    lastNumber,
    nextNumber: getNextNumber(),
    validateNumber,
    isLoading,
    error,
    hasExistingOrders,
    getFormattedNextNumber: () => {
      const nextNum = getNextNumber();
      return String(nextNum).padStart(4, '0');
    }
  };
};

export default usePurchaseOrderNumber;
