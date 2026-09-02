import {
  useQuery,
  useMutation,
  useSubscription,
  useApolloClient,
} from "@apollo/client";
import { toast } from "sonner";

// Documents arrivés d'une plateforme externe (Qonto, PDP…) : listes à
// rafraîchir sans recharger la page, par nom d'opération GraphQL.
const IMPORTED_DOCUMENT_QUERIES = {
  INVOICE: ["GetImportedInvoices", "GetInvoices", "GetImportedInvoiceStats"],
  QUOTE: ["GetImportedQuotes", "GetQuotes", "GetImportedQuoteStats"],
  PURCHASE_INVOICE: ["GetPurchaseInvoices", "GetPurchaseInvoiceStats"],
};
import { useCallback, useEffect, useState } from "react";
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
 * La subscription WebSocket gère le temps réel.
 * Le polling (60s) s'active uniquement en fallback si le WebSocket échoue.
 */
export const useActivityNotifications = (options = {}) => {
  const { limit = 50, offset = 0, unreadOnly = false } = options;
  const { workspaceId } = useWorkspace();
  const [wsConnected, setWsConnected] = useState(true);

  // Pas de polling si WebSocket connecté, fallback 60s sinon
  const fallbackPollInterval = wsConnected ? 0 : 60000;

  const { data, loading, error, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { workspaceId, limit, offset, unreadOnly },
    skip: !workspaceId,
    pollInterval: fallbackPollInterval,
    // Suspendre le polling quand l'onglet est en arrière-plan
    skipPollAttempt: () => typeof document !== "undefined" && document.hidden,
  });

  const { data: unreadCountData, refetch: refetchUnreadCount } = useQuery(
    GET_UNREAD_NOTIFICATIONS_COUNT,
    {
      variables: { workspaceId },
      skip: !workspaceId,
      pollInterval: fallbackPollInterval,
      // Suspendre le polling quand l'onglet est en arrière-plan
      skipPollAttempt: () => typeof document !== "undefined" && document.hidden,
    },
  );

  // Mutation pour marquer une notification comme lue
  const [markAsReadMutation] = useMutation(MARK_NOTIFICATION_AS_READ);

  // Mutation pour marquer toutes les notifications comme lues
  const [markAllAsReadMutation] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ);

  // Mutation pour supprimer une notification
  const [deleteNotificationMutation] = useMutation(DELETE_NOTIFICATION);

  // Subscription temps réel — si elle échoue, on active le polling fallback
  const { data: subscriptionData } = useSubscription(
    NOTIFICATION_RECEIVED_SUBSCRIPTION,
    {
      variables: { workspaceId },
      skip: !workspaceId,
      onError: () => setWsConnected(false),
      onData: () => {
        if (!wsConnected) setWsConnected(true);
      },
    },
  );

  const apolloClient = useApolloClient();

  // Rafraîchir quand une nouvelle notification arrive via WebSocket
  useEffect(() => {
    const incoming = subscriptionData?.notificationReceived;
    if (!incoming) return;
    refetch();
    refetchUnreadCount();

    // Document importé (Qonto…) ou reçu via la PDP : la liste concernée se
    // met à jour toute seule, avec un toast cliquable.
    const documentType =
      incoming.type === "DOCUMENT_IMPORTED"
        ? incoming.data?.documentType
        : incoming.type === "PURCHASE_INVOICE_RECEIVED"
          ? "PURCHASE_INVOICE"
          : null;
    if (!documentType) return;

    const include = IMPORTED_DOCUMENT_QUERIES[documentType] || [];
    if (include.length > 0) {
      apolloClient
        .refetchQueries({ include })
        .catch((err) =>
          console.warn("Rafraîchissement après import impossible:", err),
        );
    }
    const url = incoming.data?.url;
    toast.info(incoming.title || "Nouveau document reçu", {
      description: incoming.message,
      action: url
        ? { label: "Voir", onClick: () => window.location.assign(url) }
        : undefined,
    });
  }, [subscriptionData, refetch, refetchUnreadCount, apolloClient]);

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
    [markAsReadMutation, refetch, refetchUnreadCount],
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
    [deleteNotificationMutation, refetch, refetchUnreadCount],
  );

  return {
    notifications: data?.getNotifications?.notifications || [],
    totalCount: data?.getNotifications?.totalCount || 0,
    unreadCount:
      unreadCountData?.getUnreadNotificationsCount ||
      data?.getNotifications?.unreadCount ||
      0,
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
