import { describe, it, expect } from "vitest";
import { onboardingStepSchema } from "@/src/lib/schemas/onboarding-step";

/**
 * Le passage à "completed" est le moment où un compte devient utilisable.
 * C'est donc là que doivent se trouver les exigences non contournables : une
 * entreprise identifiée (SIRET, ou à défaut un nom) et la déclaration d'usage
 * professionnel.
 */

const VALID_SIRET = "12345678901234";

function completedBody(overrides = {}) {
  return {
    step: "completed",
    data: { companyName: "ACME", siret: VALID_SIRET },
    honorDeclarationAccepted: true,
    ...overrides,
  };
}

describe("onboardingStepSchema — transition vers completed", () => {
  it("accepte un SIRET valide accompagné de la déclaration", () => {
    expect(onboardingStepSchema.safeParse(completedBody()).success).toBe(true);
  });

  it("accepte l'absence de SIRET quand le nom de l'entreprise est fourni", () => {
    // Entreprise en cours d'immatriculation ou hors de France : le SIRET
    // sera demandé plus tard, avant le premier document.
    expect(
      onboardingStepSchema.safeParse(
        completedBody({ data: { companyName: "ACME" } }),
      ).success,
    ).toBe(true);
    expect(
      onboardingStepSchema.safeParse(
        completedBody({ data: { companyName: "ACME", siret: "" } }),
      ).success,
    ).toBe(true);
  });

  it("refuse l'absence de SIRET sans nom d'entreprise", () => {
    const result = onboardingStepSchema.safeParse(
      completedBody({ data: { companyName: "   ", siret: "" } }),
    );

    expect(result.success).toBe(false);
    expect(
      result.error.issues.some((i) => i.path.join(".") === "data.companyName"),
    ).toBe(true);
  });

  it("refuse un SIRET mal formé", () => {
    const result = onboardingStepSchema.safeParse(
      completedBody({ data: { companyName: "ACME", siret: "1234" } }),
    );

    expect(result.success).toBe(false);
  });

  it("refuse un bloc data entièrement absent", () => {
    const result = onboardingStepSchema.safeParse({
      step: "completed",
      honorDeclarationAccepted: true,
    });

    expect(result.success).toBe(false);
  });

  it("refuse une déclaration non acceptée", () => {
    const result = onboardingStepSchema.safeParse(
      completedBody({ honorDeclarationAccepted: false }),
    );

    expect(result.success).toBe(false);
    expect(
      result.error.issues.some(
        (i) => i.path.join(".") === "honorDeclarationAccepted",
      ),
    ).toBe(true);
  });

  it("refuse une déclaration omise", () => {
    const body = completedBody();
    delete body.honorDeclarationAccepted;

    expect(onboardingStepSchema.safeParse(body).success).toBe(false);
  });
});

describe("onboardingStepSchema — étapes intermédiaires", () => {
  it("laisse le SIRET facultatif tant que l'onboarding est en cours", () => {
    // L'étape workspace enregistre des brouillons : exiger le SIRET ici
    // empêcherait de sauvegarder une saisie partielle.
    const result = onboardingStepSchema.safeParse({
      step: "workspace",
      data: { companyName: "ACME" },
    });

    expect(result.success).toBe(true);
  });

  it("n'exige pas la déclaration sur une étape intermédiaire", () => {
    const result = onboardingStepSchema.safeParse({
      step: "plan",
      data: { selectedPlan: "freelance" },
    });

    expect(result.success).toBe(true);
  });

  it("rejette toujours une clé inconnue", () => {
    const result = onboardingStepSchema.safeParse({
      step: "workspace",
      data: { companyName: "ACME" },
      isAdmin: true,
    });

    expect(result.success).toBe(false);
  });
});
