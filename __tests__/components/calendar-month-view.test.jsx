import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Fichier .js avec du JSX (illisible par l'outil de test), importé par la
// fenêtre d'événement via l'index des composants du calendrier
vi.mock("@/src/hooks/useAssignedMembersInfo", () => ({
  useAssignedMembersInfo: () => ({ members: [], loading: false }),
}));

import { MonthView } from "@/app/dashboard/calendar/components/month-view";
import { CalendarDndProvider } from "@/app/dashboard/calendar/components/calendar-dnd-context";

/**
 * Calendrier, vue mois : semaine du lundi au dimanche ; un clic sur un jour
 * ouvre la création (et passe le jour au volet), sauf sans droit de créer.
 */

const NOVEMBER = new Date(2026, 10, 20, 12);

function renderMonth(props = {}) {
  return render(
    <CalendarDndProvider onEventUpdate={() => {}}>
      <MonthView
        currentDate={NOVEMBER}
        events={[]}
        onEventSelect={() => {}}
        onEventCreate={() => {}}
        {...props}
      />
    </CalendarDndProvider>,
  );
}

describe("vue mois du calendrier", () => {
  it("commence la semaine le lundi", () => {
    const { container } = renderMonth();
    const header = container.querySelector(
      "[data-slot='month-view'] > div:first-child",
    );
    expect([...header.children].map((cell) => cell.textContent)).toEqual([
      "lun.",
      "mar.",
      "mer.",
      "jeu.",
      "ven.",
      "sam.",
      "dim.",
    ]);
  });

  it("un clic sur un jour ouvre la création et passe le jour au volet", () => {
    const onDaySelect = vi.fn();
    const onEventCreate = vi.fn();
    renderMonth({
      selectedDay: new Date(2026, 10, 20),
      onDaySelect,
      onEventCreate,
    });

    // Le jour choisi a un contour (s'il n'est pas aujourd'hui)
    const friday = screen.getByRole("button", {
      name: /^Ajouter un événement le vendredi 20 novembre/,
    });
    expect(friday.closest("div.group")).toHaveAttribute("data-selected");

    // Numéro (clavier compris) ou case : nouvel événement ce jour-là, à 9 h
    fireEvent.click(
      screen.getByRole("button", {
        name: /^Ajouter un événement le lundi 23 novembre/,
      }),
    );
    expect(onDaySelect).toHaveBeenCalledWith(new Date(2026, 10, 23));
    expect(onEventCreate).toHaveBeenCalledWith(new Date(2026, 10, 23, 9, 0, 0));
  });

  it("événement sur deux jours : une seule barre, sur deux colonnes", () => {
    renderMonth({
      events: [
        {
          id: "salon",
          title: "Salon des indépendants",
          start: new Date(2026, 10, 21, 9),
          end: new Date(2026, 10, 22, 18),
          allDay: false,
          color: "#D85A30",
        },
      ],
    });
    const titles = screen.getAllByText(/Salon des indépendants/);
    expect(titles).toHaveLength(1);
    const bar = titles[0].closest("div.absolute");
    expect(bar.style.left).toBe("calc(5 * 100% / 7)");
    expect(bar.style.width).toBe("calc(2 * 100% / 7)");
  });

  it("jours des mois voisins en gris, jour J en violet, jours du mois en blanc", () => {
    const now = new Date();
    const { container } = renderMonth({ currentDate: now });
    const cells = [...container.querySelectorAll("div.group")];
    const inMonth = (cell) => !cell.hasAttribute("data-outside-cell");
    const cellOf = (dayOfMonth) =>
      cells.find(
        (cell) =>
          inMonth(cell) &&
          cell.querySelector("button, div")?.textContent === String(dayOfMonth),
      );
    const today = cellOf(now.getDate());
    expect(today).toHaveAttribute("data-today");
    expect(today.className).toMatch(/bg-\[#5a50ff\]/);

    // Jours passés et à venir du mois : sans fond
    for (const offset of [-1, 1]) {
      const other = cellOf(now.getDate() + offset);
      if (other) expect(other.className).not.toMatch(/bg-muted|bg-\[#5a50ff\]/);
    }

    // Jours des mois voisins : affichés (numéro), sur fond gris
    for (const cell of cells.filter((c) => !inMonth(c))) {
      expect(cell.className).toMatch(/bg-muted/);
      expect(cell.textContent).toMatch(/^\d+/);
    }
  });

  it("sans volet : un clic sur une case crée un événement", () => {
    const onEventCreate = vi.fn();
    const { container } = renderMonth({ onEventCreate });
    const cells = container.querySelectorAll("div.group");
    // 1re case : lundi 26 octobre (jour du mois précédent, cliquable aussi)
    fireEvent.click(cells[0].firstChild);
    expect(onEventCreate).toHaveBeenCalledWith(new Date(2026, 9, 26, 9, 0, 0));
  });

  it("lecture seule : pas de création, le numéro choisit le jour du volet", () => {
    const onDaySelect = vi.fn();
    const onEventCreate = vi.fn();
    const { container } = renderMonth({
      canCreate: false,
      onDaySelect,
      onEventCreate,
    });
    expect(
      screen.queryAllByRole("button", { name: /Ajouter un événement/ }),
    ).toHaveLength(0);
    fireEvent.click(
      screen.getByRole("button", { name: "Voir le lundi 23 novembre" }),
    );
    expect(onDaySelect).toHaveBeenCalledWith(new Date(2026, 10, 23));
    fireEvent.click(container.querySelectorAll("div.group")[0].firstChild);
    expect(onEventCreate).not.toHaveBeenCalled();
  });

  it("lecture seule sans volet : les numéros ne sont pas des boutons", () => {
    const onEventCreate = vi.fn();
    const { container } = renderMonth({ canCreate: false, onEventCreate });
    expect(
      screen.queryAllByRole("button", {
        name: /^(Ajouter un événement|Voir) le/,
      }),
    ).toHaveLength(0);
    fireEvent.click(container.querySelectorAll("div.group")[0].firstChild);
    expect(onEventCreate).not.toHaveBeenCalled();
  });

  it("jour J : aria-current, libellé sans « aujourd'hui » (bouton de la barre)", () => {
    const now = new Date();
    renderMonth({ currentDate: now });
    expect(
      screen.queryAllByRole("button", { name: /aujourd'hui/i }),
    ).toHaveLength(0);
    const current = document.querySelector('[aria-current="date"]');
    expect(current).toHaveTextContent(String(now.getDate()));
    expect(current).toHaveAccessibleName(/^Ajouter un événement le /);
  });

  it("jours des mois voisins affichés, barres continues par-dessus", () => {
    renderMonth({
      selectedDay: new Date(2026, 10, 20),
      onDaySelect: () => {},
      events: [
        {
          id: "pont",
          title: "Pont de la Toussaint",
          start: new Date(2026, 9, 30, 9),
          end: new Date(2026, 10, 2, 18),
          allDay: false,
        },
      ],
    });
    // 26 octobre → 6 décembre : 6 semaines
    const days = screen.getAllByRole("button", {
      name: /^Ajouter un événement le/,
    });
    expect(days).toHaveLength(42);
    expect(days[0]).toHaveTextContent(/^26$/);
    // Barre du vendredi 30 octobre au dimanche 1er novembre, puis le lundi 2
    const [first, second] = screen
      .getAllByText(/Pont de la Toussaint/)
      .map((title) => title.closest("div.absolute"));
    expect(first.style.left).toBe("calc(4 * 100% / 7)");
    expect(first.style.width).toBe("calc(3 * 100% / 7)");
    expect(second.style.left).toBe("calc(0 * 100% / 7)");
    expect(second.style.width).toBe("calc(1 * 100% / 7)");
  });
});
