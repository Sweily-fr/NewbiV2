"use client";

import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Switch } from "@/src/components/ui/switch";
import { cn } from "@/src/lib/utils";
import ColorField from "./ColorField";

/**
 * Contrôles de base des panneaux de l'éditeur de signature, au style des
 * éditeurs de documents de la plateforme (facture, devis) : titres de
 * section, libellés au-dessus des champs, champs en pleine largeur,
 * interrupteurs dans un encadré gris.
 */

/** Libellé de champ, identique à celui des éditeurs de documents. */
export const FIELD_LABEL =
  "text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55";

export function Hint({ children }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

/** Section d'un panneau : titre, description facultative, contenu. */
export function Section({ id, title, description, action, children }) {
  return (
    <section
      id={id}
      tabIndex={id ? -1 : undefined}
      className="space-y-4 outline-none"
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-medium">{title}</h3>
          {action}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * Champ : libellé au-dessus, contrôle en pleine largeur, aide dessous.
 * `action` : lien discret à droite du libellé (« Automatique »…).
 */
export function Row({ label, hint, htmlFor, action, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={htmlFor} className={FIELD_LABEL}>
          {label}
        </Label>
        {action}
      </div>
      {children}
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

const SEGMENTS = "flex w-full gap-0.5 rounded-[9px] bg-[#F5F5F5] p-0.5 dark:bg-neutral-900";
const segment = (active) =>
  cn(
    "flex h-7 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-[color,background-color,box-shadow] duration-150 cursor-pointer",
    active
      ? "bg-white text-[#242529] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] dark:bg-[#2a2a2a] dark:text-white"
      : "text-[#606164] hover:text-[#242529] dark:text-white/55 dark:hover:text-white",
  );

/** Choix exclusif en segments, sur toute la largeur. */
export function Choice({ value, onChange, options, label }) {
  return (
    <div role="radiogroup" aria-label={label} className={SEGMENTS}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          aria-label={o.label ? undefined : o.ariaLabel}
          onClick={() => onChange(o.value)}
          className={segment(o.value === value)}
        >
          {o.icon}
          {o.label && <span className="truncate">{o.label}</span>}
        </button>
      ))}
    </div>
  );
}

/** Plusieurs choix cumulables (gras, italique…), même allure. */
export function MultiChoice({ value, onChange, options, label }) {
  const toggle = (v) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div role="group" aria-label={label} className={SEGMENTS}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value.includes(o.value)}
          aria-label={o.label ? undefined : o.ariaLabel}
          onClick={() => toggle(o.value)}
          className={segment(value.includes(o.value))}
        >
          {o.icon}
          {o.label && <span className="truncate">{o.label}</span>}
        </button>
      ))}
    </div>
  );
}

export function ColorRow({ label, value, onChange, hint, action }) {
  return (
    <Row label={label} hint={hint} action={action}>
      <ColorField value={value} onChange={onChange} />
    </Row>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "px",
  onChange,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label className={FIELD_LABEL}>{label}</Label>
        <span className="text-xs font-medium tabular-nums text-[#242529] dark:text-white">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}

/** Interrupteur dans un encadré, comme dans les paramètres de facture. */
export function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-[#F5F5F5] p-3 dark:bg-neutral-900">
      <div className="min-w-0 space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-[#5b4fff]"
      />
    </div>
  );
}

/**
 * Carte de choix visuelle (vignette + libellé), comme « Position du client
 * dans le PDF » des paramètres de facture.
 */
export function ChoiceCard({ selected, onClick, label, children, className }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn("group flex flex-col items-center cursor-pointer", className)}
    >
      <span
        className={cn(
          "flex w-full flex-1 items-center justify-center overflow-hidden rounded-md border px-3 py-2.5 shadow-xs transition-[color,box-shadow,border-color]",
          selected
            ? "border-ring bg-accent"
            : "border-input bg-background group-hover:border-ring/60",
        )}
      >
        {children}
      </span>
      <span
        className={cn(
          "mt-1.5 text-xs font-medium",
          selected ? "text-foreground" : "text-muted-foreground/80",
        )}
      >
        {label}
      </span>
    </button>
  );
}
