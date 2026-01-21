"use client";

import React from "react";
import { X, Copy, Save, Minus, Plus, Check } from "lucide-react";
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
import { cn } from "@/src/lib/utils";

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200];

/**
 * Barre d'outils flottante pour la page de signature
 * Contient les actions : Annuler, Zoom, Copier, Sauvegarder
 */
export function SignatureToolbar({
  onCopy,
  isCopying,
  copySuccess,
  zoom = 100,
  onZoomChange,
}) {
  const { openCancelModal, openSaveModal } = useSignatureData();

  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      onZoomChange?.(ZOOM_LEVELS[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex > 0) {
      onZoomChange?.(ZOOM_LEVELS[currentIndex - 1]);
    }
  };

  const handleZoomSelect = (e) => {
    onZoomChange?.(parseInt(e.target.value));
  };

  const handleZoomReset = () => {
    onZoomChange?.(100);
  };

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
          </ToolbarGroup>

          <ToolbarSeparator />

          {/* Contrôles de zoom */}
          <ToolbarGroup className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <ToolbarButton
                  aria-label="Dézoomer"
                  render={
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleZoomOut}
                      disabled={zoom <= ZOOM_LEVELS[0]}
                      className="h-8 w-8"
                    />
                  }
                >
                  <Minus className="h-3 w-3" />
                </ToolbarButton>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>Dézoomer</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <select
                  value={zoom}
                  onChange={handleZoomSelect}
                  onDoubleClick={handleZoomReset}
                  className="h-8 px-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 border-0 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#5b4fff] appearance-none text-center min-w-[60px]"
                  style={{
                    backgroundImage: 'none',
                  }}
                >
                  {ZOOM_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}%
                    </option>
                  ))}
                </select>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>
                Double-clic pour réinitialiser
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToolbarButton
                  aria-label="Zoomer"
                  render={
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleZoomIn}
                      disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                      className="h-8 w-8"
                    />
                  }
                >
                  <Plus className="h-3 w-3" />
                </ToolbarButton>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>Zoomer</TooltipContent>
            </Tooltip>
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
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
                      className={cn(
                        "relative transition-colors duration-200",
                        copySuccess && "text-green-600 dark:text-green-500"
                      )}
                    />
                  }
                >
                  <div className="relative h-4 w-4">
                    <Copy
                      className={cn(
                        "h-4 w-4 absolute inset-0 transition-all duration-200",
                        copySuccess ? "opacity-0 scale-50" : "opacity-100 scale-100"
                      )}
                    />
                    <Check
                      className={cn(
                        "h-4 w-4 absolute inset-0 transition-all duration-200",
                        copySuccess ? "opacity-100 scale-100" : "opacity-0 scale-50"
                      )}
                    />
                  </div>
                </ToolbarButton>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>
                {copySuccess ? "Copié !" : isCopying ? "Copie..." : "Copier"}
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
