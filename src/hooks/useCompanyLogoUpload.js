import { useState, useCallback, useRef } from "react";
import { useSession } from "@/src/lib/auth-client";
import { useMutation } from "@apollo/client";
import {
  UPLOAD_DOCUMENT,
  DELETE_DOCUMENT,
} from "../graphql/mutations/documentUpload";
import { UPDATE_COMPANY_LOGO } from "../graphql/mutations/user";
import { toast } from "@/src/components/ui/sonner";
import { useWorkspace } from "./useWorkspace";

/**
 * Hook simplifié pour l'upload de logo d'entreprise sur Cloudflare uniquement
 * - Upload direct sur Cloudflare (pas de BDD)
 * - Suppression automatique de l'ancienne image
 * - Gestion des erreurs simplifiée
 */
export const useCompanyLogoUpload = ({ onUploadSuccess, onOrganizationUpdate }) => {
  const { data: session } = useSession();
  const { workspaceId } = useWorkspace();
  const fileInputRef = useRef(null);

  // États locaux
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [currentFileKey, setCurrentFileKey] = useState(null);

  // Mutations GraphQL
  const [uploadDocument] = useMutation(UPLOAD_DOCUMENT);
  const [deleteDocument] = useMutation(DELETE_DOCUMENT);
  const [updateCompanyLogo] = useMutation(UPDATE_COMPANY_LOGO);

  /**
   * Ouvre le sélecteur de fichier
   */
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Validation simple du fichier
   */
  const validateFile = (file) => {
    if (!file.type.startsWith("image/")) {
      return { isValid: false, error: "Veuillez sélectionner une image" };
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      return { isValid: false, error: "L'image doit faire moins de 5MB" };
    }
    return { isValid: true };
  };

  /**
   * Gère la sélection et l'upload d'un fichier
   */
  const handleFileSelect = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!session?.user?.id) {
        toast.error("Vous devez être connecté");
        return;
      }

      const validation = validateFile(file);
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress(0);

        // Supprimer l'ancienne image si elle existe
        if (currentFileKey) {
          await deleteDocument({
            variables: { key: currentFileKey },
          });
        }

        // Prévisualisation
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);

        // Renommer le fichier pour détection backend
        const fileExtension = file.name.split(".").pop();
        const logoFileName = `company-logo-${Date.now()}.${fileExtension}`;
        const renamedFile = new File([file], logoFileName, {
          type: file.type,
          lastModified: file.lastModified,
        });

        // Upload
        const result = await uploadDocument({
          variables: {
            file: renamedFile,
          },
        });

        const uploadData = result.data.uploadDocument;
        setCurrentImageUrl(uploadData.url);
        setCurrentFileKey(uploadData.key);

        // Ne pas sauvegarder automatiquement en BDD - laisser le formulaire principal gérer cela
        // pour éviter les conflits entre les deux systèmes de sauvegarde

        toast.success("Logo uploadé avec succès !");
        onUploadSuccess?.(uploadData.url);
        
        // Sauvegarder automatiquement dans l'organisation si la fonction est fournie
        if (onOrganizationUpdate) {
          console.log("🏢 Appel de onOrganizationUpdate avec:", uploadData.url);
          onOrganizationUpdate(uploadData.url);
        }
      } catch (error) {
        console.error("Erreur upload:", error);
        toast.error("Erreur lors de l'upload");

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [
      session?.user?.id,
      currentFileKey,
      uploadDocument,
      deleteDocument,
      updateCompanyLogo,
      onUploadSuccess,
      onOrganizationUpdate,
      previewUrl,
    ]
  );

  /**
   * Supprime l'image actuelle
   */
  const removeImage = useCallback(async () => {
    try {
      if (currentFileKey) {
        await deleteDocument({
          variables: { key: currentFileKey },
        });
        toast.success("Logo supprimé avec succès");
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    }

    // Ne pas sauvegarder automatiquement en BDD - laisser le formulaire principal gérer cela

    // Nettoyer l'état local
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCurrentImageUrl(null);
    setCurrentFileKey(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    onUploadSuccess?.(null);
  }, [
    currentFileKey,
    deleteDocument,
    previewUrl,
    onUploadSuccess,
    updateCompanyLogo,
  ]);

  /**
   * Définit une image existante
   */
  const setExistingImage = useCallback((imageUrl, fileKey = null) => {
    setCurrentImageUrl(imageUrl);
    setCurrentFileKey(fileKey);
    setPreviewUrl(null);
  }, []);

  /**
   * Obtient l'URL à afficher
   */
  const getDisplayImageUrl = useCallback(() => {
    return previewUrl || currentImageUrl;
  }, [previewUrl, currentImageUrl]);

  return {
    // État
    isUploading,
    uploadProgress,
    previewUrl,
    currentImageUrl,
    currentFileKey,

    // Refs
    fileInputRef,

    // Actions
    openFileDialog,
    handleFileSelect,
    removeImage,
    setExistingImage,
    getDisplayImageUrl,

    // Utilitaires
    hasImage: !!(previewUrl || currentImageUrl),
    isNewImage: !!previewUrl,
    isAuthenticated: !!session?.user?.id,
  };
};