/**
 * Gestionnaire de sections de signature
 * Détecte les blocs (rows avec leurs colonnes) et permet de drag & drop le contenu entre blocs
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Columns, Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import { Switch } from "@/src/components/ui/switch";
import { useSignatureGenerator } from "../../../hooks/useSignatureGenerator";
import { Button } from "@/src/components/ui/button";

// Fonction pour détecter les blocs (rows et leurs colonnes avec tous les td)
function detectBlocks(htmlString, signatureData = {}) {
  if (!htmlString) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const blocks = [];
  
  // Trouver la table principale
  const mainTable = doc.querySelector("table");
  if (!mainTable) return [];

  const rows = mainTable.querySelectorAll(":scope > tbody > tr");

  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll(":scope > td");
    const rowBlocks = [];
    let hasContent = false;

    cells.forEach((cell, cellIndex) => {
      // Ignorer les séparateurs verticaux (td avec width: 1px ou 8px)
      const width = cell.style.width;
      if (width === "1px" || width === "8px") return;

      const textContent = cell.textContent.trim();
      const hasImage = cell.querySelector("img") !== null;
      const hasHr = cell.querySelector("hr") !== null;
      
      // Vérifier si le td contient une table (= colonne avec structure)
      const innerTable = cell.querySelector(":scope > table");
      if (innerTable) {
        // Extraire tous les <tr> de cette table interne
        const innerRows = innerTable.querySelectorAll(":scope > tbody > tr");
        const items = [];

        innerRows.forEach((innerRow, innerRowIndex) => {
          const innerCells = innerRow.querySelectorAll(":scope > td");
          
          innerCells.forEach((innerCell, innerCellIndex) => {
            const cellText = innerCell.textContent.trim();
            const hasImage = innerCell.querySelector("img") !== null;
            const hasIcon = innerCell.querySelector('img[width="16"]') !== null;
            const hasTable = innerCell.querySelector("table") !== null;

            // Ignorer seulement si vraiment vide (pas d'image, pas de texte)
            if (!cellText && !hasImage && !hasTable) return;

            // Déterminer le type
            let type = "text";
            let label = cellText.substring(0, 30) || "Élément";

            if (hasImage && !hasIcon) {
              type = "media";
              label = innerCell.querySelector("img")?.alt || "Image";
            } else if (hasIcon || cellText.includes("@")) {
              type = "contact";
            } else if (hasTable) {
              type = "contact"; // Les contacts sont souvent dans des tables imbriquées
            } else if (cellText.length > 0) {
              type = "personal";
            }

            // Détecter le champ correspondant
            let field = null;
            if (type === "media" && hasImage && !hasIcon) {
              field = "photo";
            } else if (type === "personal") {
              // Essayer de matcher avec les champs personnels
              if (cellText.includes(signatureData.fullName || "")) field = "fullName";
              else if (cellText.includes(signatureData.position || "")) field = "position";
              else if (cellText.includes(signatureData.companyName || "")) field = "companyName";
            } else if (type === "contact") {
              // Essayer de matcher avec les champs de contact
              if (cellText.includes(signatureData.phone || "")) field = "phone";
              else if (cellText.includes(signatureData.mobile || "")) field = "mobile";
              else if (cellText.includes(signatureData.email || "")) field = "email";
              else if (cellText.includes(signatureData.website || "")) field = "website";
              else if (cellText.includes(signatureData.address || "")) field = "address";
            }

            items.push({
              id: `item-r${rowIndex}-c${cellIndex}-ir${innerRowIndex}-ic${innerCellIndex}`,
              type,
              label,
              textContent: cellText.substring(0, 100) || label,
              html: innerCell.innerHTML,
              colspan: innerCell.getAttribute("colspan") || "1",
              field, // Ajouter le champ détecté
            });
          });
        });

        if (items.length > 0) {
          rowBlocks.push({
            id: `col-r${rowIndex}-c${cellIndex}`,
            row: rowIndex,
            column: cellIndex,
            items,
          });
          hasContent = true;
        }
      } else if (hasHr || hasImage || textContent.length > 0) {
        // Td simple avec contenu (ex: séparateur horizontal, logo seul, réseaux sociaux)
        
        if (hasHr) {
          // C'est un séparateur horizontal
          rowBlocks.push({
            id: `col-r${rowIndex}-c${cellIndex}`,
            row: rowIndex,
            column: cellIndex,
            items: [{
              id: `item-r${rowIndex}-c${cellIndex}-separator`,
              type: "separator",
              label: "Séparateur horizontal",
              textContent: "---",
              html: cell.innerHTML,
              colspan: cell.getAttribute("colspan") || "1",
              field: "separator",
            }],
          });
          hasContent = true;
        } else if (hasImage) {
          // Image seule (logo, etc.)
          const imgAlt = cell.querySelector("img")?.alt || "Image";
          // Détecter si c'est le logo ou la photo
          let field = "logo";
          if (imgAlt === "Photo de profil" || imgAlt === "Image") {
            field = "photo";
          }
          
          rowBlocks.push({
            id: `col-r${rowIndex}-c${cellIndex}`,
            row: rowIndex,
            column: cellIndex,
            items: [{
              id: `item-r${rowIndex}-c${cellIndex}-image`,
              type: "media",
              label: imgAlt,
              textContent: imgAlt,
              html: cell.innerHTML,
              colspan: cell.getAttribute("colspan") || "1",
              field,
            }],
          });
          hasContent = true;
        } else if (textContent.length > 0) {
          // Autre contenu simple
          rowBlocks.push({
            id: `col-r${rowIndex}-c${cellIndex}`,
            row: rowIndex,
            column: cellIndex,
            items: [{
              id: `item-r${rowIndex}-c${cellIndex}-simple`,
              type: "content",
              label: textContent.substring(0, 30) || "Contenu",
              textContent: textContent.substring(0, 100),
              html: cell.innerHTML,
              colspan: cell.getAttribute("colspan") || "1",
              field: null, // Contenu générique
            }],
          });
          hasContent = true;
        }
      }
    });

    // Ajouter les blocs de cette row (même s'il n'y a qu'un séparateur)
    if (hasContent) {
      blocks.push({
        id: `row-${rowIndex}`,
        label: `Row ${rowIndex + 1}`,
        rowIndex,
        columns: rowBlocks,
      });
    }
  });

  return blocks;
}

// Composant pour une zone droppable (bloc)
function DroppableBlock({ block, children, isOver }) {
  const { setNodeRef } = useDroppable({
    id: block.id,
    data: {
      type: "block",
      block,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`border-2 rounded-lg p-4 transition-all min-h-[100px] ${
        isOver ? "bg-accent/50 border-primary/50 scale-[1.02]" : "border-border bg-muted/20"
      }`}
    >
      {children}
    </div>
  );
}

// Composant pour un élément draggable (item individuel)
function DraggableItem({ item, columnId }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.id,
    data: {
      columnId,
      item,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "media":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "personal":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "contact":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "separator":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 p-2 bg-background border rounded hover:shadow-sm transition-all ${
        isDragging ? "shadow-lg ring-2 ring-primary" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
      >
        <GripVertical size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className={`text-xs px-1.5 py-0.5 rounded ${getTypeColor(item.type)}`}>
            {item.type}
          </div>
          <span className="text-xs font-medium truncate">{item.label}</span>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {item.textContent}
        </div>
      </div>
    </div>
  );
}

export default function SignatureSectionsManager() {
  const { signatureData, updateSignatureData } = useSignatureData();
  const { generateHTML } = useSignatureGenerator();
  const [blocks, setBlocks] = useState([]);
  const [expandedBlocks, setExpandedBlocks] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Détecter les blocs
  useEffect(() => {
    try {
      const html = generateHTML();
      const detectedBlocks = detectBlocks(html, signatureData);
      
      // Si sectionsOrder est vide, l'initialiser avec les blocs détectés
      const existingSectionsOrder = signatureData.sectionsOrder || [];
      if (existingSectionsOrder.length === 0 && detectedBlocks.length > 0) {
        console.log("🔄 [SECTIONS] Initialisation de sectionsOrder avec", detectedBlocks.length, "blocs");
        updateSignatureData("sectionsOrder", detectedBlocks);
      }
      
      setBlocks(detectedBlocks);
      
      // Expand all blocks by default
      const expanded = {};
      detectedBlocks.forEach(block => {
        expanded[block.id] = true;
      });
      setExpandedBlocks(expanded);
    } catch (error) {
      console.error("Erreur détection blocs:", error);
      setBlocks([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    signatureData.fullName,
    signatureData.position,
    signatureData.companyName,
    signatureData.phone,
    signatureData.mobile,
    signatureData.email,
    signatureData.website,
    signatureData.address,
    signatureData.photo,
    signatureData.logo,
    signatureData.displayMode,
  ]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { over } = event;
    setOverId(over?.id || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    let newBlocks = blocks;

    // Cas 1 : Déplacer un item vers une autre colonne
    if (activeData.item && overData.type === "block") {
      newBlocks = blocks.map(block => ({
        ...block,
        columns: block.columns.map(col => {
          if (col.id === activeData.columnId) {
            return {
              ...col,
              items: col.items.filter(item => item.id !== active.id),
            };
          }
          if (col.id === overData.block.id) {
            return {
              ...col,
              items: [...col.items, activeData.item],
            };
          }
          return col;
        }),
      }));
    }
    // Cas 2 : Réorganiser les items dans la même colonne
    else if (activeData.item && overData.item && activeData.columnId === overData.columnId) {
      newBlocks = blocks.map(block => ({
        ...block,
        columns: block.columns.map(col => {
          if (col.id === activeData.columnId) {
            const oldIndex = col.items.findIndex(item => item.id === active.id);
            const newIndex = col.items.findIndex(item => item.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
              const newItems = [...col.items];
              [newItems[oldIndex], newItems[newIndex]] = [newItems[newIndex], newItems[oldIndex]];
              return { ...col, items: newItems };
            }
          }
          return col;
        }),
      }));
    }
    // Cas 3 : Déplacer un item vers une colonne d'une autre row
    else if (activeData.item && overData.item && activeData.columnId !== overData.columnId) {
      newBlocks = blocks.map(block => ({
        ...block,
        columns: block.columns.map(col => {
          if (col.id === activeData.columnId) {
            return {
              ...col,
              items: col.items.filter(item => item.id !== active.id),
            };
          }
          if (col.id === overData.columnId) {
            const newIndex = col.items.findIndex(item => item.id === over.id);
            const newItems = [...col.items];
            newItems.splice(newIndex + 1, 0, activeData.item);
            return { ...col, items: newItems };
          }
          return col;
        }),
      }));
    }

    // Sauvegarder les blocs
    setBlocks(newBlocks);
    updateSignatureData("sectionsOrder", newBlocks);
    
    // Synchroniser avec elementsOrder pour que la preview se mette à jour
    // Extraire tous les items dans l'ordre des blocs
    const flatItems = newBlocks.flatMap(block => 
      block.columns.flatMap(col => col.items)
    );
    
    // Mapper vers elementsOrder (simplification : on garde juste l'ordre)
    // Pour l'instant, on force juste un re-render
    updateSignatureData("_sectionsVersion", Date.now());
    
    console.log("✅ [DRAG] Sections mises à jour:", newBlocks.length, "blocs");
    console.log("📊 [DRAG] Détails:", JSON.stringify(newBlocks.map(b => ({
      id: b.id,
      columns: b.columns.length,
      items: b.columns.reduce((sum, col) => sum + col.items.length, 0)
    }))));
    console.log("📋 [DRAG] Items plats:", flatItems.length, "items");
  };

  const toggleBlock = (blockId) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
  };

  const activeItem = activeId
    ? blocks.flatMap(b => b.columns).flatMap(c => c.items).find(i => i.id === activeId)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Gestionnaire de blocs</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {blocks.length} bloc{blocks.length > 1 ? "s" : ""} détecté{blocks.length > 1 ? "s" : ""} - Glissez le contenu entre les blocs
          </p>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Aucun bloc détecté</p>
          <p className="text-xs mt-1">Ajoutez du contenu à votre signature</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            {blocks.map((block, blockIndex) => (
              <div key={block.id} className="border rounded-lg overflow-hidden">
                {/* Header du bloc */}
                <div className="bg-muted/50 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleBlock(block.id)}
                    >
                      {expandedBlocks[block.id] ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </Button>
                    <span className="text-sm font-medium">Bloc {blockIndex + 1}</span>
                    <span className="text-xs text-muted-foreground">
                      ({block.columns.length} colonne{block.columns.length > 1 ? "s" : ""})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Columns size={14} />
                    <span>Row {block.rowIndex + 1}</span>
                  </div>
                </div>

                {/* Contenu du bloc */}
                {expandedBlocks[block.id] && (
                  <div className="p-4">
                    <div className="space-y-4">
                      {block.columns.map((column, colIndex) => (
                        <DroppableBlock
                          key={column.id}
                          block={column}
                          isOver={overId === column.id}
                        >
                          <div className="text-xs font-medium text-muted-foreground mb-3">
                            Colonne {colIndex + 1} ({column.items.length} élément{column.items.length > 1 ? 's' : ''})
                          </div>
                          <SortableContext
                            items={column.items.map(item => item.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {column.items.map((item) => (
                                <DraggableItem
                                  key={item.id}
                                  item={item}
                                  columnId={column.id}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DroppableBlock>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeItem && (
              <div className="flex items-center gap-2 p-3 bg-background border-2 border-primary rounded-lg shadow-lg">
                <GripVertical size={14} className="text-muted-foreground" />
                <span className="text-xs font-medium">{activeItem.label}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-2">
        <p>💡 <strong>Structure détectée :</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Chaque <strong>Bloc</strong> = une row de votre signature</li>
          <li>Chaque <strong>Colonne</strong> = un td avec du contenu</li>
          <li>Glissez-déposez le contenu entre les colonnes/blocs</li>
        </ul>
      </div>
    </div>
  );
}
