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
 * - `readOnly` : ni modification en place ni poignée (abonnement expiré) ;
 *   un clic ouvre seulement le panneau de l'élément.
 */

/** Script injecté dans l'aperçu éditeur (sans accès au parent). */
const EDITOR_SCRIPT = `(function(){
var post=function(m){parent.postMessage(m,"*");};
var editing=null,dragging=false,gripEl=null;
function h(){var d=document.documentElement;post({type:"sig-height",height:d.scrollHeight,overflow:d.scrollWidth>d.clientWidth+1});}
new ResizeObserver(h).observe(document.body);window.addEventListener("load",h);h();
function rect(el){var r=el.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};}
function crect(el){var g=document.createRange();g.selectNodeContents(el);var r=g.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};}
function q(s,content){var el=document.querySelector(s);return el?(content?crect(el):rect(el)):null;}
var grip=document.createElement("div");
grip.textContent="\u283F";grip.title="Déplacer";
grip.style.cssText="position:absolute;display:none;width:16px;height:22px;border-radius:4px;background:#5a50ff;color:#fff;font:13px/22px Arial,sans-serif;text-align:center;cursor:grab;z-index:10;user-select:none;box-shadow:0 1px 3px rgba(0,0,0,.3);";
document.body.appendChild(grip);
/* Poignée : seulement sur l'élément sélectionné (rien au survol), à côté
   du morceau cliqué ; elle reste pendant la modification d'un texte */
function showGrip(){if(window.SIG_READONLY||dragging||rs||fs||!sel||sel.whole||sel.slot){hideGrip();return;}
var els=groupEls(),b=null;els.forEach(function(el){if(!b&&el.getAttribute("data-sig-block")===clickItem)b=el;});b=b||els[0];
if(!b){hideGrip();return;}gripEl=b;var r=b.getBoundingClientRect();
if(getComputedStyle(b).display==="inline"){grip.style.left=(r.left+scrollX)+"px";grip.style.top=Math.max(0,r.top+scrollY-30)+"px";}
else{grip.style.left=Math.max(0,r.left+scrollX-26)+"px";grip.style.top=(r.top+scrollY)+"px";}
grip.style.display="block";}
function hideGrip(){grip.style.display="none";gripEl=null;}
grip.addEventListener("pointerdown",function(e){
if(!gripEl)return;e.preventDefault();e.stopPropagation();
var hover=gripEl;if(editing)editing.blur();
var items=[];
document.querySelectorAll("[data-sig-block]").forEach(function(el){var s=el.closest("[data-sig-slot]");items.push({item:el.getAttribute("data-sig-block"),slot:s?s.getAttribute("data-sig-slot"):null,rect:crect(el)});});
var slots={};
document.querySelectorAll("[data-sig-slot]").forEach(function(el){var k=el.getAttribute("data-sig-slot");var r=crect(el);var a=slots[k];if(!a){slots[k]=r;return;}var x=Math.min(a.x,r.x),y=Math.min(a.y,r.y);slots[k]={x:x,y:y,w:Math.max(a.x+a.w,r.x+r.w)-x,h:Math.max(a.y+a.h,r.y+r.h)-y};});
var sig=document.querySelector(".sig > table")||document.querySelector(".sig");
var field=hover.getAttribute("data-sig-block"),fields=[field];
if(sel&&sel.level==="element"){fields=[];groupEls().forEach(function(el){var k=el.getAttribute("data-sig-block");if(fields.indexOf(k)<0)fields.push(k);});if(fields.indexOf(field)<0)fields=[field];}
dragging=true;hideGrip();
post({type:"sig-drag",field:fields[0],fields:fields,whole:!!(sel&&sel.level==="element"),sig:rect(sig),items:items,slots:slots,body:q("[data-sig-body]",true),frame:q("[data-sig-frame] > table")||q("[data-sig-frame]",true),x:e.clientX,y:e.clientY});
});
document.addEventListener("pointermove",function(e){if(dragging)post({type:"sig-drag-move",x:e.clientX,y:e.clientY});},true);
document.addEventListener("pointerup",function(e){if(dragging){dragging=false;post({type:"sig-drag-end",x:e.clientX,y:e.clientY});drawSel();}},true);
document.addEventListener("dragstart",function(e){e.preventDefault();},true);
function startEdit(el,x,y){
if(window.SIG_READONLY)return;
editing=el;el.setAttribute("contenteditable","plaintext-only");el.focus();
var r=document.caretRangeFromPoint&&document.caretRangeFromPoint(x,y);
if(r&&el.contains(r.startContainer)){var s=getSelection();s.removeAllRanges();s.addRange(r);}
post({type:"sig-editing",editing:true});
}
function goUp(e){e.preventDefault();e.stopPropagation();var cb=e.target.closest?e.target.closest("[data-sig-block]"):null;clickItem=cb?cb.getAttribute("data-sig-block"):null;
if(editing)editing.blur();post({type:"sig-field",field:null,item:clickItem,up:true});drawSel();}
/* Sur un Mac, Ctrl + clic ouvre le menu contextuel au lieu de cliquer */
document.addEventListener("contextmenu",function(e){if(e.ctrlKey&&/Mac|iPhone|iPad/.test(navigator.platform||""))goUp(e);},true);
document.addEventListener("click",function(e){
if(e.target===grip||box.contains(e.target))return;
if(e.metaKey||e.ctrlKey){goUp(e);return;}
var cb=e.target.closest?e.target.closest("[data-sig-block]"):null;clickItem=cb?cb.getAttribute("data-sig-block"):null;
if(e.target.closest("a"))e.preventDefault();
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
if(editing)post({type:"sig-input",field:editing.getAttribute("data-sig-edit"),value:editing.textContent});
});
document.addEventListener("keydown",function(e){
if(dragging&&e.key==="Escape"){e.preventDefault();dragging=false;post({type:"sig-drag-cancel"});drawSel();return;}
if(editing&&(e.key==="Enter"||e.key==="Escape")){e.preventDefault();editing.blur();return;}
var k=(e.key||"").toLowerCase();
if(!editing&&(e.metaKey||e.ctrlKey)&&(k==="z"||k==="y")){e.preventDefault();post({type:"sig-history",redo:k==="y"||e.shiftKey});}
});
document.addEventListener("focusout",function(e){
if(editing&&e.target===editing){editing.removeAttribute("contenteditable");editing=null;post({type:"sig-editing",editing:false});
if(deferred!==null&&!rs&&!fs){var d=deferred;deferred=null;applyHtml(d);}}
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
function selEls(){var out=[];if(!sel)return out;
if(sel.whole)return sigRoot?[sigRoot]:out;
if(sel.slot){document.querySelectorAll('[data-sig-slot="'+sel.slot+'"]').forEach(function(el){out.push(el);});return out;}
(sel.items||[]).forEach(function(it){document.querySelectorAll('[data-sig-block="'+it+'"]').forEach(function(el){out.push(el);});});return out;}
function union(els){var r=null;els.forEach(function(el){var c=crect(el);if(!c.w&&!c.h)return;if(!r)r={l:c.x,t:c.y,r:c.x+c.w,b:c.y+c.h};else{r.l=Math.min(r.l,c.x);r.t=Math.min(r.t,c.y);r.r=Math.max(r.r,c.x+c.w);r.b=Math.max(r.b,c.y+c.h);}});return r;}
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
n++;d.style.display="block";d.style.left=(r.l+scrollX-4)+"px";d.style.top=(r.t+scrollY-4)+"px";d.style.width=(r.r-r.l+8)+"px";d.style.height=(r.b-r.t+8)+"px";});
for(;n<ghosts.length;n++)ghosts[n].style.display="none";}
var liveTables=[];
/* Ligne de coordonnées seule : sa largeur porte sur son texte */
function lineTarget(el){var it=el.getAttribute("data-sig-block");return (sel&&sel.resize&&sel.resize.line&&el.querySelector('[data-sig-field="'+it+'"]'))||el;}
/* Tableaux à largeur fixe du morceau (un par ligne), ou null */
function fixedTables(els,w){var out=[];els.forEach(function(el){var t=lineTarget(el).closest('table[width="'+w+'"]');if(t&&out.indexOf(t)<0)out.push(t);});return out;}
function selRect(){var els=groupEls(),r=union(els),w=sel&&sel.resize&&sel.resize.width;
if(!r||!els[0])return r;var ts=liveTables.filter(function(t){return t.isConnected;});if(!ts.length&&w&&sel.items)ts=fixedTables(els,w);
ts.forEach(function(t){var c=crect(t);r.l=Math.min(r.l,c.x);r.r=Math.max(r.r,c.x+c.w);});return r;}
function place(r){box.style.left=(r.l+scrollX-5)+"px";box.style.top=(r.t+scrollY-5)+"px";box.style.width=(r.r-r.l+10)+"px";box.style.height=(r.b-r.t+10)+"px";}
function drawSel(){if(rs||fs)return;var r=selRect();drawGhosts();if(!r){box.style.display="none";hideGrip();return;}
box.style.display="block";place(r);showGrip();
var ro=window.SIG_READONLY;knob.style.display=sel.resize&&!ro?"block":"none";corner.style.display=sel.font&&!ro?"block":"none";
var k=sel.resize&&sel.resize.kind;knob.title=k==="wrap"||k==="button"||k==="column"||k==="frame"?"Tirer pour changer la largeur":"Tirer pour changer la taille";}
function live(v){var k=sel&&sel.resize&&sel.resize.kind;selEls().forEach(function(el){
if(k==="square"||k==="image"){var im=el.querySelector("img");if(!im)return;var ratio=k==="square"?1:(im.naturalWidth?im.naturalHeight/im.naturalWidth:(im.height/Math.max(1,im.width)));im.style.width=v+"px";im.style.height=Math.round(v*ratio)+"px";}
else if(k==="bar"||k==="button"){var td=el.querySelector("td[bgcolor]");if(td){td.style.width=v+"px";td.setAttribute("width",v);}}
else if(k==="icons"){el.querySelectorAll("img").forEach(function(im){im.style.width=v+"px";im.style.height=v+"px";});}
});}
/* Dernier rendu reçu : rétabli si un réglage à la souris n'est suivi
   d'aucun rendu (valeur inchangée, rendu ignoré), pour ne jamais garder les
   tailles provisoires de l'aperçu en direct */
var sigRoot=document.querySelector(".sig"),lastHtml=sigRoot?sigRoot.innerHTML:"",pending=null,deferred=null;
function applyHtml(html){clearTimeout(pending);pending=null;lastHtml=html;if(sigRoot)sigRoot.innerHTML=lastHtml;liveTables=[];hideGrip();watchSel();drawSel();h();}
/* Rendu reçu pendant un réglage à la souris : il devient le dernier rendu,
   appliqué à la fin du réglage (sinon il arracherait la mesure en cours) */
function takeDeferred(){if(deferred!==null){lastHtml=deferred;deferred=null;}}
var selRO=new ResizeObserver(function(){drawSel();});
function watchSel(){selRO.disconnect();selEls().forEach(function(el){selRO.observe(el);});}
function restore(){if(editing||rs||fs)return;if(sigRoot)sigRoot.innerHTML=lastHtml;liveTables=[];hideGrip();watchSel();drawSel();h();}
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
if(w){var fx=fixedTables(els,w);if(fx.length)return fx;}
if(sel.resize.line)return els.map(function(el){var tg=lineTarget(el),t=newTable(),td=t.insertRow().insertCell();tg.parentNode.insertBefore(t,tg);td.appendChild(tg);return t;});
var roots=[];els.forEach(function(el){var a=rowRoot(el);if(a&&a!==sigRoot&&roots.indexOf(a)<0)roots.push(a);});
return roots.map(function(a){var t=newTable(),td=t.insertRow().insertCell();a.parentNode.insertBefore(t,a);td.appendChild(a);return t;});}
/* Logo : largeur réglée → largeur affichée (hauteur plafonnée, comme le rendu) */
function logoFit(){var el=selEls()[0],m=el&&el.querySelector("[data-sig-cap]");if(!m)return null;
var cap=+m.getAttribute("data-sig-cap"),ratio=+m.getAttribute("data-sig-ratio");if(!cap||!ratio)return null;
var f=function(W){return Math.min(W,Math.round(Math.round(cap*Math.max(1,W/120))*ratio));};
return{f:f,inv:function(D){var k=cap*ratio,W=k>=120||D<=Math.min(120,k)?D:Math.ceil(D*120/k);while(f(W)<D&&W<2000)W++;return W;}};}
function shownWidth(){var k=sel.resize.kind,el=selEls()[0];if(!el)return null;
var n=k==="square"||k==="image"?el.querySelector("img"):k==="bar"||k==="button"?el.querySelector("td[bgcolor]"):null;
if(!n)return null;var cs=getComputedStyle(n),px=function(v){return parseFloat(v)||0;};
return Math.round(n.getBoundingClientRect().width-px(cs.paddingLeft)-px(cs.paddingRight)-px(cs.borderLeftWidth)-px(cs.borderRightWidth));}
knob.addEventListener("pointerdown",function(e){if(!sel||!sel.resize)return;e.preventDefault();e.stopPropagation();if(editing)editing.blur();
var r=selRect();if(!r)return;var w=Math.round(r.r-r.l),kind=sel.resize.kind,icons=kind==="icons";
var tables=kind==="wrap"||kind==="column"||kind==="frame"?wrapTables():[];
if(kind==="frame"&&tables[0])w=Math.round(tables[0].getBoundingClientRect().width);
if(kind==="square"||kind==="image"){var cw=shownWidth();if(cw)w=cw;}
var start=icons?sel.resize.size:w,min=sel.resize.min,max=sel.resize.max,fit=kind==="image"?logoFit():null;if(fit){min=fit.f(min);max=fit.f(max);}
rs={x:e.clientX,w:w,start:start,shown:start,cur:fit?fit.inv(start):start,icons:icons,moved:false,min:min,max:max,fit:fit,tables:tables};
liveTables=tables;
knob.setPointerCapture(e.pointerId);hideGrip();tip.style.display="block";tip.textContent=start+" px";});
knob.addEventListener("pointermove",function(e){if(!rs)return;if(!rs.moved){if(Math.abs(e.clientX-rs.x)<3)return;rs.moved=true;}var w=rs.w+(e.clientX-rs.x),v=rs.icons?Math.round(rs.start*w/rs.w):Math.round(w);
v=Math.max(rs.min,Math.min(rs.max,v));var shown=v;
if(rs.tables.length){shown=0;rs.tables.forEach(function(t){t.setAttribute("width",v);t.style.width=v+"px";t.style.maxWidth="100%";shown=Math.max(shown,Math.round(t.getBoundingClientRect().width));});}
else if(!rs.icons){live(v);var a=shownWidth(),kd=sel.resize.kind;if(a)shown=kd==="bar"||kd==="button"?a:Math.min(v,a);}else live(v);
shown=Math.max(rs.min,Math.min(rs.max,shown));rs.shown=shown;rs.cur=rs.fit?Math.max(sel.resize.min,Math.min(sel.resize.max,rs.fit.inv(shown))):shown;
tip.textContent=shown+" px";var nr=selRect();if(nr)place(nr);});
function endResize(){if(!rs)return;var v=rs.cur,changed=rs.moved&&rs.shown!==rs.start;rs=null;tip.style.display="none";takeDeferred();if(changed){post({type:"sig-resize",width:v});awaitRender();drawSel();}else restore();}
knob.addEventListener("pointerup",endResize);knob.addEventListener("pointercancel",endResize);knob.addEventListener("lostpointercapture",endResize);
knob.addEventListener("click",function(e){e.stopPropagation();});
/* Coin : taille des caractères (et des icônes des coordonnées), en direct */
corner.addEventListener("pointerdown",function(e){if(!sel||!sel.font)return;e.preventDefault();e.stopPropagation();if(editing)editing.blur();
var r=selRect();if(!r)return;var texts=[],imgs=[],seen=[];
var add=function(n){if(seen.indexOf(n)>=0)return;seen.push(n);texts.push({n:n,fs:parseFloat(n.style.fontSize),lh:parseFloat(n.style.lineHeight)||0});};
selEls().forEach(function(el){var found=false;[el].concat([].slice.call(el.querySelectorAll("*"))).forEach(function(n){if(n.style&&n.style.fontSize){add(n);found=true;}});
if(!found){var an=el.parentElement;while(an&&an!==sigRoot&&!(an.style&&an.style.fontSize))an=an.parentElement;if(an&&an!==sigRoot)add(an);}
if(sel.font.icons)el.querySelectorAll("img").forEach(function(im){imgs.push({n:im,w:im.width,h:im.height});});});
fs={x:e.clientX,y:e.clientY,w:r.r-r.l,h:r.b-r.t,start:sel.font.size,cur:sel.font.size,texts:texts,imgs:imgs,moved:false};corner.setPointerCapture(e.pointerId);hideGrip();tip.style.display="block";tip.textContent=fs.start+" px";});
corner.addEventListener("pointermove",function(e){if(!fs)return;if(!fs.moved){if(Math.abs(e.clientX-fs.x)+Math.abs(e.clientY-fs.y)<4)return;fs.moved=true;}var f=1+((e.clientX-fs.x)+(e.clientY-fs.y))/(fs.w+fs.h);
var v=Math.max(sel.font.min,Math.min(sel.font.max,Math.round(fs.start*f))),k=v/fs.start;fs.cur=v;tip.textContent=v+" px";
fs.texts.forEach(function(t){t.n.style.fontSize=(t.fs*k)+"px";if(t.lh)t.n.style.lineHeight=(t.lh*k)+"px";});
fs.imgs.forEach(function(i){i.n.style.width=(i.w*k)+"px";i.n.style.height=(i.h*k)+"px";});var nr=selRect();if(nr)place(nr);});
function endFont(){if(!fs)return;var v=fs.cur,changed=fs.moved&&v!==fs.start;fs=null;tip.style.display="none";takeDeferred();if(changed){post({type:"sig-font",size:v});awaitRender();drawSel();}else restore();}
corner.addEventListener("pointerup",endFont);corner.addEventListener("pointercancel",endFont);corner.addEventListener("lostpointercapture",endFont);
corner.addEventListener("click",function(e){e.stopPropagation();});
new ResizeObserver(drawSel).observe(document.body);document.addEventListener("load",drawSel,true);window.addEventListener("resize",drawSel);
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!e.defaultPrevented&&!editing&&sel)post({type:"sig-escape"});});
window.addEventListener("message",function(e){if(e.source!==parent)return;var d=e.data||{};
if(d.type==="sig-html"){var html=d.html||"";if(editing||rs||fs){deferred=html;return;}deferred=null;applyHtml(html);}
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
  onDragCancel,
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
      // Clic : champ et partie cliqués ; ⌘ + clic (`up`) : niveau au-dessus
      if (
        data &&
        data.type === "sig-field" &&
        (typeof data.field === "string" || data.up)
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
      if (data && data.type === "sig-drag-cancel") {
        onDragCancel?.();
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
      ? "div[data-sig-block],div[data-sig-field],div[data-sig-slot]{display:flow-root;} [data-sig-field]{cursor:pointer;border-radius:3px;transition:box-shadow .12s;} [data-sig-field]:hover{box-shadow:0 0 0 2px #5a50ff;} a{cursor:pointer;} [data-sig-edit]{cursor:text;} [data-sig-edit]:hover{outline:1px dashed #5a50ff;outline-offset:1px;} [contenteditable]{outline:2px solid #5a50ff;outline-offset:2px;border-radius:2px;cursor:text;} img{-webkit-user-drag:none;user-select:none;}"
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
