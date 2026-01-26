import { gql } from "@apollo/client";

export const GET_CLIENT_AUTOMATIONS = gql`
  query GetClientAutomations($workspaceId: ID!) {
    clientAutomations(workspaceId: $workspaceId) {
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

export const GET_CLIENT_AUTOMATION = gql`
  query GetClientAutomation($workspaceId: ID!, $id: ID!) {
    clientAutomation(workspaceId: $workspaceId, id: $id) {
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
