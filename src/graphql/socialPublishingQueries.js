import { gql } from "@apollo/client";
import { CREATED_TASK_FRAGMENT } from "./kanbanQueries";

// Publication de posts sur les réseaux sociaux depuis le kanban (contrat du
// schéma socialPublishing.graphql de l'API). Plateformes : "instagram",
// "facebook", "linkedin", "twitter", "tiktok". Dates : chaînes ISO UTC.

// Média d'un post : images (toujours « ready ») ou une vidéo, envoyée en
// morceaux puis préparée par le serveur (uploading → processing → ready ou
// failed). url est vide tant que la vidéo n'est pas prête.
export const SOCIAL_POST_MEDIA_FRAGMENT = gql`
  fragment SocialPostMediaFields on SocialPostMedia {
    id
    kind
    status
    errorMessage
    url
    thumbnailUrl
    width
    height
    durationMs
    size
    contentType
  }
`;

// connector : null (connexion habituelle du réseau), "facebook" (Instagram
// connecté via Facebook) ou "business" (TikTok Business). capabilities : ce
// que le compte permet (stories, son tendance, brouillon TikTok).
export const SOCIAL_ACCOUNT_FRAGMENT = gql`
  fragment SocialAccountFields on SocialAccount {
    id
    platform
    username
    displayName
    avatarUrl
    status
    connectedAt
    connector
    capabilities {
      stories
      sounds
      drafts
      draftsNeedReconnect
    }
  }
`;

// Son choisi pour un réseau du post (volumes de 0 à 100)
export const SOCIAL_POST_SOUND_FRAGMENT = gql`
  fragment SocialPostSoundFields on SocialPostSound {
    id
    title
    artist
    coverUrl
    volume
    videoVolume
  }
`;

export const SOCIAL_POST_FRAGMENT = gql`
  fragment SocialPostFields on SocialPost {
    id
    boardId
    taskId
    content
    media {
      ...SocialPostMediaFields
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
      deliveredAs
      storyCount
    }
    scheduledFor
    timezone
    status
    tiktokSettings {
      privacyLevel
      allowComment
      allowDuet
      allowStitch
      brandOrganic
      brandContent
      mode
      sound {
        ...SocialPostSoundFields
      }
    }
    instagramSettings {
      format
      sound {
        ...SocialPostSoundFields
      }
    }
    facebookSettings {
      format
    }
    createdBy
    createdAt
    updatedAt
  }
  ${SOCIAL_POST_MEDIA_FRAGMENT}
  ${SOCIAL_POST_SOUND_FRAGMENT}
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
      connectors {
        key
        platform
        label
        description
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
      duetDisabled
      stitchDisabled
      maxVideoPostDurationSec
      privacyLevels {
        value
        label
      }
    }
  }
`;

// Sons proposés pour un compte (Instagram via Facebook ou TikTok Business) :
// tendances sans `search`, recherche par mot (Instagram seulement). kind
// (Instagram) : "music" (défaut) ou "original_sound". previewUrl : extrait
// temporaire chez le réseau, jamais gardé.
export const GET_SOCIAL_TRENDING_SOUNDS = gql`
  query GetSocialTrendingSounds(
    $accountId: ID!
    $search: String
    $kind: String
    $workspaceId: ID
  ) {
    socialTrendingSounds(
      accountId: $accountId
      search: $search
      kind: $kind
      workspaceId: $workspaceId
    ) {
      id
      title
      artist
      coverUrl
      previewUrl
      durationMs
      rank
      kind
    }
  }
`;

// connector : clé d'un SocialConnector (« instagram_facebook »,
// « tiktok_business »…), défaut : connexion habituelle du réseau
export const CONNECT_SOCIAL_ACCOUNT = gql`
  mutation ConnectSocialAccount(
    $platform: String!
    $connector: String
    $returnTo: String
    $workspaceId: ID
  ) {
    connectSocialAccount(
      platform: $platform
      connector: $connector
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
      ...SocialPostMediaFields
    }
  }
  ${SOCIAL_POST_MEDIA_FRAGMENT}
`;

// Vidéo : envoi en morceaux (chunkSize octets chacun, le dernier peut être
// plus petit, index à partir de 0), puis préparation suivie par
// socialPostMedia jusqu'à « ready » ou « failed ».
export const START_SOCIAL_VIDEO_UPLOAD = gql`
  mutation StartSocialVideoUpload(
    $fileName: String!
    $size: Int!
    $contentType: String!
    $workspaceId: ID
  ) {
    startSocialVideoUpload(
      fileName: $fileName
      size: $size
      contentType: $contentType
      workspaceId: $workspaceId
    ) {
      media {
        ...SocialPostMediaFields
      }
      chunkSize
      chunkCount
    }
  }
  ${SOCIAL_POST_MEDIA_FRAGMENT}
`;

export const UPLOAD_SOCIAL_VIDEO_CHUNK = gql`
  mutation UploadSocialVideoChunk(
    $mediaId: ID!
    $index: Int!
    $chunk: Upload!
    $workspaceId: ID
  ) {
    uploadSocialVideoChunk(
      mediaId: $mediaId
      index: $index
      chunk: $chunk
      workspaceId: $workspaceId
    )
  }
`;

export const COMPLETE_SOCIAL_VIDEO_UPLOAD = gql`
  mutation CompleteSocialVideoUpload($mediaId: ID!, $workspaceId: ID) {
    completeSocialVideoUpload(mediaId: $mediaId, workspaceId: $workspaceId) {
      ...SocialPostMediaFields
    }
  }
  ${SOCIAL_POST_MEDIA_FRAGMENT}
`;

export const GET_SOCIAL_POST_MEDIA = gql`
  query GetSocialPostMedia($id: ID!, $workspaceId: ID) {
    socialPostMedia(id: $id, workspaceId: $workspaceId) {
      ...SocialPostMediaFields
    }
  }
  ${SOCIAL_POST_MEDIA_FRAGMENT}
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
