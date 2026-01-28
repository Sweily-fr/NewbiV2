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
  Building2,
  User,
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
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/src/components/ui/button-group";
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
import { useInvoices } from "@/src/graphql/invoiceQueries";
import { toast } from "@/src/components/ui/sonner";
import ClientsModal from "./clients-modal";
import ClientFilters from "./client-filters";
import { FileText } from "lucide-react";
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

const columns = (
  selectedClients,
  onSelectClient,
  onSelectAll,
  allClients,
  invoiceCountByClient = {}
) => [
  {
    id: "select",
    header: () => {
      const allSelected =
        allClients?.length > 0 &&
        allClients.every((client) => selectedClients.has(client.id));
      const someSelected =
        allClients?.some((client) => selectedClients.has(client.id)) &&
        !allSelected;

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
    size: 40,
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

      // Configuration des badges par type (style identique aux factures)
      const getTypeConfig = () => {
        switch (type) {
          case "COMPANY":
            return {
              icon: <Building2 className="w-3 h-3" />,
              label: "Entreprise",
              className:
                "bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#5a50ff]/20 dark:text-[#5a50ff]",
            };
          case "INDIVIDUAL":
          default:
            return {
              icon: <User className="w-3 h-3" />,
              label: "Particulier",
              className:
                "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
            };
        }
      };

      const config = getTypeConfig();

      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
            config.className
          )}
        >
          {config.icon}
          {config.label}
        </span>
      );
    },
    size: 120,
    filterFn: typeFilterFn,
  },
  {
    header: "Factures",
    id: "invoiceCount",
    cell: ({ row }) => {
      const clientId = row.original.id;
      const count = invoiceCountByClient[clientId] || 0;

      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
            count > 0
              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
              : "bg-gray-50 text-gray-500 dark:bg-gray-900/20 dark:text-gray-400"
          )}
        >
          <FileText className="w-3 h-3" />
          {count}
        </span>
      );
    },
    size: 100,
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
      return (
        <RowActions
          row={row}
          onEdit={handleEditClient}
          onSelectList={onSelectList}
          workspaceId={workspaceId}
        />
      );
    },
    size: 60,
    enableHiding: false,
  },
];

