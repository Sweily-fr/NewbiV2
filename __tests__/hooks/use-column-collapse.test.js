import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useColumnCollapse } from "@/src/hooks/useColumnCollapse";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const BOARD_ID = "board-42";
const STORAGE_KEY = `kanban-collapsed-columns-${BOARD_ID}`;

describe("useColumnCollapse", () => {
  it("starts with no columns collapsed when nothing is in localStorage", () => {
    const { result } = renderHook(() => useColumnCollapse(BOARD_ID));
    expect(result.current.collapsedColumnsCount).toBe(0);
    expect(result.current.isColumnCollapsed("col-1")).toBe(false);
  });

  it("hydrates from localStorage when collapsed columns are saved", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["col-1", "col-3"]));

    const { result } = renderHook(() => useColumnCollapse(BOARD_ID));

    expect(result.current.collapsedColumnsCount).toBe(2);
    expect(result.current.isColumnCollapsed("col-1")).toBe(true);
    expect(result.current.isColumnCollapsed("col-2")).toBe(false);
    expect(result.current.isColumnCollapsed("col-3")).toBe(true);
  });

  it("toggleColumnCollapse adds the column when not collapsed", () => {
    const { result } = renderHook(() => useColumnCollapse(BOARD_ID));

    act(() => result.current.toggleColumnCollapse("col-1"));

    expect(result.current.isColumnCollapsed("col-1")).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(["col-1"]);
  });

  it("toggleColumnCollapse removes the column when already collapsed", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["col-1"]));
    const { result } = renderHook(() => useColumnCollapse(BOARD_ID));

    act(() => result.current.toggleColumnCollapse("col-1"));

    expect(result.current.isColumnCollapsed("col-1")).toBe(false);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([]);
  });

  it("collapseAll collapses every provided columnId", () => {
    const { result } = renderHook(() => useColumnCollapse(BOARD_ID));

    act(() => result.current.collapseAll(["col-1", "col-2", "col-3"]));

    expect(result.current.collapsedColumnsCount).toBe(3);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).sort()).toEqual([
      "col-1",
      "col-2",
      "col-3",
    ]);
  });

  it("expandAll clears all collapsed columns", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["col-1", "col-2"]));
    const { result } = renderHook(() => useColumnCollapse(BOARD_ID));

    act(() => result.current.expandAll());

    expect(result.current.collapsedColumnsCount).toBe(0);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([]);
  });

  it("uses a board-scoped storage key (different boards do not interfere)", () => {
    const { result: r1 } = renderHook(() => useColumnCollapse("board-A"));
    act(() => r1.current.toggleColumnCollapse("col-1"));

    const { result: r2 } = renderHook(() => useColumnCollapse("board-B"));
    expect(r2.current.isColumnCollapsed("col-1")).toBe(false);

    expect(localStorage.getItem("kanban-collapsed-columns-board-A")).toBe(
      JSON.stringify(["col-1"]),
    );
    expect(localStorage.getItem("kanban-collapsed-columns-board-B")).toBeNull();
  });

  it("recovers gracefully when localStorage contains malformed JSON", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, "{not-json");

    const { result } = renderHook(() => useColumnCollapse(BOARD_ID));

    expect(result.current.collapsedColumnsCount).toBe(0);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("does nothing when boardId is falsy (no localStorage read)", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
    renderHook(() => useColumnCollapse(undefined));
    expect(getItemSpy).not.toHaveBeenCalledWith(
      expect.stringMatching(/^kanban-collapsed-columns-/),
    );
  });
});
