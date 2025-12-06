import { useState, useCallback, useRef } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import { v4 as uuidv4 } from "uuid";
import {
  START_MULTIPART_UPLOAD,
  COMPLETE_MULTIPART_UPLOAD,
  CREATE_FILE_TRANSFER_WITH_IDS_R2,
} from "../graphql/mutations";

// 50 MB par part (optimal pour S3 Multipart)
const OPTIMAL_PART_SIZE = 50 * 1024 * 1024;

// 10 uploads simultanés (au lieu de 5)
const MAX_CONCURRENT_UPLOADS = 10;

export const useFileTransferR2Multipart = (refetchTransfers) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transferResult, setTransferResult] = useState(null);
  const [isCancelled, setIsCancelled] = useState(false);

  // Ref pour l'AbortController (permet d'annuler les fetch en cours)
  const abortControllerRef = useRef(null);

  // Mutations GraphQL
  const [startMultipartUploadMutation] = useMutation(START_MULTIPART_UPLOAD);
  const [completeMultipartUploadMutation] = useMutation(
    COMPLETE_MULTIPART_UPLOAD
  );
  const [createFileTransferWithIdsR2Mutation] = useMutation(
    CREATE_FILE_TRANSFER_WITH_IDS_R2
  );

  /**
   * Divise un fichier en parts de 50 MB
   */
  const createFileParts = (file) => {
    const parts = [];
    let start = 0;

    while (start < file.size) {
      const end = Math.min(start + OPTIMAL_PART_SIZE, file.size);
      parts.push(file.slice(start, end));
      start = end;
    }

    return parts;
  };

  /**
   * Upload une part directement vers R2 via presigned URL
   */
  const uploadPartDirectToR2 = async (part, uploadUrl, partNumber, signal) => {
    try {
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: part,
        headers: {
          "Content-Type": "application/octet-stream",
        },
        signal, // Permet d'annuler le fetch
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `Upload part ${partNumber} échoué: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      // Récupérer l'ETag (CRUCIAL pour compléter le multipart)
      const etag = response.headers.get("etag");
      if (!etag) {
        throw new Error(`ETag manquant pour part ${partNumber}`);
      }

      return { partNumber, etag };
    } catch (error) {
      console.error(`❌ Erreur upload part ${partNumber}:`, error);
      throw error;
    }
  };

  /**
   * Upload un fichier en multipart natif S3/R2
   */
  const uploadFileInMultipartNative = async (
    fileData,
    transferId,
    fileIndex = 0,
    totalFiles = 1
  ) => {
    const { file, id: fileId } = fileData;
    const parts = createFileParts(file);
    const totalParts = parts.length;

    try {
      console.log(
        `🚀 Début Multipart Upload NATIF: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) en ${totalParts} parts de 50 MB`
      );

      // Étape 1 : Démarrer le multipart et obtenir les URLs presigned
      console.log(`📦 Démarrage multipart upload...`);
      const { data: startData, errors: startErrors } =
        await startMultipartUploadMutation({
          variables: {
            transferId: transferId,
            fileId: fileId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
            totalParts: totalParts,
          },
        });

      if (startErrors) {
        console.error("❌ Erreurs GraphQL lors du démarrage:", startErrors);
        throw new Error(
          `Erreurs GraphQL: ${startErrors.map((e) => e.message).join(", ")}`
        );
      }

      if (!startData?.startMultipartUpload) {
        console.error("❌ Réponse GraphQL invalide:", startData);
        throw new Error("Impossible de démarrer le multipart upload");
      }

      const { uploadId, key, presignedUrls } = startData.startMultipartUpload;
      console.log(`✅ Multipart Upload démarré: ${uploadId}`);
      console.log(`📋 ${presignedUrls.length} URLs presigned reçues`);

      // Étape 2 : Upload DIRECT des parts vers R2 en parallèle
      const uploadedParts = [];
      let uploadedCount = 0;

      const uploadPart = async (part, index) => {
        // Vérifier si annulé avant chaque upload
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Upload annulé");
        }

        const partNumber = index + 1;
        const urlInfo = presignedUrls.find((u) => u.partNumber === partNumber);

        if (!urlInfo) {
          throw new Error(`URL manquante pour part ${partNumber}`);
        }

        // Upload DIRECT vers R2 avec signal d'annulation
        const result = await uploadPartDirectToR2(
          part,
          urlInfo.uploadUrl,
          partNumber,
          abortControllerRef.current?.signal
        );

        uploadedCount++;

        // Calculer la progression globale en tenant compte de tous les fichiers
        const fileProgress = (uploadedCount / totalParts) * 100;
        const globalProgress =
          ((fileIndex + fileProgress / 100) / totalFiles) * 100;
        setUploadProgress(globalProgress);

        return result;
      };

      // Upload par batch parallèle
      for (let i = 0; i < parts.length; i += MAX_CONCURRENT_UPLOADS) {
        // Vérifier si annulé avant chaque batch
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Upload annulé");
        }

        const batch = parts.slice(i, i + MAX_CONCURRENT_UPLOADS);
        const batchPromises = batch.map((part, batchIndex) =>
          uploadPart(part, i + batchIndex)
        );

        const batchResults = await Promise.all(batchPromises);
        uploadedParts.push(...batchResults);

        console.log(
          `✅ Batch ${Math.floor(i / MAX_CONCURRENT_UPLOADS) + 1}/${Math.ceil(totalParts / MAX_CONCURRENT_UPLOADS)} uploadé (${uploadedParts.length}/${totalParts} parts)`
        );
      }

      console.log(
        `✅ Toutes les parts uploadées: ${uploadedParts.length}/${totalParts}`
      );

      // Étape 3 : Finaliser le multipart upload
      console.log(`🔧 Finalisation du multipart upload...`);
      const { data: completeData, errors: completeErrors } =
        await completeMultipartUploadMutation({
          variables: {
            uploadId: uploadId,
            key: key,
            parts: uploadedParts,
            transferId: transferId,
            fileId: fileId,
          },
        });

      if (completeErrors) {
        console.error(
          "❌ Erreurs GraphQL lors de la finalisation:",
          completeErrors
        );
        throw new Error(
          `Erreurs GraphQL: ${completeErrors.map((e) => e.message).join(", ")}`
        );
      }

      if (!completeData?.completeMultipartUpload?.success) {
        console.error("❌ Échec finalisation:", completeData);
        throw new Error("Échec de la finalisation du multipart upload");
      }

      console.log(
        `✅ Multipart Upload complété: ${completeData.completeMultipartUpload.key}`
      );
      console.log(
        `📊 Taille finale: ${(completeData.completeMultipartUpload.size / 1024 / 1024).toFixed(2)} MB`
      );

      return fileId;
    } catch (error) {
      // Si c'est une annulation, propager l'erreur sans message d'erreur
      if (
        error.name === "AbortError" ||
        error.message === "Upload annulé" ||
        error.message?.includes("aborted")
      ) {
        throw new Error("Upload annulé");
      }
      console.error(`❌ Erreur Multipart Upload pour ${file.name}:`, error);
      throw new Error(`Échec Multipart Upload: ${error.message}`);
    }
  };

  /**
   * Upload plusieurs fichiers
   */
  const uploadMultipleFilesToR2 = async (files, transferId) => {
    const uploadedFileIds = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];

      try {
        const fileId = await uploadFileInMultipartNative(
          fileData,
          transferId,
          i,
          totalFiles
        );
        uploadedFileIds.push(fileId);
      } catch (error) {
        // Si c'est une annulation, propager silencieusement
        if (error.message === "Upload annulé") {
          throw error;
        }
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
        // Créer un nouveau AbortController pour ce transfert
        abortControllerRef.current = new AbortController();
        setIsCancelled(false);
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

        // Générer un transferId unique
        const transferId = uuidv4();

        // Upload tous les fichiers en multipart natif vers R2
        const uploadedFileIds = await uploadMultipleFilesToR2(
          validFiles,
          transferId
        );

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
          // Nouvelles options
          notifyOnDownload: Boolean(transferOptions.notifyOnDownload),
          passwordProtected: Boolean(transferOptions.passwordProtected),
          password: transferOptions.password || null,
          allowPreview: transferOptions.allowPreview !== false,
          expiryReminderEnabled: Boolean(
            transferOptions.notifyBeforeExpiry ||
              transferOptions.expiryReminderEnabled
          ),
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
            storageType: "r2-multipart",
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
        // Vérifier si c'est une annulation
        if (error.name === "AbortError" || error.message === "Upload annulé") {
          console.log("🚫 Upload annulé par l'utilisateur");
          setIsCancelled(true);
          toast.info("Transfert annulé");
          return null;
        }

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
        abortControllerRef.current = null;
      }
    },
    [
      selectedFiles,
      startMultipartUploadMutation,
      completeMultipartUploadMutation,
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

  /**
   * Annuler le transfert en cours
   */
  const cancelTransfer = useCallback(() => {
    if (abortControllerRef.current) {
      console.log("🚫 Annulation du transfert...");
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    // État
    selectedFiles,
    isUploading,
    uploadProgress,
    transferResult,
    isCancelled,

    // Actions
    addFiles,
    removeFile,
    clearFiles,
    createTransfer: createTransferR2,
    cancelTransfer,

    // Métadonnées
    storageType: "r2-multipart-native",
    partSize: OPTIMAL_PART_SIZE,
    maxConcurrency: MAX_CONCURRENT_UPLOADS,
  };
};
