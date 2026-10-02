"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BLOCK_OF,
  ELEMENT_ITEMS,
  ITEM_LABEL,
  ITEM_OF,
  ITEM_THE,
  moveItems,
  setPhotoPlacement,
  slotOf,
  withDividerSpace,
} from "../slots";

/**
 * Glisser-déposer d'un élément de l'aperçu, façon Figma / Notion. Tout
 * élément va dans n'importe quel emplacement (bandeau, colonne photo,
 * colonne principale, colonne de droite, bas du cadre, sous le cadre), à
 * n'importe quelle place : des lignes d'insertion fines, calées sur la
 * géométrie réelle du rendu, et seule la plus proche du pointeur s'allume,
 * avec son nom. Un emplacement vide se crée en déposant sur sa ligne ou sur
 * sa pastille, visible dès le début du glisser (« + Nouvelle colonne à
 * droite »). La place actuelle n'est jamais proposée.
 *
 * Posé en plein écran au-dessus de l'aperçu pendant le glisser. Le
 * pointeur arrive par deux chemins : les événements de cet écran, ou ceux
 * relayés par l'aperçu (le navigateur garde la souris dans l'iframe où le
 * bouton a été pressé) ; le premier relâchement reçu l'emporte. L'aperçu
 * défile pendant le glisser (molette, pointeur près de son haut ou de son
 * bas) : les lignes, calculées au départ, suivent la signature.
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

  // Éléments affichés dans l'aperçu
  const shownNow = new Set(
    (g.items || []).filter((i) => i.rect?.h > 0).map((i) => i.item),
  );
  // Emplacements sans élément affiché (hors élément tiré)
  const emptySlot = (slot) =>
    !(g.items || []).some(
      (i) => i.slot === slot && !group.includes(i.item) && i.rect?.h > 0,
    );
  // Photo seule dans sa colonne (rien d'autre n'y est affiché) : ses deux
  // places de bord sont celles de « Position de la photo » (plus bas)
  const photoAlone =
    group.length === 1 && group[0] === "photo" && emptySlot("visual");
  // Bord droit de la signature, décalé si la colonne principale se crée
  // aussi à droite
  const rightEdge = () =>
    right(B) + (emptySlot("text") && current !== "text" ? 44 : 16);

  for (const slot of SLOTS) {
    if (photoAlone && slot === "visual") continue;
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
        create("Nouvelle colonne à gauche", {
          ...vLine("", B.x - 16, B.y, B.h, { ...into, visualSide: "left" }),
          edge: "left",
        });
      } else if (slot === "side") {
        // Photo seule : « Photo à droite » la remplace (plus bas)
        if (!photoAlone) {
          create(
            "Nouvelle colonne à droite",
            vLine("", rightEdge(), B.y, B.h, into),
          );
        }
      } else if (slot === "header") {
        const top = (g.frame || B).y;
        create("En-tête coloré", hLine("", B.x, top - 12, B.w, into));
      } else if (slot === "footer") {
        // Avec un cadre : dans le cadre, bien distinct de « Sous le cadre »
        const y = g.frame
          ? Math.min(bottom(B) + 10, bottom(g.frame) - 6)
          : bottom(B) + 10;
        create("En bas", hLine("", B.x, y, B.w, into));
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

  // Photo seule dans sa colonne : à gauche ou à droite du texte, exactement
  // comme « Position de la photo » (sa colonne garde son fond, sa largeur,
  // son alignement, et les marges du séparateur changent de côté avec
  // elle), y compris pour revenir à gauche ; jamais le côté où elle est
  if (photoAlone) {
    const side =
      current === "visual"
        ? st.visualSide === "right"
          ? "right"
          : "left"
        : null;
    const place = (to) => setPhotoPlacement(st, to, shownNow);
    if (side !== "left") {
      targets.push({
        ...vLine("Photo à gauche", B.x - 16, B.y, B.h, place("left")),
        create: true,
        edge: "left",
      });
    }
    if (side !== "right") {
      targets.push({
        ...vLine("Photo à droite", rightEdge(), B.y, B.h, place("right")),
        create: true,
      });
    }
  }

  // Réseaux et logo en bas : qui se suivent, ils sont côte à côte, sauf
  // s'ils ont été mis l'un sous l'autre. « Au-dessus » et « Sous » les
  // empilent (comme annoncé), « À gauche » et « À droite » les mettent côte
  // à côte de ce côté de l'autre (inverser la paire en un seul glisser).
  const partner = group.length === 1 ? PAIR[field] : null;
  if (partner) {
    const visible = shownNow;
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
    // Côte à côte, à gauche ou à droite de l'autre
    const leftOf = (patch) =>
      vLine(`À gauche ${ITEM_OF[partner]}`, p.rect.x - 12, p.rect.y, p.rect.h, {
        ...patch,
        slots: move("footer", { before: partner }),
        footerPair: true,
      });
    const rightOf = (patch) =>
      vLine(`À droite ${ITEM_OF[partner]}`, right(p.rect) + 12, p.rect.y, p.rect.h, {
        ...patch,
        slots: move("footer", { after: partner }),
        footerPair: true,
      });
    if (p && paired) {
      // Déjà côte à côte : les mettre l'un sous l'autre, dans le même ordre,
      // ou les inverser (jamais le côté où il est déjà)
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
        below ? leftOf({}) : rightOf({}),
      );
    } else if (p) {
      // Un alignement propre les empêcherait d'être côte à côte : retiré
      const unaligned = { ...blocks };
      for (const k of [field, partner]) {
        // eslint-disable-next-line no-unused-vars
        const { align, ...rest } = blocks[k] || {};
        if (Object.keys(rest).length > 0) unaligned[k] = rest;
        else delete unaligned[k];
      }
      targets.push(
        leftOf({ blocks: unaligned }),
        rightOf({ blocks: unaligned }),
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
  // Photo passée de l'autre côté du texte (ou colonne photo vidée) : les
  // marges du séparateur la suivent, comme par les réglages
  for (const t of targets) t.patch = withDividerSpace(st, t.patch, shownNow);
  return targets;
}

/** Pastilles des places qui créent une zone : hauteur, en px. */
const BADGE_H = 20;

