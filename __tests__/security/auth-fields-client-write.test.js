// @vitest-environment node
//
// Champs Better Auth que le navigateur ne doit ni écrire ni lire.
//
// - Essai gratuit : les champs étaient en `input: true`. Un simple
//   POST /api/auth/organization/create avec isTrialActive et une trialEndDate
//   lointaine donnait un essai sans fin. Ils ne sont posés que côté serveur
//   (org-creation.js, accès Mongo direct).
// - pendingInvitationId : renvoyé par get-session. L'inscription ne vérifie
//   pas l'e-mail : en s'inscrivant avec l'adresse d'un invité, on lisait l'id
//   de son invitation dans la session puis on l'acceptait à sa place.
import { describe, it, expect } from "vitest";
import { toZodSchema } from "better-auth/db";

process.env.STRIPE_SECRET_KEY ||= "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET ||= "whsec_dummy";
process.env.RESEND_API_KEY ||= "re_dummy";

const { organizationPlugin } = await import("@/src/lib/auth-plugins");

const TRIAL_FIELDS = [
  "trialStartDate",
  "trialEndDate",
  "isTrialActive",
  "hasUsedTrial",
  "stripeTrialActive",
];

describe("champs d'essai de l'organisation", () => {
  const fields =
    organizationPlugin.options.schema.organization.additionalFields;

  it.each(TRIAL_FIELDS)("%s n'est pas accepté du client", (name) => {
    expect(fields[name]).toBeDefined();
    expect(fields[name].input).toBe(false);
  });

  it("le schéma client de Better Auth les ignore", () => {
    const schema = toZodSchema({ fields, isClientSide: true });
    const parsed = schema.parse({
      isTrialActive: true,
      trialEndDate: "2099-12-31",
      hasUsedTrial: false,
      stripeTrialActive: true,
    });
    for (const name of TRIAL_FIELDS) {
      expect(parsed).not.toHaveProperty(name);
    }
  });
});

describe("pendingInvitationId", () => {
  it("n'est jamais renvoyé au client", async () => {
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const code = readFileSync(join(process.cwd(), "src/lib/auth.js"), "utf8");
    const block = code.match(/pendingInvitationId:\s*\{[^}]*\}/)?.[0];
    expect(block).toBeDefined();
    expect(block).toMatch(/returned:\s*false/);
  });
});
