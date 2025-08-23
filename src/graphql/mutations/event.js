import { gql } from '@apollo/client';

export const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!, $workspaceId: ID) {
    createEvent(input: $input, workspaceId: $workspaceId) {
      success
      message
      event {
        id
        title
        description
        start
        end
        allDay
        color
        location
        type
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($input: UpdateEventInput!, $workspaceId: ID) {
    updateEvent(input: $input, workspaceId: $workspaceId) {
      success
      message
      event {
        id
        title
        description
        start
        end
        allDay
        color
        location
        type
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!, $workspaceId: ID) {
    deleteEvent(id: $id, workspaceId: $workspaceId) {
      success
      message
      event {
        id
        title
      }
    }
  }
`;

export const SYNC_INVOICE_EVENTS = gql`
  mutation SyncInvoiceEvents($workspaceId: ID) {
    syncInvoiceEvents(workspaceId: $workspaceId) {
      success
      message
      totalCount
      events {
        id
        title
        description
        start
        end
        allDay
        color
        type
        invoiceId
        invoice {
          id
          prefix
          number
          client {
            name
          }
          finalTotalTTC
          status
        }
      }
    }
  }
`;
