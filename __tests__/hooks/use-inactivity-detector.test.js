import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/src/lib/auth-client", () => ({
  performLogout: vi.fn().mockResolvedValue(undefined),
}));

import { useInactivityDetector } from "@/src/hooks/useInactivityDetector";
import { performLogout } from "@/src/lib/auth-client";

const LAST_ACTIVITY_KEY = "newbi_last_activity";
const QUARTER_HOUR_MS = 15 * 60 * 1000;

// timeoutHours: 0.25 = 15 minutes (la plus petite valeur configurable)
const renderDetector = (options = {}) =>
  renderHook(() => useInactivityDetector({ timeoutHours: 0.25, ...options }));

describe("useInactivityDetector", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("déconnecte après le timeout sans activité", () => {
    renderDetector();

    vi.advanceTimersByTime(QUARTER_HOUR_MS - 1000);
    expect(performLogout).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);
    expect(performLogout).toHaveBeenCalledWith({
      redirectTo: "/auth/session-expired?reason=inactivity",
    });
  });

  it("l'activité utilisateur repousse la déconnexion", () => {
    renderDetector();

    // Actif à 10 min : le décompte repart
    vi.advanceTimersByTime(10 * 60 * 1000);
    window.dispatchEvent(new Event("mousedown"));

    // 14 min après la dernière activité : toujours connecté
    vi.advanceTimersByTime(14 * 60 * 1000);
    expect(performLogout).not.toHaveBeenCalled();

    // 15 min après la dernière activité : déconnecté
    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(performLogout).toHaveBeenCalledTimes(1);
  });

  it("déconnecte à la première activité si le timeout est dépassé (retour de veille)", () => {
    renderDetector();

    // Mise en veille : l'horloge avance mais les timers ne tournent pas
    vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1000);

    window.dispatchEvent(new Event("mousedown"));
    expect(performLogout).toHaveBeenCalledTimes(1);
  });

  it("le watchdog déconnecte sans interaction si l'horloge a dépassé le timeout", () => {
    renderDetector();

    // Saut d'horloge (veille) : le prochain tick du watchdog doit suffire
    vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1000);

    vi.advanceTimersByTime(30_000);
    expect(performLogout).toHaveBeenCalledTimes(1);
  });

  it("déconnecte au retour de focus si le timeout est dépassé", () => {
    renderDetector();

    vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1000);

    window.dispatchEvent(new Event("focus"));
    expect(performLogout).toHaveBeenCalledTimes(1);
  });

  it("déconnecte au montage si l'inactivité a dépassé le timeout pendant la fermeture", () => {
    localStorage.setItem(
      LAST_ACTIVITY_KEY,
      String(Date.now() - 20 * 60 * 1000),
    );

    renderDetector();
    expect(performLogout).toHaveBeenCalledTimes(1);
  });

  it("reprend le décompte au montage avec le temps restant", () => {
    localStorage.setItem(
      LAST_ACTIVITY_KEY,
      String(Date.now() - 10 * 60 * 1000),
    );

    renderDetector();
    expect(performLogout).not.toHaveBeenCalled();

    // Il restait 5 min
    vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
    expect(performLogout).toHaveBeenCalledTimes(1);
  });

  it("un timestamp d'une session précédente ne déconnecte pas un login frais", () => {
    localStorage.setItem(
      LAST_ACTIVITY_KEY,
      String(Date.now() - 20 * 60 * 1000),
    );

    renderDetector({ sessionCreatedAt: new Date(Date.now()) });
    expect(performLogout).not.toHaveBeenCalled();
  });

  it("ne fait rien quand la détection est désactivée", () => {
    renderDetector({ enabled: false });

    vi.advanceTimersByTime(2 * QUARTER_HOUR_MS);
    expect(performLogout).not.toHaveBeenCalled();
  });

  it("l'activité d'un autre onglet (storage) repousse la déconnexion", () => {
    renderDetector();

    vi.advanceTimersByTime(10 * 60 * 1000);

    // Un autre onglet signale de l'activité
    const now = Date.now();
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: LAST_ACTIVITY_KEY,
        newValue: String(now),
      }),
    );

    vi.advanceTimersByTime(14 * 60 * 1000);
    expect(performLogout).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(performLogout).toHaveBeenCalledTimes(1);
  });
});
