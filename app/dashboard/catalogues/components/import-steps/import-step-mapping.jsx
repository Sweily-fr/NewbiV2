"use client";

import { useState, useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/src/components/ui/select";
import {
  CheckCircle2,
  Plus,
  X,
  Loader2,
  ArrowRight,
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
} from "lucide-react";
import { FIELD_TYPES } from "@/src/hooks/useClientCustomFields";
import {
  PRODUCT_FIELD_DEFINITIONS,
  PRODUCT_FIELD_GROUPS,
} from "@/src/utils/product-import-v2";
import { toast } from "@/src/components/ui/sonner";

const SKIP_VALUE = "__skip__";

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
    <div className="space-y-2">
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

function NewFieldForm({ defaultName, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: defaultName || "",
    fieldType: "TEXT",
    options: [],
    isRequired: false,
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
    });
  };

  return (
    <div className="space-y-3 py-2 border-t pt-4">
      <div className="flex items-center gap-2 mb-2">
        <FieldTypeIcon type={formData.fieldType} className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Nouveau champ</span>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Nom du champ</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Fournisseur, Stock..."
            className="h-9"
            autoFocus
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Type de champ</Label>
          <Select
            value={formData.fieldType}
            onValueChange={(value) => setFormData({ ...formData, fieldType: value, options: [] })}
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
        </div>

        {needsOptions && (
          <OptionEditor
            options={formData.options}
            onChange={(options) => setFormData({ ...formData, options })}
          />
        )}

        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="newFieldRequired"
            checked={formData.isRequired}
            onCheckedChange={(checked) => setFormData({ ...formData, isRequired: !!checked })}
          />
          <label htmlFor="newFieldRequired" className="text-sm cursor-pointer">
            Champ obligatoire
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button size="sm" onClick={handleSave} className="flex-1">
          Créer le champ
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

export default function ImportStepMapping({
  headers,
  firstRow,
  mapping,
  onMappingChange,
  customFieldMappings = [],
  onCustomFieldMappingsChange,
  onCreateCustomField,
  existingCustomFields = [],
}) {
  const [creatingForIndex, setCreatingForIndex] = useState(null);
  const [showFormForIndex, setShowFormForIndex] = useState(null);

  // Which header indices are already used
  const usedIndices = useMemo(() => {
    const used = new Set();
    Object.values(mapping).forEach((idx) => {
      if (idx !== null && idx !== undefined) used.add(idx);
    });
    customFieldMappings.forEach((cfm) => {
      if (cfm.headerIndex !== null && cfm.headerIndex !== undefined) used.add(cfm.headerIndex);
    });
    return used;
  }, [mapping, customFieldMappings]);

  // Headers not mapped to any standard field or custom field
  const unmappedHeaders = useMemo(() => {
    return headers
      .map((h, i) => ({ header: h, index: i }))
      .filter(({ index }) => !usedIndices.has(index));
  }, [headers, usedIndices]);

  // Count mapped standard fields
  const mappedCount = useMemo(() => {
    return Object.values(mapping).filter((v) => v !== null && v !== undefined).length;
  }, [mapping]);

  // Available existing custom fields not yet used in mappings
  const availableExistingCustomFields = useMemo(() => {
    const usedFieldIds = new Set(customFieldMappings.map((cfm) => cfm.fieldId));
    return existingCustomFields.filter((f) => !usedFieldIds.has(f.id));
  }, [existingCustomFields, customFieldMappings]);

  const handleFieldMappingChange = (fieldKey, value) => {
    const newMapping = { ...mapping };
    if (value === SKIP_VALUE) {
      newMapping[fieldKey] = null;
    } else {
      newMapping[fieldKey] = parseInt(value, 10);
    }
    onMappingChange(newMapping);
  };

  // Options for standard field selects
  const getSelectOptions = (currentSelectedIndex) => {
    return headers.map((header, idx) => {
      const isUsedElsewhere = usedIndices.has(idx) && currentSelectedIndex !== idx;
      return { header, idx, disabled: isUsedElsewhere };
    });
  };

  // Handle column action: map to existing custom field or show creation form
  const handleColumnAction = (headerIndex, value) => {
    if (value === SKIP_VALUE) return;

    if (value === "__create__") {
      setShowFormForIndex(headerIndex);
    } else {
      // Map to existing custom field
      const field = existingCustomFields.find((f) => f.id === value);
      if (field) {
        onCustomFieldMappingsChange([
          ...customFieldMappings,
          { headerIndex, fieldId: field.id, fieldName: field.name },
        ]);
      }
    }
  };

  // Create field from form data
  const handleCreateFieldFromForm = async (headerIndex, formData) => {
    setCreatingForIndex(headerIndex);
    setShowFormForIndex(null);
    try {
      const field = await onCreateCustomField(formData);
      if (field) {
        onCustomFieldMappingsChange([
          ...customFieldMappings,
          { headerIndex, fieldId: field.id, fieldName: field.name },
        ]);
      }
    } catch {
      // Error handled by hook
    } finally {
      setCreatingForIndex(null);
    }
  };

  const handleRemoveCustomFieldMapping = (headerIndex) => {
    onCustomFieldMappingsChange(
      customFieldMappings.filter((cfm) => cfm.headerIndex !== headerIndex)
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* ═══ LEFT: Standard fields mapping ═══ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Champs détectés</h3>
          <Badge variant="secondary" className="text-xs font-normal">
            {mappedCount} / {PRODUCT_FIELD_DEFINITIONS.length}
          </Badge>
        </div>

        <div className="space-y-4 overflow-auto max-h-[calc(80vh-280px)] pr-1">
          {PRODUCT_FIELD_GROUPS.map((group) => {
            const fields = PRODUCT_FIELD_DEFINITIONS.filter((f) => f.group === group.key);
            return (
              <div key={group.key} className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {group.label}
                </span>
                {fields.map((field) => {
                  const selectedIndex = mapping[field.key];
                  const isMapped = selectedIndex !== null && selectedIndex !== undefined;

                  return (
                    <div
                      key={field.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        isMapped
                          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10"
                          : "border-dashed border-muted-foreground/20"
                      }`}
                    >
                      {isMapped ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/20 flex-shrink-0" />
                      )}

                      <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                        <span className="text-sm font-medium truncate">{field.label}</span>
                        {field.required && (
                          <span className="text-red-500 text-xs">*</span>
                        )}
                      </div>

                      <div className="flex-1 flex items-center justify-end min-w-0">
                        <Select
                          value={isMapped ? String(selectedIndex) : SKIP_VALUE}
                          onValueChange={(v) => handleFieldMappingChange(field.key, v)}
                        >
                          <SelectTrigger className="h-7 text-xs w-full max-w-[200px] cursor-pointer">
                            <SelectValue placeholder="-- Ignorer --" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SKIP_VALUE}>-- Ignorer --</SelectItem>
                            <SelectSeparator />
                            {getSelectOptions(selectedIndex).map(({ header, idx, disabled }) => (
                              <SelectItem key={idx} value={String(idx)} disabled={disabled}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ RIGHT: Extra file columns ═══ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Colonnes supplémentaires</h3>
          <Badge variant="secondary" className="text-xs font-normal">
            {unmappedHeaders.length + customFieldMappings.length} colonne{(unmappedHeaders.length + customFieldMappings.length) > 1 ? "s" : ""}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Colonnes du fichier non reconnues. Mappez-les à un champ personnalisé existant ou créez-en un nouveau.
        </p>

        <div className="space-y-2 overflow-auto max-h-[calc(80vh-320px)] pr-1">
          {/* Already mapped to custom fields */}
          {customFieldMappings.map((cfm) => (
            <div
              key={cfm.headerIndex}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{headers[cfm.headerIndex]}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                    {cfm.fieldName}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-red-500"
                onClick={() => handleRemoveCustomFieldMapping(cfm.headerIndex)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {/* Unmapped columns */}
          {unmappedHeaders.map(({ header, index }) => {
            const isCreating = creatingForIndex === index;
            const isShowingForm = showFormForIndex === index;

            if (isShowingForm) {
              return (
                <NewFieldForm
                  key={index}
                  defaultName={header}
                  onSave={(formData) => handleCreateFieldFromForm(index, formData)}
                  onCancel={() => setShowFormForIndex(null)}
                />
              );
            }

            return (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-muted-foreground/20"
              >
                <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/20 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm truncate block">{header}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isCreating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <Select onValueChange={(v) => handleColumnAction(index, v)}>
                      <SelectTrigger className="h-7 text-xs w-auto min-w-[160px]">
                        <SelectValue placeholder="Choisir un champ..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__create__">
                          <span className="flex items-center gap-1">
                            <Plus className="h-3 w-3" />
                            Créer un champ
                          </span>
                        </SelectItem>
                        {availableExistingCustomFields.length > 0 && (
                          <>
                            <SelectSeparator />
                            {availableExistingCustomFields.map((cf) => (
                              <SelectItem key={cf.id} value={cf.id}>
                                {cf.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {unmappedHeaders.length === 0 && customFieldMappings.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Toutes les colonnes correspondent à des champs standards.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
