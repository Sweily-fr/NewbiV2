"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, Plus } from "lucide-react";
import { Input } from "@/src/components/ui/input";
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

/** Avertissement sous un champ (lien douteux…), sans rien bloquer. */
export function Warning({ children }) {
  if (!children) return null;
  return (
    <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
      <AlertTriangle size={12} className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Champ texte dont l'avertissement (lien douteux…) s'affiche une fois la
 * saisie terminée, pas à chaque lettre tapée.
 */
export function CheckedInput({ warning, onFocus, onBlur, ...props }) {
  const [focused, setFocused] = useState(false);
  const shown = !focused && warning;
  return (
    <>
      <Input
        {...props}
        aria-invalid={shown ? true : undefined}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
      {shown && <Warning>{warning}</Warning>}
    </>
  );
}

/** Réglages sans objet (pas de photo, de logo…) : un lien pour l'ajouter. */
export function EmptyHint({ text, action, onAction }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{text}</p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#5b4fff] hover:underline cursor-pointer"
        >
          <Plus size={12} />
          {action}
        </button>
      )}
    </div>
  );
}

/**
 * Section d'un panneau : titre, description facultative, contenu.
 * `collapsible` : le titre replie la section, un résumé (`summary`)
 * rappelle alors les réglages en cours.
 */
export function Section({
  id,
  title,
  description,
  action,
  children,
  collapsible = false,
  open = true,
  onToggle,
  summary,
}) {
  if (collapsible) {
    return (
      <section id={id} className="py-5 outline-none first:pt-0 last:pb-0">
        <h3>
          <button
            type="button"
            aria-expanded={open}
            onClick={onToggle}
            className="flex w-full items-center justify-between gap-3 text-left text-lg font-medium cursor-pointer"
          >
            {title}
            <ChevronDown
              size={16}
              className={cn(
                "shrink-0 text-muted-foreground transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>
        </h3>
        {!open && summary && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {summary}
          </p>
        )}
        {open && (
          <div className="mt-4 space-y-4">
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {children}
          </div>
        )}
      </section>
    );
  }
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
      <ColorField label={label} value={value} onChange={onChange} />
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

/**
 * Longueur automatique (toute la hauteur, ajustée au contenu…) ou sur
 * mesure, en px. `value` 0 = automatique ; `initial` = valeur proposée au
 * passage en sur mesure.
 */
export function LengthRow({
  label,
  hint,
  autoLabel,
  value,
  onChange,
  min,
  max,
  step = 2,
  initial,
}) {
  const custom = value > 0;
  return (
    <Row label={label} hint={hint}>
      <Choice
        label={label}
        value={custom ? "custom" : "auto"}
        onChange={(v) => onChange(v === "custom" ? initial : 0)}
        options={[
          { value: "auto", label: autoLabel },
          { value: "custom", label: "Sur mesure" },
        ]}
      />
      {custom && (
        <div className="flex items-center gap-3 pt-1">
          <Slider
            className="flex-1"
            value={[value]}
            min={min}
            max={max}
            step={step}
            onValueChange={(v) => onChange(v[0])}
          />
          <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums text-[#242529] dark:text-white">
            {value}px
          </span>
        </div>
      )}
    </Row>
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
          "mt-1.5 flex h-4 items-center text-xs font-medium leading-4",
          selected ? "text-foreground" : "text-muted-foreground/80",
        )}
      >
        {label}
      </span>
    </button>
  );
}
