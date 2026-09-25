import React from "react";
import s from "./hero-demo.module.css";
import { Chevron, Export, Filter, Search, Check } from "./icons";

// Troisième écran : le flux bancaire. C'est lui qui referme l'histoire —
// le virement du client arrive et se rapproche tout seul de la facture
// émise à l'écran précédent.
const CATS = {
  ventes: { bg: "#DBF3E3", color: "#1c7a4e", label: "Ventes" },
  marketing: { bg: "#FDE3EE", color: "#a13a68", label: "Marketing" },
  saas: { bg: "#DCEBFF", color: "#2c5fa8", label: "SaaS" },
  logiciels: { bg: "#DCEBFF", color: "#2c5fa8", label: "Logiciels" },
  cotisations: { bg: "#EBE6FD", color: "#5b46b8", label: "Cotisations" },
  telecom: { bg: "#FCEFD8", color: "#8a5a15", label: "Télécom" },
  abonnements: { bg: "#EBE6FD", color: "#5b46b8", label: "Abonnements" },
  banque: { bg: "#F1F1F3", color: "#52525b", label: "Frais bancaires" },
};

const ROWS = [
  {
    name: "Google Ads",
    logo: "google",
    amount: "-120,00 €",
    date: "22/09/2026",
    cat: "marketing",
    proof: 1,
  },
  {
    name: "OVHcloud",
    logo: "ovh",
    amount: "-21,12 €",
    date: "20/09/2026",
    cat: "saas",
    proof: 1,
  },
  {
    name: "Adobe",
    logo: "adobe",
    amount: "-71,88 €",
    date: "18/09/2026",
    cat: "logiciels",
    proof: 1,
  },
  {
    name: "Stripe",
    logo: "stripe",
    amount: "-34,20 €",
    date: "15/09/2026",
    cat: "banque",
    proof: null,
  },
  {
    name: "Figma",
    logo: "figma",
    amount: "-13,50 €",
    date: "12/09/2026",
    cat: "logiciels",
    proof: 1,
  },
  {
    name: "Slack",
    logo: "slack",
    amount: "-8,25 €",
    date: "11/09/2026",
    cat: "abonnements",
    proof: 1,
  },
  {
    name: "Orange",
    logo: "orange",
    amount: "-39,99 €",
    date: "10/09/2026",
    cat: "telecom",
    proof: 1,
  },
];

const TABS = [
  ["Toutes", 128, true],
  ["Régler le dernier mois", 6],
  ["À rapprocher", 4],
  ["Justificatif manquant", 12],
];

// Petit glyphe neutre pour la colonne « Source » (la connexion bancaire)
const SourceMark = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#17171a">
    <path d="M12 2c.6 4.4 5 8.8 9.4 9.4v1.2C17 13.2 12.6 17.6 12 22h-1.2C10.2 17.6 5.8 13.2 1.4 12.6v-1.2C5.8 10.8 10.2 6.4 10.8 2z" />
  </svg>
);

const Proof = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
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

export default function TransactionsView() {
  return (
    <>
      <div className={s.head}>
        <h3 className={s.balance} data-anim="balance">
          22 017,55 €
        </h3>
        <span className={s.btn}>
          Tous les comptes
          <Chevron />
        </span>
        <span className={s.btn}>
          <Export />
          Exporter
        </span>
      </div>

      <div className={s.toolbar}>
        <div className={s.search}>
          <Search />
          Recherchez par description, fournisseur…
        </div>
        <span className={`${s.btn} ${s.btnDashed}`}>Colonnes visibles</span>
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
            {label}{" "}
            <span
              className={s.count}
              data-anim={label === "À rapprocher" ? "count-match" : undefined}
            >
              {count}
            </span>
          </div>
        ))}
      </div>

      <div className={s.table}>
        <div className={`${s.trx} ${s.thead}`}>
          <div>
            <span className={s.box} />
          </div>
          <div className={s.th}>Transaction</div>
          <div className={s.th}>Montant</div>
          <div className={s.th}>Date</div>
          <div className={s.th}>Catégorie</div>
          <div className={s.th}>Source</div>
          <div className={s.th}>Justificatif</div>
          <div />
        </div>

        {/* Virement créé par l'animation : replié tant qu'il n'est pas arrivé */}
        <div className={`${s.trx} ${s.newRow}`} data-anim="new-trx">
          <div>
            <span className={s.box} />
          </div>
          <div className={s.trxName}>
            <img
              className={s.logoMark}
              src="/lp/home/logos/sweily-mark.svg"
              alt=""
              width={18}
              height={18}
            />
            Sweily
          </div>
          <div className={`${s.amount} ${s.credit}`}>+1 820,00 €</div>
          <div className={s.amount}>25/09/2026</div>
          <div>
            <Category cat="ventes" />
          </div>
          <div>
            <SourceMark />
          </div>
          <div>
            <span className={s.matchChip} data-anim="match-chip">
              <Check size={10} sw={2} />
              F-2026-0143
            </span>
          </div>
          <div className={s.actions}>
            <span className={s.dots}>···</span>
          </div>
        </div>

        {ROWS.map((r) => (
          <div className={s.trx} key={r.name + r.date}>
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
            <div
              className={`${s.amount} ${r.credit ? s.credit : s.debit}`.trim()}
            >
              {r.amount}
            </div>
            <div className={s.amount}>{r.date}</div>
            <div>
              <Category cat={r.cat} />
            </div>
            <div>
              <SourceMark />
            </div>
            <div className={s.proof}>
              {r.proof ? (
                <>
                  <Proof />
                  {r.proof}
                </>
              ) : (
                "–"
              )}
            </div>
            <div className={s.actions}>
              <span className={s.dots}>···</span>
            </div>
          </div>
        ))}
      </div>

      {/* Notification du rapprochement : elle apparaît quand le virement est
          rattaché à la facture émise à l'écran précédent */}
      <div className={s.toast} data-anim="bank-toast">
        <div className={s.toastCard}>
          <div>
            <div className={s.toastTitle}>Transaction rattachée</div>
            <div className={s.toastText}>Facture F-2026-0143</div>
          </div>
        </div>
      </div>

      <div className={s.tfoot}>
        <span>0 sur 128 ligne(s) sélectionnée(s).</span>
        <div className={s.tfootRight}>
          <span>Lignes par page</span>
          <span className={s.select}>
            20 <Chevron />
          </span>
          <span>Page 1 sur 7</span>
        </div>
      </div>
    </>
  );
}
