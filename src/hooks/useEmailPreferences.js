import { useQuery, useMutation } from '@apollo/client';
import { GET_EMAIL_PREFERENCES } from '@/src/graphql/queries/emailReminder';
import { UPDATE_EMAIL_PREFERENCES, SEND_TEST_EMAIL } from '@/src/graphql/mutations/emailReminder';
import { toast } from "@/src/components/ui/sonner";

/**
 * Hook pour gérer les préférences email de l'utilisateur
 */
export const useEmailPreferences = () => {
  // Récupérer les préférences
  const { data, loading, error, refetch } = useQuery(GET_EMAIL_PREFERENCES, {
    fetchPolicy: 'cache-and-network'
  });

  // Mutation pour mettre à jour les préférences
  const [updatePreferencesMutation, { loading: updating }] = useMutation(UPDATE_EMAIL_PREFERENCES, {
    onCompleted: (data) => {
      if (data.updateEmailPreferences.success) {
        toast.success(data.updateEmailPreferences.message || 'Préférences enregistrées');
        refetch();
      } else {
        toast.error(data.updateEmailPreferences.message || 'Erreur lors de la sauvegarde');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la sauvegarde des préférences');
    }
  });

  // Mutation pour envoyer un email de test
  const [sendTestEmailMutation, { loading: sendingTest }] = useMutation(SEND_TEST_EMAIL, {
    onCompleted: (data) => {
      if (data.sendTestEmail.success) {
        toast.success(data.sendTestEmail.message || 'Email de test envoyé');
      } else {
        toast.error(data.sendTestEmail.message || 'Erreur lors de l\'envoi');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'email de test');
    }
  });

  // Fonction pour mettre à jour les préférences
  const updatePreferences = async (preferences) => {
    try {
      await updatePreferencesMutation({
        variables: {
          input: preferences
        }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
    }
  };

  // Fonction pour envoyer un email de test
  const sendTestEmail = async () => {
    try {
      await sendTestEmailMutation();
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de test:', error);
    }
  };

  return {
    preferences: data?.getEmailPreferences || null,
    loading,
    error,
    updating,
    sendingTest,
    updatePreferences,
    sendTestEmail,
    refetch
  };
};
