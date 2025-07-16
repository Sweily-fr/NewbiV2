import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  UPLOAD_FILE_CHUNK,
  CREATE_FILE_TRANSFER_WITH_IDS,
  DELETE_FILE_TRANSFER,
  GENERATE_FILE_TRANSFER_PAYMENT_LINK,
  GET_MY_TRANSFERS,
} from "../graphql/mutations";
import { toast } from "@/src/components/ui/sonner";

export const useFileTransfer = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transferResult, setTransferResult] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [transferOptions, setTransferOptions] = useState({
    expiration: "7d",
    requirePayment: false,
    paymentAmount: 0,
    currency: "EUR",
    paymentDescription: "",
    recipientEmail: "",
    notifyOnDownload: false,
    passwordProtected: false,
    password: "",
    maxDownloads: null,
    customMessage: "",
  });

  // Mutations
  const [uploadFileChunkMutation] = useMutation(UPLOAD_FILE_CHUNK);
  const [createFileTransferWithIdsMutation] = useMutation(CREATE_FILE_TRANSFER_WITH_IDS);
  const [deleteFileTransferMutation] = useMutation(DELETE_FILE_TRANSFER);
  const [generatePaymentLinkMutation] = useMutation(
    GENERATE_FILE_TRANSFER_PAYMENT_LINK
  );

  // Queries
  const {
    data: transfersData,
    loading: transfersLoading,
    error: transfersError,
    refetch: refetchTransfers,
  } = useQuery(GET_MY_TRANSFERS, {
    variables: { page: 1, limit: 10 },
    fetchPolicy: "cache-and-network",
  });

  // Fonction pour ajouter des fichiers
  const addFiles = useCallback((files) => {
    const newFiles = Array.from(files).map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  // Fonction pour supprimer un fichier
  const removeFile = useCallback((fileId) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  // Fonction pour mettre à jour les options de transfert
  const updateTransferOptions = useCallback((options) => {
    setTransferOptions((prev) => ({ ...prev, ...options }));
  }, []);

  // Fonction pour calculer la taille totale
  const getTotalSize = useCallback(() => {
    return selectedFiles.reduce((total, file) => total + file.size, 0);
  }, [selectedFiles]);

  // Fonction pour formater la taille
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // Fonction pour convertir les options d'expiration en nombre de jours
  const getExpiryDaysFromOption = useCallback((expirationOption) => {
    switch (expirationOption) {
      case "24h":
        return 1;
      case "48h":
        return 2;
      case "7d":
        return 7;
      case "30d":
        return 30;
      default:
        return 7; // Par défaut 7 jours
    }
  }, []);

  // Fonction pour découper un fichier en chunks
  const chunkFile = (file, chunkSize = 2 * 1024 * 1024) => {
    const chunks = [];
    let offset = 0;

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize);
      chunks.push({
        data: chunk,
        index: chunks.length + 1,
        size: chunk.size,
        offset: offset,
      });
      offset += chunkSize;
    }

    return chunks;
  };

  // Fonction pour envoyer un chunk au serveur
  const uploadChunk = async (fileId, file, chunk, chunkIndex, totalChunks) => {
    const chunkFormData = new FormData();

    // Créer un blob à partir du chunk
    const chunkBlob = new Blob([chunk.data], { type: file.type });

    // Préparer la mutation GraphQL
    const operations = {
      query: `
        mutation UploadFileChunk($chunk: Upload!, $fileId: String!, $chunkIndex: Int!, $totalChunks: Int!, $fileName: String!, $fileSize: Int!) {
          uploadFileChunk(chunk: $chunk, fileId: $fileId, chunkIndex: $chunkIndex, totalChunks: $totalChunks, fileName: $fileName, fileSize: $fileSize) {
            chunkReceived
            fileCompleted
            fileId
          }
        }
      `,
      variables: {
        chunk: null,
        fileId: fileId,
        chunkIndex: chunkIndex,
        totalChunks: totalChunks,
        fileName: file.name,
        fileSize: file.size,
      },
    };

    chunkFormData.append("operations", JSON.stringify(operations));
    chunkFormData.append("map", JSON.stringify({ 0: ["variables.chunk"] }));
    chunkFormData.append("0", chunkBlob, `chunk-${chunkIndex}`);

    // Récupérer le token d'authentification
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: chunkFormData,
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erreur lors de l'upload du chunk ${chunkIndex}:`, error);
      throw error;
    }
  };

  // Générer un ID unique pour un fichier
  const generateFileId = () => {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  // Fonction pour uploader un fichier en chunks via GraphQL
  const uploadFileInChunks = async (files) => {
    const uploadedFileIds = [];

    for (const fileObj of files) {
      const file = fileObj.file;
      const chunks = chunkFile(file);
      const fileId = generateFileId(); // Générer un ID unique pour le fichier

      console.log(
        `📁 Upload du fichier: ${file.name} (${file.size} bytes) en ${chunks.length} chunks`
      );

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(
          `📤 Upload du chunk ${i + 1}/${chunks.length} pour ${file.name}`
        );

        try {
          const { data } = await uploadFileChunkMutation({
            variables: {
              chunk: chunk,
              fileId: fileId,
              chunkIndex: i,
              totalChunks: chunks.length,
              fileName: file.name,
              fileSize: file.size
            }
          });

          console.log(`Chunk ${i + 1} uploadé:`, data.uploadFileChunk);

          // Si le fichier est complètement uploadé, sortir de la boucle
          if (data.uploadFileChunk.fileCompleted) {
            console.log(`✅ Fichier ${file.name} complètement uploadé`);
            uploadedFileIds.push(data.uploadFileChunk.fileId);
            break;
          }
        } catch (error) {
          console.error(`Erreur lors de l'upload du chunk ${i + 1}:`, error);
          throw error;
        }
      }
    }

    console.log(`🎉 Tous les fichiers uploadés. IDs:`, uploadedFileIds);
    return uploadedFileIds;
  };

  // Fonction principale pour créer le transfert
  const createTransfer = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error("Veuillez ajouter au moins un fichier");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Fonction de calcul de date d'expiration (gardée pour compatibilité)
      const getExpiryDate = () => {
        const now = new Date();
        switch (transferOptions.expiration) {
          case "24h":
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
          case "48h":
            return new Date(now.getTime() + 48 * 60 * 60 * 1000);
          case "7d":
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          case "30d":
            return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          default:
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
      };

      // Debug: Afficher les fichiers sélectionnés
      console.log("Fichiers sélectionnés:", selectedFiles);

      // Vérifier que les fichiers sont bien des objets File valides
      const validFiles = selectedFiles.filter((f) => {
        const isValid =
          f && f.file && (f.file instanceof File || f.file instanceof Blob);
        console.log(
          `Fichier ${f?.name}: valide=${isValid}, type=${typeof f?.file}, constructor=${f?.file?.constructor?.name}`
        );
        return isValid;
      });

      console.log(
        `${validFiles.length} fichiers valides sur ${selectedFiles.length}`
      );

      if (validFiles.length === 0) {
        throw new Error(
          "Aucun fichier valide à uploader. Vérifiez que les fichiers sont correctement sélectionnés."
        );
      }

      // ÉTAPE 1: Uploader les fichiers en chunks
      console.log("🚀 Début de l'upload réel en chunks...");
      const uploadedFileIds = await uploadFileInChunks(validFiles);
      console.log("✅ Tous les fichiers ont été uploadés avec succès!");

      // ÉTAPE 2: Créer le transfert avec les IDs des fichiers
      console.log("📄 Création du transfert avec les IDs de fichiers...");
      
      // Préparer l'objet input selon la nouvelle structure backend
      const inputData = {
        expiryDays: transferOptions.expiryDays || 7,
        // Utiliser isPaymentRequired selon le schéma backend
        isPaymentRequired: transferOptions.isPaymentRequired || false,
        // Utiliser paymentCurrency selon le schéma backend
        ...(transferOptions.paymentAmount && {
          paymentAmount: Number(transferOptions.paymentAmount),
        }),
        ...(transferOptions.paymentCurrency && {
          paymentCurrency: transferOptions.paymentCurrency,
        }),
        ...(transferOptions.recipientEmail && {
          recipientEmail: transferOptions.recipientEmail,
        }),
        // NE PAS inclure le champ 'message' car il n'existe pas dans le schéma
      };

      console.log("Input data pour createFileTransferWithIds:", inputData);
      console.log("File IDs:", uploadedFileIds);
      // Utiliser la nouvelle mutation avec les IDs de fichiers
      const { data } = await createFileTransferWithIdsMutation({
        variables: {
          fileIds: uploadedFileIds,
          input: inputData,
        },
      });

      console.log("Réponse GraphQL:", data);
      
      // Vérifier que la réponse contient les données nécessaires
      if (data?.createFileTransferWithIds?.fileTransfer) {
        // Extraire les données du transfert créé
        const fileTransfer = data.createFileTransferWithIds.fileTransfer;
        const shareLink = data.createFileTransferWithIds.shareLink;
        const accessKey = data.createFileTransferWithIds.accessKey;

        const result = {
          success: true,
          shareLink,
          accessKey,
          expiryDate: fileTransfer.expiryDate,
          files: fileTransfer.files,
          fileTransfer,
          id: fileTransfer.id,
          status: fileTransfer.status,
          totalSize: fileTransfer.totalSize,
        };

        // Mettre à jour l'état et notifier l'utilisateur
        setTransferResult(result);
        toast.success("Transfert créé avec succès !");

        // Rafraîchir la liste des transferts
        refetchTransfers();

        // Réinitialiser les fichiers sélectionnés
        setSelectedFiles([]);

        return result;
      } else {
        console.error("Réponse API incorrecte:", data);
        throw new Error(
          "Erreur lors de la création du transfert: données manquantes dans la réponse"
        );
      }
      
      } catch (apolloError) {
        console.error("Erreur Apollo détaillée:", {
          message: apolloError.message,
          graphQLErrors: apolloError.graphQLErrors,
          networkError: apolloError.networkError,
          extraInfo: apolloError.extraInfo
        });
        
        // Si c'est une erreur GraphQL, afficher les détails
        if (apolloError.graphQLErrors && apolloError.graphQLErrors.length > 0) {
          const graphQLError = apolloError.graphQLErrors[0];
          console.error("Erreur GraphQL:", graphQLError.message);
          throw new Error(`Erreur GraphQL: ${graphQLError.message}`);
        }
        
        // Si c'est une erreur réseau, afficher les détails
        if (apolloError.networkError) {
          console.error("Erreur réseau:", apolloError.networkError);
          throw new Error(`Erreur réseau: ${apolloError.networkError.message}`);
        }
        
        throw apolloError;
      }
      
      } catch (apolloError) {
        console.error("Erreur Apollo détaillée:", {
          message: apolloError.message,
          graphQLErrors: apolloError.graphQLErrors,
          networkError: apolloError.networkError,
          extraInfo: apolloError.extraInfo
        });
        
        // Si c'est une erreur GraphQL, afficher les détails
        if (apolloError.graphQLErrors && apolloError.graphQLErrors.length > 0) {
          const graphQLError = apolloError.graphQLErrors[0];
          console.error("Erreur GraphQL:", graphQLError.message);
          throw new Error(`Erreur GraphQL: ${graphQLError.message}`);
        }
        
        // Si c'est une erreur réseau, afficher les détails
        if (apolloError.networkError) {
          console.error("Erreur réseau:", apolloError.networkError);
          throw new Error(`Erreur réseau: ${apolloError.networkError.message}`);
        }
        
        throw apolloError;
      }
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      const errorMessage =
        error.message || "Une erreur est survenue lors de l'upload";

      setTransferResult({
        success: false,
        error: errorMessage,
      });

      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [
    selectedFiles,
    transferOptions,
    uploadFileChunkMutation,
    createFileTransferWithIdsMutation,
    refetchTransfers,
  ]);

  // Fonction pour supprimer un transfert
  const deleteTransfer = useCallback(
    async (transferId) => {
      try {
        const { data } = await deleteFileTransferMutation({
          variables: { id: transferId },
        });

        if (data?.deleteFileTransfer?.success) {
          toast.success("Transfert supprimé avec succès");
          refetchTransfers();
        } else {
          throw new Error(
            data?.deleteFileTransfer?.message || "Erreur lors de la suppression"
          );
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error(
          error.message || "Erreur lors de la suppression du transfert"
        );
      }
    },
    [deleteFileTransferMutation, refetchTransfers]
  );

  // Fonction pour générer un lien de paiement
  const generatePaymentLink = useCallback(
    async (shareLink, accessKey) => {
      try {
        const { data } = await generatePaymentLinkMutation({
          variables: { shareLink, accessKey },
        });

        if (data?.generateFileTransferPaymentLink?.success) {
          return {
            success: true,
            checkoutUrl: data.generateFileTransferPaymentLink.checkoutUrl,
          };
        } else {
          throw new Error(
            data?.generateFileTransferPaymentLink?.message ||
              "Erreur lors de la génération du lien de paiement"
          );
        }
      } catch (error) {
        console.error(
          "Erreur lors de la génération du lien de paiement:",
          error
        );
        toast.error(
          error.message || "Erreur lors de la génération du lien de paiement"
        );
        throw error;
      }
    },
    [generatePaymentLinkMutation]
  );

  // Fonction pour copier le lien de partage
  const copyShareLink = useCallback(async (shareLink, accessKey) => {
    const fullLink = `${window.location.origin}/transfer/${shareLink}?key=${accessKey}`;

    try {
      await navigator.clipboard.writeText(fullLink);
      toast.success("Lien copié dans le presse-papiers !");
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      toast.error("Erreur lors de la copie du lien");
    }
  }, []);

  return {
    // État
    isUploading,
    uploadProgress,
    transferResult,
    selectedFiles,
    transferOptions,

    // Données des transferts
    transfers: transfersData?.myFileTransfers?.items || [],
    transfersLoading,
    transfersError,
    transfersPagination: {
      totalItems: transfersData?.myFileTransfers?.totalItems || 0,
      currentPage: transfersData?.myFileTransfers?.currentPage || 1,
      totalPages: transfersData?.myFileTransfers?.totalPages || 1,
      hasNextPage: transfersData?.myFileTransfers?.hasNextPage || false,
    },

    // Actions
    addFiles,
    removeFile,
    updateTransferOptions,
    createTransfer,
    deleteTransfer,
    generatePaymentLink,
    copyShareLink,
    refetchTransfers,

    // Utilitaires
    getTotalSize,
    formatFileSize,
  };
};
