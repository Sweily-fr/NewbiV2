import { useQuery, useMutation } from "@apollo/client";
import { GET_DETECTED_RECURRENCES } from "../graphql/queries/treasuryForecast";
import {
  MUTE_DETECTED_RECURRENCE,
  UPDATE_DETECTED_RECURRENCE,
  DELETE_DETECTED_RECURRENCE,
  RUN_RECURRENCE_DETECTION,
} from "../graphql/mutations/treasuryForecast";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useForecastScenario } from "@/src/contexts/forecast-scenario-context";

// Dans un scénario, isMuted/isActive sont l'état effectif dans ce scénario et
// scenarioOverride signale que le scénario diffère de Base.
export const useDetectedRecurrences = () => {
  const { workspaceId } = useRequiredWorkspace();
  const { scenarioId } = useForecastScenario();
  const { data, loading, error, refetch } = useQuery(GET_DETECTED_RECURRENCES, {
    variables: { workspaceId, scenarioId: scenarioId || undefined },
    skip: !workspaceId,
  });
  return {
    recurrences: data?.detectedRecurrences || [],
    loading,
    error,
    refetch,
  };
};

// Dans un scénario, le masquage ne concerne que ce scénario (Base intacte).
export const useMuteDetectedRecurrence = () => {
  const { scenarioId, isScenario } = useForecastScenario();
  const [mutate, { loading }] = useMutation(MUTE_DETECTED_RECURRENCE, {
    refetchQueries: [
      "GetDetectedRecurrences",
      "GetTreasuryForecastData",
      "GetForecastOccurrences",
      "GetForecastMonthDetails",
    ],
    awaitRefetchQueries: false,
  });

  // `silent` : pas de toast (l'appelant affiche le sien, ex. remplacement
  // d'une détection par une prévision manuelle).
  const setMuted = async (id, muted, { silent = false } = {}) => {
    try {
      const result = await mutate({
        variables: { id, muted, scenarioId: scenarioId || undefined },
      });
      if (result.data?.muteDetectedRecurrence) {
        const suffix = isScenario ? " dans ce scénario" : "";
        if (!silent) {
          toast.success(
            muted
              ? `Récurrence masquée${suffix}`
              : `Récurrence réactivée${suffix}`,
          );
        }
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

  return { setMuted, loading };
};

// « Modifier » une récurrence détectée (catégorie, montant, périodicité,
// libellé). Action de Base : les surcharges sont communes à tous les
// scénarios. Un input vide rétablit les valeurs détectées.
export const useUpdateDetectedRecurrence = () => {
  const [mutate, { loading }] = useMutation(UPDATE_DETECTED_RECURRENCE, {
    refetchQueries: [
      "GetDetectedRecurrences",
      "GetTreasuryForecastData",
      "GetForecastOccurrences",
      "GetForecastMonthDetails",
    ],
    awaitRefetchQueries: false,
  });

  const updateRecurrence = async (id, input, { reset = false } = {}) => {
    try {
      const result = await mutate({ variables: { id, input } });
      if (result.data?.updateDetectedRecurrence) {
        toast.success(
          reset ? "Valeurs détectées rétablies" : "Récurrence modifiée",
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

  return { updateRecurrence, loading };
};

export const useDeleteDetectedRecurrence = () => {
  const [mutate, { loading }] = useMutation(DELETE_DETECTED_RECURRENCE, {
    refetchQueries: [
      "GetDetectedRecurrences",
      "GetTreasuryForecastData",
      "GetForecastOccurrences",
      "GetForecastMonthDetails",
    ],
    awaitRefetchQueries: false,
  });

  const deleteRecurrence = async (id) => {
    try {
      const result = await mutate({ variables: { id } });
      if (result.data?.deleteDetectedRecurrence?.success) {
        toast.success("Récurrence supprimée");
        return { success: true };
      }
      throw new Error("Erreur lors de la suppression");
    } catch (error) {
      toast.error(
        error.graphQLErrors?.[0]?.message ||
          error.message ||
          "Erreur lors de la suppression",
      );
      return { success: false, error };
    }
  };

  return { deleteRecurrence, loading };
};

export const useRunRecurrenceDetection = () => {
  const { workspaceId } = useRequiredWorkspace();
  const [mutate, { loading }] = useMutation(RUN_RECURRENCE_DETECTION, {
    refetchQueries: ["GetDetectedRecurrences", "GetTreasuryForecastData"],
    awaitRefetchQueries: false,
  });

  const runDetection = async () => {
    try {
      const result = await mutate({ variables: { workspaceId } });
      const count = result.data?.runRecurrenceDetection ?? 0;
      toast.success(
        count > 0
          ? `${count} récurrence${count > 1 ? "s" : ""} active${count > 1 ? "s" : ""}`
          : "Aucune récurrence détectée pour le moment",
      );
      return { success: true, count };
    } catch (error) {
      toast.error(
        error.graphQLErrors?.[0]?.message ||
          error.message ||
          "Erreur lors de la détection",
      );
      return { success: false, error };
    }
  };

  return { runDetection, loading };
};
