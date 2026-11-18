"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/src/lib/utils";

/**
 * HTML d'un e-mail (rendu par l'API) dans une iframe isolée : aucun style
 * de l'application ne s'y mêle, et aucun script ne s'y exécute. Les liens
 * s'ouvrent dans un nouvel onglet.
 *
 * `fit` : l'iframe prend la hauteur de son contenu (la page défile, pas
 * l'iframe). Sinon elle remplit son conteneur et défile elle-même.
 */
function withBase(html) {
  const base = '<base target="_blank">';
  const source = String(html || "");
  if (/<head[^>]*>/i.test(source))
    return source.replace(/<head([^>]*)>/i, `<head$1>${base}`);
  return `${base}${source}`;
}

export function EmailFrame({
  html,
  title,
  fit = false,
  className,
  style,
  onHeight,
}) {
  const ref = useRef(null);
  const [height, setHeight] = useState(null);

  const measure = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (!doc?.documentElement) return;
    const next = Math.ceil(
      Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight || 0),
    );
    setHeight(next);
    onHeight?.(next);
  }, [onHeight]);

  // Images chargées après coup : la hauteur suit
  useEffect(() => {
    if (!fit) return undefined;
    const frame = ref.current;
    if (!frame) return undefined;
    let observer;
    const onLoad = () => {
      measure();
      const doc = frame.contentDocument;
      if (doc?.body && typeof ResizeObserver !== "undefined") {
        observer?.disconnect();
        observer = new ResizeObserver(measure);
        observer.observe(doc.body);
      }
    };
    frame.addEventListener("load", onLoad);
    return () => {
      frame.removeEventListener("load", onLoad);
      observer?.disconnect();
    };
  }, [fit, measure, html]);

  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={withBase(html)}
      // Pas de script ; même origine pour mesurer la hauteur du contenu
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className={cn("block w-full border-0 bg-white", className)}
      style={{ ...(fit && height ? { height } : {}), ...style }}
    />
  );
}

/**
 * Vignette d'un e-mail : rendu à `renderWidth` px puis réduit à la largeur
 * du conteneur, hauteur `height`. Ni cliquable ni atteignable au clavier.
 */
export function EmailThumbnail({
  html,
  height = 260,
  renderWidth = 680,
  className,
}) {
  const wrapper = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = wrapper.current;
    if (!element) return undefined;
    const update = () => setWidth(element.clientWidth);
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const scale = width ? width / renderWidth : 0;
  return (
    <div
      ref={wrapper}
      aria-hidden
      inert
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height }}
    >
      {scale > 0 && (
        <div
          className="pointer-events-none absolute top-0 left-0 origin-top-left"
          style={{
            width: renderWidth,
            height: height / scale,
            transform: `scale(${scale})`,
          }}
        >
          <EmailFrame
            html={html}
            title="Vignette de l'e-mail"
            className="h-full"
          />
        </div>
      )}
    </div>
  );
}
