'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/src/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import { useCreateColumn } from '@/src/hooks/useKanban';
import { GET_BOARD } from '@/src/graphql/kanbanQueries';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import { ApolloError } from '@apollo/client';

const formSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  color: z.string().min(1, 'La couleur est requise'),
});

const COLORS = [
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Vert', value: '#10b981' },
  { name: 'Jaune', value: '#f59e0b' },
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#ec4899' },
];

export default function AddColumnDialog({ open, onOpenChange, boardId, onColumnAdded }) {
  const { createColumn, loading, error } = useCreateColumn();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      color: COLORS[0].value,
    },
  });

  // Gestion des erreurs GraphQL
  useEffect(() => {
    if (error) {
      console.error('Erreur GraphQL:', error);
      const errorMessage = error instanceof ApolloError 
        ? error.graphQLErrors[0]?.message || error.message 
        : 'Une erreur est survenue';
      
      toast.error(`Erreur: ${errorMessage}`);
    }
  }, [error]);

  const onSubmit = async (values) => {
    if (!boardId) {
      toast.error('ID du tableau manquant');
      return;
    }

    try {
      const result = await createColumn({
        variables: {
          input: {
            title: values.title.trim(),
            color: values.color,
            boardId,
            order: 0, // L'ordre sera géré par le serveur
          },
        },
        update: (cache, { data: { createColumn } }) => {
          // Lecture du cache actuel
          const cacheData = cache.readQuery({
            query: GET_BOARD,
            variables: { id: boardId }
          });

          if (cacheData?.board) {
            // Création d'une nouvelle référence pour le tableau de colonnes
            const updatedColumns = [
              ...(cacheData.board.columns || []),
              createColumn
            ];

            // Écriture des données mises à jour dans le cache
            cache.writeQuery({
              query: GET_BOARD,
              variables: { id: boardId },
              data: {
                board: {
                  ...cacheData.board,
                  columns: updatedColumns
                }
              }
            });
          }
        },
      });

      if (result.data?.createColumn) {
        toast.success('Colonne ajoutée avec succès');
        onOpenChange(false);
        onColumnAdded?.();
        form.reset();
      }
    } catch (err) {
      // Les erreurs sont déjà gérées par le useEffect ci-dessus
      console.error('Erreur lors de la création de la colonne:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une colonne</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre de la colonne</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: En cours, Terminé..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Couleur</FormLabel>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => form.setValue('color', color.value)}
                    className={cn(
                      'h-10 rounded-md border-2 transition-all',
                      form.watch('color') === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    <span className="sr-only">{color.name}</span>
                  </button>
                ))}
              </div>
              <FormMessage />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="min-w-[150px]"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">↻</span>
                    Création...
                  </>
                ) : 'Créer la colonne'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}