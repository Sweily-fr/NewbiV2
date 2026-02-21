'use client';

import { Button } from '@/src/components/ui/button';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { useClientsInList } from '@/src/hooks/useClientLists';
import ClientsTable from './clients-table';

export default function ListClientsView({ workspaceId, list, onBack, onListUpdated, globalFilter = '' }) {
  const { clients, totalItems, loading } = useClientsInList(workspaceId, list.id, 1, 1000);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header avec marges alignées sur "Gestion des contacts" */}
      <div className="px-4 sm:px-6 pt-4 pb-2 space-y-3 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux listes
        </Button>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: list.color }}
            />
            <h2 className="text-2xl font-medium">{list.name}</h2>
          </div>
          {list.description && (
            <p className="text-sm text-muted-foreground">{list.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {totalItems} contact{totalItems !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Tableau */}
      <div className="flex flex-col flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun client dans cette liste</p>
          </div>
        ) : (
          <ClientsTable
            workspaceId={workspaceId}
            clients={clients}
            useProvidedClients={true}
            lists={[list]}
            onListsUpdated={onListUpdated}
            defaultListId={list.id}
            globalFilter={globalFilter}
          />
        )}
      </div>
    </div>
  );
}
