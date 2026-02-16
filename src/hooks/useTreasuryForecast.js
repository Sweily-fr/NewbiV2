import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TREASURY_FORECAST_DATA,
  GET_TREASURY_FORECASTS,
} from "../graphql/queries/treasuryForecast";
import {
  UPSERT_TREASURY_FORECAST,
  DELETE_TREASURY_FORECAST,
} from "../graphql/mutations/treasuryForecast";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

/**
 * Hook pour récupérer les données agrégées de prévision de trésorerie
 */
export const useTreasuryForecastData = (startDate, endDate, accountId) => {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_TREASURY_FORECAST_DATA, {
    variables: {
      workspaceId,
      startDate,
      endDate,
      accountId: accountId || undefined,
    },
    skip: !workspaceId || !startDate || !endDate,
    fetchPolicy: "network-only",
  });

  return {
    forecastData: data?.treasuryForecastData || null,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook pour récupérer les prévisions manuelles brutes
 */
export const useTreasuryForecasts = (startMonth, endMonth) => {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_TREASURY_FORECASTS, {
    variables: {
      workspaceId,
      startMonth,
      endMonth,
    },
    skip: !workspaceId || !startMonth || !endMonth,
    fetchPolicy: "network-only",
  });

  return {
    forecasts: data?.treasuryForecasts || [],
    loading,
    error,
    refetch,
  };
};

/**
 * Hook pour upsert une prévision de trésorerie
 */
export const useUpsertTreasuryForecast = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [upsertMutation, { loading }] = useMutation(UPSERT_TREASURY_FORECAST, {
    refetchQueries: [
      { query: GET_TREASURY_FORECAST_DATA },
      { query: GET_TREASURY_FORECASTS },
    ],
    awaitRefetchQueries: false,
  });

  const upsertForecast = async (input) => {
    try {
      const result = await upsertMutation({
        variables: {
          input: {
            ...input,
            workspaceId,
          },
        },
      });

      if (result.data?.upsertTreasuryForecast) {
        return { success: true, forecast: result.data.upsertTreasuryForecast };
      }
      throw new Error("Erreur lors de la sauvegarde de la prévision");
    } catch (error) {
      const msg =
        error.graphQLErrors?.[0]?.message ||
        "Erreur lors de la sauvegarde de la prévision";
      toast.error(msg);
      return { success: false, error };
    }
  };

  return { upsertForecast, loading };
};

/**
 * Hook pour supprimer une prévision de trésorerie
 */
export const useDeleteTreasuryForecast = () => {
  const [deleteMutation, { loading }] = useMutation(DELETE_TREASURY_FORECAST, {
    refetchQueries: [
      { query: GET_TREASURY_FORECAST_DATA },
      { query: GET_TREASURY_FORECASTS },
    ],
    awaitRefetchQueries: false,
  });

  const deleteForecast = async (id) => {
    try {
      const result = await deleteMutation({ variables: { id } });
      if (result.data?.deleteTreasuryForecast?.success) {
        toast.success("Prévision supprimée");
        return { success: true };
      }
      throw new Error("Erreur lors de la suppression");
    } catch (error) {
      toast.error(error.message || "Erreur lors de la suppression de la prévision");
      return { success: false, error };
    }
  };

  return { deleteForecast, loading };
};
