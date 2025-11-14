"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import AlignmentSelector from "@/src/components/ui/alignment-selector";
import { Square, X, Upload, Circle, Trash2 } from "lucide-react";
import { useImageUpload } from "../../../hooks/useImageUpload";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import { toast } from "@/src/components/ui/sonner";
import { optimizeImage } from "../../../utils/imageOptimizer";

export default function ProfileImageSection({
  signatureData,
  updateSignatureData,
}) {
  const { deleteImageFile, uploadImageFile } = useImageUpload();
  const { editingSignatureId } = useSignatureData();

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
      const optimizedBlob = await optimizeImage(file, 'profile');
      console.log("✅ Image optimisée:", {
        original: `${(file.size / 1024).toFixed(2)} KB`,
        optimized: `${(optimizedBlob.size / 1024).toFixed(2)} KB`
      });
      
      // Créer un fichier à partir du blob optimisé
      const optimizedFile = new File(
        [optimizedBlob], 
        `profile-${Date.now()}.jpg`, 
        { type: 'image/jpeg' }
      );
      
      // 🔥 ÉTAPE 2: Upload vers Cloudflare avec signatureId (temporaire ou réel)
      // Générer un signatureId temporaire si on crée une nouvelle signature
      const signatureId = editingSignatureId || `temp-${Date.now()}`;
      console.log("🚀 Début upload vers Cloudflare, ID:", signatureId);
      
      try {
        const result = await uploadImageFile(
          optimizedFile,  // Upload du fichier optimisé
          "imgProfil",
          signatureId,
          (url, key) => {
            // Stocker l'URL Cloudflare réelle et la clé
            console.log("✅ Callback upload réussi - URL:", url, "Key:", key);
            updateSignatureData("photo", url);
            updateSignatureData("photoKey", key);
            updateSignatureData("photoVisible", true);
            console.log("💾 Photo mise à jour avec URL Cloudflare:", url);
            toast.success("Photo uploadée avec succès");
          }
        );
        console.log("📤 Résultat upload complet:", result);
        if (result && result.url) {
          console.log("🔗 URL finale Cloudflare:", result.url);
        }
      } catch (uploadError) {
        console.error("❌ Erreur upload Cloudflare:", uploadError);
        toast.error("Erreur lors de l'upload: " + uploadError.message);
      }
    } catch (error) {
      console.error("❌ Erreur traitement photo:", error);
      toast.error("Erreur lors du traitement de la photo");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Photo de profil</h2>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Afficher</Label>
          <Switch
            className="ml-2 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff] cursor-pointer"
            checked={signatureData.photoVisible !== false && signatureData.photo !== null && signatureData.photo !== undefined}
            onCheckedChange={(checked) => {
              if (checked && !signatureData.photo) {
                // Si on active mais pas de photo, ouvrir le sélecteur
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
              } else if (checked && signatureData.photo) {
                // Si on active et qu'il y a déjà une photo, juste la rendre visible
                updateSignatureData("photoVisible", true);
              } else if (!checked) {
                // Si on désactive, masquer la photo (mais ne pas la supprimer)
                updateSignatureData("photoVisible", false);
              }
            }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 ml-4">
        {(signatureData.photo !== null && signatureData.photo !== undefined) && (
          <>
            {/* Upload de la photo de profil */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Image</Label>
              <div className="flex items-center gap-3">
                {signatureData.photo ? (
                  <div className="relative group">
                    <img
                      src={signatureData.photo}
                      alt="Photo de profil"
                      className="w-14 h-14 object-cover border-2 border-gray-200 dark:border-gray-700 transition-all duration-200"
                      style={{
                        borderRadius:
                          signatureData.imageShape === "square" ? "6px" : "50%",
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeletePhoto}
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-white cursor-pointer dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 pointer-events-auto z-10"
                      title="Supprimer la photo"
                    >
                      <X
                        className="w-1 h-1 text-gray-500 hover:text-red-500 transition-colors"
                        width={2}
                        height={2}
                      />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => {
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
                    }}
                    className="flex items-center justify-center w-10 h-10 border-1 border-dashed border-gray-400 rounded-lg cursor-pointer hover:border-[#5a50ff] hover:bg-[#5a50ff]/10 transition-all duration-200 group bg-[#5a50ff]/5"
                  >
                    <Upload className="w-4 h-4 text-gray-400 group-hover:text-[#5a50ff] transition-colors" />
                  </div>
                )}
              </div>
            </div>

            {/* Taille de l'image */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Taille</Label>
              <div className="flex items-center gap-2 w-48">
                <button
                  onClick={() => handleImageSizeChange(70)}
                  className="h-8 w-8 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md flex-shrink-0"
                  title="Réinitialiser à 70"
                >
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <Input
                  className="h-8 px-2 py-1 min-w-12"
                  style={{ width: `${Math.max(48, (signatureData.imageSize?.toString().length || 2) * 8 + 16)}px` }}
                  type="text"
                  inputMode="decimal"
                  value={signatureData.imageSize ?? 70}
                  onChange={(e) => handleImageSizeChange(e.target.value)}
                  onBlur={(e) => handleImageSizeChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleImageSizeChange(e.target.value);
                    }
                  }}
                  aria-label="Taille de l'image de profil"
                  placeholder="70"
                />
                <Slider
                  className="grow"
                  value={[signatureData.imageSize || 70]}
                  onValueChange={(value) => handleImageSizeChange(value[0])}
                  min={40}
                  max={150}
                  step={5}
                  aria-label="Taille image"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>

            {/* Forme de l'image */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Forme</Label>
              <AlignmentSelector
                items={[
                  {
                    value: "round",
                    icon: Circle,
                  },
                  { value: "square", icon: Square },
                ]}
                size="sm"
                className="w-30"
                value={signatureData.imageShape || "round"}
                onValueChange={handleImageShapeChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
