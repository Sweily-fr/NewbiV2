import { useQuery, useMutation } from "@apollo/client";
import { GET_MANUAL_CASHFLOW_ENTRIES } from "../graphql/queries/treasuryForecast";
import {
  UPSERT_MANUAL_CASHFLOW_ENTRY,
  DELETE_MANUAL_CASHFLOW_ENTRY,
  HIDE_MANUAL_CASHFLOW_ENTRY_IN_SCENARIO,
} from "../graphql/mutations/treasuryForecast";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useForecastScenario } from "@/src/contexts/forecast-scenario-context";

// Requêtes à rafraîchir après toute écriture sur les saisies manuelles : par
// nom, pour couvrir toutes les variantes de variables (Base et scénarios).
const REFETCH_AFTER_WRITE = [
  "GetManualCashflowEntries",
  "GetTreasuryForecastData",
  "GetForecastOccurrences",
  "GetForecastMonthDetails",
];

// En Base : saisies de Base. Dans un scénario : saisies de Base (avec leur
// état hiddenInScenario) + saisies propres au scénario (scenarioId renseigné).
export const useManualCashflowEntries = () => {
  const { workspaceId } = useRequiredWorkspace();
  const { scenarioId } = useForecastScenario();
  const { data, loading, error, refetch } = useQuery(
    GET_MANUAL_CASHFLOW_ENTRIES,
    {
      variables: { workspaceId, scenarioId: scenarioId || undefined },
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

// Une saisie créée pendant qu'un scénario est actif appartient à ce scénario
// (invisible en Base). À la modification, la saisie garde son scénario.
export const useUpsertManualCashflowEntry = () => {
  const { workspaceId } = useRequiredWorkspace();
  const { scenarioId, isScenario, scenarioName } = useForecastScenario();
  const [mutate, { loading }] = useMutation(UPSERT_MANUAL_CASHFLOW_ENTRY, {
    refetchQueries: REFETCH_AFTER_WRITE,
    awaitRefetchQueries: false,
  });

  const upsertEntry = async (input) => {
    try {
      const result = await mutate({
        variables: {
          input: {
            ...input,
            workspaceId,
            ...(input.id ? {} : { scenarioId: scenarioId || undefined }),
          },
        },
      });
      if (result.data?.upsertManualCashflowEntry) {
        toast.success(
          input.id
            ? "Entrée mise à jour"
            : isScenario
              ? `Entrée ajoutée au scénario « ${scenarioName} »`
              : "Entrée ajoutée au prévisionnel",
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
  const [mutate, { loading }] = useMutation(DELETE_MANUAL_CASHFLOW_ENTRY, {
    refetchQueries: REFETCH_AFTER_WRITE,
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

// Masque (ou réaffiche) une saisie de Base dans le scénario actif uniquement.
export const useHideManualEntryInScenario = () => {
  const { scenarioId } = useForecastScenario();
  const [mutate, { loading }] = useMutation(
    HIDE_MANUAL_CASHFLOW_ENTRY_IN_SCENARIO,
    {
      refetchQueries: REFETCH_AFTER_WRITE,
      awaitRefetchQueries: false,
    },
  );

  const setHidden = async (id, hidden) => {
    if (!scenarioId) return { success: false };
    try {
      const result = await mutate({ variables: { id, scenarioId, hidden } });
      if (result.data?.hideManualCashflowEntryInScenario) {
        toast.success(
          hidden
            ? "Saisie masquée dans ce scénario"
            : "Saisie réaffichée dans ce scénario",
        );
        return { success: true };
      }
      throw new Error("Erreur lors de la mise à jour");
    } catch (error) {
      toast.error(
        error.graphQLErrors?.[0]?.message ||
          error.message ||
          "Erreur lors de la mise à jour",
      );
      return { success: false, error };
    }
  };

  return { setHidden, loading };
};
