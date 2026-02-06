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
import { Checkbox } from "@/src/components/ui/checkbox";
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
  Pencil,
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

function FieldRow({ field, onDelete, onToggle, onEdit }) {
  const fieldType = FIELD_TYPES.find((t) => t.value === field.fieldType);

  return (
    <div className="flex items-center gap-2 py-2">
      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 flex-shrink-0">
        <FieldTypeIcon type={field.fieldType} className="h-3.5 w-3.5 text-primary" />
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(field)}>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{field.name}</span>
          {field.isRequired && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">
              Requis
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {fieldType?.label}
          {field.options?.length > 0 && ` • ${field.options.length} option${field.options.length > 1 ? "s" : ""}`}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(field);
        }}
        className="h-7 w-7 text-muted-foreground hover:text-primary flex-shrink-0"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      <Switch
        checked={field.isActive}
        onCheckedChange={() => onToggle(field)}
        className="data-[state=checked]:bg-[#5b50ff] flex-shrink-0"
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(field);
        }}
        className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function OptionEditor({ options = [], onChange }) {
  const [newOption, setNewOption] = useState("");

  const addOption = () => {
    if (!newOption.trim()) return;
    const value = newOption.trim().toLowerCase().replace(/\s+/g, "_");
    onChange([...options, { label: newOption.trim(), value, color: "#6b7280" }]);
    setNewOption("");
  };

  const removeOption = (index) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2 mt-2">
      <Label className="text-xs text-muted-foreground">Options</Label>
      <div className="space-y-1">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: option.color || "#6b7280" }}
            />
            <span className="text-sm flex-1 truncate">{option.label}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeOption(index)}
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          placeholder="Nouvelle option..."
          className="flex-1 h-8 text-sm"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
        />
        <Button variant="outline" size="sm" onClick={addOption} className="h-8">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function FieldForm({ field, onSave, onCancel, isEditing = false }) {
  const [formData, setFormData] = useState({
    name: field?.name || "",
    fieldType: field?.fieldType || "TEXT",
    options: field?.options || [],
    isRequired: field?.isRequired || false,
  });

  const needsOptions = ["SELECT", "MULTISELECT"].includes(formData.fieldType);

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Le nom du champ est requis");
      return;
    }
    if (needsOptions && formData.options.length === 0) {
      toast.error("Ajoutez au moins une option");
      return;
    }
    onSave({
      name: formData.name.trim(),
      fieldType: formData.fieldType,
      options: needsOptions ? formData.options : [],
      isRequired: formData.isRequired,
      isActive: field?.isActive ?? true,
    });
  };

  return (
    <div className="space-y-3 py-2 border-t pt-4">
      <div className="flex items-center gap-2 mb-2">
        <FieldTypeIcon type={formData.fieldType} className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {isEditing ? "Modifier le champ" : "Nouveau champ"}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Nom du champ</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Date d'anniversaire, Source..."
            className="h-9"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Type de champ</Label>
          <Select
            value={formData.fieldType}
            onValueChange={(value) => setFormData({ ...formData, fieldType: value, options: [] })}
            disabled={isEditing}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              {FIELD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <FieldTypeIcon type={type.value} className="h-3.5 w-3.5" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isEditing && (
            <p className="text-xs text-muted-foreground mt-1">
              Le type ne peut pas être modifié après création
            </p>
          )}
        </div>

        {needsOptions && (
          <OptionEditor
            options={formData.options}
            onChange={(options) => setFormData({ ...formData, options })}
          />
        )}

        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="isRequired"
            checked={formData.isRequired}
            onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
          />
          <label htmlFor="isRequired" className="text-sm cursor-pointer">
            Champ obligatoire
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button size="sm" onClick={handleSave} className="flex-1">
          {isEditing ? "Enregistrer" : "Créer le champ"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

export default function CustomFieldsPopover({ trigger }) {
  const { workspaceId } = useWorkspace();
  const { fields, loading, refetch } = useClientCustomFields(workspaceId);
  const { createField } = useCreateClientCustomField();
  const { updateField } = useUpdateClientCustomField();
  const { deleteField } = useDeleteClientCustomField();

  const [isOpen, setIsOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [deletingField, setDeletingField] = useState(null);

  const handleCreate = async (input) => {
    setShowNewForm(false);
    try {
      await createField(workspaceId, input);
      refetch();
      toast.success("Champ créé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleUpdate = async (input) => {
    const fieldId = editingField.id;
    setEditingField(null);
    try {
      // Nettoyer les options pour retirer __typename ajouté par Apollo
      const cleanedInput = {
        ...input,
        options: input.options?.map(({ __typename, ...opt }) => opt) || [],
      };
      await updateField(workspaceId, fieldId, cleanedInput);
      refetch();
      toast.success("Champ modifié avec succès");
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDelete = async () => {
    setDeletingField(null);
    try {
      await deleteField(workspaceId, deletingField.id);
      refetch();
      toast.success("Champ supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggle = async (field) => {
    try {
      // Nettoyer les options pour retirer __typename ajouté par Apollo
      const cleanedOptions = field.options?.map(({ __typename, ...opt }) => opt) || [];
      await updateField(workspaceId, field.id, { 
        name: field.name,
        fieldType: field.fieldType,
        options: cleanedOptions,
        isActive: !field.isActive 
      });
      refetch();
    } catch (error) {
      toast.error("Erreur lors du basculement");
      refetch();
    }
  };

  const handleEdit = (field) => {
    setShowNewForm(false);
    setEditingField(field);
  };

  const isLoading = loading && fields.length === 0;
  const activeCount = fields.filter((f) => f.isActive).length;

  return (
    <>
      <Popover open={isOpen || !!deletingField} onOpenChange={(open) => {
        if (!deletingField) {
          setIsOpen(open);
        }
      }}>
        <PopoverTrigger asChild>
          {trigger || (
            <Button
              variant="outline"
              className="font-normal"
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Personnalisé
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[500px] p-0">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <h4 className="font-medium">Champs personnalisés</h4>
              </div>
              {activeCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeCount} actif{activeCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez des informations personnalisées à vos contacts
            </p>
          </div>

          <div className="p-4 space-y-1 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : editingField ? (
              <FieldForm
                field={editingField}
                onSave={handleUpdate}
                onCancel={() => setEditingField(null)}
                isEditing={true}
              />
            ) : showNewForm ? (
              <FieldForm
                onSave={handleCreate}
                onCancel={() => setShowNewForm(false)}
                isEditing={false}
              />
            ) : fields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucun champ personnalisé. Cliquez sur "Ajouter" pour commencer.
              </p>
            ) : (
              <>
                {fields.map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    onDelete={setDeletingField}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                  />
                ))}
              </>
            )}
          </div>

          <div className="p-4 border-t">
            {!showNewForm && !editingField && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingField(null);
                  setShowNewForm(true);
                }}
                className="w-full justify-start text-muted-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un champ
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={!!deletingField} onOpenChange={() => setDeletingField(null)}>
        <AlertDialogContent className="z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le champ</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le champ "{deletingField?.name}" ?
              Les données associées seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
