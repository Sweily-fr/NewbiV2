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
    // Le SIRET est facultatif, y compris pour terminer l'onboarding : une
    // entreprise en cours d'immatriculation ou hors de France n'en a pas.
    // Quand il est fourni, il est vérifié au registre par la route ; quand il
    // manque, `onboardingStepSchema` exige au moins un nom d'entreprise.
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
    // Espace à configurer (facultatif). Par défaut, l'espace actif de la
    // session ; la route vérifie dans tous les cas que l'utilisateur en est
    // le propriétaire.
    organizationId: z
      .string()
      .regex(/^[0-9a-f]{24}$/)
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.step !== "completed") return;

    // Sans SIRET, l'espace doit au moins porter un nom d'entreprise : un
    // compte complet ne se crée jamais sans la moindre donnée d'entreprise.
    // Le format du SIRET, quand il est fourni, est déjà contrôlé par
    // `onboardingDataSchema`.
    if (!value.data?.siret && !value.data?.companyName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["data", "companyName"],
        message:
          "Le nom de votre entreprise est requis pour terminer l'inscription.",
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
