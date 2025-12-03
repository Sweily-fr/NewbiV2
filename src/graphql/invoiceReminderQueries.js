import { gql, useMutation, useQuery } from '@apollo/client';

// Query pour récupérer les paramètres de relance
export const GET_INVOICE_REMINDER_SETTINGS = gql`
  query GetInvoiceReminderSettings {
    getInvoiceReminderSettings {
      id
      workspaceId
      enabled
      firstReminderDays
      secondReminderDays
      reminderHour
      useCustomSender
      customSenderEmail
      fromEmail
      fromName
      replyTo
      excludedClientIds
      emailSubject
      emailBody
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour mettre à jour les paramètres
export const UPDATE_INVOICE_REMINDER_SETTINGS = gql`
  mutation UpdateInvoiceReminderSettings($input: InvoiceReminderSettingsInput!) {
    updateInvoiceReminderSettings(input: $input) {
      id
      workspaceId
      enabled
      firstReminderDays
      secondReminderDays
      reminderHour
      useCustomSender
      customSenderEmail
      fromEmail
      fromName
      replyTo
      excludedClientIds
      emailSubject
      emailBody
      createdAt
      updatedAt
    }
  }
`;

// Hook pour récupérer les paramètres
export function useInvoiceReminderSettings() {
  return useQuery(GET_INVOICE_REMINDER_SETTINGS, {
    fetchPolicy: 'cache-and-network',
  });
}

// Hook pour mettre à jour les paramètres
export function useUpdateInvoiceReminderSettings() {
  return useMutation(UPDATE_INVOICE_REMINDER_SETTINGS, {
    refetchQueries: [{ query: GET_INVOICE_REMINDER_SETTINGS }],
    awaitRefetchQueries: true,
  });
}
