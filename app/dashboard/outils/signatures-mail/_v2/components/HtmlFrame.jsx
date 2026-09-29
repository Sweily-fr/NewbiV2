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
 * - `onDragStart({ field, sig, items, slots, body, frame, x, y })` : un
 *   élément tiré par sa poignée (⠿, affichée au survol : déplacer ne se
 *   confond jamais avec
 *   modifier un texte) ; les rectangles sont en coordonnées de la page. Le
 *   navigateur continue d'envoyer la souris à l'iframe où le bouton a été
 *   pressé : le script relaie donc aussi `onDragMove` / `onDragEnd`.
 * - `onHistory(redo)` : ⌘Z / ⇧⌘Z pressés dans l'aperçu (hors saisie).
 * - `readOnly` : ni modification en place ni poignée (abonnement expiré) ;
 *   un clic ouvre seulement le panneau de l'élément.
 */

/** Script injecté dans l'aperçu éditeur (sans accès au parent). */
const EDITOR_SCRIPT = `(function(){
var post=function(m){parent.postMessage(m,"*");};
var editing=null,dragging=false,hover=null,hideT=null;
function h(){var d=document.documentElement;post({type:"sig-height",height:d.scrollHeight,overflow:d.scrollWidth>d.clientWidth+1});}
new ResizeObserver(h).observe(document.body);window.addEventListener("load",h);h();
function rect(el){var r=el.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};}
function crect(el){var g=document.createRange();g.selectNodeContents(el);var r=g.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};}
function q(s,content){var el=document.querySelector(s);return el?(content?crect(el):rect(el)):null;}
var grip=document.createElement("div");
grip.textContent="\u283F";grip.title="Déplacer";
grip.style.cssText="position:absolute;display:none;width:16px;height:22px;border-radius:4px;background:#5a50ff;color:#fff;font:13px/22px Arial,sans-serif;text-align:center;cursor:grab;z-index:10;user-select:none;box-shadow:0 1px 3px rgba(0,0,0,.3);";
document.body.appendChild(grip);
function showGrip(b){if(window.SIG_READONLY)return;hover=b;var r=b.getBoundingClientRect();
if(getComputedStyle(b).display==="inline"){grip.style.left=(r.left+scrollX)+"px";grip.style.top=Math.max(0,r.top+scrollY-24)+"px";}
else{grip.style.left=Math.max(0,r.left+scrollX-20)+"px";grip.style.top=(r.top+scrollY)+"px";}
grip.style.display="block";}
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
var items=[];
document.querySelectorAll("[data-sig-block]").forEach(function(el){var s=el.closest("[data-sig-slot]");items.push({item:el.getAttribute("data-sig-block"),slot:s?s.getAttribute("data-sig-slot"):null,rect:crect(el)});});
var slots={};
document.querySelectorAll("[data-sig-slot]").forEach(function(el){var k=el.getAttribute("data-sig-slot");var r=crect(el);var a=slots[k];if(!a){slots[k]=r;return;}var x=Math.min(a.x,r.x),y=Math.min(a.y,r.y);slots[k]={x:x,y:y,w:Math.max(a.x+a.w,r.x+r.w)-x,h:Math.max(a.y+a.h,r.y+r.h)-y};});
var sig=document.querySelector(".sig > table")||document.querySelector(".sig");
var field=hover.getAttribute("data-sig-block");
dragging=true;hideGrip();
post({type:"sig-drag",field:field,sig:rect(sig),items:items,slots:slots,body:q("[data-sig-body]",true),frame:q("[data-sig-frame] > table")||q("[data-sig-frame]",true),x:e.clientX,y:e.clientY});
});
document.addEventListener("pointermove",function(e){if(dragging)post({type:"sig-drag-move",x:e.clientX,y:e.clientY});},true);
document.addEventListener("pointerup",function(e){if(dragging){dragging=false;post({type:"sig-drag-end",x:e.clientX,y:e.clientY});}},true);
document.addEventListener("dragstart",function(e){e.preventDefault();},true);
function startEdit(el,x,y){
if(window.SIG_READONLY)return;
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
var bk=m?null:e.target.closest("[data-sig-block]");
if(m||bk)post({type:"sig-field",field:m?m.getAttribute("data-sig-field"):bk.getAttribute("data-sig-block"),edit:!!ed&&!window.SIG_READONLY});
if(ed)startEdit(ed,e.clientX,e.clientY);
},true);
document.addEventListener("input",function(){
if(editing)post({type:"sig-input",field:editing.getAttribute("data-sig-edit"),value:editing.textContent});
});
document.addEventListener("keydown",function(e){
if(editing&&(e.key==="Enter"||e.key==="Escape")){e.preventDefault();editing.blur();return;}
var k=(e.key||"").toLowerCase();
if(!editing&&(e.metaKey||e.ctrlKey)&&(k==="z"||k==="y")){e.preventDefault();post({type:"sig-history",redo:k==="y"||e.shiftKey});}
});
document.addEventListener("focusout",function(e){
if(editing&&e.target===editing){editing.removeAttribute("contenteditable");editing=null;post({type:"sig-editing",editing:false});}
});
var sel=null,rs=null,fs=null;
var box=document.createElement("div");
box.style.cssText="position:absolute;display:none;pointer-events:none;border:2px solid #5a50ff;border-radius:5px;z-index:9;";
var knob=document.createElement("div");
knob.style.cssText="position:absolute;right:-7px;top:50%;width:10px;height:20px;margin-top:-10px;background:#fff;border:2px solid #5a50ff;border-radius:4px;cursor:ew-resize;pointer-events:auto;display:none;touch-action:none;";
box.appendChild(knob);
var corner=document.createElement("div");
corner.title="Tirer pour agrandir le texte";
corner.style.cssText="position:absolute;right:-9px;bottom:-9px;width:12px;height:12px;background:#5a50ff;border:2px solid #fff;border-radius:3px;cursor:nwse-resize;pointer-events:auto;display:none;touch-action:none;box-shadow:0 0 0 1px #5a50ff;";
box.appendChild(corner);
var tip=document.createElement("div");
tip.style.cssText="position:absolute;right:-7px;bottom:-28px;background:#1f1f1f;color:#fff;font:11px/19px Arial,sans-serif;padding:0 7px;border-radius:4px;display:none;white-space:nowrap;";
box.appendChild(tip);
document.body.appendChild(box);
function selEls(){var out=[];if(!sel)return out;(sel.items||[]).forEach(function(it){document.querySelectorAll('[data-sig-block="'+it+'"]').forEach(function(el){out.push(el);});});return out;}
function union(els){var r=null;els.forEach(function(el){var c=crect(el);if(!c.w&&!c.h)return;if(!r)r={l:c.x,t:c.y,r:c.x+c.w,b:c.y+c.h};else{r.l=Math.min(r.l,c.x);r.t=Math.min(r.t,c.y);r.r=Math.max(r.r,c.x+c.w);r.b=Math.max(r.b,c.y+c.h);}});return r;}
function selRect(){var els=selEls(),r=union(els),w=sel&&sel.resize&&sel.resize.width;
if(!r||!w||!els[0])return r;var t=els[0].closest('table[width="'+w+'"]');if(!t)return r;var c=crect(t);r.l=Math.min(r.l,c.x);r.r=Math.max(r.r,c.x+c.w);return r;}
function place(r){box.style.left=(r.l+scrollX-5)+"px";box.style.top=(r.t+scrollY-5)+"px";box.style.width=(r.r-r.l+10)+"px";box.style.height=(r.b-r.t+10)+"px";}
function drawSel(){if(rs||fs)return;var r=selRect();if(!r){box.style.display="none";return;}
box.style.display="block";place(r);
var ro=window.SIG_READONLY;knob.style.display=sel.resize&&!ro?"block":"none";corner.style.display=sel.font&&!ro?"block":"none";
knob.title=sel.resize&&sel.resize.kind==="wrap"?"Tirer pour changer la largeur":"Tirer pour changer la taille";}
function live(v){var k=sel&&sel.resize&&sel.resize.kind;selEls().forEach(function(el){
if(k==="square"||k==="image"){var im=el.querySelector("img");if(!im)return;var ratio=k==="square"?1:(im.naturalWidth?im.naturalHeight/im.naturalWidth:(im.height/Math.max(1,im.width)));im.style.width=v+"px";im.style.height=Math.round(v*ratio)+"px";}
else if(k==="bar"){var td=el.querySelector("td[bgcolor]");if(td){td.style.width=v+"px";td.setAttribute("width",v);}}
else if(k==="icons"){el.querySelectorAll("img").forEach(function(im){im.style.width=v+"px";im.style.height=v+"px";});}
});}
/* Dernier rendu reçu : rétabli si un réglage à la souris n'est suivi
   d'aucun rendu (valeur inchangée, rendu ignoré), pour ne jamais garder les
   tailles provisoires de l'aperçu en direct */
var sigRoot=document.querySelector(".sig"),lastHtml=sigRoot?sigRoot.innerHTML:"",pending=null;
var selRO=new ResizeObserver(function(){drawSel();});
function watchSel(){selRO.disconnect();selEls().forEach(function(el){selRO.observe(el);});}
function restore(){if(editing)return;if(sigRoot)sigRoot.innerHTML=lastHtml;hideGrip();watchSel();drawSel();h();}
function awaitRender(){clearTimeout(pending);pending=setTimeout(function(){pending=null;restore();},3000);}
/* Bord : largeur du bloc, ou taille des icônes (proportionnelle) */
knob.addEventListener("pointerdown",function(e){if(!sel||!sel.resize)return;e.preventDefault();e.stopPropagation();if(editing)editing.blur();
var r=selRect();if(!r)return;var w=Math.round(r.r-r.l),icons=sel.resize.kind==="icons",start=icons?sel.resize.size:w;
rs={x:e.clientX,w:w,start:start,cur:start,icons:icons};knob.setPointerCapture(e.pointerId);hideGrip();tip.style.display="block";tip.textContent=start+" px";});
knob.addEventListener("pointermove",function(e){if(!rs)return;var w=rs.w+(e.clientX-rs.x),v=rs.icons?Math.round(rs.start*w/rs.w):Math.round(w);
v=Math.max(sel.resize.min,Math.min(sel.resize.max,v));rs.cur=v;tip.textContent=v+" px";live(v);
if(sel.resize.kind==="wrap"){box.style.width=(v+10)+"px";}else{var nr=selRect();if(nr)place(nr);}});
function endResize(){if(!rs)return;var v=rs.cur,changed=v!==rs.start;rs=null;tip.style.display="none";if(changed){post({type:"sig-resize",width:v});awaitRender();}else restore();}
knob.addEventListener("pointerup",endResize);knob.addEventListener("pointercancel",endResize);knob.addEventListener("lostpointercapture",endResize);
knob.addEventListener("click",function(e){e.stopPropagation();});
/* Coin : taille des caractères (et des icônes des coordonnées), en direct */
corner.addEventListener("pointerdown",function(e){if(!sel||!sel.font)return;e.preventDefault();e.stopPropagation();if(editing)editing.blur();
var r=selRect();if(!r)return;var texts=[],imgs=[];selEls().forEach(function(el){[el].concat([].slice.call(el.querySelectorAll("*"))).forEach(function(n){if(n.style&&n.style.fontSize)texts.push({n:n,fs:parseFloat(n.style.fontSize),lh:parseFloat(n.style.lineHeight)||0});});
el.querySelectorAll("img").forEach(function(im){imgs.push({n:im,w:im.width,h:im.height});});});
fs={x:e.clientX,y:e.clientY,w:r.r-r.l,h:r.b-r.t,start:sel.font.size,cur:sel.font.size,texts:texts,imgs:imgs};corner.setPointerCapture(e.pointerId);hideGrip();tip.style.display="block";tip.textContent=fs.start+" px";});
corner.addEventListener("pointermove",function(e){if(!fs)return;var f=1+((e.clientX-fs.x)+(e.clientY-fs.y))/(fs.w+fs.h);
var v=Math.max(sel.font.min,Math.min(sel.font.max,Math.round(fs.start*f))),k=v/fs.start;fs.cur=v;tip.textContent=v+" px";
fs.texts.forEach(function(t){t.n.style.fontSize=(t.fs*k)+"px";if(t.lh)t.n.style.lineHeight=(t.lh*k)+"px";});
fs.imgs.forEach(function(i){i.n.style.width=(i.w*k)+"px";i.n.style.height=(i.h*k)+"px";});var nr=selRect();if(nr)place(nr);});
function endFont(){if(!fs)return;var v=fs.cur,changed=v!==fs.start;fs=null;tip.style.display="none";if(changed){post({type:"sig-font",size:v});awaitRender();}else restore();}
corner.addEventListener("pointerup",endFont);corner.addEventListener("pointercancel",endFont);corner.addEventListener("lostpointercapture",endFont);
corner.addEventListener("click",function(e){e.stopPropagation();});
new ResizeObserver(drawSel).observe(document.body);document.addEventListener("load",drawSel,true);window.addEventListener("resize",drawSel);
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!editing&&sel)post({type:"sig-escape"});});
window.addEventListener("message",function(e){if(e.source!==parent)return;var d=e.data||{};
if(d.type==="sig-html"){if(editing)return;clearTimeout(pending);pending=null;lastHtml=d.html||"";if(sigRoot)sigRoot.innerHTML=lastHtml;hideGrip();watchSel();drawSel();h();}
if(d.type==="sig-select"){sel=d.selection||null;watchSel();drawSel();}
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
  onHistory,
  onOverflow,
  onResize,
  onFont,
  onEscape,
  selection = null,
  readOnly = false,
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
      if (data && data.type === "sig-history") {
        onHistory?.(Boolean(data.redo));
      }
      if (data && data.type === "sig-resize" && Number.isFinite(data.width)) {
        onResize?.(Math.round(data.width));
      }
      if (data && data.type === "sig-font" && Number.isFinite(data.size)) {
        onFont?.(Math.round(data.size));
      }
      if (data && data.type === "sig-escape") {
        onEscape?.();
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
            items: (data.items || []).map((i) => ({ ...i, rect: toPage(i.rect) })),
            slots: Object.fromEntries(
              Object.entries(data.slots || {}).map(([k, r]) => [k, toPage(r)]),
            ),
            body: toPage(data.body),
            frame: toPage(data.frame),
            x: data.x + box.left,
            y: data.y + box.top,
          });
        }
      }
      if (data && data.type === "sig-height" && Number.isFinite(data.height)) {
        setContentHeight(Math.ceil(data.height));
        onOverflow?.(Boolean(data.overflow));
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
    onHistory,
    onOverflow,
    onResize,
    onFont,
    onEscape,
  ]);

  // Pendant une modification en place, le HTML affiché ne change pas
  const shownHtml = useRef(html);
  if (!frozen) shownHtml.current = html;
  const displayed = shownHtml.current;

  // Éditeur : le document de l'iframe n'est recréé que si son habillage
  // change (mode sombre…). Un nouveau rendu remplace le contenu sur place
  // (message « sig-html ») : pas de rechargement, pas de clignotement.
  const loaded = useRef(false);
  const docHtml = useRef(null);
  const send = (message) =>
    frameRef.current?.contentWindow?.postMessage(message, "*");
  const srcDoc = useMemo(() => {
    const content = shownHtml.current;
    docHtml.current = content;
    loaded.current = false;
    return buildDoc(content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dark, padding, interactive, readOnly, interactive ? null : displayed]);

  useEffect(() => {
    if (!interactive || !loaded.current) return;
    if (displayed === docHtml.current) return;
    docHtml.current = displayed;
    send({ type: "sig-html", html: displayed || "" });
  }, [displayed, interactive]);

  useEffect(() => {
    if (interactive && loaded.current) {
      send({ type: "sig-select", selection });
    }
  }, [selection, interactive]);

  function buildDoc(content) {
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
    const editorScript = interactive
      ? `<script>window.SIG_READONLY=${readOnly ? "true" : "false"};${EDITOR_SCRIPT}</script>`
      : "";
    return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><meta name="color-scheme" content="${
      dark ? "dark" : "light"
    }"><style>html,body{margin:0;padding:0;background:${bg};} body{padding:${padding}px;} ${invert} ${editorCss}</style></head><body><div class="sig">${
      content || ""
    }</div>${editorScript}</body></html>`;
  }

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
      // Un rechargement (mode sombre) met fin à toute modification en
      // place : l'aperçu ne doit pas rester figé. Puis on rattrape un rendu
      // arrivé pendant le chargement, et la sélection.
      onLoad={
        interactive
          ? () => {
              loaded.current = true;
              onEditingChange?.(false);
              if (shownHtml.current !== docHtml.current) {
                docHtml.current = shownHtml.current;
                send({ type: "sig-html", html: shownHtml.current || "" });
              }
              send({ type: "sig-select", selection });
            }
          : undefined
      }
    />
  );
}
