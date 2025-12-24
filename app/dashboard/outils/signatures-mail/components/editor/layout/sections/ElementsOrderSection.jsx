"use client";

import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Image, User, Briefcase, Building2, Minus, Phone, ImageIcon, Share2, ArrowLeftRight } from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/utils";

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
  company: {
    id: "company",
    label: "Entreprise",
    icon: Building2,
    description: "Nom de l'entreprise",
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
const DEFAULT_VERTICAL_ORDER = ["photo", "fullName", "position", "company", "separator", "contact", "logo", "social"];
const DEFAULT_HORIZONTAL_LAYOUT = {
  leftColumn: ["photo", "fullName", "position", "company"],
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
      <span className="text-xs font-medium truncate">{element?.label || elementId}</span>
    </div>
  );
};

// Composant pour une zone droppable
const DroppableZone = ({ droppableId, title, items, className }) => {
  // Filtrer les éléments valides uniquement
  const validItems = items.filter(id => ELEMENTS_CONFIG[id]);
  
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
              <Draggable key={elementId} draggableId={`${droppableId}-${elementId}`} index={index}>
                {(provided, snapshot) => renderDraggableElement(elementId, provided, snapshot)}
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
  const isHorizontal = signatureData.orientation === "horizontal";

  // Données pour le mode vertical
  const verticalOrder = signatureData.elementsOrder?.length > 0 
    ? signatureData.elementsOrder 
    : DEFAULT_VERTICAL_ORDER;

  // Données pour le mode horizontal
  const horizontalLayout = signatureData.horizontalLayout || DEFAULT_HORIZONTAL_LAYOUT;

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
    const destItems = sourceZone === destZone ? sourceItems : [...(newLayout[destZone] || [])];

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
  };

  // Rendu pour le mode vertical
  if (!isHorizontal) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Ordre des éléments</Label>
          <button
            type="button"
            onClick={resetOrder}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Réinitialiser
          </button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Glissez-déposez pour réorganiser les éléments
        </p>

        <DragDropContext onDragEnd={handleVerticalDragEnd}>
          <Droppable droppableId="vertical-elements">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "space-y-1.5 p-2 rounded-lg border transition-colors",
                  snapshot.isDraggingOver ? "bg-accent/50 border-primary/30" : "bg-muted/30 border-border"
                )}
              >
                {verticalOrder.filter(id => ELEMENTS_CONFIG[id]).map((elementId, index) => {
                  const element = ELEMENTS_CONFIG[elementId];
                  const Icon = element.icon;

                  return (
                    <Draggable key={elementId} draggableId={elementId} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-md border bg-background transition-all",
                            snapshot.isDragging 
                              ? "shadow-lg border-primary/50 ring-2 ring-primary/20" 
                              : "border-border hover:border-primary/30"
                          )}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                          
                          <div className="flex items-center justify-center w-6 h-6 rounded bg-muted">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{element.label}</p>
                          </div>
                          
                          <span className="text-xs text-muted-foreground font-mono">
                            {index + 1}
                          </span>
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
      </div>
    );
  }

  // Rendu pour le mode horizontal (3 zones)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Disposition des éléments</Label>
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <button
          type="button"
          onClick={resetOrder}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Réinitialiser
        </button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Glissez les éléments entre les colonnes pour personnaliser votre signature
      </p>

      <DragDropContext onDragEnd={handleHorizontalDragEnd}>
        {/* Colonnes gauche et droite */}
        <div className="grid grid-cols-2 gap-3">
          <DroppableZone
            droppableId="left-column"
            title="Colonne gauche"
            items={horizontalLayout.leftColumn || []}
          />
          <DroppableZone
            droppableId="right-column"
            title="Colonne droite"
            items={horizontalLayout.rightColumn || []}
          />
        </div>

        {/* Zone du bas */}
        <DroppableZone
          droppableId="bottom-row"
          title="Zone du bas (pleine largeur)"
          items={horizontalLayout.bottomRow || []}
        />
      </DragDropContext>
    </div>
  );
};

export default ElementsOrderSection;
