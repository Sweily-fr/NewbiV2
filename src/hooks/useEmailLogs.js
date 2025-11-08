import { useQuery } from '@apollo/client';
import { GET_EMAIL_LOGS } from '@/src/graphql/queries/emailReminder';
import { useRequiredWorkspace } from '@/src/hooks/useRequiredWorkspace';

/**
 * Hook pour récupérer les logs d'emails
 */
export const useEmailLogs = ({ status = null, limit = 30, offset = 0 } = {}) => {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error, refetch, fetchMore } = useQuery(GET_EMAIL_LOGS, {
    variables: {
      workspaceId,
      status,
      limit,
      offset
    },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network'
  });

  // Fonction pour charger plus de logs
  const loadMore = () => {
    if (data?.getEmailLogs?.hasMore) {
      fetchMore({
        variables: {
          offset: data.getEmailLogs.logs.length
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          
          return {
            getEmailLogs: {
              ...fetchMoreResult.getEmailLogs,
              logs: [
                ...prev.getEmailLogs.logs,
                ...fetchMoreResult.getEmailLogs.logs
              ]
            }
          };
        }
      });
    }
  };

  // Formater les logs pour l'affichage
  const formatLogs = (logs) => {
    if (!logs) return [];
    
    return logs.map(log => ({
      ...log,
      sentAtFormatted: new Date(log.sentAt).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      scheduledForFormatted: new Date(log.scheduledFor).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      statusLabel: getStatusLabel(log.status),
      statusColor: getStatusColor(log.status),
      reminderTypeLabel: getReminderTypeLabel(log.reminderType, log.anticipation)
    }));
  };

  // Labels de statut
  const getStatusLabel = (status) => {
    const labels = {
      sent: 'Envoyé',
      failed: 'Échec',
      deferred: 'Différé'
    };
    return labels[status] || status;
  };

  // Couleurs de statut
  const getStatusColor = (status) => {
    const colors = {
      sent: 'green',
      failed: 'red',
      deferred: 'orange'
    };
    return colors[status] || 'gray';
  };

  // Labels de type de rappel
  const getReminderTypeLabel = (type, anticipation) => {
    if (type === 'due') {
      return 'À l\'échéance';
    }
    
    const anticipationLabels = {
      '1h': '1 heure avant',
      '3h': '3 heures avant',
      '1d': '1 jour avant',
      '3d': '3 jours avant'
    };
    
    return anticipationLabels[anticipation] || 'Anticipé';
  };

  return {
    logs: formatLogs(data?.getEmailLogs?.logs),
    totalCount: data?.getEmailLogs?.totalCount || 0,
    hasMore: data?.getEmailLogs?.hasMore || false,
    loading,
    error,
    refetch,
    loadMore
  };
};
