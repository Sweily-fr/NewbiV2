import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettingsModal } from "@/src/hooks/useSettingsModal";

describe("useSettingsModal", () => {
  it("starts closed with the default 'preferences' tab", () => {
    const { result } = renderHook(() => useSettingsModal());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.initialTab).toBe("preferences");
  });

  it("openSettings opens with the requested tab", () => {
    const { result } = renderHook(() => useSettingsModal());
    act(() => result.current.openSettings("billing"));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.initialTab).toBe("billing");
  });

  it("openSettings without arg defaults to 'preferences'", () => {
    const { result } = renderHook(() => useSettingsModal());
    act(() => result.current.openSettings());
    expect(result.current.initialTab).toBe("preferences");
  });

  it("closeSettings closes but preserves the tab", () => {
    const { result } = renderHook(() => useSettingsModal());
    act(() => result.current.openSettings("billing"));
    act(() => result.current.closeSettings());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.initialTab).toBe("billing");
  });

  it("openCompanySettings opens with the 'generale' tab", () => {
    const { result } = renderHook(() => useSettingsModal());
    act(() => result.current.openCompanySettings());
    expect(result.current.isOpen).toBe(true);
    expect(result.current.initialTab).toBe("generale");
  });

  it("openLegalSettings opens with the 'informations-legales' tab", () => {
    const { result } = renderHook(() => useSettingsModal());
    act(() => result.current.openLegalSettings());
    expect(result.current.isOpen).toBe(true);
    expect(result.current.initialTab).toBe("informations-legales");
  });
});
