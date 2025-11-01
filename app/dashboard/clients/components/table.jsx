"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  CircleXIcon,
  Columns3Icon,
  EllipsisIcon,
  FilterIcon,
  ListFilterIcon,
  PlusIcon,
  Search,
  TrashIcon,
} from "lucide-react";

import { cn } from "@/src/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/src/components/ui/button-group";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/src/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Skeleton } from "@/src/components/ui/skeleton";
// Le composant est exporté par défaut, pas en named export
import { useClients, useDeleteClient } from "@/src/hooks/useClients";
import { useClientListsByClient } from "@/src/hooks/useClientLists";
import { toast } from "@/src/components/ui/sonner";
import ClientsModal from "./clients-modal";
// Custom filter function for multi-column searching
const multiColumnFilterFn = (row, columnId, filterValue) => {
  const searchableRowContent =
    `${row.original.name} ${row.original.email} ${row.original.firstName || ""} ${row.original.lastName || ""}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

const typeFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const type = row.getValue(columnId);
  return filterValue.includes(type);
};

const columns = (selectedClients, onSelectClient, onSelectAll, allClients) => [
  {
    id: "select",
    header: () => {
      const allSelected = allClients?.length > 0 && allClients.every(client => selectedClients.has(client.id));
      const someSelected = allClients?.some(client => selectedClients.has(client.id)) && !allSelected;
      
      return (
        <Checkbox
          checked={allSelected || (someSelected && "indeterminate")}
          onCheckedChange={(value) => onSelectAll?.(!!value)}
          aria-label="Sélectionner tout"
        />
      );
    },
    cell: ({ row }) => (
      <Checkbox
        checked={selectedClients.has(row.original.id)}
        onCheckedChange={() => onSelectClient?.(row.original.id)}
        aria-label="Select row"
      />
    ),
    size: 28,
    enableSorting: false,
    enableHiding: false,
  },
  {
    header: "Nom",
    accessorKey: "name",
    cell: ({ row }) => {
      const client = row.original;
      const displayName =
        client.type === "INDIVIDUAL" && (client.firstName || client.lastName)
          ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
          : client.name;
      return (
        <div
          className="font-normal max-w-[150px] md:max-w-none truncate"
          title={displayName}
        >
          {displayName}
        </div>
      );
    },
    size: 200,
    filterFn: multiColumnFilterFn,
    enableHiding: false,
  },
  {
    header: "Email",
    accessorKey: "email",
    size: 220,
  },
  {
    header: "Type",
    accessorKey: "type",
    cell: ({ row }) => {
      const type = row.getValue("type");
      const colorClass =
        type === "COMPANY"
          ? "bg-purple-100 text-purple-800 border-purple-200"
          : "bg-green-100 text-green-800 border-green-200";

      return (
        <Badge className={cn("font-normal", colorClass)}>
          {type === "INDIVIDUAL" ? "Particulier" : "Entreprise"}
        </Badge>
      );
    },
    size: 120,
    filterFn: typeFilterFn,
  },
  {
    header: "Adresse",
    accessorKey: "address",
    cell: ({ row }) => {
      const address = row.original.address;
      if (!address || (!address.city && !address.country)) return "-";
      return (
        <div className="text-sm">
          {address.city && <div>{address.city}</div>}
          {address.country && (
            <div className="text-muted-foreground">{address.country}</div>
          )}
        </div>
      );
    },
    size: 150,
  },
  {
    header: "SIRET",
    accessorKey: "siret",
    cell: ({ row }) => {
      const siret = row.getValue("siret");
      return siret ? <span className="font-mono text-sm">{siret}</span> : "-";
    },
    size: 140,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      const handleEditClient = table.options.meta?.handleEditClient;
      const onSelectList = table.options.meta?.onSelectList;
      const workspaceId = table.options.meta?.workspaceId;
      return <RowActions row={row} onEdit={handleEditClient} onSelectList={onSelectList} workspaceId={workspaceId} />;
    },
    size: 60,
    enableHiding: false,
  },
];

export default function TableClients({ handleAddUser, selectedClients = new Set(), onSelectClient, onSelectAll, clients: clientsProp, useProvidedClients = false, onSelectList, workspaceId }) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const inputRef = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingClient, setEditingClient] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Utilisation du hook pour récupérer les clients ou utilisation des clients passés en props
  const hookResult = useClients(pagination.pageIndex + 1, pagination.pageSize, globalFilter);
  
  const {
    clients: hookClients,
    totalItems: hookTotalItems,
    currentPage: hookCurrentPage,
    totalPages: hookTotalPages,
    loading: hookLoading,
    error: hookError,
    refetch: hookRefetch,
  } = hookResult;

  // Utiliser les clients passés en props si disponibles
  const clients = useProvidedClients ? (clientsProp || []) : hookClients;
  const totalItems = useProvidedClients ? (clientsProp?.length || 0) : hookTotalItems;
  const currentPage = useProvidedClients ? 1 : hookCurrentPage;
  const totalPages = useProvidedClients ? 1 : hookTotalPages;
  const loading = useProvidedClients ? false : hookLoading;
  const error = useProvidedClients ? null : hookError;
  const refetch = useProvidedClients ? () => {} : hookRefetch;

  const { deleteClient } = useDeleteClient();

  const [sorting, setSorting] = useState([
    {
      id: "name",
      desc: false,
    },
  ]);

  // Effet pour gérer la recherche globale
  useEffect(() => {
    const timer = setTimeout(() => {
      // La recherche est gérée par le hook useClients
    }, 300);
    return () => clearTimeout(timer);
  }, [globalFilter]);

  const handleDeleteRows = async () => {
    try {
      await Promise.all(
        Array.from(selectedClients).map((clientId) => deleteClient(clientId))
      );
      // Réinitialiser la sélection via le callback parent
      if (onSelectAll) {
        onSelectAll(false, clients);
      }
      await refetch();
    } catch (error) {
      // Error already handled by useDeleteClient hook
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Données actualisées");
    } catch (error) {
      toast.error("Erreur lors de l'actualisation");
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingClient(null);
  };

  const handleSaveClient = async (updatedClient) => {
    await refetch();
    handleCloseEditModal();
  };

  const handleSelectAll = useCallback((checked) => {
    // Utiliser onSelectAll si disponible, sinon fallback sur onSelectClient
    if (onSelectAll) {
      onSelectAll(checked, clients);
    } else {
      // Fallback: appeler onSelectClient pour chaque client (moins optimal)
      if (checked) {
        clients.forEach(client => {
          if (!selectedClients.has(client.id)) {
            onSelectClient?.(client.id);
          }
        });
      } else {
        clients.forEach(client => {
          if (selectedClients.has(client.id)) {
            onSelectClient?.(client.id);
          }
        });
      }
    }
  }, [clients, selectedClients, onSelectClient, onSelectAll]);

  const table = useReactTable({
    data: clients,
    columns: columns(selectedClients, onSelectClient, handleSelectAll, clients),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    manualPagination: true,
    pageCount: totalPages,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
    meta: {
      handleEditClient,
      onSelectList,
      workspaceId,
    },
  });

  // Get unique type values
  const uniqueTypeValues = useMemo(() => {
    const typeColumn = table.getColumn("type");

    if (!typeColumn) return [];

    const values = Array.from(typeColumn.getFacetedUniqueValues().keys());

    return values.sort();
  }, [table.getColumn("type")?.getFacetedUniqueValues()]);

  // Get counts for each type
  const typeCounts = useMemo(() => {
    const typeColumn = table.getColumn("type");
    if (!typeColumn) return new Map();
    return typeColumn.getFacetedUniqueValues();
  }, [table.getColumn("type")?.getFacetedUniqueValues()]);

  const selectedTypes = useMemo(() => {
    const filterValue = table.getColumn("type")?.getFilterValue();
    return filterValue ?? [];
  }, [table.getColumn("type")?.getFilterValue()]);

  const handleTypeChange = (checked, value) => {
    const filterValue = table.getColumn("type")?.getFilterValue();
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table
      .getColumn("type")
      ?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Button Group with Search, Type, and Columns */}
            <ButtonGroup>
              {/* Filter by name or email */}
              <div className="relative flex-1">
                <Input
                  id={`${id}-input`}
                  ref={inputRef}
                  className={cn(
                    "peer min-w-60 ps-9 rounded-r-none",
                    Boolean(table.getColumn("name")?.getFilterValue()) && "pe-9"
                  )}
                  value={globalFilter}
                  onChange={(e) => {
                    setGlobalFilter(e.target.value);
                    table.getColumn("name")?.setFilterValue(e.target.value);
                  }}
                  placeholder="Filtrer par nom ou email..."
                  type="text"
                  aria-label="Filter by name or email"
                />
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <Search size={16} aria-hidden="true" />
                </div>
                {Boolean(globalFilter) && (
                  <button
                    className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Clear filter"
                    onClick={() => {
                      setGlobalFilter("");
                      table.getColumn("name")?.setFilterValue("");
                      if (inputRef.current) {
                        inputRef.current.focus();
                      }
                    }}
                  >
                    <CircleXIcon size={16} aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Filter by type */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="font-normal cursor-pointer hover:cursor-pointer">
                    <FilterIcon
                      className="-ms-1 opacity-60"
                      size={16}
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline">Type</span>
                    {selectedTypes.length > 0 && (
                      <span className="bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                        {selectedTypes.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto min-w-36 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs font-normal">
                      Filtres
                    </div>
                    <div className="space-y-3">
                      {uniqueTypeValues.map((value, i) => (
                        <div key={value} className="flex items-center gap-2">
                          <Checkbox
                            id={`${id}-${i}`}
                            checked={selectedTypes.includes(value)}
                            onCheckedChange={(checked) =>
                              handleTypeChange(checked, value)
                            }
                          />
                          <Label
                            htmlFor={`${id}-${i}`}
                            className="flex grow justify-between gap-2 font-normal"
                          >
                            {value === "INDIVIDUAL"
                              ? "Particulier"
                              : "Entreprise"}{" "}
                            <span className="text-muted-foreground ms-2 text-xs">
                              {typeCounts.get(value)}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Toggle columns visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="font-normal hidden md:flex cursor-pointer hover:cursor-pointer"
                  >
                    <Columns3Icon
                      className="-ms-1 opacity-60"
                      size={16}
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline">Colonnes</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sélection des colonnes</DropdownMenuLabel>
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      // Traduction des noms de colonnes
                      const columnNames = {
                        name: "Nom",
                        email: "Email",
                        type: "Type",
                        address: "Adresse",
                        siret: "SIRET",
                      };

                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                          onSelect={(event) => event.preventDefault()}
                        >
                          {columnNames[column.id] || column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          </div>
          <div className="flex items-center gap-3">
            {/* Delete button - shown when rows are selected */}
            {selectedClients.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    data-mobile-delete-trigger
                    className="cursor-pointer font-normal"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Supprimer ({selectedClients.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                      aria-hidden="true"
                    >
                      <CircleAlertIcon className="opacity-80" size={16} />
                    </div>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Êtes-vous absolument sûr ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action ne peut pas être annulée. Cela supprimera
                        définitivement {selectedClients.size}{" "}
                        {selectedClients.size === 1
                          ? "client sélectionné"
                          : "clients sélectionnés"}
                        .
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteRows}
                      variant="destructive"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {/* Add user button group */}
            <ButtonGroup>
              <Button
                className="cursor-pointer font-normal"
                variant="secondary"
                onClick={handleAddUser}
              >
                Ajouter un contact
              </Button>
              <ButtonGroupSeparator />
              <Button
                className="cursor-pointer"
                variant="secondary"
                size="icon"
                onClick={handleAddUser}
              >
                <PlusIcon size={16} aria-hidden="true" />
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Table */}
        <div className="bg-background overflow-hidden rounded-md border">
          <Table className="table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        style={{ width: `${header.getSize()}px` }}
                        className="h-11 font-normal"
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <div
                            className={cn(
                              header.column.getCanSort() &&
                                "flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                            onKeyDown={(e) => {
                              // Enhanced keyboard handling for sorting
                              if (
                                header.column.getCanSort() &&
                                (e.key === "Enter" || e.key === " ")
                              ) {
                                e.preventDefault();
                                header.column.getToggleSortingHandler()?.(e);
                              }
                            }}
                            tabIndex={
                              header.column.getCanSort() ? 0 : undefined
                            }
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: (
                                <ChevronUpIcon
                                  className="shrink-0 opacity-60"
                                  size={16}
                                  aria-hidden="true"
                                />
                              ),
                              desc: (
                                <ChevronDownIcon
                                  className="shrink-0 opacity-60"
                                  size={16}
                                  aria-hidden="true"
                                />
                              ),
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton loading state
                Array.from({ length: pagination.pageSize }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="last:py-0">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-red-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span>Erreur lors du chargement des clients</span>
                      <button
                        onClick={handleRefresh}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Réessayer
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns(selectedClients, onSelectClient, handleSelectAll, clients).length}
                    className="h-24 text-center"
                  >
                    Aucun contact trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-8">
          {/* Results per page */}
          <div className="flex items-center gap-3">
            <Label htmlFor={id} className="max-sm:sr-only font-normal">
              Lignes par page
            </Label>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger id={id} className="w-fit whitespace-nowrap">
                <SelectValue placeholder="Select number of results" />
              </SelectTrigger>
              <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
                {[5, 10, 25, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Page number information */}
          <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
            <p
              className="text-muted-foreground text-sm whitespace-nowrap"
              aria-live="polite"
            >
              <span className="text-foreground">
                {pagination.pageIndex * pagination.pageSize + 1}-
                {Math.min(
                  (pagination.pageIndex + 1) * pagination.pageSize,
                  totalItems || 0
                )}
              </span>{" "}
              sur <span className="text-foreground">{totalItems || 0}</span>
            </p>
          </div>

          {/* Pagination buttons */}
          <div>
            <Pagination>
              <PaginationContent>
                {/* First page button */}
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Go to first page"
                  >
                    <ChevronFirstIcon size={16} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                {/* Previous page button */}
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
                {/* Next page button */}
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
                {/* Last page button */}
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

      {/* Mobile Layout - Style Notion */}
      <div className="md:hidden">
        {/* Mobile Toolbar - Style Notion */}
        <div className="px-3 sm:px-4 py-3 sticky top-0 bg-background z-10 border-b">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Input
                placeholder="Rechercher des clients..."
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  table.getColumn("name")?.setFilterValue(e.target.value);
                }}
                className="h-9 pl-3 pr-3 bg-gray-50 dark:bg-gray-900 border-none rounded-md text-xs sm:text-sm w-full"
              />
            </div>

            {/* Filter Button - Icon only */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ListFilterIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto min-w-36 p-3" align="end">
                <div className="space-y-3">
                  <div className="text-muted-foreground text-xs font-normal">
                    Filtrer par type
                  </div>
                  <div className="space-y-3">
                    {uniqueTypeValues.map((value, i) => (
                      <div key={value} className="flex items-center gap-2">
                        <Checkbox
                          id={`mobile-${id}-${i}`}
                          checked={selectedTypes.includes(value)}
                          onCheckedChange={(checked) =>
                            handleTypeChange(checked, value)
                          }
                        />
                        <Label
                          htmlFor={`mobile-${id}-${i}`}
                          className="flex grow justify-between gap-2 font-normal"
                        >
                          {value === "INDIVIDUAL"
                            ? "Particulier"
                            : "Entreprise"}{" "}
                          <span className="text-muted-foreground ms-2 text-xs">
                            {typeCounts.get(value)}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Delete button for mobile - shown when rows are selected */}
            {selectedClients.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="h-9 px-2 sm:px-3 text-xs flex-shrink-0"
                title={`Supprimer ${selectedClients.size} client(s)`}
                onClick={() => {
                  // Trigger the delete dialog
                  const deleteButton = document.querySelector(
                    "[data-mobile-delete-trigger]"
                  );
                  if (deleteButton) deleteButton.click();
                }}
              >
                <TrashIcon className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">({selectedClients.size})</span>
                <span className="sm:hidden ml-1">{selectedClients.size}</span>
              </Button>
            )}

            {/* Add Client Button - Icon only */}
            {/* <Button
              variant="default"
              size="sm"
              className="h-7 w-7 p-0 bg-[#5A50FF] hover:bg-[#5A50FF] text-white rounded-sm"
              onClick={handleAddUser}
            >
              <PlusIcon className="h-4 w-4" />
            </Button> */}
          </div>
        </div>

        {/* Table - Mobile style (Notion-like) */}
        <div className="overflow-x-auto pb-24">
          <Table className="w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-gray-100 dark:border-gray-400"
                >
                  {headerGroup.headers
                    .filter(
                      (header) =>
                        header.column.id === "select" ||
                        header.column.id === "name" ||
                        header.column.id === "type" ||
                        header.column.id === "actions"
                    )
                    .map((header) => (
                      <TableHead
                        key={header.id}
                        className="py-3 px-3 sm:px-4 text-left font-medium text-gray-600 dark:text-gray-400 text-xs sm:text-sm"
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <div
                            className={cn(
                              header.column.getCanSort() &&
                                "flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: (
                                <ChevronUpIcon
                                  className="shrink-0 opacity-60"
                                  size={16}
                                  aria-hidden="true"
                                />
                              ),
                              desc: (
                                <ChevronDownIcon
                                  className="shrink-0 opacity-60"
                                  size={16}
                                  aria-hidden="true"
                                />
                              ),
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </TableHead>
                    ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton loading state
                Array.from({ length: pagination.pageSize }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b border-gray-100 dark:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    {row
                      .getVisibleCells()
                      .filter(
                        (cell) =>
                          cell.column.id === "select" ||
                          cell.column.id === "name" ||
                          cell.column.id === "type" ||
                          cell.column.id === "actions"
                      )
                      .map((cell) => (
                        <TableCell key={cell.id} className="py-3 px-3 sm:px-4 text-xs sm:text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-red-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span>Erreur lors du chargement des clients</span>
                      <button
                        onClick={handleRefresh}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Réessayer
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Aucun contact trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal d'édition unique pour desktop et mobile */}
      <ClientsModal
        client={editingClient}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={handleSaveClient}
      />
    </>
  );
}

function RowActions({ row, onEdit, onSelectList, workspaceId }) {
  const client = row.original;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteClient } = useDeleteClient();
  const { lists } = useClientListsByClient(workspaceId || '', client.id);

  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit(client);
    }
  }, [onEdit, client]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteClient(client.id);
      setShowDeleteDialog(false);
    } catch (error) {
      // Error already handled by useDeleteClient hook
    }
  }, [deleteClient, client.id]);

  const handleCopyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(client.email);
      toast.success("Email copié dans le presse-papiers");
    } catch (error) {
      toast.error("Erreur lors de la copie de l'email");
    }
  }, [client.email]);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Vérifier si le dropdown est ouvert ou si le dialog de suppression est ouvert
      if (!showDeleteDialog) return;

      if (event.key === "Escape") {
        setShowDeleteDialog(false);
        event.preventDefault();
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        handleDelete();
        event.preventDefault();
      }
    };

    if (showDeleteDialog) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [showDeleteDialog, handleDelete]);

  // Gestion des raccourcis pour le dropdown menu
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      // Raccourcis globaux uniquement si aucun dialog n'est ouvert
      if (showDeleteDialog) return;

      if ((event.metaKey || event.ctrlKey) && event.key === "e") {
        handleEdit();
        event.preventDefault();
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "Backspace") {
        setShowDeleteDialog(true);
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleEdit, showDeleteDialog]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="shadow-none"
              aria-label="Actions du client"
            >
              <EllipsisIcon size={16} aria-hidden="true" />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleEdit}>
              <span>Modifier</span>
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyEmail}>
              <span>Copier email</span>
              <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          {/* Listes liées */}
          {lists && lists.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span>Listes liées</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {lists.map((list) => (
                    <DropdownMenuItem
                      key={list.id}
                      onClick={() => onSelectList?.(list)}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: list.color }}
                      />
                      <span>{list.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
          >
            <span>Supprimer</span>
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <CircleAlertIcon className="opacity-80" size={16} />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Êtes-vous sûr de vouloir supprimer ce client ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Cette action ne peut pas être annulée. Le client "{client.name}"
                sera définitivement supprimé.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
