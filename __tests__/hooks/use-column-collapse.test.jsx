import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useColumnCollapse } from "@/src/hooks/useColumnCollapse";

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("useColumnCollapse", () => {
  it("starts with empty collapsed set", () => {
    const { result } = renderHook(() => useColumnCollapse("board-1"));
    expect(result.current.collapsedColumnsCount).toBe(0);
    expect(result.current.isColumnCollapsed("col-1")).toBe(false);
  });

  it("toggleColumnCollapse adds and removes columns", () => {
    const { result } = renderHook(() => useColumnCollapse("board-1"));
    act(() => result.current.toggleColumnCollapse("col-1"));
    expect(result.current.isColumnCollapsed("col-1")).toBe(true);
    expect(result.current.collapsedColumnsCount).toBe(1);

    act(() => result.current.toggleColumnCollapse("col-1"));
    expect(result.current.isColumnCollapsed("col-1")).toBe(false);
  });

  it("persists state to localStorage", () => {
    const { result } = renderHook(() => useColumnCollapse("board-1"));
    act(() => result.current.toggleColumnCollapse("col-1"));
    act(() => result.current.toggleColumnCollapse("col-2"));

    const stored = JSON.parse(
      localStorage.getItem("kanban-collapsed-columns-board-1"),
    );
    expect(stored).toContain("col-1");
    expect(stored).toContain("col-2");
  });

  it("loads previous state from localStorage on mount", () => {
    localStorage.setItem(
      "kanban-collapsed-columns-board-1",
      JSON.stringify(["col-1", "col-2"]),
    );
    const { result } = renderHook(() => useColumnCollapse("board-1"));
    expect(result.current.collapsedColumnsCount).toBe(2);
    expect(result.current.isColumnCollapsed("col-1")).toBe(true);
  });

  it("collapseAll sets all provided columns", () => {
    const { result } = renderHook(() => useColumnCollapse("board-1"));
    act(() => result.current.collapseAll(["col-1", "col-2", "col-3"]));
    expect(result.current.collapsedColumnsCount).toBe(3);
  });

  it("expandAll clears state", () => {
    const { result } = renderHook(() => useColumnCollapse("board-1"));
    act(() => result.current.collapseAll(["col-1", "col-2"]));
    act(() => result.current.expandAll());
    expect(result.current.collapsedColumnsCount).toBe(0);
  });

  it("isolates state per boardId", () => {
    const { result: r1 } = renderHook(() => useColumnCollapse("board-1"));
    act(() => r1.current.toggleColumnCollapse("col-A"));

    const { result: r2 } = renderHook(() => useColumnCollapse("board-2"));
    expect(r2.current.collapsedColumnsCount).toBe(0);
  });

  it("recovers gracefully from corrupted localStorage", () => {
    localStorage.setItem("kanban-collapsed-columns-board-1", "{not valid json");
    const { result } = renderHook(() => useColumnCollapse("board-1"));
    expect(result.current.collapsedColumnsCount).toBe(0);
  });
});
