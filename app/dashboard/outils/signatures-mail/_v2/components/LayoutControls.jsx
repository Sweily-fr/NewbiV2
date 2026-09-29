"use client";

import { Switch } from "@/src/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Choice, Row } from "./controls";

/**
 * Contrôles de mise en page, partagés par l'onglet Style et les panneaux
 * d'élément. Chaque contrôle ne s'affiche que s'il a un effet avec les
 * réglages en cours (ex. l'alignement vertical n'existe que pour une photo
 * à côté du texte) : les mêmes règles que le générateur (layout.js).
 */

/** Réglages effectifs, mêmes règles que effectiveLayout côté API. */
export function layoutState(st) {
  const zone = st.identityZone;
  const photoSide = zone !== "band-left" && st.photoPosition !== "top";
  return {
    zone,
    photoSide,
    plain: zone === "plain",
    boxed: st.frame === "outline" || st.frame === "soft",
    framed: st.frame !== "none",
  };
}

/** Choix court (≤ 3) en boutons, plus long en liste. */
export function Pick({ label, hint, value, onChange, options }) {
  if (options.length <= 3) {
    return (
      <Row label={label} hint={hint}>
        <Choice value={value} onChange={onChange} options={options} />
      </Row>
    );
  }
  return (
    <Row label={label} hint={hint}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger size="sm" className="h-8 w-44 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Row>
  );
}

export function IdentityZoneControl({ st, setStyle }) {
  return (
    <Pick
      label="Bloc de couleur"
      hint="Le nom (et la photo) sur un fond de la couleur principale."
      value={st.identityZone}
      onChange={(v) => setStyle({ identityZone: v })}
      options={[
        { value: "plain", label: "Aucun" },
        { value: "band-top", label: "En-tête" },
        { value: "band-left", label: "À gauche" },
      ]}
    />
  );
}

/** Position, alignement et colonne de la photo. */
export function PhotoLayoutControls({ st, setStyle }) {
  const L = layoutState(st);
  if (L.zone === "band-left") {
    return (
      <p className="text-[11px] leading-snug text-muted-foreground">
        La photo est dans le bloc de couleur, au-dessus du nom.
      </p>
    );
  }
  return (
    <>
      <Pick
        label="Position"
        value={st.photoPosition}
        onChange={(v) => setStyle({ photoPosition: v })}
        options={[
          { value: "left", label: "Gauche" },
          { value: "top", label: "En haut" },
          { value: "right", label: "Droite" },
        ]}
      />
      {L.photoSide && (
        <Pick
          label="Alignement vertical"
          value={st.photoValign}
          onChange={(v) => setStyle({ photoValign: v })}
          options={[
            { value: "top", label: "Haut" },
            { value: "middle", label: "Milieu" },
            { value: "bottom", label: "Bas" },
          ]}
        />
      )}
      {L.photoSide && L.plain && (
        <Pick
          label="Colonne de la photo"
          value={st.photoColumn}
          onChange={(v) => setStyle({ photoColumn: v })}
          options={[
            { value: "plain", label: "Simple" },
            { value: "tinted", label: "Teintée" },
          ]}
        />
      )}
      {!L.photoSide && (
        <Pick
          label="Alignement du texte"
          value={st.align}
          onChange={(v) => setStyle({ align: v })}
          options={[
            { value: "left", label: "Gauche" },
            { value: "center", label: "Centré" },
          ]}
        />
      )}
    </>
  );
}

export function DividerControl({ st, setStyle }) {
  const L = layoutState(st);
  if (!L.plain || !L.photoSide || st.photoColumn === "tinted") return null;
  return (
    <Pick
      label="Séparateur photo / texte"
      value={st.divider}
      onChange={(v) => setStyle({ divider: v })}
      options={[
        { value: "none", label: "Aucun" },
        { value: "line", label: "Trait fin" },
        { value: "accent", label: "Trait de couleur" },
        { value: "bar", label: "Barre épaisse" },
      ]}
    />
  );
}

export function IdentityControls({ st, setStyle }) {
  const L = layoutState(st);
  return (
    <>
      {L.plain && (
        <Pick
          label="Trait sous le nom"
          value={st.accent}
          onChange={(v) => setStyle({ accent: v })}
          options={[
            { value: "none", label: "Aucun" },
            { value: "short", label: "Court" },
            { value: "thin", label: "Fin" },
          ]}
        />
      )}
      {L.plain && (
        <Pick
          label="Nom, poste, société"
          value={st.identityStyle}
          onChange={(v) => setStyle({ identityStyle: v })}
          options={[
            { value: "stack", label: "Empilés" },
            { value: "inline", label: "Sur une ligne" },
          ]}
        />
      )}
      {st.identityStyle !== "inline" && (
        <Pick
          label="Poste"
          value={st.titleStyle}
          onChange={(v) => setStyle({ titleStyle: v })}
          options={[
            { value: "normal", label: "Normal" },
            { value: "caps", label: "Capitales" },
          ]}
        />
      )}
    </>
  );
}

