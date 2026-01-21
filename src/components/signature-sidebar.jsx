"use client";

import React from "react";
import { Sidebar } from "@/src/components/ui/sidebar";
import { TabSignature } from "@/app/dashboard/outils/signatures-mail/components/preview/TabSignature";

export function SignatureSidebar({
  signatureData,
  updateSignatureData,
  editingSignatureId,
  ...props
}) {
  return (
    <Sidebar side="right" collapsible="none" className="w-72 h-full" {...props}>
      <TabSignature existingSignatureId={editingSignatureId} />
    </Sidebar>
  );
}
