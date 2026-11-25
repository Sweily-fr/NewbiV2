import { gql } from "@apollo/client";

// Campagnes e-mail (Communication) : envoi en masse d'un e-mail personnalisé
// aux contacts du CRM (newbi-api, src/schemas/emailCampaign.graphql). Le
// contenu (`design`) est un JSON partagé avec l'API, décrit dans
// src/utils/email-campaign-design.js.

export const EMAIL_CAMPAIGN_STATS_FIELDS = gql`
  fragment EmailCampaignStatsFields on EmailCampaignStats {
    recipients
    sent
    simulated
    delivered
    opened
    clicked
    opens
    clicks
    bounced
    complained
    unsubscribed
    failed
  }
`;

// Ligne de la liste : jamais le contenu (`design`), lourd et inutile ici
export const EMAIL_CAMPAIGN_LIST_FIELDS = gql`
  fragment EmailCampaignListFields on EmailCampaign {
    id
    name
    status
    subject
    scheduledAt
    startedAt
    completedAt
    pausedReason
    createdByName
    createdAt
    updatedAt
    trackOpens
    trackClicks
    trackedRecipients
    stats {
      ...EmailCampaignStatsFields
    }
  }
  ${EMAIL_CAMPAIGN_STATS_FIELDS}
`;

// trackedRecipients : destinataires suivis au lancement (ceux qui avaient
// accepté le suivi) ; null = campagne lancée avant les accords par contact,
// tous suivis
export const EMAIL_CAMPAIGN_FIELDS = gql`
  fragment EmailCampaignFields on EmailCampaign {
    id
    workspaceId
    name
    status
    subject
    preheader
    fromName
    replyTo
    senderEmail
    design
    audience {
      mode
      listIds
      excludeListIds
    }
    trackOpens
    trackClicks
    privacyPolicyUrl
    trackingPurgedAt
    trackedRecipients
    scheduledAt
    startedAt
    completedAt
    pausedReason
    createdByName
    createdAt
    updatedAt
    stats {
      ...EmailCampaignStatsFields
    }
  }
  ${EMAIL_CAMPAIGN_STATS_FIELDS}
`;

export const GET_EMAIL_CAMPAIGNS = gql`
  query EmailCampaigns(
    $workspaceId: ID!
    $status: EmailCampaignStatus
    $search: String
    $page: Int
    $limit: Int
  ) {
    emailCampaigns(
      workspaceId: $workspaceId
      status: $status
      search: $search
      page: $page
      limit: $limit
    ) {
      items {
        ...EmailCampaignListFields
      }
      total
      page
      limit
    }
  }
  ${EMAIL_CAMPAIGN_LIST_FIELDS}
`;

export const GET_EMAIL_CAMPAIGN = gql`
  query EmailCampaign($workspaceId: ID!, $id: ID!) {
    emailCampaign(workspaceId: $workspaceId, id: $id) {
      ...EmailCampaignFields
    }
  }
  ${EMAIL_CAMPAIGN_FIELDS}
`;

// Domaine de l'entreprise connecté pour l'envoi (« Envoyer depuis votre
// adresse ») : lignes DNS à ajouter chez son hébergeur et état de la
// validation. Seul VERIFIED (`active`) fait partir les campagnes de
// `fromEmail` ; sinon elles partent de l'adresse Newbi.
export const EMAIL_SENDING_DOMAIN_FIELDS = gql`
  fragment EmailSendingDomainFields on EmailSendingDomain {
    id
    domain
    fromEmail
    status
    active
    records {
      kind
      type
      name
      fqdn
      value
      priority
      status
    }
    zone
    dnsProvider
    lastCheckedAt
    verifiedAt
    expiresAt
    createdAt
  }
`;

// Adresse d'envoi, réglages par défaut, quota du mois et variables.
// senderEmail = adresse réellement utilisée aujourd'hui (domaine validé,
// sinon newbiSenderEmail)
export const GET_EMAIL_CAMPAIGN_SETTINGS = gql`
  query EmailCampaignSettings($workspaceId: ID!) {
    emailCampaignSettings(workspaceId: $workspaceId) {
      senderEmail
      newbiSenderEmail
      sendingDomain {
        ...EmailSendingDomainFields
      }
      canManageSendingDomain
      defaultFromName
      defaultReplyTo
      companyAddress
      sendMode
      quota {
        plan
        monthlyLimit
        usedThisMonth
        remaining
      }
      variables {
        key
        label
        example
      }
    }
  }
  ${EMAIL_SENDING_DOMAIN_FIELDS}
`;

// null si aucun domaine n'est connecté
export const GET_EMAIL_SENDING_DOMAIN = gql`
  query EmailSendingDomain($workspaceId: ID!) {
    emailSendingDomain(workspaceId: $workspaceId) {
      ...EmailSendingDomainFields
    }
  }
  ${EMAIL_SENDING_DOMAIN_FIELDS}
`;

