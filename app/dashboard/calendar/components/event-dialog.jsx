"use client";

import { useEffect, useMemo, useState } from "react";
import { RiCalendarLine, RiDeleteBinLine, RiCheckLine, RiLoader4Line } from "@remixicon/react";
import { format, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { sanitizeInput, detectInjectionAttempt } from "@/src/lib/validation";

// Types removed for JavaScript compatibility
import {
  DefaultEndHour,
  DefaultStartHour,
  EndHour,
  StartHour,
} from "./constants";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { Calendar } from "@/src/components/ui/calendar";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { EmailReminderToggle } from "@/src/components/email-reminder-toggle";
import { Separator } from "@/src/components/ui/separator";
import { useCalendarConnections, usePushEventToCalendar } from "@/src/hooks/useCalendarConnections";

// Props interface converted to JSDoc for JavaScript
/**
 * @param {Object|null} event
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {Function} onSave
 * @param {Function} onDelete
 */

const providerIcons = {
  google: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  ),
  microsoft: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 0h11.5v11.5H0zM12.5 0H24v11.5H12.5zM0 12.5h11.5V24H0zM12.5 12.5H24V24H12.5z" />
    </svg>
  ),
  apple: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  ),
};

const providerLabels = {
  google: "Google Calendar",
  microsoft: "Microsoft Outlook",
  apple: "Apple Calendar",
};

