"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { useAvailableCalendars } from "@/src/hooks/useCalendarConnections";
import { UPDATE_SELECTED_CALENDARS } from "@/src/graphql/mutations/calendarConnection";
import { GET_CALENDAR_CONNECTIONS } from "@/src/graphql/queries/calendarConnection";
import { toast } from "@/src/components/ui/sonner";

export function CalendarSelectorDialog({ isOpen, onClose, connection }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { calendars, loading: loadingCalendars } = useAvailableCalendars(
    connection?.id,
    { skip: !isOpen || !connection }
  );

  const [updateSelectedCalendars, { loading: saving }] = useMutation(UPDATE_SELECTED_CALENDARS, {
    refetchQueries: [{ query: GET_CALENDAR_CONNECTIONS }],
  });

  useEffect(() => {
    if (connection?.selectedCalendars) {
      const enabled = new Set(
        connection.selectedCalendars
          .filter((c) => c.enabled)
          .map((c) => c.calendarId)
      );
      setSelectedIds(enabled);
    }
  }, [connection]);

  const handleToggle = (calendarId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(calendarId)) {
        next.delete(calendarId);
      } else {
        next.add(calendarId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      const selectedCalendars = calendars.map((cal) => ({
        calendarId: cal.calendarId,
        name: cal.name,
        color: cal.color || null,
        enabled: selectedIds.has(cal.calendarId),
      }));

      const result = await updateSelectedCalendars({
        variables: {
          input: {
            connectionId: connection.id,
            selectedCalendars,
          },
        },
      });

      if (result.data?.updateSelectedCalendars?.success) {
        toast.success("Calendriers mis à jour");
        onClose();
      } else {
        toast.error(result.data?.updateSelectedCalendars?.message || "Erreur");
      }
    } catch (error) {
      console.error("Erreur mise à jour calendriers:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sélectionner les calendriers</DialogTitle>
          <DialogDescription>
            Choisissez les calendriers à synchroniser avec Newbi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 max-h-64 overflow-y-auto">
          {loadingCalendars ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : calendars.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun calendrier trouvé</p>
          ) : (
            calendars.map((cal) => (
              <div key={cal.calendarId} className="flex items-center gap-3">
                <Checkbox
                  id={`cal-${cal.calendarId}`}
                  checked={selectedIds.has(cal.calendarId)}
                  onCheckedChange={() => handleToggle(cal.calendarId)}
                />
                <div className="flex items-center gap-2">
                  {cal.color && (
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cal.color }}
                    />
                  )}
                  <Label
                    htmlFor={`cal-${cal.calendarId}`}
                    className="font-normal cursor-pointer"
                  >
                    {cal.name}
                    {cal.isPrimary && (
                      <span className="ml-1 text-xs text-muted-foreground">(principal)</span>
                    )}
                  </Label>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving || loadingCalendars}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
