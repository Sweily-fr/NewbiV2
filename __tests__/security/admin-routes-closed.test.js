import { describe, it, expect, vi } from "vitest";

vi.mock("@/src/lib/auth-utils", () => ({ sendReactivationEmail: vi.fn() }));
import { DISABLED_AUTH_PATHS } from "@/src/lib/auth-hooks";

describe("Routes d'administration de Better Auth", () => {
  it.each([
    "/admin/impersonate-user",
    "/admin/set-role",
    "/admin/set-user-password",
    "/admin/create-user",
    "/admin/update-user",
    "/admin/ban-user",
    "/admin/list-users",
    "/admin/list-user-sessions",
    "/admin/revoke-user-sessions",
  ])("%s : fermée (404)", (chemin) => {
    expect(DISABLED_AUTH_PATHS).toContain(chemin);
  });

  it("la suppression d'un compte par le super administrateur reste ouverte", () => {
    expect(DISABLED_AUTH_PATHS).not.toContain("/admin/remove-user");
  });
});
