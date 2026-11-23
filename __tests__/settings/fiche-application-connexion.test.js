// Fiche d'une application (Paramètres > Applications) : le bloc de connexion
// générique, dont le bouton « Connecter » ne fait rien, ne s'affiche jamais à
// côté du bloc dédié d'une application (PayPal et SumUp l'affichaient en
// double le 23/11/2026).
import { describe, it, expect } from "vitest";
import {
  APPS_WITH_OWN_CONNECTION_PANEL,
  showsGenericConnectionPanel,
} from "@/src/components/settings/applications-connection-panels";

describe("bloc de connexion générique d'une fiche d'application", () => {
  it("jamais pour une application qui a son propre bloc", () => {
    for (const appId of [
      "stripe",
      "bridge",
      "pennylane",
      "qonto",
      "abby",
      "paypal",
      "sumup",
    ]) {
      expect(showsGenericConnectionPanel(appId)).toBe(false);
    }
    expect(APPS_WITH_OWN_CONNECTION_PANEL).toContain("paypal");
    expect(APPS_WITH_OWN_CONNECTION_PANEL).toContain("sumup");
  });

  it("toujours pour les autres applications", () => {
    for (const appId of ["zapier", "make", "notion", "hubspot"]) {
      expect(showsGenericConnectionPanel(appId)).toBe(true);
    }
  });
});
