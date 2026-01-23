import { gql } from "@apollo/client";

/**
 * Mutation pour mettre à jour les préférences de notifications
 */
export const UPDATE_NOTIFICATION_PREFERENCES = gql`
  mutation UpdateNotificationPreferences(
    $input: NotificationPreferencesInput!
  ) {
    updateNotificationPreferences(input: $input) {
      success
      message
    }
  }
`;
