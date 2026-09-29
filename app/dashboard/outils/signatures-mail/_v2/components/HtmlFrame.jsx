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
 *
 * Toujours en mode éditeur :
 * - `onTextInput(field, value)` : un texte marqué data-sig-edit se modifie
 *   en place (clic, frappe, Entrée ou Échap pour valider). Pendant la
 *   frappe, `frozen` garde le HTML affiché pour ne pas recharger l'iframe
 *   sous le curseur ; `onEditingChange(bool)` signale début et fin.
 * - `onDragStart({ field, sig, photo, x, y })` : un bloc déplaçable tiré de
 *   plus de 6 px ; les rectangles sont en coordonnées de la page. Le
 *   navigateur continue d'envoyer la souris à l'iframe où le bouton a été
 *   pressé : le script relaie donc aussi `onDragMove` / `onDragEnd`.
 */

/** Script injecté dans l'aperçu éditeur (sans accès au parent). */
const EDITOR_SCRIPT = `(function(){
var MOVABLE={photo:1,social:1,logo:1,cta:1,banner:1,disclaimer:1};
var post=function(m){parent.postMessage(m,"*");};
var start=null,editing=null,dragging=false;
function h(){post({type:"sig-height",height:document.documentElement.scrollHeight});}
new ResizeObserver(h).observe(document.body);window.addEventListener("load",h);h();
function rect(el){var r=el.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};}
document.addEventListener("pointerdown",function(e){
if(editing&&editing.contains(e.target))return;
start={x:e.clientX,y:e.clientY,el:e.target.closest("[data-sig-field]")};
},true);
document.addEventListener("pointermove",function(e){
if(dragging){post({type:"sig-drag-move",x:e.clientX,y:e.clientY});return;}
if(!start||!start.el)return;
var f=start.el.getAttribute("data-sig-field");
if(!MOVABLE[f])return;
if(Math.abs(e.clientX-start.x)+Math.abs(e.clientY-start.y)<6)return;
var sig=document.querySelector(".sig > table")||document.querySelector(".sig");
var ph=document.querySelector('[data-sig-field="photo"]');
post({type:"sig-drag",field:f,sig:rect(sig),photo:ph?rect(ph):null,x:e.clientX,y:e.clientY});
start=null;dragging=true;e.preventDefault();
},true);
document.addEventListener("pointerup",function(e){
if(dragging){dragging=false;post({type:"sig-drag-end",x:e.clientX,y:e.clientY});}
setTimeout(function(){start=null;},0);
},true);
document.addEventListener("dragstart",function(e){e.preventDefault();},true);
function startEdit(el,x,y){
editing=el;el.setAttribute("contenteditable","plaintext-only");el.focus();
var r=document.caretRangeFromPoint&&document.caretRangeFromPoint(x,y);
if(r&&el.contains(r.startContainer)){var s=getSelection();s.removeAllRanges();s.addRange(r);}
post({type:"sig-editing",editing:true});
}
document.addEventListener("click",function(e){
if(e.target.closest("a"))e.preventDefault();
if(editing&&editing.contains(e.target))return;
e.stopPropagation();
var ed=e.target.closest("[data-sig-edit]");
var m=e.target.closest("[data-sig-field]");
if(m)post({type:"sig-field",field:m.getAttribute("data-sig-field"),edit:!!ed});
if(ed)startEdit(ed,e.clientX,e.clientY);
},true);
document.addEventListener("input",function(){
if(editing)post({type:"sig-input",field:editing.getAttribute("data-sig-edit"),value:editing.textContent});
});
document.addEventListener("keydown",function(e){
if(editing&&(e.key==="Enter"||e.key==="Escape")){e.preventDefault();editing.blur();}
});
document.addEventListener("focusout",function(e){
if(editing&&e.target===editing){editing.removeAttribute("contenteditable");editing=null;post({type:"sig-editing",editing:false});}
});
})();`;
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
  onTextInput,
  onEditingChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  frozen = false,
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
        onFieldClick(data.field, { edit: Boolean(data.edit) });
      }
      if (data && data.type === "sig-input" && typeof data.field === "string") {
        onTextInput?.(data.field, String(data.value ?? ""));
      }
      if (data && data.type === "sig-editing") {
        onEditingChange?.(Boolean(data.editing));
      }
      if (data && (data.type === "sig-drag-move" || data.type === "sig-drag-end")) {
        const box = frameRef.current?.getBoundingClientRect();
        if (box) {
          const point = { x: data.x + box.left, y: data.y + box.top };
          if (data.type === "sig-drag-move") onDragMove?.(point);
          else onDragEnd?.(point);
        }
      }
      if (data && data.type === "sig-drag" && typeof data.field === "string") {
        // Coordonnées de l'iframe → coordonnées de la page
        const box = frameRef.current?.getBoundingClientRect();
        if (box) {
          const toPage = (r) => r && { ...r, x: r.x + box.left, y: r.y + box.top };
          onDragStart?.({
            field: data.field,
            sig: toPage(data.sig),
            photo: toPage(data.photo),
            x: data.x + box.left,
            y: data.y + box.top,
          });
        }
      }
      if (data && data.type === "sig-height" && Number.isFinite(data.height)) {
        setContentHeight(Math.ceil(data.height));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [
    interactive,
    onFieldClick,
    onTextInput,
    onEditingChange,
    onDragStart,
    onDragMove,
    onDragEnd,
  ]);

  // Pendant une modification en place, le HTML affiché ne change pas
  const shownHtml = useRef(html);
  if (!frozen) shownHtml.current = html;
  const displayed = shownHtml.current;

  const srcDoc = useMemo(() => {
    const bg = dark ? "#1f1f1f" : "#ffffff";
    const invert = dark
      ? ".sig{filter:invert(1) hue-rotate(180deg);} .sig img{filter:invert(1) hue-rotate(180deg);}"
      : "";
    // <base target="_blank"> : un clic sur un lien de la signature ouvre un
    // nouvel onglet au lieu de remplacer l'aperçu par la page cible (ou par
    // une page d'erreur si l'adresse est incomplète).
    const editorCss = interactive
      ? "[data-sig-field]{cursor:pointer;border-radius:3px;transition:box-shadow .12s;} [data-sig-field]:hover{box-shadow:0 0 0 2px #5a50ff;} a{cursor:pointer;} [data-sig-field=photo],[data-sig-field=social],[data-sig-field=logo],[data-sig-field=cta],[data-sig-field=banner],[data-sig-field=disclaimer]{cursor:grab;} [data-sig-edit]{cursor:text;} [data-sig-edit]:hover{outline:1px dashed #5a50ff;outline-offset:1px;} [contenteditable]{outline:2px solid #5a50ff;outline-offset:2px;border-radius:2px;cursor:text;} img{-webkit-user-drag:none;user-select:none;}"
      : "";
    const editorScript = interactive ? `<script>${EDITOR_SCRIPT}</script>` : "";
    return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><meta name="color-scheme" content="${
      dark ? "dark" : "light"
    }"><style>html,body{margin:0;padding:0;background:${bg};} body{padding:${padding}px;} ${invert} ${editorCss}</style></head><body><div class="sig">${
      displayed || ""
    }</div>${editorScript}</body></html>`;
  }, [displayed, dark, padding, interactive]);

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
