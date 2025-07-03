"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { toast } from "@/src/components/ui/sonner";

// Tableau des couleurs disponibles
const availableColors = [
  { name: "Bleu", value: "bg-blue-500" },
  { name: "Vert", value: "bg-green-500" },
  { name: "Jaune", value: "bg-yellow-500" },
  { name: "Rouge", value: "bg-red-500" },
  { name: "Violet", value: "bg-purple-500" },
  { name: "Rose", value: "bg-pink-500" },
];

const EditColumnDialog = ({ open, onOpenChange, column, onUpdate }) => {
  const [columnName, setColumnName] = useState("");
  const [selectedColor, setSelectedColor] = useState(availableColors[0].value);
  const [isLoading, setIsLoading] = useState(false);

  // Mettre à jour les champs quand la colonne change
  useEffect(() => {
    if (column) {
      setColumnName(column.title || "");
      setSelectedColor(column.color || availableColors[0].value);
    }
  }, [column]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!columnName.trim()) {
      toast.error("Le nom de la colonne est requis");
      return;
    }

    try {
      setIsLoading(true);
      const success = await onUpdate({
        title: columnName.trim(),
        color: selectedColor,
      });

      if (success) {
        onOpenChange?.(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!column) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier la colonne</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-column-name">
                Nom de la colonne <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-column-name"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                placeholder="Ex: En attente"
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full ${color.value} ${
                      selectedColor === color.value
                        ? "ring-2 ring-offset-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => setSelectedColor(color.value)}
                    aria-label={`Choisir la couleur ${color.name}`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!columnName.trim() || isLoading}>
              {isLoading
                ? "Enregistrement..."
                : "Enregistrer les modifications"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditColumnDialog;
