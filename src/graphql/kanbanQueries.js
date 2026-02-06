import { gql } from '@apollo/client';

// GraphQL Queries
export const GET_TASK_TIMER = gql`
  query GetTaskTimer($id: ID!, $workspaceId: ID) {
    task(id: $id, workspaceId: $workspaceId) {
      id
      timeTracking {
        totalSeconds
        isRunning
        currentStartTime
        hourlyRate
        roundingOption
        entries {
          id
          startTime
          endTime
          duration
        }
      }
    }
  }
`;

export const GET_BOARDS = gql`
  query GetBoards($workspaceId: ID) {
    boards(workspaceId: $workspaceId) {
      id
      title
      description
      createdAt
      updatedAt
    }
  }
`;

export const GET_BOARD = gql`
  query GetBoard($id: ID!, $workspaceId: ID) {
    board(id: $id, workspaceId: $workspaceId) {
      id
      title
      description
      members {
        id
        userId
        name
        email
        image
      }
      columns {
        id
        title
        color
        order
      }
      tasks {
        id
        title
        description
        status
        priority
        startDate
        dueDate
        columnId
        position
        userId
        createdAt
        updatedAt
        tags {
          name
          className
          bg
          text
          border
        }
        checklist {
          id
          text
          completed
        }
        assignedMembers
        timeTracking {
          totalSeconds
          isRunning
          currentStartTime
          entries {
            id
            startTime
            endTime
            duration
          }
          hourlyRate
          roundingOption
        }
        images {
          id
          key
          url
          fileName
          fileSize
          contentType
          uploadedBy
          uploadedAt
        }
        comments {
          id
          userId
          userName
          userImage
          content
          images {
            id
            key
            url
            fileName
            fileSize
            contentType
            uploadedBy
            uploadedAt
          }
          createdAt
          updatedAt
        }
        activity {
          id
          userId
          userName
          userImage
          type
          field
          oldValue
          newValue
          description
          createdAt
        }
      }
    }
  }
`;

export const GET_ORGANIZATION_MEMBERS = gql`
  query GetOrganizationMembers($workspaceId: ID!) {
    organizationMembers(workspaceId: $workspaceId) {
      id
      name
      email
      image
      role
    }
  }
`;

export const GET_TASKS = gql`
  query GetTasks($boardId: ID!, $columnId: ID, $workspaceId: ID) {
    tasks(boardId: $boardId, columnId: $columnId, workspaceId: $workspaceId) {
      id
      title
      description
      status
      priority
      startDate
      dueDate
      position
      tags {
        name
        className
        bg
        text
        border
      }
    }
  }
`;

