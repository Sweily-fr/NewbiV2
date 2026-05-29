import { gql } from "@apollo/client";

export const GET_CLIENTS = gql`
  query GetClients(
    $workspaceId: String!
    $page: Int
    $limit: Int
    $search: String
  ) {
    clients(
      workspaceId: $workspaceId
      page: $page
      limit: $limit
      search: $search
    ) {
      items {
        id
        name
        email
        phone
        type
        firstName
        lastName
        contactFunction
        contactDepartment
        contactLocation
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
          department
          location
          firstName
          lastName
          email
          phone
          isPrimary
        }
        customFields {
          fieldId
          value
        }
        assignedMembers
        isBlocked
        blockedAt
        blockedReason
        hasDocuments
      }
      totalItems
      currentPage
      totalPages
    }
  }
`;

export const GET_CLIENT = gql`
  query GetClient($workspaceId: String!, $id: ID!) {
    client(workspaceId: $workspaceId, id: $id) {
      id
      name
      email
      phone
      type
      firstName
      lastName
      contactFunction
      contactDepartment
      contactLocation
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
        department
        location
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
      assignedMembers
      isBlocked
      blockedAt
      blockedReason
      hasDocuments
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
          blockReason
          listId
          listName
          assignedMembers {
            id
            name
            image
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`;