export default function TableClients({
  handleAddUser,
  selectedClients = new Set(),
  onSelectClient,
  onSelectAll,
  clients: clientsProp,
  useProvidedClients = false,
  onSelectList,
  workspaceId,
  externalGlobalFilter = "",
  externalSelectedTypes = [],
  selectedList = null,
  hideSearchBar = false,
}) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const inputRef = useRef(null);
  const [internalGlobalFilter, setInternalGlobalFilter] = useState("");
  const [editingClient, setEditingClient] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Utiliser le filtre externe si hideSearchBar est true, sinon utiliser le filtre interne
  const globalFilter = hideSearchBar
    ? externalGlobalFilter
    : internalGlobalFilter;
  const setGlobalFilter = setInternalGlobalFilter;

  // Utilisation du hook pour récupérer les clients ou utilisation des clients passés en props
  const hookResult = useClients(
    pagination.pageIndex + 1,
    pagination.pageSize,
    globalFilter
  );

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
  const rawClients = useProvidedClients ? clientsProp || [] : hookClients;
  
  // Filtrer les clients par liste sélectionnée
  const clients = useMemo(() => {
    if (!selectedList || !rawClients) return rawClients;
    // Filtrer les clients qui appartiennent à la liste sélectionnée
    return rawClients.filter(client => 
      client.lists?.some(list => list.id === selectedList.id)
    );
  }, [rawClients, selectedList]);
  
  const totalItems = useProvidedClients
    ? clients?.length || 0
    : hookTotalItems;
  const currentPage = useProvidedClients ? 1 : hookCurrentPage;
  const totalPages = useProvidedClients ? 1 : hookTotalPages;
  const loading = useProvidedClients ? false : hookLoading;
  const error = useProvidedClients ? null : hookError;
  const refetch = useProvidedClients ? () => {} : hookRefetch;

  const { deleteClient } = useDeleteClient();

  // Récupérer les factures pour calculer le nombre par client
  const { invoices } = useInvoices();

  // Calculer le nombre de factures par client
  const invoiceCountByClient = useMemo(() => {
    const counts = {};
    if (invoices && invoices.length > 0) {
      invoices.forEach((invoice) => {
        const clientId = invoice.client?.id;
        if (clientId) {
          counts[clientId] = (counts[clientId] || 0) + 1;
        }
      });
    }
    return counts;
  }, [invoices]);

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

  const handleSelectAll = useCallback(
    (checked) => {
      // Utiliser onSelectAll si disponible, sinon fallback sur onSelectClient
      if (onSelectAll) {
        onSelectAll(checked, clients);
      } else {
        // Fallback: appeler onSelectClient pour chaque client (moins optimal)
        if (checked) {
          clients.forEach((client) => {
            if (!selectedClients.has(client.id)) {
              onSelectClient?.(client.id);
            }
          });
        } else {
          clients.forEach((client) => {
            if (selectedClients.has(client.id)) {
              onSelectClient?.(client.id);
            }
          });
        }
      }
    },
    [clients, selectedClients, onSelectClient, onSelectAll]
  );

  const table = useReactTable({
    data: clients,
    columns: columns(
      selectedClients,
      onSelectClient,
      handleSelectAll,
      clients,
      invoiceCountByClient
    ),
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

  // Fonction pour mettre à jour les types sélectionnés (utilisée par ClientFilters)
  const setSelectedTypes = (newTypes) => {
    table
      .getColumn("type")
      ?.setFilterValue(newTypes.length ? newTypes : undefined);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Desktop Layout */}
      <div className="hidden md:flex md:flex-col flex-1 min-h-0">
        {/* Toolbar - Caché si hideSearchBar */}
        {!hideSearchBar && (
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0">
            {/* Search */}
            <div className="relative max-w-md">
              <Input
                id={`${id}-input`}
                ref={inputRef}
                className={cn(
                  "w-full sm:w-[490px] lg:w-[490px] ps-9",
                  Boolean(table.getColumn("name")?.getFilterValue()) && "pe-9"
                )}
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  table.getColumn("name")?.setFilterValue(e.target.value);
                }}
                placeholder="Recherchez par nom, email ou SIRET..."
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

            {/* Filters Button */}
            <div className="flex items-center gap-2">
              <ClientFilters
                selectedTypes={selectedTypes}
                setSelectedTypes={setSelectedTypes}
                table={table}
              />
            </div>
          </div>
        )}

        {/* Delete button - shown when rows are selected (always visible, outside hideSearchBar) */}
        {selectedClients.size > 0 && (
          <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-2 flex-shrink-0">
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
          </div>
        )}

        {/* Table - Desktop style avec header fixe et body scrollable */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header fixe */}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
            <table className="w-full table-fixed">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, index, arr) => (
                      <th
                        key={header.id}
                        style={{ width: `${header.getSize()}px` }}
                        className={`h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground ${index === 0 ? "pl-4 sm:pl-6" : ""} ${index === arr.length - 1 ? "pr-4 sm:pr-6" : ""}`}
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <div
                            className={cn(
                              header.column.getCanSort() &&
                                "flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                            onKeyDown={(e) => {
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
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
            </table>
          </div>
          {/* Body scrollable */}
          <div className="flex-1 overflow-auto">
            <table className="w-full table-fixed">
              <tbody>
                {loading ? (
                  // Skeleton loading state
                  Array.from({ length: pagination.pageSize }).map(
                    (_, index) => (
                      <tr
                        key={`skeleton-${index}`}
                        className="border-b hover:bg-muted/50"
                      >
                        <td style={{ width: 28 }} className="p-2 pl-4 sm:pl-6">
                          <Skeleton className="h-4 w-4 rounded" />
                        </td>
                        <td style={{ width: 200 }} className="p-2">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td style={{ width: 220 }} className="p-2">
                          <Skeleton className="h-4 w-40" />
                        </td>
                        <td style={{ width: 120 }} className="p-2">
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </td>
                        <td style={{ width: 100 }} className="p-2">
                          <Skeleton className="h-5 w-12 rounded-full" />
                        </td>
                        <td style={{ width: 150 }} className="p-2">
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </td>
                        <td style={{ width: 140 }} className="p-2">
                          <Skeleton className="h-4 w-28" />
                        </td>
                        <td style={{ width: 60 }} className="p-2 pr-4 sm:pr-6">
                          <div className="flex justify-end">
                            <Skeleton className="h-8 w-8 rounded" />
                          </div>
                        </td>
                      </tr>
                    )
                  )
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="border-b hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer transition-colors"
                      onClick={(e) => {
                        // Ne pas ouvrir le modal si on clique sur la checkbox ou le menu d'actions
                        if (
                          e.target.closest('[role="checkbox"]') ||
                          e.target.closest("button") ||
                          e.target.closest('[role="menuitem"]')
                        ) {
                          return;
                        }
                        handleEditClient(row.original);
                      }}
                    >
                      {row.getVisibleCells().map((cell, index, arr) => (
                        <td
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                          className={`p-2 align-middle text-sm ${index === 0 ? "pl-4 sm:pl-6" : ""} ${index === arr.length - 1 ? "pr-4 sm:pr-6" : ""}`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="h-24 text-center text-red-500 p-2"
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
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={8} className="h-24 text-center p-2">
                      Aucun contact trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination - Fixe en bas sur desktop */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 bg-background flex-shrink-0">
          <div className="flex-1 text-xs font-normal text-muted-foreground">
            {pagination.pageIndex * pagination.pageSize + 1}-
            {Math.min(
              (pagination.pageIndex + 1) * pagination.pageSize,
              totalItems || 0
            )}{" "}
            sur {totalItems || 0}
          </div>
          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="flex items-center gap-1.5">
              <p className="whitespace-nowrap text-xs font-normal">
                Lignes par page
              </p>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-7 w-[70px] text-xs">
                  <SelectValue placeholder="Select number of results" />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 25, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center whitespace-nowrap text-xs font-normal">
              Page {pagination.pageIndex + 1} sur {totalPages || 1}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Go to first page"
                  >
                    <ChevronFirstIcon size={14} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Go to previous page"
                  >
                    <ChevronLeftIcon size={14} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    aria-label="Go to next page"
                  >
                    <ChevronRightIcon size={14} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => table.lastPage()}
                    disabled={!table.getCanNextPage()}
                    aria-label="Go to last page"
                  >
                    <ChevronLastIcon size={14} aria-hidden="true" />
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
                <span className="hidden sm:inline ml-1">
                  ({selectedClients.size})
                </span>
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
                    className="border-b border-gray-100 dark:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={(e) => {
                      // Ne pas ouvrir le modal si on clique sur la checkbox ou le menu d'actions
                      if (
                        e.target.closest('[role="checkbox"]') ||
                        e.target.closest("button") ||
                        e.target.closest('[role="menuitem"]')
                      ) {
                        return;
                      }
                      handleEditClient(row.original);
                    }}
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
                        <TableCell
                          key={cell.id}
                          className="py-3 px-3 sm:px-4 text-xs sm:text-sm"
                        >
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
    </div>
  );
}

function RowActions({ row, onEdit, onSelectList, workspaceId }) {
  const client = row.original;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteClient } = useDeleteClient();
  const { lists } = useClientListsByClient(workspaceId || "", client.id);

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
