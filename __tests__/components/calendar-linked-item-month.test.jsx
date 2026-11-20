import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { LinkedEventItem } from "@/app/dashboard/calendar/components/linked-event-item";
import { dateToDay } from "@/src/utils/recurrenceDays";

/**
 * Échéance dans une case du mois : ligne légère, point rouge en cas de
 * retard (pas de fond rouge), ce qui est passé ou réglé pâlit.
 */

const today = new Date();
const dayOffset = (days) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return dateToDay(date);
};

const invoice = (fields) => ({
  id: "INVOICE:1",
  kind: "INVOICE",
  entityId: "i1",
  day: dayOffset(3),
  title: "AMAZON",
  state: "UPCOMING",
  amount: 1200,
  currency: "EUR",
  ...fields,
});

const renderItem = (item) =>
  render(<LinkedEventItem item={item} view="month" onClick={() => {}} />);

describe("échéance dans la grille du mois", () => {
  it("en retard : point rouge, sans fond rouge, pas pâlie", () => {
    renderItem(invoice({ day: dayOffset(-5), state: "OVERDUE" }));
    const button = screen.getByRole("button");
    expect(button.querySelector(".bg-red-500")).not.toBeNull();
    expect(button.className).not.toMatch(/bg-red-500\/10/);
    expect(button.className).not.toMatch(/opacity-50/);
  });

  it("à venir : ni point ni pâleur ; passée ou réglée : pâlie", () => {
    const { unmount } = renderItem(invoice({}));
    let button = screen.getByRole("button");
    expect(button.querySelector(".bg-red-500")).toBeNull();
    expect(button.className).not.toMatch(/opacity-50/);
    unmount();

    renderItem(invoice({ day: dayOffset(-2), state: "DONE" }));
    button = screen.getByRole("button");
    expect(button.className).toMatch(/opacity-50/);
  });
});
