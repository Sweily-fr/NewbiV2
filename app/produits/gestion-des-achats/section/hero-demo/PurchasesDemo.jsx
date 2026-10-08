"use client";

import React from "react";
import s from "./purchases-demo.module.css";
import {
  Check,
  Chevron,
  Clock,
  Doc,
  Export,
  Filter,
  Info,
  Plus,
  Search,
  Sort,
  Warning,
} from "@/app/(main)/new/lp-home/hero-demo/icons";

// Démo produit du hero de la LP achats. Même dispositif que celle de la LP
// home : le mockup iPad (image) sert de cadre, le panneau de droite est
// reconstruit en HTML pour pouvoir être animé, et la scène a une taille de
// design fixe (1200 x 643) mise à l'échelle sur la largeur disponible.
//
// Scénario, en boucle : le ticket monte par le bas du panneau, le faisceau
// le balaie, les champs lus se posent, le ticket file vers le tableau, la
// ligne « Leroy Merlin » se déplie avec son justificatif, les compteurs
// suivent et la notification confirme.
// Logo du fournisseur de la démo (SVG du domaine public, auto-hébergé)
const LEROY_LOGO = "/lp/achats/logos/leroy-merlin.svg";

const DESIGN_W = 1200;
const DESIGN_H = 643;

// Trombone : seule icône qui manque au jeu de la démo home.
const Clip = ({ size = 11, sw = 1.7 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.5 3.5 0 1 1 5 5l-8 8a2 2 0 0 1-3-3l7.5-7.5" />
  </svg>
);

const CATS = {
  Fournitures: { bg: "#EBE6FD", fg: "#5B46B8", glyph: "◆" },
  Logiciels: { bg: "#E0EDFF", fg: "#2563EB", glyph: "<>" },
  Loyer: { bg: "#FFE4E6", fg: "#BE123C", glyph: "⌂" },
  "Sous-traitance": { bg: "#EDE9FE", fg: "#6D28D9", glyph: "▤" },
  Télécom: { bg: "#DCFCE7", fg: "#15803D", glyph: "℡" },
  Abonnements: { bg: "#E0F2FE", fg: "#0369A1", glyph: "▭" },
};

const STATUS = {
  paid: { cls: s.bPaid, label: "Payée", Icon: Check },
  due: { cls: s.bDue, label: "À payer", Icon: Clock },
  todo: { cls: s.bTodo, label: "À traiter", Icon: Doc },
};

// Jeu de démo repris de l'écran « Factures d'achat » de l'app.
const ROWS = [
  {
    initials: "E",
    name: "evolizfr",
    amount: "13,30 €",
    issued: "24/06/2026",
    due: "—",
    cat: "Abonnements",
    status: "paid",
    proof: "1",
  },
  {
    initials: "MS",
    name: "Microsoft",
    amount: "72,04 €",
    issued: "10/06/2026",
    due: "10/07/2026",
    late: true,
    cat: "Logiciels",
    status: "due",
  },
  {
    initials: "GC",
    name: "Gerflor Coworking",
    amount: "687,82 €",
    issued: "10/06/2026",
    due: "10/07/2026",
    late: true,
    cat: "Loyer",
    status: "todo",
  },
  {
    initials: "OV",
    name: "OVHcloud",
    amount: "29,05 €",
    issued: "07/06/2026",
    due: "07/07/2026",
    cat: "Sous-traitance",
    status: "paid",
    proof: "1",
  },
  {
    initials: "FR",
    name: "Free",
    amount: "43,27 €",
    issued: "07/06/2026",
    due: "07/07/2026",
    cat: "Télécom",
    status: "paid",
    proof: "1",
  },
  {
    initials: "CC",
    name: "Cabinet Comptable Léa",
    amount: "170,20 €",
    issued: "02/06/2026",
    due: "02/07/2026",
    cat: "Sous-traitance",
    status: "paid",
    proof: "1",
  },
];

// Lignes de la facture scannée : désignation, quantité, PU, TVA, total HT
const DOC_LINES = [
  ["Peinture acrylique mate 10 L", "2", "13,54 €", "20 %", "27,08 €"],
  ["Tasseaux sapin 27 x 40 mm", "1", "137,42 €", "20 %", "137,42 €"],
  ["Visserie inox — lot de 200", "3", "14,31 €", "20 %", "42,92 €"],
];

const TABS = [
  ["Toutes", "80", true, "count-all"],
  ["À payer", "1", false, "count-due"],
  ["En retard", "10"],
  ["Payées", "68"],
];

function Row({ r }) {
  const cat = CATS[r.cat];
  const { cls, label, Icon } = STATUS[r.status];
  return (
    <div className={s.tr}>
      <div>
        <span className={s.box} />
      </div>
      <div>
        <div className={s.supplier}>
          <span className={s.avatar}>{r.initials}</span>
          <span className={s.name}>{r.name}</span>
        </div>
      </div>
      <div className={s.amount}>{r.amount}</div>
      <div className={s.amount}>{r.issued}</div>
      {r.late ? (
        <div className={s.late}>
          {r.due}
          <Warning />
        </div>
      ) : (
        <div className={s.amount}>{r.due}</div>
      )}
      <div>
        <div className={s.cat}>
          <span
            className={s.catDot}
            style={{ background: cat.bg, color: cat.fg }}
          >
            {cat.glyph}
          </span>
          <span className={s.catLbl}>{r.cat}</span>
        </div>
      </div>
      <div>
        <span className={`${s.badge} ${cls}`}>
          <Icon />
          {label}
        </span>
      </div>
      <div>
        {r.proof ? (
          <span className={s.proof}>
            <Clip />
            {r.proof}
          </span>
        ) : (
          <span className={s.dash}>-</span>
        )}
      </div>
      <div className={s.actions}>
        <span className={s.act}>···</span>
      </div>
    </div>
  );
}

export default function PurchasesDemo({ className = "" }) {
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

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // Mouvement réduit, ou petit écran : on montre l'interface d'emblée, sans
    // scénario. Sous `md`, la maquette est réduite au point que l'animation
    // n'est plus lisible — autant l'afficher telle quelle et ne pas charger
    // GSAP pour rien.
    const petitEcran = window.matchMedia("(max-width: 767px)").matches;
    if (
      petitEcran ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const ui = stage.querySelector('[data-anim="ui"]');
      if (ui) {
        ui.style.opacity = "1";
        ui.style.transform = "none";
      }
      return;
    }

    let cancelled = false;
    let ctx;
    let io;

    // GSAP est chargé à la demande : le hero s'affiche sans l'attendre.
    const stage_ = stage;
    import("gsap")
      .catch(() => {
        // Sans GSAP, on affiche l'interface telle quelle plutôt que rien.
        const ui = stage_.querySelector('[data-anim="ui"]');
        if (ui) {
          ui.style.opacity = "1";
          ui.style.transform = "none";
        }
        return null;
      })
      .then((mod) => {
        if (!mod) return;
        const { gsap } = mod;
        if (cancelled) return;

        ctx = gsap.context(() => {
          const q = (sel) => stage.querySelector(`[data-anim="${sel}"]`);
          const ui = q("ui");
          const ticket = q("ticket");
          const beam = q("beam");
          const pop1 = q("pop-1");
          const pop2 = q("pop-2");
          const fields = stage.querySelectorAll('[data-anim="tk-field"]');
          const newRow = q("new-row");
          const rowProof = q("row-proof");
          const toast = q("toast");
          const countAll = q("count-all");
          const countDue = q("count-due");
          const kpiDue = q("kpi-due");
          const countFoot = q("count-foot");

          // Le scénario ne se joue qu'une fois et s'arrête sur l'interface,
          // ligne créée et compteurs à jour.
          const tl = gsap.timeline({
            defaults: { ease: "power2.out" },
            paused: true,
          });

          // 1. Le ticket monte par le bas du panneau
          tl.fromTo(
            ticket,
            { opacity: 0, yPercent: 78, scale: 0.94 },
            { opacity: 1, yPercent: 0, scale: 1, duration: 0.75 },
          );

          // 2. Le faisceau le balaie de haut en bas
          tl.fromTo(
            beam,
            { opacity: 0, yPercent: -100 },
            { opacity: 1, duration: 0.15 },
            "+=0.15",
          )
            // Aller-retour complet : le faisceau descend jusqu'au bas de la
            // feuille, remonte, puis s'éteint. Les repères « bas » et « haut »
            // sont indispensables : positionner la remontée sur « la fin du
            // tween précédent » la faisait partir dès l'arrivée de la première
            // bulle, et la descente s'arrêtait au milieu du document.
            .to(beam, { yPercent: 430, duration: 1.3, ease: "none" }, "<")
            .addLabel("bas")
            .to(beam, { yPercent: 0, duration: 1.05, ease: "none" }, "bas")
            .addLabel("haut")
            .to(beam, { opacity: 0, duration: 0.2 }, "haut-=0.2")
            // Une bulle se pose à l'aller, l'autre au retour ; la première
            // reste affichée.
            .fromTo(
              pop1,
              { opacity: 0, x: -14, scale: 0.96 },
              { opacity: 1, x: 0, scale: 1, duration: 0.35 },
              "bas-=0.7",
            )
            .fromTo(
              pop2,
              { opacity: 0, x: 14, scale: 0.96 },
              { opacity: 1, x: 0, scale: 1, duration: 0.35 },
              "bas+=0.55",
            );

          // 3. Les montants lus se posent sur le document
          tl.fromTo(
            fields,
            { opacity: 0, y: 6 },
            { opacity: 1, y: 0, duration: 0.3, stagger: 0.12 },
            "haut-=0.45",
          );

          // 4. Le ticket file vers le tableau et s'efface
          tl.to(
            ticket,
            {
              opacity: 0,
              y: -120,
              scale: 0.82,
              duration: 0.55,
              ease: "power2.in",
            },
            "+=0.5",
          );

          // 5. L'interface monte à son tour par le bas du panneau
          tl.fromTo(
            ui,
            { opacity: 0, yPercent: 100 },
            { opacity: 1, yPercent: 0, duration: 0.7, ease: "power3.out" },
            "-=0.15",
          );

          // 6. La ligne se déplie, son justificatif apparaît
          tl.fromTo(
            newRow,
            {
              height: 0,
              opacity: 0,
              borderBottomColor: "rgba(242,242,244,0)",
            },
            {
              height: 44,
              opacity: 1,
              // Le filet du tableau revient une fois la ligne dépliée
              borderBottomColor: "rgba(242,242,244,1)",
              duration: 0.45,
              ease: "power2.inOut",
            },
            "-=0.05",
          )
            .fromTo(
              newRow,
              { backgroundColor: "rgba(90,80,255,0.12)" },
              { backgroundColor: "rgba(90,80,255,0)", duration: 1.1 },
              "<",
            )
            .fromTo(
              rowProof,
              { opacity: 0, x: 10 },
              { opacity: 1, x: 0, duration: 0.35 },
              "-=0.15",
            );

          // 7. Les compteurs suivent
          tl.call(
            () => {
              if (countAll) countAll.textContent = "81";
              if (countDue) countDue.textContent = "2";
              if (countFoot) countFoot.textContent = "81";
              if (kpiDue) kpiDue.textContent = "2 133,43 €";
            },
            null,
            "-=0.25",
          );

          // 8. La notification confirme, puis s'efface. L'interface reste à
          // l'écran, sur son état final.
          tl.fromTo(
            toast,
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.4 },
            "+=0.15",
          )
            .to({}, { duration: 2.6 })
            .to(toast, { opacity: 0, duration: 0.4 });

          // Le scénario démarre quand la démo entre à l'écran, et une seule
          // fois : l'observateur se débranche derrière lui.
          io = new IntersectionObserver(
            ([e]) => {
              if (!e.isIntersecting) return;
              tl.play();
              io.disconnect();
            },
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
        style={{ transform: `scale(${scale}) translateX(-50%)` }}
      >
        <div className={`${s.deviceGroup} ${s.uiIdle}`} data-anim="ui">
          <img
            className={s.device}
            src="/lp/home/ipad-panneau-vide.png"
            alt="Interface Newbi : factures d'achat, justificatifs scannés et catégorisés"
            width={2400}
            height={1286}
          />

          <div className={s.panel}>
            <div className={s.layer}>
              <div className={s.head}>
                {/* Titre de l'interface : un <div>, pas un titre de page — il
                  précède le premier H2 et fausserait la hiérarchie. */}
                <div className={s.title}>Factures d&apos;achat</div>
                <span className={s.btn}>
                  <Export />
                  Exporter
                </span>
                <span className={`${s.btn} ${s.btnPrimary}`}>
                  <Plus />
                  Nouvelle facture
                </span>
              </div>

              <div className={s.kpis}>
                <div className={s.kpiGroup}>
                  <div className={s.kpi}>
                    <div className={s.kpiLbl}>
                      Total à payer <Info />
                    </div>
                    <div className={s.kpiVal}>
                      <span data-anim="kpi-due">1 884,53 €</span>
                      <small>TTC</small>
                    </div>
                  </div>
                  <div className={s.kpi}>
                    <div className={s.kpiLbl}>
                      Payé ce mois <Info />
                    </div>
                    <div className={s.kpiVal}>
                      1 240,00 €<small>TTC</small>
                    </div>
                  </div>
                </div>
                <div className={s.kpiGroup}>
                  <div className={s.kpi}>
                    <div className={s.kpiLbl}>
                      Factures en retard <span className={s.pillRed}>10</span>{" "}
                      <Info />
                    </div>
                    <div className={s.kpiVal}>
                      1 812,49 €<small>TTC</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className={s.toolbar}>
                <div className={s.search}>
                  <Search />
                  Recherchez par fournisseur, n° facture ou montant…
                </div>
                <span className={`${s.btn} ${s.btnDashed}`}>
                  <Filter />
                  Filtres
                </span>
              </div>

              <div className={s.tabs}>
                {TABS.map(([label, count, active, anim]) => (
                  <div
                    key={label}
                    className={`${s.tab} ${active ? s.tabActive : ""}`.trim()}
                  >
                    {label}{" "}
                    <span className={s.count} data-anim={anim}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>

              <div className={s.table}>
                <div className={`${s.tr} ${s.thead}`}>
                  <div>
                    <span className={s.box} />
                  </div>
                  <div className={s.th}>
                    Fournisseur <Sort />
                  </div>
                  <div className={s.th}>
                    Montant TTC <Sort />
                  </div>
                  <div className={s.th}>
                    Date d&apos;émission <Sort />
                  </div>
                  <div className={s.th}>
                    Échéance <Sort />
                  </div>
                  <div className={s.th}>Catégorie</div>
                  <div className={s.th}>Statut</div>
                  <div className={s.th}>Justificatif</div>
                  <div
                    className={s.th}
                    style={{ justifyContent: "flex-end" }}
                  />
                </div>

                {/* Ligne créée par l'animation : repliée tant que le ticket
                  n'a pas été lu */}
                <div className={`${s.tr} ${s.newRow}`} data-anim="new-row">
                  <div>
                    <span className={s.box} />
                  </div>
                  <div>
                    <div className={s.supplier}>
                      <span className={`${s.avatar} ${s.avatarLogo}`}>
                        <img src={LEROY_LOGO} alt="" />
                      </span>
                      <span className={s.name}>Leroy Merlin</span>
                    </div>
                  </div>
                  <div className={s.amount}>248,90 €</div>
                  <div className={s.amount}>20/02/2026</div>
                  <div className={s.amount}>20/03/2026</div>
                  <div>
                    <div className={s.cat}>
                      <span
                        className={s.catDot}
                        style={{
                          background: CATS.Fournitures.bg,
                          color: CATS.Fournitures.fg,
                        }}
                      >
                        {CATS.Fournitures.glyph}
                      </span>
                      <span className={s.catLbl}>Fournitures</span>
                    </div>
                  </div>
                  <div>
                    <span className={`${s.badge} ${s.bDue}`}>
                      <Clock />À payer
                    </span>
                  </div>
                  <div>
                    <span className={s.proof} data-anim="row-proof">
                      <Clip />1
                    </span>
                  </div>
                  <div className={s.actions}>
                    <span className={s.act}>···</span>
                  </div>
                </div>

                {ROWS.map((r) => (
                  <Row key={r.name + r.amount} r={r} />
                ))}
              </div>

              <div className={s.tfoot}>
                <span>
                  0 sur <span data-anim="count-foot">80</span> ligne(s)
                  sélectionnée(s).
                </span>
                <div className={s.tfootRight}>
                  <span>Lignes par page</span>
                  <span className={s.select}>
                    25 <Chevron />
                  </span>
                  <span>Page 1 sur 4</span>
                </div>
              </div>

              {/* Notification de fin de scénario */}
              <div className={s.toast} data-anim="toast">
                <div className={s.toastCard}>
                  <span className={s.toastAv}>
                    <Clip size={13} />
                  </span>
                  <div>
                    <div className={s.toastTitle}>Justificatif rattaché</div>
                    <div className={s.toastText}>Leroy Merlin · 248,90 €</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* La facture fournisseur scannée, au-dessus du mockup */}
        <div className={s.scanZone} aria-hidden="true">
          <div className={s.doc} data-anim="ticket">
            <div className={s.docHead}>
              <div>
                <div className={s.docLogo}>LEROY MERLIN</div>
                <div className={s.docLogoSub}>Matériaux &amp; outillage</div>
              </div>
              <div className={s.docTitleCol}>
                <div className={s.docTitle}>Facture</div>
                <div className={s.docMetaRow}>
                  <span className={s.docMetaLbl}>Numéro de facture :</span>
                  <span>FA-2026-0218</span>
                </div>
                <div className={s.docMetaRow}>
                  <span className={s.docMetaLbl}>Date d&apos;émission :</span>
                  <span>20/02/2026</span>
                </div>
                <div className={s.docMetaRow}>
                  <span className={s.docMetaLbl}>Date d&apos;échéance :</span>
                  <span>20/03/2026</span>
                </div>
              </div>
            </div>

            <div className={s.docParties}>
              <div>
                <div className={s.docPartyName}>Leroy Merlin SA</div>
                <div className={s.docPartyLines}>
                  12 rue des Artisans
                  <br />
                  75011 Paris
                  <br />
                  SIREN : 318 429 551
                  <br />
                  N° TVA : FR42318429551
                </div>
              </div>
              <div />
              <div>
                <div className={s.docPartyName}>Aurore Lot</div>
                <div className={s.docPartyLines}>
                  8 allée des Peupliers
                  <br />
                  33000 Bordeaux
                  <br />
                  SIREN : 902 551 340
                </div>
              </div>
            </div>

            <div className={s.docTable}>
              <div className={s.docTh}>
                <span>Description</span>
                <span className={s.docRight}>Qté</span>
                <span className={s.docRight}>Prix unitaire</span>
                <span className={s.docRight}>TVA</span>
                <span className={s.docRight}>Total HT</span>
              </div>
              {DOC_LINES.map(([desc, qty, unit, tva, total]) => (
                <div className={s.docRow} key={desc}>
                  <span className={s.docDesc}>{desc}</span>
                  <span className={s.docRight}>{qty}</span>
                  <span className={s.docRight}>{unit}</span>
                  <span className={s.docRight}>{tva}</span>
                  <span className={s.docRight}>{total}</span>
                </div>
              ))}
            </div>

            <div className={s.docTotals}>
              <div className={s.docTotal} data-anim="tk-field">
                <span>Total HT</span>
                <span>207,42 €</span>
              </div>
              <div className={s.docTotal} data-anim="tk-field">
                <span>TVA 20 %</span>
                <span>41,48 €</span>
              </div>
              <div className={s.docGrand} data-anim="tk-field">
                <span>Total TTC</span>
                <span>248,90 €</span>
              </div>
            </div>

            <div className={s.docFoot}>
              Paiement à 30 jours à compter de la date d&apos;émission. En cas
              de retard, pénalités au taux d&apos;intérêt légal majoré et
              indemnité forfaitaire de recouvrement de 40 € (art. L441-10 du
              Code de commerce).
            </div>

            {/* Ce que l'OCR relève, de part et d'autre de la feuille */}
            <div className={`${s.pop} ${s.popLeft}`} data-anim="pop-1">
              <div className={s.popLbl}>
                <span className={s.popDot} />
                Fournisseur
              </div>
              <div className={s.popIdent}>
                <span className={s.popLogo}>
                  <img src={LEROY_LOGO} alt="" />
                </span>
                <div>
                  <div className={s.popVal} style={{ marginTop: 0 }}>
                    Leroy Merlin
                  </div>
                  <div className={s.popSub}>Catégorie · Fournitures</div>
                </div>
              </div>
            </div>

            <div className={`${s.pop} ${s.popRight}`} data-anim="pop-2">
              <div className={s.popLbl}>
                <span className={s.popDot} />
                Montant et TVA
              </div>
              <div className={s.popVal}>248,90 € TTC</div>
              <div className={s.popSub}>dont TVA 20 % · 41,48 €</div>
            </div>

            <span className={s.beamClip}>
              <span className={s.beam} data-anim="beam">
                <span className={s.beamEdge} />
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