let textCtx = null;
/** Largeur d'un libellé de pastille (11 px, police de la page). */
function labelWidth(text) {
  try {
    textCtx = textCtx || document.createElement("canvas").getContext("2d");
    const family = getComputedStyle(document.body).fontFamily || "sans-serif";
    textCtx.font = `500 11px ${family}`;
    return Math.ceil(textCtx.measureText(text).width);
  } catch {
    return Math.ceil(text.length * 6.5);
  }
}

/**
 * Pastilles des places qui créent une zone (« + Nouvelle colonne à
 * droite », « + En-tête coloré »…), montrées dès le début du glisser : un
 * trait pâle sans nom passait pour une bordure. Centrée sur un trait
 * horizontal, à droite d'un trait vertical ; sur le trait de gauche (16 px
 * de marge seulement), une simple « + », le nom venant à l'approche. Deux
 * pastilles qui se chevauchent : la seconde va au bout de son trait.
 */
function withBadges(targets) {
  const placed = [];
  const overlaps = (a, b) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  return targets.map((t) => {
    if (!t.create) return t;
    let badge;
    if (t.edge === "left") {
      badge = {
        x: t.x - BADGE_H / 2,
        y: t.y + t.len / 2 - BADGE_H / 2,
        w: BADGE_H,
        text: "+",
        round: true,
      };
    } else {
      const text = `+ ${t.label}`;
      // Marges intérieures (8 px) et bordure (1 px) de chaque côté
      const w = labelWidth(text) + 18;
      badge =
        t.orient === "h"
          ? { x: t.x + t.len / 2 - w / 2, y: t.y - BADGE_H / 2, w, text }
          : { x: t.x + 6, y: t.y + t.len / 2 - BADGE_H / 2, w, text };
    }
    badge.h = BADGE_H;
    if (placed.some((o) => overlaps(o, badge))) {
      if (t.orient === "h") badge.x = t.x + t.len - badge.w;
      else badge.y = t.y + t.len - badge.h;
    }
    placed.push(badge);
    return { ...t, badge };
  });
}

