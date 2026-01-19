"use client";

import React, { useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import AlignmentSelector from "@/src/components/ui/alignment-selector";
import { Square, X, Upload, Circle, Image as ImageIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { useImageUpload } from "../../../../hooks/useImageUpload";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import { toast } from "@/src/components/ui/sonner";
import { optimizeImage } from "../../../../utils/imageOptimizer";

export default function ProfileImageSection({
  signatureData,
  updateSignatureData,
}) {
  const { deleteImageFile, uploadImageFile } = useImageUpload();
  const { editingSignatureId } = useSignatureData();
  const [isOpen, setIsOpen] = useState(false);

  // Gestion de l'espacement entre prénom et nom
  const handleNameSpacingChange = (value) => {
    const numValue = parseInt(value) || 0;
    updateSignatureData("nameSpacing", Math.max(0, Math.min(20, numValue))); // Entre 0 et 20px
  };

  // Gestion de la taille de l'image de profil
  const handleImageSizeChange = (value) => {
    if (value === "" || value === null) {
      updateSignatureData("imageSize", 1);
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      updateSignatureData("imageSize", numValue);
    }
  };

  // Gestion de la forme de l'image de profil
  const handleImageShapeChange = (shape) => {
    updateSignatureData("imageShape", shape);
  };

  // Suppression de la photo avec suppression Cloudflare
  const handleDeletePhoto = async (e) => {
    e.stopPropagation();
    try {
      // Supprimer de Cloudflare si la clé existe
      if (signatureData.photoKey) {
        await deleteImageFile(signatureData.photoKey);
      }
      // Supprimer les données locales
      updateSignatureData("photo", null);
      updateSignatureData("photoVisible", false);
      updateSignatureData("photoKey", null);
      toast.success("Photo supprimée avec succès");
    } catch (error) {
      console.error("❌ Erreur suppression photo:", error);
      toast.error("Erreur lors de la suppression: " + error.message);
    }
  };

  // Upload de la photo vers Cloudflare avec optimisation
  const handlePhotoUpload = async (file) => {
    if (!file) return;

    try {
      toast.info("Optimisation de l'image...");

      // 🔥 ÉTAPE 1: Optimiser l'image côté client
      const optimizedBlob = await optimizeImage(file, "profile");

      // Créer un fichier à partir du blob optimisé
      const optimizedFile = new File(
        [optimizedBlob],
        `profile-${Date.now()}.jpg`,
        { type: "image/jpeg" },
      );

      // 🔥 ÉTAPE 2: Upload vers Cloudflare avec signatureId (temporaire ou réel)
      // Générer un signatureId temporaire si on crée une nouvelle signature
      const signatureId = editingSignatureId || `temp-${Date.now()}`;

      try {
        const result = await uploadImageFile(
          optimizedFile, // Upload du fichier optimisé
          "imgProfil",
          signatureId,
          (url, key) => {
            // Stocker l'URL Cloudflare réelle et la clé
            updateSignatureData("photo", url);
            updateSignatureData("photoKey", key);
            updateSignatureData("photoVisible", true);
            toast.success("Photo uploadée avec succès");
          },
        );
      } catch (uploadError) {
        console.error("❌ Erreur upload Cloudflare:", uploadError);
        toast.error("Erreur lors de l'upload: " + uploadError.message);
      }
    } catch (error) {
      console.error("❌ Erreur traitement photo:", error);
      toast.error("Erreur lors du traitement de la photo");
    }
  };

  // Fonction pour ouvrir le sélecteur de fichier
  const openFileSelector = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handlePhotoUpload(file);
      }
    };
    input.click();
  };

  const hasPhoto =
    signatureData.photo !== null && signatureData.photo !== undefined;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Image de profil</h2>
      <div className="flex items-center justify-between ml-4">
        <Label className="text-xs text-muted-foreground w-10">Image</Label>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-8 w-40 px-1.5 justify-between gap-1.5"
            >
              <div className="flex items-center gap-2">
                {hasPhoto ? (
                  <img
                    src={signatureData.photo}
                    alt="Photo"
                    className="w-5 h-5 object-cover rounded border border-gray-300"
                  />
                ) : (
                  <div className="w-5 h-5 bg-[#f5f5f5] dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
                )}
                <span className="text-xs">Image</span>
              </div>
              {hasPhoto && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(e);
                  }}
                  className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Supprimer l'image"
                >
                  <X className="w-2 h-2 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-72 p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg"
            side="left"
            align="start"
            sideOffset={160}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Image
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-4 space-y-4">
              {/* Zone d'upload / Preview */}
              <div className="flex flex-col items-center">
                <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                  {hasPhoto ? (
                    <div className="relative group w-full h-full flex items-center justify-center">
                      <img
                        src={signatureData.photo}
                        alt="Photo de profil"
                        className="max-w-full max-h-full object-contain"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeletePhoto}
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/80 cursor-pointer dark:bg-gray-800/80 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Supprimer la photo"
                      >
                        <X className="w-3 h-3 text-gray-500 hover:text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={openFileSelector}
                      className="bg-[#797979] hover:bg-[#797979] text-white text-xs px-4 py-2 rounded-md"
                    >
                      Choisir une image...
                    </Button>
                  )}
                </div>

                {hasPhoto && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={openFileSelector}
                    className="bg-[#202020] hover:bg-[#202020] text-white text-xs px-4 py-2 rounded-md"
                  >
                    Changer l'image...
                  </Button>
                )}
              </div>

              {/* Taille de l'image */}
              {hasPhoto && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600 dark:text-gray-400">
                        Taille
                      </Label>
                      <div className="flex items-center gap-1">
                        <Input
                          className="h-7 w-14 px-2 py-1 text-xs text-center"
                          type="text"
                          inputMode="decimal"
                          value={signatureData.imageSize ?? 70}
                          onChange={(e) =>
                            handleImageSizeChange(e.target.value)
                          }
                          onBlur={(e) => handleImageSizeChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleImageSizeChange(e.target.value);
                            }
                          }}
                          aria-label="Taille de l'image"
                        />
                        <span className="text-xs text-gray-400">px</span>
                      </div>
                    </div>
                    <Slider
                      className="w-full"
                      value={[signatureData.imageSize || 70]}
                      onValueChange={(value) => handleImageSizeChange(value[0])}
                      min={40}
                      max={150}
                      step={5}
                      aria-label="Taille image"
                    />
                  </div>

                  {/* Forme de l'image */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Forme
                    </Label>
                    <AlignmentSelector
                      items={[
                        { value: "round", icon: Circle },
                        { value: "square", icon: Square },
                      ]}
                      size="sm"
                      className="w-24"
                      value={signatureData.imageShape || "round"}
                      onValueChange={handleImageShapeChange}
                    />
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
