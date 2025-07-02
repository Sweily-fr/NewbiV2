'use client';

import { useState, use } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Settings, Loader2, Edit, Trash2, MoreVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/src/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/src/components/ui/dropdown-menu';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { toast } from 'sonner';
import { GET_BOARD, CREATE_COLUMN, UPDATE_COLUMN, DELETE_COLUMN } from '@/src/graphql/kanbanQueries';
import { useColumnCollapse } from '@/src/hooks/useColumnCollapse';
import { ColorPicker } from '@/src/components/ui/color-picker';

export default function KanbanBoardPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  // États pour les modals
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [isEditColumnOpen, setIsEditColumnOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [columnForm, setColumnForm] = useState({ title: '', color: '#3b82f6' });

  // Hook pour gérer le collapse des colonnes
  const { isColumnCollapsed, toggleColumnCollapse, expandAll, collapsedColumnsCount } = useColumnCollapse(id);

  const { data, loading, error, refetch } = useQuery(GET_BOARD, {
    variables: { id },
    errorPolicy: 'all'
  });

  // Mutations GraphQL
  const [createColumn, { loading: createLoading }] = useMutation(CREATE_COLUMN, {
    refetchQueries: [{ query: GET_BOARD, variables: { id } }],
    onCompleted: () => {
      toast.success('Colonne créée avec succès');
      setIsAddColumnOpen(false);
      setColumnForm({ title: '', color: '#3b82f6' });
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de la colonne');
    }
  });

  const [updateColumn, { loading: updateLoading }] = useMutation(UPDATE_COLUMN, {
    refetchQueries: [{ query: GET_BOARD, variables: { id } }],
    onCompleted: () => {
      toast.success('Colonne modifiée avec succès');
      setIsEditColumnOpen(false);
      setEditingColumn(null);
      setColumnForm({ title: '', color: '#3b82f6' });
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification de la colonne');
    }
  });

  const [deleteColumn, { loading: deleteLoading }] = useMutation(DELETE_COLUMN, {
    refetchQueries: [{ query: GET_BOARD, variables: { id } }],
    onCompleted: () => {
      toast.success('Colonne supprimée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de la colonne');
    }
  });

  const board = data?.board;

  // Fonctions de gestion des colonnes
  const handleCreateColumn = async () => {
    if (!columnForm.title.trim()) {
      toast.error('Le titre de la colonne est requis');
      return;
    }

    try {
      await createColumn({
        variables: {
          input: {
            title: columnForm.title,
            color: columnForm.color,
            boardId: id,
            order: board?.columns?.length || 0
          }
        }
      });
    } catch (error) {
      console.error('Error creating column:', error);
    }
  };

  const handleUpdateColumn = async () => {
    if (!columnForm.title.trim()) {
      toast.error('Le titre de la colonne est requis');
      return;
    }

    try {
      await updateColumn({
        variables: {
          input: {
            id: editingColumn.id,
            title: columnForm.title,
            color: columnForm.color
          }
        }
      });
    } catch (error) {
      console.error('Error updating column:', error);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    try {
      await deleteColumn({
        variables: { id: columnId }
      });
    } catch (error) {
      console.error('Error deleting column:', error);
    }
  };

  const openEditModal = (column) => {
    setEditingColumn(column);
    setColumnForm({ title: column.title, color: column.color || '#3b82f6' });
    setIsEditColumnOpen(true);
  };

  const openAddModal = () => {
    setColumnForm({ title: '', color: '#3b82f6' });
    setIsAddColumnOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-fit">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-20 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            {error ? 'Erreur lors du chargement du tableau' : 'Tableau non trouvé'}
          </div>
          <div className="space-x-2">
            <Button onClick={() => refetch()}>Réessayer</Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/outils/kanban')}>
              Retour aux tableaux
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/outils/kanban')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{board.title}</h1>
            <p className="text-gray-600">{board.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une colonne
          </Button>
        </div>
      </div>

      {/* Board Content */}
      <div className="min-h-[600px]">
        {board.columns && board.columns.length > 0 ? (
          <>
            {/* Bouton pour déplier toutes les colonnes si certaines sont collapsées */}
            {collapsedColumnsCount > 0 && (
              <div className="mb-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAll}
                  className="text-xs"
                >
                  Déplier toutes ({collapsedColumnsCount})
                </Button>
              </div>
            )}

            <div className="flex overflow-x-auto pb-4 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex gap-6 flex-nowrap">
                {board.columns.map((column) => {
                  const isCollapsed = isColumnCollapsed(column.id);

                  return (
                    <Card key={column.id} className={`h-fit transition-all duration-300 w-80 flex-shrink-0 ${isCollapsed ? 'h-20' : ''}`}>
                      <CardHeader className="pb-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {/* Bouton de collapse */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-gray-100 flex-shrink-0"
                              onClick={() => toggleColumnCollapse(column.id)}
                              title={isCollapsed ? 'Déplier la colonne' : 'Replier la colonne'}
                            >
                              {isCollapsed ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronUp className="h-3 w-3" />
                              )}
                            </Button>

                            <CardTitle className="text-lg flex items-center gap-2 min-w-0">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: column.color || '#3b82f6' }}
                              />
                              <span className="truncate">{column.title}</span>
                            </CardTitle>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(column)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer la colonne</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir supprimer la colonne "{column.title}" ?
                                      Cette action supprimera également toutes les tâches qu'elle contient et ne peut pas être annulée.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteColumn(column.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                      disabled={deleteLoading}
                                    >
                                      {deleteLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : null}
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-[2000px]'}`}>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            {/* Tasks will be rendered here */}
                            {board.tasks
                              ?.filter(task => task.columnId === column.id)
                              ?.map((task) => (
                                <Card key={task.id} className="p-3 bg-white border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-sm">{task.title}</h4>
                                    {task.description && (
                                      <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                                    )}
                                    {task.tags && task.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {task.tags.map((tag, index) => (
                                          <span
                                            key={index}
                                            className="px-2 py-1 text-xs rounded-full"
                                            style={{
                                              backgroundColor: tag.bg || '#f3f4f6',
                                              color: tag.text || '#374151',
                                              border: `1px solid ${tag.border || '#d1d5db'}`
                                            }}
                                          >
                                            {tag.name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              ))}

                            {/* Add Task Button */}
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-gray-500 hover:text-gray-700 border-2 border-dashed border-gray-200 hover:border-gray-300"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Ajouter une tâche
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  );
                })}

                {/* Add Column Button */}
                <Card className="h-20 w-80 border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
                  <CardContent>
                    <Button
                      variant="ghost"
                      className="w-full flex-row gap-2 text-gray-500 hover:text-gray-700"
                      onClick={openAddModal}
                    >
                      <Plus className="h-8 w-8" />
                      <span>Ajouter une colonne</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">Ce tableau ne contient aucune colonne</div>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" />
              Créer votre première colonne
            </Button>
          </div>
        )}
      </div>

      {/* Modal d'ajout de colonne */}
      <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajouter une colonne</DialogTitle>
            <DialogDescription>
              Créez une nouvelle colonne pour organiser vos tâches.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Titre
              </Label>
              <Input
                id="title"
                value={columnForm.title}
                onChange={(e) => setColumnForm({ ...columnForm, title: e.target.value })}
                className="col-span-3"
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddColumnOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateColumn} disabled={createLoading}>
              {createLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de modification de colonne */}
      <Dialog open={isEditColumnOpen} onOpenChange={setIsEditColumnOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier la colonne</DialogTitle>
            <DialogDescription>
              Modifiez les informations de votre colonne.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">
                Titre
              </Label>
              <Input
                id="edit-title"
                value={columnForm.title}
                onChange={(e) => setColumnForm({ ...columnForm, title: e.target.value })}
                className="col-span-3"
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditColumnOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateColumn} disabled={updateLoading}>
              {updateLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
