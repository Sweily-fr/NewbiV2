import { gql } from '@apollo/client';

// DEPRECATED: This file is kept for backward compatibility only.
// Please use @/src/graphql/queries/products instead.
// The GET_PRODUCTS query now requires workspaceId parameter.

// Requête pour récupérer tous les produits avec recherche
// ⚠️ DEPRECATED - Use queries/products.js instead
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

// Mutation pour créer un nouveau produit
export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
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
  }
`;

// Mutation pour mettre à jour un produit
export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
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
  }
`;

// Mutation pour supprimer un produit
export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;
