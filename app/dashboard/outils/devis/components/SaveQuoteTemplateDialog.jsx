"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { SAVE_QUOTE_AS_TEMPLATE, GET_QUOTE_TEMPLATES } from "@/src/graphql/quoteQueries";
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
} from "@/src/components/ui/dialog";
import { LoaderCircle } from "lucide-react";

export function SaveQuoteTemplateDialog({ quoteId, quoteNumber, open, onOpenChange }) {
  const { workspaceId } = useWorkspace();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setName(`Modèle - ${quoteNumber || "Devis"}`);
      setDescription("");
    }
  }, [open, quoteNumber]);

  const [saveAsTemplate, { loading }] = useMutation(SAVE_QUOTE_AS_TEMPLATE, {
    onCompleted: () => {
      toast.success("Modèle sauvegardé avec succès");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erreur lors de la sauvegarde du modèle");
      console.error("Save quote template error:", error);
    },
    refetchQueries: [{ query: GET_QUOTE_TEMPLATES, variables: { workspaceId } }],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom du modèle est requis");
      return;
    }

    await saveAsTemplate({
      variables: {
        input: {
          quoteId,
          name: name.trim(),
          description: description.trim() || null,
        },
        workspaceId,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onCloseAutoFocus={(e) => e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Sauvegarder comme modèle</DialogTitle>
            <DialogDescription>
              Sauvegardez ce devis comme modèle réutilisable (articles, notes, paramètres).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="template-name">Nom *</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du modèle"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du modèle (optionnel)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
