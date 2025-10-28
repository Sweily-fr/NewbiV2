'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { useUpdateClientList } from '@/src/hooks/useClientLists';
import { Loader2 } from 'lucide-react';
import { toast } from '@/src/components/ui/sonner';

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
];

export default function EditListDialog({ open, onOpenChange, workspaceId, list, onListUpdated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const { updateList, loading } = useUpdateClientList();

  useEffect(() => {
    if (list) {
      setName(list.name);
      setDescription(list.description || '');
      setSelectedColor(list.color);
    }
  }, [list, open]);

  const handleUpdate = async () => {
    if (!name.trim()) {
      toast.error('Le nom de la liste est requis');
      return;
    }

    try {
      await updateList(workspaceId, list.id, {
        name: name.trim(),
        description: description.trim(),
        color: selectedColor
      });

      toast.success('Liste mise à jour avec succès');

      onOpenChange(false);
      onListUpdated();
    } catch (error) {
      toast.error(error.message || 'Impossible de mettre à jour la liste');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier la liste</DialogTitle>
          <DialogDescription>
            Modifiez les paramètres de votre liste
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la liste *</Label>
            <Input
              id="name"
              placeholder="ex: Prospects, Clients VIP..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description optionnelle de la liste..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  disabled={loading}
                />
              ))}
            </div>
          </div>
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
            onClick={handleUpdate}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Mettre à jour
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
