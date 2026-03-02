import { gql } from "@apollo/client";

export const CALENDAR_EVENTS_CHANGED_SUBSCRIPTION = gql`
  subscription CalendarEventsChanged($userId: ID!) {
    calendarEventsChanged(userId: $userId) {
      userId
      timestamp
    }
  }
`;
