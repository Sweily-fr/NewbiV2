"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Affiche le HTML d'une signature dans une iframe isolée : aucun style de
 * l'application ne peut fuiter dans l'aperçu, ce qui garantit que ce que
 * l'utilisateur voit est ce qu'il collera.
 *
 * `dark` simule le mode sombre des clients mail « intelligents » (Apple
 * Mail, Outlook) : les couleurs sont inversées, sauf les images.
 *
 * `onFieldClick(field)` : en mode éditeur, un clic sur un élément marqué
 * (data-sig-field, fourni par previewHtml) remonte le champ au parent au
 * lieu de suivre le lien. Un petit script est alors autorisé dans le bac à
 * sable ; il ne peut ni accéder au parent ni sortir de l'iframe.
 *
 * En mode éditeur, l'iframe prend la hauteur de son contenu (le script la
 * remonte à chaque changement) : c'est la page qui défile, jamais l'iframe,
 * donc une grande signature reste entièrement visible.
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
  onFieldClick,
}) {
  const frameRef = useRef(null);
  const interactive = typeof onFieldClick === "function";
  const [contentHeight, setContentHeight] = useState(null);

  useEffect(() => {
    if (!interactive) return undefined;
    const onMessage = (event) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data;
      if (data && data.type === "sig-field" && typeof data.field === "string") {
        onFieldClick(data.field);
      }
      if (data && data.type === "sig-height" && Number.isFinite(data.height)) {
        setContentHeight(Math.ceil(data.height));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [interactive, onFieldClick]);

  const srcDoc = useMemo(() => {
    const bg = dark ? "#1f1f1f" : "#ffffff";
    const invert = dark
      ? ".sig{filter:invert(1) hue-rotate(180deg);} .sig img{filter:invert(1) hue-rotate(180deg);}"
      : "";
    // <base target="_blank"> : un clic sur un lien de la signature ouvre un
    // nouvel onglet au lieu de remplacer l'aperçu par la page cible (ou par
    // une page d'erreur si l'adresse est incomplète).
    const editorCss = interactive
      ? "[data-sig-field]{cursor:pointer;border-radius:3px;transition:box-shadow .12s;} [data-sig-field]:hover{box-shadow:0 0 0 2px #5a50ff;} a{cursor:pointer;}"
      : "";
    const editorScript = interactive
      ? `<script>document.addEventListener("click",function(e){var m=e.target.closest("[data-sig-field]");if(m){e.preventDefault();e.stopPropagation();parent.postMessage({type:"sig-field",field:m.getAttribute("data-sig-field")},"*");return;}if(e.target.closest("a")){e.preventDefault();}},true);function h(){parent.postMessage({type:"sig-height",height:document.documentElement.scrollHeight},"*");}new ResizeObserver(h).observe(document.body);window.addEventListener("load",h);h();</script>`
      : "";
    return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><meta name="color-scheme" content="${
      dark ? "dark" : "light"
    }"><style>html,body{margin:0;padding:0;background:${bg};} body{padding:${padding}px;} ${invert} ${editorCss}</style></head><body><div class="sig">${
      html || ""
    }</div>${editorScript}</body></html>`;
  }, [html, dark, padding, interactive]);

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;
  else if (interactive && contentHeight) style.height = contentHeight;
  if (scale !== 1) {
    style.transform = `scale(${scale})`;
    style.transformOrigin = "top left";
  }

  return (
    <iframe
      ref={frameRef}
      title={title}
      srcDoc={srcDoc}
      sandbox={
        interactive
          ? "allow-scripts allow-popups allow-popups-to-escape-sandbox"
          : "allow-popups allow-popups-to-escape-sandbox"
      }
      className={className}
      style={style}
      loading="lazy"
    />
  );
}
