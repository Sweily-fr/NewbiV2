"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Checkbox } from "@/src/components/ui/checkbox";
import { cn } from "@/src/lib/utils";

/**
 * Droits d'un rôle en menus déroulants : une section par partie du menu
 * (Pilotage, Ventes…), une ligne dépliable par page, et dans chaque page une
 * case par action (voir, créer, modifier, supprimer, envoyer…), cochées
 * indépendamment. Règles (les mêmes que l'API) :
 *   - cocher une action coche « Voir » (et « Voir » de la page parente pour
 *     une partie de page, ex. Avoirs dans Factures clients) ;
 *   - décocher « Voir » retire tout l'accès à la page et à ses parties :
 *     la page n'apparaît plus du tout.
 */

const CHECKBOX_CLASS =
  "cursor-pointer data-[state=checked]:bg-[#5b4fff] data-[state=checked]:border-[#5b4fff] data-[state=indeterminate]:bg-[#5b4fff]/40 data-[state=indeterminate]:border-[#5b4fff]";

function moduleByKey(catalog, key) {
  return catalog.modules.find((m) => m.key === key);
}

/** Modules couverts par une page : elle-même et ses parties. */
export function pageModules(catalog, pageKey) {
  return catalog.modules.filter(
    (m) => m.key === pageKey || m.parent === pageKey,
  );
}

/** Coche ou décoche une action, en appliquant les dépendances. */
export function toggleAction(catalog, grid, moduleKey, actionKey, checked) {
  const next = { ...grid };
  const module = moduleByKey(catalog, moduleKey);
  const current = new Set(next[moduleKey] || []);
  if (checked) {
    current.add(actionKey);
    current.add("view");
    // Une partie de page n'existe pas sans sa page
    if (module?.parent) {
      next[module.parent] = Array.from(
        new Set([...(next[module.parent] || []), "view"]),
      );
    }
  } else if (actionKey === "view") {
    current.clear();
    for (const child of catalog.modules.filter((m) => m.parent === moduleKey)) {
      next[child.key] = [];
    }
  } else {
    current.delete(actionKey);
  }
  // Ordre du catalogue
  next[moduleKey] = (module?.actions || [])
    .map((a) => a.key)
    .filter((key) => current.has(key));
  return next;
}

/** Tout cocher ou tout décocher pour une liste de modules. */
export function setModulesAll(catalog, grid, moduleKeys, checked) {
  const next = { ...grid };
  for (const key of moduleKeys) {
    const module = moduleByKey(catalog, key);
    next[key] = checked ? (module?.actions || []).map((a) => a.key) : [];
  }
  return next;
}

/** État d'une case regroupant plusieurs modules : true, false ou partiel. */
export function groupCheckState(catalog, grid, moduleKeys) {
  let total = 0;
  let checked = 0;
  for (const key of moduleKeys) {
    total += moduleByKey(catalog, key)?.actions.length || 0;
    checked += (grid[key] || []).length;
  }
  if (checked === 0) return false;
  return checked >= total ? true : "indeterminate";
}

/** Résumé d'une page pour sa ligne repliée. */
export function pageSummary(catalog, grid, pageKey) {
  if (!(grid[pageKey] || []).includes("view")) return "Aucun accès";
  const modules = pageModules(catalog, pageKey);
  const total = modules.reduce((n, m) => n + m.actions.length, 0);
  const count = modules.reduce((n, m) => n + (grid[m.key] || []).length, 0);
  if (count === total) return "Tous les droits";
  if (count === 1) return "Lecture seule";
  return `${count} droits sur ${total}`;
}

function Chevron({ open }) {
  return (
    <ChevronRight
      className={cn(
        "size-4 shrink-0 text-muted-foreground transition-transform",
        open && "rotate-90",
      )}
    />
  );
}

