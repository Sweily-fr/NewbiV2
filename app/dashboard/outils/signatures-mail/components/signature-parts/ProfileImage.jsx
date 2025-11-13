/**
 * Image de profil pour les signatures
 * Gère l'affichage et l'édition de la photo de profil
 */

"use client";

import React from "react";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";

const ProfileImage = ({
  photoSrc,
  size = 80,
  shape = "round", // "round" ou "square"
  onImageChange,
  isEditable = true,
  spacing = 0,
  wrapInTd = true, // Option pour wrapper dans un <td> ou non
}) => {
  const borderRadius = shape === "square" ? "8px" : "50%";

  const content = !photoSrc ? (
    <ImageDropZone
      currentImage={null}
      onImageChange={onImageChange}
      placeholder="Photo de profil"
      size="md"
      type="profile"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: borderRadius,
      }}
    />
  ) : isEditable ? (
    <img
      src={photoSrc}
      alt="Photo de profil"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: borderRadius,
        objectFit: "cover",
        display: "block",
        border: "0",
        cursor: "pointer",
        opacity: 1,
        transition: "opacity 0.2s ease-in-out",
      }}
      onMouseEnter={(e) => (e.target.style.opacity = "0.8")}
      onMouseLeave={(e) => (e.target.style.opacity = "1")}
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
          const file = e.target.files?.[0];
          if (file && onImageChange) {
            const reader = new FileReader();
            reader.onload = (event) => {
              onImageChange(event.target.result);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      }}
      title="Cliquer pour changer la photo"
    />
  ) : (
    <ImageDropZone
      currentImage={photoSrc}
      onImageChange={onImageChange}
      placeholder="Photo de profil"
      size="md"
      type="profile"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: borderRadius,
      }}
    />
  );

  // Si wrapInTd est false, retourner juste le contenu
  if (!wrapInTd) {
    return content;
  }

  // Sinon, wrapper dans un <td>
  return (
    <td
      style={{
        paddingBottom: `${spacing}px`,
        paddingRight: `${spacing}px`,
        verticalAlign: "top",
      }}
    >
      {content}
    </td>
  );
};

export default ProfileImage;
