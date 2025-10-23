"use client";

import React, { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";

/**
 * Composant de dropdown pour afficher des suggestions de texte
 * @param {Array} suggestions - Liste des suggestions avec {label, value}
 * @param {Function} onSelect - Callback appelé quand une suggestion est sélectionnée
 * @param {string} label - Label du bouton
 */
export function SuggestionDropdown({ suggestions = [], onSelect, label = "Suggestions" }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (value) => {
    onSelect(value);
    setOpen(false);
  };

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 text-xs font-normal"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="text-xs">
          Cliquez pour insérer une suggestion
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {suggestions.map((suggestion, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => handleSelect(suggestion.value)}
            className="cursor-pointer"
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium">{suggestion.label}</span>
              <span className="text-[10px] text-muted-foreground line-clamp-2">
                {suggestion.value.substring(0, 100)}
                {suggestion.value.length > 100 ? "..." : ""}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
