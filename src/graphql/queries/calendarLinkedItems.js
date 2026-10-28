import { gql } from "@apollo/client";

// Échéances des autres pages affichées dans le calendrier (factures de vente
// et d'achat, devis en attente, factures récurrentes, tâches, prévisions,
// relances, livraisons, transferts)
export const GET_CALENDAR_LINKED_ITEMS = gql`
  query GetCalendarLinkedItems($workspaceId: ID, $from: String!, $to: String!) {
    calendarLinkedItems(workspaceId: $workspaceId, from: $from, to: $to) {
      kinds
      truncated
      items {
        id
        kind
        entityId
        day
        title
        reference
        counterparty
        amount
        currency
        state
        documentStatus
        boardId
        boardTitle
        boardEmoji
        boardColor
        columnTitle
        columnColor
        priority
        sourceInvoiceId
        frequency
        interval
        startDate
        dueDate
        signatureStatus
        signatureSentAt
        flowType
        forecastOrigin
        category
        reminderStep
        reminderStatus
        documentKind
        downloadCount
        assignedMembersInfo {
          id
          userId
          name
          email
          image
        }
      }
    }
  }
`;
