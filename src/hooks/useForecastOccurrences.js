import { useQuery, useMutation } from "@apollo/client";
import { GET_FORECAST_OCCURRENCES } from "../graphql/queries/treasuryForecast";
import { EXCLUDE_FORECAST_OCCURRENCE } from "../graphql/mutations/treasuryForecast";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

// Liste à plat des occurrences de prévision (saisies manuelles + récurrences
// détectées) sur l'horizon [startMonth, endMonth] (format YYYY-MM), triées
// chronologiquement — alimente l'onglet « Détails prévisions ».
export const useForecastOccurrences = (startMonth, endMonth) => {
  const { workspaceId } = useRequiredWorkspace();
  const { data, loading, error, refetch } = useQuery(GET_FORECAST_OCCURRENCES, {
    variables: { workspaceId, startMonth, endMonth },
    skip: !workspaceId || !startMonth || !endMonth,
    fetchPolicy: "cache-and-network",
  });
  return {
    occurrences: data?.forecastOccurrences || [],
    loading,
    error,
    refetch,
  };
};

// Supprime une seule occurrence (un mois) d'une prévision récurrente sans
// affecter les autres mois. `kind` ∈ { MANUAL, DETECTED }.
export const useExcludeForecastOccurrence = () => {
  const [mutate, { loading }] = useMutation(EXCLUDE_FORECAST_OCCURRENCE, {
    refetchQueries: [
      "GetTreasuryForecastData",
      "GetForecastOccurrences",
      "GetForecastMonthDetails",
    ],
    awaitRefetchQueries: false,
  });

  const excludeOccurrence = async ({ kind, id, month }) => {
    try {
      const result = await mutate({ variables: { kind, id, month } });
      if (result.data?.excludeForecastOccurrence) {
        toast.success("Prévision supprimée pour ce mois");
        return { success: true };
      }
      throw new Error("Erreur lors de la suppression");
    } catch (error) {
      const msg =
        error.graphQLErrors?.[0]?.message ||
        error.message ||
        "Erreur lors de la suppression";
      toast.error(msg);
      return { success: false, error };
    }
  };

  return { excludeOccurrence, loading };
};
