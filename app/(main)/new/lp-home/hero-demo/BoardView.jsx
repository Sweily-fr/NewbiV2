import React from "react";
import s from "./hero-demo.module.css";
import { Filter, Plus, Search } from "./icons";

// Tableau de projet : le même client que la vue facturation (Studio Marbre),
// pour que l'enchaînement des deux écrans raconte une seule histoire —
// le projet se termine, la facture part.
const COLUMNS = [
  {
    name: "À faire",
    dot: "#EF4444",
    bg: "#FEFAF9",
    pill: "#FDE9E7",
    cards: [
      "Maquettes des pages intérieures",
      "Rédiger les textes de la page d'accueil",
      "Choisir les photos du studio",
      "Brief SEO",
      "Bannières réseaux sociaux",
      "Mentions légales et CGV",
      "Configurer le nom de domaine",
      "Page « Nos réalisations »",
      "Formulaire de rappel",
      "Favicon et icônes",
      "Plan du site",
    ],
  },
  {
    name: "En cours",
    dot: "#F59E0B",
    bg: "#FFFCF7",
    pill: "#FCEFD8",
    cards: [
      "Refonte du site vitrine",
      "Intégration de la page contact",
      "Formulaire de devis en ligne",
      "Optimisation des images",
      "Version mobile du menu",
      "Fiches des trois services",
    ],
  },
  {
    name: "En attente",
    dot: "#8B5CF6",
    bg: "#FBFAFE",
    pill: "#EBE6FD",
    // carte dont le titre s'écrit pendant l'animation, en fin de colonne
    typeCard: "Préparer la mise en ligne",
    cards: [
      "Validation du logo par le client",
      "Accès à l'hébergement",
      "Retour du client sur les textes",
    ],
  },
  {
    name: "Terminées",
    dot: "#22C55E",
    bg: "#F8FCFA",
    pill: "#DDF3E4",
    cards: [
      "Atelier cadrage avec le client",
      "Charte graphique",
      "Arborescence du site",
      "Devis signé",
      "Réunion de lancement",
      "Moodboard validé",
      "Choix de la typographie",
      "Maquette de la page d'accueil",
      "Achat des visuels",
      "Rédaction du brief",
      "Sélection de l'hébergeur",
    ],
  },
];

export default function BoardView() {
  return (
    <>
      <div className={s.projectHead}>
        <img
          className={s.clientLogo}
          src="/lp/home/logos/sweily.png"
          alt="Sweily"
          width={104}
          height={34}
        />
      </div>

      <div className={s.views}>
        <div className={s.viewsRight}>
          <span className={`${s.btn} ${s.btnIcon}`}>
            <Search />
          </span>
          <span className={`${s.btn} ${s.btnIcon}`}>
            <Filter />
          </span>
          <span className={`${s.btn} ${s.btnPrimary}`}>
            <Plus />
            Ajouter une colonne
          </span>
        </div>
      </div>

      <div className={s.board} data-anim="board">
        {COLUMNS.map((col) => (
          <div
            key={col.name}
            className={s.column}
            style={{ background: col.bg }}
          >
            <div className={s.columnHead}>
              <span
                className={s.columnPill}
                style={{ background: col.pill, color: "#3f3f46" }}
              >
                <span className={s.dot} style={{ background: col.dot }} />
                {col.name}
              </span>
              <span
                className={s.columnCount}
                data-anim={
                  col.name === "En cours"
                    ? "count-from"
                    : col.name === "Terminées"
                      ? "count-to"
                      : col.name === "À faire"
                        ? "count-todo"
                        : col.name === "En attente"
                          ? "count-wait"
                          : undefined
                }
              >
                {col.cards.length}
              </span>
            </div>

            {col.cards.map((title, i) => (
              <div
                key={title}
                className={s.card}
                data-anim={
                  col.name === "En cours"
                    ? i === 0
                      ? "drag-card"
                      : "shift-up"
                    : col.name === "Terminées"
                      ? "shift-down"
                      : col.name === "À faire" && i === 0
                        ? "drag-card-2"
                        : undefined
                }
                data-group={
                  col.name === "À faire" && i > 0
                    ? "shift-up-2"
                    : col.name === "En attente"
                      ? "shift-down-2"
                      : undefined
                }
              >
                <div className={s.cardTitle}>{title}</div>
                {col.name === "En cours" && i === 0 && (
                  <div className={s.cardAction} data-anim="invoice-action">
                    <Plus size={10} sw={2} />
                    Facturer ce projet · 1 820 €
                  </div>
                )}
              </div>
            ))}

            {col.typeCard && (
              <div
                className={s.card}
                data-anim="type-card"
                data-group="shift-down-2"
                data-text={col.typeCard}
              >
                <div className={s.cardTitle}>
                  <span data-anim="type-text" />
                  <span className={s.caret} data-anim="caret" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
