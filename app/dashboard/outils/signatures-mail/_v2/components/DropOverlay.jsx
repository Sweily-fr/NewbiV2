"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { layoutState } from "./LayoutControls";

/**
 * Glisser-déposer d'un bloc de l'aperçu. Le moteur de l'API ne rend que
 * des positions sûres pour Gmail et Outlook (gauche, en haut, droite, sous
 * le texte, en bas, hors du cadre…) : le dépôt se fait donc sur des zones
 * nommées, dessinées sur la signature, et chaque zone correspond à un
 * réglage de mise en page.
 *
 * Posé en plein écran au-dessus de l'iframe dès le début du glisser : les
 * événements du pointeur arrivent alors ici, plus dans l'aperçu.
 */

const LABELS = {
  identity: "Nom et poste",
  contact: "Coordonnées",
  photo: "Photo",
  social: "Réseaux",
  logo: "Logo",
  cta: "Bouton",
  banner: "Bandeau",
  disclaimer: "Mention",
};

/** Blocs de la colonne de texte : « au-dessus de… / sous… ». */
const TEXT_NAMES = {
  identity: ["Au-dessus du nom", "Sous le nom"],
  contact: ["Au-dessus des coordonnées", "Sous les coordonnées"],
  social: ["Au-dessus des réseaux", "Sous les réseaux"],
  logo: ["Au-dessus du logo", "Sous le logo"],
};
const TEXT_BLOCKS = ["identity", "contact", "social", "logo"];

/** Blocs actuellement dans la colonne de texte. */
function textColumn(st) {
  const L = layoutState(st);
  return {
    identity: L.plain,
    contact: true,
    social: st.socialPosition === "text",
    logo: st.logoPosition === "text",
  };
}

/**
 * Réordonner la colonne de texte : pour chaque autre bloc de la colonne,
 * sa moitié haute = « au-dessus », sa moitié basse = « sous ».
 */
function reorderZones(field, st, blocks, add) {
  const inColumn = textColumn(st);
  const order = (st.textOrder?.length ? st.textOrder : TEXT_BLOCKS).filter(
    (k) => k !== field,
  );
  const position =
    field === "social" ? { socialPosition: "text" } : field === "logo" ? { logoPosition: "text" } : {};
  for (const target of order) {
    const r = blocks?.[target];
    if (!inColumn[target] || !r) continue;
    const at = order.indexOf(target);
    const before = [...order.slice(0, at), field, ...order.slice(at)];
    const after = [...order.slice(0, at + 1), field, ...order.slice(at + 1)];
    const half = Math.max(18, r.h / 2);
    add(TEXT_NAMES[target][0], { x: r.x, y: r.y - 4, w: r.w, h: half }, { ...position, textOrder: before });
    add(TEXT_NAMES[target][1], { x: r.x, y: r.y + r.h - half + 4, w: r.w, h: half }, { ...position, textOrder: after });
  }
}

/** Message quand un bloc n'a aucune zone possible. */
export function noZoneHint(field, st) {
  if (field === "identity" && !layoutState(st).plain) {
    return "Sur un bloc de couleur : réglez « Bloc de couleur » dans Style";
  }
  return "Ajoutez un encadré pour déplacer cet élément";
}

