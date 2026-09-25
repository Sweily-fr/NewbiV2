import React from "react";
import s from "./hero-demo.module.css";
import {
  Check,
  Clock,
  Chevron,
  Doc,
  Export,
  Filter,
  Gear,
  Import,
  Info,
  Mail,
  Plus,
  Search,
  Sort,
  Warning,
} from "./icons";

// Jeu de démo : clients variés (sociétés et particuliers), numérotation
// continue, échéances à 30 jours, statuts et suivi cohérents entre eux
// (brouillon → non envoyé, payée → ouverte).
const ROWS = [
  {
    client: "Atelier Boréal",
    ref: "F-2026-0142",
    amount: "3 450,00 €",
    issued: "22/09/2026",
    due: "22/10/2026",
    status: "wait",
    track: "Envoyé",
    mail: true,
  },
  {
    client: "Camille Moreau",
    ref: "F-2026-0141",
    amount: "990,00 €",
    issued: "18/09/2026",
    due: "18/10/2026",
    status: "wait",
    track: "Ouvert",
    mail: true,
  },
  {
    client: "Novacom Agency",
    ref: "F-2026-0139",
    amount: "7 200,00 €",
    issued: "10/09/2026",
    due: "10/10/2026",
    status: "done",
    track: "Ouvert",
    mail: true,
  },
  {
    client: "Le Comptoir Digital",
    ref: "F-2026-0138",
    amount: "1 400,34 €",
    issued: "05/09/2026",
    due: "05/10/2026",
    status: "done",
    track: "Ouvert",
    mail: true,
  },
  {
    client: "Greentech Solutions",
    ref: "F-2026-0137",
    amount: "4 820,00 €",
    issued: "12/08/2026",
    due: "11/09/2026",
    late: true,
    status: "wait",
    track: "Ouvert",
    mail: true,
  },
  {
    client: "Julien Petit",
    ref: "F-2026-0136",
    amount: "560,00 €",
    issued: "05/08/2026",
    due: "04/09/2026",
    status: "done",
    track: "Ouvert",
    mail: true,
  },
];

const STATUS = {
  wait: { cls: s.bWait, label: "En attente", Icon: Clock },
  done: { cls: s.bDone, label: "Terminée", Icon: Check },
  draft: { cls: s.bDraft, label: "Brouillon", Icon: Doc },
};

const TABS = [
  ["Toutes les factures", 38, true],
  ["Brouillons", 3],
  ["À encaisser", 6],
  ["En retard", 2],
  ["Terminées", 27],
  ["Avoirs", 2],
];

