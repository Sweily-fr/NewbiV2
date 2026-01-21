"use client";

import React from "react";
import { Trash2, X } from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Slider } from "@/src/components/ui/slider";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import { WIDGET_TYPES } from "../../utils/widget-registry";

/**
 * Settings panel for Text widget
 */
function TextSettings({ widget, onUpdate }) {
  const { props } = widget;

  const handleChange = (key, value) => {
    onUpdate(widget.id, { [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Taille du texte</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={props.fontSize || 14}
            onChange={(e) => handleChange("fontSize", parseInt(e.target.value) || 14)}
            className="w-16 h-8"
            min={8}
            max={48}
          />
          <Slider
            value={[props.fontSize || 14]}
            onValueChange={(v) => handleChange("fontSize", v[0])}
            min={8}
            max={48}
            step={1}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Graisse</Label>
        <Select
          value={props.fontWeight || "400"}
          onValueChange={(v) => handleChange("fontWeight", v)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="300">Light</SelectItem>
            <SelectItem value="400">Normal</SelectItem>
            <SelectItem value="500">Medium</SelectItem>
            <SelectItem value="600">Semi-bold</SelectItem>
            <SelectItem value="700">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Couleur</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={props.color || "#171717"}
            onChange={(e) => handleChange("color", e.target.value)}
            className="w-8 h-8 rounded border cursor-pointer"
          />
          <Input
            type="text"
            value={props.color || "#171717"}
            onChange={(e) => handleChange("color", e.target.value)}
            className="flex-1 h-8 text-xs font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Alignement</Label>
        <Select
          value={props.textAlign || "left"}
          onValueChange={(v) => handleChange("textAlign", v)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Gauche</SelectItem>
            <SelectItem value="center">Centre</SelectItem>
            <SelectItem value="right">Droite</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/**
 * Settings panel for Image widget
 */
function ImageSettings({ widget, onUpdate }) {
  const { props } = widget;

  const handleChange = (key, value) => {
    onUpdate(widget.id, { [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Taille</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={props.width || 70}
            onChange={(e) => {
              const size = parseInt(e.target.value) || 70;
              handleChange("width", size);
              handleChange("height", size);
            }}
            className="w-16 h-8"
            min={30}
            max={200}
          />
          <Slider
            value={[props.width || 70]}
            onValueChange={(v) => {
              handleChange("width", v[0]);
              handleChange("height", v[0]);
            }}
            min={30}
            max={200}
            step={5}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Forme</Label>
        <Select
          value={props.borderRadius === "50%" ? "round" : "square"}
          onValueChange={(v) =>
            handleChange("borderRadius", v === "round" ? "50%" : "8px")
          }
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="round">Rond</SelectItem>
            <SelectItem value="square">Carré</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/**
 * Settings panel for Logo widget
 */
function LogoSettings({ widget, onUpdate }) {
  const { props } = widget;

  const handleChange = (key, value) => {
    onUpdate(widget.id, { [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Hauteur max</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={props.maxHeight || 50}
            onChange={(e) => handleChange("maxHeight", parseInt(e.target.value) || 50)}
            className="w-16 h-8"
            min={20}
            max={100}
          />
          <Slider
            value={[props.maxHeight || 50]}
            onValueChange={(v) => handleChange("maxHeight", v[0])}
            min={20}
            max={100}
            step={5}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Settings panel for Separator widget
 */
function SeparatorSettings({ widget, onUpdate }) {
  const { props } = widget;

  const handleChange = (key, value) => {
    onUpdate(widget.id, { [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Orientation</Label>
        <Select
          value={props.orientation || "horizontal"}
          onValueChange={(v) => handleChange("orientation", v)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="horizontal">Horizontal</SelectItem>
            <SelectItem value="vertical">Vertical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Épaisseur</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={props.thickness || 1}
            onChange={(e) => handleChange("thickness", parseInt(e.target.value) || 1)}
            className="w-16 h-8"
            min={1}
            max={10}
          />
          <Slider
            value={[props.thickness || 1]}
            onValueChange={(v) => handleChange("thickness", v[0])}
            min={1}
            max={10}
            step={1}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Couleur</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={props.color || "#e0e0e0"}
            onChange={(e) => handleChange("color", e.target.value)}
            className="w-8 h-8 rounded border cursor-pointer"
          />
          <Input
            type="text"
            value={props.color || "#e0e0e0"}
            onChange={(e) => handleChange("color", e.target.value)}
            className="flex-1 h-8 text-xs font-mono"
          />
        </div>
      </div>

      {props.orientation === "vertical" && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Longueur (px)</Label>
          <Input
            type="text"
            value={props.length || "50px"}
            onChange={(e) => handleChange("length", e.target.value)}
            className="h-8"
            placeholder="50px ou 100%"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Settings panel for Spacer widget
 */
function SpacerSettings({ widget, onUpdate }) {
  const { props } = widget;

  const handleChange = (key, value) => {
    onUpdate(widget.id, { [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Hauteur</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={props.height || 16}
            onChange={(e) => handleChange("height", parseInt(e.target.value) || 16)}
            className="w-16 h-8"
            min={4}
            max={100}
          />
          <Slider
            value={[props.height || 16]}
            onValueChange={(v) => handleChange("height", v[0])}
            min={4}
            max={100}
            step={4}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Settings panel for Social Icons widget
 */
function SocialIconsSettings({ widget, onUpdate }) {
  const { props } = widget;

  const handleChange = (key, value) => {
    onUpdate(widget.id, { [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Taille des icônes</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={props.size || 20}
            onChange={(e) => handleChange("size", parseInt(e.target.value) || 20)}
            className="w-16 h-8"
            min={12}
            max={48}
          />
          <Slider
            value={[props.size || 20]}
            onValueChange={(v) => handleChange("size", v[0])}
            min={12}
            max={48}
            step={2}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Espacement</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={props.gap || 8}
            onChange={(e) => handleChange("gap", parseInt(e.target.value) || 8)}
            className="w-16 h-8"
            min={2}
            max={24}
          />
          <Slider
            value={[props.gap || 8]}
            onValueChange={(v) => handleChange("gap", v[0])}
            min={2}
            max={24}
            step={2}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Couleur</Label>
        <Select
          value={props.color || "black"}
          onValueChange={(v) => handleChange("color", v)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="black">Noir</SelectItem>
            <SelectItem value="blue">Bleu</SelectItem>
            <SelectItem value="pink">Rose</SelectItem>
            <SelectItem value="purple">Violet</SelectItem>
            <SelectItem value="red">Rouge</SelectItem>
            <SelectItem value="green">Vert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Alignement</Label>
        <Select
          value={props.alignment || "left"}
          onValueChange={(v) => handleChange("alignment", v)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Gauche</SelectItem>
            <SelectItem value="center">Centre</SelectItem>
            <SelectItem value="right">Droite</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/**
 * Settings panel for Contact Row widget
 */
function ContactRowSettings({ widget, onUpdate }) {
  const { props } = widget;

  const handleChange = (key, value) => {
    onUpdate(widget.id, { [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Champ</Label>
        <Select
          value={props.field || "phone"}
          onValueChange={(v) => handleChange("field", v)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="phone">Téléphone</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="website">Site web</SelectItem>
            <SelectItem value="address">Adresse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Afficher l'icône</Label>
        <Switch
          checked={props.showIcon !== false}
          onCheckedChange={(v) => handleChange("showIcon", v)}
        />
      </div>

      {props.showIcon !== false && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Taille de l'icône</Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={props.iconSize || 14}
              onChange={(e) => handleChange("iconSize", parseInt(e.target.value) || 14)}
              className="w-16 h-8"
              min={10}
              max={24}
            />
            <Slider
              value={[props.iconSize || 14]}
              onValueChange={(v) => handleChange("iconSize", v[0])}
              min={10}
              max={24}
              step={1}
              className="flex-1"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Taille du texte</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={props.fontSize || 12}
            onChange={(e) => handleChange("fontSize", parseInt(e.target.value) || 12)}
            className="w-16 h-8"
            min={10}
            max={18}
          />
          <Slider
            value={[props.fontSize || 12]}
            onValueChange={(v) => handleChange("fontSize", v[0])}
            min={10}
            max={18}
            step={1}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Couleur</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={props.color || "#666666"}
            onChange={(e) => handleChange("color", e.target.value)}
            className="w-8 h-8 rounded border cursor-pointer"
          />
          <Input
            type="text"
            value={props.color || "#666666"}
            onChange={(e) => handleChange("color", e.target.value)}
            className="flex-1 h-8 text-xs font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Préfixe (optionnel)</Label>
        <Input
          type="text"
          value={props.prefix || ""}
          onChange={(e) => handleChange("prefix", e.target.value)}
          className="h-8"
          placeholder="ex: T. pour téléphone"
        />
      </div>
    </div>
  );
}

/**
 * Widget type labels
 */
const WIDGET_LABELS = {
  [WIDGET_TYPES.TEXT]: "Texte",
  [WIDGET_TYPES.IMAGE]: "Photo",
  [WIDGET_TYPES.LOGO]: "Logo",
  [WIDGET_TYPES.SEPARATOR]: "Séparateur",
  [WIDGET_TYPES.SPACER]: "Espace",
  [WIDGET_TYPES.SOCIAL_ICONS]: "Réseaux sociaux",
  [WIDGET_TYPES.CONTACT_ROW]: "Contact",
};

/**
 * WidgetSettings - Main settings panel component
 */
export default function WidgetSettings({ widget, onUpdate, onDelete, onClose }) {
  if (!widget) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Sélectionnez un élément pour modifier ses paramètres
      </div>
    );
  }

  const renderSettings = () => {
    switch (widget.type) {
      case WIDGET_TYPES.TEXT:
        return <TextSettings widget={widget} onUpdate={onUpdate} />;
      case WIDGET_TYPES.IMAGE:
        return <ImageSettings widget={widget} onUpdate={onUpdate} />;
      case WIDGET_TYPES.LOGO:
        return <LogoSettings widget={widget} onUpdate={onUpdate} />;
      case WIDGET_TYPES.SEPARATOR:
        return <SeparatorSettings widget={widget} onUpdate={onUpdate} />;
      case WIDGET_TYPES.SPACER:
        return <SpacerSettings widget={widget} onUpdate={onUpdate} />;
      case WIDGET_TYPES.SOCIAL_ICONS:
        return <SocialIconsSettings widget={widget} onUpdate={onUpdate} />;
      case WIDGET_TYPES.CONTACT_ROW:
        return <ContactRowSettings widget={widget} onUpdate={onUpdate} />;
      default:
        return <div className="text-sm text-muted-foreground">Pas de paramètres pour ce widget</div>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b">
        <h4 className="text-sm font-medium">
          {WIDGET_LABELS[widget.type] || "Widget"}
        </h4>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4 text-neutral-500" />
        </button>
      </div>

      {/* Settings */}
      {renderSettings()}

      {/* Delete button */}
      <div className="pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => onDelete(widget.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Supprimer cet élément
        </Button>
      </div>
    </div>
  );
}
