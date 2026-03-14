"use client";

import { useState, useEffect } from "react";
import { Bell, Clock } from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

const ANTICIPATION_OPTIONS = {
  regular: [
    { value: "5m", label: "5 minutes avant" },
    { value: "10m", label: "10 minutes avant" },
    { value: "15m", label: "15 minutes avant" },
    { value: "1h", label: "1 heure avant" },
    { value: "3h", label: "3 heures avant" },
    { value: "1d", label: "1 jour avant" },
    { value: "3d", label: "3 jours avant" },
  ],
  allDay: [
    { value: "1d", label: "1 jour avant" },
    { value: "3d", label: "3 jours avant" },
  ],
};

/**
 * Composant pour activer/désactiver les rappels email sur une tâche
 */
export function EmailReminderToggle({ value, onChange, disabled = false, allDay = false }) {
  const [enabled, setEnabled] = useState(value?.enabled || false);
  const [anticipation, setAnticipation] = useState(value?.anticipation || null);

  const options = allDay ? ANTICIPATION_OPTIONS.allDay : ANTICIPATION_OPTIONS.regular;

  // Synchroniser avec les valeurs externes
  useEffect(() => {
    setEnabled(value?.enabled || false);
    setAnticipation(value?.anticipation || null);
  }, [value]);

  // Si on passe en allDay et que l'anticipation sélectionnée n'est plus valide, reset
  useEffect(() => {
    if (allDay && anticipation && !options.some((o) => o.value === anticipation)) {
      setAnticipation(null);
      if (enabled) {
        onChange({ enabled, anticipation: null });
      }
    }
  }, [allDay]);

  // Gérer le changement d'activation
  const handleEnabledChange = (checked) => {
    setEnabled(checked);
    onChange({
      enabled: checked,
      anticipation: checked ? anticipation : null,
    });
  };

  // Gérer le changement d'anticipation
  const handleAnticipationChange = (newAnticipation) => {
    const finalAnticipation =
      newAnticipation === "none" ? null : newAnticipation;
    setAnticipation(finalAnticipation);
    onChange({
      enabled,
      anticipation: finalAnticipation,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <Label
            htmlFor="email-reminder"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Rappel par email
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Vous recevrez un email au moment prévu. Vous pouvez gérer vos
                  préférences dans les paramètres.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Checkbox
          id="email-reminder"
          checked={enabled}
          onCheckedChange={handleEnabledChange}
          disabled={disabled}
        />
      </div>

      {enabled && (
        <div className="space-y-2 pl-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <Label
              htmlFor="anticipation"
              className="text-xs text-muted-foreground"
            >
              Quand envoyer le rappel ?
            </Label>
          </div>
          <Select
            value={anticipation || "none"}
            onValueChange={handleAnticipationChange}
            disabled={disabled}
          >
            <SelectTrigger id="anticipation" className="h-9 text-sm">
              <SelectValue placeholder="À l'échéance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">À l'échéance</SelectItem>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {anticipation
              ? `Vous recevrez un email ${getAnticipationLabel(anticipation)}`
              : allDay
                ? "Vous recevrez un email à 9h00 le jour de l'événement"
                : "Vous recevrez un email au début de l'événement"}
          </p>
        </div>
      )}
    </div>
  );
}

// Helper pour les labels d'anticipation
function getAnticipationLabel(anticipation) {
  const labels = {
    "5m": "5 minutes avant",
    "10m": "10 minutes avant",
    "15m": "15 minutes avant",
    "1h": "1 heure avant",
    "3h": "3 heures avant",
    "1d": "1 jour avant",
    "3d": "3 jours avant",
  };
  return labels[anticipation] || "";
}
