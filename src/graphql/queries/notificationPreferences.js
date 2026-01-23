import { gql } from "@apollo/client";

/**
 * Query pour récupérer les préférences de notifications de l'utilisateur
 */
export const GET_NOTIFICATION_PREFERENCES = gql`
  query GetNotificationPreferences {
    getNotificationPreferences {
      invoice_overdue {
        email
        push
      }
      payment_received {
        email
        push
      }
      quote_response {
        email
        push
      }
      invoice_due_soon {
        email
        push
      }
      payment_failed {
        email
        push
      }
      trial_ending {
        email
        push
      }
      subscription_renewed {
        email
        push
      }
      invitation_received {
        email
        push
      }
      member_joined {
        email
        push
      }
      document_shared {
        email
        push
      }
    }
  }
`;
