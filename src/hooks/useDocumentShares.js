"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import { useWorkspace } from "@/src/hooks/useWorkspace";

const DOCUMENT_SHARE_FIELDS = gql`
  fragment DocumentShareFields on DocumentShare {
    id
    folderId
    name
    isActive
    expiresAt
    hasPassword
    isFolderAvailable
    shareUrl
    totalViews
    totalDownloads
    lastViewedAt
    createdAt
  }
`;

export const GET_DOCUMENT_SHARES = gql`
  ${DOCUMENT_SHARE_FIELDS}
  query GetDocumentShares($workspaceId: ID!) {
    documentShares(workspaceId: $workspaceId) {
      ...DocumentShareFields
    }
  }
`;

const CREATE_DOCUMENT_SHARE = gql`
  ${DOCUMENT_SHARE_FIELDS}
  mutation CreateDocumentShare(
    $workspaceId: ID!
    $input: CreateDocumentShareInput!
  ) {
    createDocumentShare(workspaceId: $workspaceId, input: $input) {
      ...DocumentShareFields
    }
  }
`;

const UPDATE_DOCUMENT_SHARE = gql`
  ${DOCUMENT_SHARE_FIELDS}
  mutation UpdateDocumentShare(
    $workspaceId: ID!
    $id: ID!
    $input: UpdateDocumentShareInput!
  ) {
    updateDocumentShare(workspaceId: $workspaceId, id: $id, input: $input) {
      ...DocumentShareFields
    }
  }
`;

const DELETE_DOCUMENT_SHARE = gql`
  mutation DeleteDocumentShare($workspaceId: ID!, $id: ID!) {
    deleteDocumentShare(workspaceId: $workspaceId, id: $id)
  }
`;

/**
 * Liens clients de l'espace (tous les dossiers : l'arbre marque ceux qui en
 * ont un). `enabled` : faux sans l'action « share », l'URL est un secret.
 */
export function useDocumentShares({ enabled = true } = {}) {
  const { workspaceId } = useWorkspace();
  const { data, loading } = useQuery(GET_DOCUMENT_SHARES, {
    variables: { workspaceId },
    skip: !workspaceId || !enabled,
    fetchPolicy: "cache-and-network",
  });
  const refetchQueries = [
    { query: GET_DOCUMENT_SHARES, variables: { workspaceId } },
  ];
  const [createMutation, createState] = useMutation(CREATE_DOCUMENT_SHARE, {
    refetchQueries,
    awaitRefetchQueries: true,
  });
  const [updateMutation, updateState] = useMutation(UPDATE_DOCUMENT_SHARE);
  const [deleteMutation] = useMutation(DELETE_DOCUMENT_SHARE, {
    refetchQueries,
    awaitRefetchQueries: true,
  });

  return {
    shares: data?.documentShares || [],
    loading: loading && !data,
    saving: createState.loading || updateState.loading,
    createShare: (input) =>
      createMutation({ variables: { workspaceId, input } }),
    updateShare: (id, input) =>
      updateMutation({ variables: { workspaceId, id, input } }),
    deleteShare: (id) => deleteMutation({ variables: { workspaceId, id } }),
  };
}
