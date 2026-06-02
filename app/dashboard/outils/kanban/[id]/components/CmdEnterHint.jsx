"use client";

import React, { useEffect, useState } from "react";
import { CornerDownLeft } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * Petit badge violet cliquable affichant le raccourci ⌘/Ctrl + Entrée.
 * Sert d'indice de découvrabilité : créer la tâche ET l'ouvrir.
 */
export function CmdEnterHint({ onClick, disabled, className }) {
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent;
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(ua));
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title="Créer et ouvrir la tâche"
      aria-label="Créer et ouvrir la tâche"
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-[#5A50FF]/30 bg-[#5A50FF]/10 px-1.5 py-0.5 text-[11px] font-medium text-[#5A50FF] transition-colors hover:bg-[#5A50FF]/20 disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
    >
      {isMac ? "⌘" : "Ctrl"}
      <CornerDownLeft className="h-3 w-3" />
    </button>
  );
}
