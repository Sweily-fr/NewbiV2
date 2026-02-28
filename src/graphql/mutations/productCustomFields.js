import { gql } from '@apollo/client';

export const CREATE_PRODUCT_CUSTOM_FIELD = gql`
  mutation CreateProductCustomField($workspaceId: ID!, $input: CreateProductCustomFieldInput!) {
    createProductCustomField(workspaceId: $workspaceId, input: $input) {
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

export const UPDATE_PRODUCT_CUSTOM_FIELD = gql`
  mutation UpdateProductCustomField($workspaceId: ID!, $id: ID!, $input: UpdateProductCustomFieldInput!) {
    updateProductCustomField(workspaceId: $workspaceId, id: $id, input: $input) {
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

export const DELETE_PRODUCT_CUSTOM_FIELD = gql`
  mutation DeleteProductCustomField($workspaceId: ID!, $id: ID!) {
    deleteProductCustomField(workspaceId: $workspaceId, id: $id)
  }
`;

export const REORDER_PRODUCT_CUSTOM_FIELDS = gql`
  mutation ReorderProductCustomFields($workspaceId: ID!, $fieldIds: [ID!]!) {
    reorderProductCustomFields(workspaceId: $workspaceId, fieldIds: $fieldIds) {
      id
      name
      order
    }
  }
`;
