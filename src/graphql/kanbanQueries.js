import { gql } from '@apollo/client';

// GraphQL Queries
export const GET_BOARDS = gql`
  query GetBoards {
    boards {
      id
      title
      description
      createdAt
      updatedAt
    }
  }
`;

export const GET_BOARD = gql`
  query GetBoard($id: ID!) {
    board(id: $id) {
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
  query GetTasks($boardId: ID!, $columnId: ID) {
    tasks(boardId: $boardId, columnId: $columnId) {
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
  mutation CreateBoard($input: CreateBoardInput!) {
    createBoard(input: $input) {
      id
      title
      description
    }
  }
`;

export const UPDATE_BOARD = gql`
  mutation UpdateBoard($input: UpdateBoardInput!) {
    updateBoard(input: $input) {
      id
      title
      description
    }
  }
`;

export const DELETE_BOARD = gql`
  mutation DeleteBoard($id: ID!) {
    deleteBoard(id: $id)
  }
`;

export const CREATE_COLUMN = gql`
  mutation CreateColumn($input: CreateColumnInput!) {
    createColumn(input: $input) {
      id
      title
      color
      order
      boardId
    }
  }
`;

export const UPDATE_COLUMN = gql`
  mutation UpdateColumn($input: UpdateColumnInput!) {
    updateColumn(input: $input) {
      id
      title
      color
      order
    }
  }
`;

export const DELETE_COLUMN = gql`
  mutation DeleteColumn($id: ID!) {
    deleteColumn(id: $id)
  }
`;

export const REORDER_COLUMNS = gql`
  mutation ReorderColumns($columns: [ID!]!) {
    reorderColumns(columns: $columns)
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
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
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
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
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

export const MOVE_TASK = gql`
  mutation MoveTask($id: ID!, $columnId: String!, $position: Int!) {
    moveTask(id: $id, columnId: $columnId, position: $position) {
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