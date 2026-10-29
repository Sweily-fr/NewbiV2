import { gql } from "@apollo/client";

// Champs d'une échéance, communs au calendrier et à la liste « En retard »
const CALENDAR_LINKED_ITEM_FIELDS = gql`
  fragment CalendarLinkedItemFields on CalendarLinkedItem {
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
    infoUrl
    isIndicative
    isConditional
    note
    assignedMembersInfo {
      id
      userId
      name
      email
      image
    }
  }
`;

// Échéances des autres pages affichées dans le calendrier (factures de vente
// et d'achat, devis en attente, factures récurrentes, tâches, prévisions,
// relances, livraisons, transferts, échéances fiscales)
export const GET_CALENDAR_LINKED_ITEMS = gql`
  query GetCalendarLinkedItems($workspaceId: ID, $from: String!, $to: String!) {
    calendarLinkedItems(workspaceId: $workspaceId, from: $from, to: $to) {
      kinds
      truncated
      fiscalSetup {
        complete
        missing {
          code
          label
          concerns
        }
      }
      items {
        ...CalendarLinkedItemFields
      }
    }
  }
  ${CALENDAR_LINKED_ITEM_FIELDS}
`;

// Tout ce qui est en retard, quelle que soit la date (bouton « En retard »)
export const GET_CALENDAR_OVERDUE_ITEMS = gql`
  query GetCalendarOverdueItems($workspaceId: ID) {
    calendarOverdueItems(workspaceId: $workspaceId) {
      kinds
      truncated
      items {
        ...CalendarLinkedItemFields
      }
    }
  }
  ${CALENDAR_LINKED_ITEM_FIELDS}
`;
