import { useState, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import { v4 as uuidv4 } from "uuid";
import {
  GENERATE_PRESIGNED_UPLOAD_URLS,
  CONFIRM_CHUNK_UPLOADED,
  CREATE_FILE_TRANSFER_WITH_IDS_R2,
} from "../graphql/mutations";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB par chunk

export const useFileTransferR2Direct = (refetchTransfers) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transferResult, setTransferResult] = useState(null);

  // Mutations GraphQL
  const [generatePresignedUrlsMutation] = useMutation(GENERATE_PRESIGNED_UPLOAD_URLS);
  const [confirmChunkUploadedMutation] = useMutation(CONFIRM_CHUNK_UPLOADED);
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
   * Upload un chunk directement vers R2 via presigned URL
   */
  const uploadChunkDirectToR2 = async (chunk, uploadUrl, chunkIndex) => {
    try {
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: chunk,
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error(`❌ Réponse R2:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText,
        });
        throw new Error(
          `Upload chunk ${chunkIndex} échoué: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return true;
    } catch (error) {
      console.error(`❌ Erreur upload chunk ${chunkIndex}:`, error);
      console.error(`❌ Type d'erreur:`, error.name);
      console.error(`❌ Message:`, error.message);
      throw error;
    }
  };

  /**
   * Upload un fichier en chunks directement vers R2
   */
  const uploadFileInChunksDirectToR2 = async (fileData) => {
    const { file, id: fileId } = fileData;
    const chunks = createFileChunks(file);
    const totalChunks = chunks.length;

    try {
      // Étape 1 : Obtenir les URLs signées
      const { data: urlsData, errors: urlErrors } = await generatePresignedUrlsMutation({
        variables: {
          fileId: fileId,
          totalChunks: totalChunks,
          fileName: file.name,
        },
      });

      if (urlErrors) {
        console.error("❌ Erreurs GraphQL lors de la génération des URLs:", urlErrors);
        throw new Error(`Erreurs GraphQL: ${urlErrors.map(e => e.message).join(", ")}`);
      }

      if (!urlsData?.generatePresignedUploadUrls?.uploadUrls) {
        console.error("❌ Réponse GraphQL invalide:", urlsData);
        throw new Error("Impossible d'obtenir les URLs signées");
      }

      const uploadUrls = urlsData.generatePresignedUploadUrls.uploadUrls;

      // Étape 2 : Upload des chunks en parallèle vers R2
      const CONCURRENT_UPLOADS = 5;
      let uploadedCount = 0;

      const uploadChunk = async (chunk, index) => {
        const urlInfo = uploadUrls.find((u) => u.chunkIndex === index);
        if (!urlInfo) {
          throw new Error(`URL manquante pour chunk ${index}`);
        }

        // Upload DIRECT vers R2
        await uploadChunkDirectToR2(chunk, urlInfo.uploadUrl, index);

        // Confirmer l'upload au serveur (léger, juste metadata)
        await confirmChunkUploadedMutation({
          variables: {
            fileId: fileId,
            chunkIndex: index,
            totalChunks: totalChunks,
            fileName: file.name,
            fileSize: file.size,
          },
        });

        uploadedCount++;
        const progress = (uploadedCount / totalChunks) * 100;
        setUploadProgress(progress);
      };

      // Upload par batch parallèle
      for (let i = 0; i < chunks.length; i += CONCURRENT_UPLOADS) {
        const batch = chunks.slice(i, i + CONCURRENT_UPLOADS);
        const batchPromises = batch.map((chunk, batchIndex) =>
          uploadChunk(chunk, i + batchIndex)
        );

        await Promise.all(batchPromises);

      }

      return fileId;
    } catch (error) {
      console.error(`❌ Erreur upload DIRECT pour ${file.name}:`, error);
      throw new Error(`Échec de l'upload DIRECT: ${error.message}`);
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
        const fileId = await uploadFileInChunksDirectToR2(fileData);
        uploadedFileIds.push(fileId);

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

        const validFiles = selectedFiles.filter(
          (f) =>
            f && f.file && (f.file instanceof File || f.file instanceof Blob)
        );

        if (validFiles.length === 0) {
          throw new Error("Aucun fichier valide à uploader");
        }

        // Upload tous les fichiers en chunks DIRECT vers R2
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

          if (refetchTransfers) {
            refetchTransfers();
          }

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
      generatePresignedUrlsMutation,
      confirmChunkUploadedMutation,
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
    storageType: "r2-direct",
    chunkSize: CHUNK_SIZE,
  };
};
