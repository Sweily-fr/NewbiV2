import { gql } from '@apollo/client';

export const GET_CLIENTS = gql`
  query GetClients($page: Int, $limit: Int, $search: String) {
    clients(page: $page, limit: $limit, search: $search) {
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
  query GetClient($id: ID!) {
    client(id: $id) {
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
