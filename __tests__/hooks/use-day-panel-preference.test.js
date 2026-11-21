import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import {
  DAY_PANEL_KEY,
  useDayPanelPreference,
} from "@/app/dashboard/calendar/hooks/use-day-panel-preference";

/**
 * Calendrier, vue mois : le volet du jour fermé par la personne le reste
 * quand elle revient sur l'application (choix gardé dans le navigateur).
 */

describe("volet du jour : choix retrouvé à la visite suivante", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("rien de retenu : volet ouvert", () => {
    const { result } = renderHook(() => useDayPanelPreference());
    expect(result.current[0]).toBe(false);
  });

  it("fermé puis retour sur la page : toujours fermé", () => {
    const first = renderHook(() => useDayPanelPreference());
    act(() => first.result.current[1](true));
    expect(first.result.current[0]).toBe(true);
    expect(localStorage.getItem(DAY_PANEL_KEY)).toBe("hidden");
    first.unmount();

    const back = renderHook(() => useDayPanelPreference());
    expect(back.result.current[0]).toBe(true);
  });

  it("rouvert : ouvert à la visite suivante", () => {
    localStorage.setItem(DAY_PANEL_KEY, "hidden");
    const first = renderHook(() => useDayPanelPreference());
    act(() => first.result.current[1](false));
    expect(localStorage.getItem(DAY_PANEL_KEY)).toBe("visible");
    first.unmount();

    const back = renderHook(() => useDayPanelPreference());
    expect(back.result.current[0]).toBe(false);
  });

  it("stockage indisponible : le bouton marche, sans erreur", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqué");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqué");
    });
    const { result } = renderHook(() => useDayPanelPreference());
    expect(result.current[0]).toBe(false);
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
  });
});
