"use client";

import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  GripVertical,
  Image,
  User,
  Briefcase,
  Minus,
  Phone,
  ImageIcon,
  Share2,
  ArrowLeftRight,
  Plus,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { cn } from "@/src/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";

// Configuration des éléments disponibles
const ELEMENTS_CONFIG = {
  photo: {
    id: "photo",
    label: "Photo",
    icon: Image,
    description: "Votre photo",
  },
  fullName: {
    id: "fullName",
    label: "Nom",
    icon: User,
    description: "Prénom et nom",
  },
  position: {
    id: "position",
    label: "Poste",
    icon: Briefcase,
    description: "Votre fonction",
  },
  separator: {
    id: "separator",
    label: "Séparateur",
    icon: Minus,
    description: "Ligne de séparation",
  },
  contact: {
    id: "contact",
    label: "Contact",
    icon: Phone,
    description: "Email, téléphone, etc.",
  },
  logo: {
    id: "logo",
    label: "Logo",
    icon: ImageIcon,
    description: "Logo entreprise",
  },
  social: {
    id: "social",
    label: "Réseaux",
    icon: Share2,
    description: "Liens sociaux",
  },
};

// Ordres par défaut
const DEFAULT_VERTICAL_ORDER = [
  "photo",
  "fullName",
  "position",
  "separator",
  "contact",
  "logo",
  "social",
];
const DEFAULT_HORIZONTAL_LAYOUT = {
  leftColumn: ["photo", "fullName", "position"],
  rightColumn: ["contact"],
  bottomRow: ["separator", "logo", "social"],
};

// Fonction helper pour rendre un élément draggable compact
const renderDraggableElement = (elementId, provided, snapshot) => {
  const element = ELEMENTS_CONFIG[elementId];
  const Icon = element?.icon;

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md border bg-background transition-all cursor-grab active:cursor-grabbing",
        snapshot.isDragging
          ? "shadow-lg border-primary/50 ring-2 ring-primary/20 z-50"
          : "border-border hover:border-primary/30"
      )}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground" />
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      <span className="text-xs font-medium truncate">
        {element?.label || elementId}
      </span>
    </div>
  );
};

