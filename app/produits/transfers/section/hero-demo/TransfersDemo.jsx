"use client";

import React from "react";
import s from "./transfers-demo.module.css";

// Interface du hero de la LP transfert de fichiers : le mockup iPad sert de
// cadre et la modale « Nouveau transfert » du tableau de bord est reconstruite
// en HTML dans le panneau. La scène a une taille de design fixe (1200 x 643)
// mise à l'échelle sur la largeur disponible.
const DESIGN_W = 1200;
const DESIGN_H = 643;

/* Pictogrammes au trait, repris de la modale (lucide) */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const Upload = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 9l5-5 5 5M12 4v12" />
  </svg>
);

const Download = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5M12 15V3" />
  </svg>
);

const Close = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const FileUp = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M12 18v-6M9.5 14.5 12 12l2.5 2.5" />
  </svg>
);

const Lock = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const Trash = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-.9 14.1A2 2 0 0 1 16.1 22H7.9a2 2 0 0 1-2-1.9L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

const LinkIcon = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
);

const Clock = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const Mail = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);

const Bell = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

const Eye = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ChevronDown = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const Enter = ({ size = 9 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <path d="M9 10 4 15l5 5" />
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
  </svg>
);

// Pointeur de souris : la flèche pleine du système, bordée de blanc.
const Pointer = () => (
  <svg width="19" height="19" viewBox="0 0 24 24">
    <path
      d="M5.5 2.3 19 12.4l-6.4.6 3.4 7.1-2.7 1.3-3.4-7.2-4.4 4.3z"
      fill="#17171a"
      stroke="#fff"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

// Les deux interrupteurs du bloc « Notifications ».
const TOGGLES = [
  {
    label: "Notifier en cas de téléchargement",
    help: "Recevoir un email lorsqu'un fichier est téléchargé",
  },
  {
    label: "Rappel avant expiration",
    help: "Recevoir un email 2 jours avant l'expiration",
  },
];

// Les trois visuels du scénario : l'envoi d'un studio photo à son client.
const FICHIERS = [
  {
    nom: "runway_show_01.jpg",
    taille: "3,2 Mo",
    src: "/lp/transfers/anim/runway.jpg",
  },
  {
    nom: "backstage_paris.png",
    taille: "4,8 Mo",
    src: "/lp/transfers/anim/backstage.jpg",
  },
  {
    nom: "collection_fw26.jpg",
    taille: "2,1 Mo",
    src: "/lp/transfers/anim/collection.jpg",
  },
];

// Les mêmes visuels, en grand, pour le tourbillon final.
const VISUELS = [
  {
    src: "/lp/transfers/anim/backstage.jpg",
    ext: ".psd",
    w: 204,
    h: 278,
    x: -40,
    y: 236,
    rot: -5,
    depart: 0,
    tours: Math.PI * 2.2,
  },
  {
    src: "/lp/transfers/anim/runway.jpg",
    ext: ".tiff",
    w: 248,
    h: 170,
    x: 1244,
    y: 168,
    rot: 3,
    depart: Math.PI * 0.7,
    tours: Math.PI * 2.5,
  },
  {
    src: "/lp/transfers/anim/collection.jpg",
    ext: ".mov",
    w: 218,
    h: 218,
    x: 1236,
    y: 468,
    rot: 2,
    depart: Math.PI * 1.3,
    tours: Math.PI * 2,
  },
];

// Anneau de progression : rayon 38 dans un viewBox de 90.
const PERIMETRE = 2 * Math.PI * 38;

export default function TransfersDemo({ className = "" }) {
  const wrapRef = React.useRef(null);
  const stageRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // Pas de plafond à 1 : le conteneur est plus large que la scène de
    // design, la maquette doit le remplir pour rester centrée (l'image
    // source fait 2400 px, l'agrandissement reste net).
    const measure = () => setScale(el.clientWidth / DESIGN_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scénario, repris de la démo d'origine de la LP : on glisse trois visuels
  // dans la zone de dépôt, la liste se remplit, le transfert part, l'anneau
  // tourne, le client télécharge, les visuels jaillissent. En boucle, lancé
  // à l'entrée dans l'écran et neutralisé en mouvement réduit.
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // Mouvement réduit, ou petit écran : on laisse l'interface telle quelle.
    // Sous `md`, la maquette est réduite au point que l'animation n'est plus
    // lisible — autant ne pas charger GSAP pour rien.
    if (
      window.matchMedia("(max-width: 767px)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    let ctx;
    let tl;
    let io;
    let annule = false;

    import("gsap").then(({ gsap }) => {
      if (annule) return;

      const q = (sel) => stage.querySelector(sel);
      const qa = (sel) => Array.from(stage.querySelectorAll(sel));

      // Coordonnées dans le repère de la scène : la scène n'a pas de mise à
      // l'échelle interne, offsetLeft/offsetTop sont donc exploitables tels
      // quels (getBoundingClientRect renverrait des pixels écran).
      const posDe = (el) => {
        let x = 0;
        let y = 0;
        let n = el;
        while (n && n !== stage) {
          x += n.offsetLeft;
          y += n.offsetTop;
          n = n.offsetParent;
        }
        return { x, y };
      };
      const centreDe = (el) => {
        const o = posDe(el);
        return { x: o.x + el.offsetWidth / 2, y: o.y + el.offsetHeight / 2 };
      };

      const groupe = q("[data-group]");
      const zone = q("[data-drop]");
      const repos = q("[data-idle]");
      const idleTxt = q("[data-idle-txt]");
      const idleDrag = q("[data-idle-drag]");
      const icone = q("[data-drop-icon]");
      const liste = q("[data-list]");
      const lignes = qa("[data-f-row]");
      const progres = q("[data-progress]");
      const anneau = q("[data-ring]");
      const pourcent = q("[data-pct]");
      const fini = q("[data-done]");
      const finiBtn = q("[data-done-btn]");
      const pile = q("[data-drag]");
      const cartes = qa("[data-drag-card]");
      const visuels = qa("[data-reveal]");
      const curseur = q("[data-cursor]");
      const onde = q("[data-ping]");
      const envoyer = q("[data-send]");

      const zoneC = centreDe(zone);
      // Point de départ de la pile : haut à droite, à cheval sur le bord.
      const pileDepart = { x: 1142, y: 150 };
      // Chaque carte a ses coordonnées propres : la pile n'est plus déplacée
      // en bloc, les cartes se suivent avec un léger retard, comme attachées.
      const auDepart = (i) => ({
        x: pileDepart.x + PILE[i].x,
        y: pileDepart.y + PILE[i].y,
      });
      const enMain = (i) => ({
        x: pileDepart.x + PILE[i].x * 0.4,
        y: pileDepart.y + PILE[i].y * 0.4,
      });
      const surZone = (i) => ({
        x: zoneC.x + PILE[i].x * 0.4,
        y: zoneC.y + 14 + PILE[i].y * 0.4,
      });
      // La carte du dessus mène, les deux autres traînent derrière elle.
      // Retard volontairement court : elles restent groupées, l'écart se
      // creuse d'une cinquantaine de pixels au plus fort du mouvement.
      const retardDe = (i) => (2 - i) * 0.025;
      // Centre de la scène, d'où partent les visuels du final.
      const cx = DESIGN_W / 2;
      const cy = DESIGN_H / 2;

      // Pile de trois cartes : la dernière est au-dessus, les deux autres
      // dépassent derrière pour qu'on lise bien « trois fichiers ».
      const PILE = [
        { r: -7, x: -6, y: 5 },
        { r: 5, x: 5, y: 2 },
        { r: -2, x: 0, y: 0 },
      ];

      const avance = { val: 0 };

      ctx = gsap.context(() => {
        const majAnneau = () => {
          const v = Math.round(avance.val);
          pourcent.textContent = `${v}%`;
          anneau.style.strokeDashoffset = `${PERIMETRE - (avance.val / 100) * PERIMETRE}`;
        };

        // Un clic : le curseur s'enfonce, une onde part du point de contact,
        // la cible encaisse l'appui.
        const clic = (cible) => {
          tl.to(curseur, { scale: 0.86, duration: 0.09, ease: "power3.in" })
            .set(onde, { scale: 0.35, opacity: 0.5 }, "<")
            .to(
              onde,
              { scale: 1.6, opacity: 0, duration: 0.55, ease: "power2.out" },
              "<",
            )
            .to(curseur, {
              scale: 1,
              duration: 0.24,
              ease: "elastic.out(1, 0.55)",
            });
          if (cible) {
            tl.to(
              cible,
              { scale: 0.96, duration: 0.09, ease: "power3.in" },
              "<-=0.33",
            ).to(cible, {
              scale: 1,
              duration: 0.32,
              ease: "elastic.out(1, 0.5)",
            });
          }
        };

        const etatInitial = () => {
          gsap.set([liste, progres, fini, pile], { opacity: 0 });
          gsap.set(groupe, {
            scale: 1,
            transformOrigin: "50% 50%",
            x: 0,
            y: 0,
          });
          gsap.set(repos, { opacity: 1 });
          gsap.set(idleTxt, { opacity: 1 });
          gsap.set(idleDrag, { opacity: 0 });
          gsap.set(icone, { scale: 1 });
          gsap.set(zone, { scale: 1 });
          gsap.set(lignes, { opacity: 0, x: -14 });
          gsap.set(finiBtn, { opacity: 0, y: 8, scale: 1 });
          gsap.set(envoyer, { scale: 1 });
          gsap.set(anneau, {
            strokeDasharray: PERIMETRE,
            strokeDashoffset: PERIMETRE,
          });
          avance.val = 0;
          pourcent.textContent = "0%";
          gsap.set(pile, { x: 0, y: 0 });
          cartes.forEach((c, i) =>
            gsap.set(c, {
              x: auDepart(i).x,
              y: auDepart(i).y,
              rotate: PILE[i].r,
              scale: 1,
              opacity: 0,
            }),
          );
          // Le curseur est à l'écran en permanence, au repos en haut à droite.
          gsap.set(curseur, { x: 1188, y: 40, scale: 1, opacity: 1 });
          visuels.forEach((v) =>
            gsap.set(v, { x: cx, y: cy, scale: 0, rotate: 0, opacity: 0 }),
          );
        };

        etatInitial();

        tl = gsap.timeline({
          repeat: -1,
          repeatDelay: 0.6,
          paused: true,
          onRepeat: etatInitial,
        });

        /* ---- 1. Les trois visuels apparaissent sous le curseur ---- */
        tl.to(pile, { opacity: 1, duration: 0.01 }, 0.2)
          .fromTo(
            cartes,
            {
              opacity: 0,
              scale: 0.72,
              x: (i) => auDepart(i).x,
              y: (i) => auDepart(i).y - 38,
            },
            {
              opacity: 1,
              scale: 1,
              x: (i) => auDepart(i).x,
              y: (i) => auDepart(i).y,
              duration: 0.36,
              ease: "back.out(1.7)",
              stagger: 0.1,
            },
            "<",
          )

          /* ---- 2. Il rejoint la pile et l'attrape ---- */
          .to(
            curseur,
            {
              x: pileDepart.x + 34,
              y: pileDepart.y + 26,
              duration: 0.42,
              ease: "power3.inOut",
            },
            "-=0.3",
          )
          .to(curseur, { scale: 0.84, duration: 0.08, ease: "power3.in" })
          .to(cartes, {
            rotate: (i) => PILE[i].r * 0.35,
            x: (i) => enMain(i).x,
            y: (i) => enMain(i).y,
            duration: 0.22,
            ease: "power2.out",
          })
          .to(curseur, { scale: 1, duration: 0.14, ease: "power2.out" }, "<")

          /* ---- 3. Glisser jusqu'à la zone de dépôt ---- */
          .addLabel("glisse")
          .to(
            curseur,
            {
              x: zoneC.x + 30,
              y: zoneC.y + 46,
              duration: 0.78,
              ease: "power2.inOut",
            },
            "glisse",
          )
          // la zone réagit au survol, sans changement de couleur
          .to(
            zone,
            { scale: 1.008, duration: 0.26, ease: "power2.out" },
            "glisse+=0.42",
          )
          .to(idleTxt, { opacity: 0, duration: 0.2 }, "<")
          .to(idleDrag, { opacity: 1, duration: 0.2 }, "<+=0.12")
          .to(icone, { scale: 1.08, duration: 0.3 }, "<-=0.1");

        // Chaque carte rejoint la zone par son propre trajet : départ décalé,
        // durée légèrement différente, et une courbe à elle — l'abscisse et
        // l'ordonnée n'ont pas la même accélération, ce qui arrondit le
        // chemin au lieu de le laisser rectiligne.
        const COURBES = ["power1.inOut", "power2.inOut", "power3.inOut"];
        cartes.forEach((c, i) => {
          const depart = `glisse+=${(0.06 + retardDe(i)).toFixed(2)}`;
          const duree = 0.78 + (2 - i) * 0.035;
          tl.to(
            c,
            { x: surZone(i).x, duration: duree, ease: "power2.inOut" },
            depart,
          )
            .to(
              c,
              { y: surZone(i).y, duration: duree, ease: COURBES[i] },
              depart,
            )
            .to(
              c,
              {
                rotate: PILE[i].r * 0.35 + [3, -2, 0][i],
                duration: duree,
                ease: "power1.inOut",
              },
              depart,
            );
        });

        /* ---- 4. On lâche : rebond puis absorption ---- */
        tl.addLabel("lache")
          .to(curseur, { scale: 0.84, duration: 0.07, ease: "power3.in" })
          .to(curseur, { scale: 1, duration: 0.14, ease: "power2.out" })
          .to(
            cartes,
            { y: "+=12", duration: 0.16, ease: "power2.in" },
            "<-=0.05",
          )
          // l'appareil encaisse le dépôt
          .to(groupe, { scale: 1.012, duration: 0.12, ease: "power2.out" }, "<")
          .to(groupe, { scale: 0.998, duration: 0.16, ease: "power2.inOut" })
          .to(groupe, { scale: 1, duration: 0.2, ease: "power2.out" })
          .to(
            cartes,
            {
              y: "-=12",
              scale: 0,
              opacity: 0,
              rotate: 0,
              duration: 0.55,
              ease: "power3.inOut",
              stagger: 0.04,
            },
            "-=0.42",
          )
          .to(zone, { scale: 1, duration: 0.35 }, "-=0.4")

          /* ---- 5. La liste se remplit ---- */
          .to(repos, { opacity: 0, duration: 0.22 }, "-=0.3")
          .to(liste, { opacity: 1, duration: 0.22 }, "-=0.1")
          .to(lignes, {
            opacity: 1,
            x: 0,
            duration: 0.3,
            ease: "power2.out",
            stagger: 0.08,
          })

          /* ---- 6. Le curseur descend sur « Transférer vos fichiers » ----
             Il ne se téléporte jamais : le trajet est continu depuis la
             zone de dépôt. */
          .to(
            curseur,
            {
              ...(() => {
                const c = centreDe(envoyer);
                return { x: c.x - 44, y: c.y + 2 };
              })(),
              duration: 0.52,
              ease: "power3.inOut",
            },
            "-=0.22",
          );

        clic(envoyer);

        /* ---- 7. La liste s'efface, l'anneau tourne ----
           Le curseur s'écarte du bouton et attend, toujours à l'écran. */
        tl.to(liste, { opacity: 0, duration: 0.24 })
          .to(
            curseur,
            {
              x: zoneC.x + 180,
              y: zoneC.y + 150,
              duration: 0.7,
              ease: "power2.inOut",
            },
            "<",
          )
          .fromTo(
            progres,
            { opacity: 0, scale: 0.86 },
            { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.5)" },
            "<+=0.1",
          )
          .to(avance, {
            val: 27,
            duration: 0.42,
            ease: "power2.out",
            onUpdate: majAnneau,
          })
          .to({}, { duration: 0.12 })
          .to(avance, {
            val: 48,
            duration: 0.32,
            ease: "power2.out",
            onUpdate: majAnneau,
          })
          .to({}, { duration: 0.1 })
          .to(avance, {
            val: 100,
            duration: 0.55,
            ease: "power2.inOut",
            onUpdate: majAnneau,
          })
          .to({}, { duration: 0.28 })

          /* ---- 8. Les fichiers sont prêts ---- */
          .to(progres, {
            opacity: 0,
            scale: 0.88,
            duration: 0.26,
            ease: "power2.inOut",
          })
          .to(fini, { opacity: 1, duration: 0.26 })
          .to(
            finiBtn,
            { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.6)" },
            "-=0.1",
          )

          /* ---- 9. Le curseur remonte sur « Télécharger » ---- */
          .to(
            curseur,
            {
              ...(() => {
                const c = centreDe(finiBtn);
                return { x: c.x - 34, y: c.y + 4 };
              })(),
              duration: 0.5,
              ease: "power3.inOut",
            },
            "-=0.2",
          );

        clic(finiBtn);

        /* ---- 10. Les visuels jaillissent en tourbillon ---- */
        tl.to(fini, { opacity: 0, duration: 0.26 }, "+=0.12")
          // le curseur s'écarte du bouton, toujours à l'écran
          .to(
            curseur,
            {
              x: DESIGN_W - 90,
              y: DESIGN_H - 70,
              duration: 0.7,
              ease: "power2.inOut",
            },
            "<",
          )
          .set(idleTxt, { opacity: 1 }, "<")
          .set(idleDrag, { opacity: 0 }, "<")
          .set(icone, { scale: 1 }, "<")
          .to(repos, { opacity: 1, duration: 0.3 }, "<+=0.1")
          .addLabel("tourbillon");

        // Chaque visuel part du centre, s'écarte en spirale et se pose.
        VISUELS.forEach((v, i) => {
          const el = visuels[i];
          const dist = Math.hypot(v.x - cx, v.y - cy);
          const angleFin = Math.atan2(v.y - cy, v.x - cx);
          const sortie = { p: 0 };

          tl.to(
            sortie,
            {
              p: 1,
              duration: 1,
              ease: "power2.out",
              onStart: () => gsap.set(el, { opacity: 1 }),
              onUpdate: () => {
                const p = sortie.p;
                const rayon = dist * p;
                const angle =
                  v.depart + v.tours * (1 - p) * (1 - p) + angleFin * p * p;
                const melange = p * p * p;
                const sx = cx + Math.cos(angle) * rayon;
                const sy = cy + Math.sin(angle) * rayon;
                gsap.set(el, {
                  x: sx * (1 - melange) + v.x * melange,
                  y: sy * (1 - melange) + v.y * melange,
                  scale: 0.05 + p * 0.95,
                  rotate: v.rot * p,
                });
              },
            },
            `tourbillon+=${i * 0.09}`,
          );
        });

        tl.to({}, { duration: 0.55 });

        /* ---- 11. Retour au centre ---- */
        tl.addLabel("retour").to(
          curseur,
          {
            x: 1188,
            y: 40,
            duration: 1.1,
            ease: "power2.inOut",
          },
          "retour",
        );

        VISUELS.forEach((v, i) => {
          const el = visuels[i];
          const dist = Math.hypot(v.x - cx, v.y - cy);
          const angleFin = Math.atan2(v.y - cy, v.x - cx);
          const retour = { p: 0 };

          tl.to(
            retour,
            {
              p: 1,
              duration: 0.95,
              ease: "power2.in",
              onUpdate: () => {
                const p = retour.p;
                const rayon = dist * (1 - p);
                const angle = angleFin + v.tours * p * p;
                const melange = p * p * p;
                const sx = cx + Math.cos(angle) * rayon;
                const sy = cy + Math.sin(angle) * rayon;
                gsap.set(el, {
                  x: v.x * (1 - melange) + sx * melange,
                  y: v.y * (1 - melange) + sy * melange,
                  scale: Math.max(0.05, 1 - p * 0.95),
                  rotate: v.rot * (1 - p),
                });
              },
              onComplete: () => gsap.set(el, { opacity: 0 }),
            },
            `retour+=${i * 0.07}`,
          );
        });

        // L'appareil encaisse le retour des visuels, comme au moment du dépôt.
        tl.to(
          groupe,
          { scale: 1.012, duration: 0.12, ease: "power2.out" },
          "retour+=0.95",
        )
          .to(groupe, { scale: 0.998, duration: 0.16, ease: "power2.inOut" })
          .to(groupe, { scale: 1, duration: 0.2, ease: "power2.out" });

        tl.to({}, { duration: 0.3 });
      }, stage);

      // On ne lance qu'à l'entrée dans l'écran.
      io = new IntersectionObserver(
        (entrees) => {
          entrees.forEach((e) => {
            if (e.isIntersecting) tl.play();
            else tl.pause();
          });
        },
        { threshold: 0.3 },
      );
      io.observe(stage);
    });

    return () => {
      annule = true;
      if (io) io.disconnect();
      if (tl) tl.kill();
      if (ctx) ctx.revert();
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
        {/* Appareil et interface : il masque les visuels du final */}
        <div className={s.group} data-group>
          <img
            className={s.device}
            src="/lp/home/ipad-panneau-vide.png"
            alt="Interface Newbi : envoi d'un transfert de fichiers volumineux"
            width={2400}
            height={1286}
          />

          <div className={s.panel}>
            <div className={s.layer}>
              {/* En-tête de la modale */}
              <div className={s.head}>
                <Upload />
                <span className={s.headTitle}>Nouveau transfert</span>
                <span className={s.close}>
                  <Close />
                </span>
              </div>

              <div className={s.cols}>
                {/* Colonne gauche : dépôt des fichiers */}
                <div className={s.colLeft}>
                  <div className={s.drop} data-drop>
                    {/* État de repos */}
                    <div className={s.dropIdle} data-idle>
                      <span className={s.dropIcon} data-drop-icon>
                        <FileUp />
                      </span>
                      <p className={s.dropTitle}>
                        <span data-idle-txt>
                          Glissez-déposez vos fichiers ou cliquez pour
                          sélectionner
                        </span>
                        <span className={s.dropTitleDrag} data-idle-drag>
                          Déposez vos fichiers ici
                        </span>
                      </p>
                      <p className={s.dropSub}>
                        Jusqu'à 50 Go par transfert selon votre offre • Tous
                        formats acceptés
                      </p>
                      <div className={s.dropMeta}>
                        <span>Tous les fichiers</span>
                        <span>∙</span>
                        <span>Nombre de fichiers illimité</span>
                      </div>
                    </div>

                    {/* Les fichiers déposés */}
                    <div className={s.dropList} data-list>
                      <div className={s.listHead}>
                        <b>3 fichiers sélectionnés</b>
                        <span>10,1 Mo</span>
                      </div>

                      <div className={s.listRows}>
                        {FICHIERS.map((f) => (
                          <div className={s.fRow} key={f.nom} data-f-row>
                            <img className={s.fThumb} src={f.src} alt="" />
                            <div className={s.fMain}>
                              <div className={s.fName}>{f.nom}</div>
                              <div className={s.fSize}>{f.taille}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className={s.listFoot}>
                        <Lock size={9} />
                        Chiffré de bout en bout pendant le transfert
                      </div>
                    </div>

                    {/* Transfert en cours */}
                    <div className={s.dropProgress} data-progress>
                      <svg
                        className={s.ring}
                        width="104"
                        height="104"
                        viewBox="0 0 90 90"
                      >
                        <circle
                          cx="45"
                          cy="45"
                          r="38"
                          fill="none"
                          stroke="#ECECEE"
                          strokeWidth="7"
                        />
                        <circle
                          data-ring
                          cx="45"
                          cy="45"
                          r="38"
                          fill="none"
                          stroke="#5A50FF"
                          strokeWidth="7"
                          strokeLinecap="round"
                          transform="rotate(-90 45 45)"
                        />
                        <text
                          data-pct
                          x="45"
                          y="46"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#5A50FF"
                          fontSize="17"
                          fontWeight="600"
                        >
                          0%
                        </text>
                      </svg>
                      <p className={s.ringLabel}>Transfert en cours…</p>
                      <p className={s.ringSub}>3 fichiers · 10,1 Mo</p>
                    </div>

                    {/* Fichiers prêts, côté destinataire */}
                    <div className={s.dropDone} data-done>
                      <span className={s.doneMark}>
                        <Download size={18} />
                      </span>
                      <p className={s.doneTitle}>Vos fichiers sont prêts</p>
                      <p className={s.doneSub}>3 fichiers · 10,1 Mo</p>
                      <span className={s.doneBtn} data-done-btn>
                        <Download size={11} />
                        Télécharger
                      </span>
                    </div>
                  </div>

                  <div className={s.secure}>
                    <span>
                      <Lock />
                      Chiffrement SSL
                    </span>
                    <span>
                      <Trash />
                      Suppression auto.
                    </span>
                    <span>
                      <LinkIcon />
                      Lien sécurisé
                    </span>
                  </div>
                </div>

                {/* Colonne droite : options d'envoi */}
                <div className={s.colRight}>
                  <p className={s.optTitle}>Options d&apos;envoi</p>

                  <div className={s.options}>
                    <div className={s.block}>
                      <div className={s.legend}>
                        <Clock />
                        Durée de validité
                      </div>
                      <div className={s.field}>
                        7 jours
                        <ChevronDown />
                      </div>
                    </div>

                    <div className={s.block}>
                      <div className={s.legend}>
                        <Mail />
                        Email du destinataire
                      </div>
                      <div className={`${s.field} ${s.fieldPlaceholder}`}>
                        email@exemple.com (optionnel)
                      </div>
                      <p className={s.help}>
                        Si renseigné, le destinataire recevra un email avec le
                        lien de téléchargement.
                      </p>
                    </div>

                    <div className={s.block}>
                      <div className={s.legend}>
                        <Bell />
                        Notifications
                      </div>
                      {TOGGLES.map((t) => (
                        <div className={s.toggleRow} key={t.label}>
                          <div className={s.toggleText}>
                            <div className={s.toggleLabel}>{t.label}</div>
                            <div className={s.toggleHelp}>{t.help}</div>
                          </div>
                          <span className={s.switch}>
                            <span className={s.knob} />
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className={s.block}>
                      <div className={s.legend}>
                        <Lock size={12} />
                        Protection
                      </div>
                      <div className={s.toggleRow}>
                        <div className={s.toggleText}>
                          <div className={s.toggleLabel}>
                            Protection par mot de passe
                          </div>
                          <div className={s.toggleHelp}>
                            Ajouter une couche de sécurité supplémentaire
                          </div>
                        </div>
                        <span className={s.switch}>
                          <span className={s.knob} />
                        </span>
                      </div>
                    </div>

                    <div className={s.block}>
                      <div className={s.legend}>
                        <Eye />
                        Prévisualisation
                      </div>
                      <div className={s.toggleRow}>
                        <div className={s.toggleText}>
                          <div className={s.toggleLabel}>
                            Autoriser la prévisualisation
                          </div>
                          <div className={s.toggleHelp}>
                            Permettre de visualiser les fichiers avant
                            téléchargement
                          </div>
                        </div>
                        <span className={`${s.switch} ${s.switchOn}`}>
                          <span className={s.knob} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pied : le bouton d'envoi, aligné à droite comme dans la modale */}
              <div className={s.foot}>
                <div className={s.footAction}>
                  <span className={s.btnPrimary} data-send>
                    Transférer vos fichiers
                    <span className={s.kbd}>
                      <Enter />
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visuels du final : ils jaillissent du centre puis y retournent */}
        <div className={s.reveal}>
          {VISUELS.map((v) => (
            <div
              className={s.revealImg}
              key={v.src + v.ext}
              data-reveal
              style={{
                width: v.w,
                height: v.h,
                marginLeft: -v.w / 2,
                marginTop: -v.h / 2,
              }}
            >
              <img src={v.src} alt="" />
              <span className={s.ext}>{v.ext}</span>
            </div>
          ))}
        </div>

        {/* Pile de visuels glissée depuis l'extérieur, et curseur : hors du
            panneau pour ne pas être rognés par son overflow. */}
        <div className={s.drag} data-drag>
          {FICHIERS.map((f) => (
            <div className={s.dragCard} key={f.nom} data-drag-card>
              <img src={f.src} alt="" />
            </div>
          ))}
        </div>

        <div className={s.cursor} data-cursor>
          <Pointer />
          <span className={s.ping} data-ping />
        </div>
      </div>
    </div>
  );
}