export const GET_EMAIL_CAMPAIGN_TEMPLATES = gql`
  query EmailCampaignTemplates($workspaceId: ID!) {
    emailCampaignTemplates(workspaceId: $workspaceId) {
      key
      name
      description
      design
    }
  }
`;

// Décompte en direct des destinataires d'une audience (avant enregistrement).
// trackingGranted : destinataires envoyables qui ont accepté le suivi
export const GET_EMAIL_CAMPAIGN_AUDIENCE_COUNT = gql`
  query EmailCampaignAudienceCount(
    $workspaceId: ID!
    $audience: EmailCampaignAudienceInput!
  ) {
    emailCampaignAudienceCount(workspaceId: $workspaceId, audience: $audience) {
      total
      sendable
      noEmail
      invalidEmail
      blocked
      suppressed
      duplicates
      excludedByList
      missingFirstName
      trackingGranted
    }
  }
`;

// HTML rendu par l'API. design / subject / preheader facultatifs : aperçu
// du brouillon en cours d'édition, sans l'enregistrer ; clientId :
// personnalisation pour ce contact (sinon valeurs d'exemple)
export const GET_EMAIL_CAMPAIGN_PREVIEW = gql`
  query EmailCampaignPreview(
    $workspaceId: ID!
    $id: ID!
    $design: JSON
    $subject: String
    $preheader: String
    $clientId: ID
  ) {
    emailCampaignPreview(
      workspaceId: $workspaceId
      id: $id
      design: $design
      subject: $subject
      preheader: $preheader
      clientId: $clientId
    ) {
      subject
      preheader
      html
      text
    }
  }
`;

export const GET_EMAIL_CAMPAIGN_DELIVERABILITY = gql`
  query EmailCampaignDeliverability($workspaceId: ID!, $id: ID!) {
    emailCampaignDeliverability(workspaceId: $workspaceId, id: $id) {
      score
      canSend
      checks {
        id
        category
        level
        title
        detail
      }
    }
  }
`;

// tracked : ouvertures et clics suivis pour ce destinataire (accord donné)
export const GET_EMAIL_CAMPAIGN_RECIPIENTS = gql`
  query EmailCampaignRecipients(
    $workspaceId: ID!
    $campaignId: ID!
    $filter: EmailCampaignRecipientFilter
    $search: String
    $page: Int
    $limit: Int
  ) {
    emailCampaignRecipients(
      workspaceId: $workspaceId
      campaignId: $campaignId
      filter: $filter
      search: $search
      page: $page
      limit: $limit
    ) {
      items {
        id
        email
        name
        clientId
        status
        sentAt
        deliveredAt
        openedAt
        clickedAt
        bouncedAt
        complainedAt
        unsubscribedAt
        openCount
        clickCount
        tracked
        error
      }
      total
      page
      limit
    }
  }
`;

export const GET_EMAIL_CAMPAIGN_LINK_STATS = gql`
  query EmailCampaignLinkStats($workspaceId: ID!, $campaignId: ID!) {
    emailCampaignLinkStats(workspaceId: $workspaceId, campaignId: $campaignId) {
      url
      clicks
      uniqueClicks
    }
  }
`;

export const GET_EMAIL_SUPPRESSIONS = gql`
  query EmailSuppressions(
    $workspaceId: ID!
    $search: String
    $page: Int
    $limit: Int
  ) {
    emailSuppressions(
      workspaceId: $workspaceId
      search: $search
      page: $page
      limit: $limit
    ) {
      items {
        id
        email
        reason
        createdAt
        campaignId
      }
      total
      page
      limit
    }
  }
`;

// Accords de suivi (ouvertures et clics) par adresse et par espace :
// GRANTED / REFUSED, aucun document = aucun choix (pas de suivi). Source
// CONTACT : choix du destinataire sur sa page de préférences, définitif
// pour l'espace ; SENDER : saisi par un membre de l'espace
export const EMAIL_TRACKING_CONSENT_FIELDS = gql`
  fragment EmailTrackingConsentFields on EmailTrackingConsent {
    id
    email
    status
    source
    note
    decidedAt
    decidedByName
  }
`;

export const GET_EMAIL_TRACKING_CONSENTS = gql`
  query EmailTrackingConsents(
    $workspaceId: ID!
    $status: EmailTrackingConsentStatus
    $search: String
    $page: Int
    $limit: Int
  ) {
    emailTrackingConsents(
      workspaceId: $workspaceId
      status: $status
      search: $search
      page: $page
      limit: $limit
    ) {
      items {
        ...EmailTrackingConsentFields
      }
      total
      page
      limit
    }
  }
  ${EMAIL_TRACKING_CONSENT_FIELDS}
`;

