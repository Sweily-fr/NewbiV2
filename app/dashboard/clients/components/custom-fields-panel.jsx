"use client";

import { useState, useEffect } from "react";
import { FIELD_TYPES } from "@/src/hooks/useClientCustomFields";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Badge } from "@/src/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
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
import { toast } from "@/src/components/ui/sonner";
import {
  Plus,
  Trash2,
  Edit2,
  Settings2,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  ChevronDown,
  CheckSquare,
  CheckCircle,
  Link,
  Mail,
  Phone,
  X,
  Loader2,
} from "lucide-react";

const FIELD_TYPE_ICONS = {
  TEXT: Type,
  TEXTAREA: AlignLeft,
  NUMBER: Hash,
  DATE: Calendar,
  SELECT: ChevronDown,
  MULTISELECT: CheckSquare,
  CHECKBOX: CheckCircle,
  URL: Link,
  EMAIL: Mail,
  PHONE: Phone,
};

function FieldTypeIcon({ type, className }) {
  const Icon = FIELD_TYPE_ICONS[type] || Type;
  return <Icon className={className} />;
}

function OptionEditor({ options, onChange }) {
  const [newOption, setNewOption] = useState({
    label: "",
    value: "",
    color: "#6b7280",
  });

  const addOption = () => {
    if (!newOption.label.trim()) return;
    const value =
      newOption.value.trim() ||
      newOption.label.trim().toLowerCase().replace(/\s+/g, "_");
    onChange([...options, { ...newOption, value }]);
    setNewOption({ label: "", value: "", color: "#6b7280" });
  };

  const removeOption = (index) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const updateOption = (index, field, value) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <Label>Options</Label>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="color"
              value={option.color || "#6b7280"}
              onChange={(e) => updateOption(index, "color", e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
            <Input
              value={option.label}
              onChange={(e) => updateOption(index, "label", e.target.value)}
              placeholder="Label"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeOption(index)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={newOption.color}
          onChange={(e) =>
            setNewOption({ ...newOption, color: e.target.value })
          }
          className="w-8 h-8 rounded border cursor-pointer"
        />
        <Input
          value={newOption.label}
          onChange={(e) =>
            setNewOption({ ...newOption, label: e.target.value })
          }
          placeholder="Nouvelle option..."
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && addOption()}
        />
        <Button variant="outline" size="sm" onClick={addOption}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function FieldFormDialog({ open, onOpenChange, field, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: "",
    fieldType: "TEXT",
    description: "",
    placeholder: "",
    isRequired: false,
    options: [],
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: field?.name || "",
        fieldType: field?.fieldType || "TEXT",
        description: field?.description || "",
        placeholder: field?.placeholder || "",
        isRequired: field?.isRequired ?? false,
        options:
          field?.options?.map((o) => ({
            label: o.label,
            value: o.value,
            color: o.color,
          })) || [],
      });
    }
  }, [open, field]);

  const isEditing = !!field;
  const needsOptions = ["SELECT", "MULTISELECT"].includes(formData.fieldType);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Le nom du champ est requis");
      return;
    }
    if (needsOptions && formData.options.length === 0) {
      toast.error("Ajoutez au moins une option");
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <Settings2 className="size-4" />
              {isEditing ? "Modifier le champ" : "Nouveau champ personnalisé"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 px-5 pt-3 pb-0">
            <div className="space-y-2">
              <label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                Nom du champ *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Date anniversaire, Source, Réseaux sociaux..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                Type de champ *
              </label>
              <Select
                value={formData.fieldType}
                onValueChange={(value) =>
                  setFormData({ ...formData, fieldType: value, options: [] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <FieldTypeIcon type={type.value} className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsOptions && (
              <OptionEditor
                options={formData.options}
                onChange={(options) => setFormData({ ...formData, options })}
              />
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                Texte affiché dans le champ vide (optionnel)
              </label>
              <Input
                id="placeholder"
                value={formData.placeholder}
                onChange={(e) =>
                  setFormData({ ...formData, placeholder: e.target.value })
                }
                placeholder="Texte d'aide affiché dans le champ vide"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                Description (optionnel)
              </label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description du champ pour les utilisateurs"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                  Champ obligatoire
                </label>
                <p className="text-xs text-muted-foreground">
                  Le champ devra être rempli pour chaque client
                </p>
              </div>
              <Switch
                checked={formData.isRequired}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRequired: checked })
                }
              />
            </div>

            <div className="flex justify-end border-t border-border/40 mt-3 px-5 py-3 -mx-5">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Enregistrer" : "Créer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({ field, onEdit, onDelete, onToggle }) {
  const fieldType = FIELD_TYPES.find((t) => t.value === field.fieldType);

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 flex-shrink-0">
        <FieldTypeIcon
          type={field.fieldType}
          className="h-3 w-3 text-primary"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{field.name}</span>
          <span className="text-[11px] text-muted-foreground">
            {fieldType?.label}
          </span>
          {field.isRequired && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
              Requis
            </Badge>
          )}
        </div>
      </div>

      <Switch
        checked={field.isActive}
        onCheckedChange={() => onToggle(field)}
        className="data-[state=checked]:bg-[#5b50ff] scale-90"
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(field)}
        className="h-6 w-6"
      >
        <Edit2 className="h-3 w-3" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(field)}
        className="h-6 w-6 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default function CustomFieldsPanel({
  workspaceId,
  fields = [],
  planLimits,
  onCreateField,
  onUpdateField,
  onDeleteField,
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [deletingField, setDeletingField] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const customFieldsLimit = planLimits?.customFields ?? -1;
  const isLimitReached =
    customFieldsLimit !== -1 && fields.length >= customFieldsLimit;
  const nextPlanName = customFieldsLimit <= 3 ? "TPE" : "Entreprise";

  const handleCreate = async (data) => {
    setCreateLoading(true);
    try {
      await onCreateField(data);
      toast.success("Champ créé avec succès");
      setIsFormOpen(false);
    } catch {
      // Error handled by hook
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setUpdateLoading(true);
    try {
      await onUpdateField(editingField.id, data);
      toast.success("Champ modifié avec succès");
      setEditingField(null);
    } catch {
      // Error handled by hook
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDeleteField(deletingField.id);
      toast.success("Champ supprimé");
      setDeletingField(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleToggle = async (field) => {
    try {
      // ClientCustomFieldInput exige name et fieldType ; nettoyer __typename des options
      const cleanedOptions =
        field.options?.map(({ __typename, ...opt }) => opt) || [];
      await onUpdateField(field.id, {
        name: field.name,
        fieldType: field.fieldType,
        options: cleanedOptions,
        isActive: !field.isActive,
      });
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Settings2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h4 className="mt-4 text-lg font-medium">Aucun champ personnalisé</h4>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Créez des champs personnalisés pour enrichir vos fiches clients avec
            des informations spécifiques à votre activité.
          </p>
          <Button
            className="mt-4"
            onClick={() => setIsFormOpen(true)}
            disabled={isLimitReached}
          >
            <Plus className="mr-2 h-4 w-4" />
            Créer un champ
          </Button>
          {isLimitReached && (
            <p className="mt-2 text-sm text-amber-600">
              Limite atteinte ({fields.length}/{customFieldsLimit} champs).
              Passez au plan {nextPlanName} pour plus de champs personnalisés.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {fields.length} champ{fields.length > 1 ? "s" : ""}
              {customFieldsLimit !== -1 && ` / ${customFieldsLimit}`}
            </p>
            <Button
              size="sm"
              onClick={() => setIsFormOpen(true)}
              disabled={isLimitReached}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau champ
            </Button>
          </div>
          {isLimitReached && (
            <p className="text-sm text-amber-600">
              Limite atteinte ({fields.length}/{customFieldsLimit} champs).
              Passez au plan {nextPlanName} pour plus de champs personnalisés.
            </p>
          )}
          <div className="space-y-2">
            {fields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                onEdit={setEditingField}
                onDelete={setDeletingField}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </>
      )}

      {/* Dialog de création */}
      <FieldFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleCreate}
        isLoading={createLoading}
      />

      {/* Dialog de modification */}
      <FieldFormDialog
        open={!!editingField}
        onOpenChange={(open) => !open && setEditingField(null)}
        field={editingField}
        onSave={handleUpdate}
        isLoading={updateLoading}
      />

      {/* Dialog de suppression */}
      <AlertDialog
        open={!!deletingField}
        onOpenChange={(open) => !open && setDeletingField(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le champ</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le champ &quot;
              {deletingField?.name}&quot; ? Les données associées à ce champ
              seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
