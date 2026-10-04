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
      showOnDocuments
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
      showOnDocuments
      isActive
      createdAt
      updatedAt
    }
  }
`;

// Champs personnalisés d'un client à afficher sur les documents (valeurs mises
// en forme par l'API) : sert à l'aperçu en direct des éditeurs de documents.
export const GET_CLIENT_DOCUMENT_FIELDS = gql`
  query GetClientDocumentFields($workspaceId: ID!, $clientId: ID!) {
    clientDocumentFields(workspaceId: $workspaceId, clientId: $clientId) {
      label
      value
    }
  }
`;
