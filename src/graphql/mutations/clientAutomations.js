import { gql } from "@apollo/client";

export const CREATE_CLIENT_AUTOMATION = gql`
  mutation CreateClientAutomation($workspaceId: ID!, $input: CreateClientAutomationInput!) {
    createClientAutomation(workspaceId: $workspaceId, input: $input) {
      id
      name
      description
      triggerType
      triggerConfig {
        minAmount
        daysOverdue
      }
      actionType
      sourceList {
        id
        name
        color
      }
      targetList {
        id
        name
        color
      }
      isActive
      stats {
        totalExecutions
        lastExecutedAt
        lastClientId
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CLIENT_AUTOMATION = gql`
  mutation UpdateClientAutomation($workspaceId: ID!, $id: ID!, $input: UpdateClientAutomationInput!) {
    updateClientAutomation(workspaceId: $workspaceId, id: $id, input: $input) {
      id
      name
      description
      triggerType
      triggerConfig {
        minAmount
        daysOverdue
      }
      actionType
      sourceList {
        id
        name
        color
      }
      targetList {
        id
        name
        color
      }
      isActive
      stats {
        totalExecutions
        lastExecutedAt
        lastClientId
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CLIENT_AUTOMATION = gql`
  mutation DeleteClientAutomation($workspaceId: ID!, $id: ID!) {
    deleteClientAutomation(workspaceId: $workspaceId, id: $id)
  }
`;

export const TOGGLE_CLIENT_AUTOMATION = gql`
  mutation ToggleClientAutomation($workspaceId: ID!, $id: ID!) {
    toggleClientAutomation(workspaceId: $workspaceId, id: $id) {
      id
      name
      isActive
    }
  }
`;
