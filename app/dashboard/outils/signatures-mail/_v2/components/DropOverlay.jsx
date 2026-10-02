"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BLOCK_OF,
  ELEMENT_ITEMS,
  ITEM_LABEL,
  ITEM_OF,
  ITEM_THE,
  moveItems,
  slotOf,
} from "../slots";

/**
 * Glisser-déposer d'un élément de l'aperçu, façon Figma / Notion. Tout
 * élément va dans n'importe quel emplacement (bandeau, colonne photo,
 * colonne principale, colonne de droite, bas du cadre, sous le cadre), à
 * n'importe quelle place : des lignes d'insertion fines, calées sur la
 * géométrie réelle du rendu, et seule la plus proche du pointeur s'allume,
 * avec son nom. Un emplacement vide se crée en déposant sur sa ligne (ex.
 * « Nouvelle colonne à gauche »). La place actuelle n'est jamais proposée.
 *
 * Posé en plein écran au-dessus de l'aperçu pendant le glisser. Le
 * pointeur arrive par deux chemins : les événements de cet écran, ou ceux
 * relayés par l'aperçu (le navigateur garde la souris dans l'iframe où le
 * bouton a été pressé) ; le premier relâchement reçu l'emporte.
 */

/** Au-delà de cette distance (px) d'une ligne, relâcher annule. */
const SNAP = 90;
const SLOTS = ["header", "visual", "text", "side", "footer", "outside"];

const hLine = (label, x, y, len, patch) => ({
  label,
  orient: "h",
  x,
  y,
  len,
  patch,
});
const vLine = (label, x, y, len, patch) => ({
  label,
  orient: "v",
  x,
  y,
  len,
  patch,
});

/** Réseaux et logo : côte à côte en bas quand ils se suivent (footerPair). */
const PAIR = { social: "logo", logo: "social" };

/** Prénom, nom, poste, entreprise : une ligne qu'un autre élément ne coupe pas. */
const IDENTITY_LINE = ["firstName", "lastName", "title", "company"];

const bottom = (r) => r.y + r.h;
const right = (r) => r.x + r.w;
/** Deux éléments sur la même ligne (inline) : forte superposition verticale. */
const sameRow = (a, b) =>
  Math.min(bottom(a), bottom(b)) - Math.max(a.y, b.y) >
  0.5 * Math.min(a.h, b.h);

/**
 * Lignes de dépôt pour l'élément tiré, en coordonnées de la page. `g.fields`
 * : parties tirées ensemble (un élément entier), `field` en tête.
 */
