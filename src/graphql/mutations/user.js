import { gql } from '@apollo/client';

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
