import { gql } from "@apollo/client";

// === QUERIES ===

export const GET_EINVOICING_SETTINGS = gql`
  query GetEInvoicingSettings($workspaceId: ID!) {
    eInvoicingSettings(workspaceId: $workspaceId) {
      eInvoicingEnabled
      superPdpConfigured
      superPdpWebhookConfigured
      superPdpClientId
      superPdpEnvironment
      eInvoicingActivatedAt
    }
  }
`;

export const GET_EINVOICING_STATS = gql`
  query GetEInvoicingStats($workspaceId: ID!) {
    eInvoicingStats(workspaceId: $workspaceId) {
      NOT_SENT
      PENDING_VALIDATION
      VALIDATED
      SENT_TO_RECIPIENT
      RECEIVED
      ACCEPTED
      REJECTED
      PAID
      ERROR
      totalSent
      successRate
    }
  }
`;

// === MUTATIONS ===

export const ENABLE_EINVOICING = gql`
  mutation EnableEInvoicing($workspaceId: ID!, $environment: String) {
    enableEInvoicing(workspaceId: $workspaceId, environment: $environment) {
      success
      message
      connectionVerified
      settings {
        eInvoicingEnabled
        superPdpConfigured
        superPdpEnvironment
        eInvoicingActivatedAt
      }
    }
  }
`;

export const DISABLE_EINVOICING = gql`
  mutation DisableEInvoicing($workspaceId: ID!) {
    disableEInvoicing(workspaceId: $workspaceId) {
      success
      message
      settings {
        eInvoicingEnabled
      }
    }
  }
`;

export const TEST_SUPERPDP_CONNECTION = gql`
  mutation TestSuperPdpConnection($workspaceId: ID!) {
    testSuperPdpConnection(workspaceId: $workspaceId) {
      success
      message
      profile
    }
  }
`;

export const RESEND_INVOICE_TO_SUPERPDP = gql`
  mutation ResendInvoiceToSuperPdp($workspaceId: ID!, $invoiceId: ID!) {
    resendInvoiceToSuperPdp(workspaceId: $workspaceId, invoiceId: $invoiceId) {
      success
      message
      superPdpInvoiceId
      status
    }
  }
`;

export const CHECK_RECIPIENT_EINVOICING = gql`
  mutation CheckRecipientEInvoicing($workspaceId: ID!, $siret: String!) {
    checkRecipientEInvoicing(workspaceId: $workspaceId, siret: $siret) {
      success
      canReceiveEInvoices
      pdpName
      pdpId
      peppolId
      error
    }
  }
`;
