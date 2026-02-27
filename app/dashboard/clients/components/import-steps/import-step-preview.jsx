"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { CheckCircle2, XCircle, AlertCircle, SlidersHorizontal } from "lucide-react";
import {
  validateClientRow,
  detectDuplicateEmails,
} from "@/src/utils/client-import";

const MAX_DISPLAY_ROWS = 100;

// All possible columns for the preview table
const ALL_COLUMNS = [
  { key: "type", label: "Type", getValue: (c) => c.type === "INDIVIDUAL" ? "Particulier" : "Entreprise", badge: true },
  { key: "name", label: "Nom", getValue: (c) => c.name },
  { key: "firstName", label: "Prénom", getValue: (c) => c.firstName },
  { key: "lastName", label: "Nom de famille", getValue: (c) => c.lastName },
  { key: "email", label: "Email", getValue: (c) => c.email },
  { key: "phone", label: "Téléphone", getValue: (c) => c.contacts?.[0]?.phone },
  { key: "street", label: "Adresse", getValue: (c) => c.address?.street },
  { key: "city", label: "Ville", getValue: (c) => c.address?.city },
  { key: "postalCode", label: "Code postal", getValue: (c) => c.address?.postalCode },
  { key: "country", label: "Pays", getValue: (c) => c.address?.country },
  { key: "siret", label: "SIRET", getValue: (c) => c.siret },
  { key: "vatNumber", label: "N° TVA", getValue: (c) => c.vatNumber },
  { key: "isInternational", label: "International", getValue: (c) => c.isInternational ? "Oui" : "Non" },
];

// Map field definition keys to column keys
const FIELD_KEY_TO_COL_KEY = {
  type: "type",
  name: "name",
  firstName: "firstName",
  lastName: "lastName",
  email: "email",
  phone: "phone",
  street: "street",
  city: "city",
  postalCode: "postalCode",
  country: "country",
  siret: "siret",
  vatNumber: "vatNumber",
  isInternational: "isInternational",
};

function getDefaultVisibleColumns(mapping) {
  const visible = new Set(["name"]); // name always visible
  if (mapping) {
    Object.entries(mapping).forEach(([fieldKey, idx]) => {
      if (idx !== null && idx !== undefined && FIELD_KEY_TO_COL_KEY[fieldKey]) {
        visible.add(FIELD_KEY_TO_COL_KEY[fieldKey]);
      }
    });
  }
  // If nothing mapped besides name, show all
  if (visible.size <= 1) {
    ALL_COLUMNS.forEach((col) => visible.add(col.key));
  }
  return visible;
}

export default function ImportStepPreview({
  transformedClients,
  excludedRows,
  onExcludedRowsChange,
  mapping,
}) {
  const [visibleColumns, setVisibleColumns] = useState(() => getDefaultVisibleColumns(mapping));

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Don't allow removing the last column
        if (next.size <= 1) return next;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAll = () => {
    setVisibleColumns(new Set(ALL_COLUMNS.map((c) => c.key)));
  };

  const selectNone = () => {
    setVisibleColumns(new Set(["name"]));
  };

  const activeColumns = ALL_COLUMNS.filter((col) => visibleColumns.has(col.key));

  // Validate all rows
  const validationResults = useMemo(() => {
    return transformedClients.map((client, idx) => validateClientRow(client, idx));
  }, [transformedClients]);

  // Detect duplicates
  const duplicates = useMemo(() => {
    return detectDuplicateEmails(transformedClients);
  }, [transformedClients]);

  const duplicateRowSet = useMemo(() => {
    return new Set(duplicates.map((d) => d.rowIndex));
  }, [duplicates]);

  // Stats
  const totalRows = transformedClients.length;
  const validCount = validationResults.filter(
    (v, i) => v.valid && !excludedRows.has(i) && !duplicateRowSet.has(i)
  ).length;
  const errorCount = validationResults.filter((v) => !v.valid).length;
  const duplicateCount = duplicates.length;
  const excludedCount = excludedRows.size;

  const toggleRow = (idx) => {
    const next = new Set(excludedRows);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    onExcludedRowsChange(next);
  };

  const displayClients = transformedClients.slice(0, MAX_DISPLAY_ROWS);

  return (
    <div className="space-y-4">
      {/* Summary + column picker */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>
            <strong>{validCount}</strong> contact{validCount > 1 ? "s" : ""} valide{validCount > 1 ? "s" : ""}
          </span>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>
              <strong>{errorCount}</strong> erreur{errorCount > 1 ? "s" : ""}
            </span>
          </div>
        )}
        {duplicateCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>
              <strong>{duplicateCount}</strong> doublon{duplicateCount > 1 ? "s" : ""} email
            </span>
          </div>
        )}
        {excludedCount > 0 && (
          <div className="text-sm text-muted-foreground">
            ({excludedCount} exclu{excludedCount > 1 ? "s" : ""})
          </div>
        )}
        <div className="text-sm text-muted-foreground ml-auto flex items-center gap-2">
          sur {totalRows} ligne{totalRows > 1 ? "s" : ""}

          {/* Column picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Colonnes ({activeColumns.length})
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Colonnes visibles</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    Tout
                  </button>
                  <span className="text-[11px] text-muted-foreground">/</span>
                  <button
                    type="button"
                    onClick={selectNone}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    Aucun
                  </button>
                </div>
              </div>
              <div className="space-y-0.5">
                {ALL_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={visibleColumns.has(col.key)}
                      onCheckedChange={() => toggleColumn(col.key)}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {totalRows > MAX_DISPLAY_ROWS && (
        <p className="text-xs text-muted-foreground">
          Affichage des {MAX_DISPLAY_ROWS} premières lignes sur {totalRows}.
        </p>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-auto max-h-[calc(80vh-320px)]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="w-10 px-3 py-2 text-left"></th>
              <th className="w-8 px-1 py-2"></th>
              <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">
                #
              </th>
              {activeColumns.map((col) => (
                <th key={col.key} className="px-3 py-2 text-left font-medium text-xs text-muted-foreground whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {displayClients.map((client, idx) => {
              const validation = validationResults[idx];
              const isDuplicate = duplicateRowSet.has(idx);
              const isExcluded = excludedRows.has(idx);
              const hasError = !validation.valid || isDuplicate;

              return (
                <tr
                  key={idx}
                  className={`${isExcluded ? "opacity-40" : ""} ${
                    hasError && !isExcluded ? "bg-red-50/50 dark:bg-red-900/5" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <Checkbox
                      checked={!isExcluded}
                      onCheckedChange={() => toggleRow(idx)}
                    />
                  </td>
                  <td className="px-1 py-2">
                    {hasError ? (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {idx + 1}
                  </td>
                  {activeColumns.map((col) => {
                    const value = col.getValue(client);
                    const isEmailCol = col.key === "email";
                    const isNameCol = col.key === "name";

                    return (
                      <td key={col.key} className="px-3 py-2 truncate max-w-[180px]">
                        {col.badge ? (
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {value}
                          </Badge>
                        ) : isNameCol && !value ? (
                          <span className="text-red-500 text-xs">Manquant</span>
                        ) : (
                          <>
                            {isNameCol ? <span className="font-medium">{value}</span> : value}
                            {isEmailCol && isDuplicate && (
                              <Badge variant="outline" className="ml-1 text-[10px] text-amber-600 border-amber-300">
                                doublon
                              </Badge>
                            )}
                          </>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2">
                    {!validation.valid && (
                      <span className="text-xs text-red-500" title={validation.errors.join("\n")}>
                        {validation.errors.length} erreur{validation.errors.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
