"use client";

import { useId, useMemo, useRef, useState } from "react";
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
  Loader2,
  AlertCircle,
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
import { Skeleton } from "@/src/components/ui/skeleton";
import { useProducts, useDeleteProduct } from "@/src/hooks/useProducts";
import ProductModal from "./product-modal";

// Custom filter function for multi-column searching
const multiColumnFilterFn = (row, columnId, filterValue) => {
  const searchableRowContent =
    `${row.original.name} ${row.original.reference} ${row.original.category || ""}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

const categoryFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true;
  const category = row.getValue(columnId);
  return filterValue.includes(category);
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
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    size: 28,
    enableSorting: false,
    enableHiding: false,
  },
  {
    header: "Nom du produit",
    accessorKey: "name",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div
          className="font-normal max-w-[120px] md:max-w-[180px] truncate"
          title={product.name}
        >
          {product.name}
        </div>
      );
    },
    size: 200,
    filterFn: multiColumnFilterFn,
    enableHiding: false,
  },
  {
    header: "Référence",
    accessorKey: "reference",
    cell: ({ row }) => {
      const reference = row.getValue("reference");
      return reference ? (
        <span
          className="font-mono text-sm max-w-[100px] truncate block"
          title={reference}
        >
          {reference}
        </span>
      ) : (
        "-"
      );
    },
    size: 120,
  },
  {
    header: "Prix unitaire (HT)",
    accessorKey: "unitPrice",
    cell: ({ row }) => {
      const price = row.getValue("unitPrice");
      return price ? (
        <span className="font-normal">{price.toFixed(2)} €</span>
      ) : (
        "-"
      );
    },
    size: 130,
  },
  {
    header: "Taux TVA",
    accessorKey: "vatRate",
    cell: ({ row }) => {
      const vatRate = row.getValue("vatRate");
      return vatRate ? (
        <Badge className="bg-green-100 border-green-300 text-green-800 font-normal">
          {vatRate}%
        </Badge>
      ) : (
        "-"
      );
    },
    size: 100,
  },
  {
    header: "Unité",
    accessorKey: "unit",
    cell: ({ row }) => {
      const unit = row.getValue("unit");
      return unit || "-";
    },
    size: 80,
  },
  {
    header: "Catégorie",
    accessorKey: "category",
    cell: ({ row }) => {
      const category = row.getValue("category");
      return category ? (
        <Badge
          className="bg-blue-100 border-blue-300 text-blue-800 font-normal max-w-[100px] inline-block"
          title={category}
        >
          <span className="block truncate">{category}</span>
        </Badge>
      ) : (
        "-"
      );
    },
    size: 120,
    filterFn: categoryFilterFn,
  },
  {
    header: "Description",
    accessorKey: "description",
    cell: ({ row }) => {
      const description = row.getValue("description");
      return description ? (
        <div
          className="text-sm text-muted-foreground max-w-[200px] truncate"
          title={description}
        >
          {description}
        </div>
      ) : (
        "-"
      );
    },
    size: 200,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      const handleEditProduct = table.options.meta?.handleEditProduct;
      const handleDeleteProduct = table.options.meta?.handleDeleteProduct;
      return (
        <RowActions
          row={row}
          onEdit={handleEditProduct}
          onDelete={(id) => handleDeleteProduct(id)}
        />
      );
    },
    size: 60,
    enableHiding: false,
  },
];

export default function TableProduct({ handleAddProduct }) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const inputRef = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Utilisation du hook pour récupérer les produits (sans recherche côté serveur)
  // On récupère TOUS les produits car la pagination est gérée côté client
  const {
    products: allProducts,
    totalItems,
    currentPage,
    totalPages,
    loading,
    error,
    refetch,
  } = useProducts(1, 1000, ""); // Récupère tous les produits (pagination côté client)

  const { deleteProduct: deleteProductMain } = useDeleteProduct();

  // Filtrage local des produits
  const filteredProducts = useMemo(() => {
    if (!globalFilter) return allProducts;

    const searchTerm = globalFilter.toLowerCase();
    return allProducts.filter((product) => {
      const searchableContent =
        `${product.name} ${product.reference || ""} ${product.category || ""}`.toLowerCase();
      return searchableContent.includes(searchTerm);
    });
  }, [allProducts, globalFilter]);

  const [sorting, setSorting] = useState([
    {
      id: "name",
      desc: false,
    },
  ]);

  const handleDeleteRows = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    try {
      await Promise.all(
        selectedRows.map((row) => deleteProductMain(row.original.id))
      );
      table.resetRowSelection();
      await refetch();
    } catch (error) {
      console.error("Error deleting products:", error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Données actualisées");
    } catch (error) {
      toast.error("Erreur lors de l'actualisation");
      console.error("Error refreshing products:", error);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (updatedProduct) => {
    await refetch();
    handleCloseEditModal();
  };

  const table = useReactTable({
    data: filteredProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    manualPagination: false,
    pageCount: Math.ceil(filteredProducts.length / pagination.pageSize),
    onPaginationChange: (updater) => {
      setPagination(updater);
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
    meta: {
      handleEditProduct,
      handleDeleteProduct: async (id) => {
        await deleteProductMain(id);
        await refetch();
      },
    },
  });

  // Get unique category values
  const categoryColumn = table.getColumn("category");
  const uniqueCategoryValues = categoryColumn 
    ? Array.from(categoryColumn.getFacetedUniqueValues().keys()).sort()
    : [];

  // Get counts for each category
  const categoryCounts = categoryColumn 
    ? categoryColumn.getFacetedUniqueValues()
    : new Map();

  // Get selected categories
  const selectedCategories = categoryColumn?.getFilterValue() ?? [];

  // Affichage du skeleton pendant le chargement
  if (loading) {
    return <CatalogSkeleton />;
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>Erreur lors du chargement des produits</span>
      </div>
    );
  }

  const handleCategoryChange = (checked, value) => {
    const filterValue = table.getColumn("category")?.getFilterValue();
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
      .getColumn("category")
      ?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Filter by name or reference */}
            <div className="relative">
              <Input
                id={`${id}-input`}
                ref={inputRef}
                className={cn(
                  "peer min-w-60 ps-9",
                  Boolean(table.getColumn("name")?.getFilterValue()) && "pe-9"
                )}
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  table.getColumn("name")?.setFilterValue(e.target.value);
                }}
                placeholder="Filtrer par nom ou référence..."
                type="text"
                aria-label="Filter by name or reference"
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
            {/* Filter by category */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="font-normal">
                  <FilterIcon
                    className="-ms-1 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                  Catégorie
                  {selectedCategories.length > 0 && (
                    <span className="bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                      {selectedCategories.length}
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
                    {uniqueCategoryValues.map((value, i) => (
                      <div key={value} className="flex items-center gap-2">
                        <Checkbox
                          id={`${id}-${i}`}
                          checked={selectedCategories.includes(value)}
                          onCheckedChange={(checked) =>
                            handleCategoryChange(checked, value)
                          }
                        />
                        <Label
                          htmlFor={`${id}-${i}`}
                          className="flex grow justify-between gap-2 font-normal"
                        >
                          {value}{" "}
                          <span className="text-muted-foreground ms-2 text-xs">
                            {categoryCounts.get(value)}
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
                <Button variant="outline" className="font-normal">
                  <Columns3Icon
                    className="-ms-1 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">Colonne</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sélection des colonnes</DropdownMenuLabel>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    // Traduction des noms de colonnes
                    const columnTranslations = {
                      name: "Nom du produit",
                      reference: "Référence",
                      unitPrice: "Prix unitaire (HT)",
                      vatRate: "Taux TVA",
                      unit: "Unité",
                      category: "Catégorie",
                      description: "Description",
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
                        {columnTranslations[column.id] || column.id}
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
                  <Button 
                    className="ml-auto" 
                    variant="destructive"
                    data-mobile-delete-trigger-product
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Supprimer ({table.getSelectedRowModel().rows.length})
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
                        produit(s) sélectionné(s).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteRows} className="text-white">
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {/* Add product button */}
            <Button
              className="ml-auto cursor-pointer font-normal bg-black text-white hover:bg-gray-800"
              onClick={handleAddProduct}
            >
              <PlusIcon
                className="-ms-1 text-white"
                size={16}
                aria-hidden="true"
              />
              Ajouter un produit
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
                  <TableRow key={`skeleton-${index}`} className="h-14">
                    <TableCell>
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
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
                    className="h-14"
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
                      <span>Erreur lors du chargement des produits</span>
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
                    Aucun produit trouvé.
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
              className="text-muted-foreground text-sm whitespace-nowrap font-normal"
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
        {/* Mobile Toolbar */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Input
                placeholder="Rechercher des produits..."
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  table.getColumn("name")?.setFilterValue(e.target.value);
                }}
                className="h-9 pl-3 pr-3 bg-gray-50 dark:bg-gray-900 border-none rounded-md text-sm"
              />
            </div>

            {/* Filter Button */}
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
                    Filtrer par catégorie
                  </div>
                  <div className="space-y-3">
                    {uniqueCategoryValues.map((value, i) => (
                      <div key={value} className="flex items-center gap-2">
                        <Checkbox
                          id={`mobile-${id}-${i}`}
                          checked={selectedCategories.includes(value)}
                          onCheckedChange={(checked) =>
                            handleCategoryChange(checked, value)
                          }
                        />
                        <Label
                          htmlFor={`mobile-${id}-${i}`}
                          className="flex grow justify-between gap-2 font-normal"
                        >
                          {value}{" "}
                          <span className="text-muted-foreground ms-2 text-xs">
                            {categoryCounts.get(value)}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Delete button for mobile - shown when rows are selected */}
            {table.getSelectedRowModel().rows.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="h-9 px-3"
                onClick={() => {
                  // Trigger the delete dialog
                  const deleteButton = document.querySelector('[data-mobile-delete-trigger-product]');
                  if (deleteButton) deleteButton.click();
                }}
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                ({table.getSelectedRowModel().rows.length})
              </Button>
            )}

            {/* Add Product Button */}
            {/* <Button
              variant="default"
              size="sm"
              className="h-7 w-7 p-0 bg-[#5A50FF] hover:bg-[#5A50FF] text-white rounded-sm"
              onClick={handleAddProduct}
            >
              <PlusIcon className="h-4 w-4" />
            </Button> */}
          </div>
        </div>

        {/* Mobile Table */}
        <div className="overflow-x-auto pb-20">
          <Table className="w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-gray-100 dark:border-gray-400"
                >
                  {headerGroup.headers
                    .filter((header) => header.column.id === "select" || header.column.id === "name" || header.column.id === "category" || header.column.id === "actions")
                    .map((header) => (
                    <TableHead
                      key={header.id}
                      className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-400"
                    >
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
                    className="border-b border-gray-100 dark:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    {row.getVisibleCells()
                      .filter((cell) => cell.column.id === "select" || cell.column.id === "name" || cell.column.id === "category" || cell.column.id === "actions")
                      .map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-3 px-4"
                      >
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
                    colSpan={4}
                    className="h-24 text-center"
                  >
                    Aucun produit trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal d'édition unique pour desktop et mobile */}
      <ProductModal
        product={editingProduct}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={handleSaveProduct}
      />
    </>
  );
}

function RowActions({ row, onEdit, onDelete }) {
  const product = row.original;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(product);
    }
  };

  const handleDelete = async () => {
    try {
      if (onDelete) {
        await onDelete(product.id);
      }
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Erreur lors de la suppression du produit");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-end">
          <Button
            size="icon"
            variant="ghost"
            className="shadow-none"
            aria-label="Actions du produit"
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
          <DropdownMenuItem
            onClick={() =>
              navigator.clipboard.writeText(product.reference || product.name)
            }
          >
            <span>Copier référence</span>
            <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
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

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le produit "{product.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  );
}

// Composant skeleton adaptatif pour le catalogue
function CatalogSkeleton() {
  return (
    <>
      {/* Desktop Skeleton */}
      <div className="hidden md:block space-y-4">
        {/* Filters skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Search input skeleton */}
            <Skeleton className="h-10 w-60" />
            {/* Category filter skeleton */}
            <Skeleton className="h-10 w-24" />
            {/* Column filter skeleton */}
            <Skeleton className="h-10 w-20 sm:w-24" />
          </div>
          <div className="flex items-center gap-3">
            {/* Add product button skeleton */}
            <Skeleton className="h-10 w-32 sm:w-40" />
          </div>
        </div>

      {/* Table skeleton */}
      <div className="bg-background overflow-hidden rounded-md border">
        <div className="table-fixed w-full">
          {/* Header skeleton */}
          <div className="border-b">
            <div className="flex items-center h-11 px-4">
              <Skeleton className="h-4 w-4 mr-4" />
              <div className="flex-1 flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <div className="hidden sm:block">
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="hidden md:block">
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="hidden lg:block">
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-4 w-8 ml-auto" />
              </div>
            </div>
          </div>

          {/* Rows skeleton - Responsive */}
          <div className="divide-y">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="flex items-center h-14 px-4">
                <Skeleton className="h-4 w-4 mr-4" />
                <div className="flex-1 flex gap-4 items-center">
                  {/* Nom du produit */}
                  <Skeleton className="h-4 w-32" />
                  {/* Référence */}
                  <Skeleton className="h-4 w-24" />
                  {/* Prix */}
                  <Skeleton className="h-4 w-20" />
                  {/* TVA */}
                  <Skeleton className="h-5 w-12 rounded-full" />
                  {/* Unité - Hidden on mobile */}
                  <div className="hidden sm:block">
                    <Skeleton className="h-4 w-16" />
                  </div>
                  {/* Catégorie - Hidden on mobile */}
                  <div className="hidden md:block">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  {/* Description - Hidden on mobile and tablet */}
                  <div className="hidden lg:block">
                    <Skeleton className="h-4 w-40" />
                  </div>
                  {/* Actions */}
                  <div className="ml-auto">
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between gap-8">
        {/* Results per page */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-24 hidden sm:block" />
          <Skeleton className="h-10 w-16" />
        </div>
        {/* Page info */}
        <div className="flex-1 flex justify-end">
          <Skeleton className="h-4 w-20" />
        </div>
        {/* Pagination buttons */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      </div>

      {/* Mobile Skeleton */}
      <div className="md:hidden space-y-4">
        {/* Toolbar */}
        <div className="px-4 py-3 space-y-3">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>

        {/* Product Cards */}
        <div className="px-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
