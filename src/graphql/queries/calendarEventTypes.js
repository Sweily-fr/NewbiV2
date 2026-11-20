import { gql } from "@apollo/client";

export const GET_CALENDAR_EVENT_TYPES = gql`
  query GetCalendarEventTypes($workspaceId: ID) {
    getCalendarEventTypes(workspaceId: $workspaceId) {
      success
      message
      types {
        id
        name
        color
        allDay
      }
    }
  }
`;
