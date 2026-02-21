import { gql } from '@apollo/client';

export const UPDATE_CALENDAR_COLOR_LABELS = gql`
  mutation UpdateCalendarColorLabels($labels: [CalendarColorLabelInput!]!, $workspaceId: ID) {
    updateCalendarColorLabels(labels: $labels, workspaceId: $workspaceId) {
      success
      message
      labels {
        color
        label
      }
    }
  }
`;
