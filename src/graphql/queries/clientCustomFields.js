import { gql } from '@apollo/client';

export const GET_CLIENT_CUSTOM_FIELDS = gql`
  query GetClientCustomFields($workspaceId: ID!) {
    clientCustomFields(workspaceId: $workspaceId) {
      id
      name
      fieldType
      description
      options {
        label
        value
        color
      }
      placeholder
      isRequired
      order
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_CLIENT_CUSTOM_FIELD = gql`
  query GetClientCustomField($workspaceId: ID!, $id: ID!) {
    clientCustomField(workspaceId: $workspaceId, id: $id) {
      id
      name
      fieldType
      description
      options {
        label
        value
        color
      }
      placeholder
      isRequired
      order
      isActive
      createdAt
      updatedAt
    }
  }
`;
