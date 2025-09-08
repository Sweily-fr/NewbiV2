"use client";

import React, { useState, useRef } from "react";
import { Upload, X, User, Building } from "lucide-react";
import { Button } from "@/src/components/ui/button";

/**
 * Composant de zone de drop pour l'upload d'images
 * Supporte le drag & drop et la sélection de fichiers
 */
export function ImageDropZone({
  onImageChange,
  currentImage,
  placeholder = "Cliquez ou glissez une image",
  className = "",
  size = "md", // sm, md, lg
  type = "profile", // profile, logo
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // État local pour la preview temporaire (seulement pendant l'upload)
  const [localPreview, setLocalPreview] = useState(null);

  const sizeClasses = {
    sm: type === "logo" ? "w-34 h-20" : "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const validateFile = (file) => {
    if (!file.type.startsWith("image/")) {
      return "Le fichier doit être une image";
    }
    if (file.size > maxSize) {
      return `La taille du fichier ne doit pas dépasser ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    return null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setError("");

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    // Simuler le traitement du fichier
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      onImageChange?.(imageUrl);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError("Erreur lors du chargement de l'image");
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsLoading(true);

    // Créer une preview locale temporaire
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);

    // Appeler la fonction d'upload
    try {
      await onImageChange?.(file);
      // Nettoyer la preview locale après upload réussi
      URL.revokeObjectURL(previewUrl);
      setLocalPreview(null);
    } catch (error) {
      // En cas d'erreur, garder la preview locale
      console.error("Erreur upload:", error);
    }

    setIsLoading(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();

    // Nettoyer la preview locale si elle existe
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }

    // Supprimer l'image
    onImageChange?.(null);
    setError("");
  };

  // Logique d'affichage des images :
  // 1. Si currentImage existe (URL Cloudflare), l'utiliser en priorité
  // 2. Sinon, utiliser localPreview (preview locale temporaire pendant upload)
  const displayImage = currentImage || localPreview;

  // Vérifier si l'image est une URL Cloudflare R2
  const isCloudflareUrl =
    displayImage &&
    typeof displayImage === "string" &&
    (displayImage.startsWith("http") || displayImage.startsWith("https"));

  // Nettoyer la preview locale quand le composant se démonte
  React.useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);
  const IconComponent = type === "profile" ? User : Building;

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          border border-dashed rounded-lg
          flex items-center justify-center
          cursor-pointer transition-all duration-200
          ${
            isDragOver
              ? "border-blue-500 bg-blue-50"
              : displayImage
                ? "border-gray-200 bg-gray-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }
          ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        title={placeholder}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isLoading}
        />

        {displayImage ? (
          <div className="relative w-full h-full">
            <img
              src={displayImage}
              alt="Preview"
              className={`w-full h-full ${isCloudflareUrl ? "object-contain" : "object-cover"} rounded-lg`}
              onError={(e) => {
                console.error("Erreur de chargement de l'image:", displayImage);
                // Éviter la boucle infinie en masquant l'image défaillante
                e.target.style.display = "none";
                // Afficher un message d'erreur à la place
                const errorDiv = document.createElement("div");
                errorDiv.className =
                  "flex items-center justify-center w-full h-full bg-gray-100 rounded-lg";
                errorDiv.innerHTML =
                  '<span class="text-gray-400 text-xs">Image non disponible</span>';
                e.target.parentNode.appendChild(errorDiv);
              }}
            />
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
              onClick={handleRemoveImage}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
            ) : (
              <>
                <IconComponent className={iconSizes[size]} />
                {/* {size !== "sm" && (
                  <Upload className={`${iconSizes[size]} mt-1`} />
                )} */}
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-500 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}

export default ImageDropZone;
