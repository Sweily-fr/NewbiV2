import { gql } from "@apollo/client";

// Crée le lien d'abonnement, ou le remplace (l'ancienne adresse cesse de
// fonctionner dans les agendas qui la suivent)
export const REGENERATE_CALENDAR_FEED_LINK = gql`
  mutation RegenerateCalendarFeedLink($workspaceId: ID) {
    regenerateCalendarFeedLink(workspaceId: $workspaceId) {
      enabled
      url
      createdAt
      lastAccessedAt
    }
  }
`;

export const DISABLE_CALENDAR_FEED_LINK = gql`
  mutation DisableCalendarFeedLink($workspaceId: ID) {
    disableCalendarFeedLink(workspaceId: $workspaceId) {
      enabled
      url
      createdAt
      lastAccessedAt
    }
  }
`;

export const SET_CALENDAR_WEEKLY_DIGEST = gql`
  mutation SetCalendarWeeklyDigest($enabled: Boolean!) {
    setCalendarWeeklyDigest(enabled: $enabled)
  }
`;
