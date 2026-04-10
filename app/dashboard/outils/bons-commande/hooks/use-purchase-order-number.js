import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_NEXT_PURCHASE_ORDER_NUMBER } from "@/src/graphql/purchaseOrderQueries";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

export const usePurchaseOrderNumber = (
  prefix,
  { autoNumbering = false } = {},
) => {
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  const { data, loading, error } = useQuery(GET_NEXT_PURCHASE_ORDER_NUMBER, {
    variables: { workspaceId, prefix, autoNumbering },
    fetchPolicy: "network-only",
    skip: !workspaceId || !prefix,
    notifyOnNetworkStatusChange: true,
  });

  const computed = useMemo(() => {
    const nextNumberStr = data?.nextPurchaseOrderNumber;
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
  const nextNumber =
    computed.hasData && !isLoading ? computed.lastNumber + 1 : null;

  const validateNumber = (number) => {
    const num = parseInt(number, 10);
    if (isNaN(num) || num <= 0) {
      return {
        isValid: false,
        message: "Le numéro doit être une valeur numérique positive",
      };
    }

    if (autoNumbering) {
      if (nextNumber && num !== nextNumber) {
        return {
          isValid: false,
          message: `Le numéro doit être ${String(nextNumber).padStart(4, "0")} (numérotation automatique)`,
        };
      }
      return { isValid: true };
    }

    if (!computed.hasDocumentsForPrefix) {
      return { isValid: true };
    }

    if (num <= computed.lastNumber) {
      return {
        isValid: false,
        message: `Le numéro doit être supérieur à ${String(computed.lastNumber).padStart(4, "0")}`,
      };
    }
    if (num > computed.lastNumber + 1) {
      return {
        isValid: false,
        message: `Le numéro doit être ${String(computed.lastNumber + 1).padStart(4, "0")} pour maintenir la séquence`,
      };
    }

    return { isValid: true };
  };

  return {
    lastNumber: computed.lastNumber,
    nextNumber,
    validateNumber,
    isLoading,
    error,
    hasExistingOrders: () => computed.hasDocumentsForPrefix,
    hasDocumentsForPrefix: !isLoading && computed.hasDocumentsForPrefix,
    getFormattedNextNumber: () =>
      nextNumber ? String(nextNumber).padStart(4, "0") : null,
  };
};

export default usePurchaseOrderNumber;
