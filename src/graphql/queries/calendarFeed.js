import { gql } from "@apollo/client";

// Lien d'abonnement au calendrier de l'espace (Google Agenda, Apple
// Calendrier, Outlook) : adresse secrète propre à l'utilisateur
export const GET_CALENDAR_FEED_LINK = gql`
  query GetCalendarFeedLink($workspaceId: ID) {
    calendarFeedLink(workspaceId: $workspaceId) {
      enabled
      url
      createdAt
      lastAccessedAt
    }
  }
`;

// Récap du lundi par e-mail (préférence de l'utilisateur, tous ses espaces)
export const GET_CALENDAR_WEEKLY_DIGEST = gql`
  query GetCalendarWeeklyDigest {
    calendarWeeklyDigest
  }
`;