// GraphQL Mutations
export const CREATE_BOARD = gql`
  mutation CreateBoard($input: CreateBoardInput!, $workspaceId: ID) {
    createBoard(input: $input, workspaceId: $workspaceId) {
      id
      title
      description
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_BOARD = gql`
  mutation UpdateBoard($input: UpdateBoardInput!, $workspaceId: ID) {
    updateBoard(input: $input, workspaceId: $workspaceId) {
      id
      title
      description
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_BOARD = gql`
  mutation DeleteBoard($id: ID!, $workspaceId: ID) {
    deleteBoard(id: $id, workspaceId: $workspaceId)
  }
`;

export const CREATE_COLUMN = gql`
  mutation CreateColumn($input: CreateColumnInput!, $workspaceId: ID) {
    createColumn(input: $input, workspaceId: $workspaceId) {
      id
      title
      color
      order
      boardId
    }
  }
`;

export const UPDATE_COLUMN = gql`
  mutation UpdateColumn($input: UpdateColumnInput!, $workspaceId: ID) {
    updateColumn(input: $input, workspaceId: $workspaceId) {
      id
      title
      color
      order
    }
  }
`;

export const DELETE_COLUMN = gql`
  mutation DeleteColumn($id: ID!, $workspaceId: ID) {
    deleteColumn(id: $id, workspaceId: $workspaceId)
  }
`;

export const REORDER_COLUMNS = gql`
  mutation ReorderColumns($columns: [ID!]!, $workspaceId: ID) {
    reorderColumns(columns: $columns, workspaceId: $workspaceId)
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!, $workspaceId: ID) {
    createTask(input: $input, workspaceId: $workspaceId) {
      id
      title
      description
      status
      priority
      startDate
      dueDate
      columnId
      position
      tags {
        name
        className
        bg
        text
        border
      }
      checklist {
        id
        text
        completed
      }
      images {
        id
        key
        url
        fileName
        fileSize
        contentType
        uploadedBy
        uploadedAt
      }
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($input: UpdateTaskInput!, $workspaceId: ID) {
    updateTask(input: $input, workspaceId: $workspaceId) {
      id
      title
      description
      status
      priority
      startDate
      dueDate
      columnId
      position
      tags {
        name
        className
        bg
        text
        border
      }
      checklist {
        id
        text
        completed
      }
      images {
        id
        key
        url
        fileName
        fileSize
        contentType
        uploadedBy
        uploadedAt
      }
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!, $workspaceId: ID) {
    deleteTask(id: $id, workspaceId: $workspaceId)
  }
`;

export const MOVE_TASK = gql`
  mutation MoveTask($id: ID!, $columnId: String!, $position: Int!, $workspaceId: ID) {
    moveTask(id: $id, columnId: $columnId, position: $position, workspaceId: $workspaceId) {
      id
      columnId
      position
      updatedAt
    }
  }
`;

// Fragments pour les types communs (déplacés avant leur utilisation)
export const TASK_FRAGMENT = gql`
  fragment TaskFields on Task {
    id
    title
    description
    status
    priority
    startDate
    dueDate
    columnId
    position
    userId
    createdAt
    updatedAt
    tags {
      name
      className
      bg
      text
      border
    }
    checklist {
      id
      text
      completed
    }
    assignedMembers
    timeTracking {
      totalSeconds
      isRunning
      currentStartTime
      startedBy {
        userId
        userName
        userImage
      }
      entries {
        id
        startTime
        endTime
        duration
      }
      hourlyRate
      roundingOption
    }
    images {
      id
      key
      url
      fileName
      fileSize
      contentType
      uploadedBy
      uploadedAt
    }
    comments {
      id
      userId
      userName
      userImage
      content
      images {
        id
        key
        url
        fileName
        fileSize
        contentType
        uploadedBy
        uploadedAt
      }
      createdAt
      updatedAt
    }
    activity {
      id
      userId
      userName
      userImage
      type
      field
      oldValue
      newValue
      description
      createdAt
    }
  }
`;

export const ADD_COMMENT = gql`
  mutation AddComment($taskId: ID!, $input: CommentInput!, $workspaceId: ID) {
    addComment(taskId: $taskId, input: $input, workspaceId: $workspaceId) {
      ...TaskFields
    }
  }
  ${TASK_FRAGMENT}
`;

export const UPDATE_COMMENT = gql`
  mutation UpdateComment($taskId: ID!, $commentId: ID!, $content: String!, $workspaceId: ID) {
    updateComment(taskId: $taskId, commentId: $commentId, content: $content, workspaceId: $workspaceId) {
      ...TaskFields
    }
  }
  ${TASK_FRAGMENT}
`;

export const DELETE_COMMENT = gql`
  mutation DeleteComment($taskId: ID!, $commentId: ID!, $workspaceId: ID) {
    deleteComment(taskId: $taskId, commentId: $commentId, workspaceId: $workspaceId) {
      ...TaskFields
    }
  }
  ${TASK_FRAGMENT}
`;

export const COLUMN_FRAGMENT = gql`
  fragment ColumnFields on Column {
    id
    title
    color
    order
    boardId
  }
`;

export const BOARD_FRAGMENT = gql`
  fragment BoardFields on Board {
    id
    title
    description
    createdAt
    updatedAt
  }
`;

// Subscriptions GraphQL pour le temps réel
export const BOARD_UPDATED_SUBSCRIPTION = gql`
  subscription BoardUpdated($workspaceId: ID!) {
    boardUpdated(workspaceId: $workspaceId) {
      type
      board {
        ...BoardFields
      }
      boardId
      workspaceId
    }
  }
  ${BOARD_FRAGMENT}
`;

export const TASK_UPDATED_SUBSCRIPTION = gql`
  subscription TaskUpdated($boardId: ID!, $workspaceId: ID!) {
    taskUpdated(boardId: $boardId, workspaceId: $workspaceId) {
      type
      task {
        ...TaskFields
      }
      taskId
      boardId
      workspaceId
      visitor {
        id
        email
        firstName
        lastName
        name
        image
      }
    }
  }
  ${TASK_FRAGMENT}
`;

export const COLUMN_UPDATED_SUBSCRIPTION = gql`
  subscription ColumnUpdated($boardId: ID!, $workspaceId: ID!) {
    columnUpdated(boardId: $boardId, workspaceId: $workspaceId) {
      type
      column {
        ...ColumnFields
      }
      columns
      columnId
      boardId
      workspaceId
    }
  }
  ${COLUMN_FRAGMENT}
`;

// Mutations pour le timer
export const START_TIMER = gql`
  mutation StartTimer($taskId: ID!, $workspaceId: ID) {
    startTimer(taskId: $taskId, workspaceId: $workspaceId) {
      ...TaskFields
    }
  }
  ${TASK_FRAGMENT}
`;

export const STOP_TIMER = gql`
  mutation StopTimer($taskId: ID!, $workspaceId: ID) {
    stopTimer(taskId: $taskId, workspaceId: $workspaceId) {
      ...TaskFields
    }
  }
  ${TASK_FRAGMENT}
`;

export const RESET_TIMER = gql`
  mutation ResetTimer($taskId: ID!, $workspaceId: ID) {
    resetTimer(taskId: $taskId, workspaceId: $workspaceId) {
      ...TaskFields
    }
  }
  ${TASK_FRAGMENT}
`;

export const UPDATE_TIMER_SETTINGS = gql`
  mutation UpdateTimerSettings($taskId: ID!, $hourlyRate: Float, $roundingOption: String, $workspaceId: ID) {
    updateTimerSettings(taskId: $taskId, hourlyRate: $hourlyRate, roundingOption: $roundingOption, workspaceId: $workspaceId) {
      ...TaskFields
    }
  }
  ${TASK_FRAGMENT}
`;

// Query pour récupérer les tâches avec timer actif
export const GET_ACTIVE_TIMERS = gql`
  query GetActiveTimers($workspaceId: ID) {
    activeTimers(workspaceId: $workspaceId) {
      id
      title
      boardId
      columnId
      assignedMembers
      assignedMembersInfo {
        id
        userId
        name
        email
        image
      }
      timeTracking {
        totalSeconds
        isRunning
        currentStartTime
        startedBy {
          userId
          userName
          userImage
        }
        hourlyRate
        roundingOption
      }
    }
  }
`;

// ============================================
// PARTAGE PUBLIC DU KANBAN
// ============================================

// Query pour récupérer les liens de partage d'un tableau
export const GET_PUBLIC_SHARES = gql`
  query GetPublicShares($boardId: ID!, $workspaceId: ID) {
    getPublicShares(boardId: $boardId, workspaceId: $workspaceId) {
      id
      token
      boardId
      name
      permissions {
        canViewTasks
        canComment
        canViewComments
        canViewAssignees
        canViewDueDates
        canViewAttachments
      }
      isActive
      expiresAt
      hasPassword
      visitors {
        id
        email
        firstName
        lastName
        name
        image
        firstVisitAt
        lastVisitAt
        visitCount
      }
      bannedEmails {
        email
        bannedAt
        reason
      }
      accessRequests {
        id
        email
        name
        message
        requestedAt
        status
      }
      stats {
        totalViews
        uniqueVisitors
        totalComments
      }
      shareUrl
      createdAt
      updatedAt
    }
  }
`;

// Query pour accéder au tableau public (visiteurs externes)
export const GET_PUBLIC_BOARD = gql`
  query GetPublicBoard($token: String!, $email: String!, $password: String) {
    getPublicBoard(token: $token, email: $email, password: $password) {
      success
      message
      board {
        id
        title
        description
        columns {
          id
          title
          color
          order
        }
        tasks {
          id
          title
          description
          status
          priority
          tags {
            name
            className
            bg
            text
            border
          }
          startDate
          dueDate
          columnId
          position
          checklist {
            id
            text
            completed
          }
          assignedMembers {
            id
            name
            image
          }
          images {
            id
            key
            url
            fileName
            contentType
          }
          comments {
            id
            userName
            userEmail
            userImage
            content
            isExternal
            images {
              id
              key
              url
              fileName
              contentType
            }
            createdAt
          }
          timeTracking {
            totalSeconds
            isRunning
            currentStartTime
            hourlyRate
            startedBy {
              userId
              userName
              userImage
            }
          }
          userId
          createdAt
          updatedAt
        }
        members {
          id
          name
          image
        }
      }
      share {
        id
        permissions {
          canViewTasks
          canComment
          canViewComments
          canViewAssignees
          canViewDueDates
          canViewAttachments
        }
      }
      visitorEmail
      isBanned
    }
  }
`;

// Mutation pour demander l'accès (visiteurs bannis)
export const REQUEST_ACCESS = gql`
  mutation RequestAccess($token: String!, $email: String!, $name: String, $message: String) {
    requestAccess(token: $token, email: $email, name: $name, message: $message) {
      success
      message
      alreadyRequested
    }
  }
`;

// Subscription pour être notifié quand un accès est approuvé (temps réel)
export const ACCESS_APPROVED_SUBSCRIPTION = gql`
  subscription AccessApproved($token: String!, $email: String!) {
    accessApproved(token: $token, email: $email) {
      email
      token
      approved
    }
  }
`;

// Subscription pour être notifié quand un accès est révoqué (déconnexion temps réel)
export const ACCESS_REVOKED_SUBSCRIPTION = gql`
  subscription AccessRevoked($token: String!, $email: String!) {
    accessRevoked(token: $token, email: $email) {
      email
      token
      reason
    }
  }
`;

// Subscription pour être notifié d'une nouvelle demande d'accès (propriétaire)
export const ACCESS_REQUESTED_SUBSCRIPTION = gql`
  subscription AccessRequested($boardId: ID!) {
    accessRequested(boardId: $boardId) {
      id
      email
      name
      message
      requestedAt
      boardId
    }
  }
`;

// Subscription pour voir les visiteurs connectés en temps réel
export const VISITOR_PRESENCE_SUBSCRIPTION = gql`
  subscription VisitorPresence($boardId: ID!) {
    visitorPresence(boardId: $boardId) {
      email
      name
      image
      boardId
      isConnected
    }
  }
`;

// Query pour valider un token public
export const VALIDATE_PUBLIC_TOKEN = gql`
  query ValidatePublicToken($token: String!) {
    validatePublicToken(token: $token)
  }
`;

// Mutation pour créer un lien de partage
export const CREATE_PUBLIC_SHARE = gql`
  mutation CreatePublicShare($input: CreatePublicShareInput!, $workspaceId: ID) {
    createPublicShare(input: $input, workspaceId: $workspaceId) {
      id
      token
      boardId
      name
      permissions {
        canViewTasks
        canComment
        canViewComments
        canViewAssignees
        canViewDueDates
        canViewAttachments
      }
      isActive
      expiresAt
      hasPassword
      shareUrl
      createdAt
    }
  }
`;

// Mutation pour mettre à jour un lien de partage
export const UPDATE_PUBLIC_SHARE = gql`
  mutation UpdatePublicShare($input: UpdatePublicShareInput!, $workspaceId: ID) {
    updatePublicShare(input: $input, workspaceId: $workspaceId) {
      id
      token
      name
      permissions {
        canViewTasks
        canComment
        canViewComments
        canViewAssignees
        canViewDueDates
        canViewAttachments
      }
      isActive
      expiresAt
      hasPassword
      shareUrl
      updatedAt
    }
  }
`;

// Mutation pour supprimer un lien de partage
export const DELETE_PUBLIC_SHARE = gql`
  mutation DeletePublicShare($id: ID!, $workspaceId: ID) {
    deletePublicShare(id: $id, workspaceId: $workspaceId)
  }
`;

// Mutation pour révoquer un lien de partage
export const REVOKE_PUBLIC_SHARE = gql`
  mutation RevokePublicShare($id: ID!, $workspaceId: ID) {
    revokePublicShare(id: $id, workspaceId: $workspaceId)
  }
`;

// Mutation pour révoquer l'accès d'un visiteur spécifique (le bannit)
export const REVOKE_VISITOR_ACCESS = gql`
  mutation RevokeVisitorAccess($shareId: ID!, $visitorEmail: String!, $reason: String, $workspaceId: ID) {
    revokeVisitorAccess(shareId: $shareId, visitorEmail: $visitorEmail, reason: $reason, workspaceId: $workspaceId) {
      id
      visitors {
        id
        email
        firstName
        lastName
        name
        image
        firstVisitAt
        lastVisitAt
        visitCount
      }
      bannedEmails {
        email
        bannedAt
        reason
      }
      accessRequests {
        id
        email
        name
        message
        requestedAt
        status
      }
    }
  }
`;

// Mutation pour débannir un visiteur
export const UNBAN_VISITOR = gql`
  mutation UnbanVisitor($shareId: ID!, $visitorEmail: String!, $workspaceId: ID) {
    unbanVisitor(shareId: $shareId, visitorEmail: $visitorEmail, workspaceId: $workspaceId) {
      id
      bannedEmails {
        email
        bannedAt
        reason
      }
    }
  }
`;

// Mutation pour approuver une demande d'accès
export const APPROVE_ACCESS_REQUEST = gql`
  mutation ApproveAccessRequest($shareId: ID!, $requestId: ID!, $workspaceId: ID) {
    approveAccessRequest(shareId: $shareId, requestId: $requestId, workspaceId: $workspaceId) {
      id
      bannedEmails {
        email
        bannedAt
        reason
      }
      accessRequests {
        id
        email
        name
        message
        requestedAt
        status
      }
    }
  }
`;

// Mutation pour rejeter une demande d'accès
export const REJECT_ACCESS_REQUEST = gql`
  mutation RejectAccessRequest($shareId: ID!, $requestId: ID!, $workspaceId: ID) {
    rejectAccessRequest(shareId: $shareId, requestId: $requestId, workspaceId: $workspaceId) {
      id
      accessRequests {
        id
        email
        name
        message
        requestedAt
        status
      }
    }
  }
`;

// Mutation pour ajouter un commentaire externe
export const ADD_EXTERNAL_COMMENT = gql`
  mutation AddExternalComment($token: String!, $taskId: ID!, $content: String!, $visitorEmail: String!) {
    addExternalComment(token: $token, taskId: $taskId, content: $content, visitorEmail: $visitorEmail) {
      success
      message
      task {
        id
        title
        description
        status
        priority
        tags {
          name
          className
          bg
          text
          border
        }
        startDate
        dueDate
        columnId
        position
        checklist {
          id
          text
          completed
        }
        images {
          id
          key
          url
          fileName
          contentType
        }
        assignedMembers {
          id
          name
          image
        }
        timeTracking {
          totalSeconds
          isRunning
          currentStartTime
          hourlyRate
          startedBy {
            userId
            userName
            userImage
          }
        }
        comments {
          id
          userName
          userEmail
          userImage
          content
          isExternal
          images {
            id
            key
            url
            fileName
            contentType
          }
          createdAt
        }
        userId
        createdAt
        updatedAt
      }
    }
  }
`;

// Mutation pour mettre à jour le profil d'un visiteur externe
export const UPDATE_VISITOR_PROFILE = gql`
  mutation UpdateVisitorProfile($token: String!, $email: String!, $input: UpdateVisitorProfileInput!) {
    updateVisitorProfile(token: $token, email: $email, input: $input) {
      success
      message
      visitor {
        id
        email
        firstName
        lastName
        name
        image
      }
    }
  }
`;

// Mutation pour uploader l'image de profil d'un visiteur sur Cloudflare
export const UPLOAD_VISITOR_IMAGE = gql`
  mutation UploadVisitorImage($token: String!, $email: String!, $file: Upload!) {
    uploadVisitorImage(token: $token, email: $email, file: $file) {
      success
      message
      imageUrl
    }
  }
`;

// Mutation pour uploader une image dans un commentaire externe (visiteur)
export const UPLOAD_EXTERNAL_COMMENT_IMAGE = gql`
  mutation UploadExternalCommentImage($token: String!, $taskId: ID!, $file: Upload!, $visitorEmail: String!) {
    uploadExternalCommentImage(token: $token, taskId: $taskId, file: $file, visitorEmail: $visitorEmail) {
      success
      message
      image {
        id
        key
        url
        fileName
        contentType
      }
    }
  }
`;

// Subscription pour les mises à jour en temps réel sur la page publique
export const PUBLIC_TASK_UPDATED_SUBSCRIPTION = gql`
  subscription PublicTaskUpdated($token: String!, $boardId: ID!) {
    publicTaskUpdated(token: $token, boardId: $boardId) {
      type
      task {
        id
        title
        description
        status
        priority
        startDate
        dueDate
        columnId
        position
        tags {
          name
        }
        checklist {
          id
          text
          completed
        }
        assignedMembers {
          id
          name
          image
        }
        images {
          id
          key
          url
          fileName
          contentType
        }
        comments {
          id
          userName
          userEmail
          userImage
          content
          isExternal
          images {
            id
            key
            url
            fileName
            contentType
          }
          createdAt
        }
        timeTracking {
          totalSeconds
          isRunning
          currentStartTime
          hourlyRate
          startedBy {
            userId
            userName
            userImage
          }
        }
        userId
        createdAt
        updatedAt
      }
      taskId
      boardId
      visitor {
        id
        email
        firstName
        lastName
        name
        image
      }
    }
  }
`;

// ==================== USER INVITED (Visiteurs persistants) ====================

// Query pour vérifier si un email existe et ses caractéristiques
export const CHECK_INVITED_EMAIL = gql`
  query CheckInvitedEmail($email: String!, $token: String!) {
    checkInvitedEmail(email: $email, token: $token) {
      exists
      requiresPassword
      hasLinkedNewbiAccount
      linkedUser {
        id
        email
        name
        firstName
        lastName
        image
      }
      userInvited {
        id
        email
        firstName
        lastName
        name
        image
        requiresPassword
      }
    }
  }
`;

// Mutation pour authentifier ou créer un utilisateur invité
export const AUTHENTICATE_INVITED_USER = gql`
  mutation AuthenticateInvitedUser($input: AuthInvitedInput!) {
    authenticateInvitedUser(input: $input) {
      success
      message
      userInvited {
        id
        email
        firstName
        lastName
        name
        image
        requiresPassword
        linkedUserId
        stats {
          totalVisits
          totalComments
          totalBoardsAccessed
        }
      }
      sessionToken
      isNewUser
      requiresPassword
      linkedUser {
        id
        email
        name
        firstName
        lastName
        image
      }
      isBanned
      banReason
    }
  }
`;

// Mutation pour définir un mot de passe
export const SET_INVITED_USER_PASSWORD = gql`
  mutation SetInvitedUserPassword($input: SetPasswordInput!) {
    setInvitedUserPassword(input: $input) {
      success
      message
      userInvited {
        id
        email
        requiresPassword
      }
      requiresPassword
    }
  }
`;

// Mutation pour mettre à jour le profil d'un utilisateur invité
export const UPDATE_INVITED_USER_PROFILE = gql`
  mutation UpdateInvitedUserProfile($email: String!, $input: UpdateInvitedProfileInput!) {
    updateInvitedUserProfile(email: $email, input: $input) {
      id
      email
      firstName
      lastName
      name
      image
    }
  }
`;

// Query pour valider un token de session d'utilisateur invité
export const VALIDATE_INVITED_SESSION = gql`
  query ValidateInvitedSession($sessionToken: String!) {
    validateInvitedSession(sessionToken: $sessionToken) {
      id
      email
      firstName
      lastName
      name
      image
      requiresPassword
      linkedUserId
      stats {
        totalVisits
        totalComments
        totalBoardsAccessed
      }
    }
  }
`;

// Mutation pour déconnecter un utilisateur invité
export const LOGOUT_INVITED_USER = gql`
  mutation LogoutInvitedUser($sessionToken: String!) {
    logoutInvitedUser(sessionToken: $sessionToken)
  }
`;