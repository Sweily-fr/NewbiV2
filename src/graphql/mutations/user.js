import { gql } from "@apollo/client";

/**
 * Mutation pour uploader une image de profil utilisateur
 */
export const UPLOAD_USER_PROFILE_IMAGE = gql`
  mutation UploadUserProfileImage($file: Upload!) {
    uploadUserProfileImage(file: $file) {
      success
      key
      url
      contentType
      message
    }
  }
`;

/**
 * Mutation pour supprimer une image de profil utilisateur
 */
export const DELETE_USER_PROFILE_IMAGE = gql`
  mutation DeleteUserProfileImage {
    deleteUserProfileImage {
      success
      message
    }
  }
`;

/**
 * Mutation pour mettre à jour les informations de l'entreprise
 */
export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($input: CompanyInput!) {
    updateCompany(input: $input) {
      id
      company {
        name
        email
        logo
        phone
        website
        address {
          street
          city
          postalCode
          country
        }
        siret
        vatNumber
        rcs
        companyStatus
        capitalSocial
      }
    }
  }
`;

/**
 * Mutation spécifique pour mettre à jour le logo de l'entreprise
 */
export const UPDATE_COMPANY_LOGO = gql`
  mutation UpdateCompanyLogo($logoUrl: String, $workspaceId: ID!) {
    updateCompanyLogo(logoUrl: $logoUrl, workspaceId: $workspaceId) {
      id
      company {
        logo
      }
    }
  }
`;
