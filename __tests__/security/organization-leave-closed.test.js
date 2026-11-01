import { describe, it, expect, vi } from "vitest";

vi.mock("@/src/lib/auth-utils", () => ({ sendReactivationEmail: vi.fn() }));
import { readFileSync } from "node:fs";
import path from "node:path";
import { DISABLED_AUTH_PATHS } from "@/src/lib/auth-hooks";

// /organization/leave du plugin organisation retire l'adhésion sans passer par
// afterRemoveMember (sièges Stripe recalculés, fin du lien avec un cabinet).
// Aucun écran ne l'appelle : la route est fermée.
describe("Quitter un espace par la route du plugin", () => {
  it("route fermée (disabledPaths)", () => {
    expect(DISABLED_AUTH_PATHS).toContain("/organization/leave");
  });

  it("aucun écran du site n'appelle organization.leave", () => {
    const fichier = path.resolve("src/components/team-switcher.jsx");
    const code = readFileSync(fichier, "utf8");
    expect(code).not.toMatch(/^\s*await authClient\.organization\.leave/m);
  });
});
