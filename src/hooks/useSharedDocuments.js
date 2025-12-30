"use client";

import { gql, useQuery, useMutation } from "@apollo/client";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { toast } from "@/src/components/ui/sonner";

// Queries
export const GET_SHARED_DOCUMENTS = gql`
  query GetSharedDocuments(
    $workspaceId: ID!
    $filter: SharedDocumentsFilterInput
    $limit: Int
    $offset: Int
  ) {
    sharedDocuments(
      workspaceId: $workspaceId
      filter: $filter
      limit: $limit
      offset: $offset
    ) {
      success
      message
      documents {
        id
        name
        originalName
        description
        fileUrl
        fileKey
        mimeType
        fileSize
        fileExtension
        workspaceId
        folderId
        uploadedBy
        uploadedByName
        status
        isSharedWithAccountant
        tags
        comments {
          text
          authorId
          authorName
          createdAt
        }
        createdAt
        updatedAt
      }
      total
      hasMore
    }
  }
`;

export const GET_SHARED_FOLDERS = gql`
  query GetSharedFolders($workspaceId: ID!) {
    sharedFolders(workspaceId: $workspaceId) {
      success
      message
      folders {
        id
        name
        description
        workspaceId
        parentId
        color
        icon
        createdBy
        isSharedWithAccountant
        order
        isSystem
        documentsCount
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_SHARED_DOCUMENTS_STATS = gql`
  query GetSharedDocumentsStats($workspaceId: ID!) {
    sharedDocumentsStats(workspaceId: $workspaceId) {
      success
      totalDocuments
      pendingDocuments
      classifiedDocuments
      archivedDocuments
      totalFolders
      totalSize
    }
  }
`;

// Mutations
export const UPLOAD_SHARED_DOCUMENT = gql`
  mutation UploadSharedDocument(
    $workspaceId: ID!
    $file: Upload!
    $folderId: ID
    $name: String
    $description: String
    $tags: [String]
  ) {
    uploadSharedDocument(
      workspaceId: $workspaceId
      file: $file
      folderId: $folderId
      name: $name
      description: $description
      tags: $tags
    ) {
      success
      message
      document {
        id
        name
        originalName
        fileUrl
        fileKey
        mimeType
        fileSize
        fileExtension
        folderId
        status
        createdAt
      }
    }
  }
`;

export const UPDATE_SHARED_DOCUMENT = gql`
  mutation UpdateSharedDocument(
    $id: ID!
    $workspaceId: ID!
    $input: UpdateSharedDocumentInput!
  ) {
    updateSharedDocument(id: $id, workspaceId: $workspaceId, input: $input) {
      success
      message
      document {
        id
        name
        description
        folderId
        status
        tags
      }
    }
  }
`;

export const DELETE_SHARED_DOCUMENT = gql`
  mutation DeleteSharedDocument($id: ID!, $workspaceId: ID!) {
    deleteSharedDocument(id: $id, workspaceId: $workspaceId) {
      success
      message
    }
  }
`;

export const DELETE_SHARED_DOCUMENTS = gql`
  mutation DeleteSharedDocuments($ids: [ID!]!, $workspaceId: ID!) {
    deleteSharedDocuments(ids: $ids, workspaceId: $workspaceId) {
      success
      message
    }
  }
`;

export const MOVE_SHARED_DOCUMENTS = gql`
  mutation MoveSharedDocuments(
    $ids: [ID!]!
    $workspaceId: ID!
    $targetFolderId: ID
  ) {
    moveSharedDocuments(
      ids: $ids
      workspaceId: $workspaceId
      targetFolderId: $targetFolderId
    ) {
      success
      message
      movedCount
    }
  }
`;

export const CREATE_SHARED_FOLDER = gql`
  mutation CreateSharedFolder(
    $workspaceId: ID!
    $input: CreateSharedFolderInput!
  ) {
    createSharedFolder(workspaceId: $workspaceId, input: $input) {
      success
      message
      folder {
        id
        name
        description
        color
        icon
        order
        documentsCount
      }
    }
  }
`;

export const UPDATE_SHARED_FOLDER = gql`
  mutation UpdateSharedFolder(
    $id: ID!
    $workspaceId: ID!
    $input: UpdateSharedFolderInput!
  ) {
    updateSharedFolder(id: $id, workspaceId: $workspaceId, input: $input) {
      success
      message
      folder {
        id
        name
        description
        color
        icon
        order
      }
    }
  }
