"use client";

import React from "react";
import s from "./signatures-demo.module.css";
import {
  Check,
  Chevron,
  Export,
  Filter,
  Plus,
  Search,
  Sort,
} from "@/app/(main)/new/lp-home/hero-demo/icons";

// Icônes de contact de l'aperçu : dessinées ici, le jeu de la démo n'en a pas.
const Phone = () => (
  <svg
    width="9"
    height="9"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  </svg>
);
const MailIcon = () => (
  <svg
    width="9"
    height="9"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);
const Globe = () => (
  <svg
    width="9"
    height="9"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20" />
  </svg>
);

// Interface du hero de la LP signatures : le mockup iPad sert de cadre et la
// liste des signatures est reconstruite en HTML dans le panneau. La scène a
// une taille de design fixe (1200 x 643) mise à l'échelle sur la largeur
// disponible. Pas d'animation à ce stade.
const DESIGN_W = 1200;
const DESIGN_H = 643;

// Portraits : de vraies personnes, dans une pastille violet pastel.
const ROWS = [
  {
    name: "Maëva Lambert",
    banner: {
      bg: "linear-gradient(115deg, #E9E6FF 0%, #DBD7FF 100%)",
      ink: "#2B2270",
      eyebrow: "Nouveau",
      title: "Notre portfolio 2026 est en ligne",
      text: "28 réalisations, 6 secteurs",
      cta: "Le découvrir",
    },
    mail: "maeva@agence-delabre.fr",
    photo: "/lp/avis/maeva.jpg",
    position: "50% 18%",
    group: "Direction",
    dot: "#5A50FF",
    active: true,
    primary: true,
    role: "Directrice artistique",
    phone: "06 12 48 90 21",
    site: "agence-delabre.fr",
  },
  {
    name: "Pedro Alves",
    banner: {
      bg: "linear-gradient(115deg, #FFEBD6 0%, #FFDFC0 100%)",
      ink: "#7A3E10",
      eyebrow: "Salon",
      title: "Retrouvez-nous à VivaTech",
      text: "11–14 juin · Paris Expo, stand B24",
      cta: "Prendre RDV",
    },
    role: "Responsable commercial",
    phone: "06 78 21 54 09",
    site: "agence-delabre.fr",
    mail: "pedro@agence-delabre.fr",
    photo: "/lp/avis/pedro-avatar.jpg",
    position: "50% 35%",
    group: "Commercial",
    dot: "#E8883A",
    active: true,
    primary: false,
  },
  {
    name: "Mustafa Yilmaz",
    banner: {
      bg: "linear-gradient(115deg, #FFEBD6 0%, #FFDFC0 100%)",
      ink: "#7A3E10",
      eyebrow: "Portes ouvertes",
      title: "L'atelier vous ouvre ses portes",
      text: "12 et 13 juin, de 10 h à 18 h",
      cta: "Je m'inscris",
    },
    role: "Chef d'atelier",
    phone: "06 44 09 71 33",
    site: "agence-delabre.fr",
    mail: "mustafa@agence-delabre.fr",
    photo: "/lp/factures/41682668-4F07-4D9F-B672-DC469853793A.PNG",
    position: "50% 20%",
    group: "Atelier",
    dot: "#2AA37A",
    active: true,
    primary: false,
  },
  {
    name: "Camille Moreau",
    banner: {
      bg: "linear-gradient(115deg, #FFE1EC 0%, #FFD1E1 100%)",
      ink: "#7A1F45",
      eyebrow: "Étude",
      title: "Baromètre du design produit 2026",
      text: "32 pages, données terrain",
      cta: "Télécharger",
    },
    role: "Designer produit",
    phone: "06 51 77 20 48",
    site: "agence-delabre.fr",
    mail: "camille@agence-delabre.fr",
    photo: "/lp/about/about-11.jpeg",
    position: "50% 25%",
    group: "Studio",
    dot: "#E8558A",
    active: false,
    primary: false,
  },
  {
    name: "Théo Bernard",
    banner: {
      bg: "linear-gradient(115deg, #FFEBD6 0%, #FFDFC0 100%)",
      ink: "#7A3E10",
      eyebrow: "Webinaire",
      title: "Réussir sa facturation électronique",
      text: "Jeudi 19 juin, 11 h · 45 min",
      cta: "Réserver",
    },
    role: "Chargé de clientèle",
    phone: "06 23 95 61 14",
    site: "agence-delabre.fr",
    mail: "theo@agence-delabre.fr",
    photo: "/lp/avis/pedro-avatar.jpg",
    position: "50% 35%",
    group: "Commercial",
    dot: "#E8883A",
    active: true,
    primary: false,
  },
  {
    name: "Aurore Lot",
    banner: {
      bg: "linear-gradient(115deg, #E9E6FF 0%, #DBD7FF 100%)",
      ink: "#2B2270",
      eyebrow: "Recrutement",
      title: "Nous cherchons un·e chef·fe de projet",
      text: "CDI, Bordeaux ou télétravail",
      cta: "Voir l'offre",
    },
    role: "Fondatrice",
    phone: "06 09 33 85 72",
    site: "agence-delabre.fr",
    mail: "aurore@agence-delabre.fr",
    photo: "/lp/avis/maeva.jpg",
    position: "50% 18%",
    group: "Direction",
    dot: "#5A50FF",
    active: false,
    primary: false,
  },
  {
    name: "Julien Petit",
    banner: {
      bg: "linear-gradient(115deg, #DDF3E4 0%, #C9EBD6 100%)",
      ink: "#11543A",
      eyebrow: "Savoir-faire",
      title: "Nos essences de bois françaises",
      text: "Chêne, frêne, noyer — circuit court",
      cta: "En savoir plus",
    },
    role: "Menuisier",
    phone: "06 62 18 40 95",
    site: "agence-delabre.fr",
    mail: "julien@agence-delabre.fr",
    photo: "/lp/factures/41682668-4F07-4D9F-B672-DC469853793A.PNG",
    position: "50% 20%",
    group: "Atelier",
    dot: "#2AA37A",
    active: true,
    primary: false,
  },
  {
    name: "Inès Fournier",
    banner: {
      bg: "linear-gradient(115deg, #FFE1EC 0%, #FFD1E1 100%)",
      ink: "#7A1F45",
      eyebrow: "Conférence",
      title: "Design & marque : notre intervention",
      text: "4 juillet · Nantes Créative",
      cta: "Réserver",
    },
    role: "Directrice de création",
    phone: "06 85 27 63 10",
    site: "agence-delabre.fr",
    mail: "ines@agence-delabre.fr",
    photo: "/lp/about/about-11.jpeg",
    position: "50% 25%",
    group: "Studio",
    dot: "#E8558A",
    active: true,
    primary: false,
  },
  {
    name: "Lucas Girard",
    banner: {
      bg: "linear-gradient(115deg, #DCEBFF 0%, #CBE0FF 100%)",
      ink: "#123A6B",
      eyebrow: "Offre",
      title: "Audit gratuit de votre facturation",
      text: "30 minutes, sans engagement",
      cta: "Réserver",
    },
    role: "Business developer",
    phone: "06 31 74 52 86",
    site: "agence-delabre.fr",
    mail: "lucas@agence-delabre.fr",
    photo: "/lp/avis/pedro-avatar.jpg",
    position: "50% 35%",
    group: "Commercial",
    dot: "#E8883A",
    active: false,
    primary: false,
  },
];

