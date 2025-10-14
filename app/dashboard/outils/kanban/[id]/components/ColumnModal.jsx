import { Loader2, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { ColorPicker } from '@/src/components/ui/color-picker';

/**
 * Modal pour créer ou modifier une colonne
 */
export function ColumnModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  isEditing = false,
  columnForm,
  setColumnForm
}) {
  const handleSubmit = () => {
    if (!columnForm.title.trim()) {
      return;
    }
    onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] h-[300px] p-0 bg-card text-card-foreground overflow-hidden flex flex-col" showCloseButton={false}>
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b border-border relative flex-shrink-0 bg-card">
            <DialogTitle className="pr-6">
              {isEditing ? 'Modifier la colonne' : 'Ajouter une colonne'}
            </DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </DialogClose>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 h-0 min-h-0 bg-card">
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="column-title" className="text-right">
                  Titre
                </Label>
                <Input
                  id="column-title"
                  value={columnForm.title}
                  onChange={(e) => setColumnForm({ ...columnForm, title: e.target.value })}
                  className="col-span-3 bg-background text-foreground border-input focus:border-primary"
                  placeholder="Nom de la colonne"
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right pt-2">
                  Couleur
                </Label>
                <div className="col-span-3">
                  <ColorPicker
                    color={columnForm.color}
                    onChange={(color) => setColumnForm({ ...columnForm, color })}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border bg-card px-6 py-4 flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="border-input text-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || !columnForm.title.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md transition-all duration-200 shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isEditing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