// Contacts proposés pour personnaliser l'aperçu ou l'e-mail de test
export const GET_EMAIL_CAMPAIGN_CONTACTS = gql`
  query EmailCampaignContacts(
    $workspaceId: String!
    $search: String
    $limit: Int
  ) {
    clients(
      workspaceId: $workspaceId
      page: 1
      limit: $limit
      search: $search
    ) {
      items {
        id
        name
        email
        type
        firstName
        lastName
      }
      totalItems
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────

export const CREATE_EMAIL_CAMPAIGN = gql`
  mutation CreateEmailCampaign(
    $workspaceId: ID!
    $input: CreateEmailCampaignInput!
  ) {
    createEmailCampaign(workspaceId: $workspaceId, input: $input) {
      ...EmailCampaignFields
    }
  }
  ${EMAIL_CAMPAIGN_FIELDS}
`;

// Brouillon seulement (refus de l'API sinon)
export const UPDATE_EMAIL_CAMPAIGN = gql`
  mutation UpdateEmailCampaign(
    $workspaceId: ID!
    $id: ID!
    $input: UpdateEmailCampaignInput!
  ) {
    updateEmailCampaign(workspaceId: $workspaceId, id: $id, input: $input) {
      ...EmailCampaignFields
    }
  }
  ${EMAIL_CAMPAIGN_FIELDS}
`;

export const DUPLICATE_EMAIL_CAMPAIGN = gql`
  mutation DuplicateEmailCampaign($workspaceId: ID!, $id: ID!) {
    duplicateEmailCampaign(workspaceId: $workspaceId, id: $id) {
      ...EmailCampaignFields
    }
  }
  ${EMAIL_CAMPAIGN_FIELDS}
`;

export const DELETE_EMAIL_CAMPAIGN = gql`
  mutation DeleteEmailCampaign($workspaceId: ID!, $id: ID!) {
    deleteEmailCampaign(workspaceId: $workspaceId, id: $id)
  }
`;

// 1 à 5 adresses ; objet préfixé « [Test] » par l'API
export const SEND_EMAIL_CAMPAIGN_TEST = gql`
  mutation SendEmailCampaignTest(
    $workspaceId: ID!
    $id: ID!
    $emails: [String!]!
    $clientId: ID
  ) {
    sendEmailCampaignTest(
      workspaceId: $workspaceId
      id: $id
      emails: $emails
      clientId: $clientId
    ) {
      success
      sentTo
      simulated
    }
  }
`;

// Sans date : envoi immédiat. `consent` doit valoir true (case cochée). Le
// suivi ne s'applique qu'aux destinataires qui l'ont accepté (accords de
// suivi) : plus d'attestation globale à l'envoi
export const SEND_EMAIL_CAMPAIGN = gql`
  mutation SendEmailCampaign(
    $workspaceId: ID!
    $id: ID!
    $scheduledAt: DateTime
    $consent: Boolean!
  ) {
    sendEmailCampaign(
      workspaceId: $workspaceId
      id: $id
      scheduledAt: $scheduledAt
      consent: $consent
    ) {
      ...EmailCampaignFields
    }
  }
  ${EMAIL_CAMPAIGN_FIELDS}
`;

export const UNSCHEDULE_EMAIL_CAMPAIGN = gql`
  mutation UnscheduleEmailCampaign($workspaceId: ID!, $id: ID!) {
    unscheduleEmailCampaign(workspaceId: $workspaceId, id: $id) {
      ...EmailCampaignFields
    }
  }
  ${EMAIL_CAMPAIGN_FIELDS}
`;

export const PAUSE_EMAIL_CAMPAIGN = gql`
  mutation PauseEmailCampaign($workspaceId: ID!, $id: ID!) {
    pauseEmailCampaign(workspaceId: $workspaceId, id: $id) {
      ...EmailCampaignFields
    }
  }
  ${EMAIL_CAMPAIGN_FIELDS}
`;

export const RESUME_EMAIL_CAMPAIGN = gql`
  mutation ResumeEmailCampaign($workspaceId: ID!, $id: ID!) {
    resumeEmailCampaign(workspaceId: $workspaceId, id: $id) {
      ...EmailCampaignFields
    }
  }
  ${EMAIL_CAMPAIGN_FIELDS}
`;

export const CANCEL_EMAIL_CAMPAIGN = gql`
  mutation CancelEmailCampaign($workspaceId: ID!, $id: ID!) {
    cancelEmailCampaign(workspaceId: $workspaceId, id: $id) {
      ...EmailCampaignFields
    }
  }
  ${EMAIL_CAMPAIGN_FIELDS}
