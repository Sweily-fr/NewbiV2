import { describe, it, expect, afterEach, vi } from "vitest";
import {
  formatDateToFrench,
  formatDateToFrenchLong,
  formatDateTimeToFrench,
  formatLocalDate,
  refreshDraftDates,
  getDraftEffectiveDates,
} from "@/src/utils/dateFormatter";

describe("formatDateToFrench", () => {
  it("formats a Date object to dd/mm/yyyy", () => {
    // Use UTC-safe date to avoid timezone issues
    const date = new Date("2024-01-15T12:00:00.000Z");
    const result = formatDateToFrench(date);
    expect(result).toBe("15/01/2024");
  });

  it("formats a YYYY-MM-DD string", () => {
    const result = formatDateToFrench("2024-07-25");
    expect(result).toBe("25/07/2024");
  });

  it("formats a numeric timestamp", () => {
    // 2024-01-15T12:00:00Z in milliseconds
    const timestamp = new Date("2024-01-15T12:00:00.000Z").getTime();
    const result = formatDateToFrench(timestamp);
    expect(result).toBe("15/01/2024");
  });

  it("formats a string timestamp", () => {
    const timestamp = String(new Date("2024-01-15T12:00:00.000Z").getTime());
    const result = formatDateToFrench(timestamp);
    expect(result).toBe("15/01/2024");
  });

  it("returns empty string for null/undefined/empty", () => {
    expect(formatDateToFrench(null)).toBe("");
    expect(formatDateToFrench(undefined)).toBe("");
    expect(formatDateToFrench("")).toBe("");
  });

  it("returns original value for invalid date string", () => {
    expect(formatDateToFrench("not-a-date")).toBe("not-a-date");
  });
});

describe("formatDateToFrenchLong", () => {
  it("formats a Date object to long French format", () => {
    const date = new Date("2024-01-15T12:00:00.000Z");
    const result = formatDateToFrenchLong(date);
    // "15 janvier 2024" in fr-FR locale
    expect(result).toContain("2024");
    expect(result).toContain("15");
  });

  it("formats a YYYY-MM-DD string", () => {
    const result = formatDateToFrenchLong("2024-07-25");
    expect(result).toContain("2024");
    expect(result).toContain("25");
  });

  it('returns "Date non disponible" for null/undefined', () => {
    expect(formatDateToFrenchLong(null)).toBe("Date non disponible");
    expect(formatDateToFrenchLong(undefined)).toBe("Date non disponible");
  });

  it('returns "Date non disponible" for empty string', () => {
    expect(formatDateToFrenchLong("")).toBe("Date non disponible");
  });

  it('returns "Date non disponible" for "Invalid Date" string', () => {
    expect(formatDateToFrenchLong("Invalid Date")).toBe("Date non disponible");
  });

  it('returns "Date invalide" for unparseable string', () => {
    expect(formatDateToFrenchLong("not-a-date")).toBe("Date invalide");
  });

  it('returns "Format de date non supporté" for non-date objects', () => {
    expect(formatDateToFrenchLong({})).toBe("Format de date non supporté");
    expect(formatDateToFrenchLong([])).toBe("Format de date non supporté");
  });
});

describe("formatDateTimeToFrench", () => {
  it("formats a Date object to dd/mm/yyyy HH:MM", () => {
    const date = new Date("2024-01-15T14:30:00.000Z");
    const result = formatDateTimeToFrench(date);
    // Should contain date portion
    expect(result).toContain("15");
    expect(result).toContain("01");
    expect(result).toContain("2024");
    // Should contain time portion (may vary by timezone in test env)
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}/);
  });

  it("formats a YYYY-MM-DD string (time defaults to noon UTC)", () => {
    const result = formatDateTimeToFrench("2024-07-25");
    expect(result).toContain("25");
    expect(result).toContain("07");
    expect(result).toContain("2024");
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}/);
  });

  it('returns "Date non disponible" for null/undefined', () => {
    expect(formatDateTimeToFrench(null)).toBe("Date non disponible");
    expect(formatDateTimeToFrench(undefined)).toBe("Date non disponible");
  });

  it('returns "Date non disponible" for empty string', () => {
    expect(formatDateTimeToFrench("")).toBe("Date non disponible");
  });

  it('returns "Date invalide" for unparseable string', () => {
    expect(formatDateTimeToFrench("not-a-date")).toBe("Date invalide");
  });

  it('returns "Format de date non supporté" for non-date objects', () => {
    expect(formatDateTimeToFrench({})).toBe("Format de date non supporté");
  });

  it("formats a numeric timestamp", () => {
    const timestamp = new Date("2024-06-01T10:15:00.000Z").getTime();
    const result = formatDateTimeToFrench(timestamp);
    expect(result).toContain("2024");
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}/);
  });
});

