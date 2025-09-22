"use client";

import { useEffect, useMemo, useState } from "react";
import { RiCalendarLine, RiDeleteBinLine } from "@remixicon/react";
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

// Props interface converted to JSDoc for JavaScript
/**
 * @param {Object|null} event
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {Function} onSave
 * @param {Function} onDelete
 */

export function EventDialog({ event, isOpen, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(() => new Date());
  const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`);
  const [endTime, setEndTime] = useState(`${DefaultEndHour}:00`);
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [color, setColor] = useState("sky");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

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
      setError(null); // Reset error when opening dialog
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
            {event?.id ? "Modifier l'événement" : "Créer un événement"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {event?.id
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
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                const sanitized = sanitizeInput(e.target.value);
                setTitle(sanitized);
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                const sanitized = sanitizeInput(e.target.value);
                setDescription(sanitized);
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
              <Label htmlFor="start-date">Date de début</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
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
                <Label htmlFor="start-time">Heure de début</Label>
                <Select value={startTime} onValueChange={setStartTime}>
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
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
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
                      {endDate ? format(endDate, "PPP", { locale: fr }) : "Choisir une date"}
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
                <Select value={endTime} onValueChange={setEndTime}>
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
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <Label htmlFor="all-day">Toute la journée</Label>
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => {
                const sanitized = sanitizeInput(e.target.value);
                setLocation(sanitized);
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
          <fieldset className="space-y-4">
            <legend className="text-foreground text-sm leading-none font-medium">
              Etiquette
            </legend>
            <RadioGroup
              className="flex gap-1.5"
              defaultValue={colorOptions[0]?.value}
              value={color}
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
        </div>
        <DialogFooter className="flex-row sm:justify-between">
          {event?.id && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              aria-label="Delete event"
            >
              <RiDeleteBinLine size={16} aria-hidden="true" />
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
