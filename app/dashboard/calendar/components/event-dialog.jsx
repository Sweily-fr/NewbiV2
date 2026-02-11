"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RiCalendarLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiLoader4Line,
} from "@remixicon/react";
import {
  CalendarDays,
  Clock,
  MapPin,
  AlignLeft,
  Send,
  Tag,
} from "lucide-react";
import { format, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { sanitizeInput, detectInjectionAttempt } from "@/src/lib/validation";

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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
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
import {
  useCalendarConnections,
  usePushEventToCalendar,
} from "@/src/hooks/useCalendarConnections";

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

const colorOptions = [
  {
    value: "sky",
    label: "Ciel",
    bg: "bg-sky-400",
    ring: "ring-sky-400/30",
    dot: "bg-sky-400",
  },
  {
    value: "amber",
    label: "Ambre",
    bg: "bg-amber-400",
    ring: "ring-amber-400/30",
    dot: "bg-amber-400",
  },
  {
    value: "violet",
    label: "Violet",
    bg: "bg-violet-400",
    ring: "ring-violet-400/30",
    dot: "bg-violet-400",
  },
  {
    value: "rose",
    label: "Rose",
    bg: "bg-rose-400",
    ring: "ring-rose-400/30",
    dot: "bg-rose-400",
  },
  {
    value: "emerald",
    label: "Vert",
    bg: "bg-emerald-400",
    ring: "ring-emerald-400/30",
    dot: "bg-emerald-400",
  },
  {
    value: "orange",
    label: "Orange",
    bg: "bg-orange-400",
    ring: "ring-orange-400/30",
    dot: "bg-orange-400",
  },
];

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
  const [emailReminder, setEmailReminder] = useState({
    enabled: false,
    anticipation: null,
  });
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
      setEmailReminder(
        event.emailReminder || { enabled: false, anticipation: null }
      );
      setError(null);
      setJustSyncedIds([]);
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

  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = StartHour; hour <= EndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const value = `${formattedHour}:${formattedMinute}`;
        const date = new Date(2000, 0, 1, hour, minute);
        const label = format(date, "H:mm", { locale: fr });
        options.push({ value, label });
      }
    }
    return options;
  }, []);

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

  const validateField = (fieldName, value) => {
    if (!value && fieldName === "title") {
      return "Le titre est requis";
    }

    if (!value) return null;

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

    if (isBefore(end, start)) {
      setError(
        "La date de fin ne peut pas être antérieure à la date de début"
      );
      return;
    }

    const errors = {};
    const titleValue = title.trim();
    const descriptionValue = description.trim();
    const locationValue = location.trim();

    const titleError = validateField("title", titleValue);
    if (titleError) errors.title = titleError;

    const descriptionError = validateField("description", descriptionValue);
    if (descriptionError) errors.description = descriptionError;

    const locationError = validateField("location", locationValue);
    if (locationError) errors.location = locationError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:w-[460px] sm:max-w-[460px] flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <CalendarDays
              className={cn(
                "h-5 w-5 shrink-0",
                {
                  "text-sky-400": color === "sky",
                  "text-amber-400": color === "amber",
                  "text-violet-400": color === "violet",
                  "text-rose-400": color === "rose",
                  "text-emerald-400": color === "emerald",
                  "text-orange-400": color === "orange",
                }
              )}
            />
            <div>
              <SheetTitle className="text-base">
                {isReadOnly
                  ? "Détails de l'événement"
                  : event?.id
                    ? "Modifier l'événement"
                    : "Nouvel événement"}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {isReadOnly
                  ? `Synchronisé depuis ${eventSource === "google" ? "Google Calendar" : eventSource === "microsoft" ? "Microsoft Outlook" : eventSource === "apple" ? "Apple Calendar" : "un calendrier externe"}`
                  : event?.id
                    ? "Modifiez les détails ci-dessous"
                    : "Remplissez les informations de votre événement"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Separator className="mt-4" />

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Form content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Input
              id="title"
              value={title}
              disabled={isReadOnly}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) {
                  setFieldErrors((prev) => ({ ...prev, title: null }));
                }
              }}
              placeholder="Titre de l'événement"
              className={cn(
                "h-11 text-base font-medium border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary",
                fieldErrors.title && "border-red-500"
              )}
            />
            {fieldErrors.title && (
              <p className="text-xs text-red-500">{fieldErrors.title}</p>
            )}
          </div>

          {/* Date & Time section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Date et heure</span>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              {/* Start */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-10 shrink-0">
                  Début
                </span>
                <Popover
                  open={!isReadOnly && startDateOpen}
                  onOpenChange={setStartDateOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      id="start-date"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 flex-1 justify-start gap-2 font-normal text-xs",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <RiCalendarLine size={14} className="text-muted-foreground" />
                      {startDate
                        ? format(startDate, "EEE d MMM yyyy", { locale: fr })
                        : "Choisir"}
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

                {!allDay && (
                  <Select
                    value={startTime}
                    onValueChange={setStartTime}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="h-8 w-24 text-xs">
                      <SelectValue placeholder="Heure" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* End */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-10 shrink-0">
                  Fin
                </span>
                <Popover
                  open={!isReadOnly && endDateOpen}
                  onOpenChange={setEndDateOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      id="end-date"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 flex-1 justify-start gap-2 font-normal text-xs",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <RiCalendarLine size={14} className="text-muted-foreground" />
                      {endDate
                        ? format(endDate, "EEE d MMM yyyy", { locale: fr })
                        : "Choisir"}
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

                {!allDay && (
                  <Select
                    value={endTime}
                    onValueChange={setEndTime}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="h-8 w-24 text-xs">
                      <SelectValue placeholder="Heure" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* All day toggle */}
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="all-day"
                  checked={allDay}
                  disabled={isReadOnly}
                  onCheckedChange={(checked) => setAllDay(checked === true)}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="all-day" className="text-xs text-muted-foreground cursor-pointer">
                  Toute la journée
                </Label>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Lieu</span>
            </div>
            <Input
              id="location"
              value={location}
              disabled={isReadOnly}
              onChange={(e) => {
                setLocation(e.target.value);
                if (fieldErrors.location) {
                  setFieldErrors((prev) => ({ ...prev, location: null }));
                }
              }}
              placeholder="Ajouter un lieu"
              className={cn(
                "h-9 text-sm",
                fieldErrors.location && "border-red-500"
              )}
            />
            {fieldErrors.location && (
              <p className="text-xs text-red-500">{fieldErrors.location}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlignLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Description</span>
            </div>
            <Textarea
              id="description"
              value={description}
              disabled={isReadOnly}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    description: null,
                  }));
                }
              }}
              placeholder="Ajouter une description"
              rows={3}
              className={cn(
                "text-sm resize-none",
                fieldErrors.description && "border-red-500"
              )}
            />
            {fieldErrors.description && (
              <p className="text-xs text-red-500">
                {fieldErrors.description}
              </p>
            )}
          </div>

          {/* Color label */}
          {!isReadOnly && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span className="text-sm font-medium">Etiquette</span>
              </div>
              <div className="flex items-center gap-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setColor(colorOption.value)}
                    className={cn(
                      "h-7 w-7 rounded-full transition-all",
                      colorOption.dot,
                      color === colorOption.value
                        ? "ring-2 ring-offset-2 ring-offset-background " +
                            colorOption.ring
                        : "hover:scale-110"
                    )}
                    aria-label={colorOption.label}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Email reminder */}
          {!isReadOnly && (
            <EmailReminderToggle
              value={emailReminder}
              onChange={setEmailReminder}
            />
          )}

          {/* Calendar sync section */}
          {showSyncSection && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Send className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Synchroniser avec un calendrier
                </span>
              </div>
              <div className="space-y-2">
                {activeConnections.map((connection) => {
                  const synced = isAlreadySynced(connection.id);
                  const isPushing = pushingConnectionId === connection.id;

                  return (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-muted-foreground shrink-0">
                          {providerIcons[connection.provider]}
                        </span>
                        <span className="text-sm truncate">
                          {connection.accountEmail ||
                            connection.accountName ||
                            providerLabels[connection.provider]}
                        </span>
                      </div>
                      {synced ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                          <RiCheckLine size={14} />
                          Synchronisé
                        </span>
                      ) : connection.autoSync ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <RiCheckLine size={14} />
                          Sync. auto
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
                            <RiLoader4Line
                              size={14}
                              className="animate-spin"
                            />
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

        {/* Footer */}
        <SheetFooter className="mt-0 px-6 py-0">
          <Separator className="mb-4" />
          <div className="pb-4">
          {isReadOnly ? (
            <div className="flex w-full justify-end">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between">
              {event?.id ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                >
                  <RiDeleteBinLine size={16} />
                  Supprimer
                </Button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  className="bg-[#5a50ff] hover:bg-[#5a50ff]/90"
                  onClick={handleSave}
                >
                  {event?.id ? "Enregistrer" : "Créer"}
                </Button>
              </div>
            </div>
          )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
