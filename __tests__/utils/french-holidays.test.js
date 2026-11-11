import { describe, it, expect } from "vitest";
import {
  easterSunday,
  frenchHolidayName,
  frenchHolidays,
} from "@/src/utils/french-holidays";

describe("jours fériés français", () => {
  it("Pâques et les fêtes mobiles", () => {
    expect(easterSunday(2026)).toEqual(new Date(2026, 3, 5));
    expect(easterSunday(2027)).toEqual(new Date(2027, 2, 28));
    const holidays = frenchHolidays(2026);
    expect(holidays.get("2026-04-06")).toBe("Lundi de Pâques");
    expect(holidays.get("2026-05-14")).toBe("Ascension");
    expect(holidays.get("2026-05-25")).toBe("Lundi de Pentecôte");
    expect(holidays.size).toBe(11);
  });

  it("nom du jour férié d'une date locale", () => {
    expect(frenchHolidayName(new Date(2026, 10, 1))).toBe("Toussaint");
    expect(frenchHolidayName(new Date(2026, 10, 11, 15, 30))).toBe(
      "Armistice 1918",
    );
    expect(frenchHolidayName(new Date(2026, 10, 2))).toBeNull();
  });
});
