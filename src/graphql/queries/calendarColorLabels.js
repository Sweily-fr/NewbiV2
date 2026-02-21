import { gql } from '@apollo/client';

export const GET_CALENDAR_COLOR_LABELS = gql`
  query GetCalendarColorLabels($workspaceId: ID) {
    getCalendarColorLabels(workspaceId: $workspaceId) {
      success
      message
      labels {
        color
        label
      }
    }
  }
`;
