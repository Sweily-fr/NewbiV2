'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { useClientsInList } from '@/src/hooks/useClientLists';
import ClientsTable from './clients-table';

export default function ListClientsView({ workspaceId, list, onBack, onListUpdated }) {
  const { clients, totalItems, loading } = useClientsInList(workspaceId, list.id, 1, 10);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-2 w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux listes
        </Button>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: list.color }}
            />
            <h2 className="text-lg sm:text-xl font-medium tracking-tight break-words">{list.name}</h2>
          </div>
          {list.description && (
            <p className="text-xs sm:text-sm text-muted-foreground break-words">{list.description}</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-6">
          {totalItems} contact{totalItems !== 1 ? 's' : ''}
        </p>
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
          />
        )}
      </div>
    </div>
  );
}
