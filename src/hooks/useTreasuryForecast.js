import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TREASURY_FORECAST_DATA,
  GET_TREASURY_FORECASTS,
  GET_FORECAST_SCENARIOS,
} from "../graphql/queries/treasuryForecast";
import {
  UPSERT_TREASURY_FORECAST,
  DELETE_TREASURY_FORECAST,
  UPSERT_FORECAST_SCENARIO,
  DELETE_FORECAST_SCENARIO,
} from "../graphql/mutations/treasuryForecast";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

/**
 * Hook pour récupérer les données agrégées de prévision de trésorerie
 */
export const useTreasuryForecastData = (
  startDate,
  endDate,
  accountId,
  scenarioId,
) => {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(
    GET_TREASURY_FORECAST_DATA,
    {
      variables: {
        workspaceId,
        startDate,
        endDate,
        accountId: accountId || undefined,
        scenarioId: scenarioId || undefined,
      },
      skip: !workspaceId || !startDate || !endDate,
    },
  );

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
    refetchQueries: ["GetTreasuryForecastData", "GetTreasuryForecasts"],
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
    refetchQueries: ["GetTreasuryForecastData", "GetTreasuryForecasts"],
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
      toast.error(
        error.message || "Erreur lors de la suppression de la prévision",
      );
      return { success: false, error };
    }
  };

  return { deleteForecast, loading };
};

/**
 * Hook pour récupérer les scénarios de prévision
 */
export const useForecastScenarios = () => {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_FORECAST_SCENARIOS, {
    variables: { workspaceId },
    skip: !workspaceId,
  });

  return {
    scenarios: data?.forecastScenarios || [],
    loading,
    error,
    refetch,
  };
};

/**
 * Hook pour créer/modifier un scénario
 */
export const useUpsertForecastScenario = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [upsertMutation, { loading }] = useMutation(UPSERT_FORECAST_SCENARIO, {
    refetchQueries: ["GetForecastScenarios", "GetTreasuryForecastData"],
    awaitRefetchQueries: false,
  });

  const upsertScenario = async (input) => {
    try {
      const result = await upsertMutation({
        variables: {
          input: { ...input, workspaceId },
        },
      });
      if (result.data?.upsertForecastScenario) {
        toast.success(input.id ? "Scénario modifié" : "Scénario créé");
        return { success: true, scenario: result.data.upsertForecastScenario };
      }
      throw new Error("Erreur lors de la sauvegarde du scénario");
    } catch (error) {
      const msg =
        error.graphQLErrors?.[0]?.message ||
        "Erreur lors de la sauvegarde du scénario";
      toast.error(msg);
      return { success: false, error };
    }
  };

  return { upsertScenario, loading };
};

/**
 * Hook pour supprimer un scénario
 */
export const useDeleteForecastScenario = () => {
  const [deleteMutation, { loading }] = useMutation(DELETE_FORECAST_SCENARIO, {
    refetchQueries: ["GetForecastScenarios", "GetTreasuryForecastData"],
    awaitRefetchQueries: false,
  });

  const deleteScenario = async (id) => {
    try {
      const result = await deleteMutation({ variables: { id } });
      if (result.data?.deleteForecastScenario?.success) {
        toast.success("Scénario supprimé");
        return { success: true };
      }
      throw new Error("Erreur lors de la suppression");
    } catch (error) {
      toast.error(error.message || "Erreur lors de la suppression du scénario");
      return { success: false, error };
    }
  };

  return { deleteScenario, loading };
};
