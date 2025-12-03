import { gql, useMutation, useQuery } from '@apollo/client';

// Query pour récupérer les paramètres email
export const GET_EMAIL_SETTINGS = gql`
  query GetEmailSettings {
    getEmailSettings {
      id
      workspaceId
      fromEmail
      fromName
      replyTo
      invoiceEmailTemplate
      quoteEmailTemplate
      creditNoteEmailTemplate
      verified
      verifiedAt
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour mettre à jour les paramètres email
export const UPDATE_EMAIL_SETTINGS = gql`
  mutation UpdateEmailSettings($input: EmailSettingsInput!) {
    updateEmailSettings(input: $input) {
      id
      workspaceId
      fromEmail
      fromName
      replyTo
      invoiceEmailTemplate
      quoteEmailTemplate
      creditNoteEmailTemplate
      verified
      verifiedAt
      createdAt
      updatedAt
    }
  }
`;

// Hook pour récupérer les paramètres email
export function useEmailSettings() {
  return useQuery(GET_EMAIL_SETTINGS, {
    fetchPolicy: 'cache-and-network',
  });
}

// Hook pour mettre à jour les paramètres email
export function useUpdateEmailSettings() {
  return useMutation(UPDATE_EMAIL_SETTINGS, {
    refetchQueries: [{ query: GET_EMAIL_SETTINGS }],
  });
}
