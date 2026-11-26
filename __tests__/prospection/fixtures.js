// Données factices de la Prospection (forme du contrat GraphQL, __typename
// compris : les fragments en ont besoin dans le cache Apollo).

export const WORKSPACE_ID = "ws-1";

export function mailbox(overrides = {}) {
  return {
    __typename: "ProspectingMailbox",
    id: "mb-1",
    provider: "GOOGLE",
    accountEmail: "dylan@atelier-martin.fr",
    accountName: "Dylan Martin",
    isPersonalAddress: false,
    status: "ACTIVE",
    pausedReason: null,
    dailyLimit: 30,
    effectiveDailyLimit: 10,
    sentToday: 3,
    sendWindow: {
      __typename: "ProspectingSendWindow",
      days: [1, 2, 3, 4, 5],
      startHour: 9,
      endHour: 18,
    },
    signatureId: null,
    connectedAt: "2026-11-24T10:00:00.000Z",
    isMine: true,
    ownerName: "Dylan Martin",
    ...overrides,
  };
}

export const VARIABLES = [
  ["prenom", "Prénom", "Marie"],
  ["nom", "Nom", "Durand"],
  ["nom_complet", "Nom complet", "Marie Durand"],
  ["entreprise", "Entreprise", "Atelier Durand"],
  ["email", "Adresse e-mail", "marie.durand@exemple.fr"],
  ["ville", "Ville", "Lyon"],
  ["activite", "Activité", "Menuiserie"],
  ["site", "Site web", "www.atelier-durand.fr"],
].map(([key, label, example]) => ({
  __typename: "EmailCampaignVariable",
  key,
  label,
  example,
}));

export function settings(overrides = {}) {
  return {
    __typename: "ProspectingSettings",
    providers: {
      __typename: "ProspectingProviders",
      google: true,
      microsoft: false,
    },
    myMailbox: mailbox(),
    mailboxes: [mailbox()],
    variables: VARIABLES,
    defaultDailyLimit: 30,
    maxDailyLimit: 50,
    dataPageUrl: "https://api.newbi.fr/api/prospection/donnees/jeton",
    sendMode: "LIVE",
    ...overrides,
  };
}

export function stats(overrides = {}) {
  return {
    __typename: "ProspectingStats",
    recipients: 0,
    pending: 0,
    sent: 0,
    simulated: 0,
    replied: 0,
    bounced: 0,
    unsubscribed: 0,
    failed: 0,
    skipped: 0,
    ...overrides,
  };
}

const BASE_DATES = {
  estimatedEndDate: "2026-12-05",
  startedAt: "2026-11-20T08:00:00.000Z",
  completedAt: null,
  createdAt: "2026-11-19T08:00:00.000Z",
  updatedAt: "2026-11-20T08:00:00.000Z",
};

/** Ligne de la liste (PROSPECTING_SEQUENCE_LIST_FIELDS). */
export function listSequence(overrides = {}) {
  return {
    __typename: "ProspectingSequence",
    id: "seq-1",
    name: "Menuisiers Lyon",
    status: "ACTIVE",
    pauseKind: null,
    pausedReason: null,
    subject: "Une question sur vos chantiers, {{prenom}}",
    mailbox: {
      __typename: "ProspectingMailbox",
      id: "mb-1",
      accountEmail: "dylan@atelier-martin.fr",
      isMine: true,
      ownerName: "Dylan Martin",
    },
    stats: stats({ recipients: 40, pending: 28, sent: 12, replied: 2 }),
    ...BASE_DATES,
    createdByName: "Dylan Martin",
    canSend: true,
    ...overrides,
  };
}

/** Prospection complète (PROSPECTING_SEQUENCE_FIELDS). */
export function fullSequence(overrides = {}) {
  return {
    __typename: "ProspectingSequence",
    id: "seq-1",
    name: "Menuisiers Lyon",
    status: "DRAFT",
    pauseKind: null,
    pausedReason: null,
    mailbox: mailbox(),
    audience: {
      __typename: "EmailCampaignAudience",
      mode: "LISTS",
      listIds: ["liste-1"],
      excludeListIds: [],
    },
    subject: "Une question sur vos chantiers, {{prenom}}",
    body: "<p>Bonjour {{prenom}},</p><p>Je fabrique des escaliers sur mesure.</p>",
    signatureId: null,
    stats: stats(),
    ...BASE_DATES,
    consentAt: null,
    createdByName: "Dylan Martin",
    canSend: true,
    ...overrides,
  };
}

export function audienceCount(overrides = {}) {
  return {
    __typename: "ProspectingAudienceCount",
    total: 45,
    sendable: 40,
    noEmail: 2,
    invalidEmail: 0,
    individuals: 1,
    blocked: 0,
    suppressed: 0,
    recentlyContacted: 2,
    duplicates: 0,
    excludedByList: 0,
    missingFirstName: 30,
    ...overrides,
  };
}

export function verification(overrides = {}) {
  return {
    __typename: "ProspectingVerification",
    canSend: true,
    checks: [
      {
        __typename: "EmailCampaignCheck",
        id: "mailbox_personal",
        category: "mailbox",
        level: "INFO",
        title: "Adresse professionnelle conseillée",
        detail: null,
      },
    ],
    audience: audienceCount(),
    estimatedDays: 4,
    estimatedEndDate: "2026-12-05",
    ...overrides,
  };
}

export function recipient(overrides = {}) {
  return {
    __typename: "ProspectingRecipient",
    id: "r-1",
    sequenceId: "seq-1",
    sequenceName: "Menuisiers Lyon",
    clientId: "c-1",
    email: "contact@menuiserie-durand.fr",
    name: "Marie Durand",
    company: "Menuiserie Durand",
    status: "SENT",
    sentAt: "2026-11-20T09:12:00.000Z",
    repliedAt: null,
    bouncedAt: null,
    unsubscribedAt: null,
    error: null,
    ...overrides,
  };
}
