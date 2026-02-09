import { gql } from '@apollo/client';

export const CONNECT_APPLE_CALENDAR = gql`
  mutation ConnectAppleCalendar($input: ConnectAppleCalendarInput!) {
    connectAppleCalendar(input: $input) {
      success
      message
      connection {
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
        createdAt
        updatedAt
      }
    }
  }
`;

export const DISCONNECT_CALENDAR = gql`
  mutation DisconnectCalendar($connectionId: ID!) {
    disconnectCalendar(connectionId: $connectionId) {
      success
      message
      connection {
        id
        provider
        status
      }
    }
  }
`;

export const UPDATE_SELECTED_CALENDARS = gql`
  mutation UpdateSelectedCalendars($input: UpdateSelectedCalendarsInput!) {
    updateSelectedCalendars(input: $input) {
      success
      message
      connection {
        id
        selectedCalendars {
          calendarId
          name
          color
          enabled
        }
      }
    }
  }
`;

export const SYNC_CALENDAR = gql`
  mutation SyncCalendar($connectionId: ID!) {
    syncCalendar(connectionId: $connectionId) {
      success
      message
      syncedCount
      connection {
        id
        status
        lastSyncAt
        lastSyncError
      }
    }
  }
`;

export const SYNC_ALL_CALENDARS = gql`
  mutation SyncAllCalendars {
    syncAllCalendars {
      success
      message
      syncedCount
    }
  }
`;

export const PUSH_EVENT_TO_CALENDAR = gql`
  mutation PushEventToCalendar($input: PushEventToCalendarInput!) {
    pushEventToCalendar(input: $input) {
      success
      message
    }
  }
`;

export const UPDATE_AUTO_SYNC = gql`
  mutation UpdateAutoSync($input: UpdateAutoSyncInput!) {
    updateAutoSync(input: $input) {
      success
      message
      connection {
        id
        autoSync
      }
    }
  }
`;
