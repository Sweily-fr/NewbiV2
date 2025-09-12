import { useState, useCallback, useRef } from "react";
import { useSession, authClient } from "@/src/lib/auth-client";
import { useMutation } from "@apollo/client";
import {
  UPLOAD_DOCUMENT,
  DELETE_DOCUMENT,
} from "../graphql/mutations/documentUpload";
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

        // Sauvegarder automatiquement en BDD via better-auth
        try {
          console.log("🔄 Tentative de sauvegarde logo:", {
            organizationId: workspaceId,
            logoUrl: uploadData.url
          });
          
          const logoResult = await authClient.organization.update({
            organizationId: workspaceId,
            data: {
              logo: uploadData.url
            }
          });
          
          console.log("✅ Logo sauvegardé en BDD via better-auth:", logoResult);
          console.log("✅ Données retournées:", JSON.stringify(logoResult, null, 2));
        } catch (dbError) {
          console.error("❌ Erreur sauvegarde BDD:", dbError);
          console.error("❌ Détails erreur:", dbError.message, dbError.stack);
          // Ne pas faire échouer l'upload si la BDD échoue
          toast.error("Logo uploadé mais erreur de sauvegarde en base de données");
        }

        toast.success("Logo uploadé avec succès !");
        onUploadSuccess?.(uploadData.url);
        
        // Notifier que l'organisation doit être mise à jour
        onOrganizationUpdate?.();
        
        // Forcer le refetch immédiat pour s'assurer que l'UI se met à jour
        setTimeout(() => {
          onOrganizationUpdate?.();
        }, 100);
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
      onUploadSuccess,
      onOrganizationUpdate,
      previewUrl,
      workspaceId,
    ]
  );

  /**
   * Supprime l'image actuelle
   */
  const removeImage = useCallback(async () => {
    let suppressionCloudflareReussie = false;
    
    console.log("🔍 État avant suppression:", {
      currentFileKey,
      currentImageUrl,
      hasImage: !!(previewUrl || currentImageUrl)
    });
    
    // 1. Supprimer de Cloudflare d'abord
    try {
      // Si on n'a pas de currentFileKey mais qu'on a une URL, essayer d'extraire la clé
      let fileKeyToDelete = currentFileKey;
      
      if (!fileKeyToDelete && currentImageUrl) {
        // Extraire la clé depuis l'URL Cloudflare
        // Format: https://pub-xxx.r2.dev/signatures/userId/imgCompany/filename.ext
        const urlParts = currentImageUrl.split('/');
        if (urlParts.length >= 3) {
          const filename = urlParts[urlParts.length - 1]; // filename.ext
          const folder = urlParts[urlParts.length - 2]; // imgCompany
          const userId = urlParts[urlParts.length - 3]; // userId
          fileKeyToDelete = `signatures/${userId}/${folder}/${filename}`;
          console.log("🔑 Clé extraite de l'URL:", fileKeyToDelete);
        }
      }
      
      if (fileKeyToDelete) {
        console.log("🗑️ Suppression du logo sur Cloudflare:", fileKeyToDelete);
        await deleteDocument({
          variables: { key: fileKeyToDelete },
        });
        console.log("✅ Logo supprimé de Cloudflare avec succès");
        suppressionCloudflareReussie = true;
      } else {
        console.warn("⚠️ Aucune clé de fichier trouvée pour la suppression");
        suppressionCloudflareReussie = true; // Continuer quand même pour nettoyer la BDD
      }
    } catch (error) {
      console.error("❌ Erreur suppression Cloudflare:", error);
      // Ne pas arrêter - continuer pour nettoyer la BDD quand même
      suppressionCloudflareReussie = false;
    }

    // 2. Supprimer de la BDD OBLIGATOIREMENT (même si Cloudflare échoue)
    try {
      console.log("🗑️ Suppression du logo en BDD via better-auth");
      console.log("🔍 WorkspaceId utilisé:", workspaceId);
      
      const result = await authClient.organization.update({
        organizationId: workspaceId,
        data: {
          logo: null
        }
      });
      
      console.log("✅ Logo supprimé de la BDD avec succès:", result);
      console.log("✅ Données retournées par better-auth:", JSON.stringify(result, null, 2));
      
      if (suppressionCloudflareReussie) {
        toast.success("Logo supprimé avec succès");
      } else {
        toast.success("Logo supprimé de la base de données");
      }
    } catch (dbError) {
      console.error("❌ Erreur suppression BDD:", dbError);
      console.error("❌ Détails erreur BDD:", dbError.message);
      console.error("❌ Stack trace:", dbError.stack);
      console.error("❌ WorkspaceId problématique:", workspaceId);
      toast.error("Erreur lors de la suppression en base de données");
    }

    // 3. Nettoyer l'état local IMMÉDIATEMENT et AGRESSIVEMENT
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCurrentImageUrl(null);
    setCurrentFileKey(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Notifier immédiatement la suppression avec null explicite
    onUploadSuccess?.(null);
    
    // Forcer le nettoyage de tous les caches possibles
    if (typeof window !== 'undefined') {
      // Nettoyer localStorage et sessionStorage
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('logo') || key.includes('organization') || key.includes('company')) {
            localStorage.removeItem(key);
            console.log("🧹 Nettoyage localStorage:", key);
          }
        });
        
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
          if (key.includes('logo') || key.includes('organization') || key.includes('company')) {
            sessionStorage.removeItem(key);
            console.log("🧹 Nettoyage sessionStorage:", key);
          }
        });
      } catch (e) {
        console.warn("Erreur nettoyage storage:", e);
      }
    }
    
    // Forcer PLUSIEURS refetch pour s'assurer de la synchronisation
    console.log("🔄 Déclenchement des refetch multiples...");
    onOrganizationUpdate?.();
    setTimeout(() => {
      console.log("🔄 Refetch +100ms");
      onOrganizationUpdate?.();
    }, 100);
    setTimeout(() => {
      console.log("🔄 Refetch +500ms");
      onOrganizationUpdate?.();
    }, 500);
    setTimeout(() => {
      console.log("🔄 Refetch +1000ms");
      onOrganizationUpdate?.();
    }, 1000);
    setTimeout(() => {
      console.log("🔄 Refetch final +2000ms");
      onOrganizationUpdate?.();
    }, 2000);
  }, [
    currentFileKey,
    currentImageUrl,
    deleteDocument,
    previewUrl,
    onUploadSuccess,
    onOrganizationUpdate,
    workspaceId,
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
