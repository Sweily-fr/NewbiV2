import {
  FilterIcon,
  ListFilterIcon,
  Columns3Icon,
  TrashIcon,
  Download,
  PlusIcon,
  CircleAlertIcon,
  ChevronDownIcon,
  Upload,
  Edit3Icon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/src/components/ui/button-group";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/src/components/ui/dropdown-menu";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";

export function DesktopFilters({
  inputRef,
  globalFilter,
  setGlobalFilter,
  expenseTypeFilter,
  setExpenseTypeFilter,
  assignedMemberFilter,
  setAssignedMemberFilter,
  organizationMembers,
  table,
  deleteMultipleLoading,
  handleDeleteRows,
  setIsExportDialogOpen,
  setIsAddTransactionDrawerOpen,
  setIsReceiptUploadDrawerOpen,
}) {
  return (
    <div className="hidden md:flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {/* First Button Group: Search, Filters, View */}
        <ButtonGroup>
          {/* Search */}
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              placeholder="Rechercher des dépenses..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full sm:w-[150px] lg:w-[250px] ps-9 rounded-r-none"
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
              <ListFilterIcon size={16} aria-hidden="true" />
            </div>
          </div>

          {/* Filtre par type de dépense et membre */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="font-normal">
                <FilterIcon
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />

                {(expenseTypeFilter || assignedMemberFilter) && (
                  <span className="bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                    {expenseTypeFilter && assignedMemberFilter ? "2" : "1"}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                <div className="text-sm font-medium">Filtrer les dépenses</div>

                {/* Sélection du type de dépense */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Type de dépense
                  </Label>
                  <Select
                    value={expenseTypeFilter || "all"}
                    onValueChange={(value) => {
                      setExpenseTypeFilter(value === "all" ? null : value);
                      if (value !== "EXPENSE_REPORT") {
                        setAssignedMemberFilter(null);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les dépenses</SelectItem>
                      <SelectItem value="EXPENSE_REPORT">
                        Notes de frais
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sélection du membre (uniquement si "Notes de frais" est sélectionné) */}
                {expenseTypeFilter === "EXPENSE_REPORT" && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Membre assigné
                    </Label>
                    <Select
                      value={assignedMemberFilter || "all"}
                      onValueChange={(value) => {
                        setAssignedMemberFilter(value === "all" ? null : value);
                      }}
                    >
                      <SelectTrigger>
                        {assignedMemberFilter ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={
                                  organizationMembers.find(
                                    (m) => m.userId === assignedMemberFilter
                                  )?.image
                                }
                                alt={
                                  organizationMembers.find(
                                    (m) => m.userId === assignedMemberFilter
                                  )?.name
                                }
                              />
                              <AvatarFallback className="text-xs">
                                {organizationMembers
                                  .find(
                                    (m) => m.userId === assignedMemberFilter
                                  )
                                  ?.name?.charAt(0)
                                  ?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                              {
                                organizationMembers.find(
                                  (m) => m.userId === assignedMemberFilter
                                )?.name
                              }
                            </span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Tous les membres" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les membres</SelectItem>
                        {organizationMembers.map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage
                                  src={member.image}
                                  alt={member.name}
                                />
                                <AvatarFallback className="text-xs">
                                  {member.name?.charAt(0)?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Bouton pour réinitialiser les filtres */}
                {(expenseTypeFilter || assignedMemberFilter) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setExpenseTypeFilter(null);
                      setAssignedMemberFilter(null);
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Toggle columns visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="font-normal rounded-l-none">
                <Columns3Icon
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Afficher les colonnes</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  // Utiliser le label meta ou le header de la colonne
                  const label = column.columnDef.meta?.label || column.columnDef.header || column.id;
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
                      {label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>

        {/* Export button */}
        <Button
          className="cursor-pointer font-normal"
          variant="outline"
          onClick={() => setIsExportDialogOpen(true)}
        >
          <Download className="-ms-1 opacity-60" size={16} aria-hidden="true" />
          Exporter
        </Button>
      </div>

      {/* Delete button */}
      {table.getSelectedRowModel().rows.length > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={deleteMultipleLoading}>
              <TrashIcon
                className="-ms-1 opacity-60"
                size={16}
                aria-hidden="true"
              />
              {deleteMultipleLoading ? "Suppression..." : "Supprimer"}
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
                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  {(() => {
                    const selectedRows = table.getSelectedRowModel().rows;
                    const expenseRows = selectedRows.filter(
                      (row) => row.original.source === "expense"
                    );
                    const invoiceRows = selectedRows.filter(
                      (row) => row.original.source === "invoice"
                    );
                    if (expenseRows.length === 0) {
                      return "Aucune dépense sélectionnée pour la suppression";
                    }

                    let message = `Êtes-vous sûr de vouloir supprimer ${expenseRows.length} dépense${expenseRows.length > 1 ? "s" : ""} ?`;

                    if (invoiceRows.length > 0) {
                      message += ` ${invoiceRows.length} facture${invoiceRows.length > 1 ? "s" : ""} sera${invoiceRows.length > 1 ? "ont" : ""} ignorée${invoiceRows.length > 1 ? "s" : ""} (non supprimables).`;
                    }

                    return message;
                  })()}
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRows}
                disabled={
                  deleteMultipleLoading ||
                  table
                    .getSelectedRowModel()
                    .rows.filter((row) => row.original.source === "expense")
                    .length === 0
                }
              >
                {deleteMultipleLoading ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Add Transaction Button Group */}
      <DropdownMenu>
        <ButtonGroup>
          <DropdownMenuTrigger asChild>
            <Button
              className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-popover dark:text-popover-foreground dark:hover:bg-popover/90"
            >
              Nouvelle dépense
            </Button>
          </DropdownMenuTrigger>
          <ButtonGroupSeparator />
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="cursor-pointer bg-black text-white hover:bg-black/90 dark:bg-popover dark:text-popover-foreground dark:hover:bg-popover/90"
            >
              <ChevronDownIcon size={16} aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </ButtonGroup>
        <DropdownMenuContent align="end" className="[--radius:1rem]">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setIsAddTransactionDrawerOpen(true)}>
              <Edit3Icon size={16} />
              Ajouter manuellement
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsReceiptUploadDrawerOpen(true)}>
              <Upload size={16} />
              Ajouter avec OCR
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
