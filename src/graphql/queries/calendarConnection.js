import { gql } from '@apollo/client';

export const GET_CALENDAR_CONNECTIONS = gql`
  query GetCalendarConnections {
    getCalendarConnections {
      success
      message
      connections {
        id
        userId
        provider
        status
        accountEmail
        accountName
        selectedCalendars {
          calendarId
          name
          color
          enabled
        }
        lastSyncAt
        lastSyncError
        autoSync
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_AVAILABLE_CALENDARS = gql`
  query GetAvailableCalendars($connectionId: ID!) {
    getAvailableCalendars(connectionId: $connectionId) {
      success
      message
      calendars {
        calendarId
        name
        color
        isPrimary
      }
    }
  }
`;
