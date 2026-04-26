"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import {
  SAVE_BOARD_AS_TEMPLATE,
  GET_KANBAN_TEMPLATES,
} from "@/src/graphql/kanbanQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { toast } from "@/src/components/ui/sonner";
import { Button } from "@/src/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { BookTemplate, LoaderCircle, CornerDownLeft } from "lucide-react";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";

export function SaveTemplateDialog({ boardId, boardTitle }) {
  const { workspaceId } = useWorkspace();
  const { isReadOnly, isOwner } = useSubscriptionAccess();
  const readOnlyTooltip = isReadOnly
    ? isOwner
      ? "Mode lecture seule · Renouvelez votre abonnement"
      : "Mode lecture seule · Contactez l'administrateur"
    : undefined;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [saveBoardAsTemplate, { loading }] = useMutation(
    SAVE_BOARD_AS_TEMPLATE,
    {
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
      refetchQueries: [
        { query: GET_KANBAN_TEMPLATES, variables: { workspaceId } },
      ],
    },
  );

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
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <BookTemplate className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Sauvegarder comme modèle</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[480px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <BookTemplate className="size-4" />
              Sauvegarder comme modèle
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-3 px-5 pt-3 pb-0">
              {/* Info */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">
                  Les colonnes, tâches et couleurs seront sauvegardées comme
                  modèle réutilisable.
                </p>
              </div>

              {/* Nom */}
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">
                  Nom du modèle
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom du template"
                  required
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm ring-offset-background transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">
                  Description{" "}
                  <span className="text-muted-foreground/40">(optionnel)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez ce modèle..."
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none resize-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-border/40 mt-3 px-5 py-3">
              <Button
                variant="primary"
                type="submit"
                disabled={isReadOnly || loading || !name.trim()}
                title={readOnlyTooltip}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    Sauvegarder
                    <kbd className="inline-flex items-center justify-center size-5 rounded bg-white/20 ml-0.5">
                      <CornerDownLeft className="size-3" />
                    </kbd>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
