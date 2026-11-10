import { gql } from "@apollo/client";

// Fonctionnalités en accès anticipé ouvertes à l'espace (newbi-api,
// src/utils/featureAccess.js : BETA_FEATURES / BETA_WORKSPACE_IDS)
export const GET_WORKSPACE_FEATURES = gql`
  query WorkspaceFeatures($workspaceId: ID) {
    workspaceFeatures(workspaceId: $workspaceId) {
      vat
      appointments
      documentShares
      socialPublishing
    }
  }
`;