`;

export const UPLOAD_EMAIL_CAMPAIGN_IMAGE = gql`
  mutation UploadEmailCampaignImage($workspaceId: ID!, $file: Upload!) {
    uploadEmailCampaignImage(workspaceId: $workspaceId, file: $file) {
      url
      key
    }
  }
`;

export const ADD_EMAIL_SUPPRESSION = gql`
  mutation AddEmailSuppression($workspaceId: ID!, $email: String!) {
    addEmailSuppression(workspaceId: $workspaceId, email: $email) {
      id
      email
      reason
      createdAt
      campaignId
    }
  }
`;

// Ajouts manuels seulement
export const REMOVE_EMAIL_SUPPRESSION = gql`
  mutation RemoveEmailSuppression($workspaceId: ID!, $id: ID!) {
    removeEmailSuppression(workspaceId: $workspaceId, id: $id)
  }
`;

// ── Accords de suivi (droit emailCampaigns.edit) ─────────────────────────

// Accords saisis par l'espace : 500 adresses au plus, `attestation` à true
// (case cochée), note facultative (comment l'accord a été recueilli).
// Adresses écartées : INVALID, CONTACT_REFUSED (refus du contact, que lui
// seul peut changer)
export const GRANT_EMAIL_TRACKING = gql`
  mutation GrantEmailTracking(
    $workspaceId: ID!
    $emails: [String!]!
    $note: String
    $attestation: Boolean!
  ) {
    grantEmailTracking(
      workspaceId: $workspaceId
      emails: $emails
      note: $note
      attestation: $attestation
    ) {
      granted
      skipped {
        email
        reason
      }
    }
  }
`;

// Refus noté par l'espace : ouvertures et clics déjà enregistrés pour cette
// adresse effacés dans tout l'espace, plus rien n'est suivi ensuite
export const REFUSE_EMAIL_TRACKING = gql`
  mutation RefuseEmailTracking($workspaceId: ID!, $email: String!) {
    refuseEmailTracking(workspaceId: $workspaceId, email: $email) {
      ...EmailTrackingConsentFields
    }
  }
  ${EMAIL_TRACKING_CONSENT_FIELDS}
`;

// Source SENDER seulement. Accord retiré : même effacement qu'un refus
export const REMOVE_EMAIL_TRACKING_CONSENT = gql`
  mutation RemoveEmailTrackingConsent($workspaceId: ID!, $id: ID!) {
    removeEmailTrackingConsent(workspaceId: $workspaceId, id: $id)
  }
`;

// ── Domaine d'envoi (droit emailCampaigns.send) ──────────────────────────

// Déclare le domaine de `fromEmail` et renvoie les lignes DNS à ajouter.
// Refus : INVALID_SENDER_EMAIL, FREE_EMAIL_PROVIDER, RESERVED_DOMAIN,
// DOMAIN_ALREADY_CONNECTED, SENDING_DOMAIN_EXISTS, SENDING_DOMAIN_UNAVAILABLE
export const CONNECT_EMAIL_SENDING_DOMAIN = gql`
  mutation ConnectEmailSendingDomain($workspaceId: ID!, $fromEmail: String!) {
    connectEmailSendingDomain(
      workspaceId: $workspaceId
      fromEmail: $fromEmail
    ) {
      ...EmailSendingDomainFields
    }
  }
  ${EMAIL_SENDING_DOMAIN_FIELDS}
`;

// Relit les lignes chez Resend (au plus une fois toutes les 20 s : sinon
// l'API renvoie l'état connu)
export const VERIFY_EMAIL_SENDING_DOMAIN = gql`
  mutation VerifyEmailSendingDomain($workspaceId: ID!) {
    verifyEmailSendingDomain(workspaceId: $workspaceId) {
      ...EmailSendingDomainFields
    }
  }
  ${EMAIL_SENDING_DOMAIN_FIELDS}
`;

// Autre adresse sur le même domaine seulement
export const UPDATE_EMAIL_SENDING_DOMAIN_SENDER = gql`
  mutation UpdateEmailSendingDomainSender(
    $workspaceId: ID!
    $fromEmail: String!
  ) {
    updateEmailSendingDomainSender(
      workspaceId: $workspaceId
      fromEmail: $fromEmail
    ) {
      ...EmailSendingDomainFields
    }
  }
  ${EMAIL_SENDING_DOMAIN_FIELDS}
`;

// Refus SENDING_DOMAIN_IN_USE si une campagne en cours d'envoi ou
// programmée part de ce domaine
export const DISCONNECT_EMAIL_SENDING_DOMAIN = gql`
  mutation DisconnectEmailSendingDomain($workspaceId: ID!) {
    disconnectEmailSendingDomain(workspaceId: $workspaceId)
  }
`;
