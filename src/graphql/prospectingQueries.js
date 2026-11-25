import { gql } from "@apollo/client";

// Prospection (Communication) : un message de prospection à chaque prospect,
// envoyé depuis la boîte Gmail ou Outlook du membre (jamais par Resend), au
// rythme de sa boîte. newbi-api, src/schemas/types/prospecting.graphql.
// Réutilise les types des campagnes : EmailCampaignAudience(Input),
// EmailCampaignVariable, EmailCampaignCheck.

export const PROSPECTING_MAILBOX_FIELDS = gql`
  fragment ProspectingMailboxFields on ProspectingMailbox {
    id
    provider
    accountEmail
    accountName
    isPersonalAddress
    status
    pausedReason
    dailyLimit
    effectiveDailyLimit
    sentToday
    sendWindow {
      days
      startHour
      endHour
    }
    signatureId
    connectedAt
    isMine
    ownerName
  }
`;

export const PROSPECTING_STATS_FIELDS = gql`
  fragment ProspectingStatsFields on ProspectingStats {
    recipients
    pending
    sent
    simulated
    replied
    bounced
    unsubscribed
    failed
    skipped
  }
`;

// Ligne de la liste : ni le message ni l'audience
export const PROSPECTING_SEQUENCE_LIST_FIELDS = gql`
  fragment ProspectingSequenceListFields on ProspectingSequence {
    id
    name
    status
    pauseKind
    pausedReason
    subject
    mailbox {
      id
      accountEmail
      isMine
      ownerName
    }
    stats {
      ...ProspectingStatsFields
    }
    estimatedEndDate
    startedAt
    completedAt
    createdAt
    updatedAt
    createdByName
    canSend
  }
  ${PROSPECTING_STATS_FIELDS}
`;

export const PROSPECTING_SEQUENCE_FIELDS = gql`
  fragment ProspectingSequenceFields on ProspectingSequence {
    id
    name
    status
    pauseKind
    pausedReason
    mailbox {
      ...ProspectingMailboxFields
    }
    audience {
      mode
      listIds
      excludeListIds
    }
    subject
    body
    signatureId
    stats {
      ...ProspectingStatsFields
    }
    estimatedEndDate
    consentAt
    startedAt
    completedAt
    createdAt
    updatedAt
    createdByName
    canSend
  }
  ${PROSPECTING_MAILBOX_FIELDS}
  ${PROSPECTING_STATS_FIELDS}
`;

export const PROSPECTING_RECIPIENT_FIELDS = gql`
  fragment ProspectingRecipientFields on ProspectingRecipient {
    id
    clientId
    email
    name
    company
    status
    sentAt
    repliedAt
    bouncedAt
    unsubscribedAt
    error
  }
`;

// Fournisseurs configurés sur le serveur, boîte du membre et de l'équipe,
// variables, bornes de la limite quotidienne, page « Vos données »
export const GET_PROSPECTING_SETTINGS = gql`
  query ProspectingSettings($workspaceId: ID!) {
    prospectingSettings(workspaceId: $workspaceId) {
      providers {
        google
        microsoft
      }
      myMailbox {
        ...ProspectingMailboxFields
      }
      mailboxes {
        ...ProspectingMailboxFields
      }
      variables {
        key
        label
        example
      }
      defaultDailyLimit
      maxDailyLimit
      dataPageUrl
    }
  }
  ${PROSPECTING_MAILBOX_FIELDS}
`;

export const GET_PROSPECTING_SEQUENCES = gql`
  query ProspectingSequences(
    $workspaceId: ID!
    $status: ProspectingSequenceStatus
  ) {
    prospectingSequences(workspaceId: $workspaceId, status: $status) {
      ...ProspectingSequenceListFields
    }
  }
  ${PROSPECTING_SEQUENCE_LIST_FIELDS}
`;

