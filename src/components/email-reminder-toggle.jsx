"use client";

import { useState, useEffect } from "react";
import { Bell, Clock, CalendarClock } from "lucide-react";
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

/**
 * Composant pour activer/désactiver les rappels email sur une tâche
 */
export function EmailReminderToggle({ value, onChange, disabled = false, allDay = false }) {
  const [enabled, setEnabled] = useState(value?.enabled || false);
  const [anticipation, setAnticipation] = useState(value?.anticipation || null);
  const [echeance, setEcheance] = useState(value?.echeance || null);

  // Synchroniser avec les valeurs externes
  useEffect(() => {
    setEnabled(value?.enabled || false);
    setAnticipation(value?.anticipation || null);
    setEcheance(value?.echeance || null);
  }, [value]);

  // Si on passe en allDay et que l'anticipation sélectionnée n'est plus valide, reset
  useEffect(() => {
    if (allDay) {
      const validAllDay = [null, "1d", "3d"];
      if (anticipation && !validAllDay.includes(anticipation)) {
        setAnticipation(null);
        onChange({ enabled, anticipation: null, echeance: null });
      }
      // Pas d'échéance pour les événements allDay
      if (echeance) {
        setEcheance(null);
      }
    }
  }, [allDay]);

  const emitChange = (updates) => {
    const next = {
      enabled,
      anticipation,
      echeance: allDay ? null : echeance,
      ...updates,
    };
    onChange(next);
  };

  const handleEnabledChange = (checked) => {
    setEnabled(checked);
    emitChange({
      enabled: checked,
      anticipation: checked ? anticipation : null,
      echeance: checked ? echeance : null,
    });
  };

  const handleAnticipationChange = (val) => {
    const v = val === "none" ? null : val;
    setAnticipation(v);
    emitChange({ anticipation: v });
  };

  const handleEcheanceChange = (val) => {
    const v = val === "none" ? null : val;
    setEcheance(v);
    emitChange({ echeance: v });
  };

  const anticipationOptions = allDay
    ? [
        { value: "1d", label: "1 jour avant" },
        { value: "3d", label: "3 jours avant" },
      ]
    : [
        { value: "1h", label: "1 heure avant" },
        { value: "3h", label: "3 heures avant" },
        { value: "1d", label: "1 jour avant" },
        { value: "3d", label: "3 jours avant" },
      ];

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
        <div className="space-y-4 pl-6">
          {/* Rappel anticipé */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-xs text-muted-foreground">
                Rappel anticipé
              </Label>
            </div>
            <Select
              value={anticipation || "none"}
              onValueChange={handleAnticipationChange}
              disabled={disabled}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {anticipationOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* À l'échéance — uniquement pour les événements non allDay */}
          {!allDay && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">
                  À l'échéance
                </Label>
              </div>
              <Select
                value={echeance || "none"}
                onValueChange={handleEcheanceChange}
                disabled={disabled}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  <SelectItem value="0m">Au début de l'événement</SelectItem>
                  <SelectItem value="5m">5 minutes avant</SelectItem>
                  <SelectItem value="10m">10 minutes avant</SelectItem>
                  <SelectItem value="15m">15 minutes avant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Résumé */}
          <p className="text-xs text-muted-foreground">
            {getSummary(anticipation, echeance, allDay)}
          </p>
        </div>
      )}
    </div>
  );
}

function getSummary(anticipation, echeance, allDay) {
  const parts = [];

  if (anticipation) {
    const labels = {
      "1h": "1 heure avant",
      "3h": "3 heures avant",
      "1d": "1 jour avant",
      "3d": "3 jours avant",
    };
    parts.push(labels[anticipation]);
  }

  if (!allDay && echeance) {
    const labels = { "0m": "au début de l'événement", "5m": "5 min avant", "10m": "10 min avant", "15m": "15 min avant" };
    parts.push(labels[echeance]);
  }

  if (allDay && !anticipation) {
    parts.push("à 9h00 le jour de l'événement");
  }

  if (parts.length === 0) return "Aucun rappel ne sera envoyé";
  return `Vous recevrez un email ${parts.join(" et ")}`;
}
