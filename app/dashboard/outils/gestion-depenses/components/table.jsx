"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
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
import { toast } from "@/src/components/ui/sonner";
import { TransactionDetailDrawer } from "./transaction-detail-drawer";
import { AddTransactionDrawer } from "./add-transaction-drawer";
import { Plus } from "lucide-react";
import {
  FileTextIcon,
  ImageIcon,
  CreditCardIcon,
  BanknoteIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "lucide-react";
// Custom filter function for multi-column searching
const multiColumnFilterFn = (row, columnId, filterValue) => {
  const searchableRowContent =
    `${row.original.description} ${row.original.category} ${row.original.paymentMethod} ${row.original.amount}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

const typeFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const type = row.getValue(columnId);
  return filterValue.includes(type);
};

const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    size: 28,
    enableSorting: false,
    enableHiding: false,
  },
  {
    header: "Date",
    accessorKey: "date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return (
        <div className="font-medium">{date.toLocaleDateString("fr-FR")}</div>
      );
    },
    size: 120,
    enableHiding: false,
  },
  {
    header: "Type",
    accessorKey: "type",
    cell: ({ row }) => {
      const type = row.getValue("type");
      return (
        <Badge
          className={cn(
            "flex items-center gap-1 w-fit",
            type === "INCOME"
              ? "bg-green-100 border-green-300 text-green-800"
              : "bg-red-100 border-red-300 text-red-800"
          )}
        >
          {type === "INCOME" ? (
            <>
              <ArrowUpIcon size={12} /> Entrée
            </>
          ) : (
            <>
              <ArrowDownIcon size={12} /> Sortie
            </>
          )}
        </Badge>
      );
    },
    size: 100,
    filterFn: typeFilterFn,
  },
  {
    header: "Catégorie",
    accessorKey: "category",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("category")}</div>
    ),
    size: 140,
  },
  {
    header: "Montant",
    accessorKey: "amount",
    cell: ({ row }) => {
      const amount = row.getValue("amount");
      const type = row.getValue("type");
      return (
        <div
          className={cn(
            "font-medium text-left",
            type === "INCOME" ? "text-green-600" : "text-red-600"
          )}
        >
          {type === "INCOME" ? "+" : "-"}
          {amount.toFixed(2)} €
        </div>
      );
    },
    size: 120,
  },
  {
    header: "Description",
    accessorKey: "description",
    cell: ({ row }) => (
      <div
        className="max-w-[200px] truncate"
        title={row.getValue("description")}
      >
        {row.getValue("description")}
      </div>
    ),
    size: 200,
    filterFn: multiColumnFilterFn,
  },
  {
    header: "Moyen de paiement",
    accessorKey: "paymentMethod",
    cell: ({ row }) => {
      const method = row.getValue("paymentMethod");
      const getIcon = () => {
        switch (method) {
          case "CARD":
            return <CreditCardIcon size={14} />;
          case "CASH":
            return <BanknoteIcon size={14} />;
          case "TRANSFER":
            return <FileTextIcon size={14} />;
          default:
            return <CreditCardIcon size={14} />;
        }
      };

      const getLabel = () => {
        switch (method) {
          case "CARD":
            return "Carte";
          case "CASH":
            return "Espèces";
          case "TRANSFER":
            return "Virement";
          case "CHECK":
            return "Chèque";
          default:
            return method;
        }
      };

      return (
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm">{getLabel()}</span>
        </div>
      );
    },
    size: 150,
  },
  {
    header: "Justificatif",
    accessorKey: "attachment",
    cell: ({ row }) => {
      const attachment = row.getValue("attachment");
      return attachment ? (
        <div className="flex items-center gap-1 text-blue-600">
          <ImageIcon size={14} />
          <span className="text-xs">Oui</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">Non</span>
      );
    },
    size: 100,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <RowActions row={row} onEdit={table.options.meta?.onEdit} />
        </div>
      );
    },
    size: 60,
    enableHiding: false,
  },
];

// Données d'exemple pour les transactions
const sampleTransactions = [
  {
    id: 1,
    date: "2024-01-15",
    type: "INCOME",
    category: "Salaire",
    amount: 3500.0,
    description: "Salaire mensuel janvier",
    paymentMethod: "TRANSFER",
    attachment: true,
  },
  {
    id: 2,
    date: "2024-01-16",
    type: "EXPENSE",
    category: "Alimentation",
    amount: 85.5,
    description: "Courses supermarché",
    paymentMethod: "CARD",
    attachment: false,
  },
  {
    id: 3,
    date: "2024-01-17",
    type: "EXPENSE",
    category: "Transport",
    amount: 45.2,
    description: "Plein d'essence",
    paymentMethod: "CARD",
    attachment: true,
  },
  {
    id: 4,
    date: "2024-01-18",
    type: "INCOME",
    category: "Freelance",
    amount: 750.0,
    description: "Mission développement web",
    paymentMethod: "TRANSFER",
    attachment: true,
  },
  {
    id: 5,
    date: "2024-01-19",
    type: "EXPENSE",
    category: "Logement",
    amount: 1200.0,
    description: "Loyer mensuel",
    paymentMethod: "TRANSFER",
    attachment: false,
  },
];

export default function TransactionTable() {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const inputRef = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAddTransactionDrawerOpen, setIsAddTransactionDrawerOpen] =
    useState(false);

  // Utilisation des données d'exemple (à remplacer par un hook GraphQL plus tard)
  const transactions = sampleTransactions;
  const totalItems = transactions.length;
  const loading = false;
  const error = null;

  const [sorting, setSorting] = useState([
    {
      id: "date",
      desc: true,
    },
  ]);

  // Effet pour gérer la recherche globale
  useEffect(() => {
    const timer = setTimeout(() => {
      // La recherche sera gérée localement pour l'instant
    }, 300);
    return () => clearTimeout(timer);
  }, [globalFilter]);

  const handleDeleteRows = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    try {
      // Simulation de suppression (à remplacer par une mutation GraphQL)
      console.log(
        "Suppression des transactions:",
        selectedRows.map((row) => row.original.id)
      );
      table.resetRowSelection();
      toast.success(`${selectedRows.length} transaction(s) supprimée(s)`);
    } catch (error) {
      console.error("Error deleting transactions:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleRefresh = async () => {
    try {
      // Simulation de rafraîchissement
      toast.success("Données actualisées");
    } catch (error) {
      toast.error("Erreur lors de l'actualisation");
      console.error("Error refreshing transactions:", error);
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetailDrawer = () => {
    setIsDetailDrawerOpen(false);
    setSelectedTransaction(null);
  };

  const handleEditFromDrawer = (transaction) => {
    setIsDetailDrawerOpen(false);
    handleEditTransaction(transaction);
  };

  const handleDeleteFromDrawer = (transaction) => {
    setIsDetailDrawerOpen(false);
    // Simulation de suppression
    toast.success("Transaction supprimée");
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  const handleAddTransaction = (transaction) => {
    setIsAddTransactionDrawerOpen(false);
    // Simulation d'ajout (à remplacer par une mutation GraphQL)
    toast.success("Transaction ajoutée");
  };

  const handleSaveTransaction = async (updatedTransaction) => {
    // Simulation de sauvegarde (à remplacer par une mutation GraphQL)
    console.log("Sauvegarde de la transaction:", updatedTransaction);
    handleCloseEditModal();
    toast.success("Transaction mise à jour");
  };

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    manualPagination: false,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: multiColumnFilterFn,
    meta: {
      onEdit: handleEditTransaction,
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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Filter by description, category, amount */}
          <div className="relative">
            <Input
              ref={inputRef}
              className={cn(
                "peer min-w-60 ps-9",
                Boolean(globalFilter) && "pe-9"
              )}
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
              }}
              placeholder="Rechercher par description, catégorie, montant..."
              type="text"
              aria-label="Filter transactions"
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <ListFilterIcon size={16} aria-hidden="true" />
            </div>
            {Boolean(globalFilter) && (
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  setGlobalFilter("");
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
              <Button variant="outline">
                <FilterIcon
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                Type
                {selectedTypes.length > 0 && (
                  <span className="bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                    {selectedTypes.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-muted-foreground text-xs font-medium">
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
                      <Label className="flex grow justify-between gap-2 font-normal">
                        {value === "INCOME" ? "Entrées" : "Sorties"}{" "}
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
              <Button variant="outline">
                <Columns3Icon
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                Vue
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
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
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-3">
          {/* Delete button */}
          {table.getSelectedRowModel().rows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="ml-auto" variant="outline">
                  <TrashIcon
                    className="-ms-1 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                  Supprimer
                  <span className="bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                    {table.getSelectedRowModel().rows.length}
                  </span>
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
                      définitivement {table.getSelectedRowModel().rows.length}{" "}
                      transaction
                      {table.getSelectedRowModel().rows.length > 1
                        ? "s"
                        : ""}{" "}
                      sélectionnée
                      {table.getSelectedRowModel().rows.length > 1 ? "s" : ""}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteRows}>
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {/* Add transaction button */}
          <Button
            className="ml-auto cursor-pointer"
            variant="outline"
            onClick={() => setIsAddTransactionDrawerOpen(true)}
          >
            <Plus className="-ms-1 opacity-60" size={16} aria-hidden="true" />
            Ajouter une transaction
          </Button>
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
                      className="h-11"
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
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewTransaction(row.original)}
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
                    <span>Erreur lors du chargement des transactions</span>
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Aucune transaction trouvée.
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
          <Label htmlFor={id} className="max-sm:sr-only">
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

      {/* Transaction Detail Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTransaction}
        open={isDetailDrawerOpen}
        onOpenChange={handleCloseDetailDrawer}
        onEdit={handleEditFromDrawer}
        onDelete={handleDeleteFromDrawer}
      />

      {/* Add Transaction Drawer */}
      <AddTransactionDrawer
        open={isAddTransactionDrawerOpen}
        onOpenChange={setIsAddTransactionDrawerOpen}
        onSubmit={handleAddTransaction}
      />
    </div>
  );
}

function RowActions({ row, onEdit }) {
  const transaction = row.original;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(transaction);
    }
  };

  const handleDelete = async () => {
    try {
      // Simulation de suppression (à remplacer par une mutation GraphQL)
      console.log("Suppression de la transaction:", transaction.id);
      setShowDeleteDialog(false);
      toast.success("Transaction supprimée");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(transaction.description);
    toast.success("Description copiée dans le presse-papier");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-end">
          <Button
            size="icon"
            variant="ghost"
            className="shadow-none"
            aria-label="Actions de la transaction"
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
          <DropdownMenuItem onClick={handleCopyDescription}>
            <span>Copier description</span>
            <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
          {transaction.attachment && (
            <DropdownMenuItem
              onClick={() => console.log("Voir justificatif", transaction.id)}
            >
              <span>Voir justificatif</span>
              <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
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
  );
}
