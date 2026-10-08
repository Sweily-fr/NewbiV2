import { gql } from "@apollo/client";

// Rôles d'un espace : catalogue des modules, rôles (prédéfinis et
// personnalisés) et droits de l'utilisateur connecté. Source : newbi-api
// (src/config/rolePermissions.js).

const ORGANIZATION_ROLE_FIELDS = gql`
  fragment OrganizationRoleFields on OrganizationRole {
    key
    name
    description
    predefined
    editable
    customized
    levels
    memberCount
    invitationCount
    updatedAt
  }
`;

export const GET_ROLE_CATALOG = gql`
  query RoleCatalog {
    roleCatalog {
      defaultInviteRole
      groups {
        key
        label
      }
      modules {
        key
        group
        label
        description
        levels
      }
    }
  }
`;

export const GET_ORGANIZATION_ROLES = gql`
  query OrganizationRoles {
    organizationRoles {
      ...OrganizationRoleFields
    }
  }
  ${ORGANIZATION_ROLE_FIELDS}
`;

export const GET_MY_PERMISSIONS = gql`
  query MyPermissions {
    myPermissions {
      organizationId
      role
      roleName
      isOwner
      levels
    }
  }
`;

export const CREATE_ORGANIZATION_ROLE = gql`
  mutation CreateOrganizationRole($input: OrganizationRoleInput!) {
    createOrganizationRole(input: $input) {
      ...OrganizationRoleFields
    }
  }
  ${ORGANIZATION_ROLE_FIELDS}
`;

export const UPDATE_ORGANIZATION_ROLE = gql`
  mutation UpdateOrganizationRole(
    $key: String!
    $input: OrganizationRoleInput!
  ) {
    updateOrganizationRole(key: $key, input: $input) {
      ...OrganizationRoleFields
    }
  }
  ${ORGANIZATION_ROLE_FIELDS}
`;

export const RESET_ORGANIZATION_ROLE = gql`
  mutation ResetOrganizationRole($key: String!) {
    resetOrganizationRole(key: $key) {
      ...OrganizationRoleFields
    }
  }
  ${ORGANIZATION_ROLE_FIELDS}
`;

export const DELETE_ORGANIZATION_ROLE = gql`
  mutation DeleteOrganizationRole($key: String!, $fallbackRole: String) {
    deleteOrganizationRole(key: $key, fallbackRole: $fallbackRole) {
      success
      reassignedMembers
      reassignedInvitations
    }
  }
`;

export const TRANSFER_ORGANIZATION_OWNERSHIP = gql`
  mutation TransferOrganizationOwnership($memberId: ID!) {
    transferOrganizationOwnership(memberId: $memberId) {
      success
    }
  }
`;
