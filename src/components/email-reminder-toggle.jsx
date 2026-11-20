"use client";

import { useState, useEffect } from "react";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

/**
 * Rappel par e-mail d'un événement : interrupteur, puis rappel anticipé et
 * rappel à l'échéance
 */
export function EmailReminderToggle({
  value,
  onChange,
  disabled = false,
  allDay = false,
}) {
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

  // Ligne de la fenêtre d'événement : l'icône est portée par la fenêtre
  return (
    <div>
      <div className="flex min-h-10 items-center justify-between gap-3">
        <Label
          htmlFor="email-reminder"
          className="cursor-pointer text-sm font-normal"
        >
          Rappel par e-mail
        </Label>
        <Switch
          id="email-reminder"
          size="sm"
          className="data-[state=checked]:bg-[#5a50ff]"
          checked={enabled}
          onCheckedChange={handleEnabledChange}
          disabled={disabled}
        />
      </div>

      {enabled && (
        <div className="space-y-2 pb-2.5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Select
              value={anticipation || "none"}
              onValueChange={handleAnticipationChange}
              disabled={disabled}
            >
              <SelectTrigger
                className="h-8 text-xs"
                aria-label="Rappel anticipé"
              >
                <SelectValue placeholder="Rappel anticipé" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Pas de rappel anticipé</SelectItem>
                {anticipationOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* À l'échéance : seulement pour un événement à l'heure */}
            {!allDay && (
              <Select
                value={echeance || "none"}
                onValueChange={handleEcheanceChange}
                disabled={disabled}
              >
                <SelectTrigger
                  className="h-8 text-xs"
                  aria-label="À l'échéance"
                >
                  <SelectValue placeholder="À l'échéance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Rien à l'échéance</SelectItem>
                  <SelectItem value="0m">Au début de l'événement</SelectItem>
                  <SelectItem value="5m">5 minutes avant</SelectItem>
                  <SelectItem value="10m">10 minutes avant</SelectItem>
                  <SelectItem value="15m">15 minutes avant</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
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
    const labels = {
      "0m": "au début de l'événement",
      "5m": "5 min avant",
      "10m": "10 min avant",
      "15m": "15 min avant",
    };
    parts.push(labels[echeance]);
  }

  if (allDay && !anticipation) {
    parts.push("à 9h00 le jour de l'événement");
  }

  if (parts.length === 0) return "Aucun rappel ne sera envoyé";
  return `Vous recevrez un email ${parts.join(" et ")}`;
}
