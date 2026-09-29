"use client";

import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import { Choice, Row } from "./controls";
import {
  identityZone,
  isOutside,
  itemPlacement,
  moveItem,
  photoPlacement,
  setIdentityZone,
  setItemPlacement,
  setOutside,
  setPhotoPlacement,
} from "../slots";
import { distribute, socialAlign, socialRowOptions } from "../socialRows";

/**
 * Contrôles de mise en page, partagés par l'onglet Style et les panneaux
 * d'élément. Ils agissent sur les emplacements des éléments (style.slots),
 * comme le glisser-déposer de l'aperçu. Chaque contrôle ne s'affiche que
 * s'il a un effet avec les réglages en cours.
 */

/** État de la mise en page, lu dans les emplacements. */
export function layoutState(st) {
  const slots = st.slots || {};
  const zone = identityZone(st);
  const photo = photoPlacement(st);
  return {
    zone,
    photo,
    hasVisual: (slots.visual || []).length > 0,
    hasHeader: (slots.header || []).length > 0,
    photoSide: photo === "left" || photo === "right",
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
          <SelectValue placeholder="Autre place" />
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
      value={identityZone(st)}
      onChange={(v) => setStyle(setIdentityZone(st, v))}
      options={[
        { value: "plain", label: "Aucun" },
        { value: "band-top", label: "En-tête" },
        { value: "band-left", label: "À gauche" },
      ]}
    />
  );
}

