import { gql } from '@apollo/client';

/**
 * Query pour récupérer les préférences email de l'utilisateur
 */
export const GET_EMAIL_PREFERENCES = gql`
  query GetEmailPreferences {
    getEmailPreferences {
      enabled
      types
      doNotDisturb {
        weekday {
          start
          end
        }
        weekend {
          start
          end
        }
      }
    }
  }
`;

/**
 * Query pour récupérer les logs d'emails
 */
export const GET_EMAIL_LOGS = gql`
  query GetEmailLogs(
    $workspaceId: ID!
    $status: String
    $limit: Int
    $offset: Int
  ) {
    getEmailLogs(
      workspaceId: $workspaceId
      status: $status
      limit: $limit
      offset: $offset
    ) {
      logs {
        id
        eventId
        recipientEmail
        reminderType
        anticipation
        status
        sentAt
        scheduledFor
        failureReason
        deferredReason
        eventSnapshot {
          title
          description
          start
          end
        }
        createdAt
      }
      totalCount
      hasMore
    }
  }
`;

/**
 * Query pour tester un rappel email
 */
export const TEST_EMAIL_REMINDER = gql`
  query TestEmailReminder($eventId: ID!) {
    testEmailReminder(eventId: $eventId) {
      success
      message
    }
  }
`;
