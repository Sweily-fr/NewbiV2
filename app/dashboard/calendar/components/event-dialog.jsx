"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  ExternalLink,
  Landmark,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Send,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { addDays, differenceInCalendarDays, format, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { sanitizeInput, detectInjectionAttempt } from "@/src/lib/validation";
import { useCalendarColorLabels } from "@/src/hooks/useCalendarColorLabels";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useCalendarEventTypes } from "@/src/hooks/useCalendarEventTypes";
import { newEventTypeId, typeSelectionPatch } from "@/src/utils/event-types";
import {
  declarationFilingSite,
  declarationPresetsFor,
} from "@/src/utils/declaration-events";

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
import { Switch } from "@/src/components/ui/switch";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { EmailReminderToggle } from "@/src/components/email-reminder-toggle";
import { ColorPicker } from "@/src/components/ui/color-picker";
import {
  useCalendarConnections,
  usePushEventToCalendar,
} from "@/src/hooks/useCalendarConnections";
import { MemberSelector } from "../../outils/kanban/[id]/components/MemberSelector";

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

// « ven. 20 nov. », avec l'année hors de l'année en cours
function formatDay(date) {
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return format(date, sameYear ? "EEE d MMM" : "EEE d MMM yyyy", {
    locale: fr,
  });
}

const formatHour = (date) => format(date, "H:mm", { locale: fr });

const toMinutes = (time) => {
  const [hours = 0, minutes = 0] = String(time).split(":").map(Number);
  return hours * 60 + minutes;
};

const toTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;

// Heures par défaut au format des options (« 09:00 », pas « 9:00 »)
const DEFAULT_START_TIME = toTime(DefaultStartHour * 60);
const DEFAULT_END_TIME = toTime(DefaultEndHour * 60);

// Pastilles de type
const CHIP =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
const CHIP_SELECTED = "border-[#5a50ff] bg-[#5a50ff]/10 text-[#5a50ff]";
const CHIP_IDLE = "border-border text-foreground hover:bg-accent";

// Valeur cliquable d'une ligne (date, étiquette)
const ROW_BUTTON =
  "inline-flex cursor-pointer items-center rounded-md px-1 py-1 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

// Texte d'invite des champs sans bordure
const PLACEHOLDER =
  "placeholder:text-[rgba(0,0,0,0.35)] dark:placeholder:text-[rgba(255,255,255,0.35)]";

// Petit intitulé de section (« Début », « Fin », « Description »)
const SECTION_LABEL =
  "text-muted-foreground text-[11px] font-medium tracking-wide uppercase";

