import { gql } from '@apollo/client';

export const CREATE_CLIENT = gql`
  mutation CreateClient($workspaceId: String!, $input: ClientInput!) {
    createClient(workspaceId: $workspaceId, input: $input) {
      id
      name
      email
      type
      firstName
      lastName
      address {
        street
        city
        postalCode
        country
      }
      hasDifferentShippingAddress
      shippingAddress {
        fullName
        street
        city
        postalCode
        country
      }
      siret
      vatNumber
      isInternational
      contacts {
        id
        position
        firstName
        lastName
        email
        phone
        isPrimary
        createdAt
      }
      customFields {
        fieldId
        value
      }
      isBlocked
      blockedAt
      blockedReason
      notes {
        id
        content
        userId
        userName
        userImage
        createdAt
        updatedAt
      }
      activity {
        id
        type
        description
        field
        oldValue
        newValue
        userId
        userName
        userImage
        createdAt
        metadata {
          documentType
          documentId
          documentNumber
          status
          originalInvoiceNumber
          eventId
          eventTitle
          eventDate
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CLIENT = gql`
  mutation UpdateClient($workspaceId: String!, $id: ID!, $input: ClientInput!) {
    updateClient(workspaceId: $workspaceId, id: $id, input: $input) {
      id
      name
      email
      type
      firstName
      lastName
      address {
        street
        city
        postalCode
        country
      }
      hasDifferentShippingAddress
      shippingAddress {
        fullName
        street
        city
        postalCode
        country
      }
      siret
      vatNumber
      isInternational
      contacts {
        id
        position
        firstName
        lastName
        email
        phone
        isPrimary
        createdAt
      }
      customFields {
        fieldId
        value
      }
      isBlocked
      blockedAt
      blockedReason
      notes {
        id
        content
        userId
        userName
        userImage
        createdAt
        updatedAt
      }
      activity {
        id
        type
        description
        field
        oldValue
        newValue
        userId
        userName
        userImage
        createdAt
        metadata {
          documentType
          documentId
          documentNumber
          status
          originalInvoiceNumber
          eventId
          eventTitle
          eventDate
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CLIENT = gql`
  mutation DeleteClient($workspaceId: String!, $id: ID!) {
    deleteClient(workspaceId: $workspaceId, id: $id)
  }
`;

export const BLOCK_CLIENT = gql`
  mutation BlockClient($workspaceId: String!, $id: ID!, $reason: String) {
    blockClient(workspaceId: $workspaceId, id: $id, reason: $reason) {
      id
      isBlocked
      blockedAt
      blockedReason
    }
  }
`;

export const UNBLOCK_CLIENT = gql`
  mutation UnblockClient($workspaceId: String!, $id: ID!) {
    unblockClient(workspaceId: $workspaceId, id: $id) {
      id
      isBlocked
      blockedAt
      blockedReason
    }
  }
`;

export const ASSIGN_CLIENT_MEMBERS = gql`
  mutation AssignClientMembers($workspaceId: String!, $id: ID!, $memberIds: [String!]!) {
    assignClientMembers(workspaceId: $workspaceId, id: $id, memberIds: $memberIds) {
      id
      assignedMembers
    }
  }
`;
