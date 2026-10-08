"use client";

import { Checkbox } from "@/src/components/ui/checkbox";
import { cn } from "@/src/lib/utils";

/**
 * Tableau des droits d'un rôle : une ligne par page (rangées comme le menu),
 * les fonctionnalités d'une page en sous-lignes, et trois colonnes à cocher.
 * Les colonnes sont cumulatives : « Supprimer » coche « Modifier » et
 * « Voir », décocher « Voir » décoche tout (aucun accès = page masquée).
 * Le niveau stocké reste none < read < write < delete (grille de l'API).
 */

const COLUMNS = [
  { level: "read", label: "Voir" },
  { level: "write", label: "Modifier" },
  { level: "delete", label: "Supprimer" },
];

const RANK = { none: 0, read: 1, write: 2, delete: 3 };

function isApplicable(module, level) {
  return module.levels.includes(level);
}

function isChecked(value, level) {
  return (RANK[value] ?? 0) >= RANK[level];
}

/** Niveau après avoir coché ou décoché une colonne. */
export function toggledLevel(module, current, level, checked) {
  if (checked) {
    return RANK[level] > (RANK[current] ?? 0) ? level : current;
  }
  // Décocher une colonne retire aussi les colonnes à sa droite
  const below = module.levels.filter((l) => RANK[l] < RANK[level]);
  return below[below.length - 1] || "none";
}

/** État d'une colonne pour un groupe de lignes (case du groupe). */
export function groupState(modules, levels, level) {
  const applicable = modules.filter((m) => isApplicable(m, level));
  if (!applicable.length) return null;
  const checked = applicable.filter((m) =>
    isChecked(levels[m.key], level),
  ).length;
  if (checked === 0) return false;
  return checked === applicable.length ? true : "indeterminate";
}

function CellCheckbox({ module, value, level, disabled, onChange }) {
  if (!isApplicable(module, level)) {
    return <span className="text-xs text-muted-foreground/50">–</span>;
  }
  const label =
    module.group === "account" && level === "write"
      ? `Gérer : ${module.label}`
      : `${COLUMNS.find((c) => c.level === level).label} : ${module.label}`;
  return (
    <Checkbox
      aria-label={label}
      checked={isChecked(value, level)}
      disabled={disabled}
      onCheckedChange={(checked) =>
        onChange(toggledLevel(module, value, level, checked === true))
      }
      className="cursor-pointer data-[state=checked]:bg-[#5b4fff] data-[state=checked]:border-[#5b4fff]"
    />
  );
}

const GRID =
  "grid grid-cols-[minmax(0,1fr)_56px_64px_72px] items-center gap-x-2";

export function RolePermissionsTable({ catalog, levels, onChange, disabled }) {
  const setLevel = (key, level) => onChange({ ...levels, [key]: level });

  const setGroupColumn = (modules, level, checked) => {
    const next = { ...levels };
    for (const m of modules) {
      if (!isApplicable(m, level)) continue;
      next[m.key] = toggledLevel(m, next[m.key] || "none", level, checked);
    }
    onChange(next);
  };

  return (
    <div className="rounded-lg border border-border/60">
      {/* En-tête des colonnes */}
      <div
        className={cn(
          GRID,
          "sticky top-0 z-10 rounded-t-lg border-b border-border/60 bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground backdrop-blur",
        )}
      >
        <span>Page ou fonctionnalité</span>
        {COLUMNS.map((c) => (
          <span key={c.level} className="text-center">
            {c.label}
          </span>
        ))}
      </div>

      {catalog.groups.map((group) => {
        const modules = catalog.modules.filter((m) => m.group === group.key);
        if (!modules.length) return null;
        const pages = modules.filter((m) => !m.parent);
        return (
          <section
            key={group.key}
            className="border-b border-border/60 last:border-b-0"
          >
            {/* Ligne du groupe : coche ou décoche une colonne pour tout le groupe */}
            <div className={cn(GRID, "bg-muted/25 px-3 py-2")}>
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                {group.label}
              </span>
              {COLUMNS.map((c) => {
                const state = groupState(modules, levels, c.level);
                return (
                  <div key={c.level} className="flex justify-center">
                    {state === null ? (
                      <span className="text-xs text-muted-foreground/50">
                        –
                      </span>
                    ) : (
                      <Checkbox
                        aria-label={`${c.label} : toute la section ${group.label}`}
                        checked={state}
                        disabled={disabled}
                        onCheckedChange={() =>
                          setGroupColumn(modules, c.level, state !== true)
                        }
                        className="cursor-pointer data-[state=checked]:bg-[#5b4fff] data-[state=checked]:border-[#5b4fff] data-[state=indeterminate]:bg-[#5b4fff]/40 data-[state=indeterminate]:border-[#5b4fff]"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {pages.map((page) => {
              const children = modules.filter((m) => m.parent === page.key);
              const pageHidden = (levels[page.key] || "none") === "none";
              return (
                <div key={page.key} className="divide-y divide-border/40">
                  <PermissionRow
                    module={page}
                    value={levels[page.key] || "none"}
                    disabled={disabled}
                    onChange={(level) => setLevel(page.key, level)}
                  />
                  {children.map((child) => (
                    <PermissionRow
                      key={child.key}
                      module={child}
                      nested
                      // Page masquée : ses fonctionnalités sont inaccessibles
                      muted={pageHidden}
                      value={levels[child.key] || "none"}
                      disabled={disabled || pageHidden}
                      onChange={(level) => setLevel(child.key, level)}
                    />
                  ))}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

function PermissionRow({ module, value, nested, muted, disabled, onChange }) {
  return (
    <div
      className={cn(GRID, "px-3 py-2", nested && "pl-8", muted && "opacity-50")}
    >
      <div className="min-w-0">
        <p className={cn("text-sm", nested && "text-[13px]")}>{module.label}</p>
        {module.description && (
          <p className="text-xs text-muted-foreground">{module.description}</p>
        )}
      </div>
      {COLUMNS.map((c) => (
        <div key={c.level} className="flex justify-center">
          <CellCheckbox
            module={module}
            value={value}
            level={c.level}
            disabled={disabled}
            onChange={onChange}
          />
        </div>
      ))}
    </div>
  );
}
