import { gql } from '@apollo/client';

export const CREATE_CLIENT_SEGMENT = gql`
  mutation CreateClientSegment($workspaceId: String!, $input: CreateClientSegmentInput!) {
    createClientSegment(workspaceId: $workspaceId, input: $input) {
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

export const UPDATE_CLIENT_SEGMENT = gql`
  mutation UpdateClientSegment($workspaceId: String!, $id: ID!, $input: UpdateClientSegmentInput!) {
    updateClientSegment(workspaceId: $workspaceId, id: $id, input: $input) {
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

export const DELETE_CLIENT_SEGMENT = gql`
  mutation DeleteClientSegment($workspaceId: String!, $id: ID!) {
    deleteClientSegment(workspaceId: $workspaceId, id: $id)
  }
`;
