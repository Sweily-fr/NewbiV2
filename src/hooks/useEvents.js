import { useQuery, useMutation } from "@apollo/client";
import { GET_EVENTS, GET_EVENT } from "@/src/graphql/queries/event";
import {
  CREATE_EVENT,
  UPDATE_EVENT,
  DELETE_EVENT,
  SYNC_INVOICE_EVENTS,
} from "@/src/graphql/mutations/event";
import { toast } from "@/src/components/ui/sonner";
import { useWorkspace } from "@/src/hooks/useWorkspace";

/**
 * Hook pour récupérer la liste des événements
 */
export const useEvents = (options = {}) => {
  const {
    startDate,
    endDate,
    type,
    limit = 500,
    offset = 0,
    skip = false,
    workspaceId,
  } = options;

  const { workspaceId: contextWorkspaceId, loading: workspaceLoading } = useWorkspace();
  const finalWorkspaceId = workspaceId || contextWorkspaceId;
  

  const queryVariables = {
    startDate,
    endDate,
    type,
    limit,
    offset,
    workspaceId: finalWorkspaceId,
    includeExternalCalendars: true,
  };

  const { data, loading: queryLoading, error, refetch } = useQuery(GET_EVENTS, {
    variables: queryVariables,
    skip: skip || !finalWorkspaceId,
    errorPolicy: "all",
  });

  return {
    events: data?.getEvents?.events || [],
    totalCount: data?.getEvents?.totalCount || 0,
    loading: workspaceLoading || (queryLoading && !data?.getEvents),
    error,
    refetch,
    success: data?.getEvents?.success || false,
    message: data?.getEvents?.message,
  };
};

/**
 * Hook pour récupérer un événement spécifique
 */
export const useEvent = (id, options = {}) => {
  const { skip = false, workspaceId } = options;
  const { workspaceId: contextWorkspaceId, loading: workspaceLoading } = useWorkspace();
  const finalWorkspaceId = workspaceId || contextWorkspaceId;

  const { data, loading: queryLoading, error, refetch } = useQuery(GET_EVENT, {
    variables: { id, workspaceId: finalWorkspaceId },
    skip: skip || !id || !finalWorkspaceId,
    errorPolicy: "all",
  });

  return {
    event: data?.getEvent?.event || null,
    loading: workspaceLoading || (queryLoading && !data?.getEvent),
    error,
    refetch,
    success: data?.getEvent?.success || false,
    message: data?.getEvent?.message,
  };
};

/**
 * Hook pour créer un événement
 */
export const useCreateEvent = () => {
  const { workspaceId } = useWorkspace();
  
  const [createEventMutation, { loading, error }] = useMutation(CREATE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS, variables: { workspaceId } }],
    awaitRefetchQueries: true,
  });

  const createEvent = async (input, customWorkspaceId) => {
    try {
      const finalWorkspaceId = customWorkspaceId || workspaceId;
      const result = await createEventMutation({
        variables: { input, workspaceId: finalWorkspaceId },
      });

      if (result.data?.createEvent?.success) {
        return result.data.createEvent.event;
      } else {
        toast.error(
          result.data?.createEvent?.message ||
            "Erreur lors de la création de l'événement"
        );
        return null;
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'événement:", error);
      toast.error("Erreur lors de la création de l'événement");
      return null;
    }
  };

  return {
    createEvent,
    loading,
    error,
  };
};

/**
 * Hook pour mettre à jour un événement
 */
export const useUpdateEvent = () => {
  const { workspaceId } = useWorkspace();
  
  const [updateEventMutation, { loading, error }] = useMutation(UPDATE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS, variables: { workspaceId } }],
    awaitRefetchQueries: true,
  });

  const updateEvent = async (input, customWorkspaceId) => {
    try {
      const finalWorkspaceId = customWorkspaceId || workspaceId;
      const result = await updateEventMutation({
        variables: { input, workspaceId: finalWorkspaceId },
      });

      if (result.data?.updateEvent?.success) {
        return result.data.updateEvent.event;
      } else {
        toast.error(
          result.data?.updateEvent?.message ||
            "Erreur lors de la mise à jour de l'événement"
        );
        return null;
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'événement:", error);
      toast.error("Erreur lors de la mise à jour de l'événement");
      return null;
    }
  };

  return {
    updateEvent,
    loading,
    error,
  };
};

/**
 * Hook pour supprimer un événement
 */
export const useDeleteEvent = () => {
  const { workspaceId } = useWorkspace();
  
  const [deleteEventMutation, { loading, error }] = useMutation(DELETE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS, variables: { workspaceId } }],
    awaitRefetchQueries: true,
  });

  const deleteEvent = async (id, customWorkspaceId) => {
    try {
      const finalWorkspaceId = customWorkspaceId || workspaceId;
      const result = await deleteEventMutation({
        variables: { id, workspaceId: finalWorkspaceId },
      });

      if (result.data?.deleteEvent?.success) {
        return true;
      } else {
        toast.error(
          result.data?.deleteEvent?.message ||
            "Erreur lors de la suppression de l'événement"
        );
        return false;
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'événement:", error);
      toast.error("Erreur lors de la suppression de l'événement");
      return false;
    }
  };

  return {
    deleteEvent,
    loading,
    error,
  };
};

/**
 * Hook pour synchroniser les événements avec les factures
 */
export const useSyncInvoiceEvents = () => {
  const { workspaceId } = useWorkspace();
  
  const [syncInvoiceEventsMutation, { loading, error }] = useMutation(
    SYNC_INVOICE_EVENTS,
    {
      refetchQueries: [{ query: GET_EVENTS, variables: { workspaceId } }],
      awaitRefetchQueries: true,
    }
  );

  const syncInvoiceEvents = async (customWorkspaceId) => {
    try {
      const finalWorkspaceId = customWorkspaceId || workspaceId;
      const result = await syncInvoiceEventsMutation({
        variables: { workspaceId: finalWorkspaceId },
      });

      if (result.data?.syncInvoiceEvents?.success) {
        const count = result.data.syncInvoiceEvents.totalCount;
        toast.success(`${count} événement(s) de facture synchronisé(s)`);
        return result.data.syncInvoiceEvents.events;
      } else {
        toast.error(
          result.data?.syncInvoiceEvents?.message ||
            "Erreur lors de la synchronisation"
        );
        return [];
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation des événements:", error);
      toast.error("Erreur lors de la synchronisation des événements");
      return [];
    }
  };

  return {
    syncInvoiceEvents,
    loading,
    error,
  };
};

/**
 * Hook combiné pour toutes les opérations sur les événements
 */
export const useEventOperations = () => {
  const { createEvent, loading: createLoading } = useCreateEvent();
  const { updateEvent, loading: updateLoading } = useUpdateEvent();
  const { deleteEvent, loading: deleteLoading } = useDeleteEvent();
  const { syncInvoiceEvents, loading: syncLoading } = useSyncInvoiceEvents();

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    syncInvoiceEvents,
    loading: createLoading || updateLoading || deleteLoading || syncLoading,
  };
};
