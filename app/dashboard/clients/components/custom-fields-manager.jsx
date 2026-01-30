"use client";

import { useState } from "react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  useClientCustomFields,
  useCreateClientCustomField,
  useUpdateClientCustomField,
  useDeleteClientCustomField,
  FIELD_TYPES,
} from "@/src/hooks/useClientCustomFields";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { toast } from "@/src/components/ui/sonner";
import {
  Plus,
  Trash2,
  Edit2,
  GripVertical,
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
  const [newOption, setNewOption] = useState({ label: "", value: "", color: "#6b7280" });

  const addOption = () => {
    if (!newOption.label.trim()) return;
    const value = newOption.value.trim() || newOption.label.trim().toLowerCase().replace(/\s+/g, "_");
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
          onChange={(e) => setNewOption({ ...newOption, color: e.target.value })}
          className="w-8 h-8 rounded border cursor-pointer"
        />
        <Input
          value={newOption.label}
          onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
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
    name: field?.name || "",
    fieldType: field?.fieldType || "TEXT",
    description: field?.description || "",
    placeholder: field?.placeholder || "",
    isRequired: field?.isRequired || false,
    options: field?.options || [],
  });

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le champ" : "Nouveau champ personnalisé"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les propriétés du champ personnalisé"
              : "Créez un nouveau champ pour vos fiches clients"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du champ *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Date anniversaire, Source, Réseaux sociaux..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fieldType">Type de champ *</Label>
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
            <Label htmlFor="placeholder">Placeholder (optionnel)</Label>
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
            <Label htmlFor="description">Description (optionnel)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Description du champ pour les utilisateurs"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Champ obligatoire</Label>
              <p className="text-sm text-muted-foreground">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({ field, onEdit, onDelete, onToggle }) {
  const fieldType = FIELD_TYPES.find((t) => t.value === field.fieldType);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="cursor-grab text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
        <FieldTypeIcon type={field.fieldType} className="h-4 w-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{field.name}</span>
          {field.isRequired && (
            <Badge variant="secondary" className="text-xs">
              Requis
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {fieldType?.label}
          {field.description && ` • ${field.description}`}
        </p>
      </div>

      <Switch
        checked={field.isActive}
        onCheckedChange={() => onToggle(field)}
        className="data-[state=checked]:bg-[#5b50ff]"
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(field)}
        className="h-8 w-8"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(field)}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function CustomFieldsManager() {
  const { workspaceId } = useWorkspace();
  const { fields, loading, refetch } = useClientCustomFields(workspaceId);
  const { createField, loading: createLoading } = useCreateClientCustomField();
  const { updateField, loading: updateLoading } = useUpdateClientCustomField();
  const { deleteField, loading: deleteLoading } = useDeleteClientCustomField();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [deletingField, setDeletingField] = useState(null);

  const handleCreate = async (data) => {
    try {
      await createField(workspaceId, data);
      toast.success("Champ créé avec succès");
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateField(workspaceId, editingField.id, data);
      toast.success("Champ modifié avec succès");
      setEditingField(null);
      refetch();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    try {
      await deleteField(workspaceId, deletingField.id);
      toast.success("Champ supprimé");
      setDeletingField(null);
      refetch();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleToggle = async (field) => {
    try {
      await updateField(workspaceId, field.id, { isActive: !field.isActive });
      refetch();
    } catch (error) {
      // Error handled by hook
    }
  };

  if (loading && fields.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Champs personnalisés</h3>
          <p className="text-sm text-muted-foreground">
            Ajoutez des champs personnalisés à vos fiches clients
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau champ
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Settings2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h4 className="mt-4 text-lg font-medium">Aucun champ personnalisé</h4>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Créez des champs personnalisés pour enrichir vos fiches clients avec
            des informations spécifiques à votre activité.
          </p>
          <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Créer un champ
          </Button>
        </div>
      ) : (
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
              Êtes-vous sûr de vouloir supprimer le champ "{deletingField?.name}"
              ? Les données associées à ce champ seront perdues.
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
