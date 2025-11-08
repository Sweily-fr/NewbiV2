import { gql } from '@apollo/client';

/**
 * Mutation pour mettre à jour les préférences email
 */
export const UPDATE_EMAIL_PREFERENCES = gql`
  mutation UpdateEmailPreferences($input: EmailPreferencesInput!) {
    updateEmailPreferences(input: $input) {
      success
      message
    }
  }
`;

/**
 * Mutation pour envoyer un email de test
 */
export const SEND_TEST_EMAIL = gql`
  mutation SendTestEmail {
    sendTestEmail {
      success
      message
    }
  }
`;
