import { gql } from '@apollo/client';

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
