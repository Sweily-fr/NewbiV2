import { gql } from "@apollo/client";

export const DISCONNECT_GMAIL = gql`
  mutation DisconnectGmail($connectionId: ID!) {
    disconnectGmail(connectionId: $connectionId) {
      id
      accountEmail
      status
      isActive
    }
  }
`;

export const TRIGGER_GMAIL_SYNC = gql`
  mutation TriggerGmailSync($connectionId: ID!) {
    triggerGmailSync(connectionId: $connectionId) {
      success
      scannedCount
      invoicesFound
      skippedCount
      message
    }
  }
`;

export const UPDATE_GMAIL_SCAN_PERIOD = gql`
  mutation UpdateGmailScanPeriod($connectionId: ID!, $scanPeriodMonths: Int!) {
    updateGmailScanPeriod(connectionId: $connectionId, scanPeriodMonths: $scanPeriodMonths) {
      id
      scanPeriodMonths
    }
  }
`;
