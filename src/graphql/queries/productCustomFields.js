import { gql } from '@apollo/client';

export const GET_PRODUCT_CUSTOM_FIELDS = gql`
  query GetProductCustomFields($workspaceId: ID!) {
    productCustomFields(workspaceId: $workspaceId) {
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

export const GET_PRODUCT_CUSTOM_FIELD = gql`
  query GetProductCustomField($workspaceId: ID!, $id: ID!) {
    productCustomField(workspaceId: $workspaceId, id: $id) {
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
