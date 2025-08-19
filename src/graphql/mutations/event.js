import { gql } from '@apollo/client';

export const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
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
  mutation UpdateEvent($input: UpdateEventInput!) {
    updateEvent(input: $input) {
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
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id) {
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
  mutation SyncInvoiceEvents {
    syncInvoiceEvents {
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
