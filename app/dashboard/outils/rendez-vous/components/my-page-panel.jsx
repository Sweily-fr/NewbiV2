"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/lib/utils";
import {
  BOOKING_COLORS,
  embedSnippet,
  isValidBookingSlug,
  safeAccentColor,
} from "@/src/utils/booking";
import { useBookingSlugAvailability } from "@/src/hooks/useBooking";
import { SlugInput, SlugStatus } from "./booking-onboarding";
import { ColorSwatches, CopyButton, SettingsSection } from "./shared";

function initialForm(page) {
  return {
    slug: page.slug,
    title: page.title || "",
    description: page.description || "",
    accentColor: safeAccentColor(page.accentColor),
    avatarUrl: page.avatarUrl || null,
    isActive: page.isActive,
  };
}

function AvatarChoice({ selected, onSelect, disabled, src, label, fallback }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "border-[#5a50ff] bg-[#5a50ff]/5" : "hover:bg-muted/50",
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="size-9 shrink-0 rounded-full border object-cover"
        />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
          {fallback}
        </span>
      )}
      <span className="text-sm">{label}</span>
    </button>
  );
}

/**
 * Onglet Ma page : adresse, titre, description, couleur, photo, activation ;
 * lien public, « Voir ma page » et code d'intégration à copier.
 */
export function MyPagePanel({
  page,
  canEdit,
  readOnly,
  publicPrefix,
  userAvatarUrl,
  organizationLogoUrl,
  onSave,
}) {
  const [form, setForm] = useState(() => initialForm(page));
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setForm(initialForm(page));
  }, [page]);

  const slugStatus = useBookingSlugAvailability(form.slug, {
    currentSlug: page.slug,
  });
  const disabled = !canEdit || readOnly || saving;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm(page));
  const titleError = !form.title.trim()
    ? "Indiquez le nom affiché sur la page"
    : form.title.length > 120
      ? "120 caractères au maximum"
      : null;
  // Vérification en échec (réseau) : l'API refusera une adresse prise
  const slugOk =
    isValidBookingSlug(form.slug) &&
    (slugStatus === "available" || slugStatus === "error");
  const canSave = dirty && !titleError && slugOk && !disabled;
  const snippet = useMemo(() => embedSnippet(page.publicUrl), [page.publicUrl]);
  const set = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({
        slug: form.slug,
        title: form.title.trim(),
        description: form.description.trim() || null,
        accentColor: form.accentColor,
        avatarUrl: form.avatarUrl,
        isActive: form.isActive,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <SettingsSection
        title="Votre page"
        description="Ce que voient vos invités."
      >
        <div className="space-y-5">
          <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <span>
              <span className="block text-sm">Accepter des réservations</span>
              <span className="block text-xs text-muted-foreground">
                Désactivée, votre page et ses liens affichent « Page
                indisponible ».
              </span>
            </span>
            <Switch
              checked={form.isActive}
              disabled={disabled}
              onCheckedChange={set("isActive")}
            />
          </label>

          <div className="space-y-1.5">
            <Label htmlFor="rdv-page-slug" className="font-normal">
              Adresse de la page
            </Label>
            <SlugInput
              id="rdv-page-slug"
              value={form.slug}
              onChange={set("slug")}
              disabled={disabled}
              prefix={publicPrefix}
            />
            {form.slug !== page.slug ? (
              <>
                <SlugStatus status={slugStatus} />
                <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                  <TriangleAlert className="size-3.5" aria-hidden="true" />
                  Les liens déjà partagés ne fonctionneront plus.
                </p>
              </>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rdv-page-title" className="font-normal">
              Nom affiché
            </Label>
            <Input
              id="rdv-page-title"
              value={form.title}
              maxLength={120}
              disabled={disabled}
              onChange={(event) => set("title")(event.target.value)}
            />
            {titleError && dirty && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {titleError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rdv-page-description" className="font-normal">
              Présentation (facultatif)
            </Label>
            <Textarea
              id="rdv-page-description"
              rows={4}
              maxLength={1000}
              value={form.description}
              disabled={disabled}
              onChange={(event) => set("description")(event.target.value)}
              placeholder="Quelques mots sur vous et ce que vous proposez"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm">Photo</p>
            <div
              role="radiogroup"
              aria-label="Photo de la page"
              className="flex flex-col gap-2 sm:flex-row"
            >
              <AvatarChoice
                selected={!form.avatarUrl}
                onSelect={() => set("avatarUrl")(null)}
                disabled={disabled}
                src={organizationLogoUrl}
                label="Logo de l'entreprise"
                fallback="Logo"
              />
              <AvatarChoice
                selected={Boolean(form.avatarUrl)}
                onSelect={() => set("avatarUrl")(userAvatarUrl)}
                disabled={disabled || !userAvatarUrl}
                src={userAvatarUrl}
                label={
                  userAvatarUrl
                    ? "Ma photo de profil"
                    : "Pas de photo de profil"
                }
                fallback="?"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm">Couleur</p>
            <ColorSwatches
              colors={BOOKING_COLORS}
              value={form.accentColor}
              onChange={set("accentColor")}
              disabled={disabled}
              label="Couleur de la page"
            />
          </div>

          {canEdit && (
            <div className="flex justify-end gap-2 border-t pt-4">
              {dirty && (
                <Button
                  variant="outline"
                  onClick={() => setForm(initialForm(page))}
                  disabled={saving}
                  className="cursor-pointer"
                >
                  Annuler
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!canSave}
                className="cursor-pointer"
              >
                {saving && <Loader2 className="size-3.5 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          )}
        </div>
      </SettingsSection>

      <div className="space-y-4">
        <SettingsSection
          title="Partager"
          description="Envoyez ce lien ou placez-le dans votre signature."
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm">
                {page.publicUrl}
              </span>
              <CopyButton text={page.publicUrl} iconOnly variant="ghost" />
            </div>
            <Button asChild variant="outline" size="sm" className="w-full">
              <a
                href={page.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Voir ma page
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </Button>
            {!page.isActive && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Votre page est désactivée : le lien affiche « Page indisponible
                ».
              </p>
            )}
          </div>
        </SettingsSection>

        <SettingsSection
          title="Intégrer à votre site"
          description="Collez ce code dans une page de votre site : le calendrier s'affiche sans quitter votre site."
          action={
            <CopyButton
              text={snippet}
              label="Copier le code"
              toastLabel="Code copié"
            />
          }
        >
          <pre className="max-h-40 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
            {snippet}
          </pre>
        </SettingsSection>
      </div>
    </div>
  );
}
