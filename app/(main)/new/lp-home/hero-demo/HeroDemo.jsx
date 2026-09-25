"use client";

import React from "react";
import s from "./hero-demo.module.css";
import InvoicesView from "./InvoicesView";
import BoardView from "./BoardView";
import TransactionsView from "./TransactionsView";

// Démo produit du hero : le mockup iPad (image) sert de cadre, et le panneau
// de droite est reconstruit en HTML pour pouvoir être animé.
//
// La scène a une taille de design fixe (1200 x 643, le ratio de l'image) et
// est mise à l'échelle sur la largeur disponible : la maquette reste fidèle
// quelle que soit la largeur du conteneur, et toutes les positions d'animation
// se calculent dans ce repère de 1200 x 643.
//
// `view` : "invoices" (liste des factures) ou "board" (tableau de projet).
const DESIGN_W = 1200;
const DESIGN_H = 643;

export default function HeroDemo({ view = "board", className = "" }) {
  const wrapRef = React.useRef(null);
  const stageRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, el.clientWidth / DESIGN_W));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ------------------------------------------------------------------
  // Scénario du tableau de projet : le curseur attrape « Refonte du site
  // vitrine », la carte pivote légèrement le temps du glissement, les cartes
  // voisines s'écartent pour lui ouvrir la place, et les compteurs de colonnes
  // suivent. GSAP est chargé à la demande pour ne pas peser sur l'affichage.
  // ------------------------------------------------------------------
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let ctx;
    let io;

    import("gsap").then(({ gsap }) => {
      if (cancelled) return;

      ctx = gsap.context(() => {
        const card = stage.querySelector('[data-anim="drag-card"]');
        const shiftUp = stage.querySelectorAll('[data-anim="shift-up"]');
        const shiftDown = stage.querySelectorAll('[data-anim="shift-down"]');
        const board = stage.querySelector('[data-anim="board"]');
        const cursor = stage.querySelector('[data-anim="cursor"]');
        const countFrom = stage.querySelector('[data-anim="count-from"]');
        const countTo = stage.querySelector('[data-anim="count-to"]');
        const countTodo = stage.querySelector('[data-anim="count-todo"]');
        const card2 = stage.querySelector('[data-anim="drag-card-2"]');
        const mate = stage.querySelector('[data-anim="cursor-2"]');
        const shiftUp2 = stage.querySelectorAll('[data-group="shift-up-2"]');
        const shiftDown2 = stage.querySelectorAll(
          '[data-group="shift-down-2"]',
        );
        const countWait = stage.querySelector('[data-anim="count-wait"]');
        const typeCard = stage.querySelector('[data-anim="type-card"]');
        const typeText = stage.querySelector('[data-anim="type-text"]');
        const caret = stage.querySelector('[data-anim="caret"]');
        const action = stage.querySelector('[data-anim="invoice-action"]');

        // Vue factures
        const layerBoard = stage.querySelector('[data-anim="layer-board"]');
        const layerInvoices = stage.querySelector(
          '[data-anim="layer-invoices"]',
        );
        const newRow = stage.querySelector('[data-anim="new-row"]');
        const newStatus = stage.querySelector('[data-anim="new-status"]');
        const newTrack = stage.querySelector('[data-anim="new-track"]');
        const sendBtn = stage.querySelector('[data-anim="send-btn"]');
        const toast = stage.querySelector('[data-anim="toast"]');
        const toast1 = stage.querySelector('[data-anim="toast-1"]');
        const toast2 = stage.querySelector('[data-anim="toast-2"]');
        const toast3 = stage.querySelector('[data-anim="toast-3"]');
        const toastBadge = stage.querySelector('[data-anim="toast-badge"]');
        const attachBtn = stage.querySelector('[data-anim="attach-btn"]');
        const countAll = stage.querySelector('[data-anim="count-all"]');
        const countDrafts = stage.querySelector('[data-anim="count-drafts"]');
        const countFoot = stage.querySelector('[data-anim="count-foot"]');
        const kpi = stage.querySelector('[data-anim="kpi-invoiced"]');

        // Vue transactions
        const layerBank = stage.querySelector('[data-anim="layer-bank"]');
        const newTrx = stage.querySelector('[data-anim="new-trx"]');
        const matchChip = stage.querySelector('[data-anim="match-chip"]');
        const balance = stage.querySelector('[data-anim="balance"]');
        const countMatch = stage.querySelector('[data-anim="count-match"]');
        const bankToast = stage.querySelector('[data-anim="bank-toast"]');
        if (!card || !cursor || !shiftDown.length) return;

        // Positions ramenées au repère de design (la scène est mise à l'échelle)
        const stageRect = stage.getBoundingClientRect();
        const ratio = stageRect.width / DESIGN_W || 1;
        const rect = (el) => {
          const r = el.getBoundingClientRect();
          return {
            x: (r.left - stageRect.left) / ratio,
            y: (r.top - stageRect.top) / ratio,
            w: r.width / ratio,
            h: r.height / ratio,
          };
        };

        // L'action « Facturer ce projet » est dans le DOM dès le départ : on
        // relève sa hauteur naturelle puis on la replie AVANT de mesurer la
        // carte, sinon celle-ci est mesurée trop haute et le calage du
        // glissement comme celui du curseur sont décalés d'autant.
        const ACTION_H = 21; // hauteur de la pastille une fois dépliée
        const actionH = action ? ACTION_H + 7 : 0; // + sa marge haute
        if (action) {
          gsap.set(action, {
            height: 0,
            marginTop: 0,
            opacity: 0,
            overflow: "hidden",
          });
        }

        const from = rect(card);
        const to = rect(shiftDown[0]);
        // second glissement : « À faire » → « En attente »
        const from2 = card2 ? rect(card2) : null;
        const to2 = shiftDown2.length ? rect(shiftDown2[0]) : null;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const step = from.h + 6; // hauteur d'une carte + écart entre cartes

        // La pointe du curseur est à ~4,5 / 2,5 px de son coin : on décale
        // pour que ce soit elle qui vise le point voulu.
        const CUR_X = -4.5;
        const CUR_Y = -2.5;

        // Le curseur saisit la carte un peu à droite de son centre
        const grabX = from.x + from.w * 0.62 + CUR_X;
        const grabY = from.y + from.h / 2 + CUR_Y;
        const grab2X = from2 ? from2.x + from2.w * 0.62 + CUR_X : 0;
        const grab2Y = from2 ? from2.y + from2.h / 2 + CUR_Y : 0;
        const dx2 = from2 && to2 ? to2.x - from2.x : 0;
        const dy2 = from2 && to2 ? to2.y - from2.y : 0;

        const fromCount = countFrom?.textContent ?? "";
        const toCount = countTo?.textContent ?? "";
        const todoCount = countTodo?.textContent ?? "";
        const waitCount = countWait?.textContent ?? "";
        const setCounts = (a, b) => {
          if (countFrom) countFrom.textContent = a;
          if (countTo) countTo.textContent = b;
        };

        // Les deux cartes « vivantes » : repliées au repos, elles se déploient
        // pendant que le glissement se fait dans une autre colonne.
        const fullText = typeCard?.dataset.text ?? "";
        const typed = { n: 0 };
        const folded = {
          height: 0,
          paddingTop: 0,
          paddingBottom: 0,
          marginTop: -6,
          opacity: 0,
          overflow: "hidden",
        };
        const unfolded = {
          height: from.h,
          paddingTop: 9,
          paddingBottom: 9,
          marginTop: 0,
          opacity: 1,
        };

        // Le curseur de saisie clignote en continu ; il n'est visible que
        // lorsque sa carte l'est.
        if (caret) {
          gsap.to(caret, {
            opacity: 0,
            duration: 0.5,
            repeat: -1,
            yoyo: true,
            ease: "steps(1)",
          });
        }

        // ---- vue factures : valeurs de départ et compteur du CA ----------
        const ROW_H = 44;
        // Hauteur d'une notification : sert à empiler les trois une fois
        // dépliées (hauteur + écart).
        const noteStep = toast1 ? rect(toast1).h + 8 : 0;

        // La ligne de facture est repliée au repos : on la déplie le temps de
        // relever la position du bouton d'envoi, sinon le curseur vise à côté.
        let sendPoint = { x: 0, y: 0 };
        if (newRow && sendBtn) {
          gsap.set(newRow, { height: ROW_H, opacity: 1 });
          const r = rect(sendBtn);
          sendPoint = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
          gsap.set(newRow, { height: 0, opacity: 0 });
        }

        // Points visés sur la pile : la notification, puis son bouton
        const notePoint = toast1
          ? (() => {
              const r = rect(toast1);
              return { x: r.x + 34, y: r.y + r.h / 2 };
            })()
          : { x: 0, y: 0 };
        const attachPoint = attachBtn
          ? (() => {
              const r = rect(attachBtn);
              return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
            })()
          : notePoint;
        const KPI_FROM = 128450;
        const KPI_TO = 130270;
        const kpiVal = { n: KPI_FROM };
        const euro = (n) =>
          n.toLocaleString("fr-FR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) + " €";
        const statusDraft = newStatus?.innerHTML ?? "";
        // Solde bancaire : il grimpe du montant de la facture encaissée
        const BAL_FROM = 22017.55;
        const BAL_TO = BAL_FROM + 1820;
        const bal = { n: BAL_FROM };
        const matchCount = countMatch?.textContent ?? "";
        const CLOCK =
          '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2.5 2"/></svg>';

        const resetBank = () => {
          bal.n = BAL_FROM;
          if (balance) balance.textContent = euro(BAL_FROM);
          if (countMatch) countMatch.textContent = matchCount;
        };

        const resetInvoices = () => {
          if (newStatus) {
            newStatus.className = `${s.badge} ${s.bDraft}`;
            newStatus.innerHTML = statusDraft;
          }
          if (newTrack) {
            newTrack.className = s.chip;
            newTrack.textContent = "Non envoyé";
          }
          if (countAll) countAll.textContent = "38";
          if (countDrafts) countDrafts.textContent = "3";
          if (countFoot) countFoot.textContent = "38";
          kpiVal.n = KPI_FROM;
          if (kpi) kpi.textContent = euro(KPI_FROM);
        };

        const resetBoard = () => {
          setCounts(fromCount, toCount);
          if (countTodo) countTodo.textContent = todoCount;
          if (countWait) countWait.textContent = waitCount;
          if (typeText) typeText.textContent = "";
          typed.n = 0;
        };

        const tl = gsap.timeline({
          repeat: -1,
          repeatDelay: 0.4,
          defaults: { ease: "power2.inOut" },
          paused: true,
        });

        tl.set(card, {
          x: 0,
          y: 0,
          rotation: 0,
          position: "relative",
          zIndex: 5,
        })
          .set([shiftUp, shiftDown], { y: 0 })
          .set(card2, {
            x: 0,
            y: 0,
            rotation: 0,
            position: "relative",
            zIndex: 5,
          })
          .set([shiftUp2, shiftDown2], { y: 0 })
          .set(board, { opacity: 1 })
          .set(cursor, { x: 980, y: 600, opacity: 0 })
          .set(mate, { x: 300, y: 620, opacity: 0 })
          .set(typeCard, folded)
          .set(action, {
            height: 0,
            marginTop: 0,
            opacity: 0,
            overflow: "hidden",
          })
          .set(layerBoard, { opacity: 1, y: 0 })
          .set(layerInvoices, { opacity: 0, y: 10 })
          .set(newRow, {
            height: 0,
            opacity: 0,
            borderBottomColor: "transparent",
          })
          .set(layerBank, { opacity: 0, y: 10 })
          .set(newTrx, {
            height: 0,
            opacity: 0,
            borderBottomColor: "transparent",
          })
          .set(matchChip, { opacity: 0, scale: 0.8 })
          .set(bankToast, {
            opacity: 0,
            scale: 0.9,
            transformOrigin: "top right",
          })
          .set(attachBtn, { scale: 1 })
          .set(toast, { opacity: 0, scale: 0.9, transformOrigin: "top right" })
          .set(toast2, { y: 5, scale: 0.985, rotation: -1.4 })
          .set(toast3, { y: 10, scale: 0.965, rotation: 2 })
          .set(toastBadge, { opacity: 1, scale: 1 })
          .call(() => {
            resetBoard();
            resetInvoices();
            resetBank();
          })

          // ================= 1. le tableau de projet =================
          // Deux cartes se déplacent quasi en même temps : celle d'« En cours »
          // sous le curseur principal, celle d'« À faire » sous le curseur du
          // collaborateur. Les repères sont en temps absolus pour que les deux
          // gestes se chevauchent au lieu de s'enchaîner.
          .to(cursor, { opacity: 1, duration: 0.25 }, 0.15)
          .to(
            cursor,
            { x: grabX, y: grabY, duration: 0.8, ease: "power3.inOut" },
            0.2,
          )
          .to(card, { rotation: -1, duration: 0.08, ease: "power2.out" }, 1)
          .to(card, { rotation: 3, duration: 0.16, ease: "back.out(3)" }, 1.08)
          .to(card, { x: dx, y: dy, duration: 0.85 }, 1.2)
          .to(cursor, { x: grabX + dx, y: grabY + dy, duration: 0.85 }, 1.2)
          .to(
            shiftDown,
            { y: step, duration: 0.4, ease: "back.out(1.4)", stagger: 0.035 },
            1.4,
          )
          .to(
            shiftUp,
            { y: -step, duration: 0.4, ease: "back.out(1.4)", stagger: 0.035 },
            1.4,
          )
          .to(card, { rotation: 0, duration: 0.22, ease: "back.out(3)" }, 2.05)
          .to(card, { y: dy + 5, duration: 0.1, ease: "power2.out" }, 2.05)
          .to(card, { y: dy, duration: 0.22, ease: "back.out(2.5)" }, 2.15)
          .call(
            () =>
              setCounts(
                String(Number(fromCount) - 1),
                String(Number(toCount) + 1),
              ),
            null,
            2.2,
          )

          // — en même temps, le collaborateur déplace une carte d'« À faire »
          .to(mate, { opacity: 1, duration: 0.25 }, 0.4)
          .fromTo(
            mate,
            { x: 300, y: 620 },
            { x: grab2X, y: grab2Y, duration: 0.85, ease: "power3.inOut" },
            0.45,
          )
          .to(card2, { rotation: -1, duration: 0.08, ease: "power2.out" }, 1.3)
          .to(
            card2,
            { rotation: -3, duration: 0.16, ease: "back.out(3)" },
            1.38,
          )
          .to(card2, { x: dx2, y: dy2, duration: 0.8 }, 1.5)
          .to(mate, { x: grab2X + dx2, y: grab2Y + dy2, duration: 0.8 }, 1.5)
          .to(
            shiftDown2,
            { y: step, duration: 0.4, ease: "back.out(1.4)", stagger: 0.035 },
            1.7,
          )
          .to(
            shiftUp2,
            { y: -step, duration: 0.4, ease: "back.out(1.4)", stagger: 0.035 },
            1.7,
          )
          .to(card2, { rotation: 0, duration: 0.22, ease: "back.out(3)" }, 2.3)
          .to(card2, { y: dy2 + 5, duration: 0.1, ease: "power2.out" }, 2.3)
          .to(card2, { y: dy2, duration: 0.22, ease: "back.out(2.5)" }, 2.4)
          .call(
            () => {
              if (countTodo)
                countTodo.textContent = String(Number(todoCount) - 1);
              if (countWait)
                countWait.textContent = String(Number(waitCount) + 1);
            },
            null,
            2.45,
          )
          .to(
            mate,
            { x: grab2X + dx2 - 40, y: grab2Y + dy2 + 90, duration: 0.7 },
            2.9,
          )
          .to(mate, { opacity: 0, duration: 0.25 }, 3.3)

          // — et une carte s'écrit dans « En attente »
          .to(
            typeCard,
            { ...unfolded, duration: 0.3, ease: "power2.out" },
            0.55,
          )
          .to(
            typed,
            {
              n: fullText.length,
              duration: 1.3,
              ease: "none",
              onUpdate: () => {
                if (typeText)
                  typeText.textContent = fullText.slice(0, Math.round(typed.n));
              },
            },
            0.8,
          )

          // ========== 2. l'action « Facturer ce projet » ==========
          .to(
            action,
            {
              height: ACTION_H,
              marginTop: 7,
              opacity: 1,
              duration: 0.3,
              ease: "back.out(1.8)",
            },
            2.7,
          )
          .to(
            shiftDown,
            { y: step + actionH, duration: 0.3, ease: "power2.out" },
            2.7,
          )
          .to(
            cursor,
            {
              x: to.x + to.w / 2 + CUR_X,
              y: to.y + from.h + 8.5 + CUR_Y,
              duration: 0.45,
              ease: "power2.inOut",
            },
            2.8,
          )
          .to(action, { scale: 0.95, duration: 0.1, ease: "power2.out" }, 3.4)
          .to(action, { scale: 1, duration: 0.2, ease: "back.out(3)" }, 3.5)

          // ========== 3. bascule vers la vue factures ==========
          .to(
            layerBoard,
            { opacity: 0, y: -8, duration: 0.3, ease: "power2.in" },
            "+=0.12",
          )
          .to(
            layerInvoices,
            { opacity: 1, y: 0, duration: 0.42, ease: "power2.out" },
            "-=0.14",
          )
          .to(
            cursor,
            { x: 760, y: 250, duration: 0.5, ease: "power2.inOut" },
            "<",
          )
          // le tableau de projet se remet en place pendant qu'il est hors champ
          .set([card, card2].filter(Boolean), { x: 0, y: 0, rotation: 0 })
          .set([shiftUp, shiftDown, shiftUp2, shiftDown2], { y: 0 })
          .set(typeCard, folded)
          .set(action, { height: 0, marginTop: 0, opacity: 0 })
          .call(resetBoard)

          // ========== 4. la facture apparaît ==========
          .addLabel("facture")
          .to(
            newRow,
            {
              height: ROW_H,
              opacity: 1,
              borderBottomColor: "#f2f2f4",
              duration: 0.45,
              ease: "power2.out",
            },
            "+=0.15",
          )
          .fromTo(
            newRow,
            { backgroundColor: "#F1EFFF" },
            {
              backgroundColor: "rgba(255,255,255,0)",
              duration: 1.2,
              immediateRender: false,
            },
            "<",
          )
          .call(
            () => {
              if (countAll) countAll.textContent = "39";
              if (countDrafts) countDrafts.textContent = "4";
              if (countFoot) countFoot.textContent = "39";
            },
            null,
            "<0.2",
          )
          .fromTo(
            [countAll, countDrafts].filter(Boolean),
            { y: -5, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.3,
              stagger: 0.05,
              immediateRender: false,
            },
            "<",
          )

          // ========== 5. envoi de la facture ==========
          .to(
            cursor,
            {
              x: sendPoint.x + CUR_X,
              y: sendPoint.y + CUR_Y,
              duration: 0.55,
              ease: "power3.inOut",
            },
            // dès l'apparition de la ligne : le curseur part en même temps
            // qu'elle se déplie, sans temps mort après la transition
            "facture",
          )
          .to(sendBtn, { scale: 0.9, duration: 0.1, ease: "power2.out" })
          .to(sendBtn, { scale: 1, duration: 0.2, ease: "back.out(3)" })
          .call(() => {
            if (newTrack) {
              newTrack.className = `${s.chip} ${s.chipOpen}`;
              newTrack.textContent = "Envoyé";
            }
            if (newStatus) {
              newStatus.className = `${s.badge} ${s.bWait}`;
              newStatus.innerHTML = CLOCK + " En attente";
            }
          })
          .fromTo(
            [newTrack, newStatus].filter(Boolean),
            { scale: 0.85 },
            {
              scale: 1,
              duration: 0.35,
              ease: "back.out(2.5)",
              immediateRender: false,
            },
            "<",
          )

          // ========== 6. notification + CA qui grimpe ==========
          .to(
            toast,
            { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" },
            "+=0.1",
          )
          // le curseur vient sur la pile, qui se déplie à son arrivée
          .to(
            cursor,
            {
              x: notePoint.x + CUR_X,
              y: notePoint.y + CUR_Y,
              duration: 0.55,
              ease: "power3.inOut",
            },
            "<0.2",
          )
          .to(
            toast2,
            {
              y: noteStep,
              scale: 1,
              rotation: 0,
              duration: 0.45,
              ease: "power3.out",
            },
            ">-0.05",
          )
          .to(
            toast3,
            {
              y: noteStep * 2,
              scale: 1,
              rotation: 0,
              duration: 0.45,
              ease: "power3.out",
            },
            "<0.07",
          )
          .to(
            toastBadge,
            { opacity: 0, scale: 0.8, duration: 0.25, ease: "power2.in" },
            "<",
          )
          .to(
            kpiVal,
            {
              n: KPI_TO,
              duration: 1,
              ease: "power1.inOut",
              onUpdate: () => {
                if (kpi) kpi.textContent = euro(kpiVal.n);
              },
            },
            "<0.15",
          )

          // le curseur vient cliquer « Rattacher » : c'est ce clic qui ouvre
          // le flux bancaire
          .to(
            cursor,
            {
              x: attachPoint.x + CUR_X,
              y: attachPoint.y + CUR_Y,
              duration: 0.5,
              ease: "power3.inOut",
            },
            "+=0.5",
          )
          .to(attachBtn, { scale: 0.93, duration: 0.1, ease: "power2.out" })
          .to(attachBtn, { scale: 1, duration: 0.2, ease: "back.out(3)" })
          // ========== 7. bascule vers le flux bancaire ==========
          .to(toast, { opacity: 0, scale: 0.94, duration: 0.25 }, "+=0.15")
          .to(cursor, { opacity: 0, duration: 0.18 }, "<0.05")
          .to(
            layerInvoices,
            { opacity: 0, y: -8, duration: 0.24, ease: "power2.in" },
            "-=0.1",
          )
          .to(
            layerBank,
            { opacity: 1, y: 0, duration: 0.34, ease: "power2.out" },
            "-=0.14",
          )
          // la vue factures se réinitialise pendant qu'elle est hors champ
          .set(newRow, {
            height: 0,
            opacity: 0,
            borderBottomColor: "transparent",
          })
          .call(resetInvoices)

          // ========== 8. le virement arrive et se rapproche tout seul ======
          .to(
            newTrx,
            {
              height: ROW_H,
              opacity: 1,
              borderBottomColor: "#f2f2f4",
              duration: 0.45,
              ease: "power2.out",
            },
            "+=0.15",
          )
          .fromTo(
            newTrx,
            { backgroundColor: "#F1EFFF" },
            {
              backgroundColor: "rgba(255,255,255,0)",
              duration: 1.3,
              immediateRender: false,
            },
            "<",
          )
          // le solde grimpe du montant encaissé
          .to(
            bal,
            {
              n: BAL_TO,
              duration: 0.9,
              ease: "power1.inOut",
              onUpdate: () => {
                if (balance) balance.textContent = euro(bal.n);
              },
            },
            "<0.25",
          )
          // puis le rapprochement se fait avec la facture émise
          .to(
            matchChip,
            {
              opacity: 1,
              scale: 1,
              duration: 0.4,
              ease: "back.out(2)",
              immediateRender: false,
            },
            "+=0.35",
          )
          .call(
            () => {
              if (countMatch)
                countMatch.textContent = String(Number(matchCount) - 1);
            },
            null,
            "<0.1",
          )
          .to(
            bankToast,
            { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.7)" },
            "<0.05",
          )

          // ========== 9. retour au tableau de projet ==========
          .to(bankToast, { opacity: 0, scale: 0.94, duration: 0.3 }, "+=1.3")
          .to(
            layerBank,
            { opacity: 0, y: -8, duration: 0.3, ease: "power2.in" },
            "-=0.05",
          )
          .set(layerBoard, { y: 10 })
          .to(
            layerBoard,
            { opacity: 1, y: 0, duration: 0.42, ease: "power2.out" },
            "-=0.14",
          )
          .set(newTrx, {
            height: 0,
            opacity: 0,
            borderBottomColor: "transparent",
          })
          .set(matchChip, { opacity: 0, scale: 0.8 })
          .set(bankToast, { opacity: 0, scale: 0.9 })
          .call(resetBank);

        // On ne joue que quand la démo est à l'écran
        io = new IntersectionObserver(
          ([e]) => (e.isIntersecting ? tl.play() : tl.pause()),
          { threshold: 0.25 },
        );
        io.observe(stage);
      }, stage);
    });

    return () => {
      cancelled = true;
      io?.disconnect();
      ctx?.revert();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`${s.wrap} ${className}`.trim()}
      style={{ height: DESIGN_H * scale }}
    >
      <div
        ref={stageRef}
        className={s.stage}
        style={{ transform: `scale(${scale})` }}
      >
        <img
          className={s.device}
          src="/lp/home/ipad-panneau-vide.png"
          alt={
            view === "board"
              ? "Interface Newbi : tableau de suivi d'un projet client"
              : "Interface Newbi : liste des factures clients"
          }
          width={2400}
          height={1286}
        />
        <div className={s.panel}>
          <div className={s.layer} data-anim="layer-board">
            <BoardView />
          </div>
          <div
            className={`${s.layer} ${s.layerIdle}`}
            data-anim="layer-invoices"
          >
            <InvoicesView />
          </div>
          <div className={`${s.layer} ${s.layerIdle}`} data-anim="layer-bank">
            <TransactionsView />
          </div>
        </div>

        <div className={s.mate} data-anim="cursor-2" aria-hidden="true">
          <svg className={s.mateArrow} viewBox="0 0 24 24">
            <path
              d="M5.5 3.2v17.6c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35z"
              fill="#5A50FF"
              stroke="#fff"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          <span className={s.mateName}>Théo</span>
        </div>

        <svg
          className={s.cursor}
          data-anim="cursor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M5.5 3.2v17.6c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35z"
            fill="#fff"
            stroke="#17171a"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