`;

export const DELETE_SHARED_FOLDER = gql`
  mutation DeleteSharedFolder($id: ID!, $workspaceId: ID!) {
    deleteSharedFolder(id: $id, workspaceId: $workspaceId) {
      success
      message
    }
  }
`;

// Hook principal
export function useSharedDocuments(filter = {}) {
  const { workspaceId } = useWorkspace();

  // Extraire les valeurs pour que Apollo détecte les changements
  const folderId = filter.folderId;
  const search = filter.search;
  const status = filter.status;

  const { data, loading, error, refetch, networkStatus } = useQuery(
    GET_SHARED_DOCUMENTS,
    {
      variables: {
        workspaceId,
        filter: {
          folderId,
          search,
          status,
        },
        limit: 100,
        offset: 0,
      },
      skip: !workspaceId,
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    }
  );

  // Chargement initial (pas de données en cache)
  const isInitialLoading = loading && !data;

  return {
    documents: data?.sharedDocuments?.documents || [],
    total: data?.sharedDocuments?.total || 0,
    hasMore: data?.sharedDocuments?.hasMore || false,
    loading,
    isInitialLoading,
    isRefetching: loading && !!data,
    error,
    refetch,
  };
}

// Hook pour les dossiers
export function useSharedFolders() {
  const { workspaceId } = useWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_SHARED_FOLDERS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const isInitialLoading = loading && !data;

  return {
    folders: data?.sharedFolders?.folders || [],
    loading,
    isInitialLoading,
    isRefetching: loading && !!data,
    error,
    refetch,
  };
}

// Hook pour les stats
export function useSharedDocumentsStats() {
  const { workspaceId } = useWorkspace();

  const { data, loading, refetch } = useQuery(GET_SHARED_DOCUMENTS_STATS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  return {
    stats: data?.sharedDocumentsStats || {
      totalDocuments: 0,
      pendingDocuments: 0,
      classifiedDocuments: 0,
      archivedDocuments: 0,
      totalFolders: 0,
      totalSize: 0,
    },
    loading,
    refetch,
  };
}

// Hook pour upload
export function useUploadSharedDocument() {
  const { workspaceId } = useWorkspace();
  const [uploadMutation, { loading }] = useMutation(UPLOAD_SHARED_DOCUMENT);

  const upload = async (file, options = {}) => {
    try {
      const result = await uploadMutation({
        variables: {
          workspaceId,
          file,
          folderId: options.folderId || null,
          name: options.name,
          description: options.description,
          tags: options.tags,
        },
        refetchQueries: [
          {
            query: GET_SHARED_DOCUMENTS,
            variables: { workspaceId, filter: {}, limit: 100, offset: 0 },
          },
          { query: GET_SHARED_FOLDERS, variables: { workspaceId } },
          { query: GET_SHARED_DOCUMENTS_STATS, variables: { workspaceId } },
        ],
      });

      if (result.data?.uploadSharedDocument?.success) {
        toast.success("Document uploadé avec succès");
        return result.data.uploadSharedDocument.document;
      } else {
        throw new Error(
          result.data?.uploadSharedDocument?.message || "Erreur upload"
        );
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'upload");
      throw error;
    }
  };

  return { upload, loading };
}

// Hook pour déplacer des documents
export function useMoveSharedDocuments() {
  const { workspaceId } = useWorkspace();
  const [moveMutation, { loading }] = useMutation(MOVE_SHARED_DOCUMENTS);

  const move = async (ids, targetFolderId) => {
    try {
      const result = await moveMutation({
        variables: {
          ids,
          workspaceId,
          targetFolderId,
        },
        refetchQueries: [
          {
            query: GET_SHARED_DOCUMENTS,
            variables: { workspaceId, filter: {}, limit: 100, offset: 0 },
          },
          { query: GET_SHARED_FOLDERS, variables: { workspaceId } },
        ],
      });

      if (result.data?.moveSharedDocuments?.success) {
        toast.success(
          `${result.data.moveSharedDocuments.movedCount} document(s) déplacé(s)`
        );
        return true;
      } else {
        throw new Error(
          result.data?.moveSharedDocuments?.message || "Erreur déplacement"
        );
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors du déplacement");
      throw error;
    }
  };

  return { move, loading };
}

// Hook pour supprimer des documents
export function useDeleteSharedDocuments() {
  const { workspaceId } = useWorkspace();
  const [deleteMutation, { loading }] = useMutation(DELETE_SHARED_DOCUMENTS);

  const deleteDocuments = async (ids) => {
    try {
      const result = await deleteMutation({
        variables: { ids, workspaceId },
        refetchQueries: [
          {
            query: GET_SHARED_DOCUMENTS,
            variables: { workspaceId, filter: {}, limit: 100, offset: 0 },
          },
          { query: GET_SHARED_FOLDERS, variables: { workspaceId } },
          { query: GET_SHARED_DOCUMENTS_STATS, variables: { workspaceId } },
        ],
      });

      if (result.data?.deleteSharedDocuments?.success) {
        toast.success("Document(s) supprimé(s)");
        return true;
      } else {
        throw new Error(
          result.data?.deleteSharedDocuments?.message || "Erreur suppression"
        );
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors de la suppression");
      throw error;
    }
  };

  return { deleteDocuments, loading };
}

// Hook pour créer un dossier
export function useCreateSharedFolder() {
  const { workspaceId } = useWorkspace();
  const [createMutation, { loading }] = useMutation(CREATE_SHARED_FOLDER);

  const create = async (input) => {
    try {
      const result = await createMutation({
        variables: { workspaceId, input },
        refetchQueries: [
          { query: GET_SHARED_FOLDERS, variables: { workspaceId } },
          { query: GET_SHARED_DOCUMENTS_STATS, variables: { workspaceId } },
        ],
      });

      if (result.data?.createSharedFolder?.success) {
        toast.success("Dossier créé");
        return result.data.createSharedFolder.folder;
      } else {
        throw new Error(
          result.data?.createSharedFolder?.message || "Erreur création"
        );
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors de la création");
      throw error;
    }
  };

  return { create, loading };
}

// Hook pour supprimer un dossier
export function useDeleteSharedFolder() {
  const { workspaceId } = useWorkspace();
  const [deleteMutation, { loading }] = useMutation(DELETE_SHARED_FOLDER);

  const deleteFolder = async (id) => {
    try {
      const result = await deleteMutation({
        variables: { id, workspaceId },
        refetchQueries: [
          { query: GET_SHARED_FOLDERS, variables: { workspaceId } },
          {
            query: GET_SHARED_DOCUMENTS,
            variables: { workspaceId, filter: {}, limit: 100, offset: 0 },
          },
          { query: GET_SHARED_DOCUMENTS_STATS, variables: { workspaceId } },
        ],
      });

      if (result.data?.deleteSharedFolder?.success) {
        toast.success("Dossier supprimé");
        return true;
      } else {
        throw new Error(
          result.data?.deleteSharedFolder?.message || "Erreur suppression"
        );
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors de la suppression");
      throw error;
    }
  };

  return { deleteFolder, loading };
}

// Hook pour renommer un document
export function useRenameSharedDocument() {
  const { workspaceId } = useWorkspace();
  const [updateMutation, { loading }] = useMutation(UPDATE_SHARED_DOCUMENT);

  const rename = async (id, newName) => {
    try {
      const result = await updateMutation({
        variables: {
          id,
          workspaceId,
          input: { name: newName },
        },
        refetchQueries: [
          {
            query: GET_SHARED_DOCUMENTS,
            variables: { workspaceId, filter: {}, limit: 100, offset: 0 },
          },
        ],
      });

      if (result.data?.updateSharedDocument?.success) {
        toast.success("Document renommé");
        return result.data.updateSharedDocument.document;
      } else {
        throw new Error(
          result.data?.updateSharedDocument?.message || "Erreur renommage"
        );
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors du renommage");
      throw error;
    }
  };

  return { rename, loading };
}

// Hook pour renommer un dossier
export function useRenameSharedFolder() {
  const { workspaceId } = useWorkspace();
  const [updateMutation, { loading }] = useMutation(UPDATE_SHARED_FOLDER);

  const rename = async (id, newName) => {
    try {
      const result = await updateMutation({
        variables: {
          id,
          workspaceId,
          input: { name: newName },
        },
        refetchQueries: [
          { query: GET_SHARED_FOLDERS, variables: { workspaceId } },
        ],
      });

      if (result.data?.updateSharedFolder?.success) {
        toast.success("Dossier renommé");
        return result.data.updateSharedFolder.folder;
      } else {
        throw new Error(
          result.data?.updateSharedFolder?.message || "Erreur renommage"
        );
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors du renommage");
      throw error;
    }
  };

  return { rename, loading };
}
