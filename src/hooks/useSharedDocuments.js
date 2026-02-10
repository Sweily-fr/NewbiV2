"use client";

import React from "react";
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
    $sortBy: String
    $sortOrder: String
  ) {
    sharedDocuments(
      workspaceId: $workspaceId
      filter: $filter
      limit: $limit
      offset: $offset
      sortBy: $sortBy
      sortOrder: $sortOrder
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
      trashedDocuments
      trashedFolders
      trashedSize
    }
  }
`;

// Query pour la corbeille
export const GET_TRASH_ITEMS = gql`
  query GetTrashItems($workspaceId: ID!) {
    trashItems(workspaceId: $workspaceId) {
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
        originalFolderId
        uploadedBy
        uploadedByName
        status
        trashedAt
        daysUntilPermanentDeletion
        createdAt
        updatedAt
      }
      folders {
        id
        name
        description
        workspaceId
        parentId
        originalParentId
        color
        icon
        trashedAt
        daysUntilPermanentDeletion
        createdAt
        updatedAt
      }
      totalDocuments
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

export const BULK_UPDATE_TAGS = gql`
  mutation BulkUpdateTags(
    $ids: [ID!]!
    $workspaceId: ID!
    $addTags: [String]
    $removeTags: [String]
  ) {
    bulkUpdateTags(
      ids: $ids
      workspaceId: $workspaceId
      addTags: $addTags
      removeTags: $removeTags
    ) {
      success
      message
      updatedCount
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
        parentId
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

// Mutations pour la corbeille
export const RESTORE_FROM_TRASH = gql`
  mutation RestoreFromTrash(
    $workspaceId: ID!
    $documentIds: [ID]
    $folderIds: [ID]
  ) {
    restoreFromTrash(
      workspaceId: $workspaceId
      documentIds: $documentIds
      folderIds: $folderIds
    ) {
      success
      message
      restoredDocuments
      restoredFolders
    }
  }
`;

export const EMPTY_TRASH = gql`
  mutation EmptyTrash($workspaceId: ID!) {
    emptyTrash(workspaceId: $workspaceId) {
      success
      message
    }
  }
`;

export const PERMANENTLY_DELETE_DOCUMENTS = gql`
  mutation PermanentlyDeleteDocuments($ids: [ID!]!, $workspaceId: ID!) {
    permanentlyDeleteDocuments(ids: $ids, workspaceId: $workspaceId) {
      success
      message
    }
  }
`;

export const PERMANENTLY_DELETE_FOLDERS = gql`
  mutation PermanentlyDeleteFolders($ids: [ID!]!, $workspaceId: ID!) {
    permanentlyDeleteFolders(ids: $ids, workspaceId: $workspaceId) {
      success
      message
    }
  }
`;

// Hook principal avec pagination
const DOCUMENTS_PER_PAGE = 50;

export function useSharedDocuments(filter = {}) {
  const { workspaceId } = useWorkspace();

  // Extraire les valeurs pour que Apollo détecte les changements
  const folderId = filter.folderId;
  const search = filter.search;
  const status = filter.status;
  const sortBy = filter.sortBy || "createdAt";
  const sortOrder = filter.sortOrder || "desc";
  // Filtres avancés
  const fileType = filter.fileType;
  const dateFrom = filter.dateFrom;
  const dateTo = filter.dateTo;
  const minSize = filter.minSize;
  const maxSize = filter.maxSize;

  const { data, loading, error, refetch, fetchMore, networkStatus } = useQuery(
    GET_SHARED_DOCUMENTS,
    {
      variables: {
        workspaceId,
        filter: {
          folderId,
          search,
          status,
          fileType,
          dateFrom,
          dateTo,
          minSize,
          maxSize,
        },
        limit: DOCUMENTS_PER_PAGE,
        offset: 0,
        sortBy,
        sortOrder,
      },
      skip: !workspaceId,
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    }
  );

  // Chargement initial (pas de données en cache)
  const isInitialLoading = loading && !data;

  // Fonction pour charger plus de documents
  const loadMore = async () => {
    const currentLength = data?.sharedDocuments?.documents?.length || 0;
    if (!data?.sharedDocuments?.hasMore) return;

    try {
      await fetchMore({
        variables: {
          offset: currentLength,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            sharedDocuments: {
              ...fetchMoreResult.sharedDocuments,
              documents: [
                ...(prev.sharedDocuments?.documents || []),
                ...(fetchMoreResult.sharedDocuments?.documents || []),
              ],
            },
          };
        },
      });
    } catch (err) {
      console.error("Error loading more documents:", err);
    }
  };

  return {
    documents: data?.sharedDocuments?.documents || [],
    total: data?.sharedDocuments?.total || 0,
    hasMore: data?.sharedDocuments?.hasMore || false,
    loading,
    isInitialLoading,
    isRefetching: loading && !!data,
    error,
    refetch,
    loadMore,
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
      trashedDocuments: 0,
      trashedFolders: 0,
      trashedSize: 0,
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
            variables: { workspaceId, filter: {}, limit: DOCUMENTS_PER_PAGE, offset: 0 },
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

  const move = async (ids, targetFolderId, { silent = false } = {}) => {
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
            variables: { workspaceId, filter: {}, limit: 50, offset: 0 },
          },
          { query: GET_SHARED_FOLDERS, variables: { workspaceId } },
        ],
        awaitRefetchQueries: false, // Don't wait for refetch to complete
      });

      if (result.data?.moveSharedDocuments?.success) {
        if (!silent) {
          toast.success(
            `${result.data.moveSharedDocuments.movedCount} document(s) déplacé(s)`
          );
        }
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

// Hook pour mettre à jour les tags en masse
export function useBulkUpdateTags() {
  const { workspaceId } = useWorkspace();
  const [updateTagsMutation, { loading }] = useMutation(BULK_UPDATE_TAGS);

  const bulkUpdateTags = async (ids, { addTags, removeTags } = {}) => {
    try {
      const result = await updateTagsMutation({
        variables: {
          ids,
          workspaceId,
          addTags,
          removeTags,
        },
        refetchQueries: [
          {
            query: GET_SHARED_DOCUMENTS,
            variables: { workspaceId, filter: {}, limit: 50, offset: 0 },
          },
        ],
        awaitRefetchQueries: false,
      });

      if (result.data?.bulkUpdateTags?.success) {
        toast.success(result.data.bulkUpdateTags.message);
        return true;
      } else {
        throw new Error(
          result.data?.bulkUpdateTags?.message || "Erreur mise à jour des tags"
        );
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors de la mise à jour des tags");
      throw error;
    }
  };

  return { bulkUpdateTags, loading };
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
            variables: { workspaceId, filter: {}, limit: DOCUMENTS_PER_PAGE, offset: 0 },
          },
          { query: GET_SHARED_FOLDERS, variables: { workspaceId } },
          { query: GET_SHARED_DOCUMENTS_STATS, variables: { workspaceId } },
          { query: GET_TRASH_ITEMS, variables: { workspaceId } },
        ],
      });

      if (result.data?.deleteSharedDocuments?.success) {
        toast.success("Document(s) déplacé(s) vers la corbeille");
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

  const create = async (input, { silent = false } = {}) => {
    try {
      const result = await createMutation({
        variables: { workspaceId, input },
        refetchQueries: [
          { query: GET_SHARED_FOLDERS, variables: { workspaceId } },
          { query: GET_SHARED_DOCUMENTS_STATS, variables: { workspaceId } },
        ],
      });

      if (result.data?.createSharedFolder?.success) {
        if (!silent) {
          toast.success("Dossier créé");
        }
        return result.data.createSharedFolder.folder;
      } else {
        throw new Error(
          result.data?.createSharedFolder?.message || "Erreur création"
        );
      }
    } catch (error) {
      if (!silent) {
        toast.error(error.message || "Erreur lors de la création");
      }
      throw error;
    }
  };

  return { create, loading };
}

// Dossiers par défaut pour les documents partagés
export const DEFAULT_SHARED_FOLDERS = [
  { name: "Factures", color: "#6366f1", icon: "receipt" },
  { name: "Devis", color: "#8b5cf6", icon: "file-text" },
  { name: "Notes de frais", color: "#ec4899", icon: "wallet" },
  { name: "Contrats", color: "#14b8a6", icon: "file-signature" },
  { name: "Bulletins de paie", color: "#f59e0b", icon: "file-badge" },
  { name: "Relevés bancaires", color: "#3b82f6", icon: "landmark" },
];

// Hook pour créer les dossiers par défaut
export function useCreateDefaultFolders() {
  const { workspaceId } = useWorkspace();
  const [createMutation] = useMutation(CREATE_SHARED_FOLDER);
  const [isCreating, setIsCreating] = React.useState(false);

  const createDefaultFolders = async (existingFolderNames = []) => {
    // Ne pas exécuter si workspaceId n'est pas disponible
    if (!workspaceId) {
      console.warn("createDefaultFolders: workspaceId not available");
      return [];
    }

    setIsCreating(true);
    const foldersToCreate = DEFAULT_SHARED_FOLDERS.filter(
      (folder) => !existingFolderNames.includes(folder.name)
    );

    if (foldersToCreate.length === 0) {
      setIsCreating(false);
      return [];
    }

    const createdFolders = [];

    for (const folder of foldersToCreate) {
      try {
        const result = await createMutation({
          variables: {
            workspaceId,
            input: {
              name: folder.name,
              color: folder.color,
              icon: folder.icon,
              isSystem: true, // Dossiers par défaut non supprimables
            },
          },
        });

        if (result.data?.createSharedFolder?.success) {
          createdFolders.push(result.data.createSharedFolder.folder);
        }
      } catch (error) {
        console.error(`Erreur création dossier ${folder.name}:`, error);
      }
    }

    setIsCreating(false);
    return createdFolders;
  };

  return { createDefaultFolders, isCreating, workspaceId };
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
            variables: { workspaceId, filter: {}, limit: DOCUMENTS_PER_PAGE, offset: 0 },
          },
          { query: GET_SHARED_DOCUMENTS_STATS, variables: { workspaceId } },
          { query: GET_TRASH_ITEMS, variables: { workspaceId } },
        ],
      });

      if (result.data?.deleteSharedFolder?.success) {
        toast.success("Dossier déplacé vers la corbeille");
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
            variables: { workspaceId, filter: {}, limit: DOCUMENTS_PER_PAGE, offset: 0 },
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

// Hook pour mettre à jour un document (tags, description, etc.)
export function useUpdateSharedDocument() {
  const { workspaceId } = useWorkspace();
  const [updateMutation, { loading }] = useMutation(UPDATE_SHARED_DOCUMENT);

  const update = async (id, input) => {
    try {
      const result = await updateMutation({
        variables: {
          id,
          workspaceId,
          input,
        },
        refetchQueries: [
          {
            query: GET_SHARED_DOCUMENTS,
            variables: { workspaceId, filter: {}, limit: 50, offset: 0 },
          },
        ],
      });

      if (result.data?.updateSharedDocument?.success) {
        return result.data.updateSharedDocument.document;
      } else {
        throw new Error(
          result.data?.updateSharedDocument?.message || "Erreur mise à jour"
        );
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors de la mise à jour");
      throw error;
    }
  };

  return { update, loading };
}

// Hook pour déplacer un dossier (changer son parent)
export function useMoveSharedFolder() {
  const { workspaceId } = useWorkspace();
  const [updateMutation, { loading }] = useMutation(UPDATE_SHARED_FOLDER);

  const moveFolder = async (folderId, newParentId, { silent = false } = {}) => {
    try {
      const result = await updateMutation({
        variables: {
          id: folderId,
          workspaceId,
          input: { parentId: newParentId },
        },
        refetchQueries: [
          { query: GET_SHARED_FOLDERS, variables: { workspaceId } },
          {
            query: GET_SHARED_DOCUMENTS,
            variables: { workspaceId, filter: {}, limit: 50, offset: 0 },
          },
        ],
        awaitRefetchQueries: false, // Don't wait for refetch to complete
      });

      if (result.data?.updateSharedFolder?.success) {
        if (!silent) {
          toast.success("Dossier déplacé");
        }
        return result.data.updateSharedFolder.folder;
      } else {
        throw new Error(
          result.data?.updateSharedFolder?.message || "Erreur déplacement"
        );
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors du déplacement");
      throw error;
    }
  };

  return { moveFolder, loading };
}

/**
 * Hook pour télécharger un dossier en ZIP
 */
export function useDownloadFolder() {
  const { workspaceId } = useWorkspace();
  const [loading, setLoading] = React.useState(false);

  const downloadFolder = async (folderId, folderName) => {
    if (!workspaceId || !folderId) {
      toast.error("Paramètres manquants");
      return;
    }

    // Récupérer le token d'authentification
    const token = localStorage.getItem("bearer_token");
    if (!token) {
      toast.error("Non authentifié");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Préparation du téléchargement...");

    try {
      // Utiliser la route API Next.js (proxy vers le backend)
      const response = await fetch(
        `/api/shared-documents/download-folder?folderId=${folderId}&workspaceId=${workspaceId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Essayer de parser l'erreur JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw new Error(error.message || "Erreur lors du téléchargement");
        } else {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
      }

      // Créer un blob et le télécharger
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${folderName || "dossier"}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss(loadingToast);
      toast.success("Dossier téléchargé avec succès");
    } catch (error) {
      console.error("Erreur téléchargement dossier:", error);
      toast.dismiss(loadingToast);
      toast.error(error.message || "Erreur lors du téléchargement");
    } finally {
      setLoading(false);
    }
  };

  return { downloadFolder, loading };
}

