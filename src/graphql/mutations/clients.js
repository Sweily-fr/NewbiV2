import { gql } from '@apollo/client';

export const CREATE_CLIENT = gql`
  mutation CreateClient($workspaceId: String!, $input: ClientInput!) {
    createClient(workspaceId: $workspaceId, input: $input) {
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
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CLIENT = gql`
  mutation UpdateClient($workspaceId: String!, $id: ID!, $input: ClientInput!) {
    updateClient(workspaceId: $workspaceId, id: $id, input: $input) {
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
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CLIENT = gql`
  mutation DeleteClient($workspaceId: String!, $id: ID!) {
    deleteClient(workspaceId: $workspaceId, id: $id)
  }
`;
