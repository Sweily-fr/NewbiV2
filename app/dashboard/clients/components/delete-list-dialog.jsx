'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/src/components/ui/sonner';

export default function DeleteListDialog({ open, onOpenChange, workspaceId, list, onListDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onListDeleted();
      toast.success('Liste supprimée avec succès');
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || 'Impossible de supprimer la liste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Supprimer la liste
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer la liste <strong>{list?.name}</strong> ?
          </p>
          <p className="text-sm text-muted-foreground">
            Les clients ne seront pas supprimés, ils seront simplement retirés de cette liste.
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Supprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