/**
 * Hook pour télécharger une sélection de dossiers/documents en ZIP
 */
export function useDownloadSelection() {
  const { workspaceId } = useWorkspace();
  const [loading, setLoading] = React.useState(false);

  const downloadSelection = async ({ folderIds = [], documentIds = [], excludedFolderIds = [] } = {}) => {
    if (!workspaceId) {
      toast.error("Paramètres manquants");
      return;
    }

    if (folderIds.length === 0 && documentIds.length === 0) {
      toast.error("Aucun élément sélectionné");
      return;
    }

    const token = localStorage.getItem("bearer_token");
    if (!token) {
      toast.error("Non authentifié");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Préparation du téléchargement...");

    try {
      const response = await fetch("/api/shared-documents/download-selection", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderIds, documentIds, excludedFolderIds, workspaceId }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw new Error(error.message || "Erreur lors du téléchargement");
        } else {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "documents.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss(loadingToast);
      toast.success("Téléchargement terminé");
    } catch (error) {
      console.error("Erreur téléchargement sélection:", error);
      toast.dismiss(loadingToast);
      toast.error(error.message || "Erreur lors du téléchargement");
    } finally {
      setLoading(false);
    }
  };

  return { downloadSelection, loading };
}

/**
 * Hook pour récupérer les infos d'une sélection (sous-dossiers, taille, etc.)
 */
export function useSelectionInfo() {
  const { workspaceId } = useWorkspace();
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(null);

  const fetchSelectionInfo = async ({ folderIds = [], documentIds = [] } = {}) => {
    if (!workspaceId) return null;

    const token = localStorage.getItem("bearer_token");
    if (!token) return null;

    setLoading(true);
    try {
      const response = await fetch("/api/shared-documents/selection-info", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderIds, documentIds, workspaceId }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des informations");
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
        return result.data;
      }
      return null;
    } catch (error) {
      console.error("Erreur récupération info sélection:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchSelectionInfo, data, loading };
}

// ==================== HOOKS POUR LA CORBEILLE ====================

/**
 * Hook pour récupérer les éléments de la corbeille
 */
export function useTrashItems() {
  const { workspaceId } = useWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_TRASH_ITEMS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const isInitialLoading = loading && !data;

  return {
    documents: data?.trashItems?.documents || [],
    folders: data?.trashItems?.folders || [],
    totalDocuments: data?.trashItems?.totalDocuments || 0,
    totalFolders: data?.trashItems?.totalFolders || 0,
    totalSize: data?.trashItems?.totalSize || 0,
    loading,
    isInitialLoading,
    isRefetching: loading && !!data,
    error,
    refetch,
  };
}

/**
 * Hook pour restaurer des éléments de la corbeille
 */
export function useRestoreFromTrash() {
  const { workspaceId } = useWorkspace();
  const [restoreMutation, { loading }] = useMutation(RESTORE_FROM_TRASH);

  const restore = async ({ documentIds = [], folderIds = [] } = {}) => {
    try {
      const result = await restoreMutation({
        variables: {
          workspaceId,
          documentIds: documentIds.length > 0 ? documentIds : null,
          folderIds: folderIds.length > 0 ? folderIds : null,
        },
        refetchQueries: [
          { query: GET_TRASH_ITEMS, variables: { workspaceId } },
          {
            query: GET_SHARED_DOCUMENTS,
            variables: { workspaceId, filter: {}, limit: DOCUMENTS_PER_PAGE, offset: 0 },
          },
          { query: GET_SHARED_FOLDERS, variables: { workspaceId } },
          { query: GET_SHARED_DOCUMENTS_STATS, variables: { workspaceId } },
        ],
      });

      if (result.data?.restoreFromTrash?.success) {
        const { restoredDocuments, restoredFolders } = result.data.restoreFromTrash;
        const parts = [];
        if (restoredDocuments > 0) parts.push(`${restoredDocuments} document(s)`);
        if (restoredFolders > 0) parts.push(`${restoredFolders} dossier(s)`);
        toast.success(`${parts.join(" et ")} restauré(s)`);
        return true;
      } else {
        throw new Error(
          result.data?.restoreFromTrash?.message || "Erreur restauration"
        );
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors de la restauration");
      throw error;
    }
  };

  return { restore, loading };
}

/**
 * Hook pour vider la corbeille
 */
export function useEmptyTrash() {
  const { workspaceId } = useWorkspace();
  const [emptyMutation, { loading }] = useMutation(EMPTY_TRASH);

  const emptyTrash = async () => {
    try {
      const result = await emptyMutation({
        variables: { workspaceId },
        refetchQueries: [
          { query: GET_TRASH_ITEMS, variables: { workspaceId } },
          { query: GET_SHARED_DOCUMENTS_STATS, variables: { workspaceId } },
        ],
      });

      if (result.data?.emptyTrash?.success) {
        toast.success("Corbeille vidée");
        return true;
      } else {
        throw new Error(
          result.data?.emptyTrash?.message || "Erreur vidage corbeille"
        );
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors du vidage de la corbeille");
      throw error;
    }
  };

  return { emptyTrash, loading };
}

/**
 * Hook pour supprimer définitivement des documents
 */
export function usePermanentlyDeleteDocuments() {
  const { workspaceId } = useWorkspace();
  const [deleteMutation, { loading }] = useMutation(PERMANENTLY_DELETE_DOCUMENTS);

  const permanentlyDelete = async (ids) => {
    try {
      const result = await deleteMutation({
        variables: { ids, workspaceId },
        refetchQueries: [
          { query: GET_TRASH_ITEMS, variables: { workspaceId } },
          { query: GET_SHARED_DOCUMENTS_STATS, variables: { workspaceId } },
        ],
      });

      if (result.data?.permanentlyDeleteDocuments?.success) {
        toast.success("Document(s) supprimé(s) définitivement");
        return true;
      } else {
        throw new Error(
          result.data?.permanentlyDeleteDocuments?.message || "Erreur suppression"
        );
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors de la suppression définitive");
      throw error;
    }
  };

  return { permanentlyDelete, loading };
}

/**
 * Hook pour supprimer définitivement des dossiers
 */
export function usePermanentlyDeleteFolders() {
  const { workspaceId } = useWorkspace();
  const [deleteMutation, { loading }] = useMutation(PERMANENTLY_DELETE_FOLDERS);

  const permanentlyDelete = async (ids) => {
    try {
      const result = await deleteMutation({
        variables: { ids, workspaceId },
        refetchQueries: [
          { query: GET_TRASH_ITEMS, variables: { workspaceId } },
          { query: GET_SHARED_FOLDERS, variables: { workspaceId } },
          { query: GET_SHARED_DOCUMENTS_STATS, variables: { workspaceId } },
        ],
      });

      if (result.data?.permanentlyDeleteFolders?.success) {
        toast.success("Dossier(s) supprimé(s) définitivement");
        return true;
      } else {
        throw new Error(
          result.data?.permanentlyDeleteFolders?.message || "Erreur suppression"
        );
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors de la suppression définitive");
      throw error;
    }
  };

  return { permanentlyDelete, loading };
}
