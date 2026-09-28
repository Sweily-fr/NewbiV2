"use client";

import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Switch } from "@/src/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import ColorField from "./ColorField";

function Row({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {children}
      </div>
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ColorRow({ label, value, onChange, hint }) {
  return (
    <Row label={label} hint={hint}>
      <ColorField value={value} onChange={onChange} />
    </Row>
  );
}

function SliderRow({ label, value, min, max, step = 1, unit = "px", onChange }) {
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

function Choice({ value, onChange, options }) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v)}
      className="justify-end"
      size="sm"
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value} className="text-xs px-2.5">
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * Panneau « Style » : tout ce qui n'est pas du contenu.
 * Les valeurs possibles viennent du catalogue de l'API, la police est
 * limitée aux polices lisibles dans tous les clients mail.
 */
export default function StylePanel({ sig, update, catalog, template }) {
  const st = sig.style;
  const setStyle = (patch) => update({ style: patch });

  return (
    <div className="space-y-6">
      <Section title="Texte">
        <Row label="Police" hint="Seules ces polices s'affichent partout : Gmail, Outlook, Apple Mail.">
          <Select value={st.fontFamily} onValueChange={(v) => setStyle({ fontFamily: v })}>
            <SelectTrigger size="sm" className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(catalog?.fonts || []).map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  <span style={{ fontFamily: f.stack }}>{f.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <SliderRow
          label="Taille"
          value={st.fontSize}
          min={11}
          max={18}
          onChange={(v) => setStyle({ fontSize: v })}
        />
        <ColorRow
          label="Couleur principale"
          value={st.primaryColor}
          onChange={(v) => setStyle({ primaryColor: v })}
          hint="Accents, icônes et bouton. Une couleur de ton moyen reste lisible en mode sombre."
        />
        <ColorRow
          label="Texte"
          value={st.textColor}
          onChange={(v) => setStyle({ textColor: v })}
        />
        <ColorRow
          label="Texte secondaire"
          value={st.mutedColor}
          onChange={(v) => setStyle({ mutedColor: v })}
        />
      </Section>

      <Section title="Mise en page">
        <Row label="Espacement">
          <Choice
            value={st.spacing}
            onChange={(v) => setStyle({ spacing: v })}
            options={[
              { value: "compact", label: "Serré" },
              { value: "normal", label: "Normal" },
              { value: "airy", label: "Aéré" },
            ]}
          />
        </Row>
        {template?.supports?.align && (
          <Row label="Alignement">
            <Choice
              value={st.align}
              onChange={(v) => setStyle({ align: v })}
              options={[
                { value: "left", label: "Gauche" },
                { value: "center", label: "Centré" },
              ]}
            />
          </Row>
        )}
        <ColorRow
          label="Traits de séparation"
          value={st.separatorColor}
          onChange={(v) => setStyle({ separatorColor: v })}
        />
      </Section>

      {template?.supports?.photo !== false && (
        <Section title="Photo">
          <Row label="Forme">
            <Choice
              value={st.photoShape}
              onChange={(v) => setStyle({ photoShape: v })}
              options={[
                { value: "circle", label: "Ronde" },
                { value: "rounded", label: "Arrondie" },
                { value: "square", label: "Carrée" },
              ]}
            />
          </Row>
          <SliderRow
            label="Taille"
            value={st.photoSize}
            min={40}
            max={160}
            step={4}
            onChange={(v) => setStyle({ photoSize: v })}
          />
        </Section>
      )}

      {template?.supports?.logo !== false && (
        <Section title="Logo">
          <SliderRow
            label="Largeur"
            value={st.logoWidth}
            min={40}
            max={300}
            step={4}
            onChange={(v) => setStyle({ logoWidth: v })}
          />
        </Section>
      )}

      <Section title="Icônes">
        <Row label="Icônes de contact">
          <Switch
            checked={st.showContactIcons}
            onCheckedChange={(v) => setStyle({ showContactIcons: v })}
            className="scale-75 data-[state=checked]:bg-[#5a50ff]"
          />
        </Row>
        <Row label="Style des réseaux">
          <Choice
            value={st.iconStyle}
            onChange={(v) => setStyle({ iconStyle: v })}
            options={[
              { value: "circle", label: "Rond" },
              { value: "rounded", label: "Arrondi" },
              { value: "square", label: "Carré" },
              { value: "plain", label: "Simple" },
            ]}
          />
        </Row>
        <Row
          label="Couleur des icônes"
          hint="Les couleurs de marque et les tons moyens gardent le même rendu en mode clair et sombre."
        >
          <Choice
            value={st.iconColorMode}
            onChange={(v) => setStyle({ iconColorMode: v })}
            options={[
              { value: "brand", label: "Marque" },
              { value: "primary", label: "Principale" },
              { value: "custom", label: "Autre" },
            ]}
          />
        </Row>
        {st.iconColorMode === "custom" && (
          <ColorRow
            label="Couleur personnalisée"
            value={st.iconColor}
            onChange={(v) => setStyle({ iconColor: v })}
          />
        )}
        <SliderRow
          label="Taille des réseaux"
          value={st.iconSize}
          min={16}
          max={40}
          step={2}
          onChange={(v) => setStyle({ iconSize: v })}
        />
      </Section>
    </div>
  );
}
