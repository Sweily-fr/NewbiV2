import { useQuery, useMutation } from "@apollo/client";
import { GET_CALENDAR_CONNECTIONS, GET_AVAILABLE_CALENDARS } from "@/src/graphql/queries/calendarConnection";
import {
  CONNECT_APPLE_CALENDAR,
  DISCONNECT_CALENDAR,
  UPDATE_SELECTED_CALENDARS,
  SYNC_CALENDAR,
  SYNC_ALL_CALENDARS,
  PUSH_EVENT_TO_CALENDAR,
  UPDATE_AUTO_SYNC,
} from "@/src/graphql/mutations/calendarConnection";
import { toast } from "@/src/components/ui/sonner";

/**
 * Hook pour récupérer les connexions calendrier
 */
export const useCalendarConnections = () => {
  const { data, loading, error, refetch } = useQuery(GET_CALENDAR_CONNECTIONS, {
    errorPolicy: "all",
  });

  return {
    connections: data?.getCalendarConnections?.connections || [],
    loading,
    error,
    refetch,
    success: data?.getCalendarConnections?.success || false,
  };
};

/**
 * Hook pour récupérer les calendriers disponibles
 */
export const useAvailableCalendars = (connectionId, options = {}) => {
  const { skip = false } = options;
  const { data, loading, error, refetch } = useQuery(GET_AVAILABLE_CALENDARS, {
    variables: { connectionId },
    skip: skip || !connectionId,
    errorPolicy: "all",
  });

  return {
    calendars: data?.getAvailableCalendars?.calendars || [],
    loading,
    error,
    refetch,
  };
};

/**
 * Hook pour connecter un calendrier Apple
 */
export const useConnectAppleCalendar = () => {
  const [connectMutation, { loading, error }] = useMutation(CONNECT_APPLE_CALENDAR, {
    refetchQueries: [{ query: GET_CALENDAR_CONNECTIONS }, "GetEvents"],
    awaitRefetchQueries: true,
  });

  const connectApple = async (input) => {
    try {
      const result = await connectMutation({ variables: { input } });
      if (result.data?.connectAppleCalendar?.success) {
        toast.success("Calendrier Apple connecté avec succès");
        return result.data.connectAppleCalendar.connection;
      } else {
        toast.error(result.data?.connectAppleCalendar?.message || "Erreur de connexion");
        return null;
      }
    } catch (err) {
      console.error("Erreur connexion Apple Calendar:", err);
      toast.error("Erreur lors de la connexion du calendrier Apple");
      return null;
    }
  };

  return { connectApple, loading, error };
};

/**
 * Hook pour déconnecter un calendrier
 */
export const useDisconnectCalendar = () => {
  const [disconnectMutation, { loading, error }] = useMutation(DISCONNECT_CALENDAR, {
    refetchQueries: [{ query: GET_CALENDAR_CONNECTIONS }, "GetEvents"],
    awaitRefetchQueries: true,
  });

  const disconnect = async (connectionId) => {
    try {
      const result = await disconnectMutation({ variables: { connectionId } });
      if (result.data?.disconnectCalendar?.success) {
        toast.success("Calendrier déconnecté");
        return true;
      } else {
        toast.error(result.data?.disconnectCalendar?.message || "Erreur de déconnexion");
        return false;
      }
    } catch (err) {
      console.error("Erreur déconnexion calendrier:", err);
      toast.error("Erreur lors de la déconnexion");
      return false;
    }
  };

  return { disconnect, loading, error };
};

/**
 * Hook pour synchroniser un calendrier
 */
export const useSyncCalendar = () => {
  const [syncMutation, { loading, error }] = useMutation(SYNC_CALENDAR, {
    refetchQueries: [{ query: GET_CALENDAR_CONNECTIONS }, "GetEvents"],
  });

  const sync = async (connectionId) => {
    try {
      const result = await syncMutation({ variables: { connectionId } });
      if (result.data?.syncCalendar?.success) {
        toast.success(result.data.syncCalendar.message);
        return true;
      } else {
        toast.error(result.data?.syncCalendar?.message || "Erreur de synchronisation");
        return false;
      }
    } catch (err) {
      console.error("Erreur synchronisation:", err);
      toast.error("Erreur lors de la synchronisation");
      return false;
    }
  };

  return { sync, loading, error };
};

/**
 * Hook pour synchroniser tous les calendriers
 */
export const useSyncAllCalendars = () => {
  const [syncAllMutation, { loading, error }] = useMutation(SYNC_ALL_CALENDARS, {
    refetchQueries: [{ query: GET_CALENDAR_CONNECTIONS }, "GetEvents"],
  });

  const syncAll = async () => {
    try {
      const result = await syncAllMutation();
      if (result.data?.syncAllCalendars?.success) {
        toast.success(result.data.syncAllCalendars.message);
        return true;
      } else {
        toast.error(result.data?.syncAllCalendars?.message || "Erreur de synchronisation");
        return false;
      }
    } catch (err) {
      console.error("Erreur synchronisation globale:", err);
      toast.error("Erreur lors de la synchronisation");
      return false;
    }
  };

  return { syncAll, loading, error };
};

/**
 * Hook pour envoyer un événement vers un calendrier externe
 */
export const usePushEventToCalendar = () => {
  const [pushMutation, { loading, error }] = useMutation(PUSH_EVENT_TO_CALENDAR, {
    refetchQueries: ["GetEvents"],
  });

  const pushEvent = async (eventId, connectionId) => {
    try {
      const result = await pushMutation({
        variables: { input: { eventId, connectionId } },
      });
      if (result.data?.pushEventToCalendar?.success) {
        toast.success(result.data.pushEventToCalendar.message);
        return true;
      } else {
        toast.error(result.data?.pushEventToCalendar?.message || "Erreur d'envoi");
        return false;
      }
    } catch (err) {
      console.error("Erreur push événement:", err);
      toast.error("Erreur lors de l'envoi vers le calendrier");
      return false;
    }
  };

  return { pushEvent, loading, error };
};

/**
 * Hook pour activer/désactiver la synchronisation automatique
 */
export const useUpdateAutoSync = () => {
  const [updateMutation, { loading, error }] = useMutation(UPDATE_AUTO_SYNC, {
    refetchQueries: [{ query: GET_CALENDAR_CONNECTIONS }],
  });

  const updateAutoSync = async (connectionId, enabled) => {
    try {
      const result = await updateMutation({
        variables: { input: { connectionId, enabled } },
      });
      if (result.data?.updateAutoSync?.success) {
        toast.success(result.data.updateAutoSync.message);
        return true;
      } else {
        toast.error(result.data?.updateAutoSync?.message || "Erreur de mise à jour");
        return false;
      }
    } catch (err) {
      console.error("Erreur updateAutoSync:", err);
      toast.error("Erreur lors de la mise à jour de la sync auto");
      return false;
    }
  };

  return { updateAutoSync, loading, error };
};
