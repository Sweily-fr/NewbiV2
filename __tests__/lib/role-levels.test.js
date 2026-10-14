import { describe, it, expect } from "vitest";
import { canAction } from "@/src/lib/role-levels";

describe("canAction", () => {
  it("« Retirer des membres » n'est pas confondu avec « Supprimer »", () => {
    const actions = { team: ["view", "invite", "changeRole", "remove"] };
    expect(canAction(actions, "team", "remove")).toBe(true);
    expect(canAction({ team: ["view"] }, "team", "remove")).toBe(false);
  });

  it("garde les anciens noms d'actions sur les autres pages", () => {
    const actions = { clients: ["view", "delete"], invoices: ["view"] };
    expect(canAction(actions, "clients", "remove")).toBe(true);
    expect(canAction(actions, "invoices", "read")).toBe(true);
    expect(canAction(actions, "invoices", "remove")).toBe(false);
  });
});
