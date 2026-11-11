"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { throwIfMutationErrors } from "@/src/graphql/mutationErrors";

const DOCUMENT_SHARE_FIELDS = gql`
  fragment DocumentShareFields on DocumentShare {
    id
    folderIds
    folders {
      id
      name
      available
    }
    name
    isActive
    expiresAt
    hasPassword
    allowUploads
    isFolderAvailable
    shareUrl
    totalViews
    totalDownloads
    totalUploads
    lastViewedAt
    visitors {
      email
      name
      firstVisitAt
      lastVisitAt
      visitCount
      downloadCount
      uploadCount
      isBanned
    }
    bannedEmails {
      email
      bannedAt
      reason
    }
    accessRequests {
      id
      email
      name
      message
      requestedAt
    }
    pendingRequestsCount
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

const shareMutation = (name, signature, args) => gql`
  ${DOCUMENT_SHARE_FIELDS}
  mutation ${name[0].toUpperCase()}${name.slice(1)}($workspaceId: ID!, ${signature}) {
    ${name}(workspaceId: $workspaceId, ${args}) {
      ...DocumentShareFields
    }
  }
`;

const CREATE = shareMutation(
  "createDocumentShare",
  "$input: CreateDocumentShareInput!",
  "input: $input",
);
const UPDATE = shareMutation(
  "updateDocumentShare",
  "$id: ID!, $input: UpdateDocumentShareInput!",
  "id: $id, input: $input",
);
const REVOKE = shareMutation("revokeDocumentShare", "$id: ID!", "id: $id");
const REVOKE_VISITOR = shareMutation(
  "revokeDocumentShareVisitor",
  "$id: ID!, $email: String!",
  "id: $id, email: $email",
);
const UNBAN_VISITOR = shareMutation(
  "unbanDocumentShareVisitor",
  "$id: ID!, $email: String!",
  "id: $id, email: $email",
);
const APPROVE_REQUEST = shareMutation(
  "approveDocumentShareRequest",
  "$id: ID!, $requestId: ID!",
  "id: $id, requestId: $requestId",
);
const REJECT_REQUEST = shareMutation(
  "rejectDocumentShareRequest",
  "$id: ID!, $requestId: ID!",
  "id: $id, requestId: $requestId",
);

const DELETE = gql`
  mutation DeleteDocumentShare($workspaceId: ID!, $id: ID!) {
    deleteDocumentShare(workspaceId: $workspaceId, id: $id)
  }
`;

/**
 * Accès clients de l'espace. `enabled` : faux sans l'action « share » (les
 * adresses sont des secrets). `poll` : fenêtre ouverte, les nouveaux
 * visiteurs et demandes d'accès apparaissent sans recharger.
 */
export function useDocumentShares({ enabled = true, poll = false } = {}) {
  const { workspaceId } = useWorkspace();
  const { data, loading } = useQuery(GET_DOCUMENT_SHARES, {
    variables: { workspaceId },
    skip: !workspaceId || !enabled,
    fetchPolicy: "cache-and-network",
    pollInterval: poll ? 15000 : 0,
  });
  const refetchQueries = [
    { query: GET_DOCUMENT_SHARES, variables: { workspaceId } },
  ];
  const [createMutation, createState] = useMutation(CREATE, {
    refetchQueries,
    awaitRefetchQueries: true,
  });
  const [updateMutation, updateState] = useMutation(UPDATE);
  const [revokeMutation] = useMutation(REVOKE);
  const [revokeVisitorMutation] = useMutation(REVOKE_VISITOR);
  const [unbanVisitorMutation] = useMutation(UNBAN_VISITOR);
  const [approveMutation] = useMutation(APPROVE_REQUEST);
  const [rejectMutation] = useMutation(REJECT_REQUEST);
  const [deleteMutation] = useMutation(DELETE, {
    refetchQueries,
    awaitRefetchQueries: true,
  });
  // errorPolicy « all » par défaut : un refus de l'API ne rejette pas, il
  // faut le relancer pour ne pas afficher « Accès créé » à tort
  const run = async (mutation, variables) => {
    const result = await mutation({ variables: { workspaceId, ...variables } });
    throwIfMutationErrors(result);
    return result;
  };

  return {
    shares: data?.documentShares || [],
    loading: loading && !data,
    saving: createState.loading || updateState.loading,
    createShare: (input) => run(createMutation, { input }),
    updateShare: (id, input) => run(updateMutation, { id, input }),
    revokeShare: (id) => run(revokeMutation, { id }),
    deleteShare: (id) => run(deleteMutation, { id }),
    revokeVisitor: (id, email) => run(revokeVisitorMutation, { id, email }),
    unbanVisitor: (id, email) => run(unbanVisitorMutation, { id, email }),
    approveRequest: (id, requestId) => run(approveMutation, { id, requestId }),
    rejectRequest: (id, requestId) => run(rejectMutation, { id, requestId }),
  };
}
