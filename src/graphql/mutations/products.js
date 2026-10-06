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
      imageUrl
      showImageOnDocuments
      linkedProducts {
        productId
        quantity
        per
        rounding
        product {
          id
          name
          description
          unitPrice
          vatRate
          unit
          reference
          imageUrl
          showImageOnDocuments
        }
      }
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
      imageUrl
      showImageOnDocuments
      linkedProducts {
        productId
        quantity
        per
        rounding
        product {
          id
          name
          description
          unitPrice
          vatRate
          unit
          reference
          imageUrl
          showImageOnDocuments
        }
      }
      createdAt
      updatedAt
    }
  }
`;

// Envoi d'une image de produit (R2) : l'URL renvoyée est ensuite
// enregistrée dans imageUrl à la création ou à la modification
export const UPLOAD_PRODUCT_IMAGE = gql`
  mutation UploadProductImage($workspaceId: ID!, $file: Upload!) {
    uploadProductImage(workspaceId: $workspaceId, file: $file) {
      success
      url
      message
    }
  }
`;

// Mutation pour supprimer un produit
export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;
