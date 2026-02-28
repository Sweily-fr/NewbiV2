import { gql } from "@apollo/client";

export const GET_GMAIL_CONNECTION = gql`
  query GetGmailConnection($workspaceId: ID!) {
    gmailConnection(workspaceId: $workspaceId) {
      id
      accountEmail
      accountName
      isActive
      scanPeriodMonths
      status
      lastSyncAt
      lastSyncError
      totalEmailsScanned
      totalInvoicesFound
      createdAt
    }
  }
`;

export const GET_GMAIL_SYNC_STATS = gql`
  query GetGmailSyncStats($workspaceId: ID!) {
    gmailSyncStats(workspaceId: $workspaceId) {
      totalEmailsScanned
      totalInvoicesFound
      pendingReview
      lastSyncAt
    }
  }
`;