export default function SignaturesDemo({ className = "" }) {
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

  // Scénario : la surbrillance passe d'une ligne à l'autre, coche certaines
  // d'entre elles et ouvre l'aperçu de leur signature. En boucle.
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

    let cancelled = false;
    let ctx;
    let io;

    import("gsap").then(({ gsap }) => {
      if (cancelled) return;

      ctx = gsap.context(() => {
        const bande = stage.querySelector("[data-hover]");
        const apercu = stage.querySelector("[data-preview]");
        const lignes = [...stage.querySelectorAll("[data-row]")];
        const cases = [...stage.querySelectorAll("[data-check]")];
        const tableau = stage.querySelector("[data-table]");
        if (!bande || !apercu || !tableau) return;

        // Position d'une ligne dans le repère du tableau. On lit `offsetTop`
        // et non le rectangle écran : la scène est mise à l'échelle, et les
        // valeurs mesurées décalaient la bande d'un facteur d'échelle.
        const yDe = (i) => lignes[i].offsetTop;

        const remplir = (i) => {
          const r = ROWS[i];
          const set = (sel, valeur) => {
            const el = apercu.querySelector(sel);
            if (el) el.lastChild.textContent = valeur;
          };
          const photo = apercu.querySelector("[data-pv-photo]");
          if (photo) {
            photo.src = r.photo;
            photo.style.objectPosition = r.position;
          }
          const nom = apercu.querySelector("[data-pv-name]");
          if (nom) nom.textContent = r.name;
          const role = apercu.querySelector("[data-pv-role]");
          if (role) role.textContent = r.role;
          // bannière : sujet, détail et action changent avec la personne
          const poser = (sel, valeur) => {
            const el = apercu.querySelector(sel);
            if (el) el.textContent = valeur;
          };
          poser("[data-pv-eyebrow]", r.banner.eyebrow);
          poser("[data-pv-btitle]", r.banner.title);
          poser("[data-pv-btext]", r.banner.text);
          const cta = apercu.querySelector("[data-pv-bcta]");
          if (cta) cta.firstChild.textContent = r.banner.cta;
          const banniere = apercu.querySelector("[data-pv-banner]");
          if (banniere) {
            banniere.style.background = r.banner.bg;
            banniere.style.color = r.banner.ink;
          }

          set("[data-pv-phone]", r.phone);
          set("[data-pv-mail]", r.mail);
        };

        gsap.set(apercu, { opacity: 0, y: 10, scale: 0.98 });
        gsap.set(cases, { opacity: 0 });

        const tl = gsap.timeline({
          repeat: -1,
          repeatDelay: 0.8,
          paused: true,
        });

        // Première séquence : survol de la ligne 2, puis 3, que l'on coche
        tl.fromTo(
          bande,
          { opacity: 0, y: yDe(1) },
          { opacity: 1, duration: 0.3 },
        )
          .to(
            bande,
            { y: yDe(2), duration: 0.5, ease: "power2.inOut" },
            "+=0.5",
          )
          .to(cases[2], { opacity: 1, duration: 0.2 }, "+=0.35")
          .call(() => remplir(2))
          .fromTo(
            apercu,
            { opacity: 0, y: 10, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power2.out" },
          )
          .to({}, { duration: 2.4 })
          .to(apercu, { opacity: 0, y: 8, duration: 0.35, ease: "power2.in" })
          .to(cases[2], { opacity: 0, duration: 0.2 }, "<")

          // Deuxième séquence : la surbrillance descend vers une autre ligne
          .to(
            bande,
            { y: yDe(5), duration: 0.6, ease: "power2.inOut" },
            "+=0.2",
          )
          .to(cases[5], { opacity: 1, duration: 0.2 }, "+=0.35")
          .call(() => remplir(5))
          .fromTo(
            apercu,
            { opacity: 0, y: 10, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power2.out" },
          )
          .to({}, { duration: 2.4 })
          .to(apercu, { opacity: 0, y: 8, duration: 0.35, ease: "power2.in" })
          .to(cases[5], { opacity: 0, duration: 0.2 }, "<")
          .to(bande, { opacity: 0, duration: 0.3 });

        // La démo ne tourne que lorsqu'elle est à l'écran
        io = new IntersectionObserver(
          ([e]) => (e.isIntersecting ? tl.play() : tl.pause()),
          { threshold: 0.2 },
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
          src="/lp/signatures/ipad-panneau-vide.png"
          alt="Interface Newbi : signatures e-mail de l'équipe"
          width={2400}
          height={1286}
        />

        <div className={s.panel}>
          <div className={s.layer}>
            <div className={s.toolbar}>
              <div className={s.search}>
                <Search />
                Rechercher un collaborateur, un e-mail ou un groupe…
              </div>
              <span className={`${s.btn} ${s.btnDashed}`}>
                <Filter />
                Filtres
              </span>
              <div className={s.toolbarRight}>
                <span className={s.btn}>
                  <Export />
                  Exporter
                </span>
                <span className={`${s.btn} ${s.btnPrimary}`}>
                  <Plus />
                  Nouvelle signature
                </span>
              </div>
            </div>

            <div className={s.table} data-table>
              {/* Surbrillance qui simule le survol d'une ligne */}
              <div className={s.hover} data-hover />

              <div className={`${s.tr} ${s.thead}`}>
                <div>
                  <span className={s.box} />
                </div>
                <div className={s.th}>Actif</div>
                <div className={s.th}>
                  Nom <Sort />
                </div>
                <div className={s.th}>
                  E-mail <Sort />
                </div>
                <div className={s.th}>Groupe</div>
                <div className={s.th}>Signature principale</div>
              </div>

              {ROWS.map((r, i) => (
                <div className={s.tr} key={r.mail} data-row={i}>
                  <div>
                    <span className={s.boxWrap}>
                      <span className={s.box} />
                      <span
                        className={`${s.box} ${s.boxOn}`}
                        data-check={i}
                        style={{ opacity: 0 }}
                      />
                    </span>
                  </div>

                  <div>
                    <span
                      className={`${s.switch} ${r.active ? s.switchOn : ""}`.trim()}
                    >
                      <span className={s.knob} />
                    </span>
                  </div>

                  <div>
                    <div className={s.person}>
                      <span className={s.avatar}>
                        <img
                          src={r.photo}
                          alt=""
                          style={{ objectPosition: r.position }}
                        />
                      </span>
                      <span className={s.name}>{r.name}</span>
                    </div>
                  </div>

                  <div className={s.mail}>{r.mail}</div>

                  <div>
                    <span className={s.group}>
                      <span
                        className={s.groupDot}
                        style={{ backgroundColor: r.dot }}
                      />
                      {r.group}
                    </span>
                  </div>

                  <div>
                    {r.primary ? (
                      <span className={s.primary}>
                        <Check />
                        Principale
                      </span>
                    ) : (
                      <span className={s.dash}>—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={s.tfoot}>
              <span>1 sur 9 ligne(s) sélectionnée(s).</span>
              <div className={s.tfootRight}>
                <span>Lignes par page</span>
                <span className={s.select}>
                  25 <Chevron />
                </span>
                <span>Page 1 sur 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Aperçu de la signature de la ligne cochée */}
        <div className={s.preview} data-preview>
          <div className={s.pvField}>À :</div>
          <div className={s.pvField}>Objet :</div>

          <div className={s.pvBody}>
            <p className={s.pvRegards}>Bien cordialement,</p>

            <div className={s.pvSign}>
              <span className={s.pvAvatar}>
                <img src={ROWS[0].photo} alt="" data-pv-photo />
              </span>

              <div className={s.pvIdent}>
                <div className={s.pvName} data-pv-name>
                  {ROWS[0].name}
                </div>
                <div className={s.pvRole} data-pv-role>
                  {ROWS[0].role}
                </div>
                <img
                  className={s.pvLogo}
                  src="/newbiLetter.png"
                  alt="Agence Delabre"
                />
              </div>

              <div className={s.pvContact}>
                <span data-pv-phone>
                  <Phone />
                  {ROWS[0].phone}
                </span>
                <span data-pv-mail>
                  <MailIcon />
                  {ROWS[0].mail}
                </span>
                <span>
                  <Globe />
                  agence-delabre.fr
                </span>
              </div>
            </div>
          </div>

          {/* Bannière de signature : le sujet change avec la personne */}
          <div
            className={s.pvBanner}
            data-pv-banner
            style={{ background: ROWS[0].banner.bg, color: ROWS[0].banner.ink }}
          >
            <span className={s.pvGlow} data-pv-glow />
            <div>
              <div className={s.pvBannerEyebrow} data-pv-eyebrow>
                {ROWS[0].banner.eyebrow}
              </div>
              <div className={s.pvBannerTitle} data-pv-btitle>
                {ROWS[0].banner.title}
              </div>
              <div className={s.pvBannerText} data-pv-btext>
                {ROWS[0].banner.text}
              </div>
            </div>
            <span className={s.pvBannerCta} data-pv-bcta>
              {ROWS[0].banner.cta}
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
