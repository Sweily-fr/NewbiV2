import { describe, it, expect } from "vitest";
import {
  FEED_HELP,
  createdLabel,
  lastReadLabel,
} from "@/src/utils/calendar-feed";

const NOW = new Date("2026-10-28T10:00:00Z");

describe("lastReadLabel", () => {
  it("jamais lu", () => {
    expect(lastReadLabel(null, NOW)).toBe(
      "Jamais lu par un agenda pour l'instant",
    );
    expect(lastReadLabel("pas une date", NOW)).toBe(
      "Jamais lu par un agenda pour l'instant",
    );
  });

  it("lu à l'instant, puis il y a quelques heures ou jours", () => {
    expect(lastReadLabel("2026-10-28T09:59:30Z", NOW)).toBe(
      "Lu par un agenda à l'instant",
    );
    expect(lastReadLabel("2026-10-28T08:00:00Z", NOW)).toBe(
      "Lu par un agenda il y a 2 heures",
    );
    expect(lastReadLabel("2026-10-25T10:00:00Z", NOW)).toBe(
      "Lu par un agenda il y a 3 jours",
    );
  });
});

describe("createdLabel", () => {
  it("date de création en toutes lettres", () => {
    expect(createdLabel(new Date(2026, 9, 28, 12))).toBe(
      "Lien créé le 28 octobre 2026",
    );
    expect(createdLabel(null)).toBeNull();
  });
});

describe("FEED_HELP", () => {
  it("couvre Google, Apple et Outlook, sans tiret cadratin", () => {
    expect(FEED_HELP.map((h) => h.app)).toEqual([
      "Google Agenda",
      "Apple Calendrier",
      "Outlook",
    ]);
    for (const { steps } of FEED_HELP) {
      expect(steps).not.toContain("—");
    }
  });
});