export const GET_PROSPECTING_SEQUENCE = gql`
  query ProspectingSequence($workspaceId: ID!, $id: ID!) {
    prospectingSequence(workspaceId: $workspaceId, id: $id) {
      ...ProspectingSequenceFields
    }
  }
  ${PROSPECTING_SEQUENCE_FIELDS}
`;

export const PROSPECTING_AUDIENCE_COUNT_FIELDS = gql`
  fragment ProspectingAudienceCountFields on ProspectingAudienceCount {
    total
    sendable
    noEmail
    invalidEmail
    individuals
    blocked
    suppressed
    recentlyContacted
    duplicates
    excludedByList
    missingFirstName
  }
`;

// Décompte en direct des destinataires d'une audience (avant enregistrement)
export const GET_PROSPECTING_AUDIENCE_COUNT = gql`
  query ProspectingAudienceCount(
    $workspaceId: ID!
    $audience: EmailCampaignAudienceInput!
  ) {
    prospectingAudienceCount(workspaceId: $workspaceId, audience: $audience) {
      ...ProspectingAudienceCountFields
    }
  }
  ${PROSPECTING_AUDIENCE_COUNT_FIELDS}
`;

export const GET_PROSPECTING_VERIFICATION = gql`
  query ProspectingVerification($workspaceId: ID!, $id: ID!) {
    prospectingVerification(workspaceId: $workspaceId, id: $id) {
      canSend
      checks {
        id
        category
        level
        title
        detail
      }
      audience {
        ...ProspectingAudienceCountFields
      }
      estimatedDays
      estimatedEndDate
    }
  }
  ${PROSPECTING_AUDIENCE_COUNT_FIELDS}
`;

// subject / body facultatifs : aperçu du brouillon en cours d'édition, sans
// l'enregistrer ; clientId : un vrai prospect (sinon valeurs d'exemple)
export const GET_PROSPECTING_PREVIEW = gql`
  query ProspectingPreview(
    $workspaceId: ID!
    $id: ID!
    $subject: String
    $body: String
    $clientId: ID
  ) {
    prospectingPreview(
      workspaceId: $workspaceId
      id: $id
      subject: $subject
      body: $body
      clientId: $clientId
    ) {
      subject
      html
      text
    }
  }
`;

export const GET_PROSPECTING_RECIPIENTS = gql`
  query ProspectingRecipients(
    $workspaceId: ID!
    $id: ID!
    $status: ProspectingRecipientStatus
    $search: String
    $offset: Int
    $limit: Int
  ) {
    prospectingRecipients(
      workspaceId: $workspaceId
      id: $id
      status: $status
      search: $search
      offset: $offset
      limit: $limit
    ) {
      items {
        ...ProspectingRecipientFields
      }
      total
    }
  }
  ${PROSPECTING_RECIPIENT_FIELDS}
`;

// Envois de prospection reçus par un contact (fiche contact)
export const GET_CLIENT_PROSPECTING_HISTORY = gql`
  query ClientProspectingHistory($workspaceId: ID!, $clientId: ID!) {
    clientProspectingHistory(workspaceId: $workspaceId, clientId: $clientId) {
      ...ProspectingRecipientFields
    }
  }
  ${PROSPECTING_RECIPIENT_FIELDS}
`;

// Signatures Newbi du membre dans l'espace actif (liste « Signature »)
export const GET_PROSPECTING_SIGNATURES = gql`
  query ProspectingSignatures {
    emailSignaturesV2 {
      id
      name
      isDefault
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────

export const UPDATE_PROSPECTING_MAILBOX = gql`
  mutation UpdateProspectingMailbox(
    $workspaceId: ID!
    $id: ID!
    $input: ProspectingMailboxInput!
  ) {
    updateProspectingMailbox(
      workspaceId: $workspaceId
      id: $id
      input: $input
    ) {
      ...ProspectingMailboxFields
    }
  }
  ${PROSPECTING_MAILBOX_FIELDS}
`;

// Révoque l'accès chez le fournisseur ; les prospections en cours de la
// boîte passent en pause
export const DISCONNECT_PROSPECTING_MAILBOX = gql`
  mutation DisconnectProspectingMailbox($workspaceId: ID!, $id: ID!) {
    disconnectProspectingMailbox(workspaceId: $workspaceId, id: $id)
  }
