import { gql } from "@apollo/client";

const PROSPECT_QUOTA_FIELDS = gql`
  fragment ProspectQuotaFields on ProspectQuota {
    plan
    bucket
    quota
    used
    remaining
    available
    resetsAt
  }
`;

export const GET_PROSPECT_SETTINGS = gql`
  ${PROSPECT_QUOTA_FIELDS}
  query GetProspectSettings($workspaceId: String!) {
    prospectSettings(workspaceId: $workspaceId) {
      enabled
      maxPerUnlock
      trades {
        id
        label
        nafCodes
      }
      quota {
        ...ProspectQuotaFields
      }
    }
  }
`;

// Les 732 activités NAF : chargées à l'ouverture de la fenêtre, gardées en cache
export const GET_PROSPECT_ACTIVITIES = gql`
  query GetProspectActivities($workspaceId: String!) {
    prospectActivities(workspaceId: $workspaceId) {
      code
      label
    }
  }
`;

export const GET_PROSPECT_PLACES = gql`
  query GetProspectPlaces($workspaceId: String!, $query: String!) {
    prospectPlaces(workspaceId: $workspaceId, query: $query) {
      id
      label
      type
    }
  }
`;

// Mutation côté API : chaque page de résultats coûte un crédit, elle ne doit
// jamais être relancée par le cache
export const SEARCH_PROSPECTS = gql`
  ${PROSPECT_QUOTA_FIELDS}
  mutation SearchProspects(
    $workspaceId: String!
    $input: ProspectSearchInput!
  ) {
    searchProspects(workspaceId: $workspaceId, input: $input) {
      total
      page
      totalPages
      pageSize
      results {
        siren
        name
        activity
        postalCode
        city
        alreadyInClients
        clientId
      }
      quota {
        ...ProspectQuotaFields
      }
    }
  }
`;

export const UNLOCK_PROSPECTS = gql`
  ${PROSPECT_QUOTA_FIELDS}
  mutation UnlockProspects(
    $workspaceId: String!
    $sirens: [String!]!
    $listId: ID
    $newListName: String
  ) {
    unlockProspects(
      workspaceId: $workspaceId
      sirens: $sirens
      listId: $listId
      newListName: $newListName
    ) {
      unlockedCount
      listId
      providerError
      skipped {
        siren
        reason
      }
      quota {
        ...ProspectQuotaFields
      }
    }
  }
`;

export const GENERATE_PROSPECTS = gql`
  ${PROSPECT_QUOTA_FIELDS}
  mutation GenerateProspects(
    $workspaceId: String!
    $input: ProspectSearchInput!
    $count: Int!
    $listId: ID
    $newListName: String
  ) {
    generateProspects(
      workspaceId: $workspaceId
      input: $input
      count: $count
      listId: $listId
      newListName: $newListName
    ) {
      requested
      matching
      opposedCount
      closedCount
      outOfRadiusCount
      radiusKm
      unlockedCount
      listId
      providerError
      skipped {
        siren
        reason
      }
      quota {
        ...ProspectQuotaFields
      }
    }
  }
`;
