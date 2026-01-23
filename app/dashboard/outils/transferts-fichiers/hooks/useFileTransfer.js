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
  const [createFileTransferWithIdsMutation] = useMutation(
    CREATE_FILE_TRANSFER_WITH_IDS
  );
  const [deleteFileTransferMutation] = useMutation(DELETE_FILE_TRANSFER);
  const [generatePaymentLinkMutation] = useMutation(
    GENERATE_FILE_TRANSFER_PAYMENT_LINK
  );

  // Query pour récupérer les transferts
  const {
    data: transfersData,
    loading: transfersLoading,
    error: transfersError,
    refetch: refetchTransfers,
  } = useQuery(GET_MY_TRANSFERS, {
    variables: { page: 1, limit: 50 },
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  // Fonction pour découper un fichier en chunks
  const chunkFile = (file, chunkSize = 2 * 1024 * 1024) => {
    const chunks = [];
    let start = 0;

    while (start < file.size) {
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      chunks.push({
        data: chunk,
        index: chunks.length,
        size: chunk.size,
      });
      start = end;
    }

    return chunks;
  };

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

  // Fonction pour calculer la taille totale des fichiers sélectionnés
  const getTotalSize = useCallback(() => {
    return selectedFiles.reduce(
      (total, file) => total + (file.file?.size || 0),
      0
    );
  }, [selectedFiles]);

  // Fonction pour formater la taille
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // Générer un ID unique pour un fichier
  const generateFileId = () => {
    return "file_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  };

  // Fonction pour uploader un fichier en chunks via GraphQL
  const uploadFileInChunks = async (files) => {
    const uploadedFileIds = [];

    for (const fileObj of files) {
      const file = fileObj.file;
      const chunks = chunkFile(file);
      const fileId = generateFileId(); // Générer un ID unique pour le fichier

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        try {
          // Créer un File à partir du Blob du chunk pour l'upload GraphQL
          const chunkFile = new File([chunk.data], file.name, {
            type: file.type,
          });

          const { data } = await uploadFileChunkMutation({
            variables: {
              chunk: chunkFile,
              fileId: fileId,
              chunkIndex: i,
              totalChunks: chunks.length,
              fileName: file.name,
              fileSize: file.size,
            },
          });

          // Si le fichier est complètement uploadé, sortir de la boucle
          if (data.uploadFileChunk.fileCompleted) {
            uploadedFileIds.push(data.uploadFileChunk.fileId);
            break;
          }
        } catch (error) {
          console.error(`Erreur lors de l'upload du chunk ${i + 1}:`, error);
          throw error;
        }
      }
    }

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

      // Debug: Afficher les fichiers sélectionnés

      // Vérifier que les fichiers sont bien des objets File valides
      const validFiles = selectedFiles.filter((f) => {
        const isValid =
          f && f.file && (f.file instanceof File || f.file instanceof Blob);

        return isValid;
      });

      if (validFiles.length === 0) {
        throw new Error(
          "Aucun fichier valide à uploader. Vérifiez que les fichiers sont correctement sélectionnés."
        );
      }

      // ÉTAPE 1: Uploader les fichiers en chunks
      const uploadedFileIds = await uploadFileInChunks(validFiles);

      // ÉTAPE 2: Créer le transfert avec les IDs des fichiers

      // Préparer l'objet input selon la nouvelle structure backend
      // Essayons une structure alternative basée sur les mémoires
      const inputData = {
        // Champs obligatoires avec valeurs par défaut
        expiryDays: transferOptions.expiryDays || 7,

        // Utiliser requirePayment au lieu de isPaymentRequired (selon certaines mémoires)
        requirePayment: Boolean(transferOptions.isPaymentRequired) || false,

        // Champs conditionnels avec valeurs par défaut si nécessaire
        paymentAmount: transferOptions.paymentAmount
          ? Number(transferOptions.paymentAmount)
          : 0,
        currency: transferOptions.paymentCurrency || "EUR", // Utiliser currency au lieu de paymentCurrency

        // Champ optionnel
        recipientEmail: transferOptions.recipientEmail || null,

        // Ajouter un champ message vide (selon certaines mémoires)
        message: "",
      };

      // Utiliser la nouvelle mutation avec les IDs de fichiers
      const { data } = await createFileTransferWithIdsMutation({
        variables: {
          fileIds: uploadedFileIds,
          input: inputData,
        },
      });

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

        // Réinitialiser les fichiers sélectionnés
        setSelectedFiles([]);

        // Forcer le refetch pour s'assurer que les données sont à jour
        await refetchTransfers();

        return result;
      } else {
        console.error("Réponse API incorrecte:", data);
        throw new Error(
          "Erreur lors de la création du transfert: données manquantes dans la réponse"
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);

      // Analyse détaillée de l'erreur pour un meilleur diagnostic
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        // Extraire les messages d'erreur spécifiques
        const graphQLErrorMessages = error.graphQLErrors
          .map((err) => {
            return err.message || "Erreur GraphQL non spécifiée";
          })
          .join(", ");

        toast.error(`Erreur serveur: ${graphQLErrorMessages}`);
      } else if (error.networkError) {
        toast.error(
          `Erreur réseau: ${error.networkError.message || "Problème de connexion au serveur"}`
        );
      } else {
        const errorMessage =
          error.message ||
          "Une erreur est survenue lors de la création du transfert";
        toast.error(errorMessage);
      }

      setTransferResult({
        success: false,
        error: error.message || "Une erreur est survenue lors de l'upload",
      });

      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [
    selectedFiles,
    transferOptions,
    createFileTransferWithIdsMutation,
    uploadFileInChunks,
    refetchTransfers,
  ]);

  // Fonction pour supprimer un transfert
  const deleteTransfer = useCallback(
    async (transferId) => {
      try {
        const { data } = await deleteFileTransferMutation({
          variables: { id: transferId },
        });

        if (data.deleteFileTransfer) {
          toast.success("Transfert supprimé avec succès");
          refetchTransfers();
        } else {
          toast.error("Erreur lors de la suppression du transfert");
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

        if (data.generateFileTransferPaymentLink.success) {
          return data.generateFileTransferPaymentLink.checkoutUrl;
        } else {
          throw new Error(data.generateFileTransferPaymentLink.message);
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
  const copyShareLink = useCallback((shareLink, accessKey) => {
    const fullLink = `${window.location.origin}/transfer/${shareLink}?key=${accessKey}`;
    navigator.clipboard.writeText(fullLink);
    toast.success("Lien copié dans le presse-papiers !");
  }, []);

  // Extraire les transferts de la réponse GraphQL et dédupliquer par ID
  const rawTransfers = transfersData?.myFileTransfers?.items || [];

  // Déduplication des transferts par ID
  const transfers = rawTransfers.reduce((acc, transfer) => {
    const existingIndex = acc.findIndex((t) => t.id === transfer.id);
    if (existingIndex === -1) {
      acc.push(transfer);
    }
    return acc;
  }, []);

  return {
    // États
    isUploading,
    uploadProgress,
    transferResult,
    selectedFiles,
    transferOptions,
    transfers, // Exposer les transferts extraits au lieu de transfersData
    transfersLoading,
    transfersError,

    // Fonctions de gestion des fichiers
    setSelectedFiles,
    setTransferOptions,
    addFiles,
    removeFile,
    updateTransferOptions,
    getTotalSize,
    formatFileSize,

    // Fonctions principales
    createTransfer,
    deleteTransfer,
    generatePaymentLink,
    copyShareLink,
    refetchTransfers,
  };
};
