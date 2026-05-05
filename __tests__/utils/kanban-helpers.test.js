import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatDateRelative,
  getPriorityColor,
  getPriorityIcon,
  stripHtml,
  getTasksByColumn,
} from "@/src/utils/kanbanHelpers";

describe("formatDateRelative", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-27T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'à l'instant' for less than a minute", () => {
    const date = new Date("2026-04-27T11:59:30Z");
    expect(formatDateRelative(date)).toBe("à l'instant");
  });

  it("returns minutes ago for less than an hour", () => {
    const date = new Date("2026-04-27T11:55:00Z");
    expect(formatDateRelative(date)).toBe("il y a 5m");
  });

  it("returns hours ago for less than a day", () => {
    const date = new Date("2026-04-27T09:00:00Z");
    expect(formatDateRelative(date)).toBe("il y a 3h");
  });

  it("returns days ago for less than a month", () => {
    const date = new Date("2026-04-22T12:00:00Z");
    expect(formatDateRelative(date)).toBe("il y a 5j");
  });

  it("returns months ago for less than a year", () => {
    const date = new Date("2026-01-15T12:00:00Z");
    expect(formatDateRelative(date)).toBe("il y a 3 mois");
  });

  it("returns years ago for more than a year (singular)", () => {
    const date = new Date("2025-04-15T12:00:00Z");
    expect(formatDateRelative(date)).toBe("il y a 1 an");
  });

  it("returns years ago for more than a year (plural)", () => {
    const date = new Date("2023-04-15T12:00:00Z");
    expect(formatDateRelative(date)).toBe("il y a 3 ans");
  });
});

describe("getPriorityColor", () => {
  it("returns destructive variant for HIGH", () => {
    expect(getPriorityColor("HIGH")).toMatch(/destructive/);
  });

  it("returns warning variant for MEDIUM", () => {
    expect(getPriorityColor("MEDIUM")).toMatch(/warning/);
  });

  it("returns success variant for LOW", () => {
    expect(getPriorityColor("LOW")).toMatch(/success/);
  });

  it("returns muted variant for unknown priority", () => {
    expect(getPriorityColor(undefined)).toMatch(/muted/);
    expect(getPriorityColor("UNKNOWN")).toMatch(/muted/);
  });
});

describe("getPriorityIcon", () => {
  it.each([["HIGH"], ["MEDIUM"], ["LOW"]])(
    "returns a JSX element for %s",
    (priority) => {
      const icon = getPriorityIcon(priority);
      expect(icon).toBeTruthy();
      expect(icon.type).toBeDefined();
    },
  );

  it("returns null for unknown priority", () => {
    expect(getPriorityIcon("UNKNOWN")).toBeNull();
    expect(getPriorityIcon(undefined)).toBeNull();
  });
});

describe("stripHtml", () => {
  it("returns empty string for null/undefined input", () => {
    expect(stripHtml(null)).toBe("");
    expect(stripHtml(undefined)).toBe("");
    expect(stripHtml("")).toBe("");
  });

  it("removes basic HTML tags", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("preserves text content with special characters", () => {
    expect(stripHtml("<p>5 €</p>")).toBe("5 €");
  });

  it("handles nested HTML", () => {
    expect(stripHtml("<div><span><em>nested</em></span></div>")).toBe("nested");
  });
});

describe("getTasksByColumn", () => {
  const tasks = [
    { id: 1, columnId: "A", position: 2, title: "A2" },
    { id: 2, columnId: "B", position: 0, title: "B0" },
    { id: 3, columnId: "A", position: 0, title: "A0" },
    { id: 4, columnId: "A", position: 1, title: "A1" },
    { id: 5, columnId: "B", position: 1, title: "B1" },
  ];

  it("returns only the tasks for the requested column", () => {
    const result = getTasksByColumn(tasks, "A");
    expect(result).toHaveLength(3);
    expect(result.every((t) => t.columnId === "A")).toBe(true);
  });

  it("sorts the returned tasks by position ascending", () => {
    const result = getTasksByColumn(tasks, "A");
    expect(result.map((t) => t.title)).toEqual(["A0", "A1", "A2"]);
  });

  it("treats missing position as 0 when sorting", () => {
    const withMissing = [
      { id: 1, columnId: "X", position: 1, title: "second" },
      { id: 2, columnId: "X", title: "first" }, // no position
    ];
    const result = getTasksByColumn(withMissing, "X");
    expect(result.map((t) => t.title)).toEqual(["first", "second"]);
  });

  it("returns an empty array when tasks is null or undefined", () => {
    expect(getTasksByColumn(null, "A")).toEqual([]);
    expect(getTasksByColumn(undefined, "A")).toEqual([]);
  });

  it("returns an empty array when no tasks match the column", () => {
    expect(getTasksByColumn(tasks, "Z")).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const original = [...tasks];
    getTasksByColumn(tasks, "A");
    expect(tasks).toEqual(original);
  });
});
