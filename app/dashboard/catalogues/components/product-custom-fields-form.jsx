"use client";

import { useState } from "react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useProductCustomFields } from "@/src/hooks/useProductCustomFields";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Type,
  Loader2,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

function CustomFieldInput({ field, value, onChange }) {
  const handleChange = (newValue) => {
    onChange(field.id, newValue);
  };

  switch (field.fieldType) {
    case "TEXT":
    case "URL":
    case "EMAIL":
    case "PHONE":
      return (
        <Input
          type={field.fieldType === "EMAIL" ? "email" : field.fieldType === "URL" ? "url" : "text"}
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder || field.name}
        />
      );

    case "TEXTAREA":
      return (
        <Textarea
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder || field.name}
          className="min-h-[60px] resize-none"
        />
      );

    case "NUMBER":
      return (
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : "")}
          placeholder={field.placeholder || "0"}
        />
      );

    case "CHECKBOX":
      return (
        <div className="flex items-center gap-2 h-9">
          <Checkbox
            id={`pfield-${field.id}`}
            checked={value || false}
            onCheckedChange={handleChange}
          />
          <label htmlFor={`pfield-${field.id}`} className="text-sm cursor-pointer">
            {field.placeholder || "Oui"}
          </label>
        </div>
      );

    case "SELECT":
      return (
        <Select value={value || ""} onValueChange={handleChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={field.placeholder || "Sélectionnez..."} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "MULTISELECT":
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {selectedValues.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedValues.map((val) => {
                const option = field.options?.find((o) => o.value === val);
                return (
                  <Badge
                    key={val}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => handleChange(selectedValues.filter((v) => v !== val))}
                  >
                    {option?.label || val}
                    <span className="ml-1">×</span>
                  </Badge>
                );
              })}
            </div>
          )}
          <Select
            value=""
            onValueChange={(val) => {
              if (!selectedValues.includes(val)) {
                handleChange([...selectedValues, val]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Ajouter une option..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options
                ?.filter((o) => !selectedValues.includes(o.value))
                .map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "DATE":
      return (
        <Input
          type="date"
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
        />
      );

    default:
      return (
        <Input
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder || field.name}
        />
      );
  }
}

export default function ProductCustomFieldsForm({ values = {}, onChange }) {
  const { workspaceId } = useWorkspace();
  const { fields, loading } = useProductCustomFields(workspaceId);

  const activeFields = fields.filter((f) => f.isActive);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Chargement des champs...</span>
      </div>
    );
  }

  if (activeFields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4 pt-4 border-t">
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Champs personnalisés
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activeFields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label className="font-normal">
              {field.name}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <CustomFieldInput
              field={field}
              value={values[field.id]}
              onChange={onChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
