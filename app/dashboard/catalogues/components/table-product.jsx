"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
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
  EllipsisIcon,
  ListFilterIcon,
  Search,
  TrashIcon,
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
import { Input } from "@/src/components/ui/input";
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
import ProductExportButton from "./product-export-button";
import ProductImportDialog from "./product-import-dialog";
import ProductFilters from "./product-filters";

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

export default function TableProduct({ handleAddProduct, hideHeaderButtons = false }) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const inputRef = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebouncedValue(globalFilter, 300);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Utilisation du hook pour récupérer les produits (sans recherche côté serveur)
  // On récupère les produits avec pagination côté client
  const {
    products: allProducts,
    totalItems,
    currentPage,
    totalPages,
    loading,
    error,
    refetch,
  } = useProducts(1, 100, ""); // Récupère 100 produits max (pagination côté client)

  const { deleteProduct: deleteProductMain } = useDeleteProduct({ showToast: false });
  const { deleteProduct: deleteProductSingle } = useDeleteProduct({ showToast: true });

  // Filtrage local des produits
  const filteredProducts = useMemo(() => {
    if (!debouncedGlobalFilter) return allProducts;

    const searchTerm = debouncedGlobalFilter.toLowerCase();
    return allProducts.filter((product) => {
      const searchableContent =
        `${product.name} ${product.reference || ""} ${product.category || ""}`.toLowerCase();
      return searchableContent.includes(searchTerm);
    });
  }, [allProducts, debouncedGlobalFilter]);

  const [sorting, setSorting] = useState([
    {
      id: "name",
      desc: false,
    },
  ]);

  const handleDeleteRows = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const count = selectedRows.length;
    try {
      await Promise.all(
        selectedRows.map((row) => deleteProductMain(row.original.id))
      );
      table.resetRowSelection();
      await refetch();
      toast.success(`${count} produit${count > 1 ? 's' : ''} supprimé${count > 1 ? 's' : ''} avec succès`);
    } catch (error) {
      toast.error('Erreur lors de la suppression des produits');
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
        await deleteProductSingle(id);
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

  // Fonction pour mettre à jour les catégories sélectionnées (utilisée par ProductFilters)
  const setSelectedCategories = (newCategories) => {
    table
      .getColumn("category")
      ?.setFilterValue(newCategories.length ? newCategories : undefined);
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex md:flex-col h-full overflow-hidden">
        {/* Filters - Structure comme page factures */}
        <div className="flex items-center justify-between gap-3 flex-shrink-0 px-4 sm:px-6 py-4">
          {/* Search + Filtres à gauche */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 h-8 w-full sm:w-[400px] rounded-[9px] border border-[#E6E7EA] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
              <Search size={16} className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
              <Input
                variant="ghost"
                id={`${id}-input`}
                ref={inputRef}
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  table.getColumn("name")?.setFilterValue(e.target.value);
                }}
                placeholder="Recherchez par nom ou par référence..."
              />
              {Boolean(globalFilter) && (
                <button
                  onClick={() => {
                    setGlobalFilter("");
                    table.getColumn("name")?.setFilterValue("");
                    inputRef.current?.focus();
                  }}
                  className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex items-center justify-center rounded focus-visible:ring-[3px] focus-visible:outline-none cursor-pointer"
                  aria-label="Effacer la recherche"
                >
                  <CircleXIcon size={16} strokeWidth={2} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Filters Button - move to left side */}
            <ProductFilters
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              uniqueCategories={uniqueCategoryValues}
              table={table}
            />
          </div>

          {/* Actions à droite */}
          <div className="flex items-center gap-2">
            {/* Delete button - shown when rows are selected */}
            {table.getSelectedRowModel().rows.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    data-mobile-delete-trigger-product
                    className="cursor-pointer font-normal"
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
                  <AlertDialogAction
                    onClick={handleDeleteRows}
                    className="text-white"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          </div>
        </div>

        {/* Table - Style identique à Transactions */}
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
                        style={{ width: header.getSize() }}
                        className={`h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground ${index === 0 ? "pl-4 sm:pl-6" : ""} ${index === arr.length - 1 ? "pr-4 sm:pr-6" : ""}`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
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
                  Array.from({ length: pagination.pageSize }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="border-b">
                      {columns.map((col, colIndex, arr) => (
                        <td
                          key={`skeleton-${index}-${colIndex}`}
                          className={`p-2 align-middle text-sm ${colIndex === 0 ? "pl-4 sm:pl-6" : ""} ${colIndex === arr.length - 1 ? "pr-4 sm:pr-6" : ""}`}
                        >
                          <Skeleton className="h-4 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="border-b hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer transition-colors"
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
                      colSpan={columns.length}
                      className="h-24 text-center p-2 text-red-500"
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
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="h-24 text-center p-2"
                    >
                      Aucun produit trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination - Style identique à Transactions */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 bg-background flex-shrink-0">
          <div className="flex-1 text-xs font-normal text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} sur{" "}
            {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
          </div>
          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="flex items-center gap-1.5">
              <p className="whitespace-nowrap text-xs font-normal">
                Lignes par page
              </p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-7 w-[70px] text-xs">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
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
            <div className="flex items-center whitespace-nowrap text-xs font-normal">
              Page {table.getState().pagination.pageIndex + 1} sur{" "}
              {table.getPageCount() || 1}
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
                    aria-label="Première page"
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
                    aria-label="Page précédente"
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
                    aria-label="Page suivante"
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
                    aria-label="Dernière page"
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
        {/* Mobile Toolbar */}
        <div className="px-3 sm:px-4 py-3 sticky top-0 bg-background z-10 border-b space-y-2">
          {/* First Row: Search + Delete Button */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Input
                placeholder="Rechercher..."
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  table.getColumn("name")?.setFilterValue(e.target.value);
                }}
                className="h-9 pl-3 pr-3 bg-gray-50 dark:bg-gray-900 border-none rounded-md text-xs sm:text-sm w-full"
              />
            </div>

            {/* Delete button for mobile - shown when rows are selected */}
            {table.getSelectedRowModel().rows.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="h-9 px-2 sm:px-3 text-xs flex-shrink-0"
                title={`Supprimer ${table.getSelectedRowModel().rows.length} produit(s)`}
                onClick={() => {
                  // Trigger the delete dialog
                  const deleteButton = document.querySelector(
                    "[data-mobile-delete-trigger-product]"
                  );
                  if (deleteButton) deleteButton.click();
                }}
              >
                <TrashIcon className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">({table.getSelectedRowModel().rows.length})</span>
              </Button>
            )}
          </div>

          {/* Second Row: Filter, Import, Export */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {/* Filter Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2 sm:px-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs flex-shrink-0"
                  title="Filtrer par catégorie"
                >
                  <ListFilterIcon className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-1" />
                  <span className="hidden sm:inline">Filtrer</span>
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

            {/* Import/Export buttons for mobile */}
            <ProductImportDialog onImportComplete={refetch} />
            <ProductExportButton 
              products={allProducts} 
              selectedRows={table.getSelectedRowModel().rows}
            />
          </div>
        </div>

        {/* Mobile Table */}
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
                        header.column.id === "category" ||
                        header.column.id === "actions"
                    )
                    .map((header) => (
                      <TableHead
                        key={header.id}
                        className="py-3 px-3 sm:px-4 text-left font-medium text-gray-600 dark:text-gray-400 text-xs sm:text-sm"
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
                    {row
                      .getVisibleCells()
                      .filter(
                        (cell) =>
                          cell.column.id === "select" ||
                          cell.column.id === "name" ||
                          cell.column.id === "category" ||
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
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
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

      </div>

      {/* Pagination Skeleton - Style identique à Transactions */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
        <Skeleton className="h-4 w-[150px]" />
        <div className="flex items-center space-x-4 lg:space-x-6">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-7 w-[70px]" />
          </div>
          <Skeleton className="h-4 w-[80px]" />
          <div className="flex gap-1">
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
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
