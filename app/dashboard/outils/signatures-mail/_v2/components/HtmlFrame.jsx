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
 * `onFieldClick(field, { edit, item, up })` : en mode éditeur, un clic sur
 * un élément marqué (data-sig-field, fourni par previewHtml) remonte le
 * champ et la partie cliquée (data-sig-block) au parent au lieu de suivre
 * le lien ; ⌘ + clic (Ctrl + clic) le signale par `up`, pour sélectionner
 * le niveau au-dessus. Un petit script est alors autorisé dans le bac à
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
 *   élément tiré par sa poignée (⠿, affichée seulement sur l'élément
 *   sélectionné : déplacer ne se confond jamais avec modifier un texte, et
 *   le survol n'encombre pas l'aperçu) ; les rectangles sont en
 *   coordonnées de la page. Le
 *   navigateur continue d'envoyer la souris à l'iframe où le bouton a été
 *   pressé : le script relaie donc aussi `onDragMove` / `onDragEnd`.
 * - `onHistory(redo)` : ⌘Z / ⇧⌘Z pressés dans l'aperçu (hors saisie).
 * - `onDelete()` : Suppr (⌫) pressée sur une sélection, hors saisie.
 * - `readOnly` : ni modification en place ni poignée (abonnement expiré) ;
 *   un clic ouvre seulement le panneau de l'élément.
 * - `onMeasure({ frame, columns })` : après chaque rendu, les largeurs que
 *   le contenu impose au cadre et aux colonnes ({ floor, natural } en px),
 *   pour que les réglages de largeur ne proposent que le possible.
 */

