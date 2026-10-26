import { describe, it, expect } from "vitest";
import {
  buildCalendarWeeks,
  compareCalendarItems,
  countHiddenByDay,
  dayKey,
  dayTaskDates,
  getTaskDayRange,
  layoutWeek,
  parseDayKey,
  resizeTaskDates,
  sameTaskDates,
  shiftTaskDates,
} from "@/src/utils/kanban-calendar";

// Dates locales (le calendrier raisonne en jours locaux)
const local = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
const iso = (...args) => local(...args).toISOString();

const item = (id, start, end, extra = {}) => ({
  id,
  start: local(...start),
  end: local(...end),
  ...extra,
});

describe("getTaskDayRange", () => {
  it("couvre du début à l'échéance", () => {
    const range = getTaskDayRange({
      startDate: iso(2026, 10, 5, 9),
      dueDate: iso(2026, 10, 8, 18),
    });
    expect(range).toEqual({
      start: local(2026, 10, 5),
      end: local(2026, 10, 8),
    });
  });

  it("place une tâche à une seule date sur ce jour-là", () => {
    expect(getTaskDayRange({ dueDate: iso(2026, 10, 8, 18) })).toEqual({
      start: local(2026, 10, 8),
      end: local(2026, 10, 8),
    });
    expect(getTaskDayRange({ startDate: iso(2026, 10, 5, 9) })).toEqual({
      start: local(2026, 10, 5),
      end: local(2026, 10, 5),
    });
  });

  it("renvoie null sans date", () => {
    expect(getTaskDayRange({})).toBeNull();
    expect(getTaskDayRange({ startDate: null, dueDate: "" })).toBeNull();
  });

  it("remet dans l'ordre un début saisi après l'échéance", () => {
    const range = getTaskDayRange({
      startDate: iso(2026, 10, 9),
      dueDate: iso(2026, 10, 6),
    });
    expect(range).toEqual({
      start: local(2026, 10, 6),
      end: local(2026, 10, 9),
    });
  });
});

describe("buildCalendarWeeks", () => {
  it("encadre le mois de lundis à dimanches", () => {
    // Octobre 2026 : jeudi 1er au samedi 31
    const weeks = buildCalendarWeeks(local(2026, 10, 15), "month");
    expect(weeks).toHaveLength(5);
    expect(weeks[0].start).toEqual(local(2026, 9, 28));
    expect(weeks[4].end).toEqual(local(2026, 11, 1));
    weeks.forEach((week) => expect(week.days).toHaveLength(7));
  });

  it("donne 6 semaines quand le mois en a besoin", () => {
    // Août 2026 : samedi 1er au lundi 31
    expect(buildCalendarWeeks(local(2026, 8, 10), "month")).toHaveLength(6);
  });

  it("donne la semaine de la date en mode semaine", () => {
    const weeks = buildCalendarWeeks(local(2026, 10, 29), "week");
    expect(weeks).toHaveLength(1);
    expect(weeks[0].start).toEqual(local(2026, 10, 26));
    expect(weeks[0].end).toEqual(local(2026, 11, 1));
  });
});

describe("layoutWeek", () => {
  const week = { start: local(2026, 10, 26), end: local(2026, 11, 1) };

  it("empile les tâches qui se chevauchent et réutilise les lignes libres", () => {
    const items = [
      item("a", [2026, 10, 26], [2026, 10, 28]),
      item("b", [2026, 10, 27], [2026, 10, 27]),
      item("c", [2026, 10, 29], [2026, 10, 30]),
    ].sort(compareCalendarItems);
    const { segments, laneCount } = layoutWeek(week, items);
    const lanes = Object.fromEntries(segments.map((s) => [s.item.id, s.lane]));
    expect(lanes).toEqual({ a: 0, b: 1, c: 0 });
    expect(laneCount).toBe(2);
  });

  it("coupe les tâches qui débordent de la semaine", () => {
    const { segments } = layoutWeek(week, [
      item("long", [2026, 10, 20], [2026, 11, 5]),
    ]);
    expect(segments[0]).toMatchObject({
      startCol: 0,
      endCol: 6,
      continuesBefore: true,
      continuesAfter: true,
    });
  });

  it("ignore les tâches hors de la semaine", () => {
    const { segments, laneCount } = layoutWeek(week, [
      item("avant", [2026, 10, 1], [2026, 10, 25]),
      item("après", [2026, 11, 2], [2026, 11, 3]),
    ]);
    expect(segments).toHaveLength(0);
    expect(laneCount).toBe(0);
  });
});