/** Place de la photo, son alignement et sa colonne. */
export function PhotoLayoutControls({ st, setStyle }) {
  const L = layoutState(st);
  if (L.photo === "header") {
    return (
      <Pick
        label="Photo dans l'en-tête"
        value={st.headerPhoto}
        onChange={(v) => setStyle({ headerPhoto: v })}
        options={[
          { value: "left", label: "Gauche" },
          { value: "top", label: "En haut" },
          { value: "right", label: "Droite" },
        ]}
      />
    );
  }
  return (
    <>
      <Pick
        label="Position"
        value={["left", "top", "right"].includes(L.photo) ? L.photo : ""}
        onChange={(v) => setStyle(setPhotoPlacement(st, v))}
        options={[
          { value: "left", label: "Gauche" },
          { value: "top", label: "En haut" },
          { value: "right", label: "Droite" },
        ]}
      />
      {L.hasVisual && (
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
      {L.hasVisual && (
        <Pick
          label="Fond de la colonne"
          value={st.visualFill}
          onChange={(v) => setStyle({ visualFill: v })}
          options={[
            { value: "none", label: "Aucun" },
            { value: "tint", label: "Teinté" },
            { value: "solid", label: "Couleur" },
          ]}
        />
      )}
      {!L.hasVisual && (
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
  if (!L.hasVisual || st.visualFill !== "none") return null;
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

/** Prénom et nom côte à côte : une ligne ou l'un sous l'autre. */
export function NameLayoutControl({ st, setStyle }) {
  if (st.identityStyle === "inline") return null;
  return (
    <Pick
      label="Prénom et nom"
      value={st.nameLayout || "inline"}
      onChange={(v) => setStyle({ nameLayout: v })}
      options={[
        { value: "inline", label: "Sur une ligne" },
        { value: "stacked", label: "L'un sous l'autre" },
      ]}
    />
  );
}

export function IdentityControls({ st, setStyle }) {
  return (
    <>
      <NameLayoutControl st={st} setStyle={setStyle} />
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
      <Pick
        label="Nom, poste, société"
        value={st.identityStyle}
        onChange={(v) => setStyle({ identityStyle: v })}
        options={[
          { value: "stack", label: "Empilés" },
          { value: "inline", label: "Sur une ligne" },
        ]}
      />
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

/** Emplacements proposés pour un élément (réseaux, logo). */
function placementOptions(st) {
  const L = layoutState(st);
  return [
    ...(L.hasHeader ? [{ value: "header", label: "Dans l'en-tête" }] : []),
    { value: "visual", label: "Colonne photo" },
    { value: "text", label: "Sous le texte" },
    { value: "side", label: "À droite" },
    { value: "footer", label: "En bas" },
    ...(L.framed ? [{ value: "outside", label: "Sous le cadre" }] : []),
  ];
}

function PlacementControl({ item, label, st, setStyle }) {
  return (
    <Pick
      label={label}
      value={itemPlacement(st, item)}
      onChange={(v) => setStyle(setItemPlacement(st, item, v))}
      options={placementOptions(st)}
    />
  );
}

export function SocialPositionControl({ st, setStyle }) {
  return (
    <PlacementControl
      item="social"
      label="Position des réseaux"
      st={st}
      setStyle={setStyle}
    />
  );
}

export function LogoPositionControl({ st, setStyle }) {
  return (
    <PlacementControl
      item="logo"
      label="Position du logo"
      st={st}
      setStyle={setStyle}
    />
  );
}

const JUSTIFY = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

/**
 * Disposition des icônes de réseaux : une ligne, deux lignes (2 en haut,
 * 3 en bas…), 2 par ligne, en colonne. Une vignette par disposition,
 * dessinée pour le nombre de réseaux renseignés.
 */
export function SocialRowsControl({ st, setStyle, count }) {
  const options = socialRowOptions(count);
  if (options.length === 0) return null;
  const current = distribute(count, st.socialRows || []).join("+");
  const justify = JUSTIFY[socialAlign(st)];
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        Disposition des icônes
      </Label>
      <div
        role="radiogroup"
        aria-label="Disposition des icônes"
        className="flex flex-wrap gap-1.5"
      >
        {options.map((o) => {
          const selected = o.key === current;
          return (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setStyle({ socialRows: o.plan })}
              className={cn(
                "flex min-w-[64px] flex-col items-center justify-between gap-1.5 rounded-md border px-2 py-2 text-[10px] transition-colors cursor-pointer",
                selected
                  ? "border-[#5a50ff] bg-[#5a50ff]/5 text-[#5a50ff]"
                  : "border-neutral-200 text-muted-foreground hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
              )}
            >
              <span className="flex flex-col gap-[3px]" aria-hidden>
                {o.rows.map((n, i) => (
                  <span key={i} className={cn("flex gap-[3px]", justify)}>
                    {Array.from({ length: n }, (_, j) => (
                      <span
                        key={j}
                        className="h-[7px] w-[7px] rounded-[2px] bg-current"
                      />
                    ))}
                  </span>
                ))}
              </span>
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">
        Les icônes suivent l&apos;ordre de la liste des réseaux : les flèches
        de la liste le changent.
      </p>
    </div>
  );
}

const OUTSIDE_LABELS = {
  social: "Réseaux",
  logo: "Logo",
  cta: "Bouton",
  banner: "Bandeau",
  disclaimer: "Mention",
};

/** Éléments du bas qu'on peut sortir du cadre (ou y remettre). */
function outsideCandidates(st) {
  const bottom = [...(st.slots?.footer || []), ...(st.slots?.outside || [])];
  return Object.keys(OUTSIDE_LABELS).filter((k) => bottom.includes(k));
}

/** Toutes les cases « en dehors de l'encadré » (onglet Style). */
export function OutsideControls({ st, setStyle }) {
  const L = layoutState(st);
  const candidates = outsideCandidates(st);
  if (!L.framed || candidates.length === 0) return null;
  return (
    <Row
      label="En dehors de l'encadré"
      hint="Les éléments choisis s'affichent sous le cadre."
    >
      <ToggleGroup
        type="multiple"
        size="sm"
        value={candidates.filter((k) => isOutside(st, k))}
        onValueChange={(v) => {
          let slots = st.slots;
          for (const k of candidates) {
            const out = v.includes(k);
            if (out !== isOutside(st, k)) {
              slots = moveItem(slots, k, out ? "outside" : "footer");
            }
          }
          setStyle({ slots });
        }}
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
  return (
    <Pick
      label="Place"
      value={isOutside(st, item) ? "out" : "in"}
      onChange={(v) => setStyle(setOutside(st, item, v === "out"))}
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
  const footer = st.slots?.footer || [];
  const hasBottom = footer.includes("social") || footer.includes("logo");
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
