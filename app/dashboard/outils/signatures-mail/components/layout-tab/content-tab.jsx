"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import AlignmentSelector from "@/src/components/ui/alignment-selector";
import {
  CircleOff,
  Minus,
  Dot,
  Slash,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  Columns2,
  BetweenHorizontalStart,
  Table2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Grid3X3,
  Square,
} from "lucide-react";
import { useSliderWithInput } from "@/src/hooks/use-slider-with-input";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { Switch } from "@/src/components/ui/switch";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import SignatureSave from "../SignatureSave";

export default function ContentTab() {
  const { signatureData, updateSignatureData } = useSignatureData();
  
  const minValue = 0;
  const maxValue = 100;
  const initialValue = [25];

  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
  } = useSliderWithInput({ minValue, maxValue, initialValue });
  
  // Gestion de l'espacement entre prénom et nom
  const handleNameSpacingChange = (value) => {
    const numValue = parseInt(value) || 0;
    updateSignatureData('nameSpacing', Math.max(0, Math.min(20, numValue))); // Entre 0 et 20px
  };

  // Gestion de la taille de l'image de profil
  const handleImageSizeChange = (value) => {
    const numValue = parseInt(value) || 80;
    updateSignatureData('imageSize', Math.max(40, Math.min(150, numValue))); // Entre 40 et 150px
  };

  // Gestion de la forme de l'image de profil
  const handleImageShapeChange = (shape) => {
    updateSignatureData('imageShape', shape);
  };

  // Gestion de l'épaisseur du séparateur vertical
  const handleSeparatorVerticalWidthChange = (value) => {
    const numValue = parseInt(value) || 1;
    updateSignatureData('separatorVerticalWidth', Math.max(1, Math.min(5, numValue))); // Entre 1 et 5px
  };

  // Gestion de l'épaisseur du séparateur horizontal
  const handleSeparatorHorizontalWidthChange = (value) => {
    const numValue = parseInt(value) || 1;
    updateSignatureData('separatorHorizontalWidth', Math.max(1, Math.min(5, numValue))); // Entre 1 et 5px
  };

  // Gestion de la taille du logo
  const handleLogoSizeChange = (value) => {
    const numValue = parseInt(value) || 60;
    updateSignatureData('logoSize', Math.max(30, Math.min(120, numValue))); // Entre 30 et 120px
  };

  // Gestion des espacements
  const handleSpacingChange = (spacingKey, value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(30, numValue)); // Entre 0 et 30px
    updateSignatureData('spacings', {
      ...signatureData.spacings,
      [spacingKey]: clampedValue
    });
  };

  // Fonction spéciale pour l'espacement global
  const handleGlobalSpacingChange = (value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(30, numValue));
    
    // Applique l'espacement global à tous les espacements pour les deux layouts
    const updated = {
      ...signatureData.spacings,
      global: clampedValue,
      photoBottom: clampedValue,
      logoBottom: clampedValue,
      nameBottom: clampedValue,
      positionBottom: clampedValue,
      companyBottom: clampedValue,
      contactBottom: clampedValue,
      phoneToMobile: clampedValue,
      mobileToEmail: clampedValue,
      emailToWebsite: clampedValue,
      websiteToAddress: clampedValue,
      separatorTop: clampedValue,
      separatorBottom: clampedValue,
    };
    
    updateSignatureData('spacings', updated);
  };

  // Gestion des couleurs
  const handleColorChange = (colorKey, value) => {
    updateSignatureData('colors', {
      ...signatureData.colors,
      [colorKey]: value
    });
  };

  // Gestion de la largeur des colonnes
  const handleColumnWidthChange = (columnKey, value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(10, Math.min(90, numValue)); // Entre 10% et 90%
    const otherColumn = columnKey === 'photo' ? 'content' : 'photo';
    const otherValue = 100 - clampedValue;
    
    updateSignatureData('columnWidths', {
      [columnKey]: clampedValue,
      [otherColumn]: otherValue
    });
  };

  // Gestion de la grille personnalisée
  const handleCustomGridChange = (rows, cols) => {
    const newCells = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellId = `cell-${row}-${col}`;
        const existingCell = signatureData.customLayout?.cells?.find(c => c.id === cellId);
        newCells.push(existingCell || {
          id: cellId,
          row,
          col,
          elements: [],
          borders: { top: false, right: false, bottom: false, left: false }
        });
      }
    }

    const newLayout = {
      grid: { rows, cols },
      cells: newCells
    };

    updateSignatureData('customLayout', newLayout);
  };

  // Gestion des bordures de cellule
  const handleCellBorderChange = (cellId, side, enabled) => {
    if (!signatureData.customLayout) return;
    
    const updatedCells = signatureData.customLayout.cells.map(cell => {
      if (cell.id === cellId) {
        return {
          ...cell,
          borders: {
            ...cell.borders,
            [side]: enabled
          }
        };
      }
      return cell;
    });

    updateSignatureData('customLayout', {
      ...signatureData.customLayout,
      cells: updatedCells
    });
  };

  // Gestion de l'alignement des cellules
  const handleCellAlignmentChange = (cellId, alignment) => {
    if (!signatureData.customLayout) return;
    
    const updatedCells = signatureData.customLayout.cells.map(cell => {
      if (cell.id === cellId) {
        return {
          ...cell,
          alignment: alignment
        };
      }
      return cell;
    });

    updateSignatureData('customLayout', {
      ...signatureData.customLayout,
      cells: updatedCells
    });
  };

  // Gestion des dimensions des cellules
  const handleCellDimensionChange = (cellId, dimension, value) => {
    if (!signatureData.customLayout) return;
    
    const numValue = value === '' ? null : parseInt(value);
    
    const updatedCells = signatureData.customLayout.cells.map(cell => {
      if (cell.id === cellId) {
        return {
          ...cell,
          [dimension]: numValue
        };
      }
      return cell;
    });

    updateSignatureData('customLayout', {
      ...signatureData.customLayout,
      cells: updatedCells
    });
  };

  // Gestion des marges des éléments
  const handleElementMarginChange = (cellId, elementId, side, value) => {
    if (!signatureData.customLayout) return;
    
    const numValue = value === '' ? 0 : parseInt(value);
    
    const updatedCells = signatureData.customLayout.cells.map(cell => {
      if (cell.id === cellId) {
        const updatedElements = cell.elements.map(element => {
          if (element.id === elementId) {
            return {
              ...element,
              margins: {
                ...element.margins,
                [side]: numValue
              }
            };
          }
          return element;
        });
        
        return {
          ...cell,
          elements: updatedElements
        };
      }
      return cell;
    });

    updateSignatureData('customLayout', {
      ...signatureData.customLayout,
      cells: updatedCells
    });
  };

  // Ajouter un élément à une cellule
  const handleAddElementToCell = (cellId, elementType) => {
    if (!signatureData.customLayout) return;

    const newElement = {
      id: `element-${Date.now()}`,
      type: elementType,
      content: getDefaultElementContent(elementType),
      alignment: 'left',
      styles: getDefaultElementStyles(elementType)
    };

    const updatedCells = signatureData.customLayout.cells.map(cell => {
      if (cell.id === cellId) {
        return {
          ...cell,
          elements: [...(cell.elements || []), newElement]
        };
      }
      return cell;
    });

    updateSignatureData('customLayout', {
      ...signatureData.customLayout,
      cells: updatedCells
    });
  };

  // Supprimer un élément d'une cellule
  const handleRemoveElementFromCell = (cellId, elementId) => {
    if (!signatureData.customLayout) return;

    const updatedCells = signatureData.customLayout.cells.map(cell => {
      if (cell.id === cellId) {
        return {
          ...cell,
          elements: (cell.elements || []).filter(el => el.id !== elementId)
        };
      }
      return cell;
    });

    updateSignatureData('customLayout', {
      ...signatureData.customLayout,
      cells: updatedCells
    });
  };

  // Contenu par défaut pour les nouveaux éléments
  const getDefaultElementContent = (type) => {
    switch (type) {
      case 'photo': return signatureData.photo || '';
      case 'logo': return signatureData.logo || '';
      case 'text': return `${signatureData.firstName || ''} ${signatureData.lastName || ''}`.trim() || 'Nouveau texte';
      case 'custom': return 'Contenu personnalisé';
      default: return '';
    }
  };

  // Styles par défaut pour les nouveaux éléments
  const getDefaultElementStyles = (type) => {
    switch (type) {
      case 'text':
        return { fontSize: '16px', color: '#000', fontWeight: 'bold' };
      case 'custom':
        return { fontSize: '14px', color: '#666' };
      default:
        return {};
    }
  };



  return (
    <div className="mt-4 flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Mode d'affichage</h2>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between w-full">
            <Label className="text-xs text-muted-foreground">Orientation</Label>
            <AlignmentSelector
              items={[
                { value: "horizontal", icon: FlipVerticalIcon },
                { value: "vertical", icon: FlipHorizontalIcon },
              ]}
              size="sm"
              className="w-30"
              value={signatureData.layout}
              onValueChange={(value) => updateSignatureData('layout', value)}
            />
          </div>
        </div>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between gap-6">
            <Label className="text-xs text-muted-foreground">Alignement</Label>
            <AlignmentSelector className="w-30" />
          </div>
        </div>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between gap-6">
            <Label className="text-xs text-muted-foreground">
              Direction contact
            </Label>
            <AlignmentSelector
              items={[
                { value: "Colonne", icon: Columns2 },
                { value: "Ligne", icon: BetweenHorizontalStart },
                { value: "Grille", icon: Table2 },
              ]}
              size="sm"
              className="w-30"
            />
          </div>
        </div>
        <div className="space-y-2 ml-4">
          <div className="flex items-center justify-between gap-6">
            <Label className="text-xs text-muted-foreground">
              Alignement nom
            </Label>
            <AlignmentSelector
              items={[
                { value: "left", icon: AlignLeft },
                { value: "center", icon: AlignCenter },
                { value: "right", icon: AlignRight },
              ]}
              size="sm"
              className="w-30"
              value={signatureData.nameAlignment}
              onValueChange={(value) => updateSignatureData('nameAlignment', value)}
            />
          </div>
        </div>
      </div>
      <Separator />
      
      {/* Section Largeur des colonnes */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Largeur des colonnes</h2>
        <div className="space-y-3 ml-4">
          {/* Largeur colonne photo */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Photo</Label>
            <div className="flex items-center gap-3 w-30">
              <Slider
                value={[signatureData.columnWidths?.photo || 25]}
                onValueChange={(value) => handleColumnWidthChange('photo', value[0])}
                max={90}
                min={10}
                step={5}
                className="flex-1"
              />
              <input
                type="text"
                value={signatureData.columnWidths?.photo || 25}
                onChange={(e) => handleColumnWidthChange('photo', e.target.value)}
                className="w-12 h-6 px-2 text-xs border rounded text-center bg-white"
                min="10"
                max="90"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
          
          {/* Largeur colonne contenu */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Contenu</Label>
            <div className="flex items-center gap-3 w-30">
              <Slider
                value={[signatureData.columnWidths?.content || 75]}
                onValueChange={(value) => handleColumnWidthChange('content', value[0])}
                max={90}
                min={10}
                step={5}
                className="flex-1"
              />
              <input
                type="text"
                value={signatureData.columnWidths?.content || 75}
                onChange={(e) => handleColumnWidthChange('content', e.target.value)}
                className="w-12 h-6 px-2 text-xs border rounded text-center bg-white"
                min="10"
                max="90"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      </div>
      <Separator />
      
      {/* Section Configuration de grille personnalisée - visible uniquement pour le template custom */}
      {signatureData.template === 'custom' && (
        <>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Grid3X3 className="w-4 h-4" />
              Configuration de grille
            </h2>
            <div className="space-y-3 ml-4">
              {/* Nombre de lignes */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Lignes (max 2)</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant={signatureData.customLayout?.grid?.rows === 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCustomGridChange(1, signatureData.customLayout?.grid?.cols || 2)}
                    className="h-6 w-6 p-0"
                  >
                    1
                  </Button>
                  <Button
                    variant={signatureData.customLayout?.grid?.rows === 2 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCustomGridChange(2, signatureData.customLayout?.grid?.cols || 2)}
                    className="h-6 w-6 p-0"
                  >
                    2
                  </Button>
                </div>
              </div>
              
              {/* Nombre de colonnes */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Colonnes (max 2)</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant={signatureData.customLayout?.grid?.cols === 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCustomGridChange(signatureData.customLayout?.grid?.rows || 2, 1)}
                    className="h-6 w-6 p-0"
                  >
                    1
                  </Button>
                  <Button
                    variant={signatureData.customLayout?.grid?.cols === 2 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCustomGridChange(signatureData.customLayout?.grid?.rows || 2, 2)}
                    className="h-6 w-6 p-0"
                  >
                    2
                  </Button>
                </div>
              </div>

              {/* Configuration des bordures par cellule */}
              {signatureData.customLayout?.cells && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Bordures des cellules</Label>
                  {signatureData.customLayout.cells.map((cell) => (
                    <div key={cell.id} className="border rounded p-2 space-y-2">
                      <div className="text-xs font-medium text-center">
                        Cellule {cell.row + 1}-{cell.col + 1}
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {/* Bordure haut */}
                        <Button
                          variant={cell.borders?.top ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleCellBorderChange(cell.id, 'top', !cell.borders?.top)}
                          className="h-6 p-0 text-xs"
                          title="Bordure haut"
                        >
                          ↑
                        </Button>
                        {/* Bordure droite */}
                        <Button
                          variant={cell.borders?.right ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleCellBorderChange(cell.id, 'right', !cell.borders?.right)}
                          className="h-6 p-0 text-xs"
                          title="Bordure droite"
                        >
                          →
                        </Button>
                        {/* Bordure bas */}
                        <Button
                          variant={cell.borders?.bottom ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleCellBorderChange(cell.id, 'bottom', !cell.borders?.bottom)}
                          className="h-6 p-0 text-xs"
                          title="Bordure bas"
                        >
                          ↓
                        </Button>
                        {/* Bordure gauche */}
                        <Button
                          variant={cell.borders?.left ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleCellBorderChange(cell.id, 'left', !cell.borders?.left)}
                          className="h-6 p-0 text-xs"
                          title="Bordure gauche"
                        >
                          ←
                        </Button>
                      </div>
                      
                      {/* Alignement de la cellule */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Alignement</Label>
                        <div className="flex gap-1">
                          <Button
                            variant={cell.alignment === 'left' ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCellAlignmentChange(cell.id, 'left')}
                            className="h-6 p-0 text-xs flex-1"
                          >
                            ←
                          </Button>
                          <Button
                            variant={cell.alignment === 'center' ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCellAlignmentChange(cell.id, 'center')}
                            className="h-6 p-0 text-xs flex-1"
                          >
                            ↔
                          </Button>
                          <Button
                            variant={cell.alignment === 'right' ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCellAlignmentChange(cell.id, 'right')}
                            className="h-6 p-0 text-xs flex-1"
                          >
                            →
                          </Button>
                        </div>
                      </div>
                      
                      {/* Dimensions de la cellule */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Dimensions</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Largeur (px)</Label>
                            <Input
                              type="number"
                              value={cell.width || ''}
                              onChange={(e) => handleCellDimensionChange(cell.id, 'width', e.target.value)}
                              placeholder="Auto"
                              className="h-6 text-xs"
                              min="50"
                              max="500"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Hauteur (px)</Label>
                            <Input
                              type="number"
                              value={cell.height || ''}
                              onChange={(e) => handleCellDimensionChange(cell.id, 'height', e.target.value)}
                              placeholder="Auto"
                              className="h-6 text-xs"
                              min="50"
                              max="300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Gestion des éléments de la grille */}
              {signatureData.customLayout?.cells && (
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Éléments de la grille</Label>
                  {signatureData.customLayout.cells.map((cell) => (
                    <div key={cell.id} className="border rounded p-2 space-y-2">
                      <div className="text-xs font-medium text-center">
                        Cellule {cell.row + 1}-{cell.col + 1}
                      </div>
                      
                      {/* Ajouter un élément */}
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddElementToCell(cell.id, 'photo')}
                          className="h-6 px-2 text-xs flex-1"
                          title="Ajouter photo"
                        >
                          📷
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddElementToCell(cell.id, 'logo')}
                          className="h-6 px-2 text-xs flex-1"
                          title="Ajouter logo"
                        >
                          🏢
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddElementToCell(cell.id, 'text')}
                          className="h-6 px-2 text-xs flex-1"
                          title="Ajouter texte"
                        >
                          📝
                        </Button>
                      </div>

                      {/* Liste des éléments existants */}
                      {cell.elements && cell.elements.length > 0 && (
                        <div className="space-y-2">
                          {cell.elements.map((element, index) => (
                            <div key={element.id || index} className="border rounded p-2 bg-gray-50 space-y-2">
                              {/* En-tête de l'élément */}
                              <div className="flex items-center gap-2 text-xs">
                                <span className="flex-1 font-medium">
                                  {element.type === 'photo' && '📷 Photo de profil'}
                                  {element.type === 'logo' && '🏢 Logo entreprise'}
                                  {element.type === 'text' && `📝 ${element.content?.substring(0, 20)}...`}
                                  {element.type === 'custom' && `✨ ${element.content?.substring(0, 20)}...`}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveElementFromCell(cell.id, element.id)}
                                  className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                  title="Supprimer"
                                >
                                  ×
                                </Button>
                              </div>
                              
                              {/* Contrôles des marges */}
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Marges (px)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Haut</Label>
                                    <Input
                                      type="number"
                                      value={element.margins?.top || ''}
                                      onChange={(e) => handleElementMarginChange(cell.id, element.id, 'top', e.target.value)}
                                      placeholder="0"
                                      className="h-6 text-xs"
                                      min="0"
                                      max="50"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Bas</Label>
                                    <Input
                                      type="number"
                                      value={element.margins?.bottom || ''}
                                      onChange={(e) => handleElementMarginChange(cell.id, element.id, 'bottom', e.target.value)}
                                      placeholder="0"
                                      className="h-6 text-xs"
                                      min="0"
                                      max="50"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Gauche</Label>
                                    <Input
                                      type="number"
                                      value={element.margins?.left || ''}
                                      onChange={(e) => handleElementMarginChange(cell.id, element.id, 'left', e.target.value)}
                                      placeholder="0"
                                      className="h-6 text-xs"
                                      min="0"
                                      max="50"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Droite</Label>
                                    <Input
                                      type="number"
                                      value={element.margins?.right || ''}
                                      onChange={(e) => handleElementMarginChange(cell.id, element.id, 'right', e.target.value)}
                                      placeholder="0"
                                      className="h-6 text-xs"
                                      min="0"
                                      max="50"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Separator />
        </>
      )}
      
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Photo de profil</h2>
        <div className="flex flex-col gap-3 ml-4">
          {/* Upload de la photo de profil */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Photo</Label>
            <div className="flex items-center gap-3 w-30">
              {signatureData.photo ? (
                <div className="flex items-center gap-3 w-30">
                  <img 
                    src={signatureData.photo} 
                    alt="Photo" 
                    className="w-8 h-8 object-cover rounded border"
                    style={{
                      borderRadius: signatureData.imageShape === 'square' ? '4px' : '50%'
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => updateSignatureData('photo', e.target.result);
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    Changer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateSignatureData('photo', null)}
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                  >
                    Supprimer
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => updateSignatureData('photo', e.target.result);
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                  className="h-7 px-3 text-xs"
                >
                  Ajouter photo
                </Button>
              )}
            </div>
          </div>
          
          {/* Taille de la photo */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Taille</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.imageSize || 80}
                onChange={(e) => handleImageSizeChange(e.target.value)}
                onBlur={(e) => handleImageSizeChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleImageSizeChange(e.target.value);
                  }
                }}
                aria-label="Taille de l'image de profil"
                placeholder="80"
              />
              <Slider
                className="grow"
                value={[signatureData.imageSize || 80]}
                onValueChange={(value) => handleImageSizeChange(value[0])}
                min={40}
                max={150}
                step={5}
                aria-label="Taille image profil"
              />
            </div>
          </div>
          
          {/* Forme de la photo */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Forme</Label>
            <AlignmentSelector
              items={[
                { value: "square", icon: Table2 },
                { value: "round", icon: CircleOff }
              ]}
              size="sm"
              className="w-30"
              value={signatureData.imageShape || 'round'}
              onValueChange={handleImageShapeChange}
            />
          </div>
          
          {/* Alignement de la photo */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Alignement</Label>
            <AlignmentSelector
              items={[
                { value: "left", icon: AlignLeft },
                { value: "center", icon: AlignCenter },
                { value: "right", icon: AlignRight }
              ]}
              size="sm"
              className="w-30"
              value={signatureData.imageAlignment || 'left'}
              onValueChange={(value) => updateSignatureData('imageAlignment', value)}
            />
          </div>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Logo entreprise</h2>
        <div className="flex flex-col gap-3 ml-4">
          {/* Upload du logo entreprise */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Logo</Label>
            <div className="flex items-center gap-3 w-30">
              {signatureData.logo ? (
                <div className="flex items-center gap-3 w-30">
                  <img 
                    src={signatureData.logo} 
                    alt="Logo" 
                    className="w-8 h-8 object-contain rounded border"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => updateSignatureData('logo', e.target.result);
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    Changer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateSignatureData('logo', null)}
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                  >
                    Supprimer
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => updateSignatureData('logo', e.target.result);
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                  className="h-7 px-3 text-xs"
                >
                  Ajouter logo
                </Button>
              )}
            </div>
          </div>
          
          {/* Taille du logo */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Taille</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.logoSize || 60}
                onChange={(e) => handleLogoSizeChange(e.target.value)}
                onBlur={(e) => handleLogoSizeChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogoSizeChange(e.target.value);
                  }
                }}
                aria-label="Taille du logo entreprise"
                placeholder="60"
              />
              <Slider
                className="grow"
                value={[signatureData.logoSize || 60]}
                onValueChange={(value) => handleLogoSizeChange(value[0])}
                min={30}
                max={120}
                step={5}
                aria-label="Taille logo entreprise"
              />
            </div>
          </div>
          
          {/* Forme du logo */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Forme logo</Label>
            <AlignmentSelector
              items={[
                { value: "square", icon: Table2 },
                { value: "round", icon: CircleOff }
              ]}
              size="sm"
              className="w-30"
              value={signatureData.logoShape || 'square'}
              onValueChange={(value) => updateSignatureData('logoShape', value)}
            />
          </div>
          
          {/* Alignement du logo */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Alignement</Label>
            <AlignmentSelector
              items={[
                { value: "left", icon: AlignLeft },
                { value: "center", icon: AlignCenter },
                { value: "right", icon: AlignRight }
              ]}
              size="sm"
              className="w-30"
              value={signatureData.logoAlignment || 'center'}
              onValueChange={(value) => updateSignatureData('logoAlignment', value)}
            />
          </div>
        </div>
      </div>
      <Separator />
      
      {/* Section Réseaux sociaux */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Réseaux sociaux</h2>
        <div className="flex flex-col gap-3 ml-4">
          {/* LinkedIn */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">LinkedIn</Label>
            <Input
              className="h-8 w-48 px-2 text-xs"
              type="url"
              value={signatureData.socialLinks?.linkedin || ''}
              onChange={(e) => updateSignatureData('socialLinks', {
                ...signatureData.socialLinks,
                linkedin: e.target.value
              })}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          
          {/* Facebook */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Facebook</Label>
            <Input
              className="h-8 w-48 px-2 text-xs"
              type="url"
              value={signatureData.socialLinks?.facebook || ''}
              onChange={(e) => updateSignatureData('socialLinks', {
                ...signatureData.socialLinks,
                facebook: e.target.value
              })}
              placeholder="https://facebook.com/..."
            />
          </div>
          
          {/* Twitter */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Twitter</Label>
            <Input
              className="h-8 w-48 px-2 text-xs"
              type="url"
              value={signatureData.socialLinks?.twitter || ''}
              onChange={(e) => updateSignatureData('socialLinks', {
                ...signatureData.socialLinks,
                twitter: e.target.value
              })}
              placeholder="https://twitter.com/..."
            />
          </div>
          
          {/* Instagram */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Instagram</Label>
            <Input
              className="h-8 w-48 px-2 text-xs"
              type="url"
              value={signatureData.socialLinks?.instagram || ''}
              onChange={(e) => updateSignatureData('socialLinks', {
                ...signatureData.socialLinks,
                instagram: e.target.value
              })}
              placeholder="https://instagram.com/..."
            />
          </div>
          
          {/* Couleur des logos sociaux */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Couleur des logos</Label>
            <div className="flex items-center gap-2">
              <input 
                type="color"
                value={signatureData.colors?.social || '#0077B5'}
                onChange={(e) => updateSignatureData('colors', {
                  ...signatureData.colors,
                  social: e.target.value
                })}
                className="h-8 w-8 p-1 border rounded cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">
                {signatureData.colors?.social || '#0077B5'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <Separator />
      
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Typographie</h2>
        <div className="flex flex-col gap-3 ml-4">
          {/* Police générale */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Police générale</Label>
            <select
              value={signatureData.fontFamily || 'Arial, sans-serif'}
              onChange={(e) => updateSignatureData('fontFamily', e.target.value)}
              className="h-8 px-2 text-xs border rounded w-32 bg-white"
            >
              <option value="Arial, sans-serif">Arial</option>
              <option value="Helvetica, sans-serif">Helvetica</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Verdana, sans-serif">Verdana</option>
              <option value="Tahoma, sans-serif">Tahoma</option>
              <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
              <option value="'Courier New', monospace">Courier New</option>
            </select>
          </div>
          
          {/* Taille police nom */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Taille nom</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.fontSize?.name || 16}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value) || 16;
                  updateSignatureData('fontSize', {
                    ...signatureData.fontSize,
                    name: Math.max(10, Math.min(24, newSize))
                  });
                }}
                onBlur={(e) => {
                  const newSize = parseInt(e.target.value) || 16;
                  updateSignatureData('fontSize', {
                    ...signatureData.fontSize,
                    name: Math.max(10, Math.min(24, newSize))
                  });
                }}
                aria-label="Taille de police pour le nom"
                placeholder="16"
              />
              <Slider
                className="grow"
                value={[signatureData.fontSize?.name || 16]}
                onValueChange={(value) => {
                  updateSignatureData('fontSize', {
                    ...signatureData.fontSize,
                    name: value[0]
                  });
                }}
                min={10}
                max={24}
                step={1}
                aria-label="Taille police nom"
              />
            </div>
          </div>
          
          {/* Taille police poste */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Taille poste</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.fontSize?.position || 14}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value) || 14;
                  updateSignatureData('fontSize', {
                    ...signatureData.fontSize,
                    position: Math.max(8, Math.min(20, newSize))
                  });
                }}
                onBlur={(e) => {
                  const newSize = parseInt(e.target.value) || 14;
                  updateSignatureData('fontSize', {
                    ...signatureData.fontSize,
                    position: Math.max(8, Math.min(20, newSize))
                  });
                }}
                aria-label="Taille de police pour le poste"
                placeholder="14"
              />
              <Slider
                className="grow"
                value={[signatureData.fontSize?.position || 14]}
                onValueChange={(value) => {
                  updateSignatureData('fontSize', {
                    ...signatureData.fontSize,
                    position: value[0]
                  });
                }}
                min={8}
                max={20}
                step={1}
                aria-label="Taille police poste"
              />
            </div>
          </div>
          
          {/* Taille police contacts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Taille contacts</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.fontSize?.contact || 12}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value) || 12;
                  updateSignatureData('fontSize', {
                    ...signatureData.fontSize,
                    contact: Math.max(8, Math.min(16, newSize))
                  });
                }}
                onBlur={(e) => {
                  const newSize = parseInt(e.target.value) || 12;
                  updateSignatureData('fontSize', {
                    ...signatureData.fontSize,
                    contact: Math.max(8, Math.min(16, newSize))
                  });
                }}
                aria-label="Taille de police pour les contacts"
                placeholder="12"
              />
              <Slider
                className="grow"
                value={[signatureData.fontSize?.contact || 12]}
                onValueChange={(value) => {
                  updateSignatureData('fontSize', {
                    ...signatureData.fontSize,
                    contact: value[0]
                  });
                }}
                min={8}
                max={16}
                step={1}
                aria-label="Taille police contacts"
              />
            </div>
          </div>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Couleurs</h2>
        <div className="flex flex-col gap-3 ml-4">
          {/* Couleur du nom */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Nom et prénom</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-full px-2 py-1"
                type="text"
                inputMode="decimal"
                value={inputValues[0]}
                onChange={(e) => handleInputChange(e, 0)}
                onBlur={() => validateAndUpdateValue(inputValues[0], 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    validateAndUpdateValue(inputValues[0], 0);
                  }
                }}
                aria-label="Enter value"
              />
            </div>
          </div>
          
          {/* Nouvel espacement prénom/nom */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Prénom/Nom</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.nameSpacing}
                onChange={(e) => handleNameSpacingChange(e.target.value)}
                onBlur={(e) => handleNameSpacingChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleNameSpacingChange(e.target.value);
                  }
                }}
                aria-label="Espacement entre prénom et nom"
                placeholder="4"
              />
              <Slider
                className="grow"
                value={[signatureData.nameSpacing]}
                onValueChange={(value) => handleNameSpacingChange(value[0])}
                min={0}
                max={20}
                step={1}
                aria-label="Espacement prénom/nom"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Taille image</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.imageSize || 80}
                onChange={(e) => handleImageSizeChange(e.target.value)}
                onBlur={(e) => handleImageSizeChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleImageSizeChange(e.target.value);
                  }
                }}
                aria-label="Taille de l'image de profil"
                placeholder="80"
              />
              <Slider
                className="grow"
                value={[signatureData.imageSize || 80]}
                onValueChange={(value) => handleImageSizeChange(value[0])}
                min={40}
                max={150}
                step={5}
                aria-label="Taille image profil"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Forme image</Label>
            <AlignmentSelector
              items={[
                { value: "round", icon: CircleOff },
                { value: "square", icon: Table2 },
              ]}
              size="sm"
              className="w-30"
              value={signatureData.imageShape || 'round'}
              onValueChange={handleImageShapeChange}
            />
          </div>
          
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Structure</h2>
        <div className="flex flex-col gap-3 ml-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Séparateurs</Label>
            <AlignmentSelector
              items={[
                { value: "none", icon: CircleOff },
                { value: "line", icon: Minus },
                { value: "dot", icon: Dot },
                { value: "slash", icon: Slash },
              ]}
              size="sm"
              className="w-30"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Séparateur vertical</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.separatorVerticalWidth || 1}
                onChange={(e) => handleSeparatorVerticalWidthChange(e.target.value)}
                onBlur={(e) => handleSeparatorVerticalWidthChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSeparatorVerticalWidthChange(e.target.value);
                  }
                }}
                aria-label="Épaisseur du séparateur vertical"
                placeholder="1"
              />
              <Slider
                className="grow"
                value={[signatureData.separatorVerticalWidth || 1]}
                onValueChange={(value) => handleSeparatorVerticalWidthChange(value[0])}
                min={1}
                max={5}
                step={1}
                aria-label="Épaisseur séparateur vertical"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Séparateur horizontal</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.separatorHorizontalWidth || 1}
                onChange={(e) => handleSeparatorHorizontalWidthChange(e.target.value)}
                onBlur={(e) => handleSeparatorHorizontalWidthChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSeparatorHorizontalWidthChange(e.target.value);
                  }
                }}
                aria-label="Épaisseur du séparateur horizontal"
                placeholder="1"
              />
              <Slider
                className="grow"
                value={[signatureData.separatorHorizontalWidth || 1]}
                onValueChange={(value) => handleSeparatorHorizontalWidthChange(value[0])}
                min={1}
                max={5}
                step={1}
                aria-label="Épaisseur séparateur horizontal"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Largeur maximale
            </Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={inputValues[0]}
                onChange={(e) => handleInputChange(e, 0)}
                onBlur={() => validateAndUpdateValue(inputValues[0], 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    validateAndUpdateValue(inputValues[0], 0);
                  }
                }}
                aria-label="Enter value"
              />
              <Slider
                className="grow"
                value={sliderValue}
                onValueChange={handleSliderChange}
                min={minValue}
                max={maxValue}
                aria-label="Slider with input"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Largeur</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={inputValues[0]}
                onChange={(e) => handleInputChange(e, 0)}
                onBlur={() => validateAndUpdateValue(inputValues[0], 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    validateAndUpdateValue(inputValues[0], 0);
                  }
                }}
                aria-label="Enter value"
              />
              <Slider
                className="grow"
                value={sliderValue}
                onValueChange={handleSliderChange}
                min={minValue}
                max={maxValue}
                aria-label="Slider with input"
              />
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Espacements</h2>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Détaillé</Label>
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={signatureData.detailedSpacing || false}
                onChange={(e) => updateSignatureData('detailedSpacing', e.target.checked)}
                className="sr-only"
                id="detailed-spacing-toggle"
              />
              <label
                htmlFor="detailed-spacing-toggle"
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer ${
                  signatureData.detailedSpacing
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    signatureData.detailedSpacing ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </label>
            </div>
          </div>
        </div>
        
        {!signatureData.detailedSpacing ? (
          // Mode espacement global
          <div className="flex flex-col gap-3 ml-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Espacement global</Label>
              <div className="flex items-center gap-3 w-30">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={signatureData.spacings?.global || 8}
                  onChange={(e) => {
                    handleGlobalSpacingChange(e.target.value);
                  }}
                  min={0}
                  max={30}
                  className="h-8 w-12 px-2 py-1"
                  aria-label="Espacement global"
                  placeholder="8"
                />
                <Slider
                  className="grow"
                  value={[signatureData.spacings?.global || 8]}
                  onValueChange={(value) => {
                    handleGlobalSpacingChange(value[0]);
                  }}
                  min={0}
                  max={30}
                  step={2}
                  aria-label="Espacement global"
                />
              </div>
            </div>
          </div>
        ) : (
          // Mode espacement détaillé
          <div className="flex flex-col gap-3 ml-4">
          {/* Espacement sous la photo - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {signatureData.layout === 'vertical' ? 'Sous photo' : 'Photo → Contenu'}
            </Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.photoBottom || 12}
                onChange={(e) => handleSpacingChange('photoBottom', e.target.value)}
                onBlur={(e) => handleSpacingChange('photoBottom', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('photoBottom', e.target.value);
                  }
                }}
                min={0}
                max={30}
                aria-label="Espacement photo"
                placeholder="12"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.photoBottom || 12]}
                onValueChange={(value) => handleSpacingChange('photoBottom', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement photo"
              />
            </div>
          </div>
          
          {/* Espacement sous le logo - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {signatureData.layout === 'vertical' ? 'Sous logo' : 'Logo → Contenu'}
            </Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.logoBottom || 12}
                onChange={(e) => handleSpacingChange('logoBottom', e.target.value)}
                onBlur={(e) => handleSpacingChange('logoBottom', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('logoBottom', e.target.value);
                  }
                }}
                min={0}
                max={30}
                aria-label="Espacement logo"
                placeholder="12"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.logoBottom || 12]}
                onValueChange={(value) => handleSpacingChange('logoBottom', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement logo"
              />
            </div>
          </div>
          
          {/* Espacement sous le nom - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {signatureData.layout === 'vertical' ? 'Sous nom' : 'Nom → Poste'}
            </Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.nameBottom || 8}
                onChange={(e) => handleSpacingChange('nameBottom', e.target.value)}
                onBlur={(e) => handleSpacingChange('nameBottom', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('nameBottom', e.target.value);
                  }
                }}
                min={0}
                max={30}
                aria-label="Espacement nom"
                placeholder="8"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.nameBottom || 8]}
                onValueChange={(value) => handleSpacingChange('nameBottom', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement nom"
              />
            </div>
          </div>
          
          {/* Espacement sous le poste - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {signatureData.layout === 'vertical' ? 'Sous poste' : 'Poste → Entreprise'}
            </Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.positionBottom || 8}
                onChange={(e) => handleSpacingChange('positionBottom', e.target.value)}
                onBlur={(e) => handleSpacingChange('positionBottom', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('positionBottom', e.target.value);
                  }
                }}
                min={0}
                max={30}
                aria-label="Espacement poste"
                placeholder="8"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.positionBottom || 8]}
                onValueChange={(value) => handleSpacingChange('positionBottom', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement poste"
              />
            </div>
          </div>
          
          {/* Espacement sous l'entreprise - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {signatureData.layout === 'vertical' ? 'Sous entreprise' : 'Entreprise → Contacts'}
            </Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.companyBottom || 12}
                onChange={(e) => handleSpacingChange('companyBottom', e.target.value)}
                onBlur={(e) => handleSpacingChange('companyBottom', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('companyBottom', e.target.value);
                  }
                }}
                min={0}
                max={30}
                aria-label="Espacement entreprise"
                placeholder="12"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.companyBottom || 12]}
                onValueChange={(value) => handleSpacingChange('companyBottom', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement entreprise"
              />
            </div>
          </div>
          
          {/* Espacement entre téléphone et mobile - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Téléphone → Mobile</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.phoneToMobile || 4}
                onChange={(e) => handleSpacingChange('phoneToMobile', e.target.value)}
                onBlur={(e) => handleSpacingChange('phoneToMobile', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('phoneToMobile', e.target.value);
                  }
                }}
                min={0}
                max={20}
                aria-label="Espacement téléphone vers mobile"
                placeholder="4"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.phoneToMobile || 4]}
                onValueChange={(value) => handleSpacingChange('phoneToMobile', value[0])}
                min={0}
                max={20}
                step={1}
                aria-label="Espacement téléphone vers mobile"
              />
            </div>
          </div>
          
          {/* Espacement entre mobile et email - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Mobile → Email</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.mobileToEmail || 4}
                onChange={(e) => handleSpacingChange('mobileToEmail', e.target.value)}
                onBlur={(e) => handleSpacingChange('mobileToEmail', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('mobileToEmail', e.target.value);
                  }
                }}
                min={0}
                max={20}
                aria-label="Espacement mobile vers email"
                placeholder="4"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.mobileToEmail || 4]}
                onValueChange={(value) => handleSpacingChange('mobileToEmail', value[0])}
                min={0}
                max={20}
                step={1}
                aria-label="Espacement mobile vers email"
              />
            </div>
          </div>
          
          {/* Espacement entre email et site web - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Email → Site web</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.emailToWebsite || 4}
                onChange={(e) => handleSpacingChange('emailToWebsite', e.target.value)}
                onBlur={(e) => handleSpacingChange('emailToWebsite', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('emailToWebsite', e.target.value);
                  }
                }}
                min={0}
                max={20}
                aria-label="Espacement email vers site web"
                placeholder="4"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.emailToWebsite || 4]}
                onValueChange={(value) => handleSpacingChange('emailToWebsite', value[0])}
                min={0}
                max={20}
                step={1}
                aria-label="Espacement email vers site web"
              />
            </div>
          </div>
          
          {/* Espacement entre site web et adresse - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Site web → Adresse</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.websiteToAddress || 4}
                onChange={(e) => handleSpacingChange('websiteToAddress', e.target.value)}
                onBlur={(e) => handleSpacingChange('websiteToAddress', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('websiteToAddress', e.target.value);
                  }
                }}
                min={0}
                max={20}
                aria-label="Espacement site web vers adresse"
                placeholder="4"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.websiteToAddress || 4]}
                onValueChange={(value) => handleSpacingChange('websiteToAddress', value[0])}
                min={0}
                max={20}
                step={1}
                aria-label="Espacement site web vers adresse"
              />
            </div>
          </div>
          
          {/* Espacement entre les contacts - disponible pour les deux layouts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Entre contacts</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.contactBottom || 6}
                onChange={(e) => handleSpacingChange('contactBottom', e.target.value)}
                onBlur={(e) => handleSpacingChange('contactBottom', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSpacingChange('contactBottom', e.target.value);
                  }
                }}
                min={0}
                max={30}
                aria-label="Espacement entre contacts"
                placeholder="6"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.contactBottom || 6]}
                onValueChange={(value) => handleSpacingChange('contactBottom', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement entre contacts"
              />
            </div>
          </div>
          
          {/* Espacement au-dessus du séparateur */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Avant séparateur</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.separatorTop || 12}
                onChange={(e) => handleSpacingChange('separatorTop', e.target.value)}
                min={0}
                max={30}

                aria-label="Espacement avant le séparateur"
                placeholder="12"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.separatorTop || 12]}
                onValueChange={(value) => handleSpacingChange('separatorTop', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement avant séparateur"
              />
            </div>
          </div>
          
          {/* Espacement sous le séparateur */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Après séparateur</Label>
            <div className="flex items-center gap-3 w-30">
              <Input
                className="h-8 w-12 px-2 py-1"
                type="text"
                inputMode="decimal"
                value={signatureData.spacings?.separatorBottom || 12}
                onChange={(e) => handleSpacingChange('separatorBottom', e.target.value)}
                min={0}
                max={30}

                aria-label="Espacement après le séparateur"
                placeholder="12"
              />
              <Slider
                className="grow"
                value={[signatureData.spacings?.separatorBottom || 12]}
                onValueChange={(value) => handleSpacingChange('separatorBottom', value[0])}
                min={0}
                max={30}
                step={2}
                aria-label="Espacement après séparateur"
              />
            </div>
          </div>
          
        </div>
        )}
      </div>
      
      <Separator />
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Couleurs</h2>
        <div className="flex flex-col gap-3 ml-4">
          
          {/* Couleur du nom */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Nom et prénom</Label>
            <div className="flex items-center gap-3 w-30">
              <input
                type="color"
                value={signatureData.colors?.name || "#2563eb"}
                onChange={(e) => handleColorChange('name', e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                title="Couleur du nom et prénom"
              />
              <span className="text-xs text-muted-foreground w-16 text-right">
                {signatureData.colors?.name || "#2563eb"}
              </span>
            </div>
          </div>
          
          {/* Couleur du poste */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Poste</Label>
            <div className="flex items-center gap-3 w-30">
              <input
                type="color"
                value={signatureData.colors?.position || "#666666"}
                onChange={(e) => handleColorChange('position', e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                title="Couleur du poste"
              />
              <span className="text-xs text-muted-foreground w-16 text-right">
                {signatureData.colors?.position || "#666666"}
              </span>
            </div>
          </div>
          
          {/* Couleur de l'entreprise */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Entreprise</Label>
            <div className="flex items-center gap-3 w-30">
              <input
                type="color"
                value={signatureData.colors?.company || "#2563eb"}
                onChange={(e) => handleColorChange('company', e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                title="Couleur du nom d'entreprise"
              />
              <span className="text-xs text-muted-foreground w-16 text-right">
                {signatureData.colors?.company || "#2563eb"}
              </span>
            </div>
          </div>
          
          {/* Couleur des contacts */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Contacts</Label>
            <div className="flex items-center gap-3 w-30">
              <input
                type="color"
                value={signatureData.colors?.contact || "#666666"}
                onChange={(e) => handleColorChange('contact', e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                title="Couleur des informations de contact"
              />
              <span className="text-xs text-muted-foreground w-16 text-right">
                {signatureData.colors?.contact || "#666666"}
              </span>
            </div>
          </div>
          
          {/* Couleur du séparateur vertical */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Séparateur vertical</Label>
            <div className="flex items-center gap-3 w-30">
              <input
                type="color"
                value={signatureData.colors?.separatorVertical || "#e0e0e0"}
                onChange={(e) => handleColorChange('separatorVertical', e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                title="Couleur du séparateur vertical"
              />
              <span className="text-xs text-muted-foreground w-16 text-right">
                {signatureData.colors?.separatorVertical || "#e0e0e0"}
              </span>
            </div>
          </div>
          
          {/* Couleur du séparateur horizontal */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Séparateur horizontal</Label>
            <div className="flex items-center gap-3 w-30">
              <input
                type="color"
                value={signatureData.colors?.separatorHorizontal || "#e0e0e0"}
                onChange={(e) => handleColorChange('separatorHorizontal', e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                title="Couleur du séparateur horizontal"
              />
              <span className="text-xs text-muted-foreground w-16 text-right">
                {signatureData.colors?.separatorHorizontal || "#e0e0e0"}
              </span>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Bouton de sauvegarde */}
      <Separator />
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Sauvegarde</h2>
        <div className="flex justify-center">
          <SignatureSave />
        </div>
      </div>
    </div>
  );
}
