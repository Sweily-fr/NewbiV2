import { useQuery, useMutation } from "@apollo/client";
import { GET_MANUAL_CASHFLOW_ENTRIES } from "../graphql/queries/treasuryForecast";
import {
  UPSERT_MANUAL_CASHFLOW_ENTRY,
  DELETE_MANUAL_CASHFLOW_ENTRY,
} from "../graphql/mutations/treasuryForecast";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

export const useManualCashflowEntries = () => {
  const { workspaceId } = useRequiredWorkspace();
  const { data, loading, error, refetch } = useQuery(
    GET_MANUAL_CASHFLOW_ENTRIES,
    {
      variables: { workspaceId },
      skip: !workspaceId,
    },
  );
  return {
    entries: data?.manualCashflowEntries || [],
    loading,
    error,
    refetch,
  };
};

export const useUpsertManualCashflowEntry = () => {
  const { workspaceId } = useRequiredWorkspace();
  const [mutate, { loading }] = useMutation(UPSERT_MANUAL_CASHFLOW_ENTRY, {
    refetchQueries: [
      { query: GET_MANUAL_CASHFLOW_ENTRIES, variables: { workspaceId } },
      "GetTreasuryForecastData",
    ],
    awaitRefetchQueries: false,
  });

  const upsertEntry = async (input) => {
    try {
      const result = await mutate({
        variables: { input: { ...input, workspaceId } },
      });
      if (result.data?.upsertManualCashflowEntry) {
        toast.success(
          input.id ? "Entrée mise à jour" : "Entrée ajoutée au prévisionnel",
        );
        return { success: true, entry: result.data.upsertManualCashflowEntry };
      }
      throw new Error("Erreur lors de la sauvegarde");
    } catch (error) {
      const msg =
        error.graphQLErrors?.[0]?.message ||
        error.message ||
        "Erreur lors de la sauvegarde";
      toast.error(msg);
      return { success: false, error };
    }
  };

  return { upsertEntry, loading };
};

export const useDeleteManualCashflowEntry = () => {
  const { workspaceId } = useRequiredWorkspace();
  const [mutate, { loading }] = useMutation(DELETE_MANUAL_CASHFLOW_ENTRY, {
    refetchQueries: [
      { query: GET_MANUAL_CASHFLOW_ENTRIES, variables: { workspaceId } },
      "GetTreasuryForecastData",
    ],
    awaitRefetchQueries: false,
  });

  const deleteEntry = async (id) => {
    try {
      const result = await mutate({ variables: { id } });
      if (result.data?.deleteManualCashflowEntry?.success) {
        toast.success("Entrée supprimée");
        return { success: true };
      }
      throw new Error("Erreur lors de la suppression");
    } catch (error) {
      toast.error(error.message || "Erreur lors de la suppression");
      return { success: false, error };
    }
  };

  return { deleteEntry, loading };
};
