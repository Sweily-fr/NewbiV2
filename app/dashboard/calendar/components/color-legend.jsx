"use client";

import { useState, useCallback } from "react";
import { Palette, ChevronDown, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { useCalendarColorLabels } from "@/src/hooks/useCalendarColorLabels";
import { ColorPicker } from "@/src/components/ui/color-picker";

export function ColorLegend() {
  const { labels, loading, updateLoading, updateLabels } = useCalendarColorLabels();
  const [isOpen, setIsOpen] = useState(false);

  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null = adding, number = editing
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [labelText, setLabelText] = useState("");

  const openAddDialog = useCallback(() => {
    if (labels.length >= 20) {
      toast.error("Maximum 20 étiquettes.");
      return;
    }
    setEditingIndex(null);
    setSelectedColor("#3B82F6");
    setLabelText("");
    setDialogOpen(true);
  }, [labels.length]);

  const openEditDialog = useCallback(
    (index) => {
      const entry = labels[index];
      setEditingIndex(index);
      setSelectedColor(entry.color);
      setLabelText(entry.label);
      setDialogOpen(true);
    },
    [labels]
  );

  const handleSave = useCallback(async () => {
    const trimmed = labelText.trim();
    if (!trimmed) {
      toast.error("Le nom de l'étiquette ne peut pas être vide.");
      return;
    }

    let newLabels;
    if (editingIndex !== null) {
      // Edit existing
      newLabels = labels.map((entry, i) =>
        i === editingIndex ? { color: selectedColor, label: trimmed } : { color: entry.color, label: entry.label }
      );
    } else {
      // Add new
      newLabels = [...labels.map(({ color, label }) => ({ color, label })), { color: selectedColor, label: trimmed }];
    }

    try {
      await updateLabels(newLabels);
      setDialogOpen(false);
      toast.success(editingIndex !== null ? "Étiquette modifiée" : "Étiquette ajoutée");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  }, [labelText, editingIndex, selectedColor, labels, updateLabels]);

  const handleDelete = useCallback(
    async (index) => {
      if (labels.length <= 1) {
        toast.error("Il faut au moins une étiquette.");
        return;
      }
      const newLabels = labels
        .filter((_, i) => i !== index)
        .map(({ color, label }) => ({ color, label }));

      try {
        await updateLabels(newLabels);
        toast.success("Étiquette supprimée");
      } catch {
        toast.error("Erreur lors de la suppression");
      }
    },
    [labels, updateLabels]
  );

  if (loading) return null;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="px-2 sm:px-4">
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Palette className="h-4 w-4" />
              <span className="text-sm">Étiquettes</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="pt-2 pb-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
              {labels.map((entry, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => openEditDialog(index)}
                  className="flex items-center gap-2 py-1 px-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground truncate flex-1 text-left">
                    {entry.label}
                  </span>
                  <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                </button>
              ))}
            </div>

            {labels.length < 20 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={openAddDialog}
                className="mt-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter une étiquette
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Modal ajout / édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Modifier l'étiquette" : "Nouvelle étiquette"}
            </DialogTitle>
            <DialogDescription>
              {editingIndex !== null
                ? "Modifiez le nom ou la couleur de cette étiquette."
                : "Choisissez une couleur et donnez un nom à cette étiquette."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Color picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Couleur</label>
              <ColorPicker
                color={selectedColor}
                onChange={setSelectedColor}
              />
            </div>

            {/* Label name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nom</label>
              <Input
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                placeholder="Ex: Rendez-vous, Deadline, Personnel..."
                maxLength={30}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between">
            {editingIndex !== null && labels.length > 1 ? (
              <Button
                variant="ghost"
                onClick={() => {
                  handleDelete(editingIndex);
                  setDialogOpen(false);
                }}
                disabled={updateLoading}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={updateLoading}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={updateLoading || !labelText.trim()}>
                {updateLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingIndex !== null ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