// Composant pour une zone droppable
const DroppableZone = ({ droppableId, title, items, className }) => {
  // Filtrer les éléments valides uniquement
  const validItems = items.filter((id) => ELEMENTS_CONFIG[id]);

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{title}</Label>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[60px] p-2 rounded-lg border transition-colors space-y-1.5",
              snapshot.isDraggingOver
                ? "bg-primary/10 border-primary/30"
                : "bg-muted/30 border-border"
            )}
          >
            {validItems.map((elementId, index) => (
              <Draggable
                key={elementId}
                draggableId={`${droppableId}-${elementId}`}
                index={index}
              >
                {(provided, snapshot) =>
                  renderDraggableElement(elementId, provided, snapshot)
                }
              </Draggable>
            ))}
            {provided.placeholder}
            {validItems.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Déposez ici
              </p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

const ElementsOrderSection = ({ signatureData, updateSignatureData }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isHorizontal = signatureData.orientation === "horizontal";

  // Données pour le mode vertical
  const verticalOrder =
    signatureData.elementsOrder?.length > 0
      ? signatureData.elementsOrder
      : DEFAULT_VERTICAL_ORDER;

  // Données pour le mode horizontal
  const horizontalLayout =
    signatureData.horizontalLayout || DEFAULT_HORIZONTAL_LAYOUT;

  // Éléments masqués
  const hiddenElements = signatureData.hiddenElements || [];

  // Toggle visibility d'un élément
  const toggleElementVisibility = (elementId) => {
    const newHidden = hiddenElements.includes(elementId)
      ? hiddenElements.filter((id) => id !== elementId)
      : [...hiddenElements, elementId];
    updateSignatureData("hiddenElements", newHidden);
  };

  // Vérifier si un élément est visible
  const isElementVisible = (elementId) => !hiddenElements.includes(elementId);

  // Gestion du drag pour le mode vertical
  const handleVerticalDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(verticalOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    updateSignatureData("elementsOrder", items);
  };

  // Gestion du drag pour le mode horizontal (entre colonnes)
  const handleHorizontalDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Extraire l'ID de l'élément (format: "droppableId-elementId")
    // Ex: "left-column-photo" -> on veut "photo"
    const draggableIdParts = result.draggableId.split("-");
    // Trouver où commence l'elementId (après "left"/"right"/"bottom" et "column"/"row")
    let elementId;
    if (draggableIdParts[0] === "left" || draggableIdParts[0] === "right") {
      // "left-column-photo" ou "right-column-contact" -> prendre tout après "column"
      elementId = draggableIdParts.slice(2).join("-");
    } else if (draggableIdParts[0] === "bottom") {
      // "bottom-row-separator" -> prendre tout après "row"
      elementId = draggableIdParts.slice(2).join("-");
    } else {
      elementId = draggableIdParts.slice(1).join("-");
    }

    // Mapper les droppableIds aux clés du layout
    const zoneMap = {
      "left-column": "leftColumn",
      "right-column": "rightColumn",
      "bottom-row": "bottomRow",
    };

    const sourceZone = zoneMap[source.droppableId];
    const destZone = zoneMap[destination.droppableId];

    if (!sourceZone || !destZone) return;

    const newLayout = { ...horizontalLayout };

    // Copier les tableaux
    const sourceItems = [...(newLayout[sourceZone] || [])];
    const destItems =
      sourceZone === destZone ? sourceItems : [...(newLayout[destZone] || [])];

    // Retirer de la source
    const [movedItem] = sourceItems.splice(source.index, 1);

    // Ajouter à la destination
    if (sourceZone === destZone) {
      sourceItems.splice(destination.index, 0, movedItem);
      newLayout[sourceZone] = sourceItems;
    } else {
      destItems.splice(destination.index, 0, movedItem);
      newLayout[sourceZone] = sourceItems;
      newLayout[destZone] = destItems;
    }

    updateSignatureData("horizontalLayout", newLayout);
  };

  const resetOrder = () => {
    if (isHorizontal) {
      updateSignatureData("horizontalLayout", DEFAULT_HORIZONTAL_LAYOUT);
    } else {
      updateSignatureData("elementsOrder", DEFAULT_VERTICAL_ORDER);
    }
    updateSignatureData("hiddenElements", []);
  };

  // Contenu du mode vertical
  const VerticalContent = () => (
    <DragDropContext onDragEnd={handleVerticalDragEnd}>
      <Droppable droppableId="vertical-elements">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-1"
          >
            {verticalOrder
              .filter((id) => ELEMENTS_CONFIG[id])
              .map((elementId, index) => {
                const element = ELEMENTS_CONFIG[elementId];
                const Icon = element.icon;
                const isVisible = isElementVisible(elementId);

                return (
                  <Draggable
                    key={elementId}
                    draggableId={elementId}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded transition-all",
                          snapshot.isDragging
                            ? "shadow-md bg-white dark:bg-gray-800"
                            : "bg-[#FAFAFA] dark:bg-gray-800/50",
                          !isVisible && "opacity-50"
                        )}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </div>

                        <Icon className="h-3.5 w-3.5 text-gray-500" />

                        <span className={cn(
                          "text-xs font-medium flex-1",
                          isVisible ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500 line-through"
                        )}>
                          {element.label}
                        </span>

                        {/* Visibility toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleElementVisibility(elementId);
                          }}
                          className={cn(
                            "p-1 rounded transition-colors",
                            isVisible
                              ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                              : "text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                          )}
                          title={isVisible ? "Masquer" : "Afficher"}
                        >
                          {isVisible ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </Draggable>
                );
              })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );

  // Contenu du mode horizontal
  const HorizontalContent = () => (
    <DragDropContext onDragEnd={handleHorizontalDragEnd}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <DroppableZoneMinimal
            droppableId="left-column"
            title="Gauche"
            items={horizontalLayout.leftColumn || []}
          />
          <DroppableZoneMinimal
            droppableId="right-column"
            title="Droite"
            items={horizontalLayout.rightColumn || []}
          />
        </div>
        <DroppableZoneMinimal
          droppableId="bottom-row"
          title="Bas"
          items={horizontalLayout.bottomRow || []}
        />
      </div>
    </DragDropContext>
  );

  // Zone droppable minimaliste
  const DroppableZoneMinimal = ({ droppableId, title, items }) => {
    const validItems = items.filter((id) => ELEMENTS_CONFIG[id]);

    return (
      <div className="space-y-1">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">
          {title}
        </span>
        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "min-h-[40px] p-1.5 rounded-md space-y-1 transition-colors",
                snapshot.isDraggingOver
                  ? "bg-[#5B4EFF]/10"
                  : "bg-gray-50 dark:bg-gray-800/50"
              )}
            >
              {validItems.map((elementId, index) => (
                <Draggable
                  key={elementId}
                  draggableId={`${droppableId}-${elementId}`}
                  index={index}
                >
                  {(provided, snapshot) => {
                    const element = ELEMENTS_CONFIG[elementId];
                    const Icon = element?.icon;
                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={cn(
                          "flex items-center gap-1.5 px-1.5 py-1 rounded cursor-grab active:cursor-grabbing",
                          snapshot.isDragging
                            ? "shadow-md bg-white dark:bg-gray-800"
                            : "bg-[#FAFAFA] dark:bg-gray-800"
                        )}
                      >
                        <GripVertical className="h-2.5 w-2.5 text-gray-400" />
                        {Icon && <Icon className="h-3 w-3 text-gray-500" />}
                        <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                          {element?.label}
                        </span>
                      </div>
                    );
                  }}
                </Draggable>
              ))}
              {provided.placeholder}
              {validItems.length === 0 && (
                <p className="text-[10px] text-gray-400 text-center py-1">
                  Vide
                </p>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  // Rendu principal avec Collapsible
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-sm font-medium hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
            Éléments de la signature
          </button>
        </CollapsibleTrigger>
        <button
          onClick={resetOrder}
          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Réinitialiser
        </button>
      </div>

      <CollapsibleContent className="mt-3">
        <div className="space-y-2">
          <p className="text-[10px] text-gray-400">
            Glissez pour réorganiser. Cliquez sur l'oeil pour masquer/afficher.
          </p>
          {isHorizontal ? <HorizontalContent /> : <VerticalContent />}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ElementsOrderSection;
