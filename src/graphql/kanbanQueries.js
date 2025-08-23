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
    }
  }
`;

export const UPDATE_BOARD = gql`
  mutation UpdateBoard($input: UpdateBoardInput!, $workspaceId: ID) {
    updateBoard(input: $input, workspaceId: $workspaceId) {
      id
      title
      description
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
    }
  }
`;

// Fragments pour les types communs
export const TASK_FRAGMENT = gql`
  fragment TaskFields on Task {
    id
    title
    description
    status
    priority
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