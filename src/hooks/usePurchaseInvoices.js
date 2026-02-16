import { useQuery, useMutation } from "@apollo/client";
import {
  GET_PURCHASE_INVOICES,
  GET_PURCHASE_INVOICE,
  GET_PURCHASE_INVOICE_STATS,
  GET_PURCHASE_INVOICE_RECONCILIATION_MATCHES,
  GET_SUPPLIERS,
} from "../graphql/queries/purchaseInvoices";
import {
  CREATE_PURCHASE_INVOICE,
  UPDATE_PURCHASE_INVOICE,
  DELETE_PURCHASE_INVOICE,
  ADD_PURCHASE_INVOICE_FILE,
  REMOVE_PURCHASE_INVOICE_FILE,
  MARK_PURCHASE_INVOICE_AS_PAID,
  BULK_UPDATE_PURCHASE_INVOICE_STATUS,
  BULK_DELETE_PURCHASE_INVOICES,
  BULK_CATEGORIZE_PURCHASE_INVOICES,
  RECONCILE_PURCHASE_INVOICE,
  UNRECONCILE_PURCHASE_INVOICE,
  CREATE_SUPPLIER,
  UPDATE_SUPPLIER,
  DELETE_SUPPLIER,
  MERGE_SUPPLIERS,
  SYNC_PURCHASE_INVOICES_FROM_SUPERPDP,
  ACKNOWLEDGE_PURCHASE_INVOICE_EINVOICE,
} from "../graphql/mutations/purchaseInvoices";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

export const usePurchaseInvoices = (filters = {}) => {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_PURCHASE_INVOICES, {
    variables: {
      workspaceId,
      page: 1,
      limit: 50,
      ...filters,
    },
    fetchPolicy: "cache-and-network",
    skip: !workspaceId,
  });

  return {
    invoices: data?.purchaseInvoices?.items || [],
    totalCount: data?.purchaseInvoices?.totalCount || 0,
    currentPage: data?.purchaseInvoices?.currentPage || 1,
    totalPages: data?.purchaseInvoices?.totalPages || 1,
    hasNextPage: data?.purchaseInvoices?.hasNextPage || false,
    loading,
    error,
    refetch,
  };
};

export const usePurchaseInvoice = (id) => {
  const { data, loading, error, refetch } = useQuery(GET_PURCHASE_INVOICE, {
    variables: { id },
    skip: !id,
    fetchPolicy: "network-only",
  });

  return {
    invoice: data?.purchaseInvoice || null,
    loading,
    error,
    refetch,
  };
};

export const usePurchaseInvoiceStats = () => {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_PURCHASE_INVOICE_STATS, {
    variables: { workspaceId },
    fetchPolicy: "cache-and-network",
    skip: !workspaceId,
  });

  return {
    stats: data?.purchaseInvoiceStats || {
      totalToPay: 0,
      totalToPayCount: 0,
      totalOverdue: 0,
      totalOverdueCount: 0,
      paidThisMonth: 0,
      paidThisMonthCount: 0,
      totalThisMonth: 0,
      totalThisMonthCount: 0,
    },
    loading,
    error,
    refetch,
  };
};

export const useCreatePurchaseInvoice = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [createMutation, { loading }] = useMutation(CREATE_PURCHASE_INVOICE, {
    refetchQueries: [
      { query: GET_PURCHASE_INVOICES, variables: { workspaceId, page: 1, limit: 50 } },
      { query: GET_PURCHASE_INVOICE_STATS, variables: { workspaceId } },
    ],
    awaitRefetchQueries: false,
    onCompleted: () => toast.success("Facture d'achat créée"),
    onError: (error) => toast.error(error.message || "Erreur lors de la création"),
  });

  const createInvoice = async (input) => {
    const result = await createMutation({
      variables: { input: { ...input, workspaceId } },
    });
    return result?.data?.createPurchaseInvoice;
  };

  return { createInvoice, loading };
};

export const useUpdatePurchaseInvoice = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [updateMutation, { loading }] = useMutation(UPDATE_PURCHASE_INVOICE, {
    refetchQueries: [
      { query: GET_PURCHASE_INVOICES, variables: { workspaceId, page: 1, limit: 50 } },
      { query: GET_PURCHASE_INVOICE_STATS, variables: { workspaceId } },
    ],
    awaitRefetchQueries: false,
    onCompleted: () => toast.success("Facture mise à jour"),
    onError: (error) => toast.error(error.message || "Erreur lors de la mise à jour"),
  });

  const updateInvoice = async (id, input) => {
    const result = await updateMutation({ variables: { id, input } });
    return result?.data?.updatePurchaseInvoice;
  };

  return { updateInvoice, loading };
};

