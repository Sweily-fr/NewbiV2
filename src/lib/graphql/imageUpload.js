/**
 * Service GraphQL pour l'upload d'images vers Cloudflare
 */

import { gql } from "@apollo/client";
import { apolloClient } from "../apolloClient";

// Mutations GraphQL
export const UPLOAD_SIGNATURE_IMAGE = gql`
  mutation UploadSignatureImage($file: Upload!, $imageType: String!) {
    uploadSignatureImage(file: $file, imageType: $imageType) {
      success
      key
      url
      contentType
      message
    }
  }
`;

export const DELETE_SIGNATURE_IMAGE = gql`
  mutation DeleteSignatureImage($key: String!) {
    deleteSignatureImage(key: $key) {
      success
      message
    }
  }
`;

export const GENERATE_SIGNED_IMAGE_URL = gql`
  mutation GenerateSignedImageUrl($key: String!, $expiresIn: Int) {
    generateSignedImageUrl(key: $key, expiresIn: $expiresIn) {
      success
      url
      expiresIn
      message
    }
  }
`;

// Queries GraphQL
export const GET_IMAGE_URL = gql`
  query GetImageUrl($key: String!) {
    getImageUrl(key: $key) {
      success
      key
      url
      message
    }
  }
`;

/**
 * Service pour gérer l'upload d'images vers Cloudflare
 */
export class CloudflareImageService {
  /**
   * Upload une image de signature vers Cloudflare
   * @param {File} file - Fichier image à uploader
   * @param {string} imageType - Type d'image ('profile' ou 'company')
   * @param {function} onProgress - Callback pour le progrès (optionnel)
   * @returns {Promise<{success: boolean, key: string, url: string}>}
   */
  static async uploadImage(file, imageType = "profile", onProgress = null) {
    try {
      // Validation côté client
      if (!file) {
        throw new Error("Aucun fichier sélectionné");
      }

      if (!["profile", "company"].includes(imageType)) {
        throw new Error(
          'Type d\'image invalide. Utilisez "profile" ou "company"'
        );
      }

      // Vérifier le type de fichier
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        throw new Error(
          "Format d'image non supporté. Utilisez JPG, PNG, GIF ou WebP"
        );
      }

      // Vérifier la taille (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("L'image est trop volumineuse (max 5MB)");
      }

      // Simuler le progrès si callback fourni
      if (onProgress) {
        onProgress(10);
      }

      // Exécuter la mutation GraphQL
      const { data, errors } = await apolloClient.mutate({
        mutation: UPLOAD_SIGNATURE_IMAGE,
        variables: {
          file,
          imageType,
        },
        context: {
          hasUpload: true, // Important pour les uploads de fichiers
        },
      });

      if (errors && errors.length > 0) {
        console.error("❌ Erreurs GraphQL:", errors);
        throw new Error(`Erreur GraphQL: ${errors[0].message}`);
      }

      if (onProgress) {
        onProgress(100);
      }

      if (!data || !data.uploadSignatureImage) {
        throw new Error(
          "Réponse GraphQL invalide - uploadSignatureImage est null"
        );
      }

      if (!data.uploadSignatureImage.success) {
        throw new Error(
          data.uploadSignatureImage.message || "Erreur lors de l'upload"
        );
      }

      return {
        success: true,
        key: data.uploadSignatureImage.key,
        url: data.uploadSignatureImage.url,
        contentType: data.uploadSignatureImage.contentType,
        message: data.uploadSignatureImage.message,
      };
    } catch (error) {
      console.error("Erreur upload Cloudflare:", error);
      throw new Error(error?.message || "Erreur lors de l'upload de l'image");
    }
  }

  /**
   * Récupère l'URL publique d'une image
   * @param {string} key - Clé de l'image dans Cloudflare
   * @returns {Promise<{success: boolean, url: string}>}
   */
  static async getImageUrl(key) {
    try {
      if (!key) {
        throw new Error("Clé d'image requise");
      }

      const { data } = await apolloClient.query({
        query: GET_IMAGE_URL,
        variables: { key },
        fetchPolicy: "cache-first", // Utiliser le cache si disponible
      });

      if (!data.getImageUrl.success) {
        throw new Error(
          data.getImageUrl.message || "Erreur lors de la récupération de l'URL"
        );
      }

      return {
        success: true,
        url: data.getImageUrl.url,
        key: data.getImageUrl.key,
      };
    } catch (error) {
      console.error("Erreur récupération URL:", error);
      throw new Error(
        error.message || "Erreur lors de la récupération de l'image"
      );
    }
  }

  /**
   * Supprime une image de Cloudflare
   * @param {string} key - Clé de l'image à supprimer
   * @returns {Promise<{success: boolean}>}
   */
  static async deleteImage(key) {
    try {
      if (!key) {
        throw new Error("Clé d'image requise");
      }

      const { data } = await apolloClient.mutate({
        mutation: DELETE_SIGNATURE_IMAGE,
        variables: { key },
      });

      if (!data.deleteSignatureImage.success) {
        throw new Error(
          data.deleteSignatureImage.message || "Erreur lors de la suppression"
        );
      }

      return {
        success: true,
        message: data.deleteSignatureImage.message,
      };
    } catch (error) {
      console.error("Erreur suppression image:", error);
      throw new Error(
        error.message || "Erreur lors de la suppression de l'image"
      );
    }
  }

  /**
   * Génère une URL signée temporaire
   * @param {string} key - Clé de l'image
   * @param {number} expiresIn - Durée de validité en secondes
   * @returns {Promise<{success: boolean, url: string}>}
   */
  static async generateSignedUrl(key, expiresIn = 3600) {
    try {
      if (!key) {
        throw new Error("Clé d'image requise");
      }

      const { data } = await apolloClient.mutate({
        mutation: GENERATE_SIGNED_IMAGE_URL,
        variables: { key, expiresIn },
      });

      if (!data.generateSignedImageUrl.success) {
        throw new Error(
          data.generateSignedImageUrl.message ||
            "Erreur lors de la génération de l'URL"
        );
      }

      return {
        success: true,
        url: data.generateSignedImageUrl.url,
        expiresIn: data.generateSignedImageUrl.expiresIn,
      };
    } catch (error) {
      console.error("Erreur génération URL signée:", error);
      throw new Error(
        error.message || "Erreur lors de la génération de l'URL signée"
      );
    }
  }
}

export default CloudflareImageService;
