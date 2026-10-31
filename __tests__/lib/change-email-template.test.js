import { describe, it, expect } from "vitest";
import { changeEmailConfirmation } from "@/src/lib/email-templates/auth/change-email";

describe("changeEmailConfirmation", () => {
  it("cite la nouvelle adresse, échappée, et porte le lien", () => {
    const html = changeEmailConfirmation(
      "https://www.newbi.fr/api/auth/verify-email?token=abc",
      "nouvelle<img src=x>@exemple.fr",
    );
    expect(html).toContain("nouvelle&lt;img src=x&gt;@exemple.fr");
    expect(html).not.toContain("<img src=x>");
    expect(html).toContain(
      'href="https://www.newbi.fr/api/auth/verify-email?token=abc"',
    );
  });
});