export const useDeletePurchaseInvoice = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [deleteMutation, { loading }] = useMutation(DELETE_PURCHASE_INVOICE, {
    refetchQueries: [
      { query: GET_PURCHASE_INVOICES, variables: { workspaceId, page: 1, limit: 50 } },
      { query: GET_PURCHASE_INVOICE_STATS, variables: { workspaceId } },
    ],
    awaitRefetchQueries: false,
  });

  const deleteInvoice = async (id) => {
    try {
      const result = await deleteMutation({ variables: { id } });
      if (result.data?.deletePurchaseInvoice?.success) {
        toast.success("Facture supprimée");
        return { success: true };
      }
      throw new Error(result.data?.deletePurchaseInvoice?.message);
    } catch (error) {
      toast.error(error.message || "Erreur lors de la suppression");
      return { success: false, error };
    }
  };

  return { deleteInvoice, loading };
};

export const useAddPurchaseInvoiceFile = () => {
  const [addFileMutation, { loading }] = useMutation(ADD_PURCHASE_INVOICE_FILE);

  const addFile = async (purchaseInvoiceId, input) => {
    try {
      const result = await addFileMutation({
        variables: { purchaseInvoiceId, input },
      });
      return { success: true, data: result.data?.addPurchaseInvoiceFile };
    } catch (error) {
      toast.error("Erreur lors de l'ajout du fichier");
      return { success: false, error };
    }
  };

  return { addFile, loading };
};

export const useRemovePurchaseInvoiceFile = () => {
  const [removeFileMutation, { loading }] = useMutation(REMOVE_PURCHASE_INVOICE_FILE);

  const removeFile = async (purchaseInvoiceId, fileId) => {
    try {
      await removeFileMutation({ variables: { purchaseInvoiceId, fileId } });
      toast.success("Fichier supprimé");
      return { success: true };
    } catch (error) {
      toast.error("Erreur lors de la suppression du fichier");
      return { success: false, error };
    }
  };

  return { removeFile, loading };
};

export const useMarkAsPaid = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [markMutation, { loading }] = useMutation(MARK_PURCHASE_INVOICE_AS_PAID, {
    refetchQueries: [
      { query: GET_PURCHASE_INVOICES, variables: { workspaceId, page: 1, limit: 50 } },
      { query: GET_PURCHASE_INVOICE_STATS, variables: { workspaceId } },
    ],
    awaitRefetchQueries: false,
    onCompleted: () => toast.success("Facture marquée comme payée"),
    onError: (error) => toast.error(error.message || "Erreur"),
  });

  const markAsPaid = async (id, paymentDate, paymentMethod) => {
    const result = await markMutation({ variables: { id, paymentDate, paymentMethod } });
    return result?.data?.markPurchaseInvoiceAsPaid;
  };

  return { markAsPaid, loading };
};

export const useBulkUpdateStatus = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [bulkMutation, { loading }] = useMutation(BULK_UPDATE_PURCHASE_INVOICE_STATUS, {
    refetchQueries: [
      { query: GET_PURCHASE_INVOICES, variables: { workspaceId, page: 1, limit: 50 } },
      { query: GET_PURCHASE_INVOICE_STATS, variables: { workspaceId } },
    ],
    awaitRefetchQueries: false,
    onCompleted: (data) => toast.success(data.bulkUpdatePurchaseInvoiceStatus.message),
    onError: (error) => toast.error(error.message || "Erreur"),
  });

  const bulkUpdateStatus = async (ids, status) => {
    const result = await bulkMutation({ variables: { ids, status } });
    return result?.data?.bulkUpdatePurchaseInvoiceStatus;
  };

  return { bulkUpdateStatus, loading };
};

export const useBulkDelete = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [bulkMutation, { loading }] = useMutation(BULK_DELETE_PURCHASE_INVOICES, {
    refetchQueries: [
      { query: GET_PURCHASE_INVOICES, variables: { workspaceId, page: 1, limit: 50 } },
      { query: GET_PURCHASE_INVOICE_STATS, variables: { workspaceId } },
    ],
    awaitRefetchQueries: false,
    onCompleted: (data) => toast.success(data.bulkDeletePurchaseInvoices.message),
    onError: (error) => toast.error(error.message || "Erreur"),
  });

  const bulkDelete = async (ids) => {
    const result = await bulkMutation({ variables: { ids } });
    return result?.data?.bulkDeletePurchaseInvoices;
  };

  return { bulkDelete, loading };
};

export const useBulkCategorize = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [bulkMutation, { loading }] = useMutation(BULK_CATEGORIZE_PURCHASE_INVOICES, {
    refetchQueries: [
      { query: GET_PURCHASE_INVOICES, variables: { workspaceId, page: 1, limit: 50 } },
    ],
    awaitRefetchQueries: false,
    onCompleted: (data) => toast.success(data.bulkCategorizePurchaseInvoices.message),
    onError: (error) => toast.error(error.message || "Erreur"),
  });

  const bulkCategorize = async (ids, category) => {
    const result = await bulkMutation({ variables: { ids, category } });
    return result?.data?.bulkCategorizePurchaseInvoices;
  };

  return { bulkCategorize, loading };
};

