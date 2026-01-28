import { gql } from '@apollo/client';

export const CRM_EMAIL_AUTOMATION_FRAGMENT = gql`
  fragment CrmEmailAutomationFragment on CrmEmailAutomation {
    id
    name
    description
    workspaceId
    customFieldId
    customField {
      id
      name
      fieldType
    }
    timing {
      type
      daysOffset
      sendHour
    }
    email {
      fromName
      fromEmail
      replyTo
      subject
      body
    }
    isActive
    stats {
      totalSent
      lastSentAt
      lastClientId
    }
    createdAt
    updatedAt
  }
`;

export const GET_CRM_EMAIL_AUTOMATIONS = gql`
  ${CRM_EMAIL_AUTOMATION_FRAGMENT}
  query GetCrmEmailAutomations($workspaceId: ID!) {
    crmEmailAutomations(workspaceId: $workspaceId) {
      ...CrmEmailAutomationFragment
    }
  }
`;

export const GET_CRM_EMAIL_AUTOMATION = gql`
  ${CRM_EMAIL_AUTOMATION_FRAGMENT}
  query GetCrmEmailAutomation($workspaceId: ID!, $id: ID!) {
    crmEmailAutomation(workspaceId: $workspaceId, id: $id) {
      ...CrmEmailAutomationFragment
    }
  }
`;

export const GET_CRM_EMAIL_AUTOMATION_LOGS = gql`
  query GetCrmEmailAutomationLogs($workspaceId: ID!, $automationId: ID, $limit: Int) {
    crmEmailAutomationLogs(workspaceId: $workspaceId, automationId: $automationId, limit: $limit) {
      id
      automationId
      clientId
      client {
        id
        firstName
        lastName
        email
      }
      workspaceId
      triggerDate
      recipientEmail
      emailSubject
      emailBody
      status
      error
      sentAt
      createdAt
    }
  }
`;
