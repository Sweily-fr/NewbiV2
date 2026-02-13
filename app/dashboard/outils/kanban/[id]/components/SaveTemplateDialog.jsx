"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { SAVE_BOARD_AS_TEMPLATE, GET_KANBAN_TEMPLATES } from "@/src/graphql/kanbanQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { toast } from "@/src/components/ui/sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { BookTemplate, LoaderCircle } from "lucide-react";

export function SaveTemplateDialog({ boardId, boardTitle }) {
  const { workspaceId } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [saveBoardAsTemplate, { loading }] = useMutation(SAVE_BOARD_AS_TEMPLATE, {
    onCompleted: () => {
      toast.success("Template sauvegardé avec succès");
      setOpen(false);
      setName("");
      setDescription("");
    },
    onError: (error) => {
      toast.error("Erreur lors de la sauvegarde du template");
      console.error("Save template error:", error);
    },
    refetchQueries: [{ query: GET_KANBAN_TEMPLATES, variables: { workspaceId } }],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom du template est requis");
      return;
    }

    await saveBoardAsTemplate({
      variables: {
        input: {
          boardId,
          name: name.trim(),
          description: description.trim() || null,
        },
        workspaceId,
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v && !name) {
          setName(`Template - ${boardTitle}`);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BookTemplate className="h-4 w-4" />
          Sauv. modèle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Sauvegarder comme modèle</DialogTitle>
            <DialogDescription>
              Sauvegardez ce tableau comme modèle réutilisable (colonnes, tâches, couleurs).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="template-name">Nom *</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du template"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du template (optionnel)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                "Sauvegarder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