// Jour calendaire décalé (un changement d'heure ne fait pas perdre de jour)
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

describe("refreshDraftDates", () => {
  const today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const todayStr = formatLocalDate(today);
  const plus = (days) => formatLocalDate(addDays(today, days));

  it("recale une émission passée à aujourd'hui et conserve le délai de validité", () => {
    // émission mars 2024, validité +30 j
    const res = refreshDraftDates("2024-03-15", "2024-04-14");
    expect(res.changed).toBe(true);
    expect(res.issueDate).toBe(todayStr);
    expect(res.secondDate).toBe(plus(30));
  });

  it("conserve un délai de validité personnalisé (ex: 60 j)", () => {
    const res = refreshDraftDates("2024-03-15", "2024-05-14"); // 60 j
    expect(res.changed).toBe(true);
    expect(res.issueDate).toBe(todayStr);
    expect(res.secondDate).toBe(plus(60));
  });

  it("utilise 30 j par défaut quand la 2e date existe mais est <= émission", () => {
    const res = refreshDraftDates("2024-03-15", "2024-03-15");
    expect(res.changed).toBe(true);
    expect(res.secondDate).toBe(plus(30));
  });

  it("n'invente pas de 2e date si elle est absente", () => {
    const res = refreshDraftDates("2024-03-15", "");
    expect(res.changed).toBe(true);
    expect(res.issueDate).toBe(todayStr);
    expect(res.secondDate).toBe("");
  });

  it("laisse les dates inchangées si l'émission est aujourd'hui ou future", () => {
    const future = plus(10);
    const res = refreshDraftDates(future, plus(40));
    expect(res.changed).toBe(false);
    expect(res.issueDate).toBe(future);
    expect(res.secondDate).toBe(plus(40));
  });

  it("ne fait rien sans date d'émission valide", () => {
    const res = refreshDraftDates("", "");
    expect(res.changed).toBe(false);
    expect(res.issueDate).toBe("");
  });
});

describe("getDraftEffectiveDates", () => {
  const today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  it("recale une émission passée et renvoie les originales (timestamp ms)", () => {
    const issueTs = new Date("2024-03-15T00:00:00").getTime();
    const dueTs = new Date("2024-04-14T00:00:00").getTime();
    const res = getDraftEffectiveDates(issueTs, dueTs);
    expect(res.changed).toBe(true);
    expect(res.issue.effective.getTime()).toBe(today.getTime());
    expect(res.issue.original.getFullYear()).toBe(2024);
    // délai 30 j conservé
    expect(res.second.effective.getTime()).toBe(addDays(today, 30).getTime());
    expect(res.second.original.getFullYear()).toBe(2024);
  });

  it("accepte les chaînes YYYY-MM-DD", () => {
    const res = getDraftEffectiveDates("2024-03-15", "2024-05-14"); // 60 j
    expect(res.changed).toBe(true);
    expect(res.second.effective.getTime()).toBe(addDays(today, 60).getTime());
  });

  it("ne recale pas une émission future", () => {
    const future = addDays(today, 5);
    const res = getDraftEffectiveDates(future, null);
    expect(res.changed).toBe(false);
    expect(res.issue.effective.getTime()).toBe(future.getTime());
  });

  it("garde la 2e date à null si absente", () => {
    const res = getDraftEffectiveDates("2024-03-15", null);
    expect(res.changed).toBe(true);
    expect(res.second.effective).toBe(null);
    expect(res.second.original).toBe(null);
  });
});

describe("Validité d'un devis recalé au passage à l'heure d'hiver", () => {
  const ORIGINAL_TZ = process.env.TZ;
  afterEach(() => {
    vi.useRealTimers();
    if (ORIGINAL_TZ === undefined) delete process.env.TZ;
    else process.env.TZ = ORIGINAL_TZ;
  });

  it("30 jours restent 30 jours (dimanche de 25 h dans la période)", () => {
    process.env.TZ = "Europe/Paris";
    // 21 octobre 2026 : la période de 30 jours traverse le 25 octobre
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 21, 9, 30));

    const res = refreshDraftDates("2026-09-18", "2026-10-18");
    expect(res.issueDate).toBe("2026-10-21");
    expect(res.secondDate).toBe("2026-11-20");

    const affichage = getDraftEffectiveDates("2026-09-18", "2026-10-18");
    expect(formatLocalDate(affichage.second.effective)).toBe("2026-11-20");
  });
});
