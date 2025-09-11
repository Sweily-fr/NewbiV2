import { gql } from '@apollo/client';

// Requête pour récupérer tous les produits avec recherche
export const GET_PRODUCTS = gql`
  query GetProducts($search: String, $category: String, $page: Int, $limit: Int) {
    products(search: $search, category: $category, page: $page, limit: $limit) {
      products {
        id
        name
        description
        unitPrice
        vatRate
        unit
        category
        reference
        createdAt
        updatedAt
      }
      totalCount
      hasNextPage
    }
  }
`;

// Requête pour récupérer un produit par ID
export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      description
      unitPrice
      vatRate
      unit
      category
      reference
      createdBy {
        id
        email
        profile {
          firstName
          lastName
        }
      }
      createdAt
      updatedAt
    }
  }
`;
