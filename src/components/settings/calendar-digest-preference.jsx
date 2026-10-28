"use client";

import { Separator } from "@/src/components/ui/separator";
import { Switch } from "@/src/components/ui/switch";
import { useCalendarWeeklyDigest } from "@/src/hooks/useCalendarFeed";

/**
 * Catégorie « Calendrier » des préférences de notification : récap du
 * lundi par e-mail (pas de notification push). Lu à part des autres
 * préférences, masqué tant que l'API ne connaît pas ce réglage.
 */
export function CalendarDigestPreference() {
  const digest = useCalendarWeeklyDigest();
  if (!digest.available) return null;

  return (
    <div>
      <Separator className="mb-10 bg-[#eeeff1] dark:bg-[#232323]" />
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-sm font-normal mb-1">Calendrier</h3>
          <p className="text-xs text-gray-400">
            Notifications liées à votre calendrier
          </p>
        </div>
      </div>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-normal mb-1">Récap du lundi</h3>
          <p className="text-xs text-gray-400">
            Chaque lundi à 8 h, le programme de la semaine de vos espaces (aucun
            e-mail si la semaine est vide)
          </p>
        </div>
        <div className="flex items-center gap-4 ml-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Email</span>
            <Switch
              checked={digest.enabled}
              disabled={digest.saving}
              onCheckedChange={digest.setEnabled}
              aria-label="Récap du lundi par e-mail"
              className="scale-75 data-[state=checked]:!bg-[#5b4eff]"
            />
          </div>
          {/* Pas de push pour ce récap : place gardée pour aligner les
              interrupteurs avec les autres lignes */}
          <div className="invisible flex items-center gap-2" aria-hidden="true">
            <span className="text-xs">Push</span>
            <Switch disabled tabIndex={-1} className="scale-75" />
          </div>
        </div>
      </div>
    </div>
  );
}
