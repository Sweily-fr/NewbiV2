"use client";

import { Braces } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";
import {
  DEFAULT_VARIABLES,
  insertAtCursor,
  variableToken,
} from "@/src/utils/email-campaign-variables";

/**
 * Menu « Insérer une variable » : prénom, nom, entreprise… remplacés par
 * les informations de chaque contact à l'envoi.
 */
export function VariableMenu({
  variables,
  onInsert,
  align = "end",
  label = "Variable",
  compact = false,
  className,
  triggerProps = {},
}) {
  const list = variables?.length ? variables : DEFAULT_VARIABLES;
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            compact
              ? "size-7 p-0"
              : "h-7 gap-1 px-2 text-xs text-[#5a50ff] hover:text-[#4a41e0] dark:text-[#8b7fff]",
            className,
          )}
          aria-label="Insérer une variable"
          title="Insérer une variable"
          {...triggerProps}
        >
          <Braces className="size-3.5" aria-hidden />
          {!compact && label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Remplacée pour chaque contact
        </DropdownMenuLabel>
        {list.map((variable) => (
          <DropdownMenuItem
            key={variable.key}
            onSelect={() => onInsert(variableToken(variable.key))}
            className="flex items-center justify-between gap-3"
          >
            <span className="min-w-0 truncate">{variable.label}</span>
            <span className="shrink-0 truncate text-xs text-muted-foreground">
              {variable.example}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-xs leading-5 text-muted-foreground">
          Valeur de repli si un contact n&apos;en a pas :{" "}
          <span className="font-mono text-[11px] text-foreground">
            {"{{prenom|Bonjour}}"}
          </span>
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Insertion d'un jeton dans un champ texte à l'endroit du curseur, puis le
 * curseur juste après (le champ garde le focus).
 */
export function insertIntoField(inputRef, value, setValue, token) {
  const input = inputRef?.current;
  const { text, caret } = insertAtCursor(
    value,
    token,
    input?.selectionStart ?? undefined,
    input?.selectionEnd ?? undefined,
  );
  setValue(text);
  if (input) {
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(caret, caret);
    });
  }
}
