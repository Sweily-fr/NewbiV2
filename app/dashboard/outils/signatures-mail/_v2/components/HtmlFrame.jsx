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
 * - `onDragStart({ field, sig, photo, blocks, x, y })` : un bloc tiré par sa
 *   poignée (⠿, affichée au survol : déplacer ne se confond jamais avec
 *   modifier un texte) ; les rectangles sont en coordonnées de la page. Le
 *   navigateur continue d'envoyer la souris à l'iframe où le bouton a été
 *   pressé : le script relaie donc aussi `onDragMove` / `onDragEnd`.
 */

/** Script injecté dans l'aperçu éditeur (sans accès au parent). */
const EDITOR_SCRIPT = `(function(){
var post=function(m){parent.postMessage(m,"*");};
var editing=null,dragging=false,hover=null,hideT=null;
function h(){post({type:"sig-height",height:document.documentElement.scrollHeight});}
new ResizeObserver(h).observe(document.body);window.addEventListener("load",h);h();
function rect(el){var r=el.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};}
var grip=document.createElement("div");
grip.textContent="\u283F";grip.title="Déplacer";
grip.style.cssText="position:absolute;display:none;width:16px;height:22px;border-radius:4px;background:#5a50ff;color:#fff;font:13px/22px Arial,sans-serif;text-align:center;cursor:grab;z-index:10;user-select:none;box-shadow:0 1px 3px rgba(0,0,0,.3);";
document.body.appendChild(grip);
function showGrip(b){hover=b;var r=b.getBoundingClientRect();grip.style.left=Math.max(0,r.left+scrollX-20)+"px";grip.style.top=(r.top+scrollY)+"px";grip.style.display="block";}
function hideGrip(){grip.style.display="none";hover=null;}
document.addEventListener("mouseover",function(e){
if(dragging||editing)return;
clearTimeout(hideT);
if(e.target===grip)return;
var b=e.target.closest("[data-sig-block]");
if(b)showGrip(b);else hideT=setTimeout(hideGrip,400);
});
document.addEventListener("mouseleave",function(){hideT=setTimeout(hideGrip,400);});
grip.addEventListener("pointerdown",function(e){
if(!hover)return;e.preventDefault();e.stopPropagation();
var blocks={};
document.querySelectorAll("[data-sig-block]").forEach(function(el){var k=el.getAttribute("data-sig-block");if(!blocks[k])blocks[k]=rect(el);});
var sig=document.querySelector(".sig > table")||document.querySelector(".sig");
var field=hover.getAttribute("data-sig-block");
dragging=true;hideGrip();
post({type:"sig-drag",field:field,sig:rect(sig),photo:blocks.photo||null,blocks:blocks,x:e.clientX,y:e.clientY});
});
document.addEventListener("pointermove",function(e){if(dragging)post({type:"sig-drag-move",x:e.clientX,y:e.clientY});},true);
document.addEventListener("pointerup",function(e){if(dragging){dragging=false;post({type:"sig-drag-end",x:e.clientX,y:e.clientY});}},true);
document.addEventListener("dragstart",function(e){e.preventDefault();},true);
function startEdit(el,x,y){
editing=el;hideGrip();el.setAttribute("contenteditable","plaintext-only");el.focus();
var r=document.caretRangeFromPoint&&document.caretRangeFromPoint(x,y);
if(r&&el.contains(r.startContainer)){var s=getSelection();s.removeAllRanges();s.addRange(r);}
post({type:"sig-editing",editing:true});
}
document.addEventListener("click",function(e){
if(e.target===grip)return;
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
            blocks: Object.fromEntries(
              Object.entries(data.blocks || {}).map(([k, r]) => [k, toPage(r)]),
            ),
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
      ? "[data-sig-field]{cursor:pointer;border-radius:3px;transition:box-shadow .12s;} [data-sig-field]:hover{box-shadow:0 0 0 2px #5a50ff;} a{cursor:pointer;} [data-sig-edit]{cursor:text;} [data-sig-edit]:hover{outline:1px dashed #5a50ff;outline-offset:1px;} [contenteditable]{outline:2px solid #5a50ff;outline-offset:2px;border-radius:2px;cursor:text;} img{-webkit-user-drag:none;user-select:none;}"
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
