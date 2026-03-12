import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_PURCHASE_ORDER_NUMBERS, PURCHASE_ORDER_STATUS } from "@/src/graphql/purchaseOrderQueries";
import { useRequiredWorkspace } from '@/src/hooks/useWorkspace';

export const usePurchaseOrderNumber = (prefix) => {
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  const { data, loading, error } = useQuery(GET_PURCHASE_ORDER_NUMBERS, {
    variables: { workspaceId },
    fetchPolicy: 'cache-and-network',
    skip: !workspaceId,
  });

  const computed = useMemo(() => {
    const orders = data?.purchaseOrders?.purchaseOrders;
    if (!orders) {
      return { lastNumber: 0, anyDocumentsExist: false, hasDocumentsForPrefix: false };
    }

    const finalizedOrders = orders.filter(po => {
      return po.status !== PURCHASE_ORDER_STATUS.DRAFT
        && po.number
        && po.number.trim() !== '';
    });

    const anyDocumentsExist = finalizedOrders.some(po =>
      /^\d+$/.test(po.number) && parseInt(po.number, 10) > 0
    );

    if (!prefix) {
      return { lastNumber: 0, anyDocumentsExist, hasDocumentsForPrefix: false };
    }

    const numbers = finalizedOrders
      .filter(po => po.prefix === prefix)
      .map(po => /^\d+$/.test(po.number) ? parseInt(po.number, 10) : null)
      .filter(num => num !== null && num > 0);

    const lastNumber = numbers.length > 0 ? Math.max(...numbers) : 0;

    return {
      lastNumber,
      anyDocumentsExist,
      hasDocumentsForPrefix: numbers.length > 0,
    };
  }, [data, prefix]);

  const isLoading = loading || workspaceLoading;
  const nextNumber = computed.lastNumber + 1;

  const validateNumber = (number) => {
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
    lastNumber: computed.lastNumber,
    nextNumber,
    validateNumber,
    isLoading,
    error,
    hasExistingOrders: () => computed.anyDocumentsExist,
    hasDocumentsForPrefix: computed.hasDocumentsForPrefix,
    getFormattedNextNumber: () => String(nextNumber).padStart(4, '0'),
  };
};

export default usePurchaseOrderNumber;
