"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import AlignmentSelector from "@/src/components/ui/alignment-selector";
import { Square, X, Upload, Circle, Trash2 } from "lucide-react";

export default function ProfileImageSection({
  signatureData,
  updateSignatureData,
}) {
  // Gestion de l'espacement entre prénom et nom
  const handleNameSpacingChange = (value) => {
    const numValue = parseInt(value) || 0;
    updateSignatureData("nameSpacing", Math.max(0, Math.min(20, numValue))); // Entre 0 et 20px
  };

  // Gestion de la taille de l'image de profil
  const handleImageSizeChange = (value) => {
    const numValue = parseInt(value) || 80;
    updateSignatureData("imageSize", Math.max(40, Math.min(150, numValue))); // Entre 40 et 150px
  };

  // Gestion de la forme de l'image de profil
  const handleImageShapeChange = (shape) => {
    updateSignatureData("imageShape", shape);
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Photo de profil</h2>
      <div className="flex flex-col gap-3 ml-4">
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
                  onClick={() => updateSignatureData("photo", null)}
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-white cursor-pointer dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800"
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
                      const reader = new FileReader();
                      reader.onload = (e) =>
                        updateSignatureData("photo", e.target.result);
                      reader.readAsDataURL(file);
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
          <div className="flex items-center gap-3 w-30">
            <Input
              className="h-8 w-16 px-2 py-1"
              type="text"
              inputMode="decimal"
              value={signatureData.imageSize || 80}
              onChange={(e) => handleImageSizeChange(e.target.value)}
              onBlur={(e) => handleImageSizeChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleImageSizeChange(e.target.value);
                }
              }}
              aria-label="Taille de l'image de profil"
              placeholder="80"
            />
            <Slider
              className="grow"
              value={[signatureData.imageSize || 80]}
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
      </div>
    </div>
  );
}
