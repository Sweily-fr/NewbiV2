"use client";

import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import ColorField from "./ColorField";

/** Contrôles de base des panneaux de l'éditeur de signature. */

export function Row({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {children}
      </div>
      {hint && (
        <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function ColorRow({ label, value, onChange, hint }) {
  return (
    <Row label={label} hint={hint}>
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
    <Row label={label}>
      <div className="flex items-center gap-2 w-44">
        <Slider
          className="flex-1"
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={(v) => onChange(v[0])}
        />
        <span className="w-12 text-right font-mono text-xs text-muted-foreground">
          {value}
          {unit}
        </span>
      </div>
    </Row>
  );
}

export function Choice({ value, onChange, options }) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v)}
      className="justify-end"
      size="sm"
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className="text-xs px-2.5"
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
