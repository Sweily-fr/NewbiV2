import { useQuery, useMutation } from "@apollo/client";
import { GET_DETECTED_RECURRENCES } from "../graphql/queries/treasuryForecast";
import {
  MUTE_DETECTED_RECURRENCE,
  RUN_RECURRENCE_DETECTION,
} from "../graphql/mutations/treasuryForecast";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

export const useDetectedRecurrences = () => {
  const { workspaceId } = useRequiredWorkspace();
  const { data, loading, error, refetch } = useQuery(GET_DETECTED_RECURRENCES, {
    variables: { workspaceId },
    skip: !workspaceId,
  });
  return {
    recurrences: data?.detectedRecurrences || [],
    loading,
    error,
    refetch,
  };
};

export const useMuteDetectedRecurrence = () => {
  const { workspaceId } = useRequiredWorkspace();
  const [mutate, { loading }] = useMutation(MUTE_DETECTED_RECURRENCE, {
    refetchQueries: [
      { query: GET_DETECTED_RECURRENCES, variables: { workspaceId } },
      "GetTreasuryForecastData",
    ],
    awaitRefetchQueries: false,
  });

  const setMuted = async (id, muted) => {
    try {
      const result = await mutate({ variables: { id, muted } });
      if (result.data?.muteDetectedRecurrence) {
        toast.success(muted ? "Récurrence masquée" : "Récurrence réactivée");
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

export const useRunRecurrenceDetection = () => {
  const { workspaceId } = useRequiredWorkspace();
  const [mutate, { loading }] = useMutation(RUN_RECURRENCE_DETECTION, {
    refetchQueries: [
      { query: GET_DETECTED_RECURRENCES, variables: { workspaceId } },
      "GetTreasuryForecastData",
    ],
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
