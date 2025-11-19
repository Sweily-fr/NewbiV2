import { gql } from '@apollo/client';

export const GET_CLIENTS = gql`
  query GetClients($workspaceId: String!, $page: Int, $limit: Int, $search: String) {
    clients(workspaceId: $workspaceId, page: $page, limit: $limit, search: $search) {
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

export const GET_CLIENT = gql`
  query GetClient($workspaceId: String!, $id: ID!) {
    client(workspaceId: $workspaceId, id: $id) {
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
      notes {
        id
        content
        userId
        userName
        userImage
        createdAt
        updatedAt
      }
      activity {
        id
        type
        description
        field
        oldValue
        newValue
        userId
        userName
        userImage
        createdAt
        metadata {
          documentType
          documentId
          documentNumber
          status
        }
      }
      createdAt
      updatedAt
    }
  }
`;
