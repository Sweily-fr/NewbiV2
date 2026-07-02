import { gql, useMutation, useQuery } from "@apollo/client";
import { useWorkspace } from "@/src/hooks/useWorkspace";

// Query pour récupérer les paramètres email
// workspaceId en variable pour que le cache Apollo soit séparé par organisation
export const GET_EMAIL_SETTINGS = gql`
  query GetEmailSettings($workspaceId: ID) {
    getEmailSettings(workspaceId: $workspaceId) {
      id
      workspaceId
      fromEmail
      fromName
      replyTo
      invoiceEmailTemplate
      quoteEmailTemplate
      creditNoteEmailTemplate
      purchaseOrderEmailTemplate
      useCustomFooter
      customEmailFooter
      verified
      verifiedAt
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour mettre à jour les paramètres email
export const UPDATE_EMAIL_SETTINGS = gql`
  mutation UpdateEmailSettings($workspaceId: ID, $input: EmailSettingsInput!) {
    updateEmailSettings(workspaceId: $workspaceId, input: $input) {
      id
      workspaceId
      fromEmail
      fromName
      replyTo
      invoiceEmailTemplate
      quoteEmailTemplate
      creditNoteEmailTemplate
      purchaseOrderEmailTemplate
      useCustomFooter
      customEmailFooter
      verified
      verifiedAt
      createdAt
      updatedAt
    }
  }
`;

// Hook pour récupérer les paramètres email de l'organisation active
export function useEmailSettings() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const result = useQuery(GET_EMAIL_SETTINGS, {
    variables: { workspaceId },
    // Attendre que l'organisation active soit confirmée pour éviter
    // que le backend retombe sur l'organisation par défaut
    skip: !workspaceId,
  });
  return { ...result, loading: result.loading || workspaceLoading };
}

// Hook pour mettre à jour les paramètres email
export function useUpdateEmailSettings() {
  const { workspaceId } = useWorkspace();
  return useMutation(UPDATE_EMAIL_SETTINGS, {
    variables: { workspaceId },
    refetchQueries: [{ query: GET_EMAIL_SETTINGS, variables: { workspaceId } }],
  });
}
