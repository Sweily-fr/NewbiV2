"use client";

import { useMemo } from "react";

/**
 * Affiche le HTML d'une signature dans une iframe isolée : aucun style de
 * l'application ne peut fuiter dans l'aperçu, ce qui garantit que ce que
 * l'utilisateur voit est ce qu'il collera.
 *
 * `dark` simule le mode sombre des clients mail « intelligents » (Apple
 * Mail, Outlook) : les couleurs sont inversées, sauf les images.
 */
export default function HtmlFrame({
  html,
  dark = false,
  scale = 1,
  width,
  height,
  padding = 24,
  className = "",
  title = "Aperçu de la signature",
}) {
  const srcDoc = useMemo(() => {
    const bg = dark ? "#1f1f1f" : "#ffffff";
    const invert = dark
      ? ".sig{filter:invert(1) hue-rotate(180deg);} .sig img{filter:invert(1) hue-rotate(180deg);}"
      : "";
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="${
      dark ? "dark" : "light"
    }"><style>html,body{margin:0;padding:0;background:${bg};} body{padding:${padding}px;} ${invert}</style></head><body><div class="sig">${
      html || ""
    }</div></body></html>`;
  }, [html, dark, padding]);

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;
  if (scale !== 1) {
    style.transform = `scale(${scale})`;
    style.transformOrigin = "top left";
  }

  return (
    <iframe
      title={title}
      srcDoc={srcDoc}
      sandbox=""
      className={className}
      style={style}
      loading="lazy"
    />
  );
}
