import { gql } from '@apollo/client';
import { CRM_EMAIL_AUTOMATION_FRAGMENT } from '../queries/crmEmailAutomations';

export const CREATE_CRM_EMAIL_AUTOMATION = gql`
  ${CRM_EMAIL_AUTOMATION_FRAGMENT}
  mutation CreateCrmEmailAutomation($workspaceId: ID!, $input: CreateCrmEmailAutomationInput!) {
    createCrmEmailAutomation(workspaceId: $workspaceId, input: $input) {
      ...CrmEmailAutomationFragment
    }
  }
`;

export const UPDATE_CRM_EMAIL_AUTOMATION = gql`
  ${CRM_EMAIL_AUTOMATION_FRAGMENT}
  mutation UpdateCrmEmailAutomation($workspaceId: ID!, $id: ID!, $input: UpdateCrmEmailAutomationInput!) {
    updateCrmEmailAutomation(workspaceId: $workspaceId, id: $id, input: $input) {
      ...CrmEmailAutomationFragment
    }
  }
`;

export const DELETE_CRM_EMAIL_AUTOMATION = gql`
  mutation DeleteCrmEmailAutomation($workspaceId: ID!, $id: ID!) {
    deleteCrmEmailAutomation(workspaceId: $workspaceId, id: $id)
  }
`;

export const TOGGLE_CRM_EMAIL_AUTOMATION = gql`
  ${CRM_EMAIL_AUTOMATION_FRAGMENT}
  mutation ToggleCrmEmailAutomation($workspaceId: ID!, $id: ID!) {
    toggleCrmEmailAutomation(workspaceId: $workspaceId, id: $id) {
      ...CrmEmailAutomationFragment
    }
  }
`;

export const TEST_CRM_EMAIL_AUTOMATION = gql`
  mutation TestCrmEmailAutomation($workspaceId: ID!, $id: ID!, $testEmail: String!) {
    testCrmEmailAutomation(workspaceId: $workspaceId, id: $id, testEmail: $testEmail)
  }
`;
