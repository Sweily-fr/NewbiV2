import { describe, it, expect } from "vitest";
import { invitationPagePath } from "@/src/lib/invitation-link";

describe("invitationPagePath", () => {
  it("page de l'invitation, adresse encodée", () => {
    expect(invitationPagePath("0123456789abcdef01234567", "a+b@x.fr")).toBe(
      "/accept-invitation/0123456789abcdef01234567?email=a%2Bb%40x.fr",
    );
    expect(invitationPagePath("0123456789abcdef01234567")).toBe(
      "/accept-invitation/0123456789abcdef01234567",
    );
  });
  it("identifiant mal formé : aucune page", () => {
    for (const id of ["../x", "https://x", "", null, "0123"]) {
      expect(invitationPagePath(id, "a@x.fr")).toBeNull();
    }
  });
});
