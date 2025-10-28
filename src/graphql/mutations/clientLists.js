import { gql } from '@apollo/client';

export const CREATE_CLIENT_LIST = gql`
  mutation CreateClientList($workspaceId: String!, $input: CreateClientListInput!) {
    createClientList(workspaceId: $workspaceId, input: $input) {
      id
      name
      description
      color
      icon
      isDefault
      clientCount
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CLIENT_LIST = gql`
  mutation UpdateClientList($workspaceId: String!, $id: ID!, $input: UpdateClientListInput!) {
    updateClientList(workspaceId: $workspaceId, id: $id, input: $input) {
      id
      name
      description
      color
      icon
      isDefault
      clientCount
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CLIENT_LIST = gql`
  mutation DeleteClientList($workspaceId: String!, $id: ID!) {
    deleteClientList(workspaceId: $workspaceId, id: $id)
  }
`;

export const ADD_CLIENT_TO_LIST = gql`
  mutation AddClientToList($workspaceId: String!, $listId: ID!, $clientId: ID!) {
    addClientToList(workspaceId: $workspaceId, listId: $listId, clientId: $clientId) {
      id
      name
      clientCount
      clients {
        id
      }
    }
  }
`;

export const REMOVE_CLIENT_FROM_LIST = gql`
  mutation RemoveClientFromList($workspaceId: String!, $listId: ID!, $clientId: ID!) {
    removeClientFromList(workspaceId: $workspaceId, listId: $listId, clientId: $clientId) {
      id
      name
      clientCount
      clients {
        id
      }
    }
  }
`;

export const ADD_CLIENTS_TO_LIST = gql`
  mutation AddClientsToList($workspaceId: String!, $listId: ID!, $clientIds: [ID!]!) {
    addClientsToList(workspaceId: $workspaceId, listId: $listId, clientIds: $clientIds) {
      id
      name
      clientCount
      clients {
        id
      }
    }
  }
`;

export const REMOVE_CLIENTS_FROM_LIST = gql`
  mutation RemoveClientsFromList($workspaceId: String!, $listId: ID!, $clientIds: [ID!]!) {
    removeClientsFromList(workspaceId: $workspaceId, listId: $listId, clientIds: $clientIds) {
      id
      name
      clientCount
      clients {
        id
      }
    }
  }
`;

export const ADD_CLIENT_TO_LISTS = gql`
  mutation AddClientToLists($workspaceId: String!, $clientId: ID!, $listIds: [ID!]!) {
    addClientToLists(workspaceId: $workspaceId, clientId: $clientId, listIds: $listIds) {
      id
      name
      clientCount
    }
  }
`;

export const REMOVE_CLIENT_FROM_LISTS = gql`
  mutation RemoveClientFromLists($workspaceId: String!, $clientId: ID!, $listIds: [ID!]!) {
    removeClientFromLists(workspaceId: $workspaceId, clientId: $clientId, listIds: $listIds) {
      id
      name
      clientCount
    }
  }
`;
