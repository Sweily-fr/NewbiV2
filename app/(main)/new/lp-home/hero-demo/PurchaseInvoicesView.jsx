import React from "react";
import s from "./hero-demo.module.css";
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
} from "./icons";

/* Écran « Factures d'achat » : la contrepartie de la vue « Factures clients »
   du hero de la page d'accueil (même gabarit, mêmes composants, mêmes
   couleurs). C'est l'écran qui sert la facturation électronique côté
   réception : à partir du 1er septembre 2026, les factures fournisseurs
   arrivent au format électronique et atterrissent ici.

   Les logos sont ceux déjà utilisés par la vue « Transactions » du même
   hero : aucun nouvel asset n'est introduit. */

const CATS = {
  saas: { bg: "#DCEBFF", color: "#2c5fa8", label: "SaaS" },
  logiciels: { bg: "#DCEBFF", color: "#2c5fa8", label: "Logiciels" },
  telecom: { bg: "#FCEFD8", color: "#8a5a15", label: "Télécom" },
  abonnements: { bg: "#EBE6FD", color: "#5b46b8", label: "Abonnements" },
  banque: { bg: "#F1F1F3", color: "#52525b", label: "Frais bancaires" },
  loyer: { bg: "#FDE3EE", color: "#a13a68", label: "Loyer" },
  soustraitance: { bg: "#DBF3E3", color: "#1c7a4e", label: "Sous-traitance" },
};

const STATUS = {
  paid: { cls: s.bDone, label: "Payée", Icon: Check },
  topay: { cls: s.bWait, label: "À payer", Icon: Clock },
  todo: { cls: s.bDraft, label: "À traiter", Icon: Doc },
};

const ROWS = [
  {
    name: "OVHcloud",
    logo: "ovh",
    ref: "FR-2026-884120",
    amount: "29,05 €",
    issued: "07/06/2026",
    due: "07/07/2026",
    paid: "15/06/2026",
    cat: "saas",
    status: "paid",
    proof: 2,
  },
  {
    name: "Adobe",
    logo: "adobe",
    ref: "INV-2026-77341",
    amount: "71,88 €",
    issued: "10/06/2026",
    due: "10/07/2026",
    late: true,
    paid: "—",
    cat: "logiciels",
    status: "topay",
    proof: 1,
  },
  {
    name: "Orange",
    logo: "orange",
    ref: "FA-26-0914",
    amount: "43,27 €",
    issued: "07/06/2026",
    due: "07/07/2026",
    paid: "09/06/2026",
    cat: "telecom",
    status: "paid",
    proof: 1,
  },
  {
    name: "Figma",
    logo: "figma",
    ref: "FIG-2026-5520",
    amount: "13,50 €",
    issued: "06/06/2026",
    due: "06/07/2026",
    late: true,
    paid: "—",
    cat: "logiciels",
    status: "todo",
    proof: null,
  },
  {
    name: "Google",
    logo: "google",
    ref: "GW-2026-31807",
    amount: "16,50 €",
    issued: "05/06/2026",
    due: "05/07/2026",
    paid: "24/06/2026",
    cat: "abonnements",
    status: "paid",
    proof: 1,
  },
  {
    name: "Slack",
    logo: "slack",
    ref: "SLK-2026-2214",
    amount: "8,25 €",
    issued: "04/06/2026",
    due: "04/07/2026",
    paid: "04/06/2026",
    cat: "abonnements",
    status: "paid",
    proof: 1,
  },
  {
    name: "Stripe",
    logo: "stripe",
    ref: "ST-2026-66018",
    amount: "34,20 €",
    issued: "03/06/2026",
    due: "03/07/2026",
    paid: "03/06/2026",
    cat: "banque",
    status: "paid",
    proof: 1,
  },
];

const TABS = [
  ["Toutes", 80, true],
  ["À payer", 1],
  ["En retard", 10],
  ["Payées", 68],
];

/* Même glyphe de justificatif que la vue « Transactions ». */
const Proof = ({ size = 11, sw = 1.7 }) => (
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
    <path d="M3 8h18l-2 11H5z" />
    <path d="M9 8 12 3l3 5" />
  </svg>
);

function Category({ cat }) {
  const c = CATS[cat];
  return (
    <span className={s.cat}>
      <span className={s.catDot} style={{ background: c.bg, color: c.color }}>
        •
      </span>
      {c.label}
    </span>
  );
}

export default function PurchaseInvoicesView() {
  return (
    <>
      <div className={s.head}>
        <h3 className={s.title}>Factures d&apos;achat</h3>
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
              1 884,53 €<small>TTC</small>
            </div>
          </div>
          <div className={s.kpi}>
            <div className={s.kpiLbl}>
              Payé ce mois <Info />
            </div>
            <div className={s.kpiVal}>
              1 221,40 €<small>TTC</small>
            </div>
          </div>
        </div>
        <div className={s.kpiGroup}>
          <div className={s.kpi}>
            <div className={s.kpiLbl}>
              Factures en retard <span className={s.pillRed}>10</span> <Info />
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
        {TABS.map(([label, count, active]) => (
          <div
            key={label}
            className={`${s.tab} ${active ? s.tabActive : ""}`.trim()}
          >
            {label} <span className={s.count}>{count}</span>
          </div>
        ))}
      </div>

      <div className={s.table}>
        <div className={`${s.pur} ${s.thead}`}>
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
            Date d&apos;échéance <Sort />
          </div>
          <div className={s.th}>Date de paiement</div>
          <div className={s.th}>Catégorie</div>
          <div className={s.th}>Statut</div>
          <div className={s.th}>Justificatif</div>
          <div />
        </div>

        {ROWS.map((r) => {
          const { cls, label, Icon } = STATUS[r.status];
          return (
            <div className={s.pur} key={r.ref}>
              <div>
                <span className={s.box} />
              </div>
              <div className={s.trxName}>
                <img
                  className={s.logoMark}
                  src={`/lp/home/logos/${r.logo}.svg`}
                  alt=""
                  width={18}
                  height={18}
                />
                {r.name}
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
              <div className={s.amount}>{r.paid}</div>
              <div>
                <Category cat={r.cat} />
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
                    <Proof />
                    {r.proof}
                  </span>
                ) : (
                  <span className={s.dots}>—</span>
                )}
              </div>
              <div className={s.actions}>
                <span className={s.dots}>···</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={s.tfoot}>
        <span>0 sur 80 ligne(s) sélectionnée(s).</span>
        <div className={s.tfootRight}>
          <span>Lignes par page</span>
          <span className={s.select}>
            25 <Chevron />
          </span>
          <span>Page 1 sur 4</span>
        </div>
      </div>
    </>
  );
}
