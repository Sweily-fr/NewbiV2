'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { useCreateClientList } from '@/src/hooks/useClientLists';
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

export default function CreateListDialog({ open, onOpenChange, workspaceId, onListCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const { createList, loading } = useCreateClientList();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Le nom de la liste est requis');
      return;
    }

    try {
      await createList(workspaceId, {
        name: name.trim(),
        description: description.trim(),
        color: selectedColor,
        icon: 'Users'
      });

      toast.success('Liste créée avec succès');

      setName('');
      setDescription('');
      setSelectedColor(COLORS[0]);
      onOpenChange(false);
      onListCreated();
    } catch (error) {
      toast.error(error.message || 'Impossible de créer la liste');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle liste</DialogTitle>
          <DialogDescription>
            Créez une liste pour segmenter et organiser vos clients
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
            onClick={handleCreate}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer la liste
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
