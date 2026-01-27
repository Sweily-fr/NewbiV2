import { gql } from '@apollo/client';

export const CREATE_CLIENT_CUSTOM_FIELD = gql`
  mutation CreateClientCustomField($workspaceId: ID!, $input: ClientCustomFieldInput!) {
    createClientCustomField(workspaceId: $workspaceId, input: $input) {
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

export const UPDATE_CLIENT_CUSTOM_FIELD = gql`
  mutation UpdateClientCustomField($workspaceId: ID!, $id: ID!, $input: ClientCustomFieldInput!) {
    updateClientCustomField(workspaceId: $workspaceId, id: $id, input: $input) {
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

export const DELETE_CLIENT_CUSTOM_FIELD = gql`
  mutation DeleteClientCustomField($workspaceId: ID!, $id: ID!) {
    deleteClientCustomField(workspaceId: $workspaceId, id: $id)
  }
`;

export const REORDER_CLIENT_CUSTOM_FIELDS = gql`
  mutation ReorderClientCustomFields($workspaceId: ID!, $fieldIds: [ID!]!) {
    reorderClientCustomFields(workspaceId: $workspaceId, fieldIds: $fieldIds) {
      id
      name
      order
    }
  }
`;
