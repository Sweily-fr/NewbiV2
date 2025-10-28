'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { useClientLists } from '@/src/hooks/useClientLists';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import ClientsTable from './clients-table';
import ClientListsView from './client-lists-view';
import { Loader2 } from 'lucide-react';

export default function ClientsTabs() {
  const { workspaceId } = useWorkspace();
  const { lists, loading: listsLoading, refetch: refetchLists } = useClientLists(workspaceId);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedList, setSelectedList] = useState(null);

  if (!workspaceId) {
    return <div className="flex items-center justify-center h-96">Chargement...</div>;
  }

  const handleSelectList = (list) => {
    setSelectedList(list);
    setActiveTab('lists');
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="all" className="cursor-pointer">Tous les contacts</TabsTrigger>
        <TabsTrigger value="lists" className="cursor-pointer">Mes listes</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-4">
        <ClientsTable workspaceId={workspaceId} lists={lists} onListsUpdated={refetchLists} onSelectList={handleSelectList} />
      </TabsContent>

      <TabsContent value="lists" className="mt-4">
        {listsLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <ClientListsView workspaceId={workspaceId} lists={lists} onListsUpdated={refetchLists} selectedList={selectedList} onSelectListChange={setSelectedList} />
        )}
      </TabsContent>
    </Tabs>
  );
}