describe("compareCalendarItems", () => {
  it("trie par début, puis la plus longue d'abord, puis colonne et position", () => {
    const items = [
      item("court", [2026, 10, 5], [2026, 10, 5], { columnIndex: 0 }),
      item("long", [2026, 10, 5], [2026, 10, 9], { columnIndex: 1 }),
      item("col2", [2026, 10, 5], [2026, 10, 5], { columnIndex: 2 }),
      item("pos1", [2026, 10, 5], [2026, 10, 5], {
        columnIndex: 0,
        position: 1,
      }),
      item("tôt", [2026, 10, 1], [2026, 10, 1], { columnIndex: 3 }),
    ];
    items[0].position = 0;
    expect(items.sort(compareCalendarItems).map((i) => i.id)).toEqual([
      "tôt",
      "long",
      "court",
      "pos1",
      "col2",
    ]);
  });
});

describe("countHiddenByDay", () => {
  it("compte par jour les segments au-delà des lignes visibles", () => {
    const segments = [
      { lane: 0, startCol: 0, endCol: 6 },
      { lane: 1, startCol: 1, endCol: 2 },
      { lane: 2, startCol: 2, endCol: 3 },
    ];
    expect(countHiddenByDay(segments, 1)).toEqual([0, 1, 2, 1, 0, 0, 0]);
    expect(countHiddenByDay(segments, 3)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});

describe("shiftTaskDates", () => {
  it("décale les deux dates en gardant heures et durée", () => {
    expect(
      shiftTaskDates(
        { startDate: iso(2026, 10, 5, 9, 30), dueDate: iso(2026, 10, 7, 17) },
        3,
      ),
    ).toEqual({
      startDate: iso(2026, 10, 8, 9, 30),
      dueDate: iso(2026, 10, 10, 17),
    });
  });

  it("laisse vide une date absente", () => {
    expect(shiftTaskDates({ dueDate: iso(2026, 10, 7, 18) }, -2)).toEqual({
      startDate: null,
      dueDate: iso(2026, 10, 5, 18),
    });
  });

  it("garde l'heure locale au passage à l'heure d'hiver", () => {
    // Nuit du 24 au 25 octobre 2026 en France
    const shifted = shiftTaskDates({ dueDate: iso(2026, 10, 23, 18) }, 3);
    expect(new Date(shifted.dueDate).getHours()).toBe(18);
    expect(new Date(shifted.dueDate).getDate()).toBe(26);
  });
});

describe("resizeTaskDates", () => {
  const dates = {
    startDate: iso(2026, 10, 5, 10),
    dueDate: iso(2026, 10, 8, 16),
  };

  it("déplace le bord de fin en gardant son heure", () => {
    expect(resizeTaskDates(dates, "end", local(2026, 10, 12))).toEqual({
      startDate: dates.startDate,
      dueDate: iso(2026, 10, 12, 16),
    });
  });

  it("déplace le bord de début en gardant son heure", () => {
    expect(resizeTaskDates(dates, "start", local(2026, 10, 2))).toEqual({
      startDate: iso(2026, 10, 2, 10),
      dueDate: dates.dueDate,
    });
  });

  it("ne laisse pas le début passer l'échéance (ni l'inverse)", () => {
    expect(resizeTaskDates(dates, "start", local(2026, 10, 20)).startDate).toBe(
      iso(2026, 10, 8, 10),
    );
    expect(resizeTaskDates(dates, "end", local(2026, 10, 1)).dueDate).toBe(
      iso(2026, 10, 5, 16),
    );
  });

  it("ajoute la borne manquante d'une tâche à une seule date", () => {
    expect(
      resizeTaskDates(
        { dueDate: iso(2026, 10, 8, 18) },
        "end",
        local(2026, 10, 10),
      ),
    ).toEqual({
      startDate: iso(2026, 10, 8, 9),
      dueDate: iso(2026, 10, 10, 18),
    });
    expect(
      resizeTaskDates(
        { startDate: iso(2026, 10, 8, 9) },
        "start",
        local(2026, 10, 6),
      ),
    ).toEqual({
      startDate: iso(2026, 10, 6, 9),
      dueDate: iso(2026, 10, 8, 18),
    });
  });
});

describe("dayTaskDates", () => {
  it("pose début 9 h et échéance 18 h sur le jour", () => {
    expect(dayTaskDates(local(2026, 10, 14, 23))).toEqual({
      startDate: iso(2026, 10, 14, 9),
      dueDate: iso(2026, 10, 14, 18),
    });
  });
});

describe("sameTaskDates", () => {
  it("compare les instants, pas les chaînes", () => {
    expect(
      sameTaskDates(
        { startDate: "2026-10-05T09:00:00.000Z", dueDate: null },
        { startDate: "2026-10-05T09:00:00Z", dueDate: "" },
      ),
    ).toBe(true);
    expect(
      sameTaskDates(
        { dueDate: iso(2026, 10, 5) },
        { dueDate: iso(2026, 10, 6) },
      ),
    ).toBe(false);
  });
});

describe("dayKey / parseDayKey", () => {
  it("fait l'aller-retour en jour local", () => {
    const day = local(2026, 3, 29); // passage à l'heure d'été
    expect(dayKey(day)).toBe("2026-03-29");
    expect(parseDayKey("2026-03-29")).toEqual(day);
  });
});
