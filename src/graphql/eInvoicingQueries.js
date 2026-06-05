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

// URL signée (R2 ou copie SuperPDP) pour afficher le PDF Factur-X d'une facture.
// Renvoie null pour les brouillons (preview client live) ou si aucun document n'est disponible.
export const INVOICE_DOCUMENT_URL = gql`
  query InvoiceDocumentUrl($workspaceId: ID!, $invoiceId: ID!) {
    invoiceDocumentUrl(workspaceId: $workspaceId, invoiceId: $invoiceId)
  }
`;

// Statut de vérification KYC/KYB + entreprise SuperPDP connectée
export const EINVOICING_VERIFICATION = gql`
  query EInvoicingVerification($workspaceId: ID!) {
    eInvoicingVerification(workspaceId: $workspaceId) {
      connected
      companyVerificationStatus
      userIdentityVerificationStatus
      error
      company {
        formalName
        tradeName
        number
        numberScheme
        vatRegime
        env
      }
    }
  }
`;

// Entrées d'annuaire (réception de factures)
export const EINVOICING_DIRECTORY_ENTRIES = gql`
  query EInvoicingDirectoryEntries($workspaceId: ID!) {
    eInvoicingDirectoryEntries(workspaceId: $workspaceId) {
      id
      directory
      identifier
      status
      statusMessage
      effectiveDate
    }
  }
`;

// Inscription dans les annuaires Peppol + PPF
export const REGISTER_EINVOICING_DIRECTORY = gql`
  mutation RegisterEInvoicingDirectory($workspaceId: ID!) {
    registerEInvoicingDirectory(workspaceId: $workspaceId) {
      id
      directory
      identifier
      status
      statusMessage
    }
  }
`;

// Historique des déclarations e-reporting transmises au PPF
export const EINVOICING_EREPORTINGS = gql`
  query EInvoicingEReportings($workspaceId: ID!) {
    eInvoicingEReportings(workspaceId: $workspaceId) {
      id
      kind
      startPeriod
      endPeriod
    }
  }
`;

// Met à jour le régime TVA SuperPDP (pilote le calendrier e-reporting au PPF)
export const UPDATE_EINVOICING_VAT_REGIME = gql`
  mutation UpdateEInvoicingVatRegime($workspaceId: ID!, $vatRegime: String!) {
    updateEInvoicingVatRegime(workspaceId: $workspaceId, vatRegime: $vatRegime)
  }
`;

// Archive le PDF Factur-X (généré côté frontend) d'une facture non-brouillon sur R2.
export const ARCHIVE_INVOICE_PDF = gql`
  mutation ArchiveInvoicePdf(
    $workspaceId: ID!
    $invoiceId: ID!
    $file: Upload!
  ) {
    archiveInvoicePdf(
      workspaceId: $workspaceId
      invoiceId: $invoiceId
      file: $file
    ) {
      id
      archivedPdfKey
      archivedPdfStoredAt
      archivedPdfSource
    }
  }
`;
