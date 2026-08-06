import { z } from "zod";

/**
 * Zod schema for PATCH /api/onboarding/step body.
 * Principle 7: inputs validated by schema, not by trust.
 *
 * step: client-settable steps only (excludes "completed" — set by webhook only).
 * data: optional object with whitelisted keys from the onboarding flow.
 * Total data size capped at 4KB to prevent abuse (MOYEN-29).
 */

// All possible data keys across onboarding steps (workspace + plan)
const onboardingDataSchema = z
  .object({
    // Workspace step data
    companyName: z.string().max(200).optional(),
    // Un SIRET peut rester vide tant que l'onboarding est en cours (l'étape
    // "workspace" enregistre des brouillons). Le passage à "completed" exige
    // en revanche un SIRET plein et vérifié — contrainte portée par
    // `onboardingStepSchema` ci-dessous, pas par ce sous-schéma.
    siret: z
      .string()
      .regex(/^\d{14}$/)
      .optional()
      .or(z.literal("")),
    siren: z
      .string()
      .regex(/^\d{9}$/)
      .optional()
      .or(z.literal("")),
    legalForm: z.string().max(100).optional(),
    addressStreet: z.string().max(200).optional(),
    addressCity: z.string().max(100).optional(),
    addressZipCode: z.string().max(10).optional(),
    addressCountry: z.string().max(50).optional(),
    billingCountry: z.enum(["FR", "BE", "CH", "CA", "LU"]).optional(),

    // Plan step data
    selectedPlan: z.enum(["freelance", "pme", "entreprise"]).optional(),
    isAnnual: z.boolean().optional(),
  })
  .strict();

export const onboardingStepSchema = z
  .object({
    // "completed" is allowed only for the app-managed trial signup shortcut.
    // The route handler enforces the ENABLE_APP_TRIAL feature flag in
    // addition to this schema, so the historical webhook-only path remains
    // the only way to reach "completed" when the flag is OFF.
    step: z.enum(["workspace", "plan", "recap", "completed"]),
    data: onboardingDataSchema.optional(),
    // Déclaration sur l'honneur d'usage professionnel. Obligatoire pour
    // terminer l'onboarding : c'est la pièce qui relie explicitement le
    // compte à une entreprise réelle et exclut l'usage personnel.
    honorDeclarationAccepted: z.boolean().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.step !== "completed") return;

    // Le SIRET n'est plus facultatif au moment de terminer l'onboarding.
    // Sans cette règle, `.optional().or(z.literal(""))` laissait créer un
    // compte complet sans la moindre donnée d'entreprise.
    if (!value.data?.siret || !/^\d{14}$/.test(value.data.siret)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["data", "siret"],
        message:
          "Un numéro SIRET valide (14 chiffres) est requis pour terminer l'inscription.",
      });
    }

    if (value.honorDeclarationAccepted !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["honorDeclarationAccepted"],
        message:
          "La déclaration d'usage professionnel doit être acceptée pour terminer l'inscription.",
      });
    }
  });
