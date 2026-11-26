"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Info, Loader2, Trash2 } from "lucide-react";
import {
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
import { cn } from "@/src/lib/utils";
import {
  BOOKING_COLORS,
  locationKindLabel,
  timeZoneLabel,
  uniqueTypeSlug,
} from "@/src/utils/booking";
import {
  addMinutesToInput,
  eurosToCents,
  EVENT_LIMITS,
  EVENT_LOCATION_KINDS,
  eventFormErrors,
  eventFormToInput,
  eventImageError,
  eventTypeToForm,
  formatCents,
} from "@/src/utils/booking-events";
import {
  useEventMutations,
  useEventPaymentMethods,
} from "@/src/hooks/useBooking";
import { ColorSwatches, LocationKindIcon } from "./shared";
import { DateTimeField } from "./date-time-fields";

const PROVIDER_NAMES = { stripe: "Stripe", paypal: "PayPal", sumup: "SumUp" };

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

function IntegerInput({ id, value, onChange, min, max, placeholder, suffix }) {
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
        className={cn(suffix && "pr-16")}
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
 * Image d'un événement : aperçu, envoi immédiat (l'URL renvoyée est gardée
 * dans le formulaire), remplacement et retrait.
 */
function EventImageField({ id, label, hint, kind, value, onChange, wide }) {
  const inputRef = useRef(null);
  const { uploadImage } = useEventMutations();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const localError = eventImageError(file);
    if (localError) {
      setError(localError);
      return;
    }
    setError("");
    setUploading(true);
    try {
      const result = await uploadImage(file, kind);
      if (result.error) setError(result.error);
      else onChange(result.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-lg border bg-muted/30",
          wide ? "aspect-[3/1]" : "aspect-[4/3] max-w-[220px]",
        )}
      >
        {value ? (
          // Image R2 d'un domaine quelconque : simple balise
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={`Aperçu : ${label.toLowerCase()}`}
            className="size-full object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex size-full cursor-pointer flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50"
          >
            <ImagePlus className="size-5" aria-hidden="true" />
            Ajouter une image
          </button>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            <span className="sr-only">Envoi en cours</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        onChange={handleFile}
      />
      <div className="flex flex-wrap items-center gap-2">
        {value && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="cursor-pointer"
            >
              Remplacer
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => onChange(null)}
              className="cursor-pointer text-red-600 hover:text-red-700"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Retirer
            </Button>
          </>
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/**
 * Création ou édition d'un événement (billetterie) : dates dans le fuseau
 * de la page, images, détails, places, prix en euros (envoyé en centimes),
 * maximum par commande, clôture des inscriptions et lieu.
 */
export function EventTypeForm({
  open,
  type,
  timeZone,
  takenSlugs,
  pageSlug,
  publicBase,
  kindSwitch,
  onClose,
  onSave,
}) {
  const isEdit = Boolean(type?.id);
  const [form, setForm] = useState(() => eventTypeToForm(type, { timeZone }));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const { methods, loaded: methodsLoaded } = useEventPaymentMethods({
    skip: !open,
  });

  useEffect(() => {
    if (!open) return;
    setForm(eventTypeToForm(type, { timeZone }));
    setSlugTouched(Boolean(type?.id));
    setShowErrors(false);
  }, [open, type, timeZone]);

  const otherSlugs = useMemo(
    () => (takenSlugs || []).filter((slug) => slug !== type?.slug),
    [takenSlugs, type],
  );
  const errors = useMemo(() => {
    const found = eventFormErrors(form, {
      timeZone,
      isCreation: !isEdit,
      seatsTaken: type?.seatsTaken || 0,
    });
    if (!found.slug && otherSlugs.includes(form.slug)) {
      found.slug = "Un autre type utilise déjà cette adresse";
    }
    return found;
  }, [form, otherSlugs, timeZone, isEdit, type]);
  const visibleErrors = showErrors ? errors : {};

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

  // Début saisi sans fin : fin proposée deux heures plus tard
  const handleStart = (value) => {
    setForm((prev) => ({
      ...prev,
      startAt: value,
      endAt:
        prev.endAt && prev.endAt > value
          ? prev.endAt
          : addMinutesToInput(value, 120),
    }));
  };

  const cents = eurosToCents(form.priceText);
  const isPaid = cents > 0;
  const noPaymentMethod = isPaid && methodsLoaded && methods.length === 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setShowErrors(true);
    if (Object.keys(errors).length > 0) {
      const first = Object.keys(errors)[0];
      document.getElementById(`event-${first}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const saved = await onSave(
        eventFormToInput(form, {
          timeZone,
          isCreation: !isEdit,
          initialPriceCents: type?.price?.amount,
        }),
        type,
      );
      if (saved) onClose();
    } finally {
      setSaving(false);
    }
  };

  const zoneHint = `Heures dans le fuseau de votre page : ${timeZoneLabel(timeZone)}`;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col"
      noValidate
    >
      <SheetHeader className="px-6 pt-6 pb-0">
        <SheetTitle className="text-base">
          {isEdit ? "Modifier l'événement" : "Nouveau type de rendez-vous"}
        </SheetTitle>
        <SheetDescription className="text-xs">
          Une date précise, des places, et un billet à QR code pour chaque
          inscrit.
        </SheetDescription>
        {kindSwitch}
      </SheetHeader>
      <Separator className="mt-4" />

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <section className="space-y-4">
          <Field id="event-name" label="Titre" error={visibleErrors.name}>
            <Input
              id="event-name"
              value={form.name}
              maxLength={EVENT_LIMITS.name}
              onChange={handleName}
              placeholder="Soirée de lancement"
              autoFocus={!isEdit}
            />
          </Field>
          <Field
            id="event-slug"
            label="Adresse"
            error={visibleErrors.slug || (form.slug ? errors.slug : undefined)}
            hint={`${publicBase}/${pageSlug}/${form.slug || "…"}`}
          >
            <Input
              id="event-slug"
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
            id="event-description"
            label="Description courte (facultatif)"
            error={visibleErrors.description}
          >
            <Textarea
              id="event-description"
              rows={2}
              maxLength={EVENT_LIMITS.description}
              value={form.description}
              onChange={(event) => set("description")(event.target.value)}
              placeholder="Une phrase pour donner envie de venir"
            />
          </Field>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-medium">Date et heure</h3>
          <div className="grid gap-4">
            <Field
              id="event-startAt"
              label="Début"
              error={visibleErrors.startAt}
            >
              <DateTimeField
                id="event-startAt"
                label="Début"
                value={form.startAt}
                invalid={Boolean(visibleErrors.startAt)}
                onChange={handleStart}
              />
            </Field>
            <Field id="event-endAt" label="Fin" error={visibleErrors.endAt}>
              <DateTimeField
                id="event-endAt"
                label="Fin"
                value={form.endAt}
                invalid={Boolean(visibleErrors.endAt)}
                defaultTime={form.startAt?.split("T")[1] || "20:00"}
                isDisabledDay={(day) =>
                  Boolean(form.startAt) &&
                  day < new Date(`${form.startAt.split("T")[0]}T00:00`)
                }
                onChange={set("endAt")}
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">{zoneHint}</p>
          <Field
            id="event-registrationClosesAt"
            label="Clôture des inscriptions (facultatif)"
            hint="Vide : inscriptions ouvertes jusqu'au début de l'événement"
            error={visibleErrors.registrationClosesAt}
          >
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <DateTimeField
                  id="event-registrationClosesAt"
                  label="Clôture des inscriptions"
                  value={form.registrationClosesAt}
                  invalid={Boolean(visibleErrors.registrationClosesAt)}
                  defaultTime={form.startAt?.split("T")[1] || "18:00"}
                  isDisabledDay={(day) =>
                    Boolean(form.startAt) &&
                    day > new Date(`${form.startAt.split("T")[0]}T23:59`)
                  }
                  onChange={set("registrationClosesAt")}
                />
              </div>
              {form.registrationClosesAt && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => set("registrationClosesAt")("")}
                  className="cursor-pointer"
                >
                  Effacer
                </Button>
              )}
            </div>
          </Field>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-medium">Images</h3>
          <EventImageField
            id="event-coverImageUrl"
            label="Image de fond"
            hint="Bandeau en haut de la page. Format large, JPG, PNG ou WebP, 5 Mo au maximum."
            kind="COVER"
            wide
            value={form.coverImageUrl}
            onChange={set("coverImageUrl")}
          />
          <EventImageField
            id="event-imageUrl"
            label="Image de l'événement"
            hint="Affiche ou visuel, carré ou 4/3. 5 Mo au maximum."
            kind="IMAGE"
            value={form.imageUrl}
            onChange={set("imageUrl")}
          />
        </section>

        <section className="space-y-3">
          <Field
            id="event-details"
            label="Détails de l'événement (facultatif)"
            hint={`Programme, accès, ce qu'il faut apporter… ${form.details.length} / 10 000`}
            error={visibleErrors.details}
          >
            <Textarea
              id="event-details"
              rows={6}
              maxLength={EVENT_LIMITS.details}
              value={form.details}
              onChange={(event) => set("details")(event.target.value)}
              placeholder={
                "19 h : accueil\n19 h 30 : présentation\n21 h : cocktail"
              }
            />
          </Field>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium">Lieu</h3>
          <div
            role="radiogroup"
            aria-label="Lieu"
            className="grid gap-2 sm:grid-cols-2"
          >
            {EVENT_LOCATION_KINDS.map((kind) => {
              const selected = form.locationKind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => set("locationKind")(kind)}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                    selected
                      ? "border-[#5a50ff] bg-[#5a50ff]/5"
                      : "hover:bg-muted/50",
                  )}
                >
                  <LocationKindIcon
                    kind={kind}
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      selected ? "text-[#5a50ff]" : "text-muted-foreground",
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {kind === "CUSTOM_LINK"
                        ? "En ligne"
                        : locationKindLabel(kind)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {kind === "CUSTOM_LINK"
                        ? "Lien envoyé aux inscrits seulement"
                        : "À une adresse"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <Field
            id="event-locationValue"
            label={
              form.locationKind === "CUSTOM_LINK"
                ? "Lien de l'événement"
                : "Adresse de l'événement"
            }
            error={visibleErrors.locationValue}
          >
            <Input
              id="event-locationValue"
              type={form.locationKind === "CUSTOM_LINK" ? "url" : "text"}
              value={form.locationValue}
              maxLength={300}
              onChange={(event) => set("locationValue")(event.target.value)}
              placeholder={
                form.locationKind === "CUSTOM_LINK"
                  ? "https://zoom.us/j/…"
                  : "12 rue de la Paix, 75002 Paris"
              }
            />
          </Field>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-medium">Places et prix</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="event-capacity"
              label="Nombre de places"
              hint={
                type?.seatsTaken
                  ? `Vide : sans limite. ${type.seatsTaken} déjà prises.`
                  : "Vide : sans limite"
              }
              error={visibleErrors.capacity}
            >
              <IntegerInput
                id="event-capacity"
                value={form.capacity}
                onChange={set("capacity")}
                min={1}
                max={EVENT_LIMITS.capacityMax}
                placeholder="Sans limite"
              />
            </Field>
            <Field
              id="event-maxPerOrder"
              label="Places par inscription"
              hint="Au plus 10"
              error={visibleErrors.maxPerOrder}
            >
              <IntegerInput
                id="event-maxPerOrder"
                value={form.maxPerOrder}
                onChange={(value) => set("maxPerOrder")(value ?? 0)}
                min={1}
                max={EVENT_LIMITS.maxPerOrderMax}
                suffix="max."
              />
            </Field>
            <Field
              id="event-price"
              label="Prix par place (TTC)"
              hint={
                isPaid && !Number.isNaN(cents)
                  ? `${formatCents(cents)} par place, payé en ligne à l'inscription`
                  : "Vide : gratuit"
              }
              error={visibleErrors.price}
            >
              <div className="relative">
                <Input
                  id="event-price"
                  inputMode="decimal"
                  value={form.priceText}
                  onChange={(event) => set("priceText")(event.target.value)}
                  placeholder="Gratuit"
                  className="pr-8"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                  €
                </span>
              </div>
            </Field>
          </div>
          {isPaid && (
            <p
              className={cn(
                "flex gap-2 rounded-lg px-3 py-2 text-xs",
                noPaymentMethod
                  ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-muted/50 text-muted-foreground",
              )}
            >
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                {noPaymentMethod
                  ? "Connectez Stripe, PayPal ou SumUp (Paramètres > Applications) pour vendre des billets."
                  : methods.length > 0
                    ? `Paiement encaissé directement sur votre compte ${methods
                        .map((method) => PROVIDER_NAMES[method] || method)
                        .join(", ")}, sans commission Newbi.`
                    : "Paiement encaissé directement sur votre compte, sans commission Newbi."}
              </span>
            </p>
          )}
          <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <span>
              <span className="block text-sm">
                Téléphone du participant obligatoire
              </span>
              <span className="block text-xs text-muted-foreground">
                Sinon, il est facultatif
              </span>
            </span>
            <Switch
              checked={form.requirePhone}
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
            label="Couleur de l'événement"
          />
        </section>

        <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <span>
            <span className="block text-sm">Inscriptions ouvertes</span>
            <span className="block text-xs text-muted-foreground">
              Désactivé, l&apos;événement disparaît de votre page et son lien ne
              fonctionne plus. Les billets déjà émis restent valables.
            </span>
          </span>
          <Switch checked={form.isActive} onCheckedChange={set("isActive")} />
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
            {isEdit ? "Enregistrer" : "Créer l'événement"}
          </Button>
        </div>
      </SheetFooter>
    </form>
  );
}