/** Ligne de la fenêtre : icône à gauche, champ ou valeur à droite. */
function PropertyRow({ icon: Icon, children, alignTop = false }) {
  return (
    <div
      className={cn(
        "flex min-h-12 gap-3",
        alignTop ? "items-start" : "items-center",
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "text-muted-foreground size-4 shrink-0",
          alignTop && "mt-4",
        )}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Case « Début » ou « Fin » : date et heure. */
function DateTile({ label, date, picker, time }) {
  return (
    <div className="bg-muted/40 min-w-0 rounded-xl border px-3 py-2.5">
      <p className={SECTION_LABEL}>{label}</p>
      <div className="mt-1 flex min-h-8 items-center justify-between gap-2 text-sm font-medium">
        {picker || <span className="whitespace-nowrap">{formatDay(date)}</span>}
        {typeof time === "string" ? (
          <span className="tabular-nums">{time}</span>
        ) : (
          time
        )}
      </div>
    </div>
  );
}

/** Date cliquable : calendrier dans un menu. */
function DatePickerButton({
  label,
  date,
  open,
  onOpenChange,
  onSelect,
  disabled,
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label} : ${format(date, "EEEE d MMMM yyyy", { locale: fr })}`}
          className={cn(ROW_BUTTON, "-ml-1 whitespace-nowrap")}
        >
          {formatDay(date)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          locale={fr}
          disabled={disabled}
          onSelect={onSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Heure en pastille (« 14:00 »). */
function TimeSelect({ value, onChange, options, label }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        variant="ghost"
        size="sm"
        aria-label={label}
        className="bg-background border-border hover:bg-accent w-auto gap-0 border px-2 tabular-nums [&>svg]:hidden"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function EventDialog({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  // canEdit : enregistrer cet événement (action « create » pour un nouvel
  // événement, « edit » sinon, résolue par l'appelant)
  canEdit = true,
  canDelete = true,
  // Ajout et modification des étiquettes de couleur (action « edit »)
  canEditLabels = true,
}) {
  const { labels, getLabelForColor, updateLabels, updateLoading } =
    useCalendarColorLabels();
  // Étiquettes : « Modifier » le calendrier exigé par l'API, quel que soit
  // l'écran qui ouvre la fiche (calendrier, rappel client…)
  const { canDo, isReady } = useMyPermissions();
  const canManageLabels =
    canEditLabels && (!isReady || canDo("calendar", "edit"));
  // Événement externe, ou rôle sans droit d'enregistrer cet événement
  const isReadOnly = event?.isReadOnly || !canEdit;

  // State pour la modal d'édition/ajout d'étiquette
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [labelEditIndex, setLabelEditIndex] = useState(null); // null = ajout, number = édition
  const [labelDialogColor, setLabelDialogColor] = useState("#3B82F6");
  const [labelDialogText, setLabelDialogText] = useState("");
  // Menu des étiquettes (ligne « Étiquette »)
  const [labelMenuOpen, setLabelMenuOpen] = useState(false);
  const eventSource = event?.source || "newbi";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(() => new Date());
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_END_TIME);
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [color, setColor] = useState("#3B82F6");
  // Événement Newbi de déclaration (« VAT », « URSSAF ») ou ordinaire (null)
  const [declarationKind, setDeclarationKind] = useState(null);
  // Type créé par l'espace (« Rendez-vous client »…), ou null
  const [eventTypeId, setEventTypeId] = useState(null);
  // Fenêtre d'ajout / de modification d'un type d'événement
  const [typeDialog, setTypeDialog] = useState(null);
  const [assignedMembers, setAssignedMembers] = useState([]);
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

  // Déclarations proposées selon la forme juridique de l'espace (TVA pour
  // une société, Urssaf pour un micro-entrepreneur…)
  const { organization } = useWorkspace();
  // Toujours les mêmes choix : un type ne disparaît jamais de la fenêtre,
  // seul l'ordre suit l'espace (les déclarations conseillées en premier)
  const typeOptions = useMemo(
    () => [
      { kind: null, label: "Événement" },
      ...declarationPresetsFor(organization),
    ],
    [organization],
  );
  const filingSite = declarationFilingSite(declarationKind);

  // Types créés par l'espace, à côté des déclarations Newbi
  const {
    types: customTypes,
    updateTypes,
    updateLoading: typesSaving,
  } = useCalendarEventTypes();
  const selectedCustomType = customTypes.find(
    (type) => type.id === eventTypeId,
  );
  const currentLabel = labels.find((entry) => entry.color === color);

  // Événement sur plusieurs jours : la date de fin s'affiche
  const multiDay = differenceInCalendarDays(endDate, startDate) > 0;

  // Changement de type : titre, description, journée entière et couleur du
  // type, sans écraser ce que l'utilisateur a déjà écrit
  const applyType = (selection) => {
    const patch = typeSelectionPatch({
      selection,
      current: { title, description },
      customTypes,
    });
    setDeclarationKind(patch.declarationKind);
    setEventTypeId(patch.eventTypeId);
    if (patch.title !== undefined) setTitle(patch.title);
    if (patch.description !== undefined) setDescription(patch.description);
    if (patch.allDay !== undefined) setAllDay(patch.allDay);
    if (patch.color !== undefined) setColor(patch.color);
    setFieldErrors((prev) => ({ ...prev, title: null }));
  };

  const openTypeDialog = (type = null) =>
    setTypeDialog({
      id: type?.id || null,
      name: type?.name || "",
      color: type?.color || "#3B82F6",
      allDay: Boolean(type?.allDay),
    });

  const saveTypeDialog = async () => {
    const name = typeDialog.name.trim();
    if (!name) return;
    const entry = {
      id: typeDialog.id || newEventTypeId(),
      name,
      color: typeDialog.color,
      allDay: typeDialog.allDay,
    };
    const nextTypes = typeDialog.id
      ? customTypes.map((type) => (type.id === entry.id ? entry : type))
      : [...customTypes, entry];
    const saved = await updateTypes(nextTypes);
    if (!saved?.success) return;
    setTypeDialog(null);
    // Nouveau type : choisi aussitôt pour cet événement
    if (!typeDialog.id) applyType({ eventType: entry });
  };

  const deleteTypeDialog = async () => {
    const saved = await updateTypes(
      customTypes.filter((type) => type.id !== typeDialog.id),
    );
    if (!saved?.success) return;
    if (eventTypeId === typeDialog.id) setEventTypeId(null);
    setTypeDialog(null);
  };

  // Étiquette à ajouter (index null) ou à modifier, depuis le menu
  const openLabelDialog = (index) => {
    setLabelMenuOpen(false);
    setLabelEditIndex(index);
    setLabelDialogColor(index === null ? "#3B82F6" : labels[index].color);
    setLabelDialogText(index === null ? "" : labels[index].label);
    setLabelDialogOpen(true);
  };

  const { connections } = useCalendarConnections();
  const { pushEvent, loading: pushLoading } = usePushEventToCalendar();

  const activeConnections = connections.filter((c) => c.status === "active");

  const isAlreadySynced = (connectionId) => {
    return (
      justSyncedIds.includes(connectionId) ||
      event?.externalCalendarLinks?.some(
        (link) => link.calendarConnectionId === connectionId,
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
      let end = new Date(event.end);
      // Journée entière terminée à minuit (fin exclusive, calendriers
      // externes) : le dernier jour est la veille
      if (
        event.allDay &&
        end > start &&
        end.getHours() === 0 &&
        end.getMinutes() === 0 &&
        end.getSeconds() === 0
      ) {
        end = addDays(end, -1);
      }

      setStartDate(start);
      setEndDate(end);
      setStartTime(formatTimeForInput(start));
      setEndTime(formatTimeForInput(end));
      setAllDay(event.allDay || false);
      setLocation(event.location || "");
      setColor(event.color || "#3B82F6");
      setDeclarationKind(event.declarationKind || null);
      setEventTypeId(event.eventTypeId || null);
      setAssignedMembers(event.assignedMembers || []);
      setEmailReminder(
        event.emailReminder || { enabled: false, anticipation: null },
      );
      setError(null);
      setFieldErrors({});
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
    setStartTime(DEFAULT_START_TIME);
    setEndTime(DEFAULT_END_TIME);
    setAllDay(false);
    setLocation("");
    setColor("#3B82F6");
    setDeclarationKind(null);
    setEventTypeId(null);
    setAssignedMembers([]);
    setEmailReminder({ enabled: false, anticipation: null });
    setError(null);
    setFieldErrors({});
  };

  const formatTimeForInput = (date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = Math.floor(date.getMinutes() / 15) * 15;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  // Quarts d'heure de la journée ; 24:00 pour finir à minuit
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = StartHour; hour <= EndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 24 && minute > 0) break;
        const minutes = String(minute).padStart(2, "0");
        options.push({
          value: `${String(hour).padStart(2, "0")}:${minutes}`,
          label: `${hour}:${minutes}`,
        });
      }
    }
    return options;
  }, []);

  // Nouvelle date de début : l'événement garde son nombre de jours
  const handleStartDateSelect = (date) => {
    if (!date) return;
    const span = Math.max(differenceInCalendarDays(endDate, startDate), 0);
    setStartDate(date);
    setEndDate(addDays(date, span));
    setError(null);
    setStartDateOpen(false);
  };

  const handleEndDateSelect = (date) => {
    if (!date) return;
    setEndDate(date);
    setError(null);
    setEndDateOpen(false);
  };

  // Nouvelle heure de début : la fin suit, même durée (sur une journée)
  const handleStartTimeChange = (value) => {
    const duration = toMinutes(endTime) - toMinutes(startTime);
    const nextEnd = toMinutes(value) + duration;
    if (!multiDay && duration > 0 && nextEnd <= EndHour * 60) {
      setEndTime(toTime(nextEnd));
    }
    setStartTime(value);
    setError(null);
  };

  const eventFieldLimits = {
    title: { max: 200, label: "Le titre" },
    description: { max: 1000, label: "La description" },
    location: { max: 200, label: "Le lieu" },
  };

  const validateField = (fieldName, value) => {
    if (!value && fieldName === "title") {
      return "Le titre est requis";
    }

    if (!value) return null;

    if (detectInjectionAttempt(value)) {
      return "Caractères non autorisés détectés";
    }

    const limit = eventFieldLimits[fieldName];
    if (limit && value.length > limit.max) {
      return `${limit.label} ne peut pas dépasser ${limit.max} caractères`;
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
          `L'heure sélectionnée doit être entre ${StartHour}:00 et ${EndHour}:00`,
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
      setError("La date de fin ne peut pas être antérieure à la date de début");
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
      declarationKind,
      eventTypeId,
      assignedMembers,
      emailReminder,
    });
  };

  const handleDelete = () => {
    if (event?.id) {
      onDelete(event.id);
    }
  };

  const readOnlyReason = !event?.isReadOnly
    ? "Votre rôle permet de consulter les événements, pas de les modifier"
    : `Synchronisé depuis ${providerLabels[eventSource] || "un calendrier externe"}`;

  // Encadré de la déclaration : site où la déposer et lien direct. Le site
  // seul en titre : « autoentrepreneur.urssaf.fr » tient sur une ligne
  const declarationBanner = filingSite && (
    <div className="bg-muted/40 flex items-center gap-3 rounded-xl border px-3.5 py-2.5">
      <Landmark className="size-4 shrink-0 text-[#5a50ff]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium break-words">{filingSite.site}</p>
        <p className="text-muted-foreground text-xs">
          Déclaration et paiement en ligne
        </p>
      </div>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="bg-background h-8 shrink-0 gap-1.5 text-xs"
      >
        <a href={filingSite.url} target="_blank" rel="noopener noreferrer">
          Déclarer
          <ExternalLink className="size-3.5" aria-hidden="true" />
          <span className="sr-only">: {filingSite.label} (nouvel onglet)</span>
        </a>
      </Button>
    </div>
  );

  const deleteButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      className="text-destructive hover:text-destructive hover:bg-destructive/10 -ml-2 gap-1.5"
    >
      <Trash2 className="size-4" aria-hidden="true" />
      Supprimer
    </Button>
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          className="flex w-full flex-col gap-0 p-0 sm:w-[460px] sm:max-w-[460px]"
          onOpenAutoFocus={(e) => {
            // Nouvel événement : curseur dans le titre. Sinon, la fenêtre
            // elle-même (pas de clavier ouvert d'office sur mobile)
            if (event?.id || isReadOnly) {
              e.preventDefault();
              e.target?.focus?.();
            }
          }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>
              {isReadOnly
                ? "Détails de l'événement"
                : event?.id
                  ? "Modifier l'événement"
                  : "Nouvel événement"}
            </SheetTitle>
            {/* Lecture seule : la raison est affichée sous le titre */}
            {!isReadOnly && (
              <SheetDescription>
                {event?.id
                  ? "Modifiez les détails ci-dessous"
                  : "Remplissez les informations de votre événement"}
              </SheetDescription>
            )}
          </SheetHeader>

          {/* En-tête : couleur et titre */}
          <div className="flex items-start gap-3 pt-6 pr-12 pl-6">
            <span
              aria-hidden="true"
              className="mt-3.5 size-3 shrink-0 rounded-full transition-colors"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-0 flex-1">
              {isReadOnly ? (
                <>
                  <p className="py-1 text-xl leading-8 font-semibold break-words">
                    {title || "(sans titre)"}
                  </p>
                  <SheetDescription className="text-xs">
                    {readOnlyReason}
                  </SheetDescription>
                </>
              ) : (
                <>
                  <Input
                    id="event-title"
                    variant="ghost"
                    aria-label="Titre de l'événement"
                    aria-invalid={Boolean(fieldErrors.title)}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (fieldErrors.title) {
                        setFieldErrors((prev) => ({ ...prev, title: null }));
                      }
                    }}
                    placeholder="Ajouter un titre"
                    className="h-auto py-1 text-xl leading-8 font-semibold"
                  />
                  {fieldErrors.title && (
                    <p className="text-xs text-red-500">{fieldErrors.title}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Corps : la description prend la place restante, rien ne reste
              vide entre les champs et le pied */}
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 pt-4 pb-6">
            {error && (
              <div
                role="alert"
                className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-3 py-2 text-sm"
              >
                {error}
              </div>
            )}

            {isReadOnly ? (
              // Lecture seule (rôle sans le droit ou événement externe) :
              // valeurs en texte simple, sans champ grisé
              <>
                {selectedCustomType && (
                  <span className="text-muted-foreground inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-1 text-xs">
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-full"
                      style={{ backgroundColor: selectedCustomType.color }}
                    />
                    {selectedCustomType.name}
                  </span>
                )}

                {declarationBanner}

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <DateTile
                      label="Début"
                      date={startDate}
                      time={allDay ? null : formatHour(startDate)}
                    />
                    <DateTile
                      label="Fin"
                      date={endDate}
                      time={allDay ? null : formatHour(endDate)}
                    />
                  </div>
                  {allDay && (
                    <p className="text-muted-foreground px-1 text-sm">
                      Toute la journée
                    </p>
                  )}
                </div>

                {(location || currentLabel) && (
                  <div className="divide-y border-y">
                    {location && (
                      <PropertyRow icon={MapPin}>
                        <p className="py-3 text-sm break-words">{location}</p>
                      </PropertyRow>
                    )}

                    {/* Étiquette connue seulement (couleur d'un calendrier
                        externe sans étiquette : rien à afficher) */}
                    {currentLabel && (
                      <PropertyRow icon={Tag}>
                        <span className="inline-flex items-center gap-2 text-sm">
                          <span
                            aria-hidden="true"
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {getLabelForColor(color)}
                        </span>
                      </PropertyRow>
                    )}
                  </div>
                )}

                {description && (
                  <div className="space-y-2">
                    <p className={SECTION_LABEL}>Description</p>
                    <p className="bg-muted/30 rounded-xl border px-3 py-2.5 text-sm leading-5 break-words whitespace-pre-wrap">
                      {description}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Type : événement ordinaire, déclaration Newbi ou type de
                    l'espace */}
                <div
                  role="radiogroup"
                  aria-label="Type d'événement"
                  className="flex flex-wrap gap-1.5"
                >
                  {typeOptions.map((option) => {
                    const selected = option.kind
                      ? option.kind === declarationKind
                      : !declarationKind && !eventTypeId;
                    return (
                      <button
                        key={option.kind || "event"}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() =>
                          applyType({ declarationKind: option.kind })
                        }
                        className={cn(
                          CHIP,
                          "px-2.5 py-1",
                          selected ? CHIP_SELECTED : CHIP_IDLE,
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                  {customTypes.map((type) => {
                    const selected = type.id === eventTypeId;
                    const editable = selected && canManageLabels;
                    return (
                      <span
                        key={type.id}
                        className={cn(
                          "inline-flex items-center rounded-full border transition-colors",
                          selected ? CHIP_SELECTED : CHIP_IDLE,
                        )}
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => applyType({ eventType: type })}
                          className={cn(
                            CHIP,
                            "border-0 py-1 pl-2.5",
                            editable ? "pr-1" : "pr-2.5",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          {type.name}
                        </button>
                        {/* Crayon sur le type choisi : renommer, recolorer
                            ou supprimer le type */}
                        {editable && (
                          <button
                            type="button"
                            onClick={() => openTypeDialog(type)}
                            aria-label={`Modifier le type « ${type.name} »`}
                            className="focus-visible:ring-ring mr-1 cursor-pointer rounded-full p-1 transition-colors hover:bg-[#5a50ff]/15 focus-visible:ring-2 focus-visible:outline-none"
                          >
                            <Pencil className="size-3" aria-hidden="true" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                  {canManageLabels && (
                    <button
                      type="button"
                      onClick={() => openTypeDialog()}
                      aria-label="Ajouter un type d'événement"
                      className={cn(
                        CHIP,
                        "text-muted-foreground hover:bg-accent hover:text-foreground border-dashed px-2.5 py-1",
                      )}
                    >
                      <Plus className="size-3" aria-hidden="true" />
                      Type
                    </button>
                  )}
                </div>

                {declarationBanner}

                {/* Début et fin, toujours affichés */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <DateTile
                      label="Début"
                      picker={
                        <DatePickerButton
                          label="Date de début"
                          date={startDate}
                          open={startDateOpen}
                          onOpenChange={setStartDateOpen}
                          onSelect={handleStartDateSelect}
                        />
                      }
                      time={
                        !allDay && (
                          <TimeSelect
                            value={startTime}
                            onChange={handleStartTimeChange}
                            options={timeOptions}
                            label="Heure de début"
                          />
                        )
                      }
                    />
                    <DateTile
                      label="Fin"
                      picker={
                        <DatePickerButton
                          label="Date de fin"
                          date={endDate}
                          open={endDateOpen}
                          onOpenChange={setEndDateOpen}
                          onSelect={handleEndDateSelect}
                          disabled={{ before: startDate }}
                        />
                      }
                      time={
                        !allDay && (
                          <TimeSelect
                            value={endTime}
                            onChange={(value) => {
                              setEndTime(value);
                              setError(null);
                            }}
                            options={timeOptions}
                            label="Heure de fin"
                          />
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 px-1">
                    <Label
                      htmlFor="event-all-day"
                      className="cursor-pointer text-sm font-normal"
                    >
                      Toute la journée
                    </Label>
                    <Switch
                      id="event-all-day"
                      size="sm"
                      className="data-[state=checked]:bg-[#5a50ff]"
                      checked={allDay}
                      onCheckedChange={(checked) => {
                        setAllDay(checked === true);
                        setError(null);
                      }}
                    />
                  </div>
                </div>

                <div className="divide-y border-y">
                  {/* Lieu : sans objet pour une déclaration (gardé s'il est
                      déjà rempli) */}
                  {(!declarationKind || location) && (
                    <PropertyRow icon={MapPin}>
                      <Input
                        id="event-location"
                        variant="ghost"
                        aria-label="Lieu"
                        aria-invalid={Boolean(fieldErrors.location)}
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          if (fieldErrors.location) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              location: null,
                            }));
                          }
                        }}
                        placeholder="Ajouter un lieu"
                        className="h-12"
                      />
                      {fieldErrors.location && (
                        <p className="pb-1 text-xs text-red-500">
                          {fieldErrors.location}
                        </p>
                      )}
                    </PropertyRow>
                  )}

                  {/* Membres assignés */}
                  <PropertyRow
                    icon={Users}
                    alignTop={assignedMembers.length > 0}
                  >
                    <div className={cn(assignedMembers.length > 0 && "py-3")}>
                      <MemberSelector
                        selectedMembers={assignedMembers}
                        onMembersChange={setAssignedMembers}
                        hideLabel
                        variant="inline"
                      />
                    </div>
                  </PropertyRow>

                  {/* Étiquette : la couleur d'une déclaration est celle de
                      son type */}
                  {!declarationKind && (
                    <PropertyRow icon={Tag}>
                      <Popover
                        open={labelMenuOpen}
                        onOpenChange={setLabelMenuOpen}
                      >
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Étiquette : ${currentLabel?.label || "sans étiquette"}`}
                            className={cn(ROW_BUTTON, "-ml-1 max-w-full gap-2")}
                          >
                            <span
                              aria-hidden="true"
                              className="size-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span className="truncate">
                              {currentLabel?.label || "Sans étiquette"}
                            </span>
                            <ChevronDown
                              aria-hidden="true"
                              className="text-muted-foreground size-3.5 shrink-0"
                            />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-64 p-1">
                          {labels.map((entry, index) => {
                            const selected = entry.color === color;
                            return (
                              <div
                                key={`${entry.color}-${index}`}
                                className="hover:bg-accent flex items-center rounded-md"
                              >
                                <button
                                  type="button"
                                  aria-pressed={selected}
                                  onClick={() => {
                                    setColor(entry.color);
                                    setLabelMenuOpen(false);
                                  }}
                                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1.5 text-left text-sm"
                                >
                                  <span
                                    aria-hidden="true"
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="truncate">
                                    {entry.label}
                                  </span>
                                  {selected && (
                                    <Check
                                      aria-hidden="true"
                                      className="ml-auto size-3.5 shrink-0 text-[#5a50ff]"
                                    />
                                  )}
                                </button>
                                {canManageLabels && (
                                  <button
                                    type="button"
                                    onClick={() => openLabelDialog(index)}
                                    aria-label={`Modifier l'étiquette « ${entry.label} »`}
                                    className="text-muted-foreground/60 hover:text-foreground hover:bg-background mr-1 cursor-pointer rounded p-1 transition-colors"
                                  >
                                    <Pencil
                                      className="size-3"
                                      aria-hidden="true"
                                    />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {canManageLabels && labels.length < 20 && (
                            <>
                              <div className="bg-border my-1 h-px" />
                              <button
                                type="button"
                                onClick={() => openLabelDialog(null)}
                                className="text-muted-foreground hover:bg-accent hover:text-foreground flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                              >
                                <Plus className="size-3.5" aria-hidden="true" />
                                Nouvelle étiquette
                              </button>
                            </>
                          )}
                        </PopoverContent>
                      </Popover>
                    </PropertyRow>
                  )}

                  {/* Rappel par e-mail */}
                  <PropertyRow icon={Bell} alignTop>
                    <EmailReminderToggle
                      value={emailReminder}
                      onChange={setEmailReminder}
                      allDay={allDay}
                    />
                  </PropertyRow>
                </div>

                {/* Description : occupe la place restante de la fenêtre */}
                <div className="flex min-h-40 flex-1 flex-col gap-2">
                  <Label htmlFor="event-description" className={SECTION_LABEL}>
                    Description
                  </Label>
                  <Textarea
                    id="event-description"
                    aria-invalid={Boolean(fieldErrors.description)}
                    value={description}
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
                    className={cn(
                      "bg-muted/30 min-h-28 flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm leading-5 shadow-none focus-visible:border-[#5a50ff]/40 focus-visible:ring-2 focus-visible:ring-[#5a50ff]/15 focus-visible:ring-offset-0",
                      PLACEHOLDER,
                    )}
                  />
                  {fieldErrors.description && (
                    <p className="text-xs text-red-500">
                      {fieldErrors.description}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Envoi vers un calendrier connecté */}
            {showSyncSection && (
              <div className="space-y-2">
                <p className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                  <Send className="size-3.5" aria-hidden="true" />
                  Synchroniser avec un calendrier
                </p>
                <div className="divide-y rounded-xl border">
                  {activeConnections.map((connection) => {
                    const synced = isAlreadySynced(connection.id);
                    const isPushing = pushingConnectionId === connection.id;

                    return (
                      <div
                        key={connection.id}
                        className="flex items-center justify-between gap-3 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="text-muted-foreground shrink-0">
                            {providerIcons[connection.provider]}
                          </span>
                          <span className="truncate text-sm">
                            {connection.accountEmail ||
                              connection.accountName ||
                              providerLabels[connection.provider]}
                          </span>
                        </div>
                        {synced ? (
                          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <Check className="size-3.5" aria-hidden="true" />
                            Synchronisé
                          </span>
                        ) : connection.autoSync ? (
                          <span className="text-muted-foreground inline-flex shrink-0 items-center gap-1 text-xs">
                            <Check className="size-3.5" aria-hidden="true" />
                            Sync. auto
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pushLoading}
                            onClick={() => handlePushEvent(connection.id)}
                            className="h-7 shrink-0 text-xs"
                          >
                            {isPushing ? (
                              <Loader2 className="size-3.5 animate-spin" />
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

          {/* Pied : suppression à gauche, actions à droite */}
          <SheetFooter className="mt-0 border-t px-6 py-3">
            <div className="flex w-full items-center justify-between gap-2">
              {/* Sans « Modifier » : la suppression reste liée au seul droit
                  « Supprimer » (jamais pour un événement externe) */}
              {event?.id && canDelete && !event?.isReadOnly ? (
                deleteButton
              ) : (
                <span />
              )}
              {isReadOnly ? (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Fermer
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#5a50ff] hover:bg-[#5a50ff]/90"
                    onClick={handleSave}
                  >
                    {event?.id ? "Enregistrer" : "Créer l'événement"}
                  </Button>
                </div>
              )}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Ajout / modification d'un type d'événement */}
      <Dialog
        open={!!typeDialog}
        onOpenChange={(open) => !open && setTypeDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {typeDialog?.id
                ? "Modifier le type d'événement"
                : "Nouveau type d'événement"}
            </DialogTitle>
            <DialogDescription>
              Réutilisable pour vos prochains événements : il remplit le titre,
              la couleur et la journée entière.
            </DialogDescription>
          </DialogHeader>
          {typeDialog && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label
                  htmlFor="event-type-name"
                  className="text-sm font-medium text-foreground"
                >
                  Nom
                </label>
                <Input
                  id="event-type-name"
                  value={typeDialog.name}
                  onChange={(e) =>
                    setTypeDialog((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex : Rendez-vous client, Réunion d'équipe…"
                  maxLength={40}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Couleur
                </span>
                <ColorPicker
                  color={typeDialog.color}
                  onChange={(value) =>
                    setTypeDialog((prev) => ({ ...prev, color: value }))
                  }
                  inline
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="event-type-all-day"
                  checked={typeDialog.allDay}
                  onCheckedChange={(checked) =>
                    setTypeDialog((prev) => ({
                      ...prev,
                      allDay: checked === true,
                    }))
                  }
                  className="h-3.5 w-3.5"
                />
                <Label
                  htmlFor="event-type-all-day"
                  className="cursor-pointer text-sm font-normal"
                >
                  Toute la journée
                </Label>
              </div>
            </div>
          )}
          <DialogFooter className="flex-row justify-between sm:justify-between">
            {typeDialog?.id ? (
              <Button
                variant="ghost"
                onClick={deleteTypeDialog}
                disabled={typesSaving}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setTypeDialog(null)}
                disabled={typesSaving}
              >
                Annuler
              </Button>
              <Button
                disabled={typesSaving || !typeDialog?.name.trim()}
                onClick={saveTypeDialog}
              >
                {typesSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {typeDialog?.id ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'ajout / édition d'étiquette */}
      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {labelEditIndex !== null
                ? "Modifier l'étiquette"
                : "Nouvelle étiquette"}
            </DialogTitle>
            <DialogDescription>
              {labelEditIndex !== null
                ? "Modifiez le nom ou la couleur de cette étiquette."
                : "Choisissez une couleur et donnez un nom à cette étiquette."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Couleur
              </label>
              <ColorPicker
                color={labelDialogColor}
                onChange={setLabelDialogColor}
                inline
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nom</label>
              <Input
                value={labelDialogText}
                onChange={(e) => setLabelDialogText(e.target.value)}
                placeholder="Ex: Rendez-vous, Deadline, Personnel..."
                maxLength={30}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between">
            {labelEditIndex !== null && labels.length > 1 ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  const newLabels = labels
                    .filter((_, i) => i !== labelEditIndex)
                    .map(({ color, label }) => ({ color, label }));
                  await updateLabels(newLabels);
                  setLabelDialogOpen(false);
                }}
                disabled={updateLoading}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setLabelDialogOpen(false)}
                disabled={updateLoading}
              >
                Annuler
              </Button>
              <Button
                disabled={updateLoading || !labelDialogText.trim()}
                onClick={async () => {
                  const trimmed = labelDialogText.trim();
                  if (!trimmed) return;
                  const edited =
                    labelEditIndex !== null ? labels[labelEditIndex] : null;
                  let newLabels;
                  if (edited) {
                    newLabels = labels.map((entry, i) =>
                      i === labelEditIndex
                        ? { color: labelDialogColor, label: trimmed }
                        : { color: entry.color, label: entry.label },
                    );
                  } else {
                    newLabels = [
                      ...labels.map(({ color, label }) => ({ color, label })),
                      { color: labelDialogColor, label: trimmed },
                    ];
                  }
                  await updateLabels(newLabels);
                  // Nouvelle étiquette, ou couleur changée de l'étiquette de
                  // l'événement : l'événement la suit
                  if (!edited || edited.color === color) {
                    setColor(labelDialogColor);
                  }
                  setLabelDialogOpen(false);
                }}
              >
                {updateLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {labelEditIndex !== null ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
