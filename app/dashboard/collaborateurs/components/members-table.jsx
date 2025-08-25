"use client";

import { useEffect, useState } from "react";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Mail, Search, Trash2 } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { useMembersTable } from "../hooks/use-members-table";
import {
  flexRender,
} from "@tanstack/react-table";

export default function MembersTable({ refreshTrigger, onRefresh, handleAddUser }) {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const {
    getAllCollaborators,
  } = useOrganizationInvitations();

  // Charger tous les collaborateurs (membres + invitations)
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getAllCollaborators();

      if (result.success) {
        setCollaborators(result.data || []);
        console.log('Collaborateurs chargés:', result.data);
      } else {
        console.error('Erreur lors du chargement des collaborateurs:', result.error);
        toast.error('Erreur lors du chargement des collaborateurs');
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage et lors du refresh
  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  // Formater les données pour l'affichage
  const formattedData = collaborators.map((item) => {
    if (item.type === 'member') {
      return {
        ...item,
        email: item.user?.email,
        name: item.user?.name || item.user?.email?.split('@')[0],
        status: 'active',
      };
    } else {
      // invitation
      return {
        ...item,
        name: item.email?.split('@')[0],
        status: item.status || 'pending',
      };
    }
  });

  // Utiliser le hook de table avec les données formatées - TOUJOURS appelé
  const {
    table,
    globalFilter,
    setGlobalFilter,
    selectedRows,
    handleDeleteSelected,
  } = useMembersTable({ 
    data: formattedData, 
    onRefetch: () => {
      loadData();
      if (onRefresh) onRefresh();
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche et actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des collaborateurs..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-8 w-[300px]"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {selectedRows.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedRows.length} élément(s) sélectionné(s)
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer la sélection
              </Button>
            </>
          )}
          <Button onClick={handleAddUser} className="font-normal">
            Ajouter un collaborateur
          </Button>
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-normal">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="font-normal">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  <div className="text-gray-500">
                    <Mail className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Aucun collaborateur</p>
                    <p className="text-sm">Invitez des personnes à rejoindre votre organisation</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} sur{" "}
          {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
