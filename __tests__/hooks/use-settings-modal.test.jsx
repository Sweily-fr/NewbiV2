import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettingsModal } from "@/src/hooks/useSettingsModal";

describe("useSettingsModal", () => {
  it("starts closed with default tab='preferences'", () => {
    const { result } = renderHook(() => useSettingsModal());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.initialTab).toBe("preferences");
  });

  it("openSettings opens with default tab", () => {
    const { result } = renderHook(() => useSettingsModal());
    act(() => result.current.openSettings());
    expect(result.current.isOpen).toBe(true);
    expect(result.current.initialTab).toBe("preferences");
  });

  it("openSettings accepts a custom tab", () => {
    const { result } = renderHook(() => useSettingsModal());
    act(() => result.current.openSettings("integrations"));
    expect(result.current.initialTab).toBe("integrations");
    expect(result.current.isOpen).toBe(true);
  });

  it("closeSettings closes the modal", () => {
    const { result } = renderHook(() => useSettingsModal());
    act(() => result.current.openSettings());
    act(() => result.current.closeSettings());
    expect(result.current.isOpen).toBe(false);
  });

  it("openCompanySettings opens 'generale' tab", () => {
    const { result } = renderHook(() => useSettingsModal());
    act(() => result.current.openCompanySettings());
    expect(result.current.isOpen).toBe(true);
    expect(result.current.initialTab).toBe("generale");
  });

  it("openLegalSettings opens 'informations-legales' tab", () => {
    const { result } = renderHook(() => useSettingsModal());
    act(() => result.current.openLegalSettings());
    expect(result.current.initialTab).toBe("informations-legales");
  });
});
