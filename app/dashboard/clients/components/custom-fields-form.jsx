"use client";

import { useState } from "react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useClientCustomFields, FIELD_TYPES } from "@/src/hooks/useClientCustomFields";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Calendar as CalendarComponent } from "@/src/components/ui/calendar";
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
  Loader2,
  CalendarIcon,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

// Validations regex par type de champ
const FIELD_VALIDATIONS = {
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Format email invalide",
  },
  URL: {
    pattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    message: "Format URL invalide",
  },
  PHONE: {
    pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
    message: "Format téléphone invalide",
  },
};

function validateFieldValue(fieldType, value) {
  if (!value || value === "") return null;
  
  const validation = FIELD_VALIDATIONS[fieldType];
  if (!validation) return null;
  
  if (!validation.pattern.test(value)) {
    return validation.message;
  }
  return null;
}

function CustomFieldInput({ field, value, onChange, error, onValidationError }) {
  const handleChange = (newValue) => {
    onChange(field.id, newValue);
    
    // Valider en temps réel pour certains types
    const validationError = validateFieldValue(field.fieldType, newValue);
    if (onValidationError) {
      onValidationError(field.id, validationError);
    }
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
          className={cn(error && "border-red-500 focus:border-red-500")}
        />
      );

    case "TEXTAREA":
      return (
        <Textarea
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder || field.name}
          className={cn("min-h-[80px] resize-none", error && "border-red-500 focus:border-red-500")}
        />
      );

    case "NUMBER":
      return (
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : "")}
          placeholder={field.placeholder || "0"}
          className={cn(error && "border-red-500 focus:border-red-500")}
        />
      );

    case "DATE":
      const parseDateValue = (dateValue) => {
        if (!dateValue) return undefined;
        // Parser la date en local pour éviter le décalage UTC
        const [year, month, day] = dateValue.split("-").map(Number);
        if (!year || !month || !day) return undefined;
        return new Date(year, month - 1, day);
      };
      
      const formatDateToString = (date) => {
        // Formater la date en local (YYYY-MM-DD) sans conversion UTC
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const selectedDate = parseDateValue(value);
      
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start font-normal",
                !value && "text-muted-foreground",
                error && "border-red-500 focus:border-red-500"
              )}
            >
              {value
                ? format(selectedDate, "dd MMMM yyyy", { locale: fr })
                : field.placeholder || "Sélectionner une date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate}
              captionLayout="dropdown"
              onSelect={(date) => {
                if (date) {
                  handleChange(formatDateToString(date));
                } else {
                  handleChange("");
                }
              }}
            />
          </PopoverContent>
        </Popover>
      );

    case "CHECKBOX":
      return (
        <div className="flex items-center gap-2 h-9">
          <Checkbox
            id={`field-${field.id}`}
            checked={value || false}
            onCheckedChange={handleChange}
          />
          <label
            htmlFor={`field-${field.id}`}
            className="text-sm cursor-pointer"
          >
            {field.placeholder || "Oui"}
          </label>
        </div>
      );

    case "SELECT":
      return (
        <Select value={value || ""} onValueChange={handleChange}>
          <SelectTrigger className={cn("w-full", error && "border-red-500 focus:border-red-500")}>
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
            <SelectTrigger className={cn(error && "border-red-500 focus:border-red-500")}>
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

    default:
      return (
        <Input
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder || field.name}
          className={cn(error && "border-red-500 focus:border-red-500")}
        />
      );
  }
}

export default function CustomFieldsForm({ values = {}, onChange, errors = {}, onValidationError }) {
  const { workspaceId } = useWorkspace();
  const { fields, loading } = useClientCustomFields(workspaceId);
  const [localErrors, setLocalErrors] = useState({});

  // Filtrer uniquement les champs actifs
  const activeFields = fields.filter((f) => f.isActive);

  // Gérer les erreurs de validation locales
  const handleValidationError = (fieldId, error) => {
    setLocalErrors((prev) => {
      if (error) {
        return { ...prev, [fieldId]: error };
      } else {
        const { [fieldId]: _, ...rest } = prev;
        return rest;
      }
    });
    if (onValidationError) {
      onValidationError(fieldId, error);
    }
  };

  // Combiner les erreurs externes et locales
  const allErrors = { ...errors, ...localErrors };

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
    <div className="space-y-4 mt-6 pt-4 border-t col-span-2">
      <div className="flex items-center gap-2 pb-2">
        <FieldTypeIcon type="TEXT" className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Champs personnalisés
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
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
              error={allErrors[field.id]}
              onValidationError={handleValidationError}
            />
            {allErrors[field.id] && (
              <p className="text-sm text-red-500">{allErrors[field.id]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { CustomFieldInput, FIELD_TYPE_ICONS };
