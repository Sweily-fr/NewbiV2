"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { layoutState } from "./LayoutControls";

/**
 * Glisser-déposer d'un bloc de l'aperçu, façon Figma / Notion : des lignes
 * d'insertion fines, calées sur la géométrie réelle du rendu (colonne de
 * texte, corps, cadre), et seule la ligne la plus proche du pointeur
 * s'allume, avec son nom. Chaque ligne correspond à un réglage de mise en
 * page que le générateur sait rendre dans Gmail et Outlook ; la position
 * actuelle n'est jamais proposée.
 *
 * Posé en plein écran au-dessus de l'aperçu pendant le glisser. Le
 * pointeur arrive par deux chemins : les événements de cet écran, ou ceux
 * relayés par l'aperçu (le navigateur garde la souris dans l'iframe où le
 * bouton a été pressé) ; le premier relâchement reçu l'emporte.
 */

const GAP = 10;
/** Au-delà de cette distance (px) d'une ligne, relâcher annule. */
const SNAP = 90;

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
const ABOVE = {
  identity: "Au-dessus du nom",
  contact: "Au-dessus des coordonnées",
  social: "Au-dessus des réseaux",
  logo: "Au-dessus du logo",
};
const BELOW = {
  identity: "Sous le nom",
  contact: "Sous les coordonnées",
  social: "Sous les réseaux",
  logo: "Sous le logo",
};
const TEXT_BLOCKS = ["identity", "contact", "social", "logo"];

const hLine = (label, x, y, len, patch) => ({ label, orient: "h", x, y, len, patch });
const vLine = (label, x, y, len, patch) => ({ label, orient: "v", x, y, len, patch });

/** Réordonner la colonne de texte : une ligne entre chaque bloc. */
function reorderTargets(field, st, g, extraPatch = {}) {
  const L = layoutState(st);
  const inColumn = {
    identity: L.plain,
    contact: true,
    social: st.socialPosition === "text",
    logo: st.logoPosition === "text",
  };
  const seq = TEXT_BLOCKS.filter((k) => k !== field && inColumn[k] && g.blocks?.[k]).sort(
    (a, b) => g.blocks[a].y - g.blocks[b].y,
  );
  if (seq.length === 0) return [];
  const current = st.textOrder?.length ? st.textOrder : TEXT_BLOCKS;
  const base = current.filter((k) => k !== field);
  const col = g.column || g.body || g.sig;
  const rect = (k) => g.blocks[k];
  const targets = [];
  for (let i = 0; i <= seq.length; i += 1) {
    let y;
    let label;
    let order;
    if (i === 0) {
      y = rect(seq[0]).y - 6;
      label = ABOVE[seq[0]];
      const at = base.indexOf(seq[0]);
      order = [...base.slice(0, at), field, ...base.slice(at)];
    } else {
      const prev = rect(seq[i - 1]);
      y = i === seq.length ? prev.y + prev.h + 6 : (prev.y + prev.h + rect(seq[i]).y) / 2;
      label = BELOW[seq[i - 1]];
      const at = base.indexOf(seq[i - 1]) + 1;
      order = [...base.slice(0, at), field, ...base.slice(at)];
    }
    // Même ordre et même position : ce serait la place actuelle
    const samePlace =
      Object.keys(extraPatch).length === 0 && order.join() === current.join();
    if (!samePlace) {
      targets.push(hLine(label, col.x, y, col.w, { ...extraPatch, textOrder: order }));
    }
  }
  return targets;
}

/** Lignes de dépôt proposées pour un bloc, en coordonnées de la page. */
export function targetsFor(field, st, g) {
  const L = layoutState(st);
  const outside = st.outside || [];
  const without = (k) => outside.filter((x) => x !== k);
  const B = g.body || g.sig;
  const F = g.frame;
  const P = g.blocks?.photo || g.photo;

  if (field === "photo") {
    if (L.zone === "band-left") return [];
    // Référence : l'identité sur un en-tête coloré, sinon la colonne de texte
    const R = L.zone === "band-top" ? g.blocks?.identity || B : g.column || B;
    const cur = st.photoPosition;
    return [
      cur !== "left" && vLine("Photo à gauche", R.x - GAP - 4, R.y, R.h, { photoPosition: "left" }),
      cur !== "top" && hLine("Photo au-dessus", R.x, R.y - GAP - 4, R.w, { photoPosition: "top" }),
      cur !== "right" &&
        vLine("Photo à droite", R.x + R.w + GAP + 4, R.y, R.h, { photoPosition: "right" }),
    ].filter(Boolean);
  }

  if (field === "identity" || field === "contact") {
    if (field === "identity" && !L.plain) return [];
    return reorderTargets(field, st, g);
  }

  if (field === "social" || field === "logo") {
    const key = field === "social" ? "socialPosition" : "logoPosition";
    const cur = st[key];
    const isOut = outside.includes(field);
    const targets = reorderTargets(field, st, g, cur === "text" ? {} : { [key]: "text" });
    const lowest = targets.reduce((m, t) => Math.max(m, t.y), -Infinity);
    if (cur !== "photo" && L.plain && L.photoSide && P) {
      targets.push(hLine("Sous la photo", P.x, P.y + P.h + GAP, P.w, { [key]: "photo" }));
    }
    if (cur !== "side") {
      targets.push(vLine("À droite", B.x + B.w + 2 * GAP, B.y, B.h, { [key]: "side" }));
    }
    // « En bas » : sous le corps, décalé s'il tombe sur la dernière ligne de la colonne
    const bottomY = Math.max(B.y + B.h + GAP, lowest + 16);
    if (cur !== "bottom" || isOut) {
      targets.push(
        hLine("En bas", B.x, bottomY, B.w, { [key]: "bottom", outside: without(field) }),
      );
    }
    if (L.framed && F && !(cur === "bottom" && isOut)) {
      targets.push(
        hLine("Hors du cadre", F.x, Math.max(F.y + F.h + GAP, bottomY + 16), F.w, {
          [key]: "bottom",
          outside: [...without(field), field],
        }),
      );
    }
    return targets;
  }

  // Bouton, bandeau, mention : dans ou hors du cadre
  if (!L.framed || !F) return [];
  return outside.includes(field)
    ? [hLine("Dans le cadre", F.x + 8, F.y + F.h - GAP, F.w - 16, { outside: without(field) })]
    : [
        hLine("Hors du cadre", F.x, F.y + F.h + GAP, F.w, {
          outside: [...without(field), field],
        }),
      ];
}

