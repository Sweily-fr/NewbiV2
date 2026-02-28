import { useQuery, useMutation } from "@apollo/client";
import { GET_GMAIL_CONNECTION, GET_GMAIL_SYNC_STATS } from "@/src/graphql/queries/gmailConnectionQueries";
import {
  DISCONNECT_GMAIL,
  TRIGGER_GMAIL_SYNC,
  UPDATE_GMAIL_SCAN_PERIOD,
} from "@/src/graphql/mutations/gmailConnectionMutations";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { toast } from "@/src/components/ui/sonner";

export const useGmailConnection = () => {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_GMAIL_CONNECTION, {
    variables: { workspaceId },
    fetchPolicy: "cache-and-network",
    skip: !workspaceId,
  });

  const { data: statsData, loading: statsLoading, refetch: refetchStats } = useQuery(GET_GMAIL_SYNC_STATS, {
    variables: { workspaceId },
    fetchPolicy: "cache-and-network",
    skip: !workspaceId,
  });

  return {
    connection: data?.gmailConnection || null,
    stats: statsData?.gmailSyncStats || { totalEmailsScanned: 0, totalInvoicesFound: 0, pendingReview: 0, lastSyncAt: null },
    loading: loading || statsLoading,
    error,
    refetch: () => {
      refetch();
      refetchStats();
    },
  };
};

export const useDisconnectGmail = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [disconnectMutation, { loading }] = useMutation(DISCONNECT_GMAIL, {
    refetchQueries: [
      { query: GET_GMAIL_CONNECTION, variables: { workspaceId } },
      { query: GET_GMAIL_SYNC_STATS, variables: { workspaceId } },
    ],
    awaitRefetchQueries: true,
  });

  const disconnect = async (connectionId) => {
    try {
      await disconnectMutation({ variables: { connectionId } });
      toast.success("Gmail déconnecté");
      return true;
    } catch (err) {
      console.error("Erreur déconnexion Gmail:", err);
      toast.error("Erreur lors de la déconnexion Gmail");
      return false;
    }
  };

  return { disconnect, loading };
};

export const useTriggerGmailSync = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [syncMutation, { loading }] = useMutation(TRIGGER_GMAIL_SYNC, {
    refetchQueries: [
      { query: GET_GMAIL_CONNECTION, variables: { workspaceId } },
      { query: GET_GMAIL_SYNC_STATS, variables: { workspaceId } },
    ],
  });

  const triggerSync = async (connectionId) => {
    try {
      const result = await syncMutation({ variables: { connectionId } });
      const data = result.data?.triggerGmailSync;
      if (data?.success) {
        toast.success(data.message || `${data.invoicesFound} facture(s) trouvée(s)`);
      } else {
        toast.error(data?.message || "Erreur lors de la synchronisation");
      }
      return data;
    } catch (err) {
      console.error("Erreur sync Gmail:", err);
      toast.error("Erreur lors de la synchronisation Gmail");
      return null;
    }
  };

  return { triggerSync, loading };
};

export const useUpdateGmailScanPeriod = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [updateMutation, { loading }] = useMutation(UPDATE_GMAIL_SCAN_PERIOD, {
    refetchQueries: [
      { query: GET_GMAIL_CONNECTION, variables: { workspaceId } },
    ],
  });

  const updateScanPeriod = async (connectionId, scanPeriodMonths) => {
    try {
      await updateMutation({ variables: { connectionId, scanPeriodMonths } });
      toast.success("Période de scan mise à jour");
      return true;
    } catch (err) {
      console.error("Erreur mise à jour période:", err);
      toast.error("Erreur lors de la mise à jour");
      return false;
    }
  };

  return { updateScanPeriod, loading };
};
