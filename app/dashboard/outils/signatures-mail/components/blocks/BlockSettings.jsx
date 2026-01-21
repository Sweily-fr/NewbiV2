"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/src/lib/utils";
import { ELEMENT_TYPES } from "../../utils/block-registry";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Slider } from "@/src/components/ui/slider";
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Bold,
  Italic,
  Trash2,
  Columns,
  Rows,
  Plus,
  X,
  Search,
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Circle,
  Square,
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { useImageUpload } from "../../hooks/useImageUpload";
import { optimizeImage } from "../../utils/imageOptimizer";
import AlignmentSelector from "@/src/components/ui/alignment-selector";
import { Button } from "@/src/components/ui/button";
import { useSignatureData } from "@/src/hooks/use-signature-data";

/**
 * BlockSettings - Dynamic property panel for selected block or element
 * Features:
 * - Shows settings based on selection type
 * - Block-level settings (layout, delete)
 * - Element-level settings (font, color, size, etc.)
 */
export default function BlockSettings({
  selectedBlock,
  selectedElement,
  onUpdateBlock,
  onUpdateElement,
  onDeleteBlock,
  onDeleteElement,
}) {
  // If element is selected, show element settings
  if (selectedElement) {
    return (
      <ElementSettings
        element={selectedElement}
        onUpdate={onUpdateElement}
        onDelete={onDeleteElement}
      />
    );
  }

  // If block/container is selected, show container settings
  if (selectedBlock) {
    // Check if it's a container with children (branch node)
    const hasChildren = selectedBlock.children && selectedBlock.children.length > 0;
    const hasElements = selectedBlock.elements && selectedBlock.elements.length > 0;
    const isRoot = selectedBlock.isRoot;

    // Container with children (branch) - show parent-level settings
    if (hasChildren) {
      return (
        <ContainerBranchSettings
          container={selectedBlock}
          onUpdate={onUpdateBlock}
          onDelete={onDeleteBlock}
          isRoot={isRoot}
        />
      );
    }

    // Container with elements (leaf) - show element-container settings
    if (hasElements) {
      return (
        <ContainerLeafSettings
          container={selectedBlock}
          onUpdate={onUpdateBlock}
          onDelete={onDeleteBlock}
        />
      );
    }

    // Empty container
    return (
      <EmptyContainerSettings
        container={selectedBlock}
        onUpdate={onUpdateBlock}
        onDelete={onDeleteBlock}
        isRoot={isRoot}
      />
    );
  }

  // Nothing selected
  return (
    <div className="p-4 text-center">
      <p className="text-sm text-neutral-500">
        Sélectionnez un bloc ou un élément pour voir ses propriétés
      </p>
    </div>
  );
}

/**
 * Container with elements (leaf node) settings panel
 */
