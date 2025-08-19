import { gql } from '@apollo/client';

export const GET_EVENTS = gql`
  query GetEvents(
    $startDate: DateTime
    $endDate: DateTime
    $type: EventType
    $limit: Int
    $offset: Int
  ) {
    getEvents(
      startDate: $startDate
      endDate: $endDate
      type: $type
      limit: $limit
      offset: $offset
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
  query GetEvent($id: ID!) {
    getEvent(id: $id) {
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