export function targetsFor(field, st, g) {
  const slots = st.slots;
  if (!slots) return [];
  const group = g.fields?.length ? g.fields : [field];
  const current = slotOf(slots, field);
  // Élément entier : ses parties vides (mobile, adresse…) placées au même
  // endroit le suivent, sinon elles y réapparaîtraient une fois remplies
  const hidden = g.whole
    ? (ELEMENT_ITEMS[BLOCK_OF[field]] || []).filter(
        (k) =>
          !group.includes(k) &&
          !(g.items || []).some((i) => i.item === k) &&
          slotOf(slots, k) === current,
      )
    : [];
  // Dans leur ordre d'origine (un prénom vide reste avant le nom)
  const order = slots[current] || [];
  const moving = [...group, ...hidden].sort(
    (a, b) => order.indexOf(a) - order.indexOf(b),
  );
  const move = (slot, at) => moveItems(slots, moving, slot, at);
  const NAME = ["firstName", "lastName"];
  const CONTACT = ELEMENT_ITEMS.contact;
  // Éléments voisins que le rendu réunit sur une même ligne, selon leur
  // ordre et non leur place à l'écran (même règle que rowsOf dans le moteur
  // de l'API) : prénom et nom (même l'un sous l'autre), identité en ligne,
  // poste et entreprise en capitales, coordonnées en ligne. Un autre élément
  // posé entre eux couperait la ligne en deux, même repliée à l'écran
  // (aperçu téléphone, colonne étroite).
  const gluedRun = (a, b) => {
    const both = (list) => list.includes(a) && list.includes(b);
    if (both(NAME)) return NAME;
    if (st.identityStyle === "inline" && both(IDENTITY_LINE)) {
      return IDENTITY_LINE;
    }
    if (st.titleStyle === "caps" && a === "title" && b === "company") {
      return ["title", "company"];
    }
    if (st.contactStyle === "inline" && both(CONTACT)) return CONTACT;
    return null;
  };
  const inStrip = (k) => k === "social" || k === "logo";
  const stripOn =
    (st.frame === "outline" || st.frame === "soft") && Boolean(st.footerStrip);
  const targets = [];
  const B = g.body || g.sig;

  // Emplacements sans élément affiché (hors élément tiré)
  const emptySlot = (slot) =>
    !(g.items || []).some(
      (i) => i.slot === slot && !group.includes(i.item) && i.rect?.h > 0,
    );

  for (const slot of SLOTS) {
    // Éléments affichés de l'emplacement, dans l'ordre de lecture
    const inSlot = (g.items || [])
      .filter((i) => i.slot === slot && i.rect?.h > 0)
      .filter((i, idx, arr) => arr.findIndex((j) => j.item === i.item) === idx)
      .sort((a, b) =>
        sameRow(a.rect, b.rect) ? a.rect.x - b.rect.x : a.rect.y - b.rect.y,
      );
    let shown = inSlot.filter((i) => !group.includes(i.item));
    const area = g.slots?.[slot];
    // Photo de l'en-tête : placée par « Photo dans l'en-tête », pas par
    // l'ordre ; y déposer la photo, c'est seulement l'y mettre
    if (slot === "header" && group.includes("photo")) {
      if (current !== "header" && shown.length > 0) {
        const a = area || shown[0].rect;
        targets.push(
          hLine("Dans l'en-tête", a.x, a.y - 6, a.w, {
            slots: move(slot, { first: true }),
          }),
        );
      }
      continue;
    }
    // Repères qui ont un sens : pas la photo de l'en-tête ; bande de pied
    // teintée : réseaux et logo entre eux, les autres au-dessus d'elle
    const hiddenAnchors = shown.filter(
      (i) =>
        (slot === "header" && i.item === "photo") ||
        (slot === "footer" &&
          stripOn &&
          inStrip(i.item) !== group.some(inStrip)),
    );
    if (hiddenAnchors.length > 0) {
      shown = shown.filter((i) => !hiddenAnchors.includes(i));
      if (shown.length === 0) {
        // Rien d'autre ici : une seule ligne, au-dessus de ce qui reste
        const top = Math.min(...hiddenAnchors.map((i) => i.rect.y));
        const a = area || hiddenAnchors[0].rect;
        if (current !== slot) {
          targets.push(
            hLine(
              slot === "header" ? "Dans l'en-tête" : "En bas",
              a.x,
              top - 6,
              a.w,
              { slots: move(slot, { first: true }) },
            ),
          );
        }
        continue;
      }
    }
    const visibleNow = inSlot
      .filter((i) => group.includes(i.item) || shown.includes(i))
      .map((i) => i.item);
    // Même ordre visible qu'aujourd'hui : ce ne serait pas un déplacement
    const unchanged = (at) =>
      current === slot &&
      [
        ...shown.slice(0, at).map((i) => i.item),
        ...group.filter((k) => visibleNow.includes(k)),
        ...shown.slice(at).map((i) => i.item),
      ].join() === visibleNow.join();
    if (shown.length > 0) {
      const col = area || shown[0].rect;
      shown.forEach((entry, i) => {
        if (unchanged(i)) return;
        const r = entry.rect;
        const prev = shown[i - 1];
        const patch = { slots: move(slot, { before: entry.item }) };
        // Au milieu d'une ligne réunie par le rendu : seulement pour l'un de
        // ses éléments (réordonner une coordonnée, inverser prénom et nom)
        const run = prev ? gluedRun(prev.item, entry.item) : null;
        if (run && !group.every((k) => run.includes(k))) return;
        if (prev && sameRow(prev.rect, r)) {
          // Ni entre des réseaux et un logo côte à côte : ils passeraient
          // l'un sous l'autre, pas de part et d'autre
          if (slot === "footer" && PAIR[prev.item] === entry.item) return;
          const x = (right(prev.rect) + r.x) / 2;
          const top = Math.min(prev.rect.y, r.y);
          targets.push(
            vLine(
              `Avant ${ITEM_THE[entry.item]}`,
              x,
              top,
              Math.max(bottom(prev.rect), bottom(r)) - top,
              patch,
            ),
          );
        } else {
          const y = prev ? (bottom(prev.rect) + r.y) / 2 : r.y - 5;
          targets.push(
            hLine(`Au-dessus ${ITEM_OF[entry.item]}`, col.x, y, col.w, patch),
          );
        }
      });
      // Après le dernier
      const last = shown[shown.length - 1];
      if (!unchanged(shown.length)) {
        targets.push(
          hLine(
            `Sous ${ITEM_THE[last.item]}`,
            col.x,
            bottom(last.rect) + 5,
            col.w,
            { slots: move(slot, { after: last.item }) },
          ),
        );
      }
    } else if (current !== slot) {
      // Emplacement vide (l'élément tiré n'y est pas déjà seul) : une
      // ligne pour le créer
      const create = (label, line) =>
        targets.push({ ...line, label, create: true });
      const into = { slots: move(slot) };
      if (slot === "visual") {
        create(
          "Nouvelle colonne à gauche",
          vLine("", B.x - 16, B.y, B.h, { ...into, visualSide: "left" }),
        );
      } else if (slot === "side") {
        // Décalée si la colonne principale se crée aussi à droite
        const x = right(B) + (emptySlot("text") && current !== "text" ? 44 : 16);
        create("Nouvelle colonne à droite", vLine("", x, B.y, B.h, into));
      } else if (slot === "header") {
        const top = (g.frame || B).y;
        create("En-tête coloré", hLine("", B.x, top - 12, B.w, into));
      } else if (slot === "footer") {
        create("En bas", hLine("", B.x, bottom(B) + 10, B.w, into));
      } else if (slot === "outside" && g.frame) {
        create(
          "Sous le cadre",
          hLine("", g.frame.x, bottom(g.frame) + 12, g.frame.w, into),
        );
      } else if (slot === "text") {
        create("Colonne principale", vLine("", right(B) + 16, B.y, B.h, into));
      }
    }
  }

  // Réseaux et logo en bas : qui se suivent, ils sont côte à côte, sauf
  // s'ils ont été mis l'un sous l'autre. « Au-dessus » et « Sous » les
  // empilent (comme annoncé), « À côté » les réunit.
  const partner = group.length === 1 ? PAIR[field] : null;
  if (partner) {
    const visible = new Set(
      (g.items || []).filter((i) => i.rect?.h > 0).map((i) => i.item),
    );
    const adjacent = (sl) => {
      const list = (sl?.footer || []).filter(
        (k) => k === field || visible.has(k),
      );
      const a = list.indexOf(field);
      const b = list.indexOf(partner);
      return a >= 0 && b >= 0 && Math.abs(a - b) === 1;
    };
    for (const t of targets) {
      if (adjacent(t.patch.slots)) t.patch = { ...t.patch, footerPair: false };
    }
    const p = (g.items || []).find(
      (i) => i.item === partner && i.slot === "footer" && i.rect?.h > 0,
    );
    const blocks = st.blocks || {};
    const paired =
      current === "footer" &&
      st.footerPair !== false &&
      adjacent(slots) &&
      !blocks[field]?.align &&
      !blocks[partner]?.align;
    if (p && paired) {
      // Déjà côte à côte : les mettre l'un sous l'autre, dans le même ordre
      const list = (slots.footer || []).filter((k) => visible.has(k));
      const below = list.indexOf(field) > list.indexOf(partner);
      const col = g.slots?.footer || p.rect;
      targets.push(
        hLine(
          `${below ? "Sous" : "Au-dessus"} ${below ? ITEM_THE[partner] : ITEM_OF[partner]}`,
          col.x,
          below ? bottom(p.rect) + 5 : p.rect.y - 5,
          col.w,
          { slots, footerPair: false },
        ),
      );
    } else if (p) {
      // Côte à côte, à droite de l'autre (un alignement propre les
      // empêcherait : retiré)
      const unaligned = (k) => {
        // eslint-disable-next-line no-unused-vars
        const { align, ...rest } = blocks[k] || {};
        return rest;
      };
      targets.push(
        vLine(
          `À côté ${ITEM_OF[partner]}`,
          right(p.rect) + 12,
          p.rect.y,
          p.rect.h,
          {
            slots: move("footer", { after: partner }),
            footerPair: true,
            blocks: {
              ...blocks,
              [field]: unaligned(field),
              [partner]: unaligned(partner),
            },
          },
        ),
      );
    }
  }

  // Deux lignes horizontales presque confondues : on écarte la seconde
  const hs = targets.filter((t) => t.orient === "h").sort((a, b) => a.y - b.y);
  for (let i = 1; i < hs.length; i += 1) {
    const a = hs[i - 1];
    const b = hs[i];
    const overlapX =
      Math.min(a.x + a.len, b.x + b.len) - Math.max(a.x, b.x) > 0;
    if (overlapX && b.y - a.y < 12) b.y = a.y + 12;
  }
  return targets;
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

/** Distance à parcourir avant qu'un glisser compte, en px. */
const DRAG_THRESHOLD = 6;

export default function DropOverlay({
  drag,
  style,
  pointer: relayed,
  release,
  onDrop,
  onCancel,
}) {
  const [own, setOwn] = useState(null);
  const pointer = own || relayed || { x: drag.x, y: drag.y };
  const targets = useMemo(
    () => targetsFor(drag.field, style, drag),
    [drag, style],
  );
  // Élément tiré : toutes ses parties
  const group = drag.fields?.length ? drag.fields : [drag.field];
  const source = (drag.items || [])
    .filter((i) => group.includes(i.item) && i.rect?.h > 0)
    .reduce((r, { rect: c }) => {
      if (!r) return { ...c };
      const x = Math.min(r.x, c.x);
      const y = Math.min(r.y, c.y);
      return {
        x,
        y,
        w: Math.max(r.x + r.w, c.x + c.w) - x,
        h: Math.max(r.y + r.h, c.y + c.h) - y,
      };
    }, null);
  // Un appui sans bouger (ou un relâcher sur l'élément lui-même) ne déplace
  // rien : seul un vrai glisser, hors de l'élément, choisit une place
  const movedFrom = (x, y) => Math.hypot(x - drag.x, y - drag.y) > DRAG_THRESHOLD;
  const onSource = (x, y) =>
    Boolean(source) &&
    x >= source.x - 8 &&
    x <= source.x + source.w + 8 &&
    y >= source.y - 8 &&
    y <= source.y + source.h + 8;
  const placing = movedFrom(pointer.x, pointer.y) && !onSource(pointer.x, pointer.y);
  const active = placing ? nearest(targets, pointer.x, pointer.y) : null;

  const done = useRef(false);
  const finish = (x, y) => {
    if (done.current) return;
    done.current = true;
    const target =
      movedFrom(x, y) && !onSource(x, y) ? nearest(targets, x, y) : null;
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
      {/* Élément tiré, repéré en pointillés */}
      {source && (
        <div
          className="pointer-events-none fixed rounded-md border-2 border-dashed border-neutral-400"
          style={{
            left: source.x - 4,
            top: source.y - 4,
            width: source.w + 8,
            height: source.h + 8,
          }}
        />
      )}

      {/* Lignes d'insertion : discrètes, sauf la plus proche ; seulement
          une fois le glisser commencé (un simple appui n'en montre pas) */}
      {movedFrom(pointer.x, pointer.y) && targets.map((t, i) => {
        const on = t === active;
        const thick = on ? 4 : 2;
        const lineStyle =
          t.orient === "h"
            ? { left: t.x, top: t.y - thick / 2, width: t.len, height: thick }
            : { left: t.x - thick / 2, top: t.y, width: thick, height: t.len };
        return (
          <div
            key={`${t.label}-${i}`}
            className={`pointer-events-none fixed rounded-full ${
              on
                ? "bg-[#5a50ff]"
                : t.create
                  ? "bg-[#5a50ff]/20"
                  : "bg-[#5a50ff]/35"
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
        {(group.length > 1 && ITEM_LABEL[BLOCK_OF[drag.field]]) ||
          ITEM_LABEL[drag.field] ||
          drag.field}
        {!active && (
          <span className="font-normal text-neutral-300">
            {" "}
            · approchez une ligne violette
          </span>
        )}
      </div>
    </div>
  );
}
