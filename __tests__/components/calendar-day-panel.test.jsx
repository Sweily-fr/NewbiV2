import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";

import {
  CalendarDayPanel,
  DayPanelToggle,
} from "@/app/dashboard/calendar/components/calendar-day-panel";
import { buildUpcomingDays } from "@/src/utils/upcoming-days";
import { dateToDay } from "@/src/utils/recurrenceDays";

/**
 * Calendrier, vue mois : volet du jour choisi, à droite de la grille.
 * Mêmes lignes que l'agenda de l'accueil, réglés compris.
 */

const at = (date, hours = 0, minutes = 0) => {
  const copy = new Date(date);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
};

const today = new Date();
const day = dateToDay(today);

const entriesOf = (events = [], linkedItems = []) =>
  buildUpcomingDays({
    days: [day],
    events,
    linkedItems,
    includeDone: true,
  })[0].entries;

const events = [
  {
    id: "e1",
    title: "Point hebdo équipe",
    start: at(today, 9, 30),
    end: at(today, 10),
    allDay: false,
    color: "#7F77DD",
    location: "Visio",
  },
  {
    id: "e2",
    title: "Déclaration Urssaf",
    start: at(today),
    end: at(today, 23, 59),
    allDay: true,
    color: "#F59E0B",
    declarationKind: "URSSAF",
  },
];

const paidInvoice = {
  id: "INVOICE:1",
  kind: "INVOICE",
  entityId: "i1",
  day,
  title: "Facture F-12",
  state: "DONE",
  amount: 1200,
  currency: "EUR",
  counterparty: "Atelier Lumière",
};

describe("volet du jour du calendrier", () => {
  it("aujourd'hui : titre, journée entière d'abord, puis l'heure, réglés compris", () => {
    render(
      <CalendarDayPanel
        date={today}
        entries={entriesOf(events, [paidInvoice])}
        onOpen={() => {}}
      />,
    );
    const panel = screen.getByRole("complementary");
    expect(within(panel).getByRole("heading")).toHaveTextContent("Aujourd'hui");
    const rows = within(panel).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Déclaration Urssaf"),
      expect.stringContaining("Point hebdo équipe"),
      expect.stringContaining("Facture F-12"),
    ]);
    // Déclaration : lien de dépôt dans la ligne
    expect(
      within(rows[0]).getByRole("link", { name: /Déclarer/ }),
    ).toHaveAttribute(
      "href",
      "https://www.autoentrepreneur.urssaf.fr/portail/accueil.html",
    );
    expect(rows[1]).toHaveTextContent("Visio · 30 min");
  });

  it("un clic ouvre l'élément, « Ajouter ce jour-là » crée un événement", () => {
    const onOpen = vi.fn();
    const onCreate = vi.fn();
    const entries = entriesOf(events);
    render(
      <CalendarDayPanel
        date={today}
        entries={entries}
        onOpen={onOpen}
        onCreate={onCreate}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Point hebdo équipe/ }));
    expect(onOpen).toHaveBeenCalledWith(
      entries.find((entry) => entry.title === "Point hebdo équipe"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ajouter ce jour-là" }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("« Ensuite » : une ligne par jour suivant, un clic l'affiche", () => {
    const onSelectDay = vi.fn();
    const next = buildUpcomingDays({
      days: ["2026-11-21", "2026-11-23"],
      events: [
        {
          id: "s",
          title: "Salon des indépendants",
          start: new Date(2026, 10, 21),
          end: new Date(2026, 10, 21, 23, 59),
          allDay: true,
          color: "#D85A30",
        },
        {
          id: "l",
          title: "Lancement projet",
          start: new Date(2026, 10, 23, 9),
          end: new Date(2026, 10, 23, 10),
          allDay: false,
          color: "#378ADD",
        },
        {
          id: "b",
          title: "Banque",
          start: new Date(2026, 10, 23, 11),
          end: new Date(2026, 10, 23, 12),
          allDay: false,
          color: "#BA7517",
        },
      ],
    });
    render(
      <CalendarDayPanel
        date={today}
        entries={[]}
        nextDays={next}
        onOpen={() => {}}
        onSelectDay={onSelectDay}
      />,
    );
    const section = screen.getByRole("region", { name: "Les jours suivants" });
    const rows = within(section).getAllByRole("button");
    expect(rows.map((row) => row.textContent)).toEqual([
      "Sam. 21Salon des indépendants",
      "Lun. 2309:00Lancement projet+1",
    ]);
    fireEvent.click(rows[1]);
    expect(onSelectDay).toHaveBeenCalledWith("2026-11-23");
  });

  it("croix « Fermer le volet du jour » : la grille reprend la place", () => {
    const onHide = vi.fn();
    render(
      <CalendarDayPanel
        date={today}
        entries={[]}
        onOpen={() => {}}
        onHide={onHide}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Fermer le volet du jour" }),
    );
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("barre d'outils : un seul bouton ferme puis rouvre le volet", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <DayPanelToggle hidden={false} onToggle={onToggle} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Fermer le volet du jour" }),
    );
    expect(onToggle).toHaveBeenLastCalledWith(true);

    rerender(<DayPanelToggle hidden onToggle={onToggle} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Ouvrir le volet du jour" }),
    );
    expect(onToggle).toHaveBeenLastCalledWith(false);
  });

  it("autre jour sans rien : date en titre, message, pas d'ajout sans le droit", () => {
    const other = new Date(today.getFullYear(), 10, 11);
    render(<CalendarDayPanel date={other} entries={[]} onOpen={() => {}} />);
    const panel = screen.getByRole("complementary");
    if (dateToDay(other) !== day) {
      expect(within(panel).getByRole("heading")).toHaveTextContent(
        /^Mercredi 11 novembre|^\w+ 11 novembre/,
      );
    }
    expect(panel).toHaveTextContent("Jour férié : Armistice 1918");
    expect(panel).toHaveTextContent("Rien de prévu ce jour-là.");
    expect(
      screen.queryByRole("button", { name: "Ajouter ce jour-là" }),
    ).toBeNull();
  });
});
