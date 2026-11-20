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

  it("sans volet : un clic sur une case crée un événement", () => {
    const onEventCreate = vi.fn();
    const { container } = renderMonth({ onEventCreate });
    expect(screen.queryByRole("button", { name: /^Voir le/ })).toBeNull();
    const cells = container.querySelectorAll("div.group");
    // 1re case : lundi 26 octobre (semaine du 1er novembre)
    fireEvent.click(cells[0].firstChild);
    expect(onEventCreate).toHaveBeenCalledWith(new Date(2026, 9, 26, 9, 0, 0));
  });
});
