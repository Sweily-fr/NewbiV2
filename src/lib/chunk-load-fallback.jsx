"use client";

import { useEffect } from "react";
import { toast } from "@/src/components/ui/sonner";

// Repli d'un composant chargé à la demande dont le fichier est introuvable :
// typiquement une nouvelle version mise en ligne pendant que la page était
// ouverte. Sans ce repli, l'erreur remontait jusqu'à l'écran d'erreur général,
// qui remplaçait toute la page et faisait perdre le document en cours. Ici la
// fenêtre se referme et l'utilisateur est prévenu ; le document reste intact
// et peut être enregistré.
function ChunkLoadFailed({ onOpenChange, onClose, onCancel }) {
  useEffect(() => {
    toast.error(
      "Une nouvelle version de Newbi est disponible. Enregistrez votre document, puis rechargez la page pour utiliser cette fonction.",
      { id: "chunk-load-failed", duration: 10000 },
    );
    onOpenChange?.(false);
    onClose?.();
    onCancel?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// À utiliser dans next/dynamic : import("…").catch(chunkLoadFallback)
export const chunkLoadFallback = () => ChunkLoadFailed;
