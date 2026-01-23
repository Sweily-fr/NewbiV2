import { useQuery, useMutation } from "@apollo/client";
import { GET_NOTIFICATION_PREFERENCES } from "@/src/graphql/queries/notificationPreferences";
import { UPDATE_NOTIFICATION_PREFERENCES } from "@/src/graphql/mutations/notificationPreferences";
import { toast } from "@/src/components/ui/sonner";
import { useCallback } from "react";

/**
 * Hook pour gérer les préférences de notifications de l'utilisateur
 */
export const useNotificationPreferences = () => {
  // Récupérer les préférences
  const { data, loading, error, refetch } = useQuery(
    GET_NOTIFICATION_PREFERENCES,
    {
      fetchPolicy: "cache-and-network",
    }
  );

  // Mutation pour mettre à jour les préférences
  const [updatePreferencesMutation, { loading: updating }] = useMutation(
    UPDATE_NOTIFICATION_PREFERENCES,
    {
      onCompleted: (data) => {
        if (data.updateNotificationPreferences.success) {
          toast.success(
            data.updateNotificationPreferences.message ||
              "Préférences de notifications enregistrées"
          );
          refetch();
        } else {
          toast.error(
            data.updateNotificationPreferences.message ||
              "Erreur lors de la sauvegarde"
          );
        }
      },
      onError: (error) => {
        toast.error(
          error.message || "Erreur lors de la sauvegarde des préférences"
        );
      },
    }
  );

  // Fonction pour mettre à jour une préférence spécifique
  const updatePreference = useCallback(
    async (key, type, value) => {
      try {
        await updatePreferencesMutation({
          variables: {
            input: {
              [key]: {
                [type]: value,
              },
            },
          },
        });
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la préférence:", error);
      }
    },
    [updatePreferencesMutation]
  );

  // Fonction pour mettre à jour toutes les préférences
  const updateAllPreferences = useCallback(
    async (preferences) => {
      try {
        await updatePreferencesMutation({
          variables: {
            input: preferences,
          },
        });
      } catch (error) {
        console.error("Erreur lors de la mise à jour des préférences:", error);
      }
    },
    [updatePreferencesMutation]
  );

  return {
    preferences: data?.getNotificationPreferences || null,
    loading,
    error,
    updating,
    updatePreference,
    updateAllPreferences,
    refetch,
  };
};