function ActionGrid({ module, grid, disabled, onToggle }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-2">
      {module.actions.map((action) => {
        const id = `perm-${module.key}-${action.key}`;
        return (
          <label
            key={action.key}
            htmlFor={id}
            className={cn(
              "flex items-start gap-2.5 rounded-md px-2 py-1.5 text-sm",
              !disabled && "cursor-pointer hover:bg-muted/50",
            )}
          >
            <Checkbox
              id={id}
              checked={(grid[module.key] || []).includes(action.key)}
              disabled={disabled}
              onCheckedChange={(value) =>
                onToggle(module.key, action.key, value === true)
              }
              className={cn("mt-0.5", CHECKBOX_CLASS)}
            />
            <span className="leading-5">
              {action.label}
              {action.description && (
                <span className="block text-xs text-muted-foreground">
                  {action.description}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function RolePermissionsTable({ catalog, actions, onChange, disabled }) {
  // Sections et pages dépliées : tout est replié au départ
  const [openKeys, setOpenKeys] = useState(() => new Set());
  const toggleOpen = (key) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const onToggle = (moduleKey, actionKey, checked) =>
    onChange(toggleAction(catalog, actions, moduleKey, actionKey, checked));

  return (
    <div className="space-y-2">
      {catalog.groups.map((group) => {
        const modules = catalog.modules.filter((m) => m.group === group.key);
        if (!modules.length) return null;
        const pages = modules.filter((m) => !m.parent);
        const groupKeys = modules.map((m) => m.key);
        const groupState = groupCheckState(catalog, actions, groupKeys);
        const groupOpen = openKeys.has(`group:${group.key}`);
        const visiblePages = pages.filter((p) =>
          (actions[p.key] || []).includes("view"),
        ).length;
        return (
          <section
            key={group.key}
            className="rounded-lg border border-border/60"
          >
            {/* En-tête de section : déplie les pages, case « tout » */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <button
                type="button"
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                aria-expanded={groupOpen}
                onClick={() => toggleOpen(`group:${group.key}`)}
              >
                <Chevron open={groupOpen} />
                <span className="text-sm font-medium">{group.label}</span>
                <span className="text-xs text-muted-foreground">
                  {visiblePages === 0
                    ? "Aucune page"
                    : `${visiblePages} page${visiblePages > 1 ? "s" : ""} sur ${pages.length}`}
                </span>
              </button>
              <Checkbox
                aria-label={`Tous les droits : ${group.label}`}
                checked={groupState}
                disabled={disabled}
                onCheckedChange={() =>
                  onChange(
                    setModulesAll(
                      catalog,
                      actions,
                      groupKeys,
                      groupState !== true,
                    ),
                  )
                }
                className={CHECKBOX_CLASS}
              />
            </div>

            {groupOpen && (
              <div className="divide-y divide-border/50 border-t border-border/60">
                {pages.map((page) => {
                  const keys = pageModules(catalog, page.key).map((m) => m.key);
                  const pageState = groupCheckState(catalog, actions, keys);
                  const pageOpen = openKeys.has(page.key);
                  const children = modules.filter((m) => m.parent === page.key);
                  return (
                    <div key={page.key}>
                      {/* Ligne de la page : déplie ses actions, case « tout » */}
                      <div className="flex items-center gap-3 py-2 pl-7 pr-3">
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                          aria-expanded={pageOpen}
                          onClick={() => toggleOpen(page.key)}
                        >
                          <Chevron open={pageOpen} />
                          <span className="text-sm">{page.label}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {pageSummary(catalog, actions, page.key)}
                          </span>
                        </button>
                        <Checkbox
                          aria-label={`Tous les droits : ${page.label}`}
                          checked={pageState}
                          disabled={disabled}
                          onCheckedChange={() =>
                            onChange(
                              setModulesAll(
                                catalog,
                                actions,
                                keys,
                                pageState !== true,
                              ),
                            )
                          }
                          className={CHECKBOX_CLASS}
                        />
                      </div>

                      {pageOpen && (
                        <div className="space-y-3 pb-3 pl-12 pr-3">
                          <ActionGrid
                            module={page}
                            grid={actions}
                            disabled={disabled}
                            onToggle={onToggle}
                          />
                          {children.map((child) => (
                            <div key={child.key} className="space-y-1">
                              <p className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {child.label}
                              </p>
                              <ActionGrid
                                module={child}
                                grid={actions}
                                disabled={disabled}
                                onToggle={onToggle}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