export const useReconcilePurchaseInvoice = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [reconcileMutation, { loading }] = useMutation(RECONCILE_PURCHASE_INVOICE, {
    refetchQueries: [
      { query: GET_PURCHASE_INVOICES, variables: { workspaceId, page: 1, limit: 50 } },
      { query: GET_PURCHASE_INVOICE_STATS, variables: { workspaceId } },
    ],
    onCompleted: () => toast.success("Rapprochement effectué"),
    onError: (error) => toast.error(error.message || "Erreur de rapprochement"),
  });

  const reconcile = async (purchaseInvoiceId, transactionIds) => {
    const result = await reconcileMutation({ variables: { purchaseInvoiceId, transactionIds } });
    return result?.data?.reconcilePurchaseInvoice;
  };

  return { reconcile, loading };
};

export const useReconciliationSuggestions = (purchaseInvoiceId) => {
  const { data, loading, refetch } = useQuery(GET_PURCHASE_INVOICE_RECONCILIATION_MATCHES, {
    variables: { purchaseInvoiceId },
    skip: !purchaseInvoiceId,
    fetchPolicy: "network-only",
  });

  return {
    suggestions: data?.purchaseInvoiceReconciliationMatches || [],
    loading,
    refetch,
  };
};

// --- SUPPLIERS ---

export const useSuppliers = (search = "") => {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_SUPPLIERS, {
    variables: { workspaceId, page: 1, limit: 200, search },
    fetchPolicy: "cache-and-network",
    skip: !workspaceId,
  });

  return {
    suppliers: data?.suppliers?.items || [],
    totalCount: data?.suppliers?.totalCount || 0,
    loading,
    error,
    refetch,
  };
};

export const useCreateSupplier = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [createMutation, { loading }] = useMutation(CREATE_SUPPLIER, {
    refetchQueries: [
      { query: GET_SUPPLIERS, variables: { workspaceId, page: 1, limit: 200, search: "" } },
    ],
    awaitRefetchQueries: false,
    onCompleted: () => toast.success("Fournisseur créé"),
    onError: (error) => toast.error(error.message || "Erreur"),
  });

  const createSupplier = async (input) => {
    const result = await createMutation({
      variables: { input: { ...input, workspaceId } },
    });
    return result?.data?.createSupplier;
  };

  return { createSupplier, loading };
};

export const useDeleteSupplier = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [deleteMutation, { loading }] = useMutation(DELETE_SUPPLIER, {
    refetchQueries: [
      { query: GET_SUPPLIERS, variables: { workspaceId, page: 1, limit: 200, search: "" } },
    ],
    awaitRefetchQueries: false,
  });

  const deleteSupplier = async (id) => {
    try {
      const result = await deleteMutation({ variables: { id } });
      if (result.data?.deleteSupplier?.success) {
        toast.success("Fournisseur supprimé");
        return { success: true };
      }
      throw new Error(result.data?.deleteSupplier?.message);
    } catch (error) {
      toast.error(error.message || "Erreur");
      return { success: false, error };
    }
  };

  return { deleteSupplier, loading };
};

// ============================================================
// Synchronisation e-invoicing (SuperPDP)
// ============================================================

export const useSyncPurchaseInvoicesFromSuperPdp = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [syncMutation, { loading }] = useMutation(SYNC_PURCHASE_INVOICES_FROM_SUPERPDP, {
    refetchQueries: [
      { query: GET_PURCHASE_INVOICES, variables: { workspaceId, page: 1, limit: 200 } },
      { query: GET_PURCHASE_INVOICE_STATS, variables: { workspaceId } },
    ],
    awaitRefetchQueries: true,
  });

  const syncFromSuperPdp = async (since) => {
    try {
      const result = await syncMutation({
        variables: { workspaceId, since },
      });

      const data = result.data?.syncPurchaseInvoicesFromSuperPdp;

      if (data?.success) {
        if (data.imported > 0) {
          toast.success(`${data.imported} facture(s) importée(s) depuis SuperPDP`);
        } else {
          toast.info("Aucune nouvelle facture à importer");
        }
        return data;
      }

      toast.error(data?.message || "Erreur de synchronisation");
      return data;
    } catch (error) {
      toast.error(error.message || "Erreur de synchronisation SuperPDP");
      return { success: false, error };
    }
  };

  return { syncFromSuperPdp, loading };
};

export const useAcknowledgePurchaseInvoiceEInvoice = () => {
  const [acknowledgeMutation, { loading }] = useMutation(ACKNOWLEDGE_PURCHASE_INVOICE_EINVOICE);

  const acknowledge = async (id) => {
    try {
      const result = await acknowledgeMutation({ variables: { id } });
      toast.success("Facture électronique acceptée");
      return result.data?.acknowledgePurchaseInvoiceEInvoice;
    } catch (error) {
      toast.error(error.message || "Erreur");
      return null;
    }
  };

  return { acknowledge, loading };
};
