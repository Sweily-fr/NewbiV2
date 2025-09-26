/**
 * Service GraphQL pour les icônes sociales personnalisées
 */

import { gql } from '@apollo/client';
import { apolloClient } from '../apolloClient';

// Mutations GraphQL
export const GENERATE_CUSTOM_SOCIAL_ICONS = gql`
  mutation GenerateCustomSocialIcons($signatureId: String!, $logoUrl: String!) {
    generateCustomSocialIcons(signatureId: $signatureId, logoUrl: $logoUrl) {
      success
      message
      icons {
        facebook {
          url
          key
        }
        instagram {
          url
          key
        }
        linkedin {
          url
          key
        }
        x {
          url
          key
        }
      }
    }
  }
`;

export const UPDATE_CUSTOM_SOCIAL_ICONS = gql`
  mutation UpdateCustomSocialIcons($signatureId: String!, $newLogoUrl: String!) {
    updateCustomSocialIcons(signatureId: $signatureId, newLogoUrl: $newLogoUrl) {
      success
      message
      icons {
        facebook {
          url
          key
        }
        instagram {
          url
          key
        }
        linkedin {
          url
          key
        }
        x {
          url
          key
        }
      }
    }
  }
`;

export const DELETE_CUSTOM_SOCIAL_ICONS = gql`
  mutation DeleteCustomSocialIcons($signatureId: String!) {
    deleteCustomSocialIcons(signatureId: $signatureId) {
      success
      message
    }
  }
`;

/**
 * Service pour gérer les icônes sociales personnalisées
 */
export class SocialIconService {
  /**
   * Génère les icônes sociales personnalisées pour une signature
   * @param {string} signatureId - ID de la signature
   * @param {string} logoUrl - URL du logo de l'entreprise
   * @returns {Promise<Object>} - Résultat de la génération
   */
  static async generateCustomIcons(signatureId, logoUrl) {
    try {
      console.log('🚀 Génération icônes sociales:', { signatureId, logoUrl });
      
      const { data } = await apolloClient.mutate({
        mutation: GENERATE_CUSTOM_SOCIAL_ICONS,
        variables: { signatureId, logoUrl }
      });

      if (data?.generateCustomSocialIcons?.success) {
        console.log('✅ Icônes générées:', data.generateCustomSocialIcons.icons);
        return {
          success: true,
          icons: data.generateCustomSocialIcons.icons,
          message: data.generateCustomSocialIcons.message
        };
      } else {
        throw new Error(data?.generateCustomSocialIcons?.message || 'Erreur génération icônes');
      }
    } catch (error) {
      console.error('❌ Erreur génération icônes sociales:', error);
      return {
        success: false,
        icons: {},
        message: error.message
      };
    }
  }

  /**
   * Met à jour les icônes sociales quand le logo change
   * @param {string} signatureId - ID de la signature
   * @param {string} newLogoUrl - Nouvelle URL du logo
   * @returns {Promise<Object>} - Résultat de la mise à jour
   */
  static async updateCustomIcons(signatureId, newLogoUrl) {
    try {
      console.log('🔄 Mise à jour icônes sociales:', { signatureId, newLogoUrl });
      
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_CUSTOM_SOCIAL_ICONS,
        variables: { signatureId, newLogoUrl }
      });

      if (data?.updateCustomSocialIcons?.success) {
        console.log('✅ Icônes mises à jour:', data.updateCustomSocialIcons.icons);
        return {
          success: true,
          icons: data.updateCustomSocialIcons.icons,
          message: data.updateCustomSocialIcons.message
        };
      } else {
        throw new Error(data?.updateCustomSocialIcons?.message || 'Erreur mise à jour icônes');
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour icônes sociales:', error);
      return {
        success: false,
        icons: {},
        message: error.message
      };
    }
  }

  /**
   * Supprime les icônes sociales personnalisées
   * @param {string} signatureId - ID de la signature
   * @returns {Promise<Object>} - Résultat de la suppression
   */
  static async deleteCustomIcons(signatureId) {
    try {
      console.log('🗑️ Suppression icônes sociales:', { signatureId });
      
      const { data } = await apolloClient.mutate({
        mutation: DELETE_CUSTOM_SOCIAL_ICONS,
        variables: { signatureId }
      });

      if (data?.deleteCustomSocialIcons?.success) {
        console.log('✅ Icônes supprimées');
        return {
          success: true,
          message: data.deleteCustomSocialIcons.message
        };
      } else {
        throw new Error(data?.deleteCustomSocialIcons?.message || 'Erreur suppression icônes');
      }
    } catch (error) {
      console.error('❌ Erreur suppression icônes sociales:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}
