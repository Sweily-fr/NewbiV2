import { gql } from "@apollo/client";

export const GET_INSTALLED_APPS = gql`
  query GetInstalledApps($organizationId: ID!) {
    getInstalledApps(organizationId: $organizationId) {
      id
      appId
      installedBy
      createdAt
    }
  }
`;

export const INSTALL_APP = gql`
  mutation InstallApp($organizationId: ID!, $appId: String!) {
    installApp(organizationId: $organizationId, appId: $appId) {
      id
      appId
      installedBy
      createdAt
    }
  }
`;

export const UNINSTALL_APP = gql`
  mutation UninstallApp($organizationId: ID!, $appId: String!) {
    uninstallApp(organizationId: $organizationId, appId: $appId)
  }
`;