export function EventDialog({ event, isOpen, onClose, onSave, onDelete }) {
  const isReadOnly = event?.isReadOnly || false;
  const eventSource = event?.source || "newbi";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(() => new Date());
  const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`);
  const [endTime, setEndTime] = useState(`${DefaultEndHour}:00`);
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [color, setColor] = useState("sky");
  const [emailReminder, setEmailReminder] = useState({ enabled: false, anticipation: null });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [pushingConnectionId, setPushingConnectionId] = useState(null);
  const [justSyncedIds, setJustSyncedIds] = useState([]);

  const { connections } = useCalendarConnections();
  const { pushEvent, loading: pushLoading } = usePushEventToCalendar();

  const activeConnections = connections.filter((c) => c.status === "active");

  const isAlreadySynced = (connectionId) => {
    return (
      justSyncedIds.includes(connectionId) ||
      event?.externalCalendarLinks?.some(
        (link) => link.calendarConnectionId === connectionId
      )
    );
  };

  const showSyncSection =
    event?.id && !isReadOnly && activeConnections.length > 0;

  const handlePushEvent = async (connectionId) => {
    setPushingConnectionId(connectionId);
    const success = await pushEvent(event.id, connectionId);
    if (success) {
      setJustSyncedIds((prev) => [...prev, connectionId]);
    }
    setPushingConnectionId(null);
  };

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");

      const start = new Date(event.start);
      const end = new Date(event.end);

      setStartDate(start);
      setEndDate(end);
      setStartTime(formatTimeForInput(start));
      setEndTime(formatTimeForInput(end));
      setAllDay(event.allDay || false);
      setLocation(event.location || "");
      setColor(event.color || "sky");
      setEmailReminder(event.emailReminder || { enabled: false, anticipation: null });
      setError(null); // Reset error when opening dialog
      setJustSyncedIds([]); // Reset sync state for new event
    } else {
      resetForm();
    }
  }, [event]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDate(new Date());
    setEndDate(new Date());
    setStartTime(`${DefaultStartHour}:00`);
    setEndTime(`${DefaultEndHour}:00`);
    setAllDay(false);
    setLocation("");
    setColor("sky");
    setEmailReminder({ enabled: false, anticipation: null });
    setError(null);
    setFieldErrors({});
  };

  const formatTimeForInput = (date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = Math.floor(date.getMinutes() / 15) * 15;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  // Memoize time options so they're only calculated once
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = StartHour; hour <= EndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const value = `${formattedHour}:${formattedMinute}`;
        // Use a fixed date to avoid unnecessary date object creations
        const date = new Date(2000, 0, 1, hour, minute);
        const label = format(date, "H:mm", { locale: fr });
        options.push({ value, label });
      }
    }
    return options;
  }, []); // Empty dependency array ensures this only runs once

  // Patterns de validation pour les événements
  const eventValidationPatterns = {
    title: {
      pattern: /^[a-zA-ZÀ-ÿ0-9\s\-&'.,()!?]{1,200}$/,
      message:
        "Le titre doit contenir entre 1 et 200 caractères (lettres, chiffres, espaces et ponctuation de base autorisés)",
    },
    description: {
      pattern: /^[a-zA-ZÀ-ÿ0-9\s\-&'.,()!?\n\r]{0,1000}$/,
      message: "La description ne peut pas dépasser 1000 caractères",
    },
    location: {
      pattern: /^[a-zA-ZÀ-ÿ0-9\s\-&'.,()]{0,200}$/,
      message:
        "Le lieu ne peut pas dépasser 200 caractères (lettres, chiffres, espaces et ponctuation de base autorisés)",
    },
  };

  // Fonction de validation des champs
  const validateField = (fieldName, value) => {
    if (!value && fieldName === "title") {
      return "Le titre est requis";
    }

    if (!value) return null; // Champs optionnels

    // Vérification des tentatives d'injection
    if (detectInjectionAttempt(value)) {
      return "Caractères non autorisés détectés";
    }

    const pattern = eventValidationPatterns[fieldName];
    if (pattern && !pattern.pattern.test(value)) {
      return pattern.message;
    }

    return null;
  };

  const handleSave = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!allDay) {
      const [startHours = 0, startMinutes = 0] = startTime
        .split(":")
        .map(Number);
      const [endHours = 0, endMinutes = 0] = endTime.split(":").map(Number);

      if (
        startHours < StartHour ||
        startHours > EndHour ||
        endHours < StartHour ||
        endHours > EndHour
      ) {
        setError(
          `L'heure sélectionnée doit être entre ${StartHour}:00 et ${EndHour}:00`
        );
        return;
      }

      start.setHours(startHours, startMinutes, 0);
      end.setHours(endHours, endMinutes, 0);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    // Validate that end date is not before start date
    if (isBefore(end, start)) {
      setError("La date de fin ne peut pas être antérieure à la date de début");
      return;
    }

    // Validation des champs
    const errors = {};
    const titleValue = title.trim();
    const descriptionValue = description.trim();
    const locationValue = location.trim();

    // Validation du titre
    const titleError = validateField("title", titleValue);
    if (titleError) errors.title = titleError;

    // Validation de la description
    const descriptionError = validateField("description", descriptionValue);
    if (descriptionError) errors.description = descriptionError;

    // Validation du lieu
    const locationError = validateField("location", locationValue);
    if (locationError) errors.location = locationError;

    // Si des erreurs de validation existent, les afficher
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Réinitialiser les erreurs de champs
    setFieldErrors({});

    // Use generic title if empty
    const eventTitle = titleValue || "(sans titre)";

    onSave({
      id: event?.id || "",
      title: sanitizeInput(eventTitle),
      description: sanitizeInput(descriptionValue),
      start,
      end,
      allDay,
      location: sanitizeInput(locationValue),
      color,
      emailReminder,
    });
  };

  const handleDelete = () => {
    if (event?.id) {
      onDelete(event.id);
    }
  };

  // Updated color options to match types.ts
  const colorOptions = [
    {
      value: "sky",
      label: "Sky",
      bgClass: "bg-sky-400 data-[state=checked]:bg-sky-400",
      borderClass: "border-sky-400 data-[state=checked]:border-sky-400",
    },
    {
      value: "amber",
      label: "Amber",
      bgClass: "bg-amber-400 data-[state=checked]:bg-amber-400",
      borderClass: "border-amber-400 data-[state=checked]:border-amber-400",
    },
    {
      value: "violet",
      label: "Violet",
      bgClass: "bg-violet-400 data-[state=checked]:bg-violet-400",
      borderClass: "border-violet-400 data-[state=checked]:border-violet-400",
    },
    {
      value: "rose",
      label: "Rose",
      bgClass: "bg-rose-400 data-[state=checked]:bg-rose-400",
      borderClass: "border-rose-400 data-[state=checked]:border-rose-400",
    },
    {
      value: "emerald",
      label: "Emerald",
      bgClass: "bg-emerald-400 data-[state=checked]:bg-emerald-400",
      borderClass: "border-emerald-400 data-[state=checked]:border-emerald-400",
    },
    {
      value: "orange",
      label: "Orange",
      bgClass: "bg-orange-400 data-[state=checked]:bg-orange-400",
      borderClass: "border-orange-400 data-[state=checked]:border-orange-400",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isReadOnly
              ? "Détails de l'événement"
              : event?.id
                ? "Modifier l'événement"
                : "Créer un événement"}
          </DialogTitle>
          <DialogDescription className={isReadOnly ? "" : "sr-only"}>
            {isReadOnly
              ? `Événement synchronisé depuis ${eventSource === "google" ? "Google Calendar" : eventSource === "microsoft" ? "Microsoft Outlook" : eventSource === "apple" ? "Apple Calendar" : "un calendrier externe"} (lecture seule)`
              : event?.id
                ? "Modifier les détails de cet événement"
                : "Ajouter un nouvel événement à votre calendrier"}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md px-3 py-2 text-sm">
            {error}
          </div>
        )}
        <div className="grid gap-4 py-4">
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="title" className="font-normal">
              Titre
            </Label>
            <Input
              id="title"
              value={title}
              disabled={isReadOnly}
              onChange={(e) => {
                setTitle(e.target.value);
                // Effacer l'erreur du champ quand l'utilisateur tape
                if (fieldErrors.title) {
                  setFieldErrors((prev) => ({ ...prev, title: null }));
                }
              }}
              className={fieldErrors.title ? "border-red-500" : ""}
            />
            {fieldErrors.title && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.title}</p>
            )}
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="description" className="font-normal">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              disabled={isReadOnly}
              onChange={(e) => {
                setDescription(e.target.value);
                // Effacer l'erreur du champ quand l'utilisateur tape
                if (fieldErrors.description) {
                  setFieldErrors((prev) => ({ ...prev, description: null }));
                }
              }}
              rows={3}
              className={fieldErrors.description ? "border-red-500" : ""}
            />
            {fieldErrors.description && (
              <p className="text-sm text-red-500 mt-1">
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1 *:not-first:mt-1.5">
              <Label htmlFor="start-date" className="font-normal">
                Date de début
              </Label>
              <Popover open={!isReadOnly && startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant={"outline"}
                    className={cn(
                      "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "truncate",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate
                        ? format(startDate, "PPP", { locale: fr })
                        : "Choisir une date"}
                    </span>
                    <RiCalendarLine
                      size={16}
                      className="text-muted-foreground/80 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    defaultMonth={startDate}
                    locale={fr}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date);
                        // If end date is before the new start date, update it to match the start date
                        if (isBefore(endDate, date)) {
                          setEndDate(date);
                        }
                        setError(null);
                        setStartDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="min-w-28 *:not-first:mt-1.5">
                <Label htmlFor="start-time" className="font-normal">
                  Heure de début
                </Label>
                <Select value={startTime} onValueChange={setStartTime} disabled={isReadOnly}>
                  <SelectTrigger id="start-time">
                    <SelectValue placeholder="Choisir l'heure" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1 *:not-first:mt-1.5">
              <Label htmlFor="end-date">Date de fin</Label>
              <Popover open={!isReadOnly && endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant={"outline"}
                    className={cn(
                      "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "truncate",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      {endDate
                        ? format(endDate, "PPP", { locale: fr })
                        : "Choisir une date"}
                    </span>
                    <RiCalendarLine
                      size={16}
                      className="text-muted-foreground/80 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    defaultMonth={endDate}
                    locale={fr}
                    disabled={{ before: startDate }}
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date);
                        setError(null);
                        setEndDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="min-w-28 *:not-first:mt-1.5">
                <Label htmlFor="end-time">Heure de fin</Label>
                <Select value={endTime} onValueChange={setEndTime} disabled={isReadOnly}>
                  <SelectTrigger id="end-time">
                    <SelectValue placeholder="Choisir l'heure" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="all-day"
              checked={allDay}
              disabled={isReadOnly}
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <Label htmlFor="all-day">Toute la journée</Label>
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              value={location}
              disabled={isReadOnly}
              onChange={(e) => {
                setLocation(e.target.value);
                // Effacer l'erreur du champ quand l'utilisateur tape
                if (fieldErrors.location) {
                  setFieldErrors((prev) => ({ ...prev, location: null }));
                }
              }}
              className={fieldErrors.location ? "border-red-500" : ""}
            />
            {fieldErrors.location && (
              <p className="text-sm text-red-500 mt-1">
                {fieldErrors.location}
              </p>
            )}
          </div>

          {!isReadOnly && (
            <EmailReminderToggle
              value={emailReminder}
              onChange={setEmailReminder}
            />
          )}

          <fieldset className="space-y-4">
            <legend className="text-foreground text-sm leading-none font-medium">
              Etiquette
            </legend>
            <RadioGroup
              className="flex gap-1.5"
              defaultValue={colorOptions[0]?.value}
              value={color}
              disabled={isReadOnly}
              onValueChange={(value) => setColor(value)}
            >
              {colorOptions.map((colorOption) => (
                <RadioGroupItem
                  key={colorOption.value}
                  id={`color-${colorOption.value}`}
                  value={colorOption.value}
                  aria-label={colorOption.label}
                  className={cn(
                    "size-6 shadow-none",
                    colorOption.bgClass,
                    colorOption.borderClass
                  )}
                />
              ))}
            </RadioGroup>
          </fieldset>

          {showSyncSection && (
            <div className="space-y-3">
              <Separator />
              <p className="text-sm font-medium text-foreground">
                Synchroniser avec un calendrier
              </p>
              <div className="space-y-2">
                {activeConnections.map((connection) => {
                  const synced = isAlreadySynced(connection.id);
                  const isPushing = pushingConnectionId === connection.id;

                  return (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-muted-foreground shrink-0">
                          {providerIcons[connection.provider]}
                        </span>
                        <span className="text-sm truncate">
                          {connection.accountEmail || connection.accountName || providerLabels[connection.provider]}
                        </span>
                      </div>
                      {synced ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                          <RiCheckLine size={14} />
                          Synchronisé
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pushLoading}
                          onClick={() => handlePushEvent(connection.id)}
                          className="shrink-0 h-7 text-xs"
                        >
                          {isPushing ? (
                            <RiLoader4Line size={14} className="animate-spin" />
                          ) : (
                            "Envoyer"
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="flex-row sm:justify-between">
          {isReadOnly ? (
            <div className="flex flex-1 justify-end">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </div>
          ) : (
            <>
              {event?.id && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDelete}
                  className="font-normal"
                  aria-label="Delete event"
                >
                  <RiDeleteBinLine size={16} aria-hidden="true" />
                </Button>
              )}
              <div className="flex flex-1 justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button
                  className="bg-[#5a50ff] hover:bg-[#5a50ff]/90 font-normal"
                  onClick={handleSave}
                >
                  Enregistrer
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
