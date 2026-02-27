"use client";

import { useState, useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/src/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { CheckCircle2, Plus, X, Loader2, ArrowRight } from "lucide-react";
import {
  CLIENT_FIELD_DEFINITIONS,
  FIELD_GROUPS,
} from "@/src/utils/client-import";

const SKIP_VALUE = "__skip__";
const NEW_FIELD_PREFIX = "__new__";

export default function ImportStepMapping({
  headers,
  firstRow,
  mapping,
  onMappingChange,
  customFieldMappings,
  onCustomFieldMappingsChange,
  onCreateCustomField,
  existingCustomFields,
}) {
  const [creatingForIndex, setCreatingForIndex] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [newFieldName, setNewFieldName] = useState("");

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
    setEditingField(null);
  };

  // Options for standard field selects
  const getSelectOptions = (currentSelectedIndex) => {
    return headers.map((header, idx) => {
      const isUsedElsewhere = usedIndices.has(idx) && currentSelectedIndex !== idx;
      return { header, idx, disabled: isUsedElsewhere };
    });
  };

  // Handle column action from the right panel: map to existing custom field or create new
  const handleColumnAction = async (headerIndex, value) => {
    if (value === SKIP_VALUE) return;

    if (value.startsWith(NEW_FIELD_PREFIX)) {
      // Create new custom field with the column name
      setCreatingForIndex(headerIndex);
      try {
        const name = headers[headerIndex];
        const field = await onCreateCustomField(name);
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

  // Create new custom field with custom name for a column
  const handleCreateNamedField = async (headerIndex) => {
    if (!newFieldName.trim()) return;
    setCreatingForIndex(headerIndex);
    try {
      const field = await onCreateCustomField(newFieldName.trim());
      if (field) {
        onCustomFieldMappingsChange([
          ...customFieldMappings,
          { headerIndex, fieldId: field.id, fieldName: field.name },
        ]);
      }
      setNewFieldName("");
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
            {mappedCount} / {CLIENT_FIELD_DEFINITIONS.length}
          </Badge>
        </div>

        <div className="space-y-4 overflow-auto max-h-[calc(80vh-280px)] pr-1">
          {FIELD_GROUPS.map((group) => {
            const fields = CLIENT_FIELD_DEFINITIONS.filter((f) => f.group === group.key);
            return (
              <div key={group.key} className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {group.label}
                </span>
                {fields.map((field) => {
                  const selectedIndex = mapping[field.key];
                  const isMapped = selectedIndex !== null && selectedIndex !== undefined;
                  const matchedHeader = isMapped ? headers[selectedIndex] : null;
                  const previewValue = isMapped && firstRow ? firstRow[selectedIndex] || "" : "";
                  const isEditing = editingField === field.key;

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

                      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                        {isEditing ? (
                          <Select
                            value={isMapped ? String(selectedIndex) : SKIP_VALUE}
                            onValueChange={(v) => handleFieldMappingChange(field.key, v)}
                            open={true}
                            onOpenChange={(open) => { if (!open) setEditingField(null); }}
                          >
                            <SelectTrigger className="h-7 text-xs w-full max-w-[200px]">
                              <SelectValue />
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
                        ) : isMapped ? (
                          <button
                            type="button"
                            onClick={() => setEditingField(field.key)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer truncate"
                            title="Cliquer pour modifier"
                          >
                            <ArrowRight className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate font-medium text-foreground">{matchedHeader}</span>
                            {previewValue && (
                              <span className="text-muted-foreground truncate max-w-[80px]">
                                ({previewValue})
                              </span>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingField(field.key)}
                            className="text-xs text-primary hover:underline cursor-pointer"
                          >
                            Mapper
                          </button>
                        )}
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
                {firstRow?.[cfm.headerIndex] && (
                  <span className="text-[11px] text-muted-foreground">
                    ex: {firstRow[cfm.headerIndex]}
                  </span>
                )}
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
            return (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-muted-foreground/20"
              >
                <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/20 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm truncate block">{header}</span>
                  {firstRow?.[index] && (
                    <span className="text-[11px] text-muted-foreground">
                      ex: {firstRow[index]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isCreating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      {/* Select: map to existing custom field or create new */}
                      <Select onValueChange={(v) => handleColumnAction(index, v)}>
                        <SelectTrigger className="h-7 text-xs w-auto min-w-[160px]">
                          <SelectValue placeholder="Choisir un champ..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={`${NEW_FIELD_PREFIX}${index}`}>
                            <span className="flex items-center gap-1">
                              <Plus className="h-3 w-3" />
                              Créer &quot;{header}&quot;
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

                      {/* Or create with custom name */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Créer avec un nom personnalisé">
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-60 p-3">
                          <div className="space-y-2">
                            <span className="text-xs font-medium">Nom du champ personnalisé</span>
                            <Input
                              value={newFieldName}
                              onChange={(e) => setNewFieldName(e.target.value)}
                              placeholder={header}
                              className="h-8 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateNamedField(index);
                              }}
                            />
                            <Button
                              size="sm"
                              className="w-full h-8"
                              disabled={!newFieldName.trim()}
                              onClick={() => handleCreateNamedField(index)}
                            >
                              Créer
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </>
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
