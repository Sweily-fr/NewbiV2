"use client";

import { Check, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/utils";
import { CARD_CLASS } from "../shared";

/** Libellé de champ, identique aux éditeurs de documents. */
export const FIELD_LABEL =
  "text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55";

/** Pastille d'étape : coche verte si complète, numéro sinon. */
export function StepIcon({ complete, step }) {
  return complete ? (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_1px_2px_rgba(16,185,129,0.3)]">
      <Check className="size-4" strokeWidth={2.75} aria-hidden />
    </span>
  ) : (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-[#c9cbd1] text-xs font-medium text-muted-foreground dark:border-[#44444A]">
      {step}
    </span>
  );
}

/** Champ : libellé (et action à droite), contrôle, aide. */
export function Field({
  label,
  htmlFor,
  action,
  hint,
  error,
  children,
  className,
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {(label || action) && (
        <div className="flex min-h-7 items-center justify-between gap-3">
          {label && (
            <Label htmlFor={htmlFor} className={FIELD_LABEL}>
              {label}
            </Label>
          )}
          {action}
        </div>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <div className="text-xs leading-5 text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

/**
 * Étape de la page de campagne, façon Brevo : titre, résumé, coche verte
 * quand c'est complet et bouton « Modifier » qui déplie le formulaire.
 */
export function SetupSection({
  id,
  step,
  title,
  complete,
  summary,
  editing = false,
  canEdit = false,
  onEdit,
  onSave,
  onCancel,
  saving = false,
  saveDisabled = false,
  aside,
  children,
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        CARD_CLASS,
        "p-4 transition-[border-color,box-shadow] sm:p-5",
        editing &&
          "border-[#5a50ff]/35 shadow-[0_0_0_3px_rgba(90,80,255,0.06)] dark:border-[#8b7fff]/40",
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <StepIcon complete={complete} step={step} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 id={`${id}-title`} className="text-[15px] leading-6 font-medium">
            {title}
          </h2>
          {!editing && summary && (
            <div className="mt-0.5 text-sm text-muted-foreground">
              {summary}
            </div>
          )}
        </div>
        {!editing && canEdit && onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="shrink-0"
          >
            Modifier
          </Button>
        )}
        {!editing && aside}
      </div>
      {editing && (
        <form
          className="mt-4 sm:pl-11"
          onSubmit={(event) => {
            event.preventDefault();
            if (!saving && !saveDisabled) onSave?.();
          }}
        >
          {children}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              disabled={saving || saveDisabled}
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={saving}
            >
              Annuler
            </Button>
          </div>
        </form>
      )}
      {!editing && children && !onEdit && (
        <div className="mt-4 sm:pl-11">{children}</div>
      )}
    </section>
  );
}
