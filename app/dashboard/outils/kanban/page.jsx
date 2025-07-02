'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useBoards, useDeleteBoard } from '@/src/hooks/useKanban';

export default function KanbanPage() {
  const { boards, loading, error, refetch } = useBoards();
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteBoard: deleteBoardMutation } = useDeleteBoard();

  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setBoardToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!boardToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteBoardMutation({
        variables: { id: boardToDelete }
      });
      toast.success('Tableau supprimé avec succès');
      refetch();
    } catch (err) {
      console.error('Erreur lors de la suppression du tableau:', err);
      toast.error('Erreur lors de la suppression du tableau');
    } finally {
      setIsDeleting(false);
      setBoardToDelete(null);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-500">Erreur: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tableaux Kanban</h1>
        <Link href="/dashboard/outils/kanban/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau tableau
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-40">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Link key={board.id} href={`/dashboard/outils/kanban/${board.id}`}>
              <Card className="h-40 hover:shadow-md transition-shadow cursor-pointer group relative">
                <CardHeader>
                  <CardTitle className="text-lg">{board.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {board.description || 'Aucune description'}
                  </CardDescription>
                </CardHeader>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => handleDeleteClick(board.id, e)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                  <Link href={`/dashboard/outils/kanban/${board.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!boardToDelete}
        onOpenChange={(open) => !open && setBoardToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le tableau</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce tableau ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}