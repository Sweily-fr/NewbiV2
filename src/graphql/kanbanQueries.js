import { gql } from '@apollo/client';

// GraphQL Queries
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
        comments {
          id
          userId
          userName
          userImage
          content
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
    comments {
      id
      userId
      userName
      userImage
      content
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