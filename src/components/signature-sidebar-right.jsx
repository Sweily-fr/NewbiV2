"use client";

import React from "react";
import { Sidebar } from "@/src/components/ui/sidebar";
import { TabSignature } from "@/app/dashboard/outils/signatures-mail/components/preview/TabSignature";
import { useSignatureData } from "@/src/hooks/use-signature-data";

/**
 * Sidebar droite miroir pour la personnalisation des signatures email
 * Contient le composant TabSignature avec tous les contrôles de personnalisation
 * Positionnée au même niveau que app-sidebar (dans le layout principal)
 */
export function SignatureSidebarRight({ className, ...props }) {
  const { editingSignatureId } = useSignatureData();

  return (
    <Sidebar
      side="right"
      collapsible="none"
      className={`w-80 h-full border-sidebar-border ${className || ""}`}
      {...props}
    >
      <TabSignature existingSignatureId={editingSignatureId} />
    </Sidebar>
  );
}

export default SignatureSidebarRight;
