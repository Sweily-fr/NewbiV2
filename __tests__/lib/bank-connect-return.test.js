import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  BANK_CONNECT_MAX_AGE_MS,
  clearBankConnectStarted,
  goToBankConnect,
  hasBankConnectReturnParams,
  hasPendingBankConnect,
  isRealBankConnectReturn,
  markBankConnectStarted,
} from "@/src/lib/bank-connect-return";

describe("Retour de connexion bancaire", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reconnaît les paramètres de retour de Bridge et de l'API", () => {
    expect(hasBankConnectReturnParams("?item_id=12&success=true")).toBe(true);
    expect(hasBankConnectReturnParams("?status=success")).toBe(true);
    expect(
      hasBankConnectReturnParams("?banking_success=true&session_id=a"),
    ).toBe(true);
    expect(hasBankConnectReturnParams("?tab=factures")).toBe(false);
    expect(hasBankConnectReturnParams("")).toBe(false);
  });

  it("un lien avec ?status= sans connexion ouverte depuis ce navigateur n'est pas un retour", () => {
    expect(isRealBankConnectReturn("?status=success")).toBe(false);
    expect(isRealBankConnectReturn("?item_id=12")).toBe(false);
  });

  it("connexion ouverte peu avant puis retour : retour réel", () => {
    const now = Date.now();
    markBankConnectStarted(now - 5 * 60 * 1000);
    expect(isRealBankConnectReturn("?item_id=12&success=true", now)).toBe(true);
    // Paramètres absents : jamais de synchro, même avec la marque
    expect(isRealBankConnectReturn("", now)).toBe(false);
  });

  it("marque trop ancienne, future ou illisible : ignorée", () => {
    const now = Date.now();
    markBankConnectStarted(now - BANK_CONNECT_MAX_AGE_MS - 1);
    expect(hasPendingBankConnect(now)).toBe(false);
    markBankConnectStarted(now + 60_000);
    expect(hasPendingBankConnect(now)).toBe(false);
    window.localStorage.setItem("newbi-bank-connect-started", "abc");
    expect(hasPendingBankConnect(now)).toBe(false);
  });

  it("la marque est retirée une fois le retour traité", () => {
    markBankConnectStarted();
    expect(hasPendingBankConnect()).toBe(true);
    clearBankConnectStarted();
    expect(hasPendingBankConnect()).toBe(false);
  });

  it("goToBankConnect marque le départ puis part vers Bridge", () => {
    const location = { href: "http://localhost/dashboard" };
    vi.stubGlobal("location", location);
    const original = Object.getOwnPropertyDescriptor(window, "location");
    Object.defineProperty(window, "location", {
      value: location,
      configurable: true,
    });
    try {
      goToBankConnect("https://connect.bridgeapi.io/session/abc");
      expect(location.href).toBe("https://connect.bridgeapi.io/session/abc");
      expect(hasPendingBankConnect()).toBe(true);
    } finally {
      if (original) Object.defineProperty(window, "location", original);
      vi.unstubAllGlobals();
    }
  });
});
