"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, Minus, Plus, RotateCcw } from "lucide-react";
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

/**
 * Anneau de focus au clavier (jamais au clic), net sur tous les fonds :
 * boutons, listes, onglets et choix de l'éditeur, dont les composants
 * partagés n'en montrent pas. outline-solid est indispensable : sous
 * Tailwind 4, leur outline-none retire aussi le style du contour.
 */
export const FOCUS_RING =
  "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a50ff] dark:focus-visible:outline-[#8b7fff]";

/** Même anneau sur la poignée d'un curseur (Slider partagé). */
const THUMB_FOCUS_RING =
  "[&_[role=slider]:focus-visible]:outline-solid [&_[role=slider]:focus-visible]:outline-2 [&_[role=slider]:focus-visible]:outline-offset-2 [&_[role=slider]:focus-visible]:outline-[#5a50ff] dark:[&_[role=slider]:focus-visible]:outline-[#8b7fff]";

/** Valeur d'un curseur dite par les lecteurs d'écran : « 13 pixels ». */
const spokenValue = (value, unit) =>
  unit === "px" ? `${value} pixels` : unit ? `${value} ${unit}` : String(value);

/**
 * Nom et valeur dite de la poignée d'un curseur (role="slider") : le
 * Slider partagé ne transmet pas les attributs aria à sa poignée, ils sont
 * posés dessus après chaque rendu, comme ColorField le fait pour son
 * déclencheur. Renvoie la référence de l'élément qui contient le curseur.
 */
function useThumbName({ labelledBy, label, valueText }) {
  const ref = useRef(null);
  useEffect(() => {
    const thumb = ref.current?.querySelector('[role="slider"]');
    if (!thumb) return;
    if (labelledBy) thumb.setAttribute("aria-labelledby", labelledBy);
    if (label) thumb.setAttribute("aria-label", label);
    thumb.setAttribute("aria-valuetext", valueText);
  });
  return ref;
}

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
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-sm text-xs font-medium text-[#5b4fff] hover:underline cursor-pointer",
            FOCUS_RING,
          )}
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
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-md text-left text-lg font-medium cursor-pointer",
              FOCUS_RING,
            )}
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
    FOCUS_RING,
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
  hint,
  onChange,
}) {
  // « Taille, 13 pixels » au lieu de « curseur, 13 »
  const labelId = useId();
  const ref = useThumbName({
    labelledBy: labelId,
    valueText: spokenValue(value, unit),
  });
  return (
    <div ref={ref} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label id={labelId} className={FIELD_LABEL}>
          {label}
        </Label>
        <span className="text-xs font-medium tabular-nums text-[#242529] dark:text-white">
          {unit ? `${value} ${unit}` : value}
        </span>
      </div>
      <Slider
        className={THUMB_FOCUS_RING}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
      {hint && <Hint>{hint}</Hint>}
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
  const ref = useThumbName({ label, valueText: spokenValue(value, "px") });
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
        <div
          ref={ref}
          className="animate-in fade-in-0 slide-in-from-top-1 ml-1 flex items-center gap-3 border-l-2 border-[#5b4fff]/30 py-0.5 pl-4 duration-200"
        >
          <Slider
            className={cn("flex-1", THUMB_FOCUS_RING)}
            value={[value]}
            min={min}
            max={max}
            step={step}
            onValueChange={(v) => onChange(v[0])}
          />
          <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums text-[#242529] dark:text-white">
            {value} px
          </span>
        </div>
      )}
    </Row>
  );
}

/** Lien discret à droite d'un libellé, pour revenir à une valeur auto. */
export function ResetLink({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer",
        FOCUS_RING,
      )}
    >
      <RotateCcw size={11} />
      {children}
    </button>
  );
}

/**
 * Espace ajouté (+) ou retiré (−) autour d'un bloc, par pas de 4 px ;
 * « Normal » = l'espace prévu par le modèle.
 */
