import { gql } from "@apollo/client";

// Champs d'un contact de la liste (GET_CLIENTS et GET_CLIENTS_BY_TYPES)
const CLIENT_LIST_ITEM_FIELDS = `
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
        invoiceCount
`;

export const GET_CLIENTS = gql`
  query GetClients(
    $workspaceId: String!
    $page: Int
    $limit: Int
    $search: String
    $searchExact: Boolean
  ) {
    clients(
      workspaceId: $workspaceId
      page: $page
      limit: $limit
      search: $search
      searchExact: $searchExact
    ) {
      items {${CLIENT_LIST_ITEM_FIELDS}
      }
      totalItems
      currentPage
      totalPages
    }
  }
`;

// Même liste filtrée par type (« Particulier », « Entreprise ») côté serveur,
// pour porter sur tous les contacts et pas seulement la page affichée.
// Document à part : la liste sans filtre reste lisible par une API qui ne
// connaît pas encore l'argument types. Même nom d'opération, pour être
// relancée avec elle (refetchQueries ["GetClients"]).
export const GET_CLIENTS_BY_TYPES = gql`
  query GetClients(
    $workspaceId: String!
    $page: Int
    $limit: Int
    $search: String
    $searchExact: Boolean
    $types: [ClientType!]
  ) {
    clients(
      workspaceId: $workspaceId
      page: $page
      limit: $limit
      search: $search
      searchExact: $searchExact
      types: $types
    ) {
      items {${CLIENT_LIST_ITEM_FIELDS}
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
      invoiceCount
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
