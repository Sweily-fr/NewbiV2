'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/src/components/ui/sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/src/components/ui/button-group';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Plus, Edit2, Trash2, Users, Search } from 'lucide-react';
import CreateListDialog from './create-list-dialog';
import EditListDialog from './edit-list-dialog';
import DeleteListDialog from './delete-list-dialog';
import ListClientsView from './list-clients-view';
import { useDeleteClientList } from '@/src/hooks/useClientLists';

export default function ClientListsView({ workspaceId, lists, onListsUpdated, selectedList: initialSelectedList, onSelectListChange }) {
  const [selectedList, setSelectedList] = useState(initialSelectedList || null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [deletingList, setDeletingList] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { deleteList } = useDeleteClientList();

  // Filtrer les listes selon la recherche
  const filteredLists = lists.filter(list =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Mettre à jour selectedList quand initialSelectedList change
  useEffect(() => {
    if (initialSelectedList) {
      setSelectedList(initialSelectedList);
    }
  }, [initialSelectedList]);

  const handleDeleteList = async (listId) => {
    try {
      await deleteList(workspaceId, listId);
      setDeletingList(null);
      onListsUpdated();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  if (selectedList) {
    return (
      <ListClientsView
        workspaceId={workspaceId}
        list={selectedList}
        onBack={() => setSelectedList(null)}
        onListUpdated={onListsUpdated}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-60 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm w-full"
          />
        </div>
        <ButtonGroup>
          <Button onClick={() => setShowCreateDialog(true)} variant="secondary" className="h-9 cursor-pointer whitespace-nowrap font-normal">
            Nouvelle liste
          </Button>
          <ButtonGroupSeparator />
          <Button onClick={() => setShowCreateDialog(true)} variant="secondary" size="icon" className="h-9 w-9 cursor-pointer">
            <Plus className="w-4 h-4" />
          </Button>
        </ButtonGroup>
      </div>

      {filteredLists.length === 0 && lists.length === 0 ? (
        <Card className="shadow-none border-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune liste créée</p>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(true)}
              className="mt-4"
            >
              Créer la première liste
            </Button>
          </CardContent>
        </Card>
      ) : filteredLists.length === 0 ? (
        <Card className="shadow-none border-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune liste ne correspond à votre recherche</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLists.map((list) => (
            <Card 
              key={list.id} 
              className="shadow-none cursor-pointer"
              onClick={() => setSelectedList(list)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-3 items-center">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: list.color }}
                      />
                      <CardTitle className="text-lg font-medium truncate">{list.name}</CardTitle>
                    </div>
                    {list.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {list.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col justify-between h-full">
                <div></div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="gap-1 font-normal">
                      <Users className="w-3 h-3" />
                      {list.clientCount} contact{list.clientCount !== 1 ? 's' : ''}
                    </Badge>
                    {list.isDefault && (
                      <Badge variant="outline" className="text-xs">
                        Par défaut
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {!list.isDefault && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 cursor-pointer font-normal"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingList(list);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 text-red-600 hover:text-red-700 cursor-pointer font-normal"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingList(list);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                        Supprimer
                      </Button>
                    </>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateListDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        workspaceId={workspaceId}
        onListCreated={onListsUpdated}
      />

      {editingList && (
        <EditListDialog
          open={!!editingList}
          onOpenChange={(open) => !open && setEditingList(null)}
          workspaceId={workspaceId}
          list={editingList}
          onListUpdated={onListsUpdated}
        />
      )}

      {deletingList && (
        <DeleteListDialog
          open={!!deletingList}
          onOpenChange={(open) => !open && setDeletingList(null)}
          workspaceId={workspaceId}
          list={deletingList}
          onListDeleted={() => handleDeleteList(deletingList.id)}
        />
      )}
    </div>
  );
}