export default function InvoicesView() {
  return (
    <>
      <div className={s.head}>
        <h3 className={s.title}>Factures clients</h3>
        <span className={`${s.btn} ${s.btnIcon}`}>
          <Mail />
        </span>
        <span className={`${s.btn} ${s.btnIcon}`}>
          <Gear />
        </span>
        <span className={s.btn}>
          <Import />
          Importer
        </span>
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
              CA facturé <Info />
            </div>
            <div className={s.kpiVal}>
              <span data-anim="kpi-invoiced">128 450,00 €</span>
              <small>HT</small>
            </div>
          </div>
          <div className={s.kpi}>
            <div className={s.kpiLbl}>
              CA payé <Info />
            </div>
            <div className={s.kpiVal}>
              112 300,00 €<small>HT</small>
            </div>
          </div>
        </div>
        <div className={s.kpiGroup}>
          <div className={s.kpi}>
            <div className={s.kpiLbl}>
              Factures en retard <span className={s.pillRed}>2</span> <Info />
            </div>
            <div className={s.kpiVal}>
              9 640,00 €<small>HT</small>
            </div>
          </div>
        </div>
      </div>

      <div className={s.toolbar}>
        <div className={s.search}>
          <Search />
          Recherchez par numéro, client ou montant…
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
            {label}{" "}
            <span
              className={s.count}
              data-anim={
                label === "Toutes les factures"
                  ? "count-all"
                  : label === "Brouillons"
                    ? "count-drafts"
                    : undefined
              }
            >
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
            Client <Sort />
          </div>
          <div className={s.th}>
            Montant TTC <Sort />
          </div>
          <div className={s.th}>
            Date d'émission <Sort />
          </div>
          <div className={s.th}>
            Échéance <Sort />
          </div>
          <div className={s.th}>
            Statut <Sort />
          </div>
          <div className={s.th}>Suivi</div>
          <div className={s.th} style={{ justifyContent: "flex-end" }}>
            Actions
          </div>
        </div>

        {/* Ligne créée pendant l'animation : repliée tant que la facture
            n'a pas été générée depuis le tableau de projet */}
        <div className={`${s.tr} ${s.newRow}`} data-anim="new-row">
          <div>
            <span className={s.box} />
          </div>
          <div>
            <div className={s.cli}>Sweily</div>
            <div className={s.ref}>F-2026-0143</div>
          </div>
          <div className={s.amount}>1 820,00 €</div>
          <div className={s.amount}>24/09/2026</div>
          <div className={s.amount}>24/10/2026</div>
          <div>
            <span className={`${s.badge} ${s.bDraft}`} data-anim="new-status">
              <Doc />
              Brouillon
            </span>
          </div>
          <div>
            <span className={s.chip} data-anim="new-track">
              Non envoyé
            </span>
          </div>
          <div className={s.actions}>
            <span className={s.act} data-anim="send-btn">
              <Mail size={11} sw={1.7} />
            </span>
            <span className={s.act}>···</span>
          </div>
        </div>

        {ROWS.map((r) => {
          const { cls, label, Icon } = STATUS[r.status];
          return (
            <div className={s.tr} key={r.ref}>
              <div>
                <span className={s.box} />
              </div>
              <div>
                <div className={s.cli}>{r.client}</div>
                <div className={s.ref}>{r.ref}</div>
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
                <span className={`${s.badge} ${cls}`}>
                  <Icon />
                  {label}
                </span>
              </div>
              <div>
                <span
                  className={`${s.chip} ${r.track === "Ouvert" ? s.chipOpen : ""}`.trim()}
                >
                  {r.track}
                </span>
              </div>
              <div className={s.actions}>
                {r.mail && (
                  <span className={s.act}>
                    <Mail size={11} sw={1.7} />
                  </span>
                )}
                <span className={s.act}>···</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pile de notifications : la première annonce l'envoi, les deux
          autres se déplient derrière elle pendant l'animation */}
      {/* Pile de notifications. Celle du dessus annonce le virement reçu et
          porte l'action « Rattacher » : c'est son clic qui ouvre le flux
          bancaire à l'écran suivant. */}
      <div className={s.toast} data-anim="toast">
        <div className={`${s.toastCard} ${s.toastBack2}`} data-anim="toast-3">
          <span className={`${s.toastAv} ${s.avAmber}`}>T</span>
          <div>
            <div className={s.toastTitle}>Théo</div>
            <div className={s.toastText}>A déplacé une tâche</div>
          </div>
        </div>

        <div className={`${s.toastCard} ${s.toastBack}`} data-anim="toast-2">
          <img
            className={s.toastLogo}
            src="/lp/home/logos/sweily-mark.svg"
            alt=""
            width={24}
            height={20}
          />
          <div>
            <div className={s.toastTitle}>Sweily</div>
            <div className={s.toastText}>Facture F-2026-0143 reçue</div>
          </div>
        </div>

        <div className={s.toastCard} data-anim="toast-1">
          <img
            className={s.toastLogo}
            src="/lp/home/logos/sweily-mark.svg"
            alt=""
            width={24}
            height={20}
          />
          <div>
            <div className={s.toastTitle}>Virement reçu</div>
            <div className={s.toastText}>Sweily · +1 820,00 €</div>
          </div>
          <span className={s.toastAction} data-anim="attach-btn">
            Rattacher
          </span>
        </div>

        <span className={s.toastBadge} data-anim="toast-badge">
          3
        </span>
      </div>

      <div className={s.tfoot}>
        <span>
          0 sur <span data-anim="count-foot">38</span> ligne(s) sélectionnée(s).
        </span>
        <div className={s.tfootRight}>
          <span>Lignes par page</span>
          <span className={s.select}>
            50 <Chevron />
          </span>
          <span>Page 1 sur 1</span>
        </div>
      </div>
    </>
  );
}
