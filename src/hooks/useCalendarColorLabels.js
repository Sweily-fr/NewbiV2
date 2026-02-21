import { useQuery, useMutation } from '@apollo/client';
import { useCallback, useMemo } from 'react';
import { useWorkspace } from './useWorkspace';
import { GET_CALENDAR_COLOR_LABELS } from '../graphql/queries/calendarColorLabels';
import { UPDATE_CALENDAR_COLOR_LABELS } from '../graphql/mutations/calendarColorLabels';

const DEFAULT_LABELS = [
  { color: '#1D1D1B', label: 'Noir' },
  { color: '#EAB308', label: 'Jaune' },
  { color: '#22C55E', label: 'Vert' },
  { color: '#3B82F6', label: 'Bleu' },
  { color: '#EF4444', label: 'Rouge' },
  { color: '#8B5CF6', label: 'Violet' },
];

export const useCalendarColorLabels = () => {
  const { workspaceId } = useWorkspace();

  const { data, loading: queryLoading } = useQuery(GET_CALENDAR_COLOR_LABELS, {
    variables: { workspaceId },
    skip: !workspaceId,
  });

  const [updateMutation, { loading: updateLoading }] = useMutation(UPDATE_CALENDAR_COLOR_LABELS, {
    update(cache, { data: mutationData }) {
      if (mutationData?.updateCalendarColorLabels?.success) {
        cache.writeQuery({
          query: GET_CALENDAR_COLOR_LABELS,
          variables: { workspaceId },
          data: {
            getCalendarColorLabels: mutationData.updateCalendarColorLabels,
          },
        });
      }
    },
  });

  const labels = useMemo(
    () => data?.getCalendarColorLabels?.labels || DEFAULT_LABELS,
    [data]
  );

  const updateLabels = useCallback(
    async (newLabels) => {
      const cleanLabels = newLabels.map(({ color, label }) => ({ color, label }));
      const result = await updateMutation({
        variables: { labels: cleanLabels, workspaceId },
      });
      return result.data?.updateCalendarColorLabels;
    },
    [updateMutation, workspaceId]
  );

  const getLabelForColor = useCallback(
    (color) => {
      const entry = labels.find((l) => l.color === color);
      return entry?.label || color;
    },
    [labels]
  );

  return {
    labels,
    loading: queryLoading,
    updateLoading,
    updateLabels,
    getLabelForColor,
  };
};
