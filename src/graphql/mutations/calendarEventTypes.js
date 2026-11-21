import { gql } from "@apollo/client";

export const UPDATE_CALENDAR_EVENT_TYPES = gql`
  mutation UpdateCalendarEventTypes(
    $types: [CalendarEventTypeInput!]!
    $workspaceId: ID
  ) {
    updateCalendarEventTypes(types: $types, workspaceId: $workspaceId) {
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