export function ContactStyleControl({ st, setStyle }) {
  return (
    <Pick
      label="Coordonnées"
      value={st.contactStyle}
      onChange={(v) =>
        setStyle({ contactStyle: v, showContactIcons: v === "icons" })
      }
      options={[
        { value: "icons", label: "Avec icônes" },
        { value: "labels", label: "Avec initiales (T, E, W)" },
        { value: "plain", label: "Texte seul" },
        { value: "inline", label: "Sur une ligne" },
      ]}
    />
  );
}

function positionOptions(st) {
  const L = layoutState(st);
  return [
    { value: "text", label: "Sous le texte" },
    ...(L.plain && L.photoSide
      ? [{ value: "photo", label: "Sous la photo" }]
      : []),
    { value: "side", label: "À droite" },
    { value: "bottom", label: "En bas" },
  ];
}

export function SocialPositionControl({ st, setStyle }) {
  const options = positionOptions(st);
  const value = options.some((o) => o.value === st.socialPosition)
    ? st.socialPosition
    : "text";
  return (
    <Pick
      label="Position des réseaux"
      value={value}
      onChange={(v) => setStyle({ socialPosition: v })}
      options={options}
    />
  );
}

export function LogoPositionControl({ st, setStyle }) {
  const options = positionOptions(st);
  const value = options.some((o) => o.value === st.logoPosition)
    ? st.logoPosition
    : "text";
  return (
    <Pick
      label="Position du logo"
      value={value}
      onChange={(v) => setStyle({ logoPosition: v })}
      options={options}
    />
  );
}

const OUTSIDE_LABELS = {
  social: "Réseaux",
  logo: "Logo",
  cta: "Bouton",
  banner: "Bandeau",
  disclaimer: "Mention",
};

/** Éléments qu'on peut sortir de l'encadré, selon leur position. */
function outsideCandidates(st) {
  return [
    ...(st.socialPosition === "bottom" ? ["social"] : []),
    ...(st.logoPosition === "bottom" ? ["logo"] : []),
    "cta",
    "banner",
    "disclaimer",
  ];
}

/** Toutes les cases « en dehors de l'encadré » (onglet Style). */
export function OutsideControls({ st, setStyle }) {
  const L = layoutState(st);
  if (!L.framed) return null;
  const candidates = outsideCandidates(st);
  return (
    <Row
      label="En dehors de l'encadré"
      hint="Les éléments choisis s'affichent sous le cadre."
    >
      <ToggleGroup
        type="multiple"
        size="sm"
        value={(st.outside || []).filter((k) => candidates.includes(k))}
        onValueChange={(v) => setStyle({ outside: v })}
        className="flex-wrap justify-end"
      >
        {candidates.map((k) => (
          <ToggleGroupItem key={k} value={k} className="px-2 text-xs">
            {OUTSIDE_LABELS[k]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Row>
  );
}

/** Dans / hors de l'encadré pour un seul élément (panneau d'élément). */
export function OutsideToggle({ item, st, setStyle }) {
  const L = layoutState(st);
  if (!L.framed || !outsideCandidates(st).includes(item)) return null;
  const outside = (st.outside || []).includes(item);
  return (
    <Pick
      label="Place"
      value={outside ? "out" : "in"}
      onChange={(v) => {
        const rest = (st.outside || []).filter((k) => k !== item);
        setStyle({ outside: v === "out" ? [...rest, item] : rest });
      }}
      options={[
        { value: "in", label: "Dans l'encadré" },
        { value: "out", label: "En dehors" },
      ]}
    />
  );
}

/** Bande teintée en bas du cadre, pour les réseaux et le logo en bas. */
export function FooterStripControl({ st, setStyle }) {
  const L = layoutState(st);
  const hasBottom =
    st.socialPosition === "bottom" || st.logoPosition === "bottom";
  if (!L.boxed || !hasBottom) return null;
  return (
    <Row
      label="Bande de pied teintée"
      hint="Réseaux et logo « en bas » sur une bande colorée dans le cadre."
    >
      <Switch
        checked={Boolean(st.footerStrip)}
        onCheckedChange={(v) => setStyle({ footerStrip: v })}
        className="scale-75 data-[state=checked]:bg-[#5a50ff]"
      />
    </Row>
  );
}
