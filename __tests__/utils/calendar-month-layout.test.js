import { describe, it, expect } from "vitest";

import {
  fitWeek,
  lastDayOf,
  layoutWeekBars,
  spansSeveralDays,
} from "@/src/utils/calendar-month-layout";

/**
 * Vue mois : barres d'un seul tenant pour les événements sur plusieurs
 * jours, couloirs gardés d'un jour à l'autre, place laissée à « + N ».
 */

const at = (day, time = "00:00") => new Date(`${day}T${time}:00`);
// Semaine du lundi 16 au dimanche 22 novembre 2026
const WEEK = Array.from(
  { length: 7 },
  (_, index) => new Date(2026, 10, 16 + index),
);
const event = (id, start, end, extra = {}) => ({
  id,
  title: id,
  start,
  end,
  allDay: false,
  ...extra,
});

describe("dernier jour d'un événement", () => {
  it("une fin pile à minuit appartient à la veille", () => {
    expect(lastDayOf(event("a", at("2026-11-20"), at("2026-11-26")))).toBe(
      "2026-11-25",
    );
    expect(
      lastDayOf(event("b", at("2026-11-20", "22:00"), at("2026-11-21"))),
    ).toBe("2026-11-20");
  });

  it("journée entière sur un jour : pas de barre ; sur deux jours : barre", () => {
    const oneDay = event("c", at("2026-11-20"), at("2026-11-20", "23:59"), {
      allDay: true,
    });
    const twoDays = event("d", at("2026-11-21"), at("2026-11-22", "23:59"), {
      allDay: true,
    });
    expect(spansSeveralDays(oneDay)).toBe(false);
    expect(spansSeveralDays(twoDays)).toBe(true);
  });
});

describe("barres d'une semaine", () => {
  it("couloir gardé : une barre ne change pas de ligne d'un jour à l'autre", () => {
    const { bars, laneCount } = layoutWeekBars(WEEK, [
      // lundi → mercredi, puis mardi → jeudi : deux couloirs
      event("A", at("2026-11-16"), at("2026-11-18", "18:00")),
      event("B", at("2026-11-17"), at("2026-11-19", "18:00")),
      // vendredi → samedi : réutilise le premier couloir
      event("C", at("2026-11-20"), at("2026-11-21", "12:00")),
    ]);
    expect(laneCount).toBe(2);
    expect(
      bars.map(({ event: e, lane, from, to }) => [e.id, lane, from, to]),
    ).toEqual([
      ["A", 0, 0, 2],
      ["B", 1, 1, 3],
      ["C", 0, 4, 5],
    ]);
  });

  it("débordement sur les semaines voisines : bouts non arrondis", () => {
    const { bars } = layoutWeekBars(WEEK, [
      event("long", at("2026-11-12"), at("2026-11-26")),
    ]);
    expect(bars[0]).toMatchObject({
      from: 0,
      to: 6,
      startsHere: false,
      endsHere: false,
    });
  });

  it("les éléments d'un seul jour ne sont pas des barres", () => {
    const { bars } = layoutWeekBars(WEEK, [
      event("rdv", at("2026-11-18", "09:00"), at("2026-11-18", "10:00")),
      { ...event("facture", at("2026-11-18"), at("2026-11-18")), allDay: true },
    ]);
    expect(bars).toHaveLength(0);
  });
});

describe("ce qui tient dans les cases", () => {
  const layout = layoutWeekBars(WEEK, [
    event("Salon", at("2026-11-21"), at("2026-11-22", "18:00")),
  ]);
  const empty = () => Array.from({ length: 7 }, () => []);

  it("tout tient : barre dessinée, case vide sans couloir réservé", () => {
    const singles = empty();
    singles[4] = ["rdv"];
    const { barLanes, cells } = fitWeek({
      layout,
      singlesByColumn: singles,
      capacity: 3,
    });
    expect(barLanes).toBe(1);
    expect(cells[5].laneSlots).toHaveLength(1);
    expect(cells[4].laneSlots).toHaveLength(0);
    expect(cells[4].singles).toEqual(["rdv"]);
    expect(cells.every((cell) => cell.hiddenCount === 0)).toBe(true);
  });

  it("case pleine : une ligne laissée à « + N », la barre reste", () => {
    const singles = empty();
    singles[5] = ["a", "b", "c"];
    const { barLanes, cells } = fitWeek({
      layout,
      singlesByColumn: singles,
      capacity: 3,
    });
    expect(barLanes).toBe(1);
    // samedi : barre + 1 élément + « + 2 »
    expect(cells[5].singles).toEqual(["a"]);
    expect(cells[5].hiddenCount).toBe(2);
  });

  it("une seule ligne : la barre passe dans « + N »", () => {
    const { barLanes, cells } = fitWeek({
      layout,
      singlesByColumn: empty().map((_, column) => (column === 5 ? ["x"] : [])),
      capacity: 1,
    });
    expect(barLanes).toBe(0);
    expect(cells[6].hiddenCount).toBe(1);
    expect(cells[5].hiddenCount).toBe(2);
  });

  it("pas encore mesuré : tout est affiché", () => {
    const { barLanes, cells } = fitWeek({
      layout,
      singlesByColumn: empty().map(() => ["a", "b", "c", "d"]),
      capacity: Infinity,
    });
    expect(barLanes).toBe(1);
    expect(cells[0].singles).toHaveLength(4);
    expect(cells[0].hiddenCount).toBe(0);
  });
});
