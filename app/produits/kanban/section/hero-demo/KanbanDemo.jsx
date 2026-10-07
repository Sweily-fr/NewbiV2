"use client";

import React from "react";
import s from "./kanban-demo.module.css";
import BoardView from "./BoardView";

// Démo du hero de la LP kanban. Copie indépendante de la démo de la home
// (app/(main)/new/lp-home/hero-demo) réduite au seul acte « tableau de
// projet » : on peut la faire évoluer ici sans toucher à la home.
//
// Le mockup iPad (image) sert de cadre, et le panneau de droite est
// reconstruit en HTML pour pouvoir être animé.
//
// La scène a une taille de design fixe (1200 x 643, le ratio de l'image) et
// est mise à l'échelle sur la largeur disponible : la maquette reste fidèle
// quelle que soit la largeur du conteneur, et toutes les positions d'animation
// se calculent dans ce repère de 1200 x 643.
//
const DESIGN_W = 1200;
const DESIGN_H = 643;

export default function KanbanDemo({ className = "" }) {
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
        // Ticket créé en tête de la première colonne
        const typeTop = stage.querySelector('[data-anim="type-card-top"]');
        const typeTextTop = stage.querySelector('[data-anim="type-text-top"]');
        const caretTop = stage.querySelector('[data-anim="caret-top"]');

        const layerBoard = stage.querySelector('[data-anim="layer-board"]');
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
        // Carte repliée : hauteur nulle, sans marge, invisible.
        const folded0 = {
          height: 0,
          paddingTop: 0,
          paddingBottom: 0,
          marginTop: -6,
          opacity: 0,
          overflow: "hidden",
        };
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

        // Même précaution que pour la pastille d'action : le ticket du haut
        // est replié avant toute mesure, sinon les cartes de la première
        // colonne seraient relevées trop bas.
        const posTop = typeTop ? rect(typeTop) : null;
        if (typeTop) gsap.set(typeTop, folded0);

        const from = rect(card);
        const to = rect(shiftDown[0]);
        // second glissement : « À faire » → « En attente »
        const from2 = card2 ? rect(card2) : null;
        // La carte d'« À faire » prend la place que « Refonte du site vitrine »
        // libère en partant vers « Terminées » : même emplacement, donc aucune
        // carte d'« En cours » n'a besoin de s'écarter.
        const to2 = from;
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
        const fullTextTop = typeTop?.dataset.text ?? "";
        const typedTop = { n: 0 };
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
        for (const c of [caret, caretTop]) {
          if (!c) continue;
          gsap.to(c, {
            opacity: 0,
            duration: 0.5,
            repeat: -1,
            yoyo: true,
            ease: "steps(1)",
          });
        }

        const resetBoard = () => {
          setCounts(fromCount, toCount);
          if (countTodo) countTodo.textContent = todoCount;
          if (countWait) countWait.textContent = waitCount;
          if (typeText) typeText.textContent = "";
          typed.n = 0;
          if (typeTextTop) typeTextTop.textContent = "";
          typedTop.n = 0;
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
          .set(typeTop, folded0)
          .set(action, {
            height: 0,
            marginTop: 0,
            opacity: 0,
            overflow: "hidden",
          })
          .set(layerBoard, { opacity: 1, y: 0 })
          .call(resetBoard)

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
          .to(card2, { x: dx2, y: dy2, duration: 0.8 }, 1.65)
          .to(mate, { x: grab2X + dx2, y: grab2Y + dy2, duration: 0.8 }, 1.65)
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
              // « En cours » a perdu une carte au profit de « Terminées » et
              // en récupère une d'« À faire » : son total revient à sa valeur
              // de départ.
              if (countFrom) countFrom.textContent = fromCount;
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
          // La carte partie vers « Terminées » occupe toujours sa place dans
          // le flux d'« En cours » : en dépliant sa pastille d'action, elle
          // grandit et pousse les cartes du dessous. On compense d'autant,
          // sinon un trou se creuse sous la carte qui vient d'arriver.
          .to(shiftUp, { y: -actionH, duration: 0.3, ease: "power2.out" }, 2.7)
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

          // ========== 3. un ticket s'écrit en tête de « À faire » ==========
          // Le curseur remonte en haut de la première colonne, le ticket se
          // déplie sous lui et son titre s'écrit.
          .to(
            cursor,
            {
              x: posTop ? posTop.x + posTop.w * 0.3 + CUR_X : 0,
              y: posTop ? posTop.y + 10 + CUR_Y : 0,
              duration: 0.6,
              ease: "power2.inOut",
            },
            3.75,
          )
          .to(cursor, { scale: 0.86, duration: 0.09, ease: "power3.in" }, 4.3)
          .to(
            cursor,
            { scale: 1, duration: 0.22, ease: "elastic.out(1, 0.55)" },
            4.39,
          )
          .to(
            typeTop,
            {
              height: posTop ? posTop.h : from.h,
              paddingTop: 9,
              paddingBottom: 9,
              marginTop: 0,
              opacity: 1,
              duration: 0.3,
              ease: "power2.out",
            },
            4.4,
          )
          // La carte déjà posée dans « En attente » reste un enfant de cette
          // colonne : le dépliage la pousserait vers le bas, on compense.
          .to(card2, { y: `-=${step}`, duration: 0.3, ease: "power2.out" }, 4.4)
          .call(
            () => {
              if (countTodo)
                countTodo.textContent = String(Number(todoCount) - 1 + 1);
            },
            null,
            4.5,
          )
          .to(
            typedTop,
            {
              n: fullTextTop.length,
              duration: 1.25,
              ease: "none",
              onUpdate: () => {
                if (typeTextTop)
                  typeTextTop.textContent = fullTextTop.slice(
                    0,
                    Math.round(typedTop.n),
                  );
              },
            },
            4.6,
          )
          .to(cursor, { opacity: 0, duration: 0.3 }, 6.1);

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
          alt="Interface Newbi : tableau de suivi d'un projet client"
          width={2400}
          height={1286}
        />
        <div className={s.panel}>
          <div className={s.layer} data-anim="layer-board">
            <BoardView />
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
