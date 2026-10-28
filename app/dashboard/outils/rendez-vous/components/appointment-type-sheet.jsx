"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Info, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { Switch } from "@/src/components/ui/switch";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import {
  appointmentTypeFormErrors,
  appointmentTypeFormToInput,
  appointmentTypeToForm,
  BOOKING_COLORS,
  DURATION_PRESETS,
  durationLabel,
  locationKindLabel,
  locationOptions,
  MIN_NOTICE_OPTIONS,
  noticeLabel,
  SLOT_INTERVAL_OPTIONS,
  uniqueTypeSlug,
} from "@/src/utils/booking";
import { ColorSwatches, LocationKindIcon } from "./shared";

function Field({ id, label, hint, error, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/** Champ numérique entier (vide = null). */
function NumberInput({ id, value, onChange, min, max, suffix, placeholder }) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === "" ? null : Math.round(Number(raw)));
        }}
        className={cn(suffix && "pr-12")}
      />
      {suffix && (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}

/**
 * Création ou édition d'un type de rendez-vous. Lieux proposés selon les
 * agendas connectés (Meet avec Google, Teams avec Microsoft).
 */
export function AppointmentTypeSheet({
  open,
  type,
  connections,
  takenSlugs,
  pageSlug,
  publicBase,
  onClose,
  onSave,
}) {
  const isEdit = Boolean(type?.id);
  const [form, setForm] = useState(() =>
    appointmentTypeToForm(type, { connections }),
  );
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  // Nouveau formulaire à chaque ouverture
  useEffect(() => {
    if (!open) return;
    setForm(appointmentTypeToForm(type, { connections }));
    setSlugTouched(Boolean(type?.id));
    setShowErrors(false);
    // connections volontairement absent : pas de remise à zéro en cours de saisie
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type]);

  const otherSlugs = useMemo(
    () => (takenSlugs || []).filter((slug) => slug !== type?.slug),
    [takenSlugs, type],
  );
  const errors = useMemo(() => {
    const found = appointmentTypeFormErrors(form);
    if (!found.slug && otherSlugs.includes(form.slug)) {
      found.slug = "Un autre type utilise déjà cette adresse";
    }
    return found;
  }, [form, otherSlugs]);
  const visibleErrors = showErrors ? errors : {};
  const options = locationOptions(connections);
  const hasVideoAccount = options.some(
    (option) =>
      ["GOOGLE_MEET", "TEAMS"].includes(option.kind) && option.available,
  );

  const set = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleName = (event) => {
    const name = event.target.value;
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugTouched ? prev.slug : uniqueTypeSlug(name, otherSlugs),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setShowErrors(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const saved = await onSave(appointmentTypeFormToInput(form), type);
      if (saved) onClose();
    } finally {
      setSaving(false);
    }
  };

  const noticeChoices = MIN_NOTICE_OPTIONS.includes(form.minNoticeMinutes)
    ? MIN_NOTICE_OPTIONS
    : [...MIN_NOTICE_OPTIONS, form.minNoticeMinutes].sort((a, b) => a - b);

  return (
    <Sheet open={open} onOpenChange={(next) => !next && !saving && onClose()}>
      <SheetContent className="flex w-full flex-col p-0 sm:w-[520px] sm:max-w-[520px]">
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
          noValidate
        >
          <SheetHeader className="px-6 pt-6 pb-0">
            <SheetTitle className="text-base">
              {isEdit
                ? "Modifier le type de rendez-vous"
                : "Nouveau type de rendez-vous"}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Durée, lieu et règles de réservation de ce rendez-vous.
            </SheetDescription>
          </SheetHeader>
          <Separator className="mt-4" />

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <section className="space-y-4">
              <Field id="type-name" label="Nom" error={visibleErrors.name}>
                <Input
                  id="type-name"
                  value={form.name}
                  maxLength={120}
                  onChange={handleName}
                  placeholder="Appel découverte"
                  autoFocus={!isEdit}
                />
              </Field>
              <Field
                id="type-slug"
                label="Adresse"
                error={
                  visibleErrors.slug || (form.slug ? errors.slug : undefined)
                }
                hint={`${publicBase}/${pageSlug}/${form.slug || "…"}`}
              >
                <Input
                  id="type-slug"
                  value={form.slug}
                  spellCheck={false}
                  onChange={(event) => {
                    setSlugTouched(true);
                    set("slug")(
                      event.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "")
                        .slice(0, 40),
                    );
                  }}
                />
              </Field>
              <Field
                id="type-description"
                label="Description (facultatif)"
                error={visibleErrors.description}
              >
                <Textarea
                  id="type-description"
                  rows={3}
                  maxLength={1000}
                  value={form.description}
                  onChange={(event) => set("description")(event.target.value)}
                  placeholder="Ce que l'invité doit savoir avant de réserver"
                />
              </Field>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Durée</h3>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => set("durationMinutes")(minutes)}
                    className={cn(
                      "cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors",
                      form.durationMinutes === minutes
                        ? "border-[#5a50ff] bg-[#5a50ff]/10 text-[#5a50ff]"
                        : "hover:bg-muted/60",
                    )}
                  >
                    {durationLabel(minutes)}
                  </button>
                ))}
                <div className="w-32">
                  <NumberInput
                    id="type-duration"
                    value={form.durationMinutes}
                    onChange={(value) => set("durationMinutes")(value ?? 0)}
                    min={5}
                    max={480}
                    suffix="min"
                  />
                </div>
              </div>
              {visibleErrors.durationMinutes && (
                <p className="text-xs text-red-600">
                  {visibleErrors.durationMinutes}
                </p>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Lieu</h3>
              <div
                role="radiogroup"
                aria-label="Lieu"
                className="grid gap-2 sm:grid-cols-2"
              >
                {options.map((option) => {
                  const selected = form.locationKind === option.kind;
                  return (
                    <button
                      key={option.kind}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={!option.available && !selected}
                      onClick={() => set("locationKind")(option.kind)}
                      className={cn(
                        "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                        selected
                          ? "border-[#5a50ff] bg-[#5a50ff]/5"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <LocationKindIcon
                        kind={option.kind}
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          selected ? "text-[#5a50ff]" : "text-muted-foreground",
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {option.kind === "CUSTOM_LINK"
                            ? "Lien de visio"
                            : locationKindLabel(option.kind)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {option.available
                            ? option.hint
                            : "Agenda non connecté"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {!hasVideoAccount && (
                <p className="flex gap-2 text-xs text-muted-foreground">
                  <Info
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    Connectez Google Agenda ou Outlook depuis le{" "}
                    <Link
                      href="/dashboard/calendar?agendas=1"
                      className="text-[#5a50ff] hover:underline"
                    >
                      Calendrier
                    </Link>{" "}
                    pour créer automatiquement un lien Meet ou Teams à chaque
                    réservation.
                  </span>
                </p>
              )}
              {form.locationKind === "CUSTOM_LINK" && (
                <Field
                  id="type-location"
                  label="Lien de la visioconférence"
                  error={visibleErrors.locationValue}
                >
                  <Input
                    id="type-location"
                    type="url"
                    value={form.locationValue}
                    onChange={(event) =>
                      set("locationValue")(event.target.value)
                    }
                    placeholder="https://zoom.us/j/…"
                  />
                </Field>
              )}
              {form.locationKind === "IN_PERSON" && (
                <Field
                  id="type-location"
                  label="Adresse du rendez-vous"
                  error={visibleErrors.locationValue}
                >
                  <Input
                    id="type-location"
                    value={form.locationValue}
                    maxLength={300}
                    onChange={(event) =>
                      set("locationValue")(event.target.value)
                    }
                    placeholder="12 rue de la Paix, 75002 Paris"
                  />
                </Field>
              )}
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-medium">Règles de réservation</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="type-interval" label="Un créneau toutes les">
                  <Select
                    value={String(form.slotIntervalMinutes)}
                    onValueChange={(value) =>
                      set("slotIntervalMinutes")(Number(value))
                    }
                  >
                    <SelectTrigger id="type-interval" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOT_INTERVAL_OPTIONS.map((minutes) => (
                        <SelectItem key={minutes} value={String(minutes)}>
                          {durationLabel(minutes)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="type-notice" label="Préavis minimum">
                  <Select
                    value={String(form.minNoticeMinutes)}
                    onValueChange={(value) =>
                      set("minNoticeMinutes")(Number(value))
                    }
                  >
                    <SelectTrigger id="type-notice" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {noticeChoices.map((minutes) => (
                        <SelectItem key={minutes} value={String(minutes)}>
                          {noticeLabel(minutes)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  id="type-buffer-before"
                  label="Marge avant"
                  hint="Temps libre gardé avant le rendez-vous"
                  error={visibleErrors.bufferBeforeMinutes}
                >
                  <NumberInput
                    id="type-buffer-before"
                    value={form.bufferBeforeMinutes}
                    onChange={(value) => set("bufferBeforeMinutes")(value ?? 0)}
                    min={0}
                    max={240}
                    suffix="min"
                  />
                </Field>
                <Field
                  id="type-buffer-after"
                  label="Marge après"
                  hint="Temps libre gardé après le rendez-vous"
                  error={visibleErrors.bufferAfterMinutes}
                >
                  <NumberInput
                    id="type-buffer-after"
                    value={form.bufferAfterMinutes}
                    onChange={(value) => set("bufferAfterMinutes")(value ?? 0)}
                    min={0}
                    max={240}
                    suffix="min"
                  />
                </Field>
                <Field
                  id="type-horizon"
                  label="Réservable jusqu'à"
                  error={visibleErrors.maxDaysAhead}
                >
                  <NumberInput
                    id="type-horizon"
                    value={form.maxDaysAhead}
                    onChange={(value) => set("maxDaysAhead")(value ?? 0)}
                    min={1}
                    max={365}
                    suffix="jours"
                  />
                </Field>
                <Field
                  id="type-max-per-day"
                  label="Maximum par jour"
                  hint="Vide : sans limite"
                  error={visibleErrors.maxPerDay}
                >
                  <NumberInput
                    id="type-max-per-day"
                    value={form.maxPerDay}
                    onChange={set("maxPerDay")}
                    min={1}
                    max={100}
                    placeholder="Sans limite"
                  />
                </Field>
              </div>
              <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <span>
                  <span className="block text-sm">
                    Téléphone de l&apos;invité obligatoire
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {form.locationKind === "PHONE"
                      ? "Toujours demandé pour un rendez-vous par téléphone"
                      : "Sinon, il est facultatif"}
                  </span>
                </span>
                <Switch
                  checked={form.locationKind === "PHONE" || form.requirePhone}
                  disabled={form.locationKind === "PHONE"}
                  onCheckedChange={set("requirePhone")}
                />
              </label>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Couleur</h3>
              <ColorSwatches
                colors={BOOKING_COLORS}
                value={form.color}
                onChange={set("color")}
                label="Couleur du type"
              />
            </section>

            <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <span>
                <span className="block text-sm">Actif</span>
                <span className="block text-xs text-muted-foreground">
                  Désactivé, il disparaît de votre page et son lien ne
                  fonctionne plus.
                </span>
              </span>
              <Switch
                checked={form.isActive}
                onCheckedChange={set("isActive")}
              />
            </label>
          </div>

          <SheetFooter className="mt-0 border-t px-6 py-4">
            <div className="flex w-full justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="cursor-pointer"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                className="cursor-pointer"
              >
                {saving && <Loader2 className="size-3.5 animate-spin" />}
                {isEdit ? "Enregistrer" : "Créer le type"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
