import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { useCallback, useEffect } from "react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  GET_NOTIFICATIONS,
  GET_UNREAD_NOTIFICATIONS_COUNT,
  MARK_NOTIFICATION_AS_READ,
  MARK_ALL_NOTIFICATIONS_AS_READ,
  DELETE_NOTIFICATION,
  NOTIFICATION_RECEIVED_SUBSCRIPTION,
} from "@/src/graphql/queries/activityNotifications";

/**
 * Hook pour gérer les notifications d'activité (assignation de tâches, etc.)
 */
export const useActivityNotifications = (options = {}) => {
  const { limit = 50, offset = 0, unreadOnly = false } = options;
  const { workspaceId } = useWorkspace();

  // Récupérer les notifications
  const {
    data,
    loading,
    error,
    refetch,
  } = useQuery(GET_NOTIFICATIONS, {
    variables: { workspaceId, limit, offset, unreadOnly },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  // Récupérer le nombre de notifications non lues
  const { data: unreadCountData, refetch: refetchUnreadCount } = useQuery(
    GET_UNREAD_NOTIFICATIONS_COUNT,
    {
      variables: { workspaceId },
      skip: !workspaceId,
      fetchPolicy: "cache-and-network",
    }
  );

  // Mutation pour marquer une notification comme lue
  const [markAsReadMutation] = useMutation(MARK_NOTIFICATION_AS_READ);

  // Mutation pour marquer toutes les notifications comme lues
  const [markAllAsReadMutation] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ);

  // Mutation pour supprimer une notification
  const [deleteNotificationMutation] = useMutation(DELETE_NOTIFICATION);

  // Subscription pour les nouvelles notifications en temps réel
  const { data: subscriptionData } = useSubscription(
    NOTIFICATION_RECEIVED_SUBSCRIPTION,
    {
      variables: { workspaceId },
      skip: !workspaceId,
    }
  );

  // Rafraîchir quand une nouvelle notification arrive
  useEffect(() => {
    if (subscriptionData?.notificationReceived) {
      refetch();
      refetchUnreadCount();
    }
  }, [subscriptionData, refetch, refetchUnreadCount]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        await markAsReadMutation({
          variables: { id: notificationId },
        });
        refetch();
        refetchUnreadCount();
      } catch (err) {
        console.error("Erreur lors du marquage de la notification:", err);
      }
    },
    [markAsReadMutation, refetch, refetchUnreadCount]
  );

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation({
        variables: { workspaceId },
      });
      refetch();
      refetchUnreadCount();
    } catch (err) {
      console.error("Erreur lors du marquage des notifications:", err);
    }
  }, [markAllAsReadMutation, workspaceId, refetch, refetchUnreadCount]);

  // Supprimer une notification
  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        await deleteNotificationMutation({
          variables: { id: notificationId },
        });
        refetch();
        refetchUnreadCount();
      } catch (err) {
        console.error("Erreur lors de la suppression de la notification:", err);
      }
    },
    [deleteNotificationMutation, refetch, refetchUnreadCount]
  );

  return {
    notifications: data?.getNotifications?.notifications || [],
    totalCount: data?.getNotifications?.totalCount || 0,
    unreadCount: unreadCountData?.getUnreadNotificationsCount || data?.getNotifications?.unreadCount || 0,
    loading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    newNotification: subscriptionData?.notificationReceived,
  };
};

export default useActivityNotifications;
