import { gql } from "@apollo/client";
import { CREATED_TASK_FRAGMENT } from "./kanbanQueries";

// Publication de posts sur les réseaux sociaux depuis le kanban (contrat du
// schéma socialPublishing.graphql de l'API). Plateformes : "instagram",
// "facebook", "linkedin", "twitter", "tiktok". Dates : chaînes ISO UTC.

export const SOCIAL_ACCOUNT_FRAGMENT = gql`
  fragment SocialAccountFields on SocialAccount {
    id
    platform
    username
    displayName
    avatarUrl
    status
    connectedAt
  }
`;

export const SOCIAL_POST_FRAGMENT = gql`
  fragment SocialPostFields on SocialPost {
    id
    boardId
    taskId
    content
    media {
      id
      url
      width
      height
      contentType
    }
    targets {
      accountId
      platform
      username
      displayName
      status
      platformPostUrl
      errorMessage
      publishedAt
    }
    scheduledFor
    timezone
    status
    tiktokSettings {
      privacyLevel
      allowComment
      brandOrganic
      brandContent
    }
    createdBy
    createdAt
    updatedAt
  }
`;

export const GET_SOCIAL_PUBLISHING_STATUS = gql`
  query GetSocialPublishingStatus($workspaceId: ID) {
    socialPublishingStatus(workspaceId: $workspaceId) {
      enabled
      platforms
      canManageAccounts
      canSchedule
      accounts {
        ...SocialAccountFields
      }
      xPostQuota {
        plan
        monthlyQuota
        used
        remaining
        resetsAt
      }
    }
  }
  ${SOCIAL_ACCOUNT_FRAGMENT}
`;

export const GET_BOARD_SOCIAL_POSTS = gql`
  query GetBoardSocialPosts($boardId: ID!, $workspaceId: ID) {
    boardSocialPosts(boardId: $boardId, workspaceId: $workspaceId) {
      ...SocialPostFields
    }
  }
  ${SOCIAL_POST_FRAGMENT}
`;

export const GET_TIKTOK_CREATOR_INFO = gql`
  query GetTikTokCreatorInfo($accountId: ID!, $workspaceId: ID) {
    tiktokCreatorInfo(accountId: $accountId, workspaceId: $workspaceId) {
      username
      nickname
      canPostMore
      commentDisabled
      privacyLevels {
        value
        label
      }
    }
  }
`;

export const CONNECT_SOCIAL_ACCOUNT = gql`
  mutation ConnectSocialAccount(
    $platform: String!
    $returnTo: String
    $workspaceId: ID
  ) {
    connectSocialAccount(
      platform: $platform
      returnTo: $returnTo
      workspaceId: $workspaceId
    )
  }
`;

export const DISCONNECT_SOCIAL_ACCOUNT = gql`
  mutation DisconnectSocialAccount($accountId: ID!, $workspaceId: ID) {
    disconnectSocialAccount(accountId: $accountId, workspaceId: $workspaceId)
  }
`;

export const REFRESH_SOCIAL_ACCOUNTS = gql`
  mutation RefreshSocialAccounts($workspaceId: ID) {
    refreshSocialAccounts(workspaceId: $workspaceId) {
      ...SocialAccountFields
    }
  }
  ${SOCIAL_ACCOUNT_FRAGMENT}
`;

export const UPLOAD_SOCIAL_POST_MEDIA = gql`
  mutation UploadSocialPostMedia($file: Upload!, $workspaceId: ID) {
    uploadSocialPostMedia(file: $file, workspaceId: $workspaceId) {
      id
      url
      width
      height
      contentType
    }
  }
`;

// La carte créée reprend la sélection de CREATE_TASK (même fragment) : elle
// est ajoutée au cache GET_BOARD comme une tâche créée à la main.
export const SCHEDULE_SOCIAL_POST = gql`
  mutation ScheduleSocialPost(
    $input: ScheduleSocialPostInput!
    $workspaceId: ID
  ) {
    scheduleSocialPost(input: $input, workspaceId: $workspaceId) {
      post {
        ...SocialPostFields
      }
      task {
        ...CreatedTaskFields
      }
    }
  }
  ${SOCIAL_POST_FRAGMENT}
  ${CREATED_TASK_FRAGMENT}
`;

export const UPDATE_SOCIAL_POST = gql`
  mutation UpdateSocialPost(
    $id: ID!
    $input: UpdateSocialPostInput!
    $workspaceId: ID
  ) {
    updateSocialPost(id: $id, input: $input, workspaceId: $workspaceId) {
      ...SocialPostFields
    }
  }
  ${SOCIAL_POST_FRAGMENT}
`;

export const CANCEL_SOCIAL_POST = gql`
  mutation CancelSocialPost($id: ID!, $workspaceId: ID) {
    cancelSocialPost(id: $id, workspaceId: $workspaceId) {
      ...SocialPostFields
    }
  }
  ${SOCIAL_POST_FRAGMENT}
`;

export const RETRY_SOCIAL_POST = gql`
  mutation RetrySocialPost($id: ID!, $workspaceId: ID) {
    retrySocialPost(id: $id, workspaceId: $workspaceId) {
      ...SocialPostFields
    }
  }
  ${SOCIAL_POST_FRAGMENT}
`;
