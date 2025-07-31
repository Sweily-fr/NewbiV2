/**
 * Service de synchronisation des données utilisateur
 * Synchronise les données entre GraphQL et Better Auth
 */

import { updateUser } from '../auth-client';

/**
 * Synchronise l'avatar utilisateur avec Better Auth après upload GraphQL
 * @param {string} avatarUrl - URL de l'avatar uploadé via GraphQL
 * @returns {Promise<boolean>} - Succès de la synchronisation
 */
export async function syncUserAvatar(avatarUrl) {
  try {
    await updateUser(
      { avatar: avatarUrl },
      {
        onSuccess: () => {
          console.log('Avatar synchronisé avec Better Auth:', avatarUrl);
        },
        onError: (error) => {
          console.error('Erreur synchronisation avatar:', error);
          throw error;
        },
      }
    );
    return true;
  } catch (error) {
    console.error('Échec synchronisation avatar:', error);
    return false;
  }
}

/**
 * Supprime l'avatar utilisateur de Better Auth après suppression GraphQL
 * @returns {Promise<boolean>} - Succès de la synchronisation
 */
export async function syncUserAvatarDeletion() {
  try {
    await updateUser(
      { avatar: null },
      {
        onSuccess: () => {
          console.log('Avatar supprimé de Better Auth');
        },
        onError: (error) => {
          console.error('Erreur suppression avatar:', error);
          throw error;
        },
      }
    );
    return true;
  } catch (error) {
    console.error('Échec suppression avatar:', error);
    return false;
  }
}
