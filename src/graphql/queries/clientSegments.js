import { gql } from '@apollo/client';

export const GET_CLIENT_SEGMENTS = gql`
  query GetClientSegments($workspaceId: String!) {
    clientSegments(workspaceId: $workspaceId) {
      id
      name
      description
      matchType
      rules {
        field
        operator
        value
      }
      color
      icon
      clientCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_CLIENT_SEGMENT = gql`
  query GetClientSegment($workspaceId: String!, $id: ID!) {
    clientSegment(workspaceId: $workspaceId, id: $id) {
      id
      name
      description
      matchType
      rules {
        field
        operator
        value
      }
      color
      icon
      clientCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_CLIENTS_IN_SEGMENT = gql`
  query GetClientsInSegment($workspaceId: String!, $segmentId: ID!, $page: Int, $limit: Int, $search: String) {
    clientsInSegment(workspaceId: $workspaceId, segmentId: $segmentId, page: $page, limit: $limit, search: $search) {
      items {
        id
        name
        email
        type
        firstName
        lastName
        address {
          street
          city
          postalCode
          country
        }
        isBlocked
      }
      totalItems
      currentPage
      totalPages
    }
  }
`;
