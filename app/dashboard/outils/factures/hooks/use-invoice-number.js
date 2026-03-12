import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_INVOICE_NUMBERS, INVOICE_STATUS } from "@/src/graphql/invoiceQueries";
import { useRequiredWorkspace } from '@/src/hooks/useWorkspace';

export const useInvoiceNumber = (prefix) => {
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  const { data, loading, error } = useQuery(GET_INVOICE_NUMBERS, {
    variables: { workspaceId },
    fetchPolicy: 'cache-and-network',
    skip: !workspaceId,
  });

  // Tout calculer en une seule passe, sans useState ni useEffect
  const computed = useMemo(() => {
    const invoices = data?.invoices?.invoices;
    if (!invoices) {
      return { lastNumber: 0, anyDocumentsExist: false, hasDocumentsForPrefix: false };
    }

    // Factures finalisées uniquement (non-brouillon, avec numéro)
    const finalizedInvoices = invoices.filter(invoice => {
      return invoice.status !== INVOICE_STATUS.DRAFT
        && invoice.number
        && invoice.number.trim() !== '';
    });

    // Vérifier si des documents finalisés existent (tous préfixes confondus)
    const anyDocumentsExist = finalizedInvoices.some(invoice =>
      /^\d+$/.test(invoice.number) && parseInt(invoice.number, 10) > 0
    );

    // Filtrer par préfixe pour calculer le prochain numéro
    if (!prefix) {
      return { lastNumber: 0, anyDocumentsExist, hasDocumentsForPrefix: false };
    }

    const numbers = finalizedInvoices
      .filter(invoice => invoice.prefix === prefix)
      .map(invoice => /^\d+$/.test(invoice.number) ? parseInt(invoice.number, 10) : null)
      .filter(num => num !== null && num > 0);

    const lastNumber = numbers.length > 0 ? Math.max(...numbers) : 0;

    return {
      lastNumber,
      anyDocumentsExist,
      hasDocumentsForPrefix: numbers.length > 0,
    };
  }, [data, prefix]);

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