`;

// La boîte est celle du membre connecté (refus s'il n'en a pas)
export const CREATE_PROSPECTING_SEQUENCE = gql`
  mutation CreateProspectingSequence(
    $workspaceId: ID!
    $input: ProspectingSequenceInput!
  ) {
    createProspectingSequence(workspaceId: $workspaceId, input: $input) {
      ...ProspectingSequenceFields
    }
  }
  ${PROSPECTING_SEQUENCE_FIELDS}
`;

export const UPDATE_PROSPECTING_SEQUENCE = gql`
  mutation UpdateProspectingSequence(
    $workspaceId: ID!
    $id: ID!
    $input: ProspectingSequenceInput!
  ) {
    updateProspectingSequence(
      workspaceId: $workspaceId
      id: $id
      input: $input
    ) {
      ...ProspectingSequenceFields
    }
  }
  ${PROSPECTING_SEQUENCE_FIELDS}
`;

export const DELETE_PROSPECTING_SEQUENCE = gql`
  mutation DeleteProspectingSequence($workspaceId: ID!, $id: ID!) {
    deleteProspectingSequence(workspaceId: $workspaceId, id: $id)
  }
`;

// 1 à 5 adresses (défaut : l'adresse de la boîte), objet préfixé « [Test] »
// par l'API ; renvoie les adresses servies
export const SEND_PROSPECTING_TEST = gql`
  mutation SendProspectingTest(
    $workspaceId: ID!
    $id: ID!
    $emails: [String!]
  ) {
    sendProspectingTest(workspaceId: $workspaceId, id: $id, emails: $emails)
  }
`;

// `consent` doit valoir true (case cochée), sinon refus de l'API
export const LAUNCH_PROSPECTING_SEQUENCE = gql`
  mutation LaunchProspectingSequence(
    $workspaceId: ID!
    $id: ID!
    $consent: Boolean!
  ) {
    launchProspectingSequence(
      workspaceId: $workspaceId
      id: $id
      consent: $consent
    ) {
      ...ProspectingSequenceFields
    }
  }
  ${PROSPECTING_SEQUENCE_FIELDS}
`;

export const PAUSE_PROSPECTING_SEQUENCE = gql`
  mutation PauseProspectingSequence($workspaceId: ID!, $id: ID!) {
    pauseProspectingSequence(workspaceId: $workspaceId, id: $id) {
      ...ProspectingSequenceFields
    }
  }
  ${PROSPECTING_SEQUENCE_FIELDS}
`;

export const RESUME_PROSPECTING_SEQUENCE = gql`
  mutation ResumeProspectingSequence($workspaceId: ID!, $id: ID!) {
    resumeProspectingSequence(workspaceId: $workspaceId, id: $id) {
      ...ProspectingSequenceFields
    }
  }
  ${PROSPECTING_SEQUENCE_FIELDS}
`;

export const CANCEL_PROSPECTING_SEQUENCE = gql`
  mutation CancelProspectingSequence($workspaceId: ID!, $id: ID!) {
    cancelProspectingSequence(workspaceId: $workspaceId, id: $id) {
      ...ProspectingSequenceFields
    }
  }
  ${PROSPECTING_SEQUENCE_FIELDS}
`;

// REPLIED : « A répondu » ; DO_NOT_CONTACT : l'adresse rejoint les
// désinscrits de l'espace (commune aux campagnes)
export const MARK_PROSPECTING_RECIPIENT = gql`
  mutation MarkProspectingRecipient(
    $workspaceId: ID!
    $id: ID!
    $action: ProspectingRecipientAction!
  ) {
    markProspectingRecipient(
      workspaceId: $workspaceId
      id: $id
      action: $action
    ) {
      ...ProspectingRecipientFields
    }
  }
  ${PROSPECTING_RECIPIENT_FIELDS}
`;
