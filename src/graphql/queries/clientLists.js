import { gql } from '@apollo/client';

export const GET_CLIENT_LISTS = gql`
  query GetClientLists($workspaceId: String!) {
    clientLists(workspaceId: $workspaceId) {
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

export const GET_CLIENT_LISTS_BY_CLIENT = gql`
  query GetClientListsByClient($workspaceId: String!, $clientId: ID!) {
    clientListsByClient(workspaceId: $workspaceId, clientId: $clientId) {
      id
      name
      description
      color
      icon
      isDefault
    }
  }
`;

export const GET_CLIENT_LIST = gql`
  query GetClientList($workspaceId: String!, $id: ID!) {
    clientList(workspaceId: $workspaceId, id: $id) {
      id
      name
      description
      color
      icon
      isDefault
      clients {
        id
        name
        email
        type
        firstName
        lastName
      }
      clientCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_CLIENTS_IN_LIST = gql`
  query GetClientsInList($workspaceId: String!, $listId: ID!, $page: Int, $limit: Int, $search: String) {
    clientsInList(workspaceId: $workspaceId, listId: $listId, page: $page, limit: $limit, search: $search) {
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
        hasDifferentShippingAddress
        shippingAddress {
          fullName
          street
          city
          postalCode
          country
        }
        siret
        vatNumber
      }
      totalItems
      currentPage
      totalPages
    }
  }
`;