export function SpaceRow({ label, value, onChange, min = -24, max = 64 }) {
  const step = 4;
  const shown =
    value === 0 ? "Normal" : `${value > 0 ? "+" : "−"}${Math.abs(value)} px`;
  const set = (v) => onChange(Math.max(min, Math.min(max, v)));
  const button = cn(
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#242529] transition-colors hover:bg-white disabled:pointer-events-none disabled:opacity-30 dark:text-white dark:hover:bg-neutral-800 cursor-pointer",
    FOCUS_RING,
  );
  return (
    <Row label={label}>
      <div className={cn(SEGMENTS, "items-center")}>
        <button
          type="button"
          aria-label={`${label} : moins`}
          disabled={value <= min}
          onClick={() => set(value - step)}
          className={button}
        >
          <Minus size={14} />
        </button>
        {/* La nouvelle valeur est lue après chaque clic sur − ou + */}
        <span
          aria-live="polite"
          className="flex-1 text-center text-xs font-medium tabular-nums text-[#242529] dark:text-white"
        >
          {shown}
        </span>
        <button
          type="button"
          aria-label={`${label} : plus`}
          disabled={value >= max}
          onClick={() => set(value + step)}
          className={button}
        >
          <Plus size={14} />
        </button>
      </div>
    </Row>
  );
}

/** Intertitre d'une longue section, pour y retrouver ses réglages. */
export function Group({ title, children }) {
  return (
    <div className="space-y-4 border-t border-[#EEEFF1] pt-4 first:border-t-0 first:pt-0 dark:border-[#232323]">
      <p className="text-sm font-medium">{title}</p>
      {children}
    </div>
  );
}

/** Champ : libellé au-dessus, contrôle, aide dessous. */
export function Field({ label, children, hint, htmlFor }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className={FIELD_LABEL}>
        {label}
      </Label>
      {children}
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

/**
 * Éléments facultatifs absents, proposés en petits boutons « + Service »,
 * « + Bannière »… : le panneau s'ouvre sur l'essentiel, le reste vient à
 * la demande. `items` : [{ key, label }].
 */
export function AddChips({ items, onAdd }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onAdd(f.key)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-dashed border-[#D1D3D8] px-2 py-1 text-xs text-muted-foreground hover:border-[#9FA1A7] hover:text-foreground cursor-pointer dark:border-[#44444A]",
            FOCUS_RING,
          )}
        >
          <Plus size={12} />
          {f.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Interrupteur dans un encadré gris. `children` : ses réglages, dépliés
 * sous lui dans le même encadré une fois activé (jamais plus bas dans la
 * section, loin de ce qui les a fait apparaître).
 */
export function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  children,
}) {
  const open = Boolean(checked && children);
  return (
    <div className="overflow-hidden rounded-xl border bg-[#F5F5F5] dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-3 p-3">
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
      {open && (
        <div className="animate-in fade-in-0 slide-in-from-top-1 space-y-4 border-t bg-white p-3 duration-200 dark:bg-neutral-950">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Réglages qui dépendent du choix juste au-dessus (« Autre » couleur,
 * contour…) : en retrait, reliés à lui par un trait, dépliés en douceur.
 */
export function Nested({ children }) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-top-1 ml-1 space-y-4 border-l-2 border-[#5b4fff]/30 pl-4 duration-200">
      {children}
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
      className={cn(
        "group flex flex-col items-center rounded-md cursor-pointer",
        FOCUS_RING,
        className,
      )}
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

/**
 * Taille de la signature face à la limite de Gmail, dite en clair ; le
 * détail est en infobulle. Gmail retire une partie du code au collage (celui
 * pour Outlook) : au-delà de la limite, le refus est possible, pas certain.
 */
export function GmailSize({ chars, max }) {
  const ratio = chars / max;
  const state = ratio > 1 ? "over" : ratio > 0.9 ? "near" : "ok";
  const TEXT = {
    ok: "Taille acceptée par Gmail",
    near: "Proche de la limite de Gmail",
    over: "Peut dépasser la limite de Gmail",
  };
  const count = `${chars.toLocaleString("fr-FR")} caractères pour une limite de ${max.toLocaleString("fr-FR")}.`;
  return (
    <div
      className="flex shrink-0 items-center gap-2"
      title={
        state === "over"
          ? `${count} Gmail en retire une partie au collage (le code destiné à Outlook) et l'accepte souvent. S'il la refuse, retirez un élément (réseaux, bannière…) ou raccourcissez les textes.`
          : count
      }
    >
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className={cn(
            "h-full rounded-full",
            state === "ok" ? "bg-emerald-500" : "bg-amber-500",
          )}
          style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
        />
      </div>
      <span
        className={
          state === "ok"
            ? "text-muted-foreground"
            : "text-amber-700 dark:text-amber-300"
        }
      >
        {TEXT[state]}
      </span>
    </div>
  );
}
