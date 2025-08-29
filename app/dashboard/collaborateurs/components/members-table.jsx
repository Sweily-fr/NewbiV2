"use client";

import { useEffect, useState } from "react";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { useActiveOrganization } from "@/src/lib/organization-client";
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
import {
  Mail,
  Search,
  Trash2,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { useMembersTable } from "../hooks/use-members-table";
import { flexRender } from "@tanstack/react-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/src/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";

export default function MembersTable({
  refreshTrigger,
  onRefresh,
  handleAddUser,
}) {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);

  const { getAllCollaborators } = useOrganizationInvitations();
  const { organization, loading: orgLoading } = useActiveOrganization();

  // Charger tous les collaborateurs (membres + invitations)
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getAllCollaborators();

      if (result.success) {
        setCollaborators(result.data || []);
        console.log("Collaborateurs chargés:", result.data);
      } else {
        console.error(
          "Erreur lors du chargement des collaborateurs:",
          result.error
        );
        toast.error("Erreur lors du chargement des collaborateurs");
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
    // Attendre que l'organisation soit chargée avant de charger les collaborateurs
    if (!orgLoading && organization) {
      loadData();
    } else if (!orgLoading && !organization) {
      // Si pas d'organisation après le chargement, afficher un message d'erreur
      console.error('Aucune organisation active trouvée');
      toast.error('Aucune organisation active trouvée');
      setLoading(false);
    }
  }, [refreshTrigger, orgLoading, organization]);

  // Formater les données pour l'affichage
  const formattedData = collaborators.map((item) => {
    if (item.type === "member") {
      return {
        ...item,
        email: item.user?.email,
        name: item.user?.name || item.user?.email?.split("@")[0],
        status: "active",
      };
    } else {
      // invitation
      return {
        ...item,
        name: item.email?.split("@")[0],
        status: item.status || "pending",
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
    },
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* Table skeleton */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-32" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="w-12">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination skeleton */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
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
                    {/* <Mail className="mx-auto h-12 w-12 mb-4 opacity-50" /> */}
                    <p>Aucun collaborateur</p>
                    <p className="text-sm">
                      Invitez des personnes à rejoindre votre organisation
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-2">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} sur{" "}
          {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center gap-2">
            <p className="whitespace-nowrap text-sm font-normal">
              Lignes par page
            </p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center whitespace-nowrap text-sm font-normal">
            Page {table.getState().pagination.pageIndex + 1} sur{" "}
            {table.getPageCount()}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to first page"
                >
                  <ChevronFirstIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to last page"
                >
                  <ChevronLastIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
