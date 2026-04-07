import { LoaderCircle, Columns3, CornerDownLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { ColorPicker } from "@/src/components/ui/color-picker";

/**
 * Modal pour créer ou modifier une colonne — style invite-member
 */
export function ColumnModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  isEditing = false,
  columnForm,
  setColumnForm,
}) {
  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!columnForm.title.trim()) return;
    onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] rounded-2xl">
        <div className="bg-background rounded-xl ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <Columns3 className="size-4" />
              {isEditing ? "Modifier le status" : "Nouveau status"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 px-5 pt-4 pb-0">
              {/* Nom */}
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Nom</label>
                <input
                  value={columnForm.title}
                  onChange={(e) =>
                    setColumnForm({ ...columnForm, title: e.target.value })
                  }
                  placeholder="Ex: À faire, En cours, Terminé..."
                  autoFocus
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm ring-offset-background transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Couleur */}
              <div className="space-y-1.5">
                <ColorPicker
                  color={columnForm.color}
                  onChange={(color) => setColumnForm({ ...columnForm, color })}
                  side="right"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-border/40 mt-4 px-5 py-3">
              <Button
                variant="primary"
                type="submit"
                disabled={isLoading || !columnForm.title.trim()}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    {isEditing ? "Modification..." : "Création..."}
                  </>
                ) : (
                  <>
                    {isEditing ? "Modifier" : "Créer"}
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