function ContainerLeafSettings({ container, onUpdate, onDelete }) {
  const currentAlignment = container.alignment || 'start';
  const currentPadding = container.padding ?? 12;
  const currentGap = container.gap ?? 12;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {container.label || 'Conteneur'}
          </h3>
          <p className="text-xs text-neutral-500">
            Conteneur • {container.elements?.length || 0} éléments
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Layout setting */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Disposition
        </Label>
        <Tabs
          value={container.layout || "vertical"}
          onValueChange={(value) => onUpdate({ layout: value })}
          className="w-40"
        >
          <TabsList className="w-full">
            <TabsTrigger value="vertical" className="flex-1">
              <Rows size={16} />
            </TabsTrigger>
            <TabsTrigger value="horizontal" className="flex-1">
              <Columns size={16} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Alignment setting */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Alignement
        </Label>
        <Tabs
          value={currentAlignment}
          onValueChange={(value) => onUpdate({ alignment: value })}
          className="w-40"
        >
          <TabsList className="w-full">
            <TabsTrigger value="start" className="flex-1">
              {container.layout === "horizontal" ? (
                <AlignEndVertical size={16} className="transition-transform duration-200 -rotate-90" />
              ) : (
                <AlignStartVertical size={16} />
              )}
            </TabsTrigger>
            <TabsTrigger value="center" className="flex-1">
              <AlignCenterVertical
                size={16}
                className={cn(
                  "transition-transform duration-200",
                  container.layout === "horizontal" && "-rotate-90"
                )}
              />
            </TabsTrigger>
            <TabsTrigger value="end" className="flex-1">
              {container.layout === "horizontal" ? (
                <AlignStartVertical size={16} className="transition-transform duration-200 -rotate-90" />
              ) : (
                <AlignEndVertical size={16} />
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Padding setting */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">Padding</Label>
        <div className="flex items-center gap-1.5 w-40">
          <Slider
            className="flex-1"
            value={[currentPadding]}
            onValueChange={([value]) => onUpdate({ padding: value })}
            min={0}
            max={32}
            step={1}
          />
          <Input
            className="h-8 w-14 px-2 py-1 text-xs text-center flex-shrink-0 bg-white"
            type="text"
            inputMode="decimal"
            value={currentPadding}
            onChange={(e) => {
              const numValue = parseInt(e.target.value);
              if (!isNaN(numValue) && numValue >= 0) {
                onUpdate({ padding: numValue });
              }
            }}
          />
        </div>
      </div>

      {/* Gap setting */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">Gap</Label>
        <div className="flex items-center gap-1.5 w-40">
          <Slider
            className="flex-1"
            value={[currentGap]}
            onValueChange={([value]) => onUpdate({ gap: value })}
            min={0}
            max={32}
            step={1}
          />
          <Input
            className="h-8 w-14 px-2 py-1 text-xs text-center flex-shrink-0 bg-white"
            type="text"
            inputMode="decimal"
            value={currentGap}
            onChange={(e) => {
              const numValue = parseInt(e.target.value);
              if (!isNaN(numValue) && numValue >= 0) {
                onUpdate({ gap: numValue });
              }
            }}
          />
        </div>
      </div>

      {/* Elements list */}
      <div className="space-y-2">
        <Label className="text-xs">Éléments ({container.elements.length})</Label>
        <div className="space-y-1 max-h-48 overflow-auto">
          {container.elements.map((element) => (
            <div
              key={element.id}
              className="flex items-center justify-between py-1.5 px-2 rounded bg-neutral-50 dark:bg-neutral-800 text-xs"
            >
              <span className="text-neutral-600 dark:text-neutral-400">
                {getElementLabel(element.type)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-400">
        Cliquez sur un élément pour modifier ses propriétés.
      </div>
    </div>
  );
}

/**
 * Container with children (branch node) settings panel
 */
function ContainerBranchSettings({ container, onUpdate, onDelete, isRoot }) {
  const currentLayout = container.layout || 'vertical';
  const currentAlignment = container.alignment || 'start';
  const currentPadding = container.padding ?? 12;
  const currentGap = container.gap ?? 12;

  // Count total elements in all children recursively
  const countElements = (cont) => {
    let count = cont.elements?.length || 0;
    if (cont.children) {
      cont.children.forEach(child => {
        count += countElements(child);
      });
    }
    return count;
  };

  const totalElements = countElements(container);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {container.label || (isRoot ? 'Signature' : 'Conteneur')}
          </h3>
          <p className="text-xs text-neutral-500">
            {isRoot ? 'Conteneur racine' : 'Conteneur parent'} • {container.children?.length || 0} enfants
          </p>
        </div>
        {!isRoot && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Layout direction */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Disposition
        </Label>
        <Tabs
          value={currentLayout}
          onValueChange={(value) => onUpdate({ layout: value })}
          className="w-40"
        >
          <TabsList className="w-full">
            <TabsTrigger value="vertical" className="flex-1">
              <Rows size={16} />
            </TabsTrigger>
            <TabsTrigger value="horizontal" className="flex-1">
              <Columns size={16} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Alignment setting */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Alignement
        </Label>
        <Tabs
          value={currentAlignment}
          onValueChange={(value) => onUpdate({ alignment: value })}
          className="w-40"
        >
          <TabsList className="w-full">
            <TabsTrigger value="start" className="flex-1">
              {currentLayout === "horizontal" ? (
                <AlignEndVertical size={16} className="transition-transform duration-200 -rotate-90" />
              ) : (
                <AlignStartVertical size={16} />
              )}
            </TabsTrigger>
            <TabsTrigger value="center" className="flex-1">
              <AlignCenterVertical
                size={16}
                className={cn(
                  "transition-transform duration-200",
                  currentLayout === "horizontal" && "-rotate-90"
                )}
              />
            </TabsTrigger>
            <TabsTrigger value="end" className="flex-1">
              {currentLayout === "horizontal" ? (
                <AlignStartVertical size={16} className="transition-transform duration-200 -rotate-90" />
              ) : (
                <AlignEndVertical size={16} />
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Padding setting */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">Padding</Label>
        <div className="flex items-center gap-1.5 w-40">
          <Slider
            className="flex-1"
            value={[currentPadding]}
            onValueChange={([value]) => onUpdate({ padding: value })}
            min={0}
            max={32}
            step={1}
          />
          <Input
            className="h-8 w-14 px-2 py-1 text-xs text-center flex-shrink-0 bg-white"
            type="text"
            inputMode="decimal"
            value={currentPadding}
            onChange={(e) => {
              const numValue = parseInt(e.target.value);
              if (!isNaN(numValue) && numValue >= 0) {
                onUpdate({ padding: numValue });
              }
            }}
          />
        </div>
      </div>

      {/* Gap setting */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">Gap</Label>
        <div className="flex items-center gap-1.5 w-40">
          <Slider
            className="flex-1"
            value={[currentGap]}
            onValueChange={([value]) => onUpdate({ gap: value })}
            min={0}
            max={32}
            step={1}
          />
          <Input
            className="h-8 w-14 px-2 py-1 text-xs text-center flex-shrink-0 bg-white"
            type="text"
            inputMode="decimal"
            value={currentGap}
            onChange={(e) => {
              const numValue = parseInt(e.target.value);
              if (!isNaN(numValue) && numValue >= 0) {
                onUpdate({ gap: numValue });
              }
            }}
          />
        </div>
      </div>

      {/* Children list */}
      <div className="space-y-2">
        <Label className="text-xs">Conteneurs enfants ({container.children?.length || 0})</Label>
        <div className="space-y-1 max-h-48 overflow-auto">
          {container.children?.map((child, index) => {
            const hasChildElements = child.elements?.length > 0;
            const hasGrandchildren = child.children?.length > 0;
            return (
              <div
                key={child.id}
                className="flex items-center justify-between py-1.5 px-2 rounded bg-neutral-50 dark:bg-neutral-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    hasGrandchildren ? "bg-purple-500" : "bg-blue-500"
                  )} />
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {child.label || `Conteneur ${index + 1}`}
                  </span>
                </div>
                <span className="text-neutral-400">
                  {hasGrandchildren
                    ? `${child.children.length} cont.`
                    : `${child.elements?.length || 0} él.`
                  }
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tip */}
      <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-400">
        Cliquez sur un conteneur enfant pour voir ses paramètres.
      </div>
    </div>
  );
}

/**
 * Empty container settings panel
 */
function EmptyContainerSettings({ container, onUpdate, onDelete, isRoot }) {
  const currentLayout = container.layout || 'vertical';
  const currentAlignment = container.alignment || 'start';
  const currentPadding = container.padding ?? 12;
  const currentGap = container.gap ?? 12;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {container.label || 'Conteneur vide'}
          </h3>
          <p className="text-xs text-neutral-500">
            Conteneur vide
          </p>
        </div>
        {!isRoot && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Layout direction */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Disposition
        </Label>
        <Tabs
          value={currentLayout}
          onValueChange={(value) => onUpdate({ layout: value })}
          className="w-40"
        >
          <TabsList className="w-full">
            <TabsTrigger value="vertical" className="flex-1">
              <Rows size={16} />
            </TabsTrigger>
            <TabsTrigger value="horizontal" className="flex-1">
              <Columns size={16} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Alignment setting */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Alignement
        </Label>
        <Tabs
          value={currentAlignment}
          onValueChange={(value) => onUpdate({ alignment: value })}
          className="w-40"
        >
          <TabsList className="w-full">
            <TabsTrigger value="start" className="flex-1">
              {currentLayout === "horizontal" ? (
                <AlignEndVertical size={16} className="transition-transform duration-200 -rotate-90" />
              ) : (
                <AlignStartVertical size={16} />
              )}
            </TabsTrigger>
            <TabsTrigger value="center" className="flex-1">
              <AlignCenterVertical
                size={16}
                className={cn(
                  "transition-transform duration-200",
                  currentLayout === "horizontal" && "-rotate-90"
                )}
              />
            </TabsTrigger>
            <TabsTrigger value="end" className="flex-1">
              {currentLayout === "horizontal" ? (
                <AlignStartVertical size={16} className="transition-transform duration-200 -rotate-90" />
              ) : (
                <AlignEndVertical size={16} />
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Padding setting */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">Padding</Label>
        <div className="flex items-center gap-1.5 w-40">
          <Slider
            className="flex-1"
            value={[currentPadding]}
            onValueChange={([value]) => onUpdate({ padding: value })}
            min={0}
            max={32}
            step={1}
          />
          <Input
            className="h-8 w-14 px-2 py-1 text-xs text-center flex-shrink-0 bg-white"
            type="text"
            inputMode="decimal"
            value={currentPadding}
            onChange={(e) => {
              const numValue = parseInt(e.target.value);
              if (!isNaN(numValue) && numValue >= 0) {
                onUpdate({ padding: numValue });
              }
            }}
          />
        </div>
      </div>

      {/* Gap setting */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">Gap</Label>
        <div className="flex items-center gap-1.5 w-40">
          <Slider
            className="flex-1"
            value={[currentGap]}
            onValueChange={([value]) => onUpdate({ gap: value })}
            min={0}
            max={32}
            step={1}
          />
          <Input
            className="h-8 w-14 px-2 py-1 text-xs text-center flex-shrink-0 bg-white"
            type="text"
            inputMode="decimal"
            value={currentGap}
            onChange={(e) => {
              const numValue = parseInt(e.target.value);
              if (!isNaN(numValue) && numValue >= 0) {
                onUpdate({ gap: numValue });
              }
            }}
          />
        </div>
      </div>

      {/* Tip */}
      <div className="p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-600 dark:text-amber-400">
        Glissez des widgets depuis la bibliothèque pour remplir ce conteneur.
      </div>
    </div>
  );
}

/**
 * Element-level settings panel
 */
function ElementSettings({ element, onUpdate, onDelete }) {
  const props = element.props || {};

  // Render settings based on element type
  const renderSettings = () => {
    switch (element.type) {
      case ELEMENT_TYPES.PHOTO:
        return <PhotoSettings props={props} onUpdate={onUpdate} />;

      case ELEMENT_TYPES.NAME:
      case ELEMENT_TYPES.POSITION:
      case ELEMENT_TYPES.COMPANY:
      case ELEMENT_TYPES.TEXT:
        return <TextSettings props={props} onUpdate={onUpdate} />;

      case ELEMENT_TYPES.PHONE:
      case ELEMENT_TYPES.MOBILE:
      case ELEMENT_TYPES.EMAIL:
      case ELEMENT_TYPES.WEBSITE:
      case ELEMENT_TYPES.ADDRESS:
        return <ContactSettings props={props} onUpdate={onUpdate} />;

      case ELEMENT_TYPES.SOCIAL_ICONS:
        return <SocialSettings props={props} onUpdate={onUpdate} />;

      case ELEMENT_TYPES.LOGO:
        return <LogoSettings props={props} onUpdate={onUpdate} />;

      case ELEMENT_TYPES.SEPARATOR_LINE:
        return <SeparatorSettings props={props} onUpdate={onUpdate} />;

      case ELEMENT_TYPES.SPACER:
        return <SpacerSettings props={props} onUpdate={onUpdate} />;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {getElementLabel(element.type)}
          </h3>
          <p className="text-xs text-neutral-500">Propriétés de l'élément</p>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Element-specific settings */}
      {renderSettings()}
    </div>
  );
}

/**
 * Photo element settings - Full version with upload
 */
function PhotoSettings({ props, onUpdate }) {
  const { signatureData, updateSignatureData, editingSignatureId } = useSignatureData();
  const { deleteImageFile, uploadImageFile } = useImageUpload();

  // Gestion de la taille de l'image de profil
  const handleImageSizeChange = (value) => {
    if (value === "" || value === null) {
      updateSignatureData("imageSize", 1);
      onUpdate({ width: 1, height: 1 });
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      updateSignatureData("imageSize", numValue);
      onUpdate({ width: numValue, height: numValue });
    }
  };

  // Gestion de la forme de l'image de profil
  const handleImageShapeChange = (shape) => {
    updateSignatureData("imageShape", shape);
    onUpdate({ borderRadius: shape === "round" ? "50%" : "8px" });
  };

  // Suppression de la photo avec suppression Cloudflare
  const handleDeletePhoto = async (e) => {
    e.stopPropagation();
    try {
      if (signatureData.photoKey) {
        await deleteImageFile(signatureData.photoKey);
      }
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

      const optimizedBlob = await optimizeImage(file, "profile");
      const optimizedFile = new File(
        [optimizedBlob],
        `profile-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      const signatureId = editingSignatureId || `temp-${Date.now()}`;

      try {
        await uploadImageFile(
          optimizedFile,
          "imgProfil",
          signatureId,
          (url, key) => {
            updateSignatureData("photo", url);
            updateSignatureData("photoKey", key);
            updateSignatureData("photoVisible", true);
            toast.success("Photo uploadée avec succès");
          }
        );
      } catch (uploadError) {
        console.error("❌ Erreur upload Cloudflare:", uploadError);
        toast.error("Erreur lors de l'upload: " + uploadError.message);
      }
    } catch (error) {
      console.error("❌ Erreur traitement photo:", error);
      toast.error("Erreur lors du traitement de la photo");
    }
  };

  // Fonction pour ouvrir le sélecteur de fichier
  const openFileSelector = () => {
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
  };

  const hasPhoto = signatureData.photo !== null && signatureData.photo !== undefined;
  const currentSize = signatureData.imageSize ?? props.width ?? 70;
  const currentShape = signatureData.imageShape || (props.borderRadius === "50%" ? "round" : "square");

  return (
    <div className="space-y-4">
      {/* Zone d'upload / Preview */}
      <div className="flex flex-col items-center">
        <div className="w-full h-32 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden">
          {hasPhoto ? (
            <div className="relative group w-full h-full flex items-center justify-center">
              <img
                src={signatureData.photo}
                alt="Photo de profil"
                className="max-w-full max-h-full object-contain"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeletePhoto}
                className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/80 cursor-pointer dark:bg-neutral-800/80 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Supprimer la photo"
              >
                <X className="w-3 h-3 text-neutral-500 hover:text-red-500" />
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={openFileSelector}
              className="bg-neutral-600 hover:bg-neutral-700 text-white text-xs px-4 py-2 rounded-md"
            >
              Choisir une image...
            </Button>
          )}
        </div>

        {hasPhoto && (
          <Button
            variant="secondary"
            size="sm"
            onClick={openFileSelector}
            className="bg-neutral-800 hover:bg-neutral-900 text-white text-xs px-4 py-2 rounded-md"
          >
            Changer l'image...
          </Button>
        )}
      </div>

      {/* Taille de l'image */}
      {hasPhoto && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-neutral-600 dark:text-neutral-400">
                Taille
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  className="h-7 w-14 px-2 py-1 text-xs text-center"
                  type="text"
                  inputMode="decimal"
                  value={currentSize}
                  onChange={(e) => handleImageSizeChange(e.target.value)}
                />
                <span className="text-xs text-neutral-400">px</span>
              </div>
            </div>
            <Slider
              className="w-full"
              value={[currentSize]}
              onValueChange={(value) => handleImageSizeChange(value[0])}
              min={40}
              max={150}
              step={5}
            />
          </div>

          {/* Forme de l'image */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-neutral-600 dark:text-neutral-400">
              Forme
            </Label>
            <AlignmentSelector
              items={[
                { value: "round", icon: Circle },
                { value: "square", icon: Square },
              ]}
              size="sm"
              className="w-24"
              value={currentShape}
              onValueChange={handleImageShapeChange}
            />
          </div>
        </>
      )}
    </div>
  );
}

// Font options for typography dropdown
const fontOptions = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Calibri, sans-serif", label: "Calibri" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
];

const weightOptions = [
  { value: "normal", label: "Normal", fontWeight: "normal", fontStyle: "normal" },
  { value: "500", label: "Medium", fontWeight: "500", fontStyle: "normal" },
  { value: "600", label: "Semi-bold", fontWeight: "600", fontStyle: "normal" },
  { value: "700", label: "Bold", fontWeight: "700", fontStyle: "normal" },
  { value: "italic", label: "Italic", fontWeight: "normal", fontStyle: "italic" },
  { value: "500-italic", label: "Medium Italic", fontWeight: "500", fontStyle: "italic" },
  { value: "600-italic", label: "Semi-bold Italic", fontWeight: "600", fontStyle: "italic" },
  { value: "700-italic", label: "Bold Italic", fontWeight: "700", fontStyle: "italic" },
];

/**
 * Text element settings (name, position, company, tagline)
 * Content displayed directly in sidebar (Typography dropdown style)
 */
function TextSettings({ props, onUpdate }) {
  return (
    <div className="space-y-3">
      {/* Police */}
      <div className="flex items-center justify-between" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Police
        </Label>
        <Select
          value={props.fontFamily || "Arial, sans-serif"}
          onValueChange={(value) => onUpdate({ fontFamily: value })}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontOptions.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Graisse */}
      <div className="flex items-center justify-between" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Graisse
        </Label>
        <Select
          value={
            props.fontStyle === "italic"
              ? props.fontWeight === "normal" || !props.fontWeight
                ? "italic"
                : `${props.fontWeight}-italic`
              : props.fontWeight || "normal"
          }
          onValueChange={(value) => {
            const option = weightOptions.find((w) => w.value === value);
            if (option) {
              onUpdate({ fontWeight: option.fontWeight, fontStyle: option.fontStyle });
            }
          }}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {weightOptions.map((weight) => (
              <SelectItem key={weight.value} value={weight.value}>
                {weight.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Couleur */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Couleur
        </Label>
        <label className="relative h-8 w-40 flex items-center gap-2 px-3 bg-white border border-neutral-200 dark:border-neutral-700 rounded-md cursor-pointer hover:bg-neutral-50 transition-colors">
          <div
            className="w-3 h-3 rounded border border-neutral-300 flex-shrink-0"
            style={{ backgroundColor: props.color || "#171717" }}
          />
          <span className="text-xs text-neutral-700 dark:text-neutral-300">
            {props.color || "#171717"}
          </span>
          <input
            type="color"
            value={props.color || "#171717"}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      </div>

      {/* Taille */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Taille
        </Label>
        <div className="flex items-center gap-1.5 w-40">
          <Slider
            className="flex-1"
            value={[props.fontSize || 14]}
            onValueChange={(value) => onUpdate({ fontSize: value[0] })}
            min={8}
            max={48}
            step={1}
          />
          <Input
            className="h-8 w-14 px-2 py-1 text-xs text-center flex-shrink-0 bg-white"
            type="text"
            inputMode="decimal"
            value={props.fontSize || 14}
            onChange={(e) => {
              const numValue = parseInt(e.target.value);
              if (!isNaN(numValue) && numValue >= 1) {
                onUpdate({ fontSize: numValue });
              }
            }}
          />
        </div>
      </div>

      {/* Alignement */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Align
        </Label>
        <Tabs
          value={props.textAlign || "left"}
          onValueChange={(value) => onUpdate({ textAlign: value })}
          className="w-40"
        >
          <TabsList className="w-full">
            <TabsTrigger value="left" className="flex-1">
              <AlignLeft size={16} />
            </TabsTrigger>
            <TabsTrigger value="center" className="flex-1">
              <AlignCenter size={16} />
            </TabsTrigger>
            <TabsTrigger value="right" className="flex-1">
              <AlignRight size={16} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * Contact element settings (phone, email, etc.)
 * Content displayed directly in sidebar (Typography dropdown style)
 */
function ContactSettings({ props, onUpdate }) {
  return (
    <div className="space-y-3">
      {/* Icon toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Afficher l'icône
        </Label>
        <div className="w-40 flex justify-end">
          <Switch
            checked={props.showIcon !== false}
            onCheckedChange={(checked) => onUpdate({ showIcon: checked })}
            className="scale-75 data-[state=checked]:bg-[#5a50ff]"
          />
        </div>
      </div>

      {/* Police */}
      <div className="flex items-center justify-between" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Police
        </Label>
        <Select
          value={props.fontFamily || "Arial, sans-serif"}
          onValueChange={(value) => onUpdate({ fontFamily: value })}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontOptions.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Graisse */}
      <div className="flex items-center justify-between" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Graisse
        </Label>
        <Select
          value={
            props.fontStyle === "italic"
              ? props.fontWeight === "normal" || !props.fontWeight
                ? "italic"
                : `${props.fontWeight}-italic`
              : props.fontWeight || "normal"
          }
          onValueChange={(value) => {
            const option = weightOptions.find((w) => w.value === value);
            if (option) {
              onUpdate({ fontWeight: option.fontWeight, fontStyle: option.fontStyle });
            }
          }}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {weightOptions.map((weight) => (
              <SelectItem key={weight.value} value={weight.value}>
                {weight.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Couleur */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Couleur
        </Label>
        <label className="relative h-8 w-40 flex items-center gap-2 px-3 bg-white border border-neutral-200 dark:border-neutral-700 rounded-md cursor-pointer hover:bg-neutral-50 transition-colors">
          <div
            className="w-3 h-3 rounded border border-neutral-300 flex-shrink-0"
            style={{ backgroundColor: props.color || "#666666" }}
          />
          <span className="text-xs text-neutral-700 dark:text-neutral-300">
            {props.color || "#666666"}
          </span>
          <input
            type="color"
            value={props.color || "#666666"}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      </div>

      {/* Taille */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Taille
        </Label>
        <div className="flex items-center gap-1.5 w-40">
          <Slider
            className="flex-1"
            value={[props.fontSize || 12]}
            onValueChange={(value) => onUpdate({ fontSize: value[0] })}
            min={8}
            max={48}
            step={1}
          />
          <Input
            className="h-8 w-14 px-2 py-1 text-xs text-center flex-shrink-0 bg-white"
            type="text"
            inputMode="decimal"
            value={props.fontSize || 12}
            onChange={(e) => {
              const numValue = parseInt(e.target.value);
              if (!isNaN(numValue) && numValue >= 1) {
                onUpdate({ fontSize: numValue });
              }
            }}
          />
        </div>
      </div>

      {/* Alignement */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Align
        </Label>
        <Tabs
          value={props.textAlign || "left"}
          onValueChange={(value) => onUpdate({ textAlign: value })}
          className="w-40"
        >
          <TabsList className="w-full">
            <TabsTrigger value="left" className="flex-1">
              <AlignLeft size={16} />
            </TabsTrigger>
            <TabsTrigger value="center" className="flex-1">
              <AlignCenter size={16} />
            </TabsTrigger>
            <TabsTrigger value="right" className="flex-1">
              <AlignRight size={16} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

// Réseaux AUTORISÉS uniquement
const ALLOWED_SOCIAL_NETWORKS = [
  "facebook",
  "github",
  "instagram",
  "linkedin",
  "x",
  "youtube",
];

// Couleurs AUTORISÉES uniquement
const ALLOWED_COLORS = [
  "black",
  "green",
  "yellow",
  "pink",
  "sky",
  "orange",
  "blue",
  "purple",
  "indigo",
];

// Mapping des noms d'affichage pour les réseaux sociaux
const socialNetworkLabels = {
  facebook: "Facebook",
  github: "GitHub",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  youtube: "YouTube",
};

// Mapping des icônes Lucide React pour les réseaux sociaux
const socialNetworkIcons = {
  facebook: Facebook,
  github: Github,
  instagram: Instagram,
  linkedin: Linkedin,
  x: Twitter,
  youtube: Youtube,
};

// Fonction pour obtenir une couleur de preview pour les sélecteurs
const getColorPreview = (colorName) => {
  const colorMap = {
    black: "#000000",
    green: "#22c55e",
    yellow: "#eab308",
    pink: "#ec4899",
    sky: "#0ea5e9",
    orange: "#f97316",
    blue: "#3b82f6",
    purple: "#a855f7",
    indigo: "#6366f1",
  };
  return colorMap[colorName] || "#6b7280";
};

/**
 * Social icons settings - Full version with network management
 */
function SocialSettings({ props, onUpdate }) {
  const { signatureData, updateSignatureData } = useSignatureData();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openNetworkPopover, setOpenNetworkPopover] = useState(null);

  // Gestion de la taille des logos sociaux
  const handleSocialSizeChange = (value) => {
    if (value === "" || value === null) {
      updateSignatureData("socialSize", 1);
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      updateSignatureData("socialSize", numValue);
    }
  };

  // Gestion de l'activation/désactivation des réseaux sociaux
  const handleSocialToggle = useCallback(
    (platform, enabled) => {
      const updatedNetworks = {
        ...signatureData.socialNetworks,
      };

      if (enabled) {
        updatedNetworks[platform] = "";
      } else {
        delete updatedNetworks[platform];
        const updatedIcons = { ...signatureData.socialIcons };
        delete updatedIcons[platform];
        updateSignatureData("socialIcons", updatedIcons);
      }

      updateSignatureData("socialNetworks", updatedNetworks);
    },
    [signatureData.socialNetworks, signatureData.socialIcons, updateSignatureData]
  );

  // Gestion des changements d'URL
  const handleSocialUrlChange = useCallback(
    (platform, url) => {
      updateSignatureData("socialNetworks", {
        ...signatureData.socialNetworks,
        [platform]: url,
      });
    },
    [signatureData.socialNetworks, updateSignatureData]
  );

  // Gestion de la couleur globale des icônes
  const handleGlobalColorChange = (color) => {
    const globalColor = color === "default" ? null : color;
    const updatedColors = {};
    ALLOWED_SOCIAL_NETWORKS.forEach((platform) => {
      updatedColors[platform] = globalColor || null;
    });
    updateSignatureData({
      socialGlobalColor: globalColor,
      socialColors: updatedColors,
    });
  };

  // Gestion de la couleur individuelle d'un réseau
  const handleIndividualColorChange = (network, color) => {
    const updatedColors = {
      ...signatureData.socialColors,
      [network]: color === "default" ? null : color,
    };
    updateSignatureData("socialColors", updatedColors);
  };

  // Gestion de la taille individuelle d'un réseau
  const handleIndividualSizeChange = (network, size) => {
    const updatedSizes = {
      ...signatureData.socialSizes,
      [network]: size,
    };
    updateSignatureData("socialSizes", updatedSizes);
  };

  // Réseaux activés (ceux qui sont dans socialNetworks)
  const activeNetworks = Object.keys(signatureData.socialNetworks || {});

  // Réseaux disponibles pour l'ajout (filtrés par recherche)
  const availableNetworks = ALLOWED_SOCIAL_NETWORKS.filter(
    (network) => !activeNetworks.includes(network)
  ).filter((network) =>
    socialNetworkLabels[network].toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header avec titre et bouton + */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Réseaux
        </Label>
        <Popover open={isAddOpen} onOpenChange={setIsAddOpen}>
          <PopoverTrigger asChild>
            <button
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Ajouter un réseau social"
            >
              <Plus className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-56 p-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg"
            side="left"
            align="start"
            sideOffset={12}
          >
            {/* Barre de recherche */}
            <div className="p-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 rounded-md">
                <Search className="w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>
            {/* Liste des réseaux disponibles */}
            <div className="max-h-64 overflow-y-auto py-1">
              {availableNetworks.length > 0 ? (
                availableNetworks.map((network) => {
                  const IconComponent = socialNetworkIcons[network];
                  return (
                    <button
                      key={network}
                      onClick={() => {
                        handleSocialToggle(network, true);
                        setIsAddOpen(false);
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      {socialNetworkLabels[network]}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-xs text-neutral-400">
                  {activeNetworks.length === ALLOWED_SOCIAL_NETWORKS.length
                    ? "Tous les réseaux sont ajoutés"
                    : "Aucun résultat"}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Liste des réseaux activés */}
      {activeNetworks.length > 0 && (
        <div className="flex flex-col gap-3">
          {activeNetworks.map((network) => {
            const IconComponent = socialNetworkIcons[network];
            return (
              <div key={network} className="flex items-center justify-between">
                <Label className="text-xs text-neutral-500 w-16 truncate">
                  {socialNetworkLabels[network].split(" ")[0]}
                </Label>
                <Popover
                  open={openNetworkPopover === network}
                  onOpenChange={(open) => setOpenNetworkPopover(open ? network : null)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-7 w-32 px-1.5 justify-between gap-1"
                    >
                      <div className="flex items-center gap-1.5">
                        {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                        <span className="text-xs font-normal truncate">
                          {socialNetworkLabels[network].split(" ")[0]}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSocialToggle(network, false);
                        }}
                        className="p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        title="Supprimer"
                      >
                        <X className="w-2.5 h-2.5 text-neutral-400 hover:text-neutral-600" />
                      </button>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-64 p-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg"
                    side="left"
                    align="start"
                    sideOffset={8}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {socialNetworkLabels[network]}
                      </span>
                      <button
                        onClick={() => setOpenNetworkPopover(null)}
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <X className="w-3 h-3 text-neutral-400" />
                      </button>
                    </div>
                    {/* Contenu */}
                    <div className="p-3 space-y-3">
                      {/* URL */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
                          URL du profil
                        </Label>
                        <Input
                          className="h-7 w-full px-2 py-1 text-xs"
                          type="url"
                          value={signatureData.socialNetworks?.[network] || ""}
                          onChange={(e) => handleSocialUrlChange(network, e.target.value)}
                          placeholder={`https://${network}.com/...`}
                        />
                      </div>

                      {/* Taille individuelle */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-neutral-600 dark:text-neutral-400">
                            Taille
                          </Label>
                          <div className="flex items-center gap-1">
                            <Input
                              className="h-6 w-12 px-1.5 py-0.5 text-xs text-center"
                              type="text"
                              inputMode="decimal"
                              value={
                                signatureData.socialSizes?.[network] ??
                                signatureData.socialSize ??
                                24
                              }
                              onChange={(e) =>
                                handleIndividualSizeChange(network, parseInt(e.target.value) || 24)
                              }
                            />
                            <span className="text-xs text-neutral-400">px</span>
                          </div>
                        </div>
                        <Slider
                          className="w-full"
                          value={[
                            signatureData.socialSizes?.[network] ??
                              signatureData.socialSize ??
                              24,
                          ]}
                          onValueChange={(value) => handleIndividualSizeChange(network, value[0])}
                          min={12}
                          max={64}
                          step={1}
                        />
                      </div>

                      {/* Couleur individuelle */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
                          Couleur
                        </Label>
                        <Select
                          value={signatureData.socialColors?.[network] || "default"}
                          onValueChange={(color) => handleIndividualColorChange(network, color)}
                        >
                          <SelectTrigger className="h-6 w-20 text-xs">
                            <SelectValue placeholder="Défaut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded border border-neutral-300 bg-neutral-100" />
                                Défaut
                              </div>
                            </SelectItem>
                            {ALLOWED_COLORS.map((color) => (
                              <SelectItem key={color} value={color}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded border border-neutral-300"
                                    style={{ backgroundColor: getColorPreview(color) }}
                                  />
                                  {color.charAt(0).toUpperCase() + color.slice(1)}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            );
          })}

          {/* Options globales */}
          <div className="mt-2 pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
            {/* Couleur globale */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-neutral-500">Couleur globale</Label>
              <Select
                value={signatureData.socialGlobalColor || "default"}
                onValueChange={handleGlobalColorChange}
              >
                <SelectTrigger className="h-6 w-20 text-xs">
                  <SelectValue placeholder="Défaut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Défaut</SelectItem>
                  {ALLOWED_COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded border border-neutral-300"
                          style={{ backgroundColor: getColorPreview(color) }}
                        />
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Taille globale */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-neutral-500">Taille globale</Label>
              <div className="flex items-center gap-1">
                <Input
                  className="h-6 w-12 px-1.5 py-0.5 text-xs text-center"
                  type="text"
                  inputMode="decimal"
                  value={signatureData.socialSize ?? 24}
                  onChange={(e) => handleSocialSizeChange(e.target.value)}
                />
                <span className="text-xs text-neutral-400">px</span>
              </div>
            </div>

            {/* Espacement */}
            <SettingRow label="Espacement">
              <Slider
                value={[props.gap || 8]}
                onValueChange={([value]) => onUpdate({ gap: value })}
                min={4}
                max={16}
                step={2}
                className="flex-1"
              />
              <span className="text-xs text-neutral-500 w-10 text-right">
                {props.gap || 8}px
              </span>
            </SettingRow>
          </div>
        </div>
      )}

      {/* Message si aucun réseau */}
      {activeNetworks.length === 0 && (
        <div className="text-xs text-neutral-400">
          Cliquez sur + pour ajouter un réseau social
        </div>
      )}
    </div>
  );
}

/**
 * Logo settings - Full version with upload (similar to PhotoSettings)
 */
function LogoSettings({ props, onUpdate }) {
  const { signatureData, updateSignatureData, editingSignatureId } = useSignatureData();
  const { deleteImageFile, uploadImageFile } = useImageUpload();

  // Gestion de la taille du logo (largeur uniquement, hauteur auto pour garder le ratio)
  const handleLogoSizeChange = (value) => {
    if (value === "" || value === null) {
      updateSignatureData("logoSize", 1);
      onUpdate({ maxWidth: 1, width: 1, height: "auto" });
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      updateSignatureData("logoSize", numValue);
      onUpdate({ maxWidth: numValue, width: numValue, height: "auto" });
    }
  };

  // Suppression du logo avec suppression Cloudflare
  const handleDeleteLogo = async (e) => {
    e.stopPropagation();
    try {
      if (signatureData.logoKey) {
        await deleteImageFile(signatureData.logoKey);
      }
      updateSignatureData("logo", null);
      updateSignatureData("logoVisible", false);
      updateSignatureData("logoKey", null);
      toast.success("Logo supprimé avec succès");
    } catch (error) {
      console.error("❌ Erreur suppression logo:", error);
      toast.error("Erreur lors de la suppression: " + error.message);
    }
  };

  // Upload du logo vers Cloudflare avec optimisation
  const handleLogoUpload = async (file) => {
    if (!file) return;

    try {
      toast.info("Optimisation de l'image...");

      const optimizedBlob = await optimizeImage(file, "logo");
      const optimizedFile = new File(
        [optimizedBlob],
        `logo-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      const signatureId = editingSignatureId || `temp-${Date.now()}`;

      try {
        await uploadImageFile(
          optimizedFile,
          "imgLogo",
          signatureId,
          (url, key) => {
            updateSignatureData("logo", url);
            updateSignatureData("logoKey", key);
            updateSignatureData("logoVisible", true);
            toast.success("Logo uploadé avec succès");
          }
        );
      } catch (uploadError) {
        console.error("❌ Erreur upload Cloudflare:", uploadError);
        toast.error("Erreur lors de l'upload: " + uploadError.message);
      }
    } catch (error) {
      console.error("❌ Erreur traitement logo:", error);
      toast.error("Erreur lors du traitement du logo");
    }
  };

  // Fonction pour ouvrir le sélecteur de fichier
  const openFileSelector = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handleLogoUpload(file);
      }
    };
    input.click();
  };

  const hasLogo = signatureData.logo !== null && signatureData.logo !== undefined;
  const currentSize = signatureData.logoSize ?? props.maxWidth ?? 150;

  return (
    <div className="space-y-3">
      {/* Zone d'upload / Preview */}
      <div className="flex flex-col items-center">
        <div className="w-full h-32 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden">
          {hasLogo ? (
            <div className="relative group w-full h-full flex items-center justify-center">
              <img
                src={signatureData.logo}
                alt="Logo entreprise"
                className="max-w-full max-h-full object-contain"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteLogo}
                className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/80 cursor-pointer dark:bg-neutral-800/80 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Supprimer le logo"
              >
                <X className="w-3 h-3 text-neutral-500 hover:text-red-500" />
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={openFileSelector}
              className="bg-neutral-600 hover:bg-neutral-700 text-white text-xs px-4 py-2 rounded-md"
            >
              Choisir une image...
            </Button>
          )}
        </div>

        {hasLogo && (
          <Button
            variant="secondary"
            size="sm"
            onClick={openFileSelector}
            className="bg-neutral-800 hover:bg-neutral-900 text-white text-xs px-4 py-2 rounded-md"
          >
            Changer l'image...
          </Button>
        )}
      </div>

      {/* Taille du logo */}
      {hasLogo && (
        <div className="flex items-center justify-between">
          <Label className="text-xs text-neutral-600 dark:text-neutral-400">
            Taille
          </Label>
          <div className="flex items-center gap-1.5 w-40">
            <Slider
              className="flex-1"
              value={[currentSize]}
              onValueChange={(value) => handleLogoSizeChange(value[0])}
              min={50}
              max={300}
              step={10}
            />
            <Input
              className="h-8 w-14 px-2 py-1 text-xs text-center flex-shrink-0 bg-white"
              type="text"
              inputMode="decimal"
              value={currentSize}
              onChange={(e) => handleLogoSizeChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Separator line settings
 * Note: The separator automatically adapts to its parent container layout:
 * - Horizontal parent → vertical separator
 * - Vertical parent → horizontal separator
 */
function SeparatorSettings({ props, onUpdate }) {
  // Parse height value (remove 'px' if present)
  const getHeightValue = () => {
    if (!props.height) return "";
    const numValue = parseInt(props.height);
    return isNaN(numValue) ? "" : numValue;
  };

  const handleHeightChange = (value) => {
    if (value === "" || value === null) {
      // Clear height to use auto (100%)
      onUpdate({ height: undefined });
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 20) {
      onUpdate({ height: `${numValue}px` });
    }
  };

  return (
    <div className="space-y-3">
      {/* Info sur le comportement automatique */}
      <p className="text-[10px] text-neutral-500 italic">
        L'orientation s'adapte automatiquement au conteneur parent.
      </p>

      {/* Épaisseur */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Épaisseur
        </Label>
        <div className="flex items-center gap-1.5 w-40">
          <Slider
            className="flex-1"
            value={[props.thickness || 1]}
            onValueChange={([value]) => onUpdate({ thickness: value })}
            min={1}
            max={20}
            step={1}
          />
          <Input
            className="h-8 w-14 px-2 py-1 text-xs text-center flex-shrink-0 bg-white"
            type="text"
            inputMode="decimal"
            value={props.thickness || 1}
            onChange={(e) => {
              const numValue = parseInt(e.target.value);
              if (!isNaN(numValue) && numValue >= 1) {
                onUpdate({ thickness: numValue });
              }
            }}
          />
        </div>
      </div>

      {/* Hauteur - pour les séparateurs verticaux (quand parent est horizontal) */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Hauteur (vertical)
        </Label>
        <div className="flex items-center gap-1.5 w-40">
          <Slider
            className="flex-1"
            value={[getHeightValue() || 100]}
            onValueChange={([value]) => handleHeightChange(value)}
            min={20}
            max={200}
            step={10}
          />
          <Input
            className="h-8 w-14 px-2 py-1 text-xs text-center flex-shrink-0 bg-white"
            type="text"
            inputMode="decimal"
            placeholder="Auto"
            value={getHeightValue()}
            onChange={(e) => handleHeightChange(e.target.value)}
          />
        </div>
      </div>

      {/* Info pour hauteur auto */}
      {!props.height && (
        <p className="text-[10px] text-neutral-400 italic">
          Hauteur auto = s'adapte au conteneur
        </p>
      )}

      {/* Couleur */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Couleur
        </Label>
        <label className="relative h-8 w-40 flex items-center gap-2 px-3 bg-white border border-neutral-200 dark:border-neutral-700 rounded-md cursor-pointer hover:bg-neutral-50 transition-colors">
          <div
            className="w-3 h-3 rounded border border-neutral-300 flex-shrink-0"
            style={{ backgroundColor: props.color || "#e0e0e0" }}
          />
          <span className="text-xs text-neutral-700 dark:text-neutral-300">
            {props.color || "#e0e0e0"}
          </span>
          <input
            type="color"
            value={props.color || "#e0e0e0"}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}

/**
 * Spacer settings
 */
function SpacerSettings({ props, onUpdate }) {
  return (
    <div className="space-y-3">
      {/* Hauteur */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-600 dark:text-neutral-400">
          Hauteur
        </Label>
        <div className="flex items-center gap-1.5 w-40">
          <Slider
            className="flex-1"
            value={[props.height || 16]}
            onValueChange={([value]) => onUpdate({ height: value })}
            min={4}
            max={48}
            step={4}
          />
          <Input
            className="h-8 w-14 px-2 py-1 text-xs text-center flex-shrink-0 bg-white"
            type="text"
            inputMode="decimal"
            value={props.height || 16}
            onChange={(e) => {
              const numValue = parseInt(e.target.value);
              if (!isNaN(numValue) && numValue >= 1) {
                onUpdate({ height: numValue });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Helper component for setting rows
 */
function SettingRow({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-neutral-600 dark:text-neutral-400">
        {label}
      </Label>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

/**
 * Get human-readable label for element type
 */
function getElementLabel(type) {
  const labels = {
    [ELEMENT_TYPES.PHOTO]: "Photo",
    [ELEMENT_TYPES.NAME]: "Nom",
    [ELEMENT_TYPES.POSITION]: "Poste",
    [ELEMENT_TYPES.COMPANY]: "Entreprise",
    [ELEMENT_TYPES.PHONE]: "Téléphone",
    [ELEMENT_TYPES.MOBILE]: "Mobile",
    [ELEMENT_TYPES.EMAIL]: "Email",
    [ELEMENT_TYPES.WEBSITE]: "Site web",
    [ELEMENT_TYPES.ADDRESS]: "Adresse",
    [ELEMENT_TYPES.SOCIAL_ICONS]: "Réseaux sociaux",
    [ELEMENT_TYPES.LOGO]: "Logo",
    [ELEMENT_TYPES.TEXT]: "Texte",
    [ELEMENT_TYPES.SEPARATOR_LINE]: "Séparateur",
    [ELEMENT_TYPES.SPACER]: "Espace",
  };
  return labels[type] || type;
}
