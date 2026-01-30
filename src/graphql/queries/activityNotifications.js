import { gql } from "@apollo/client";

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($workspaceId: ID!, $limit: Int, $offset: Int, $unreadOnly: Boolean) {
    getNotifications(workspaceId: $workspaceId, limit: $limit, offset: $offset, unreadOnly: $unreadOnly) {
      notifications {
        id
        userId
        workspaceId
        type
        title
        message
        data {
          taskId
          taskTitle
          boardId
          boardName
          columnName
          actorId
          actorName
          actorImage
          url
        }
        read
        readAt
        createdAt
        updatedAt
      }
      totalCount
      unreadCount
    }
  }
`;

export const GET_UNREAD_NOTIFICATIONS_COUNT = gql`
  query GetUnreadNotificationsCount($workspaceId: ID!) {
    getUnreadNotificationsCount(workspaceId: $workspaceId)
  }
`;

export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id) {
      success
      message
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
  mutation MarkAllNotificationsAsRead($workspaceId: ID!) {
    markAllNotificationsAsRead(workspaceId: $workspaceId) {
      success
      message
    }
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id) {
      success
      message
    }
  }
`;

export const NOTIFICATION_RECEIVED_SUBSCRIPTION = gql`
  subscription NotificationReceived($workspaceId: ID!) {
    notificationReceived(workspaceId: $workspaceId) {
      id
      userId
      workspaceId
      type
      title
      message
      data {
        taskId
        taskTitle
        boardId
        boardName
        columnName
        actorId
        actorName
        actorImage
        url
      }
      read
      readAt
      createdAt
      updatedAt
    }
  }
`;
