"use client";

import React, { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Settings, GripVertical, Image, Type, User, Building } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';

// Composant pour un élément déplaçable
const DraggableElement = ({ element, onUpdate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getElementIcon = (type) => {
    switch (type) {
      case 'photo': return <User className="w-4 h-4" />;
      case 'logo': return <Building className="w-4 h-4" />;
      case 'text': return <Type className="w-4 h-4" />;
      case 'custom': return <Plus className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 bg-white border rounded-lg shadow-sm",
        isDragging && "shadow-lg"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className="flex items-center gap-2 flex-1">
        {getElementIcon(element.type)}
        <span className="text-sm font-medium">{element.type}</span>
        <Badge variant="outline" className="text-xs">
          {element.alignment}
        </Badge>
      </div>

      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onUpdate(element)}
          className="h-6 w-6 p-0"
        >
          <Settings className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(element.id)}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

// Composant pour une cellule de la grille
const GridCell = ({ cell, onElementsChange, onAddElement }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = cell.elements.findIndex(el => el.id === active.id);
      const newIndex = cell.elements.findIndex(el => el.id === over.id);
      const newElements = arrayMove(cell.elements, oldIndex, newIndex);
      onElementsChange(cell.id, newElements);
    }
  };

  const handleDeleteElement = (elementId) => {
    const newElements = cell.elements.filter(el => el.id !== elementId);
    onElementsChange(cell.id, newElements);
  };

  const handleUpdateElement = (element) => {
    // L'édition sera gérée dans le panneau de droite
    console.log('Élément sélectionné pour édition:', element);
  };

  return (
    <Card className="h-full min-h-[200px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            Cellule {cell.row + 1}-{cell.col + 1}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddElement(cell.id)}
            className="h-6 px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={cell.elements.map(el => el.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {cell.elements.map((element) => (
                <DraggableElement
                  key={element.id}
                  element={element}
                  onUpdate={handleUpdateElement}
                  onDelete={handleDeleteElement}
                />
              ))}
              {cell.elements.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Zone vide - Cliquez sur "Ajouter" pour ajouter un élément
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};

// Composant principal de l'éditeur
const CustomSignatureBuilder = ({ signatureData, onLayoutChange }) => {
  // Structure par défaut si pas de customLayout
  const defaultLayout = {
    grid: { rows: 2, cols: 2 },
    cells: [
      { id: "cell-0-0", row: 0, col: 0, elements: [], borders: { top: false, right: false, bottom: false, left: false } },
      { id: "cell-0-1", row: 0, col: 1, elements: [], borders: { top: false, right: false, bottom: false, left: false } },
      { id: "cell-1-0", row: 1, col: 0, elements: [], borders: { top: false, right: false, bottom: false, left: false } },
      { id: "cell-1-1", row: 1, col: 1, elements: [], borders: { top: false, right: false, bottom: false, left: false } }
    ]
  };

  const layout = signatureData.customLayout || defaultLayout;
  const [showAddElementModal, setShowAddElementModal] = useState(false);
  const [selectedCellId, setSelectedCellId] = useState(null);

  // Mettre à jour les éléments d'une cellule
  const updateCellElements = (cellId, elements) => {
    const newLayout = {
      ...layout,
      cells: layout.cells.map(cell =>
        cell.id === cellId ? { ...cell, elements } : cell
      )
    };
    onLayoutChange(newLayout);
  };

  // Ajouter un élément
  const addElement = (cellId, elementType) => {
    const newElement = {
      id: `element-${Date.now()}`,
      type: elementType,
      content: getDefaultContent(elementType),
      alignment: 'left',
      styles: getDefaultStyles(elementType)
    };

    const cell = layout.cells.find(c => c.id === cellId);
    if (cell) {
      updateCellElements(cellId, [...cell.elements, newElement]);
    }
    setShowAddElementModal(false);
  };

  const getDefaultContent = (type) => {
    switch (type) {
      case 'photo': return signatureData.photo || '';
      case 'logo': return signatureData.logo || '';
      case 'text': return 'Nouveau texte';
      case 'custom': return 'Contenu personnalisé';
      default: return '';
    }
  };

  const getDefaultStyles = (type) => {
    switch (type) {
      case 'text':
        return { fontSize: '14px', color: '#000', fontWeight: 'normal' };
      case 'custom':
        return { fontSize: '14px', color: '#666' };
      default:
        return {};
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration de grille déplacée dans le panneau de droite */}

      {/* Grille d'édition */}
      <div 
        className="grid gap-4"
        style={{
          gridTemplateRows: `repeat(${layout.grid.rows}, 1fr)`,
          gridTemplateColumns: `repeat(${layout.grid.cols}, 1fr)`
        }}
      >
        {layout.cells.map((cell) => (
          <GridCell
            key={cell.id}
            cell={cell}
            onElementsChange={updateCellElements}
            onAddElement={(cellId) => {
              setSelectedCellId(cellId);
              setShowAddElementModal(true);
            }}
          />
        ))}
      </div>

      {/* Modal d'ajout d'élément */}
      {showAddElementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Ajouter un élément</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => addElement(selectedCellId, 'photo')}
                  className="h-20 flex-col"
                >
                  <User className="w-6 h-6 mb-2" />
                  Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addElement(selectedCellId, 'logo')}
                  className="h-20 flex-col"
                >
                  <Building className="w-6 h-6 mb-2" />
                  Logo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addElement(selectedCellId, 'text')}
                  className="h-20 flex-col"
                >
                  <Type className="w-6 h-6 mb-2" />
                  Texte
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addElement(selectedCellId, 'custom')}
                  className="h-20 flex-col"
                >
                  <Plus className="w-6 h-6 mb-2" />
                  Personnalisé
                </Button>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddElementModal(false)}
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal d'édition supprimé - édition maintenant dans le panneau de droite */}
    </div>
  );
};

export default CustomSignatureBuilder;
