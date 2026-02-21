"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/src/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/src/components/ui/empty";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import {
  useClientSegments,
  useCreateClientSegment,
  useUpdateClientSegment,
  useDeleteClientSegment,
  useClientsInSegment,
} from "@/src/hooks/useClientSegments";
import {
  Filter,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  CircleAlertIcon,
  X,
  Users,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";

// Field definitions for the rule builder
const RULE_FIELDS = [
  { value: "type", label: "Type de client", type: "select", options: [
    { value: "COMPANY", label: "Entreprise" },
    { value: "INDIVIDUAL", label: "Particulier" },
  ]},
  { value: "name", label: "Nom", type: "text" },
  { value: "email", label: "Email", type: "text" },
  { value: "address.city", label: "Ville", type: "text" },
  { value: "address.country", label: "Pays", type: "text" },
  { value: "address.postalCode", label: "Code postal", type: "text" },
  { value: "assignedMembers", label: "Assigné à", type: "members" },
  { value: "isBlocked", label: "Bloqué", type: "boolean" },
  { value: "isInternational", label: "International", type: "boolean" },
  { value: "createdAt", label: "Date de création", type: "date" },
];

const OPERATORS_BY_TYPE = {
  text: [
    { value: "equals", label: "est" },
    { value: "not_equals", label: "n'est pas" },
    { value: "contains", label: "contient" },
    { value: "not_contains", label: "ne contient pas" },
    { value: "starts_with", label: "commence par" },
    { value: "is_empty", label: "est vide" },
    { value: "is_not_empty", label: "n'est pas vide" },
  ],
  select: [
    { value: "equals", label: "est" },
    { value: "not_equals", label: "n'est pas" },
  ],
  boolean: [
    { value: "is_true", label: "est vrai" },
    { value: "is_false", label: "est faux" },
  ],
  date: [
    { value: "before", label: "avant" },
    { value: "after", label: "après" },
    { value: "in_last_days", label: "dans les derniers jours" },
  ],
  members: [
    { value: "assigned_to", label: "inclut" },
    { value: "not_assigned_to", label: "n'inclut pas" },
    { value: "is_empty", label: "aucun assigné" },
    { value: "is_not_empty", label: "au moins un assigné" },
  ],
};

const NO_VALUE_OPERATORS = ["is_true", "is_false", "is_empty", "is_not_empty"];

function getFieldDef(fieldValue) {
  return RULE_FIELDS.find((f) => f.value === fieldValue);
}

function getOperatorsForField(fieldValue) {
  const fieldDef = getFieldDef(fieldValue);
  if (!fieldDef) return [];
  return OPERATORS_BY_TYPE[fieldDef.type] || [];
}

// ==================== Rule Row ====================
function RuleRow({ rule, index, onChange, onRemove, canRemove, members }) {
  const fieldDef = getFieldDef(rule.field);
  const operators = getOperatorsForField(rule.field);
  const needsValue = !NO_VALUE_OPERATORS.includes(rule.operator);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Field */}
      <Select
        value={rule.field}
        onValueChange={(val) => {
          const newFieldDef = getFieldDef(val);
          const newOps = OPERATORS_BY_TYPE[newFieldDef?.type] || [];
          onChange(index, { field: val, operator: newOps[0]?.value || "", value: null });
        }}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Champ" />
        </SelectTrigger>
        <SelectContent>
          {RULE_FIELDS.map((f) => (
            <SelectItem key={f.value} value={f.value} className="text-xs">
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator */}
      <Select
        value={rule.operator}
        onValueChange={(val) => onChange(index, { ...rule, operator: val })}
      >
        <SelectTrigger className="w-[150px] h-8 text-xs">
          <SelectValue placeholder="Opérateur" />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.value} value={op.value} className="text-xs">
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value */}
      {needsValue && fieldDef?.type === "members" ? (
        <Select
          value={rule.value || ""}
          onValueChange={(val) => onChange(index, { ...rule, value: val })}
        >
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue placeholder="Sélectionner un membre" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : needsValue && fieldDef?.type === "select" ? (
        <Select
          value={rule.value || ""}
          onValueChange={(val) => onChange(index, { ...rule, value: val })}
        >
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Valeur" />
          </SelectTrigger>
          <SelectContent>
            {fieldDef.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : needsValue ? (
        <Input
          value={rule.value || ""}
          onChange={(e) => onChange(index, { ...rule, value: e.target.value })}
          placeholder={rule.operator === "in_last_days" ? "Nombre de jours" : fieldDef?.type === "date" ? "YYYY-MM-DD" : "Valeur"}
          className="w-[150px] h-8 text-xs"
        />
      ) : null}

      {/* Remove */}
      {canRemove && (
        <button
          onClick={() => onRemove(index)}
          className="text-muted-foreground/60 hover:text-red-500 transition-colors cursor-pointer shrink-0"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ==================== Create/Edit Dialog ====================
function SegmentDialog({ open, onOpenChange, segment, onSubmit, loading }) {
  const isEdit = !!segment;
  const { getAllCollaborators } = useOrganizationInvitations();
  const [members, setMembers] = useState([]);
  const [name, setName] = useState(segment?.name || "");
  const [description, setDescription] = useState(segment?.description || "");
  const [matchType, setMatchType] = useState(segment?.matchType || "all");
  const [color, setColor] = useState(segment?.color || "#8b5cf6");
  const [rules, setRules] = useState(
    segment?.rules?.length > 0
      ? segment.rules.map((r) => ({ field: r.field, operator: r.operator, value: r.value }))
      : [{ field: "type", operator: "equals", value: "COMPANY" }]
  );

  useEffect(() => {
    if (open) {
      getAllCollaborators().then((result) => {
        if (result.success) {
          setMembers(
            result.data
              .filter((c) => c.type === "member")
              .map((m) => ({
                id: m.userId || m.id,
                name: m.user?.name || m.name || m.email,
              }))
          );
        }
      });
    }
  }, [open, getAllCollaborators]);

  const handleRuleChange = (index, newRule) => {
    setRules((prev) => prev.map((r, i) => (i === index ? newRule : r)));
  };

  const handleRuleRemove = (index) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddRule = () => {
    setRules((prev) => [...prev, { field: "name", operator: "contains", value: "" }]);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (rules.length === 0) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      matchType,
      color,
      rules: rules.map((r) => ({
        field: r.field,
        operator: r.operator,
        value: r.value || null,
      })),
    });
  };

  const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#14b8a6"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le segment" : "Nouveau segment"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nom</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Entreprises parisiennes"
              className="h-8 text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle"
              className="h-8 text-sm"
            />
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Couleur</label>
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Match type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Les contacts correspondent à</label>
            <Select value={matchType} onValueChange={setMatchType}>
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Toutes les règles (ET)</SelectItem>
                <SelectItem value="any" className="text-xs">Au moins une règle (OU)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rules */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Règles</label>
            <div className="space-y-2">
              {rules.map((rule, i) => (
                <RuleRow
                  key={i}
                  rule={rule}
                  index={i}
                  onChange={handleRuleChange}
                  onRemove={handleRuleRemove}
                  canRemove={rules.length > 1}
                  members={members}
                />
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={handleAddRule} className="text-xs mt-1 font-normal">
              <Plus size={12} className="mr-1" />
              Ajouter une règle
            </Button>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm" className="font-normal">
              Annuler
            </Button>
          </DialogClose>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !name.trim() || rules.length === 0}
            className="font-normal"
          >
            {loading ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Segment Detail View ====================
function SegmentDetailView({ segment, onBack }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const limit = 25;
  const { clients, totalItems, totalPages, loading } = useClientsInSegment(segment.id, page, limit, search);

  const searchTimeoutRef = useRef(null);

  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ChevronLeft size={16} />
          </Button>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <div>
              <h1 className="text-2xl font-medium mb-0">{segment.name}</h1>
              {segment.description && (
                <p className="text-muted-foreground text-sm mt-0.5">{segment.description}</p>
              )}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-normal">
          {totalItems} contact{totalItems !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Rules display + Search */}
      <div className="px-4 sm:px-6 pb-4 flex-shrink-0 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {segment.rules.map((rule, i) => (
            <Badge key={i} variant="outline" className="text-xs font-normal py-1">
              {getFieldDef(rule.field)?.label || rule.field}{" "}
              {getOperatorsForField(rule.field)?.find((o) => o.value === rule.operator)?.label || rule.operator}
              {rule.value && !NO_VALUE_OPERATORS.includes(rule.operator)
                ? ` "${rule.value}"`
                : ""}
            </Badge>
          ))}
          <Badge variant="outline" className="text-xs font-normal py-1 bg-muted">
            {segment.matchType === "all" ? "Toutes (ET)" : "Au moins une (OU)"}
          </Badge>
        </div>
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher un contact..."
            className="h-8 text-sm pl-8"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex-1 overflow-auto px-4 sm:px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-[150px] rounded" />
                <Skeleton className="h-3 w-[100px] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "Aucun contact trouvé pour cette recherche" : "Aucun contact ne correspond à ce segment"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
            <table className="w-full table-fixed">
              <thead>
                <tr>
                  <th className="h-10 p-2 pl-4 sm:pl-6 text-left align-middle font-normal text-xs text-muted-foreground w-[35%]">Contact</th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[30%]">Email</th>
                  <th className="h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground w-[20%]">Ville</th>
                  <th className="h-10 p-2 pr-4 sm:pr-6 text-left align-middle font-normal text-xs text-muted-foreground w-[15%]">Type</th>
                </tr>
              </thead>
            </table>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full table-fixed">
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-2 pl-4 sm:pl-6 align-middle w-[35%]">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                          {client.type === "COMPANY" ? (
                            <Building2 size={13} className="text-muted-foreground" />
                          ) : (
                            <User size={13} className="text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-sm font-medium truncate">{client.name}</span>
                      </div>
                    </td>
                    <td className="p-2 align-middle text-sm text-muted-foreground w-[30%] truncate">{client.email}</td>
                    <td className="p-2 align-middle text-sm text-muted-foreground w-[20%] truncate">{client.address?.city || "—"}</td>
                    <td className="p-2 pr-4 sm:pr-6 align-middle w-[15%]">
                      <Badge variant="outline" className="text-xs font-normal">
                        {client.type === "COMPANY" ? "Entreprise" : "Particulier"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 bg-background flex-shrink-0">
            <p className="text-xs text-muted-foreground">
              {totalItems} contact{totalItems !== 1 ? "s" : ""} dans ce segment
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  <ChevronsLeft size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={14} />
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  Page {page} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  <ChevronsRight size={14} />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Main Page ====================
function SegmentsContent() {
  const router = useRouter();
  const { segments, loading, refetch } = useClientSegments();
  const { createSegment, loading: creating } = useCreateClientSegment();
  const { updateSegment, loading: updating } = useUpdateClientSegment();
  const { deleteSegment } = useDeleteClientSegment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [viewingSegment, setViewingSegment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleCreate = async (input) => {
    await createSegment(input);
    setDialogOpen(false);
  };

  const handleUpdate = async (input) => {
    if (!editingSegment) return;
    await updateSegment(editingSegment.id, input);
    setEditingSegment(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteSegment(deleteTarget.id);
    setDeleteTarget(null);
    if (viewingSegment?.id === deleteTarget.id) {
      setViewingSegment(null);
    }
  };

  // Show detail view
  if (viewingSegment) {
    return (
      <SegmentDetailView
        segment={viewingSegment}
        onBack={() => setViewingSegment(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
        <div>
          <h1 className="text-2xl font-medium mb-0">Segments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Créez des segments dynamiques pour cibler vos contacts.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setDialogOpen(true)}
          className="self-start"
        >
          <Plus size={14} strokeWidth={2} aria-hidden="true" />
          Nouveau segment
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <Skeleton className="h-4 w-[120px] rounded" />
                <Skeleton className="h-3 w-[180px] rounded" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-[80px] rounded-full" />
                  <Skeleton className="h-5 w-[60px] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : segments.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <Empty>
              <EmptyMedia variant="icon">
                <Filter />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>Aucun segment</EmptyTitle>
                <EmptyDescription>
                  Les segments filtrent automatiquement vos contacts selon des critères dynamiques.
                  Créez votre premier segment pour commencer.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="primary" onClick={() => setDialogOpen(true)} className="font-normal">
                  <Plus size={14} className="mr-1" />
                  Créer un segment
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((segment) => (
              <div
                key={segment.id}
                className="group rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer p-4"
                onClick={() => setViewingSegment(segment)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: segment.color }}
                    />
                    <h3 className="text-sm font-medium truncate">{segment.name}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        className="cursor-pointer gap-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSegment(segment);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer gap-2 text-xs text-red-600 focus:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(segment);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {segment.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {segment.description}
                  </p>
                )}

                {/* Rules as badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {segment.rules.slice(0, 3).map((rule, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] font-normal py-0.5">
                      {getFieldDef(rule.field)?.label || rule.field}
                    </Badge>
                  ))}
                  {segment.rules.length > 3 && (
                    <Badge variant="outline" className="text-[10px] font-normal py-0.5">
                      +{segment.rules.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Client count */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users size={12} />
                  <span>
                    {segment.clientCount != null ? segment.clientCount : "—"} contact{segment.clientCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      {dialogOpen && (
        <SegmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          segment={null}
          onSubmit={handleCreate}
          loading={creating}
        />
      )}

      {/* Edit dialog */}
      {editingSegment && (
        <SegmentDialog
          open={!!editingSegment}
          onOpenChange={(open) => !open && setEditingSegment(null)}
          segment={editingSegment}
          onSubmit={handleUpdate}
          loading={updating}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <CircleAlertIcon className="opacity-80" size={16} />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce segment ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le segment &quot;{deleteTarget?.name}&quot; sera supprimé. Les contacts ne seront pas affectés.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SegmentsPage() {
  return (
    <ProRouteGuard pageName="Clients">
      <SegmentsContent />
    </ProRouteGuard>
  );
}
