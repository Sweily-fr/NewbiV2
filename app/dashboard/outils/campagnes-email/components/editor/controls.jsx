"use client";

import { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { ColorPicker } from "@/src/components/ui/color-picker";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Switch } from "@/src/components/ui/switch";
import { cn } from "@/src/lib/utils";
import { FOCUS_RING } from "../shared";

/**
 * Contrôles des panneaux de l'éditeur de campagne, au style de l'éditeur de
 * signature : libellés au-dessus, contrôles pleine largeur, choix en
 * segments, sélecteur de couleur partagé.
 */

export const FIELD_LABEL =
  "text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55";

/** Section d'un panneau : intertitre, puis ses réglages. */
export function PanelSection({ title, children, className }) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 border-t border-[#EEEFF1] px-5 py-5 first:border-t-0 dark:border-[#232323]",
        className,
      )}
    >
      {title && <h3 className="text-[13px] font-medium">{title}</h3>}
      {children}
    </section>
  );
}

/** Champ : libellé (et lien à droite), contrôle, aide. */
export function Row({ label, htmlFor, action, hint, children }) {
  return (
    <div className="flex flex-col gap-2">
      {(label || action) && (
        <div className="flex min-h-5 items-center justify-between gap-3">
          {label && (
            <Label htmlFor={htmlFor} className={FIELD_LABEL}>
              {label}
            </Label>
          )}
          {action}
        </div>
      )}
      {children}
      {hint && (
        <div className="text-xs leading-5 text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}

const SEGMENTS =
  "flex w-full gap-0.5 rounded-[9px] bg-[#F5F5F5] p-0.5 dark:bg-neutral-900";
const segment = (active) =>
  cn(
    "flex h-7 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-[color,background-color,box-shadow] duration-150 disabled:cursor-not-allowed disabled:opacity-40",
    FOCUS_RING,
    active
      ? "bg-white text-[#242529] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] dark:bg-[#2a2a2a] dark:text-white"
      : "text-[#606164] hover:text-[#242529] dark:text-white/55 dark:hover:text-white",
  );

/** Choix exclusif en segments ({ value, label?, icon?, ariaLabel? }). */
export function Choice({ value, onChange, options, label, disabled = false }) {
  const onKeyDown = (event) => {
    const radios = [...event.currentTarget.querySelectorAll('[role="radio"]')];
    const at = radios.indexOf(event.target);
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
      event.key
    ];
    if (at < 0 || !step) return;
    event.preventDefault();
    const next = radios[(at + step + radios.length) % radios.length];
    next.focus();
    next.click();
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={SEGMENTS}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label ? undefined : option.ariaLabel}
            title={option.label ? undefined : option.ariaLabel}
            tabIndex={
              active ||
              (!options.some((o) => o.value === value) && option === options[0])
                ? 0
                : -1
            }
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={segment(active)}
          >
            {option.icon}
            {option.label && <span className="truncate">{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Curseur avec sa valeur à droite du libellé. */
export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "px",
  onChange,
  hint,
  format,
}) {
  const shown = format ? format(value) : `${value}${unit ? ` ${unit}` : ""}`;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className={FIELD_LABEL}>{label}</span>
        <span className="text-xs font-medium tabular-nums text-[#242529] dark:text-white">
          {shown}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        thumbLabel={label}
        onValueChange={(values) => onChange(values[0])}
        className="[&_[role=slider]]:ring-1 [&_[role=slider]]:ring-black/10"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const norm = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

/**
 * Couleur : pastille et code, ouvre le sélecteur partagé. Le sélecteur émet
 * un changement à l'ouverture (arrondi de conversion) : seul un changement
 * après une vraie interaction est retenu. `inherited` : couleur affichée
 * quand la valeur suit le style général (value null).
 */
export function ColorField({
  value,
  onChange,
  label,
  inherited,
  align = "end",
}) {
  const interacted = useRef(false);
  const wrapper = useRef(null);
  const shown = norm(value || inherited);
  const auto = !value && Boolean(inherited);

  useEffect(() => {
    const trigger = wrapper.current?.querySelector("button");
    if (trigger) {
      trigger.setAttribute(
        "aria-label",
        `${label ? `${label} : ` : "Couleur "}${auto ? "automatique" : shown || "aucune"}`,
      );
    }
  });

  return (
    <div
      ref={wrapper}
      className="group relative w-full"
      onPointerDownCapture={() => {
        interacted.current = true;
      }}
      onKeyDownCapture={() => {
        interacted.current = true;
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none flex h-8 w-full items-center gap-2 rounded-[9px] border border-[#e6e7ea] px-2.5 transition-[border] duration-[80ms] group-hover:border-[#D1D3D8] group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-[#5a50ff] group-has-[:focus-visible]:outline-solid dark:border-[#2E2E32] dark:group-hover:border-[#44444A]"
      >
        <span
          className="size-4 shrink-0 rounded border border-black/10 dark:border-white/15"
          style={{ backgroundColor: shown || "transparent" }}
        />
        <span className="font-mono text-xs text-[#242529] uppercase dark:text-white">
          {shown.replace("#", "")}
        </span>
        {auto && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            Automatique
          </span>
        )}
      </div>
      <ColorPicker
        color={value || inherited || "#000000"}
        onChange={(next) => {
          if (!interacted.current) return;
          if (norm(next) === norm(value)) return;
          onChange(norm(next));
        }}
        align={align}
        className="absolute inset-0 h-full w-full opacity-0"
      />
    </div>
  );
}

/**
 * Couleur d'un réglage, avec retour au style général (« Automatique »)
 * quand `inherited` est fourni et une couleur choisie.
 */
export function ColorRow({ label, value, inherited, onChange, hint }) {
  return (
    <Row
      label={label}
      hint={hint}
      action={
        inherited && value ? (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground hover:text-foreground",
              FOCUS_RING,
            )}
            title="Revenir à la couleur du style général"
          >
            <RotateCcw className="size-3" aria-hidden />
            Automatique
          </button>
        ) : null
      }
    >
      <ColorField
        label={label}
        value={value}
        inherited={inherited}
        onChange={onChange}
      />
    </Row>
  );
}

/** Interrupteur sur une ligne (libellé à gauche). */
export function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 data-[state=checked]:bg-[#5a50ff]"
      />
    </div>
  );
}

const SIDES = [
  ["top", "Haut"],
  ["bottom", "Bas"],
  ["left", "Gauche"],
  ["right", "Droite"],
];

/** Marges d'un bloc : quatre côtés, en px (0 à 80). */
export function PaddingRow({ value, onChange }) {
  const set = (side, raw) => {
    const number = Math.round(Number(raw));
    if (!Number.isFinite(number)) return;
    onChange({ [side]: Math.min(80, Math.max(0, number)) });
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      {SIDES.map(([side, label]) => (
        <label
          key={side}
          className="flex h-8 items-center gap-2 rounded-[9px] border border-[#e6e7ea] pr-2 pl-2.5 transition-[border] focus-within:border-[#D1D3D8] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A]"
        >
          <span className="w-12 shrink-0 text-xs text-muted-foreground">
            {label}
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={80}
            step={4}
            value={value?.[side] ?? 0}
            onChange={(event) => set(side, event.target.value)}
            className="w-full min-w-0 bg-transparent text-right text-sm font-medium tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label={`Marge ${label.toLowerCase()} (px)`}
          />
          <span className="text-xs text-muted-foreground">px</span>
        </label>
      ))}
    </div>
  );
}
