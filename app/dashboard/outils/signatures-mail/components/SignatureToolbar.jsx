"use client";

import React from "react";
import { X, Copy, Save } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/src/components/ui/toolbar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { useSignatureData } from "@/src/hooks/use-signature-data";

/**
 * Barre d'outils flottante pour la page de signature
 * Contient les actions : Annuler, Copier, Sauvegarder
 */
export function SignatureToolbar({ onCopy, isCopying }) {
  const { openCancelModal, openSaveModal } = useSignatureData();

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
      <TooltipProvider>
        <Toolbar className="bg-white dark:bg-[#1a1a1a] shadow-lg border-gray-200 dark:border-[#1a1a1a]">
          <ToolbarGroup>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToolbarButton
                  aria-label="Annuler"
                  render={
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={openCancelModal}
                    />
                  }
                >
                  <X className="h-4 w-4" />
                </ToolbarButton>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>Annuler</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToolbarButton
                  aria-label="Copier"
                  render={
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={onCopy}
                      disabled={isCopying}
                    />
                  }
                >
                  <Copy className="h-4 w-4" />
                </ToolbarButton>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>
                {isCopying ? "Copie..." : "Copier"}
              </TooltipContent>
            </Tooltip>
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup>
            <ToolbarButton
              render={<Button onClick={openSaveModal} className="gap-2" />}
            >
              <Save className="h-4 w-4" />
              Sauvegarder
            </ToolbarButton>
          </ToolbarGroup>
        </Toolbar>
      </TooltipProvider>
    </div>
  );
}
