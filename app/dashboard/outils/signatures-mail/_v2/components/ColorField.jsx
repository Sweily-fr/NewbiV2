"use client";

import { useRef } from "react";
import { ColorPicker } from "@/src/components/ui/color-picker";

const norm = (v) => String(v || "").trim().toLowerCase();

/**
 * Sélecteur de couleur pour l'éditeur de signature.
 *
 * Le ColorPicker partagé émet un onChange au montage (conversion HSV puis
 * retour en hex, avec une dérive d'un ou deux points de couleur). Sans
 * garde, ouvrir l'onglet Style enregistrait une signature « modifiée » avec
 * des couleurs légèrement différentes. On n'accepte un changement qu'après
 * une interaction réelle, et seulement s'il diffère de la valeur courante.
 */
export default function ColorField({ value, onChange, align = "end", side = "left" }) {
  const interacted = useRef(false);

  const handleChange = (next) => {
    if (!interacted.current) return;
    if (norm(next) === norm(value)) return;
    onChange(norm(next));
  };

  return (
    <div
      className="flex items-center gap-2"
      onPointerDownCapture={() => {
        interacted.current = true;
      }}
      onKeyDownCapture={() => {
        interacted.current = true;
      }}
    >
      <span className="font-mono text-xs text-muted-foreground">{norm(value)}</span>
      <ColorPicker color={value} onChange={handleChange} align={align} side={side} />
    </div>
  );
}
