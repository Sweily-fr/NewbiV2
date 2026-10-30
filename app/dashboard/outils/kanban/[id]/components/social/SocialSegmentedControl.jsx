"use client";

import { cn } from "@/src/lib/utils";

/**
 * Choix exclusif en boutons accolés (« Publication » / « Story »,
 * « Publier directement » / « Envoyer en brouillon »…) : groupe de boutons
 * radio. Une option `disabled` reste visible, grisée ; `title` dit pourquoi.
 *
 * @param {{ label: string, value: string, options: Array<{ value: string, label: string, disabled?: boolean, title?: string }>, onChange: (value: string) => void, disabled?: boolean, className?: string }} props
 */
export function SocialSegmentedControl({
  label,
  value,
  options,
  onChange,
  disabled = false,
  className,
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full rounded-lg border bg-muted/40 p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled || option.disabled}
            title={option.title}
            onClick={() => !active && onChange(option.value)}
            className={cn(
              "flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
