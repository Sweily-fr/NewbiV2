import { gql, useMutation, useQuery } from '@apollo/client';

// Query pour récupérer les paramètres SMTP
export const GET_SMTP_SETTINGS = gql`
  query GetSmtpSettings {
    getSmtpSettings {
      id
      workspaceId
      enabled
      smtpHost
      smtpPort
      smtpSecure
      smtpUser
      fromEmail
      fromName
      lastTestedAt
      lastTestStatus
      lastTestError
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour mettre à jour les paramètres SMTP
export const UPDATE_SMTP_SETTINGS = gql`
  mutation UpdateSmtpSettings($input: SmtpSettingsInput!) {
    updateSmtpSettings(input: $input) {
      id
      workspaceId
      enabled
      smtpHost
      smtpPort
      smtpSecure
      smtpUser
      fromEmail
      fromName
      lastTestedAt
      lastTestStatus
      lastTestError
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour tester la connexion SMTP
export const TEST_SMTP_CONNECTION = gql`
  mutation TestSmtpConnection {
    testSmtpConnection {
      success
      message
      error
    }
  }
`;

// Hook pour récupérer les paramètres SMTP
export function useSmtpSettings() {
  return useQuery(GET_SMTP_SETTINGS, {
    fetchPolicy: 'cache-and-network',
  });
}

// Hook pour mettre à jour les paramètres SMTP
export function useUpdateSmtpSettings() {
  return useMutation(UPDATE_SMTP_SETTINGS, {
    refetchQueries: [{ query: GET_SMTP_SETTINGS }],
  });
}

// Hook pour tester la connexion SMTP
export function useTestSmtpConnection() {
  return useMutation(TEST_SMTP_CONNECTION);
}
