import { gql } from '@apollo/client';

export const CREATE_CLIENT = gql`
  mutation CreateClient($input: ClientInput!) {
    createClient(input: $input) {
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
        street
        city
        postalCode
        country
      }
      siret
      vatNumber
    }
  }
`;

export const UPDATE_CLIENT = gql`
  mutation UpdateClient($id: ID!, $input: ClientInput!) {
    updateClient(id: $id, input: $input) {
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
        street
        city
        postalCode
        country
      }
      siret
      vatNumber
    }
  }
`;

export const DELETE_CLIENT = gql`
  mutation DeleteClient($id: ID!) {
    deleteClient(id: $id)
  }
`;
