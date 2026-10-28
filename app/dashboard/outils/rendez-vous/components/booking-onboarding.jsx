"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Check, CircleAlert, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/utils";
import { isValidBookingSlug } from "@/src/utils/booking";
import { useBookingSlugAvailability } from "@/src/hooks/useBooking";

export const SLUG_STATUS_TEXT = {
  invalid: "3 à 40 caractères : lettres minuscules, chiffres et tirets",
  checking: "Vérification…",
  available: "Adresse disponible",
  taken: "Adresse déjà prise, essayez-en une autre",
  error: "Vérification impossible pour le moment",
};

/** État de l'adresse sous le champ (disponible, prise, format…). */
export function SlugStatus({ status }) {
  if (!status || status === "idle") return null;
  const tone =
    status === "available"
      ? "text-emerald-600 dark:text-emerald-400"
      : status === "checking"
        ? "text-muted-foreground"
        : "text-red-600 dark:text-red-400";
  const Icon =
    status === "available"
      ? Check
      : status === "checking"
        ? Loader2
        : CircleAlert;
  return (
    <p
      className={cn("flex items-center gap-1.5 text-xs", tone)}
      aria-live="polite"
    >
      <Icon
        className={cn("size-3.5", status === "checking" && "animate-spin")}
        aria-hidden="true"
      />
      {SLUG_STATUS_TEXT[status]}
    </p>
  );
}

/** Champ d'adresse avec le préfixe du lien public. */
export function SlugInput({ id, value, onChange, disabled, prefix }) {
  return (
    <div className="flex h-9 items-center overflow-hidden rounded-md border bg-background focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
      <span className="shrink-0 border-r bg-muted/50 px-3 text-sm text-muted-foreground select-none">
        {prefix}
      </span>
      <input
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "")
              .slice(0, 40),
          )
        }
        spellCheck={false}
        autoComplete="off"
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none disabled:opacity-50"
      />
    </div>
  );
}

/**
 * Première visite : création de la page de réservation, adresse proposée
 * (prénom-nom) vérifiée par l'API. L'API crée aussi un premier type
 * « Rendez-vous de 30 min ».
 */
export function BookingOnboarding({
  suggestedSlug,
  defaultTitle,
  publicPrefix,
  canCreate,
  readOnlyReason,
  onCreate,
}) {
  const [slug, setSlug] = useState(suggestedSlug || "");
  const [title, setTitle] = useState(defaultTitle || "");
  const [submitting, setSubmitting] = useState(false);
  const status = useBookingSlugAvailability(slug);

  // Profil chargé après le premier rendu : propositions reprises tant que
  // rien n'a été saisi
  useEffect(() => {
    if (suggestedSlug) setSlug((current) => current || suggestedSlug);
  }, [suggestedSlug]);
  useEffect(() => {
    if (defaultTitle) setTitle((current) => current || defaultTitle);
  }, [defaultTitle]);
  const titleValid = title.trim().length > 0 && title.trim().length <= 120;
  const canSubmit =
    canCreate &&
    !readOnlyReason &&
    !submitting &&
    titleValid &&
    isValidBookingSlug(slug) &&
    // Vérification en échec (réseau) : l'API refusera une adresse prise
    (status === "available" || status === "error");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onCreate({ slug, title: title.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] items-center justify-center overflow-y-auto p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <div className="space-y-3 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#5a50ff]/10 text-[#5a50ff]">
            <CalendarCheck className="size-6" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-medium">
            Créez votre page de réservation
          </h1>
          <p className="text-sm text-muted-foreground">
            Vos clients choisissent un créneau libre dans votre agenda et
            reçoivent la confirmation par e-mail. Vous le partagez par un simple
            lien.
          </p>
        </div>

        {canCreate ? (
          <div className="space-y-4 rounded-xl border bg-background p-5">
            <div className="space-y-1.5">
              <Label htmlFor="rdv-onboarding-title">Nom affiché</Label>
              <Input
                id="rdv-onboarding-title"
                value={title}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Votre nom ou celui de votre activité"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rdv-onboarding-slug">Adresse de la page</Label>
              <SlugInput
                id="rdv-onboarding-slug"
                value={slug}
                onChange={setSlug}
                prefix={publicPrefix}
              />
              <SlugStatus status={status} />
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full cursor-pointer"
              disabled={!canSubmit}
              title={readOnlyReason || undefined}
            >
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              Créer ma page
            </Button>
            {readOnlyReason && (
              <p className="text-center text-xs text-muted-foreground">
                {readOnlyReason}
              </p>
            )}
          </div>
        ) : (
          <p className="rounded-xl border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            Votre rôle ne permet pas de créer une page de réservation dans cet
            espace. Demandez à un administrateur.
          </p>
        )}
      </form>
    </div>
  );
}
