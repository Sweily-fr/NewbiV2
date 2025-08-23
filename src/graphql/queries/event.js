import { gql } from '@apollo/client';

export const GET_EVENTS = gql`
  query GetEvents(
    $startDate: DateTime
    $endDate: DateTime
    $type: EventType
    $limit: Int
    $offset: Int
    $workspaceId: ID
  ) {
    getEvents(
      startDate: $startDate
      endDate: $endDate
      type: $type
      limit: $limit
      offset: $offset
      workspaceId: $workspaceId
    ) {
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
        location
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
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_EVENT = gql`
  query GetEvent($id: ID!, $workspaceId: ID) {
    getEvent(id: $id, workspaceId: $workspaceId) {
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
        createdAt
        updatedAt
      }
    }
  }
`;