/** Zones de dépôt proposées pour un bloc, en coordonnées de la page. */
function zonesFor(field, st, S, P, blocks) {
  const L = layoutState(st);
  const outside = st.outside || [];
  const without = (k) => outside.filter((x) => x !== k);
  const zones = [];
  const add = (label, rect, patch) => zones.push({ label, rect, patch });

  if (field === "photo") {
    if (L.zone === "band-left") return zones;
    const third = S.w / 3;
    add("Photo à gauche", { x: S.x - 12, y: S.y, w: third, h: S.h }, { photoPosition: "left" });
    add(
      "Photo en haut",
      { x: S.x + third - 4, y: S.y - 12, w: third + 8, h: S.h * 0.5 },
      { photoPosition: "top" },
    );
    add(
      "Photo à droite",
      { x: S.x + 2 * third + 12, y: S.y, w: third, h: S.h },
      { photoPosition: "right" },
    );
    return zones;
  }

  if (field === "identity" || field === "contact") {
    if (field === "identity" && !L.plain) return zones;
    reorderZones(field, st, blocks, add);
    return zones;
  }

  if (field === "social" || field === "logo") {
    const key = field === "social" ? "socialPosition" : "logoPosition";
    // Dans la colonne de texte : au-dessus / sous chaque bloc
    reorderZones(field, st, blocks, add);
    const reorder = zones.length > 0;
    const photoSide = L.plain && L.photoSide && P;
    const textX = photoSide && P.x < S.x + S.w / 2 ? P.x + P.w + 16 : S.x;
    const textW = photoSide ? S.x + S.w - textX - (P.x > S.x + S.w / 2 ? P.w + 16 : 0) : S.w;
    if (!reorder) {
      add(
        "Sous le texte",
        { x: textX, y: S.y + S.h * 0.45, w: Math.max(120, textW * 0.7), h: S.h * 0.5 },
        { [key]: "text" },
      );
    }
    if (photoSide) {
      add(
        "Sous la photo",
        { x: P.x - 10, y: P.y + P.h + 4, w: Math.max(P.w + 20, 110), h: 56 },
        { [key]: "photo" },
      );
    }
    add("À droite", { x: S.x + S.w + 16, y: S.y, w: 130, h: S.h }, { [key]: "side" });
    add(
      "En bas",
      { x: S.x, y: S.y + S.h + 10, w: Math.max(S.w, 240), h: 44 },
      { [key]: "bottom", outside: without(field) },
    );
    if (L.framed) {
      add(
        "Hors du cadre",
        { x: S.x, y: S.y + S.h + 62, w: Math.max(S.w, 240), h: 44 },
        { [key]: "bottom", outside: [...without(field), field] },
      );
    }
    return zones;
  }

  // Bouton, bandeau, mention : dans ou hors du cadre
  if (!L.framed) return zones;
  add(
    "Dans le cadre",
    { x: S.x, y: S.y + S.h - 52, w: S.w, h: 44 },
    { outside: without(field) },
  );
  add(
    "Hors du cadre",
    { x: S.x, y: S.y + S.h + 10, w: S.w, h: 44 },
    { outside: [...without(field), field] },
  );
  return zones;
}

const inside = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

/**
 * Le pointeur arrive par deux chemins : les événements de cet écran, ou
 * ceux relayés par l'aperçu (qui garde la souris si le bouton y a été
 * pressé). `pointer` et `release` sont pilotés par le parent pour ce
 * second cas ; le premier dépôt reçu l'emporte.
 */
export default function DropOverlay({ drag, style, pointer: relayed, release, onDrop, onCancel }) {
  const [own, setOwn] = useState(null);
  const pointer = own || relayed || { x: drag.x, y: drag.y };
  const zones = useMemo(
    () => zonesFor(drag.field, style, drag.sig, drag.photo, drag.blocks),
    [drag, style],
  );
  const hovered = zones.find((z) => inside(z.rect, pointer.x, pointer.y));
  const done = useRef(false);
  const finish = (x, y) => {
    if (done.current) return;
    done.current = true;
    const zone = zones.find((z) => inside(z.rect, x, y));
    if (zone) onDrop(zone.patch);
    else onCancel();
  };

  // Relâchement relayé par l'aperçu
  useEffect(() => {
    if (release) finish(release.x, release.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [release]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 cursor-grabbing"
      onPointerMove={(e) => setOwn({ x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => finish(e.clientX, e.clientY)}
    >
      {zones.length === 0 && (
        <div
          className="fixed rounded-md bg-neutral-900/90 px-3 py-1.5 text-xs text-white"
          style={{ left: pointer.x + 14, top: pointer.y + 14 }}
        >
          {noZoneHint(drag.field, style)}
        </div>
      )}
      {zones.map((z) => (
        <div
          key={z.label}
          className={`fixed flex items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            hovered === z
              ? "border-[#5a50ff] bg-[#5a50ff]/25"
              : "border-[#5a50ff]/60 bg-[#5a50ff]/5"
          }`}
          style={{ left: z.rect.x, top: z.rect.y, width: z.rect.w, height: z.rect.h }}
        >
          {/* Étiquette sur fond blanc : lisible par-dessus la signature */}
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium shadow-sm ${
              hovered === z ? "bg-[#5a50ff] text-white" : "bg-white text-[#5a50ff]"
            }`}
          >
            {z.label}
          </span>
        </div>
      ))}
      <div
        className="pointer-events-none fixed rounded-md bg-[#5a50ff] px-2.5 py-1 text-xs font-medium text-white shadow-lg"
        style={{ left: pointer.x + 12, top: pointer.y + 12 }}
      >
        {LABELS[drag.field] || drag.field}
      </div>
    </div>
  );
}