/** Distance du pointeur à une ligne (segment) ; nulle sur sa pastille. */
function distance(t, x, y) {
  const b = t.badge;
  if (b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return 0;
  if (t.orient === "h") {
    const cx = Math.max(t.x, Math.min(x, t.x + t.len));
    return Math.hypot(x - cx, y - t.y);
  }
  const cy = Math.max(t.y, Math.min(y, t.y + t.len));
  return Math.hypot(x - t.x, y - cy);
}

function nearest(targets, x, y, usable) {
  let best = null;
  let bestD = SNAP;
  for (const t of targets) {
    if (usable && !usable(t)) continue;
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
/** Bande (px) près du haut ou du bas de l'aperçu qui le fait défiler. */
const EDGE = 40;

export default function DropOverlay({
  drag,
  style,
  pointer: relayed,
  release,
  onDrop,
  onCancel,
  scroller,
}) {
  const [own, setOwn] = useState(null);
  // Dernier pointeur reçu, en coordonnées de l'écran
  const pointer = own || relayed || { x: drag.x, y: drag.y };
  const targets = useMemo(
    () => withBadges(targetsFor(drag.field, style, drag)),
    [drag, style],
  );

  // Défilement de l'aperçu (`scroller`) pendant le glisser : les lignes,
  // calculées au départ, sont dessinées décalées de ce qu'il a défilé, et
  // le pointeur est ramené dans le repère du départ (sans recalculer les
  // lignes). `clip` : zone visible de l'aperçu, la seule où l'on dessine.
  const [shift, setShift] = useState(0);
  const shiftRef = useRef(0);
  const [clip, setClip] = useState(null);
  useEffect(() => {
    const el = scroller?.current;
    if (!el) return undefined;
    const top0 = el.scrollTop;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setClip({ top: r.top, bottom: r.bottom });
    };
    const onScroll = () => {
      shiftRef.current = top0 - el.scrollTop;
      setShift(shiftRef.current);
    };
    measure();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [scroller]);
  const at = { x: pointer.x, y: pointer.y - shift };
  // Seules les places visibles dans l'aperçu (défilé de `s`) se visent :
  // les autres viennent en le faisant défiler
  const visibleAt = (s) => (t) => {
    if (!clip) return true;
    let y0 = t.y;
    let y1 = t.orient === "h" ? t.y : t.y + t.len;
    if (t.badge) {
      y0 = Math.min(y0, t.badge.y);
      y1 = Math.max(y1, t.badge.y + t.badge.h);
    }
    return y1 >= clip.top - s && y0 <= clip.bottom - s;
  };

  // Élément tiré : toutes ses parties, et son nom (près du pointeur, puis
  // dans le message du dépôt)
  const group = drag.fields?.length ? drag.fields : [drag.field];
  const what =
    (group.length > 1 && ITEM_LABEL[BLOCK_OF[drag.field]]) ||
    ITEM_LABEL[drag.field] ||
    drag.field;
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
  // rien : seul un vrai glisser, hors de l'élément, choisit une place.
  // Coordonnées dans le repère du départ.
  const movedFrom = (x, y) =>
    Math.hypot(x - drag.x, y - drag.y) > DRAG_THRESHOLD;
  const onSource = (x, y) =>
    Boolean(source) &&
    x >= source.x - 8 &&
    x <= source.x + source.w + 8 &&
    y >= source.y - 8 &&
    y <= source.y + source.h + 8;
  const started = movedFrom(at.x, at.y);
  const placing = started && !onSource(at.x, at.y);
  const active = placing
    ? nearest(targets, at.x, at.y, visibleAt(shift))
    : null;

  const done = useRef(false);
  const finish = (x, y) => {
    if (done.current) return;
    done.current = true;
    const s = shiftRef.current;
    const y0 = y - s;
    const target =
      movedFrom(x, y0) && !onSource(x, y0)
        ? nearest(targets, x, y0, visibleAt(s))
        : null;
    if (target) onDrop(target.patch, { what, where: target.label });
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

  // Molette pendant le glisser : elle arrive sur ce calque, elle fait
  // défiler l'aperçu (et non la page)
  const root = useRef(null);
  useEffect(() => {
    const el = root.current;
    const sc = scroller?.current;
    if (!el || !sc) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const unit =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? sc.clientHeight : 1;
      sc.scrollTop += e.deltaY * unit;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scroller]);

  // Pointeur près du haut ou du bas de l'aperçu (ou au-delà) : il défile,
  // de 2 à 18 px par image selon la profondeur, même pointeur immobile
  // (l'aperçu n'envoie rien quand la souris ne bouge pas)
  const last = useRef(pointer);
  useEffect(() => {
    last.current = pointer;
  });
  useEffect(() => {
    const sc = scroller?.current;
    if (!sc) return undefined;
    let raf = 0;
    const tick = () => {
      const p = last.current;
      const moved =
        p &&
        Math.hypot(p.x - drag.x, p.y - shiftRef.current - drag.y) >
          DRAG_THRESHOLD;
      if (moved && !done.current) {
        const r = sc.getBoundingClientRect();
        const near = p.x >= r.left - EDGE && p.x <= r.right + EDGE;
        const down = p.y - (r.bottom - EDGE);
        const up = r.top + EDGE - p.y;
        const depth = down > 0 ? down : up > 0 ? -up : 0;
        if (near && depth) {
          const k = Math.min(1, Math.abs(depth) / EDGE);
          sc.scrollTop += Math.sign(depth) * Math.round(2 + 16 * k);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scroller, drag]);

  // Repère du dessin : la zone visible de l'aperçu (rien ne déborde sur la
  // barre d'outils ou la jauge), décalée de ce qu'il a défilé
  const top0 = clip ? clip.top : 0;
  const Y = (y) => y + shift - top0;
  const area = clip
    ? { top: clip.top, height: clip.bottom - clip.top }
    : { top: 0, bottom: 0 };

  return (
    <div
      ref={root}
      className="fixed inset-0 z-50 cursor-grabbing"
      onPointerMove={(e) => setOwn({ x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => finish(e.clientX, e.clientY)}
    >
      <div
        className="pointer-events-none fixed inset-x-0 overflow-hidden"
        style={area}
      >
        {/* Élément tiré, repéré en pointillés */}
        {source && (
          <div
            className="absolute rounded-md border-2 border-dashed border-neutral-400"
            style={{
              left: source.x - 4,
              top: Y(source.y) - 4,
              width: source.w + 8,
              height: source.h + 8,
            }}
          />
        )}

        {/* Lignes d'insertion : discrètes, sauf la plus proche ; places qui
            créent une zone : trait pointillé plein ton et pastille ; le
            tout une fois le glisser commencé (un simple appui n'en montre
            pas) */}
        {started &&
          targets.map((t, i) => {
            const on = t === active;
            const thick = on ? 4 : 2;
            const dashed = t.create && !on;
            const lineStyle =
              t.orient === "h"
                ? {
                    left: t.x,
                    top: Y(t.y) - thick / 2,
                    width: t.len,
                    height: dashed ? 0 : thick,
                  }
                : {
                    left: t.x - thick / 2,
                    top: Y(t.y),
                    width: dashed ? 0 : thick,
                    height: t.len,
                  };
            const b = t.badge;
            return (
              <div key={`${t.label}-${i}`}>
                <div
                  className={`absolute ${
                    dashed
                      ? `border-dashed border-[#5a50ff] ${
                          t.orient === "h" ? "border-t-2" : "border-l-2"
                        }`
                      : `rounded-full ${on ? "bg-[#5a50ff]" : "bg-[#5a50ff]/35"}`
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
                {b && (
                  <div
                    className={`absolute flex items-center justify-center whitespace-nowrap rounded-full border text-[11px] font-medium leading-none shadow-sm ${
                      on
                        ? "border-[#5a50ff] bg-[#5a50ff] text-white"
                        : "border-dashed border-[#5a50ff] bg-white text-[#5a50ff]"
                    } ${b.round ? "" : "px-2"}`}
                    style={{
                      left: b.x,
                      top: Y(b.y),
                      height: b.h,
                      width: b.round ? b.w : undefined,
                    }}
                  >
                    {b.text}
                  </div>
                )}
              </div>
            );
          })}

        {/* Nom de la place visée, collé à sa ligne (une pastille nommée le
            porte déjà) */}
        {active && !(active.badge && !active.badge.round) && (
          <div
            className="absolute whitespace-nowrap rounded-md bg-[#5a50ff] px-2 py-0.5 text-xs font-medium text-white shadow-md"
            style={
              active.orient === "h"
                ? {
                    left: active.x,
                    // En haut de l'aperçu : sous sa ligne
                    top: Y(active.y) >= 28 ? Y(active.y) - 28 : Y(active.y) + 8,
                  }
                : { left: active.x + 10, top: Y(active.y) }
            }
          >
            {active.label}
          </div>
        )}
      </div>

      {/* Étiquette qui suit le pointeur */}
      <div
        className="pointer-events-none fixed whitespace-nowrap rounded-md bg-neutral-900/90 px-2.5 py-1 text-xs font-medium text-white shadow-lg"
        style={{ left: pointer.x + 14, top: pointer.y + 14 }}
      >
        {what}
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