/** Script injecté dans l'aperçu éditeur (sans accès au parent). */
const EDITOR_SCRIPT = `(function(){
var post=function(m){parent.postMessage(m,"*");};
var editing=null,dragging=false,dragId=null,gripEl=null;
/* Hauteur du contenu (jamais celle de l'affichage précédent : l'aperçu
   rétrécit aussi), infobulle du cadre comprise, et celle placée sous le
   coin quand il passe sous le bord */
function h(){var d=document.documentElement,y=document.body.getBoundingClientRect().height;
if(box&&box.style.display==="block"){y=Math.max(y,box.getBoundingClientRect().bottom+scrollY+30);
if(corner.style.display==="block")y=Math.max(y,corner.getBoundingClientRect().bottom+scrollY+32);}
post({type:"sig-height",height:Math.ceil(y),overflow:d.scrollWidth>d.clientWidth+1});}
new ResizeObserver(h).observe(document.body);window.addEventListener("load",h);h();
function rect(el){var r=el.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};}
function crect(el){var g=document.createRange();g.selectNodeContents(el);var r=g.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};}
function q(s,content){var el=document.querySelector(s);return el?(content?crect(el):rect(el)):null;}
var grip=document.createElement("div");grip.className="sig-grip";
grip.textContent="\u283F";grip.title="Déplacer";
grip.style.cssText="position:absolute;display:none;width:16px;height:22px;border-radius:4px;background:#5a50ff;color:#fff;font:13px/22px Arial,sans-serif;text-align:center;cursor:grab;z-index:10;user-select:none;box-shadow:0 1px 3px rgba(0,0,0,.3);touch-action:none;-webkit-touch-callout:none;";
document.body.appendChild(grip);
/* Poignée : seulement sur l'élément sélectionné (rien au survol), à côté
   du morceau cliqué ; elle reste pendant la modification d'un texte */
function showGrip(){if(window.SIG_READONLY||dragging||rs||fs||!sel||sel.whole||sel.slot||sel.nograb){hideGrip();return;}
var els=groupEls(),b=null;els.forEach(function(el){if(!b&&el.getAttribute("data-sig-block")===clickItem)b=el;});b=b||els[0];
if(!b){hideGrip();return;}gripEl=b;var r=vrect(b);
if(getComputedStyle(b).display==="inline"){grip.style.left=(r.x+scrollX)+"px";grip.style.top=Math.max(0,r.y+scrollY-30)+"px";}
else{grip.style.left=Math.max(0,r.x+scrollX-26)+"px";grip.style.top=(r.y+scrollY)+"px";}
grip.style.display="block";}
function hideGrip(){grip.style.display="none";gripEl=null;}
grip.addEventListener("pointerdown",function(e){
if(!gripEl)return;e.preventDefault();e.stopPropagation();
var hover=gripEl;if(editing)editing.blur();
var items=[];
document.querySelectorAll("[data-sig-block]").forEach(function(el){var s=el.closest("[data-sig-slot]");items.push({item:el.getAttribute("data-sig-block"),slot:s?s.getAttribute("data-sig-slot"):null,rect:vrect(el)});});
var slots={};
document.querySelectorAll("[data-sig-slot]").forEach(function(el){var k=el.getAttribute("data-sig-slot");var r=crect(el);var a=slots[k];if(!a){slots[k]=r;return;}var x=Math.min(a.x,r.x),y=Math.min(a.y,r.y);slots[k]={x:x,y:y,w:Math.max(a.x+a.w,r.x+r.w)-x,h:Math.max(a.y+a.h,r.y+r.h)-y};});
var sig=document.querySelector(".sig > table")||document.querySelector(".sig");
var field=hover.getAttribute("data-sig-block"),fields=[field];
if(sel&&sel.level==="element"){fields=[];groupEls().forEach(function(el){var k=el.getAttribute("data-sig-block");if(fields.indexOf(k)<0)fields.push(k);});if(fields.indexOf(field)<0)fields=[field];}
dragging=true;dragId=e.pointerId;hideGrip();
post({type:"sig-drag",field:fields[0],fields:fields,whole:!!(sel&&sel.level==="element"),sig:rect(sig),items:items,slots:slots,body:q("[data-sig-body]",true),frame:q("[data-sig-frame] > table")||q("[data-sig-frame]",true),x:e.clientX,y:e.clientY});
});
/* Seul le pointeur qui a saisi la poignée mène le glisser (un second doigt
   ne compte pas) ; un geste repris par le navigateur (pointercancel)
   l'annule au lieu de laisser le calque de dépôt en place */
document.addEventListener("pointermove",function(e){if(dragging&&e.pointerId===dragId)post({type:"sig-drag-move",x:e.clientX,y:e.clientY});},true);
document.addEventListener("pointerup",function(e){if(dragging&&e.pointerId===dragId){dragging=false;post({type:"sig-drag-end",x:e.clientX,y:e.clientY});drawSel();}},true);
document.addEventListener("pointercancel",function(e){if(dragging&&e.pointerId===dragId){dragging=false;post({type:"sig-drag-cancel"});drawSel();}},true);
document.addEventListener("dragstart",function(e){e.preventDefault();},true);
function startEdit(el,x,y){
if(window.SIG_READONLY)return;
editing=el;el.setAttribute("contenteditable","plaintext-only");el.focus();
var r=document.caretRangeFromPoint&&document.caretRangeFromPoint(x,y);
if(r&&el.contains(r.startContainer)){var s=getSelection();s.removeAllRanges();s.addRange(r);}
post({type:"sig-editing",editing:true});
}
function goUp(e){e.preventDefault();e.stopPropagation();var cb=blockAt(e.target,e.clientX,e.clientY);clickItem=cb?cb.getAttribute("data-sig-block"):null;
if(editing)editing.blur();post({type:"sig-field",field:null,item:clickItem,up:true});drawSel();}
/* Sur un Mac, Ctrl + clic ouvre le menu contextuel au lieu de cliquer */
document.addEventListener("contextmenu",function(e){if(e.ctrlKey&&/Mac|iPhone|iPad/.test(navigator.platform||""))goUp(e);},true);
document.addEventListener("click",function(e){
if(e.target===grip||box.contains(e.target))return;
hideHover();if(e.metaKey||e.ctrlKey){goUp(e);return;}
var cb=blockAt(e.target,e.clientX,e.clientY);clickItem=cb?cb.getAttribute("data-sig-block"):null;
if(e.target.closest("a"))e.preventDefault();
/* Un trait visé (même à quelques pixels) : il est sélectionné, sans saisie */
if(cb&&lineAt(e.clientX,e.clientY)===cb){e.stopPropagation();post({type:"sig-field",field:null,item:clickItem,edit:false});drawSel();return;}
if(editing&&editing.contains(e.target))return;
e.stopPropagation();
var ed=e.target.closest("[data-sig-edit]");
var m=e.target.closest("[data-sig-field]");
var bk=m?null:e.target.closest("[data-sig-block]");
if(m||bk)post({type:"sig-field",field:m?m.getAttribute("data-sig-field"):bk.getAttribute("data-sig-block"),item:clickItem,edit:!!ed&&!window.SIG_READONLY});
if(ed)startEdit(ed,e.clientX,e.clientY);
drawSel();
},true);
document.addEventListener("input",function(){
if(editing){post({type:"sig-input",field:editing.getAttribute("data-sig-edit"),value:editing.textContent});drawSel();}
});
document.addEventListener("keydown",function(e){
if(dragging&&e.key==="Escape"){e.preventDefault();dragging=false;post({type:"sig-drag-cancel"});drawSel();return;}
if(editing&&(e.key==="Enter"||e.key==="Escape")){e.preventDefault();editing.blur();return;}
var k=(e.key||"").toLowerCase();
if(!editing&&(e.metaKey||e.ctrlKey)&&(k==="z"||k==="y")){e.preventDefault();post({type:"sig-history",redo:k==="y"||e.shiftKey});}
/* Suppr (⌫ sur Mac) sur une sélection : la retirer (jamais pendant une saisie ou un geste) */
if(!editing&&!rs&&!fs&&!dragging&&sel&&!window.SIG_READONLY&&(e.key==="Delete"||e.key==="Backspace")){e.preventDefault();post({type:"sig-delete"});}
});
document.addEventListener("focusout",function(e){
if(editing&&e.target===editing){editing.removeAttribute("contenteditable");editing=null;post({type:"sig-editing",editing:false});
if(deferred!==null&&!rs&&!fs){var d=deferred;deferred=null;applyHtml(d);}}
});
var sel=null,rs=null,fs=null;
var box=document.createElement("div");
box.style.cssText="position:absolute;display:none;pointer-events:none;border:2px solid #5a50ff;border-radius:5px;z-index:9;";
var knob=document.createElement("div");knob.className="sig-knob";
knob.style.cssText="position:absolute;right:-9px;top:50%;width:10px;height:20px;margin-top:-10px;background:#fff;border:2px solid #5a50ff;border-radius:4px;cursor:ew-resize;pointer-events:auto;display:none;touch-action:none;";
box.appendChild(knob);
var corner=document.createElement("div");corner.className="sig-corner";
corner.title="Tirer pour agrandir le texte";
corner.style.cssText="position:absolute;right:-9px;bottom:-9px;width:12px;height:12px;background:#5a50ff;border:2px solid #fff;border-radius:3px;cursor:nwse-resize;pointer-events:auto;display:none;touch-action:none;box-shadow:0 0 0 1px #5a50ff;";
box.appendChild(corner);
var tip=document.createElement("div");
tip.style.cssText="position:absolute;right:-7px;bottom:-28px;background:#1f1f1f;color:#fff;font:11px/19px Arial,sans-serif;padding:0 7px;border-radius:4px;display:none;white-space:nowrap;";
box.appendChild(tip);
document.body.appendChild(box);
/* Bord (largeur) et coin (taille du texte) : sur un cadre trop bas pour
   les séparer (texte d'une ligne), le coin passe sous le bord, sur la même
   verticale, au lieu d'en recouvrir la moitié ; au doigt, plus d'écart
   (zones de prise agrandies). Décidé hors geste : rien ne saute sous le
   pointeur pendant un réglage. */
var coarse=Boolean(window.matchMedia&&matchMedia("(pointer:coarse)").matches),low=false,cgap=coarse?32:16;
function placeHandles(){var H=box.clientHeight;
if(!rs&&!fs)low=knob.style.display==="block"&&corner.style.display==="block"&&H<(coarse?78:46);
if(low){corner.style.top=(H/2+cgap)+"px";corner.style.bottom="auto";}else{corner.style.top="auto";corner.style.bottom="-9px";}}
/* Bulle : la valeur pendant un geste et « Taille du texte » au survol du
   coin, sous le coin ; le nom du bord à son survol, au-dessus de lui */
function tipAt(over){var H=box.clientHeight;
if(over==="knob"){tip.style.top=Math.max(H/2-33,-(box.getBoundingClientRect().top+2))+"px";tip.style.bottom="auto";}
else if(low){tip.style.top=(H/2+cgap+20)+"px";tip.style.bottom="auto";}
else{tip.style.top="auto";tip.style.bottom="-28px";}}
function hoverTip(el,over,text){
el.addEventListener("pointerenter",function(){if(rs||fs||dragging)return;tipAt(over);tip.textContent=text();tip.style.display="block";});
el.addEventListener("pointerleave",function(){if(!rs&&!fs)tip.style.display="none";});}
hoverTip(knob,"knob",function(){var k=sel&&sel.resize&&sel.resize.kind;return k==="wrap"||k==="button"||k==="column"||k==="frame"?"Largeur":k==="bar"?"Longueur":"Taille";});
hoverTip(corner,"corner",function(){return "Taille du texte";});
function selEls(){var out=[];if(!sel)return out;
if(sel.whole)return sigRoot?[sigRoot]:out;
if(sel.slot){document.querySelectorAll('[data-sig-slot="'+sel.slot+'"]').forEach(function(el){out.push(el);});return out;}
(sel.items||[]).forEach(function(it){document.querySelectorAll('[data-sig-block="'+it+'"]').forEach(function(el){out.push(el);});});return out;}
/* Survol : cadre fin autour du contenu visible de l'élément (comme la
   sélection), jamais autour de toute sa cellule */
var hov=document.createElement("div");
hov.style.cssText="position:absolute;display:none;pointer-events:none;border:1px solid rgba(90,80,255,.55);border-radius:4px;z-index:8;";
document.body.appendChild(hov);
var hovEl=null;
function hideHover(){hov.style.display="none";hovEl=null;}
document.addEventListener("mousemove",function(e){if(dragging||rs||fs){hideHover();return;}
var b=blockAt(e.target,e.clientX,e.clientY);
if(!b||selEls().indexOf(b)>=0){hideHover();return;}
if(b===hovEl)return;hovEl=b;
var r=vrect(b);hov.style.display="block";hov.style.left=(r.x+scrollX-3)+"px";hov.style.top=(r.y+scrollY-3)+"px";hov.style.width=(r.w+6)+"px";hov.style.height=(r.h+6)+"px";});
document.documentElement.addEventListener("mouseleave",hideHover);
/* Traits (séparateur, trait sous le nom, traits libres) : quelques pixels
   autour d'eux suffisent pour les viser */
function lineAt(x,y){var best=null,bd=7;document.querySelectorAll('[data-sig-block="divider"],[data-sig-block="accent"],[data-sig-block^="rule"]').forEach(function(el){
var r=vrect(el);var dx=Math.max(r.x-x,0,x-(r.x+r.w)),dy=Math.max(r.y-y,0,y-(r.y+r.h)),d=Math.max(dx,dy);if(d<bd){bd=d;best=el;}});return best;}
/* Élément sous le pointeur : un trait proche d'abord, sinon le bloc le
   plus proche (la cellule d'un séparateur en bordure ne compte que près
   de son bord) */
function blockAt(target,x,y){var l=lineAt(x,y);if(l)return l;var b=target&&target.closest?target.closest("[data-sig-block]"):null;
if(b&&b.hasAttribute("data-sig-edge")){var p=b.parentElement;b=p&&p.closest?p.closest("[data-sig-block]"):null;}return b;}
/* Contenu visible d'un élément : texte (sans l'interligne), images,
   cases colorées ou bordées ; jamais les marges des cellules ni les
   espaces entre lignes. Le cadre de sélection l'épouse. */
function vrect(el){var edge=el.getAttribute&&el.getAttribute("data-sig-edge");
if(edge){var er=el.getBoundingClientRect(),ecs=getComputedStyle(el),bw=parseFloat(edge==="right"?ecs.borderRightWidth:ecs.borderLeftWidth)||1;return{x:edge==="right"?er.right-bw:er.left,y:er.top,w:bw,h:er.height};}
var r=null,g=document.createRange();
var add=function(b){if(!b.width&&!b.height)return;if(!r)r={l:b.left,t:b.top,r:b.right,b:b.bottom};else{r.l=Math.min(r.l,b.left);r.t=Math.min(r.t,b.top);r.r=Math.max(r.r,b.right);r.b=Math.max(r.b,b.bottom);}};
var w=document.createTreeWalker(el,5),n=el;
do{if(n.nodeType===3){if(n.nodeValue.trim()){g.selectNodeContents(n);add(g.getBoundingClientRect());}}
else if(n.nodeType===1){if(n.tagName==="IMG"){add(n.getBoundingClientRect());continue;}
var cs=getComputedStyle(n),bg=cs.backgroundColor;
if(n.hasAttribute("bgcolor")||(bg&&bg!=="transparent"&&bg!=="rgba(0, 0, 0, 0)")||parseFloat(cs.borderTopWidth)>0||parseFloat(cs.borderLeftWidth)>0)add(n.getBoundingClientRect());}
}while((n=w.nextNode()));
return r?{x:r.l,y:r.t,w:r.r-r.l,h:r.b-r.t}:crect(el);}
function union(els){var r=null;els.forEach(function(el){var c=vrect(el);if(!c.w&&!c.h)return;if(!r)r={l:c.x,t:c.y,r:c.x+c.w,b:c.y+c.h};else{r.l=Math.min(r.l,c.x);r.t=Math.min(r.t,c.y);r.r=Math.max(r.r,c.x+c.w);r.b=Math.max(r.b,c.y+c.h);}});return r;}
/* Bloc réparti en plusieurs morceaux (coordonnées séparées par d'autres
   éléments ou sur deux colonnes) : le cadre et la poignée portent sur son
   morceau principal (celui que ses réglages concernent, sel.main), sinon
   sur le morceau cliqué, jamais sur tout ce qui les sépare ; les autres
   morceaux sont entourés de pointillés */
var clickItem=null;
function allGroups(){var els=selEls();if(els.length<2||sel.whole||sel.slot)return [els];var set=new Set(els),groups=[],cur=null,slot=null;
document.querySelectorAll("[data-sig-block]").forEach(function(el){
if(!set.has(el)){cur=null;return;}var s=el.closest("[data-sig-slot]");
if(!cur||s!==slot){cur=[];groups.push(cur);slot=s;}cur.push(el);});
return groups.length?groups:[els];}
function groupEls(){var gs=allGroups();if(gs.length<2)return gs[0]||[];
var pick=sel.main&&sel.main.length?sel.main[0]:clickItem;
for(var i=0;i<gs.length;i++){if(pick&&gs[i].some(function(el){return el.getAttribute("data-sig-block")===pick;}))return gs[i];}
var best=null;gs.forEach(function(g){if(!best||g.length>best.length)best=g;});return best;}
var ghosts=[];
function drawGhosts(){var gs=sel&&sel.level==="element"?allGroups():[],main=gs.length>1?groupEls():null,n=0;
gs.forEach(function(g){if(!main||g[0]===main[0])return;var r=union(g);if(!r)return;var d=ghosts[n];
if(!d){d=document.createElement("div");d.style.cssText="position:absolute;pointer-events:none;border:1px dashed #5a50ff;border-radius:5px;z-index:8;";document.body.appendChild(d);ghosts[n]=d;}
n++;d.style.display="block";d.style.left=(r.l+scrollX-3)+"px";d.style.top=(r.t+scrollY-3)+"px";d.style.width=(r.r-r.l+6)+"px";d.style.height=(r.b-r.t+6)+"px";});
for(;n<ghosts.length;n++)ghosts[n].style.display="none";}
var liveTables=[];
/* Ce que la sélection désigne (niveau et éléments), pour savoir si elle change de cible */
function selKey(x){return x?x.level+"|"+(x.slot||"")+"|"+(x.whole?1:0)+"|"+(x.items||[]).join():"";}
/* Ligne de coordonnées seule : sa largeur porte sur son texte */
function lineTarget(el){var it=el.getAttribute("data-sig-block");return (sel&&sel.resize&&sel.resize.line&&el.querySelector('[data-sig-field="'+it+'"]'))||el;}
/* Boîte de largeur d'un texte posée par le rendu (wrapAt, repère
   data-sig-wrap : largeur choisie ou plafond automatique d'une accroche,
   d'une mention) : boîte ajustée (div) ou tableau de cette largeur */
function wrapDivOf(el){var d=lineTarget(el).closest("[data-sig-wrap]");return d&&sigRoot.contains(d)?d:null;}
/* Largeur de retour à la ligne d'une boîte de texte : v px, ou aucune */
function setWrap(d,v){if(d.tagName==="TABLE"){if(v){d.setAttribute("width",v);d.style.width=v+"px";d.style.maxWidth="100%";}else{d.removeAttribute("width");d.style.width="auto";d.style.maxWidth="none";}}
else d.style.maxWidth=v?v+"px":"none";}
function hasWrap(d){return d.tagName==="TABLE"?d.hasAttribute("width"):Boolean(d.style.maxWidth&&d.style.maxWidth!=="none");}
function sizedTables(els){var out=[];if(!sel||!sel.resize||!sel.resize.width)return out;
if(sel.slot)els.forEach(function(reg){var t0=reg.firstElementChild;if(t0&&t0.tagName==="TABLE"&&t0.getAttribute("width"))out.push(t0);});
if(sel.whole||sel.resize.kind==="frame"){var fr=document.querySelector("[data-sig-frame]")||document.querySelector("[data-sig-sized]"),f0=fr&&fr.firstElementChild;if(f0&&f0.tagName==="TABLE"&&f0.getAttribute("width"))out.push(f0);}
return out;}
function selRect(){var els=groupEls(),r=union(els);
if(!r||!els[0])return r;var ts=liveTables.filter(function(t){return t.isConnected;});if(!ts.length)ts=sizedTables(els);
ts.forEach(function(t){var c=crect(t);r.l=Math.min(r.l,c.x);r.r=Math.max(r.r,c.x+c.w);});return r;}
function place(r){box.style.left=(r.l+scrollX-3)+"px";box.style.top=(r.t+scrollY-3)+"px";box.style.width=(r.r-r.l+6)+"px";box.style.height=(r.b-r.t+6)+"px";placeHandles();}
function drawSel(){if(rs||fs)return;var r=selRect();drawGhosts();if(!r){box.style.display="none";hideGrip();return;}
box.style.display="block";place(r);showGrip();
var ro=window.SIG_READONLY;knob.style.display=sel.resize&&!ro?"block":"none";corner.style.display=sel.font&&!ro?"block":"none";placeHandles();
var k=sel.resize&&sel.resize.kind;knob.title=k==="wrap"||k==="button"||k==="column"||k==="frame"?"Tirer pour changer la largeur":"Tirer pour changer la taille";h();}
function live(v,k){selEls().forEach(function(el){
if(k==="square"||k==="image"){var im=el.querySelector("img");if(!im)return;var ratio=k==="square"?1:(im.naturalWidth?im.naturalHeight/im.naturalWidth:(im.height/Math.max(1,im.width)));im.style.width=v+"px";im.style.height=Math.round(v*ratio)+"px";}
else if(k==="bar"||k==="button"){var td=el.querySelector("td[bgcolor]");if(td){td.style.width=v+"px";td.setAttribute("width",v);}}
else if(k==="icons"){el.querySelectorAll("img").forEach(function(im){im.style.width=v+"px";im.style.height=v+"px";});}
});}
/* Dernier rendu reçu : rétabli si un réglage à la souris n'est suivi
   d'aucun rendu (valeur inchangée, rendu ignoré), pour ne jamais garder les
   tailles provisoires de l'aperçu en direct */
var sigRoot=document.querySelector(".sig"),lastHtml=sigRoot?sigRoot.innerHTML:"",pending=null,deferred=null;
/* Largeurs que le contenu impose au cadre (ou à la signature sans cadre)
   et à chaque colonne : plancher (conteneur bridé à 1 px : il ne descend
   pas plus bas, quelle que soit la largeur choisie) et largeur naturelle
   (conteneur à la taille de son contenu), mesurées sans rien afficher.
   Envoyées au parent quand elles changent : les réglages de largeur ne
   proposent que ce qui est possible. */
function sizedEl(){return document.querySelector("[data-sig-frame]")||document.querySelector("[data-sig-sized]");}
function widths(el){var s=el.style.width;el.style.width="1px";var floor=Math.ceil(el.scrollWidth);el.style.width="max-content";var natural=Math.ceil(el.getBoundingClientRect().width);el.style.width=s;return{floor:floor,natural:Math.max(floor,natural)};}
var lastMeasure="";
function measure(){if(!sigRoot)return;var fr=sizedEl(),m={frame:fr?widths(fr):null,columns:{}};
["visual","text","side"].forEach(function(k){var c=document.querySelector('[data-sig-slot="'+k+'"]');if(c)m.columns[k]=widths(c);});
var key=JSON.stringify(m);if(key===lastMeasure)return;lastMeasure=key;post({type:"sig-measure",frame:m.frame,columns:m.columns});}
function applyHtml(html){clearTimeout(pending);pending=null;lastHtml=html;if(sigRoot)sigRoot.innerHTML=lastHtml;liveTables=[];hideGrip();hideHover();watchSel();drawSel();h();measure();}
/* Rendu reçu pendant un réglage à la souris : il devient le dernier rendu,
   appliqué à la fin du réglage (sinon il arracherait la mesure en cours) */
function takeDeferred(){if(deferred!==null){lastHtml=deferred;deferred=null;}}
var selRO=new ResizeObserver(function(){drawSel();});
function watchSel(){selRO.disconnect();selEls().forEach(function(el){selRO.observe(el);});}
function restore(){if(editing||rs||fs)return;if(sigRoot)sigRoot.innerHTML=lastHtml;liveTables=[];hideGrip();watchSel();drawSel();h();measure();}
function awaitRender(){clearTimeout(pending);pending=setTimeout(function(){pending=null;restore();},3000);}
/* Bord : la largeur (ou la taille) suit le pointeur dans l'aperçu même,
   et la valeur retenue est celle que l'aperçu affiche vraiment : un texte
   ne descend pas sous son mot le plus long, une image pas au-delà de sa
   place, le logo suit son plafond de hauteur. Rien ne revient en arrière
   au relâcher. */
function newTable(){var t=document.createElement("table");t.setAttribute("role","presentation");t.setAttribute("cellpadding","0");t.setAttribute("cellspacing","0");t.setAttribute("border","0");t.style.borderCollapse="collapse";return t;}
/* Tableaux dont la largeur suit le bord : le cadre, la colonne, ou pour
   un bloc une enveloppe par ligne (celle de largeur fixe du rendu, sinon
   une nouvelle autour de la ligne), comme le rendu les pose */
function rowRoot(el){var a=el;if(/^(TR|TBODY|THEAD|TD|TH)$/.test(a.tagName))a=a.closest("table");
while(a&&a.parentNode&&a.parentNode!==sigRoot&&a.parentNode.tagName!=="TD"&&!a.parentNode.hasAttribute("data-sig-slot"))a=a.parentNode;return a;}
function wrapTables(){var els=groupEls();if(!els.length)return [];var w=sel.resize.width,k=sel.resize.kind;
if(k==="frame"){var fr=document.querySelector("[data-sig-frame]")||document.querySelector("[data-sig-sized]");if(!fr)return [];var f0=fr.firstElementChild;if(f0&&f0.tagName==="TABLE")return [f0];
var ft=newTable(),fd=ft.insertRow().insertCell();while(fr.firstChild)fd.appendChild(fr.firstChild);fr.appendChild(ft);return [ft];}
if(k==="column"){var reg=els[0],t0=reg.firstElementChild;if(w&&t0&&t0.tagName==="TABLE"&&t0.getAttribute("width")===String(w))return [t0];
var ct=newTable(),cd=ct.insertRow().insertCell();while(reg.firstChild)cd.appendChild(reg.firstChild);reg.appendChild(ct);return [ct];}
/* Texte : une enveloppe ajustée et bornée par ligne (celle du rendu,
   sinon une nouvelle), comme wrapAt : il revient à la ligne sans jamais
   occuper plus que son contenu */
var own=[];els.forEach(function(el){var d=wrapDivOf(el);if(d&&own.indexOf(d)<0)own.push(d);});if(own.length)return own;
var roots=[];els.forEach(function(el){var a=sel.resize.line?lineTarget(el):rowRoot(el);if(a&&a!==sigRoot&&roots.indexOf(a)<0)roots.push(a);});
return roots.map(function(a){var d=document.createElement("div");d.style.cssText="display:inline-block;vertical-align:top;";a.parentNode.insertBefore(d,a);d.appendChild(a);return d;});}
/* Logo : largeur réglée → largeur affichée (hauteur plafonnée, comme le rendu) */
function logoFit(){var el=selEls()[0],m=el&&el.querySelector("[data-sig-cap]");if(!m)return null;
var cap=+m.getAttribute("data-sig-cap"),ratio=+m.getAttribute("data-sig-ratio");if(!cap||!ratio)return null;
var f=function(W){return Math.min(W,Math.round(Math.round(cap*Math.max(1,W/120))*ratio));};
return{f:f,inv:function(D){var k=cap*ratio,W=k>=120||D<=Math.min(120,k)?D:Math.ceil(D*120/k);while(f(W)<D&&W<2000)W++;return W;}};}
function shownWidth(k){var el=selEls()[0];if(!el)return null;
var n=k==="square"||k==="image"?el.querySelector("img"):k==="bar"||k==="button"?el.querySelector("td[bgcolor]"):null;
if(!n)return null;var cs=getComputedStyle(n),px=function(v){return parseFloat(v)||0;};
return Math.round(n.getBoundingClientRect().width-px(cs.paddingLeft)-px(cs.paddingRight)-px(cs.borderLeftWidth)-px(cs.borderRightWidth));}
knob.addEventListener("pointerdown",function(e){if(!sel||!sel.resize)return;e.preventDefault();e.stopPropagation();if(editing)editing.blur();
var r=selRect();if(!r)return;var z=sel.resize,kind=z.kind,icons=kind==="icons",w=Math.ceil(r.r-r.l);
/* Cadre, colonne : largeur réglée (l'aperçu téléphone peut la brider),
   sinon celle affichée ; jamais sous le plancher du contenu, pour que le
   bord suive la souris et que la bulle dise la largeur obtenue */
var floor=0;if(kind==="frame"||kind==="column"){var sized=kind==="frame"?sizedEl():selEls()[0];if(sized)floor=widths(sized).floor;}
var tables=kind==="wrap"||kind==="column"||kind==="frame"?wrapTables():[];
if(kind==="frame"||kind==="column")w=Math.max(floor,z.width||(tables[0]?Math.ceil(tables[0].getBoundingClientRect().width):w));
if(kind==="square"||kind==="image"){var cw=shownWidth(kind);if(cw)w=cw;}
/* Texte : part de sa largeur choisie ; largeur naturelle (sur une ligne)
   au-delà de laquelle il redevient automatique, sauf plafond automatique
   du rendu (accroche, mention longues) : on garde alors cette largeur */
var natural=0,capped=false;if(kind==="wrap"){tables.forEach(function(d){var before=d.tagName==="TABLE"?[d.getAttribute("width"),d.style.width,d.style.maxWidth]:[d.style.maxWidth];if(hasWrap(d)&&!z.width)capped=true;setWrap(d,0);natural=Math.max(natural,Math.ceil(vrect(d).w));
if(d.tagName==="TABLE"){if(before[0])d.setAttribute("width",before[0]);d.style.width=before[1];d.style.maxWidth=before[2];}else d.style.maxWidth=before[0];});if(z.width)w=z.width;}
var start=icons?z.size:w,min=Math.max(z.min,floor),max=z.max,fit=kind==="image"?logoFit():null;if(fit){min=fit.f(min);max=fit.f(max);}
rs={kind:kind,width:z.width||0,min0:z.min,max0:z.max,x:e.clientX,w:w,start:start,shown:start,cur:fit?fit.inv(start):kind==="wrap"?z.width||0:start,icons:icons,moved:false,min:min,max:max,fit:fit,tables:tables,natural:natural,capped:capped,auto:false};
liveTables=tables;
knob.setPointerCapture(e.pointerId);hideGrip();hideHover();tipAt("value");tip.style.display="block";tip.textContent=start+" px";});
knob.addEventListener("pointermove",function(e){if(!rs)return;if(!rs.moved){if(Math.abs(e.clientX-rs.x)<3)return;rs.moved=true;}
var w=rs.w+(e.clientX-rs.x),v=rs.icons?Math.round(rs.start*w/rs.w):Math.round(w),k=rs.kind;v=Math.max(rs.min,Math.min(rs.max,v));var shown=v;
if(k==="wrap"&&rs.tables.length){rs.auto=v>=rs.natural;shown=0;rs.tables.forEach(function(d){setWrap(d,rs.auto?0:v);shown=Math.max(shown,Math.ceil(vrect(d).w));});}
else if(rs.tables.length){rs.tables.forEach(function(t){t.setAttribute("width",v);t.style.width=v+"px";t.style.maxWidth="100%";});}
else if(!rs.icons){live(v,k);var a=shownWidth(k);if(a)shown=k==="bar"||k==="button"?a:Math.min(v,a);}else live(v,k);
shown=Math.max(rs.min,Math.min(rs.max,shown));rs.shown=shown;
rs.cur=rs.auto?(rs.capped?rs.natural:0):rs.fit?Math.max(rs.min0,Math.min(rs.max0,rs.fit.inv(shown))):shown;
tip.textContent=rs.auto&&!rs.capped?"Automatique":shown+" px";var nr=selRect();if(nr)place(nr);});
function endResize(){if(!rs)return;var v=rs.cur,changed=rs.moved&&(rs.kind==="wrap"?v!==rs.width:rs.shown!==rs.start);rs=null;tip.style.display="none";takeDeferred();if(changed){post({type:"sig-resize",width:v});awaitRender();drawSel();}else restore();}
knob.addEventListener("pointerup",endResize);knob.addEventListener("pointercancel",endResize);knob.addEventListener("lostpointercapture",endResize);
knob.addEventListener("click",function(e){e.stopPropagation();});
/* Coin : taille des caractères (et des icônes des coordonnées), en direct */
corner.addEventListener("pointerdown",function(e){if(!sel||!sel.font)return;e.preventDefault();e.stopPropagation();if(editing)editing.blur();
var r=selRect();if(!r)return;var texts=[],imgs=[],seen=[],part=sel.level==="item";
var add=function(n){if(seen.indexOf(n)>=0)return;seen.push(n);texts.push({n:n,fs:parseFloat(n.style.fontSize),lh:parseFloat(n.style.lineHeight)||0});};
selEls().forEach(function(el){var found=false;[el].concat([].slice.call(el.querySelectorAll("*"))).forEach(function(n){if(n.style&&n.style.fontSize){add(n);found=true;}});
/* Partie seule (prénom…) : sa taille, même héritée, devient la sienne ;
   sinon (le nom) le parent qui la porte */
if(!found&&part){var ps=getComputedStyle(el);el.style.fontSize=ps.fontSize;el.style.lineHeight=ps.lineHeight;add(el);}
else if(!found){var an=el.parentElement;while(an&&an!==sigRoot&&!(an.style&&an.style.fontSize))an=an.parentElement;if(an&&an!==sigRoot)add(an);}
if(sel.font.icons)el.querySelectorAll("img").forEach(function(im){imgs.push({n:im,w:im.width,h:im.height});});});
fs={x:e.clientX,y:e.clientY,w:r.r-r.l,h:r.b-r.t,min:sel.font.min,max:sel.font.max,start:sel.font.size,cur:sel.font.size,texts:texts,imgs:imgs,moved:false};corner.setPointerCapture(e.pointerId);hideGrip();hideHover();tipAt("value");tip.style.display="block";tip.textContent=fs.start+" px";});
corner.addEventListener("pointermove",function(e){if(!fs)return;if(!fs.moved){if(Math.abs(e.clientX-fs.x)+Math.abs(e.clientY-fs.y)<4)return;fs.moved=true;}var f=1+((e.clientX-fs.x)+(e.clientY-fs.y))/(fs.w+fs.h);
var v=Math.max(fs.min,Math.min(fs.max,Math.round(fs.start*f))),k=v/fs.start;fs.cur=v;tip.textContent=v+" px";
fs.texts.forEach(function(t){t.n.style.fontSize=(t.fs*k)+"px";if(t.lh)t.n.style.lineHeight=(t.lh*k)+"px";});
fs.imgs.forEach(function(i){i.n.style.width=(i.w*k)+"px";i.n.style.height=(i.h*k)+"px";});var nr=selRect();if(nr)place(nr);});
function endFont(){if(!fs)return;var v=fs.cur,changed=fs.moved&&v!==fs.start;fs=null;tip.style.display="none";takeDeferred();if(changed){post({type:"sig-font",size:v});awaitRender();drawSel();}else restore();}
corner.addEventListener("pointerup",endFont);corner.addEventListener("pointercancel",endFont);corner.addEventListener("lostpointercapture",endFont);
corner.addEventListener("click",function(e){e.stopPropagation();});
new ResizeObserver(drawSel).observe(document.body);document.addEventListener("load",drawSel,true);window.addEventListener("resize",drawSel);
document.addEventListener("load",measure,true);window.addEventListener("load",function(){lastMeasure="";measure();});measure();
document.addEventListener("keydown",function(e){if(e.key!=="Escape"||e.defaultPrevented)return;
if(rs||fs){e.preventDefault();rs=null;fs=null;tip.style.display="none";takeDeferred();restore();return;}
if(!editing&&sel)post({type:"sig-escape"});});
window.addEventListener("message",function(e){if(e.source!==parent)return;var d=e.data||{};
if(d.type==="sig-html"){var html=d.html||"";if(editing||rs||fs){deferred=html;return;}deferred=null;applyHtml(html);}
if(d.type==="sig-select"){var was=selKey(sel);sel=d.selection||null;if(selKey(sel)!==was)liveTables=[];watchSel();drawSel();}
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
  onDragCancel,
  onHistory,
  onOverflow,
  onResize,
  onFont,
  onEscape,
  onDelete,
  onMeasure,
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
      // Clic : champ et partie cliqués (un trait n'a pas de champ, seulement
      // sa partie) ; ⌘ + clic (`up`) : niveau au-dessus
      if (
        data &&
        data.type === "sig-field" &&
        (typeof data.field === "string" ||
          typeof data.item === "string" ||
          data.up)
      ) {
        onFieldClick(data.field || null, {
          edit: Boolean(data.edit),
          item: typeof data.item === "string" ? data.item : null,
          up: Boolean(data.up),
        });
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
      if (data && data.type === "sig-delete") {
        onDelete?.();
      }
      if (data && data.type === "sig-drag-cancel") {
        onDragCancel?.();
      }
      if (data && data.type === "sig-measure") {
        const widths = (m) =>
          m && Number.isFinite(m.floor)
            ? {
                floor: Math.round(m.floor),
                natural: Math.round(
                  Number.isFinite(m.natural) ? m.natural : m.floor,
                ),
              }
            : null;
        onMeasure?.({
          frame: widths(data.frame),
          columns: Object.fromEntries(
            ["visual", "text", "side"]
              .map((k) => [k, widths(data.columns?.[k])])
              .filter(([, m]) => m),
          ),
        });
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
            fields: Array.isArray(data.fields) ? data.fields : [data.field],
            whole: Boolean(data.whole),
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
    onDragCancel,
    onHistory,
    onOverflow,
    onResize,
    onFont,
    onEscape,
    onDelete,
    onMeasure,
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
  }, [
    dark,
    padding,
    interactive,
    readOnly,
    interactive ? null : displayed,
    // Script modifié (développement) : l'aperçu se recharge avec lui
    EDITOR_SCRIPT,
  ]);

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
    // Au doigt (pointeur grossier) : poignée, bord et coin gardent leur
    // dessin, mais se saisissent 8 px autour
    const editorCss = interactive
      ? "div[data-sig-block],div[data-sig-field],div[data-sig-slot]{display:flow-root;} [data-sig-field],[data-sig-block]{cursor:pointer;} td[data-sig-edge]{cursor:auto;} a{cursor:pointer;} [data-sig-edit]{cursor:text;} [data-sig-edit]:hover{outline:1px dashed #5a50ff;outline-offset:1px;} [contenteditable]{outline:2px solid #5a50ff;outline-offset:2px;border-radius:2px;cursor:text;} img{-webkit-user-drag:none;user-select:none;} @media (pointer:coarse){.sig-grip::before,.sig-knob::before,.sig-corner::before{content:\"\";position:absolute;inset:-8px;touch-action:none;}}"
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
