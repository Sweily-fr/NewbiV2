/**
 * « Récents » de la recherche globale : une liste par espace, effacée à la
 * déconnexion. Un autre compte connecté dans le même navigateur, ou le même
 * compte dans un autre espace, ne voit ni les clients ni les numéros de
 * documents ouverts ailleurs.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addRecent,
  clearAllRecents,
  getRecents,
} from "@/src/lib/search-recents";

const facture = {
  id: "invoice-1",
  label: "F-2026-0001",
  type: "facture",
  url: "/dashboard/outils/factures?id=1",
};
const client = {
  id: "client-1",
  label: "Société Confidentielle",
  type: "client",
  url: "/dashboard/clients?id=1",
};

beforeEach(() => {
  localStorage.clear();
});

describe("Récents de la recherche globale", () => {
  it("une liste par espace", () => {
    addRecent("espace-a", facture);
    addRecent("espace-a", client);
    expect(getRecents("espace-a").map((r) => r.id)).toEqual([
      "client-1",
      "invoice-1",
    ]);
    expect(getRecents("espace-b")).toEqual([]);
  });

  it("sans espace : rien lu, rien écrit", () => {
    addRecent(null, facture);
    expect(getRecents(null)).toEqual([]);
    expect(Object.keys(localStorage)).toEqual([]);
  });

  it("l'ancienne liste commune à tous les espaces n'est plus lue", () => {
    localStorage.setItem("newbi-search-recents", JSON.stringify([client]));
    expect(getRecents("espace-a")).toEqual([]);
  });

  it("cinq au plus, le dernier ouvert en tête, sans doublon", () => {
    for (let i = 1; i <= 7; i++)
      addRecent("espace-a", { ...facture, id: `invoice-${i}` });
    addRecent("espace-a", { ...facture, id: "invoice-5" });
    expect(getRecents("espace-a").map((r) => r.id)).toEqual([
      "invoice-5",
      "invoice-7",
      "invoice-6",
      "invoice-4",
      "invoice-3",
    ]);
  });

  it("clearAllRecents efface toutes les listes, rien d'autre", () => {
    addRecent("espace-a", facture);
    addRecent("espace-b", client);
    localStorage.setItem("newbi-search-recents", "[]");
    localStorage.setItem("autre-cle", "garder");
    clearAllRecents();
    expect(Object.keys(localStorage)).toEqual(["autre-cle"]);
  });

  it("la déconnexion efface les récents", async () => {
    addRecent("espace-a", client);
    vi.resetModules();
    const { clearSessionStorage } = await import("@/src/lib/auth-client");
    clearSessionStorage();
    expect(getRecents("espace-a")).toEqual([]);
  });
});
