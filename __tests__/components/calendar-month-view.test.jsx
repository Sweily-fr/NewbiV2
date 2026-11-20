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
 * Calendrier, vue mois : semaine du lundi au dimanche ; avec le volet du
 * jour, un clic choisit le jour et un double clic crée un événement.
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

  it("avec le volet : le numéro choisit le jour, le double clic crée", () => {
    const onDaySelect = vi.fn();
    const onEventCreate = vi.fn();
    renderMonth({
      selectedDay: new Date(2026, 10, 20),
      onDaySelect,
      onEventCreate,
    });

    const selected = screen.getByRole("button", {
      name: /^Voir le vendredi 20 novembre/,
    });
    expect(selected).toHaveAttribute("aria-pressed", "true");

    const monday = screen.getByRole("button", {
      name: /^Voir le lundi 23 novembre/,
    });
    expect(monday).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(monday);
    expect(onDaySelect).toHaveBeenCalledWith(new Date(2026, 10, 23));
    expect(onEventCreate).not.toHaveBeenCalled();

    // Double clic sur la case : nouvel événement ce jour-là, à 9 h
    fireEvent.doubleClick(monday);
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

  it("cases hors du mois en gris, jour J en violet, autres jours en blanc", () => {
    const now = new Date();
    const { container } = renderMonth({ currentDate: now });
    const cellOf = (dayOfMonth) =>
      [...container.querySelectorAll("div.group")].find(
        (cell) =>
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

    // Cases des mois voisins : vides et grisées
    const outside = container.querySelectorAll('[aria-hidden="true"].border-r');
    for (const cell of outside) {
      expect(cell.className).toMatch(/bg-muted/);
      expect(cell).toBeEmptyDOMElement();
    }
  });

  it("sans volet : un clic sur une case crée un événement", () => {
    const onEventCreate = vi.fn();
    const { container } = renderMonth({ onEventCreate });
    expect(screen.queryByRole("button", { name: /^Voir le/ })).toBeNull();
    const cells = container.querySelectorAll("div.group");
    // 1re case du mois : dimanche 1er novembre
    fireEvent.click(cells[0].firstChild);
    expect(onEventCreate).toHaveBeenCalledWith(new Date(2026, 10, 1, 9, 0, 0));
  });

  it("seuls les jours du mois : cases des mois voisins vides", () => {
    const { container } = renderMonth({
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
    const days = screen.getAllByRole("button", { name: /^Voir le/ });
    expect(days).toHaveLength(30);
    expect(days[0]).toHaveTextContent(/^1$/);
    // 6 cases vides avant le 1er (lundi 26 → samedi 31 octobre) et 6 après
    // le 30 (mardi 1er → dimanche 6 décembre)
    expect(
      container.querySelectorAll('[aria-hidden="true"].border-r'),
    ).toHaveLength(12);
    // Barre coupée au bord du mois : dimanche 1er (bout gauche à ras,
    // l'événement a commencé en octobre), puis lundi 2 sur la semaine
    // suivante
    const [first, second] = screen
      .getAllByText(/Pont de la Toussaint/)
      .map((title) => title.closest("div.absolute"));
    expect(first.style.left).toBe("calc(6 * 100% / 7)");
    expect(first.style.width).toBe("calc(1 * 100% / 7)");
    expect(second.style.left).toBe("calc(0 * 100% / 7)");
    expect(second.style.width).toBe("calc(1 * 100% / 7)");
  });
});
