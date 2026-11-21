import { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useWorkspace } from "./useWorkspace";
import { useMyPermissions } from "./useMyPermissions";
import { GET_CALENDAR_EVENT_TYPES } from "../graphql/queries/calendarEventTypes";
import { UPDATE_CALENDAR_EVENT_TYPES } from "../graphql/mutations/calendarEventTypes";

const NO_TYPES = [];

/**
 * Types d'événements créés par l'espace (« Rendez-vous client »…), partagés
 * par ses membres, comme les étiquettes de couleur.
 */
export const useCalendarEventTypes = () => {
  const { workspaceId } = useWorkspace();
  // Sans lecture du calendrier, l'API refuserait la liste : aucun type
  const { canRead, isReady } = useMyPermissions();

  const { data, loading } = useQuery(GET_CALENDAR_EVENT_TYPES, {
    variables: { workspaceId },
    skip: !workspaceId || (isReady && !canRead("calendar")),
  });

  const [updateMutation, { loading: updateLoading }] = useMutation(
    UPDATE_CALENDAR_EVENT_TYPES,
    {
      update(cache, { data: mutationData }) {
        if (mutationData?.updateCalendarEventTypes?.success) {
          cache.writeQuery({
            query: GET_CALENDAR_EVENT_TYPES,
            variables: { workspaceId },
            data: {
              getCalendarEventTypes: mutationData.updateCalendarEventTypes,
            },
          });
        }
      },
    },
  );

  const types = useMemo(
    () => data?.getCalendarEventTypes?.types || NO_TYPES,
    [data],
  );

  const updateTypes = useCallback(
    async (nextTypes) => {
      const result = await updateMutation({
        variables: {
          types: nextTypes.map(({ id, name, color, allDay }) => ({
            id,
            name,
            color,
            allDay: Boolean(allDay),
          })),
          workspaceId,
        },
      });
      return result.data?.updateCalendarEventTypes;
    },
    [updateMutation, workspaceId],
  );

  return { types, loading, updateLoading, updateTypes };
};
