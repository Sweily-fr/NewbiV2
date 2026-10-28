"use client";

import { useState, useCallback } from "react";
import {
  Palette,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
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

// canEdit : ajout et modification des étiquettes (rôle avec écriture sur le
// calendrier) ; sinon légende en consultation
export function ColorLegend({ canEdit = true }) {
  const { labels, loading, updateLoading, updateLabels } =
    useCalendarColorLabels();
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
    [labels],
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
        i === editingIndex
          ? { color: selectedColor, label: trimmed }
          : { color: entry.color, label: entry.label },
      );
    } else {
      // Add new
      newLabels = [
        ...labels.map(({ color, label }) => ({ color, label })),
        { color: selectedColor, label: trimmed },
      ];
    }

    try {
      await updateLabels(newLabels);
      setDialogOpen(false);
      toast.success(
        editingIndex !== null ? "Étiquette modifiée" : "Étiquette ajoutée",
      );
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
    [labels, updateLabels],
  );

  if (loading) return null;

  return (
    <>
      {/* Bouton de l'en-tête : la légende s'ouvre par-dessus le calendrier
          au lieu d'occuper une ligne (la page tient dans l'écran) */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="gap-1.5 font-normal"
            aria-label="Étiquettes"
          >
            <Palette className="h-4 w-4" />
            <span className="max-2xl:hidden">Étiquettes</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 opacity-60 transition-transform duration-200 max-2xl:hidden",
                isOpen && "rotate-180",
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-2">
          <p className="text-muted-foreground px-1.5 pt-1 pb-2 text-xs font-medium">
            Étiquettes de couleur
          </p>
          <div className="flex flex-col gap-0.5">
            {labels.map((entry, index) =>
              canEdit ? (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openEditDialog(index);
                  }}
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
              ) : (
                // Sans « Modifier » : légende en lecture simple
                <div
                  key={index}
                  className="flex items-center gap-2 py-1 px-1.5"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground truncate flex-1 text-left">
                    {entry.label}
                  </span>
                </div>
              ),
            )}
          </div>

          {canEdit && labels.length < 20 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                openAddDialog();
              }}
              className="mt-1 w-full justify-start gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter une étiquette
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* Modal ajout / édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null
                ? "Modifier l'étiquette"
                : "Nouvelle étiquette"}
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
              <label className="text-sm font-medium text-foreground">
                Couleur
              </label>
              <ColorPicker
                color={selectedColor}
                onChange={setSelectedColor}
                inline
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
              <Button
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                disabled={updateLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateLoading || !labelText.trim()}
              >
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
