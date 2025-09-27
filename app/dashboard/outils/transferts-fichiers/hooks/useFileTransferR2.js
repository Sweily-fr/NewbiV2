import { useState, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import { v4 as uuidv4 } from "uuid";
import {
  UPLOAD_FILE_CHUNK_TO_R2,
  CREATE_FILE_TRANSFER_WITH_IDS_R2,
} from "../graphql/mutations";

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB par chunk

export const useFileTransferR2 = (refetchTransfers) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transferResult, setTransferResult] = useState(null);

  // Mutations GraphQL
  const [uploadFileChunkToR2Mutation] = useMutation(UPLOAD_FILE_CHUNK_TO_R2);
  const [createFileTransferWithIdsR2Mutation] = useMutation(
    CREATE_FILE_TRANSFER_WITH_IDS_R2
  );

  /**
   * Divise un fichier en chunks
   */
  const createFileChunks = (file) => {
    const chunks = [];
    let start = 0;

    while (start < file.size) {
      const end = Math.min(start + CHUNK_SIZE, file.size);
      chunks.push(file.slice(start, end));
      start = end;
    }

    return chunks;
  };

  /**
   * Upload un fichier en chunks vers Cloudflare R2
   */
  const uploadFileInChunksToR2 = async (fileData) => {
    const { file, id: fileId } = fileData;
    const chunks = createFileChunks(file);
    const totalChunks = chunks.length;

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Créer un objet File pour le chunk (requis par GraphQL Upload)
        const chunkFile = new File([chunk], `chunk-${i}`, {
          type: "application/octet-stream",
        });

        const { data } = await uploadFileChunkToR2Mutation({
          variables: {
            chunk: chunkFile,
            fileId: fileId,
            chunkIndex: i,
            totalChunks: totalChunks,
            fileName: file.name,
            fileSize: file.size,
          },
        });

        if (!data?.uploadFileChunkToR2?.chunkReceived) {
          throw new Error(`Échec de l'upload du chunk ${i + 1}`);
        }

        // Mettre à jour le progrès
        const progress = ((i + 1) / totalChunks) * 100;
        setUploadProgress(progress);

        // Si c'est le dernier chunk et que le fichier est complet
        if (data.uploadFileChunkToR2.fileCompleted) {
          return fileId;
        }
      }

      return fileId;
    } catch (error) {
      console.error(`❌ Erreur upload R2 pour ${file.name}:`, error);
      throw new Error(`Échec de l'upload R2 de ${file.name}: ${error.message}`);
    }
  };

  /**
   * Upload plusieurs fichiers en chunks vers R2
   */
  const uploadMultipleFilesToR2 = async (files) => {
    const uploadedFileIds = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];

      try {
        const fileId = await uploadFileInChunksToR2(fileData);
        uploadedFileIds.push(fileId);

        // Mettre à jour le progrès global
        const globalProgress = ((i + 1) / totalFiles) * 100;
        setUploadProgress(globalProgress);
      } catch (error) {
        console.error(`❌ Erreur upload fichier ${fileData.file.name}:`, error);
        throw error;
      }
    }

    return uploadedFileIds;
  };

  /**
   * Créer un transfert de fichiers avec Cloudflare R2
   */
  const createTransferR2 = useCallback(
    async (transferOptions = {}) => {
      if (selectedFiles.length === 0) {
        toast.error("Veuillez ajouter au moins un fichier");
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress(0);
        setTransferResult(null);

        // Filtrer les fichiers valides
        const validFiles = selectedFiles.filter(
          (f) =>
            f && f.file && (f.file instanceof File || f.file instanceof Blob)
        );

        if (validFiles.length === 0) {
          throw new Error("Aucun fichier valide à uploader");
        }

        // Upload tous les fichiers en chunks vers R2
        const uploadedFileIds = await uploadMultipleFilesToR2(validFiles);

        // Préparer les options du transfert
        const inputData = {
          expiryDays: transferOptions.expiryDays || 7,
          isPaymentRequired: Boolean(transferOptions.isPaymentRequired),
          paymentAmount: transferOptions.paymentAmount
            ? Number(transferOptions.paymentAmount)
            : 0,
          paymentCurrency: transferOptions.paymentCurrency || "EUR",
          recipientEmail: transferOptions.recipientEmail || null,
          message: transferOptions.message || "",
        };

        // Créer le transfert avec les IDs des fichiers
        const { data, errors } = await createFileTransferWithIdsR2Mutation({
          variables: {
            fileIds: uploadedFileIds,
            input: inputData,
          },
        });

        if (errors) {
          console.error("❌ Erreurs GraphQL:", errors);
          throw new Error(
            `Erreurs GraphQL: ${errors.map((e) => e.message).join(", ")}`
          );
        }

        if (data?.createFileTransferWithIdsR2?.fileTransfer) {
          const fileTransfer = data.createFileTransferWithIdsR2.fileTransfer;

          const result = {
            success: true,
            shareLink: data.createFileTransferWithIdsR2.shareLink,
            accessKey: data.createFileTransferWithIdsR2.accessKey,
            expiryDate: fileTransfer.expiryDate,
            files: fileTransfer.files,
            fileTransfer,
            id: fileTransfer.id,
            status: fileTransfer.status,
            totalSize: fileTransfer.totalSize,
            storageType: "r2",
          };

          setTransferResult(result);
          toast.success("Transfert créé avec succès !");

          // Rafraîchir la liste des transferts
          if (refetchTransfers) {
            refetchTransfers();
          }

          // Réinitialiser les fichiers sélectionnés
          setSelectedFiles([]);

          return result;
        } else {
          throw new Error(
            "Erreur lors de la création du transfert R2: données manquantes dans la réponse"
          );
        }
      } catch (error) {
        console.error("❌ Erreur lors de l'upload R2:", error);

        const errorResult = {
          success: false,
          error: error.message || "Une erreur est survenue lors de l'upload R2",
        };

        setTransferResult(errorResult);
        toast.error(errorResult.error);

        throw error;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [
      selectedFiles,
      uploadFileChunkToR2Mutation,
      createFileTransferWithIdsR2Mutation,
      refetchTransfers,
    ]
  );

  /**
   * Ajouter des fichiers à la liste
   */
  const addFiles = useCallback((files) => {
    const newFiles = Array.from(files).map((file) => ({
      id: uuidv4(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  /**
   * Supprimer un fichier de la liste
   */
  const removeFile = useCallback((fileId) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  /**
   * Vider la liste des fichiers
   */
  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    setTransferResult(null);
  }, []);

  return {
    // État
    selectedFiles,
    isUploading,
    uploadProgress,
    transferResult,

    // Actions
    addFiles,
    removeFile,
    clearFiles,
    createTransfer: createTransferR2,

    // Métadonnées
    storageType: "r2",
    chunkSize: CHUNK_SIZE,
  };
};