/** Distance du pointeur à une ligne (segment). */
function distance(t, x, y) {
  if (t.orient === "h") {
    const cx = Math.max(t.x, Math.min(x, t.x + t.len));
    return Math.hypot(x - cx, y - t.y);
  }
  const cy = Math.max(t.y, Math.min(y, t.y + t.len));
  return Math.hypot(x - t.x, y - cy);
}

function nearest(targets, x, y) {
  let best = null;
  let bestD = SNAP;
  for (const t of targets) {
    const d = distance(t, x, y);
    if (d < bestD) {
      best = t;
      bestD = d;
    }
  }
  return best;
}

/** Message quand un bloc n'a aucune place possible. */
function noTargetHint(field, st) {
  if (field === "identity" && !layoutState(st).plain) {
    return "Sur un bloc de couleur : réglez « Bloc de couleur » dans Style";
  }
  if (["cta", "banner", "disclaimer"].includes(field)) {
    return "Ajoutez un encadré pour sortir cet élément du cadre";
  }
  return "Aucune autre place possible pour ce bloc";
}

export default function DropOverlay({ drag, style, pointer: relayed, release, onDrop, onCancel }) {
  const [own, setOwn] = useState(null);
  const pointer = own || relayed || { x: drag.x, y: drag.y };
  const targets = useMemo(() => targetsFor(drag.field, style, drag), [drag, style]);
  const active = nearest(targets, pointer.x, pointer.y);
  const source = drag.blocks?.[drag.field];

  const done = useRef(false);
  const finish = (x, y) => {
    if (done.current) return;
    done.current = true;
    const target = nearest(targets, x, y);
    if (target) onDrop(target.patch);
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
      {/* Bloc tiré, repéré en pointillés */}
      {source && (
        <div
          className="pointer-events-none fixed rounded-md border-2 border-dashed border-neutral-400"
          style={{ left: source.x - 4, top: source.y - 4, width: source.w + 8, height: source.h + 8 }}
        />
      )}

      {/* Lignes d'insertion : discrètes, sauf la plus proche */}
      {targets.map((t) => {
        const on = t === active;
        const thick = on ? 4 : 2;
        const lineStyle =
          t.orient === "h"
            ? { left: t.x, top: t.y - thick / 2, width: t.len, height: thick }
            : { left: t.x - thick / 2, top: t.y, width: thick, height: t.len };
        return (
          <div
            key={t.label}
            className={`pointer-events-none fixed rounded-full ${
              on ? "bg-[#5a50ff]" : "bg-[#5a50ff]/35"
            }`}
            style={lineStyle}
          >
            {on && (
              <>
                <span
                  className="absolute h-2.5 w-2.5 rounded-full border-2 border-[#5a50ff] bg-white"
                  style={
                    t.orient === "h"
                      ? { left: -5, top: -3 }
                      : { top: -5, left: -3 }
                  }
                />
                <span
                  className="absolute h-2.5 w-2.5 rounded-full border-2 border-[#5a50ff] bg-white"
                  style={
                    t.orient === "h"
                      ? { right: -5, top: -3 }
                      : { bottom: -5, left: -3 }
                  }
                />
              </>
            )}
          </div>
        );
      })}

      {/* Nom de la place visée, collé à sa ligne */}
      {active && (
        <div
          className="pointer-events-none fixed whitespace-nowrap rounded-md bg-[#5a50ff] px-2 py-0.5 text-xs font-medium text-white shadow-md"
          style={
            active.orient === "h"
              ? { left: active.x, top: active.y - 28 }
              : { left: active.x + 10, top: active.y }
          }
        >
          {active.label}
        </div>
      )}

      {/* Étiquette qui suit le pointeur */}
      <div
        className="pointer-events-none fixed whitespace-nowrap rounded-md bg-neutral-900/90 px-2.5 py-1 text-xs font-medium text-white shadow-lg"
        style={{ left: pointer.x + 14, top: pointer.y + 14 }}
      >
        {LABELS[drag.field] || drag.field}
        {targets.length === 0 ? (
          <span className="font-normal text-neutral-300"> · {noTargetHint(drag.field, style)}</span>
        ) : (
          !active && (
            <span className="font-normal text-neutral-300"> · approchez une ligne violette</span>
          )
        )}
      </div>
    </div>
  );
}
